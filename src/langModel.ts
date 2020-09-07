import { workspace, Uri, FileSystemWatcher, languages, DiagnosticCollection, window, DiagnosticSeverity, Position, Range, Diagnostic } from "vscode";
import * as fs from "fs";
import { OutputWindow } from './outputWindow';
import { StatusBarUi } from "./StatusbarUI";
import { transpile } from "./transpiler";
import { generateSchemaSync, isBase, getBaseFsPath, getLocalizedFsPath, SchemaDictionary, Schema, validate } from "./schema";

const LANGS = workspace.getConfiguration("liveLangCompiler").get("languages", ["en", "se"]);

export class LangModel {
  watcher: FileSystemWatcher | null;
  schemas: SchemaDictionary = {};
  problems: DiagnosticCollection;

  constructor() {
    StatusBarUi.init();
    this.watcher = null;
    this.problems = languages.createDiagnosticCollection("LANG");
  }

  startWatching() {
    if (!!this.watcher) {
      StatusBarUi.watching();
      return;
    }
    this.readSchemas();

    this.watcher = workspace.createFileSystemWatcher("**/*.lang");
    this.watcher.onDidChange(this.compile.bind(this));
    StatusBarUi.watching();
  }

  stopWatching() {
    if (!this.watcher) {
      StatusBarUi.notWatching();
      return;
    }
    this.watcher.dispose();
    this.watcher = null;
    StatusBarUi.notWatching();
  }

  readSchemas() {
    workspace.findFiles("**/*.lang")
      .then((uris: Uri[]) => {
        this.schemas = uris
          .filter((uri) => isBase(uri.fsPath))
          .reduce((schemas: SchemaDictionary, uri) => {
            const newSchema = generateSchemaSync(uri.fsPath);
            schemas[uri.fsPath] = newSchema;
            LANGS.forEach((lang) => {
              const localizedFsPath = getLocalizedFsPath(uri.fsPath, lang);
              this.validateLocalized(newSchema, localizedFsPath);
            });
            return schemas;
          }, {});
      });
  }

  validateLocalized(schema: Schema, localizedFsPath: string) {
    fs.readFile(localizedFsPath, 'utf8', (err, data: string) => {
      if (!err) {
        const res = validate(data, schema);

        if (res.length) {
          this.problems.set(Uri.file(localizedFsPath), res);
        } else {
          this.problems.delete(Uri.file(localizedFsPath));
        }
      } else {
        if (err.code === "ENOENT") {
          //this.problems.set(Uri.file(getBaseFsPath(localizedFsPath)), [new Diagnostic(new Range(new Position(1, 1), new Position(1, 1)), `Missing translation '${localizedFsPath}'.`, DiagnosticSeverity.Warning)]);
          window.showErrorMessage(`Missing translation ${localizedFsPath}`, "Create")
            .then((action) => {
              if (action === "Create") {
                fs.copyFile(getBaseFsPath(localizedFsPath), localizedFsPath, 0, console.warn);
              }
            });
        }
      }
    });
  }

  compile(uri: Uri) {
    if (isBase(uri.fsPath)) {
      const schema = this.schemas[uri.fsPath] = generateSchemaSync(uri.fsPath);
      LANGS.forEach((lang) => {
        const localizedFsPath = getLocalizedFsPath(uri.fsPath, lang);
        this.validateLocalized(schema, localizedFsPath);
      });
      transpile(uri.fsPath, (err, evt) => {
        if (err !== null) {
          OutputWindow.show("Error occurred in lang-compilation", [err.message], true);
          return;
        } else if (evt && evt.name) {
          OutputWindow.show(`${evt.name} typings ${evt.path}`, [], false);
        }
      });
    } else {
      const schema = this.schemas[getBaseFsPath(uri.fsPath)];
      if (schema) {
        this.validateLocalized(schema, uri.fsPath);
      }
    }
  }
}