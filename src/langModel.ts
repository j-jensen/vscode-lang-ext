import * as vscode from "vscode";
import * as fs from "fs";
import { Validator, validate, Schema } from "jsonschema";
import { OutputWindow } from './outputWindow';
import { StatusBarUi } from "./StatusbarUI";
import { transpile } from "./transpiler";
import { generateSchemaSync, isBase, getBaseFsPath, getLocalizedFsPath } from "./schema";

const languages = ["se", "en"];

interface SchemaDictionary {
  [path: string]: Schema;
}

export class LangModel {
  watcher: vscode.FileSystemWatcher | null;
  schemas: SchemaDictionary = {};

  constructor() {
    StatusBarUi.init();
    this.watcher = null;
  }

  startWatching() {
    if (!!this.watcher) {
      StatusBarUi.watching();
      return;
    }
    this.readSchemas();

    this.watcher = vscode.workspace.createFileSystemWatcher("**/*.lang");
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
    vscode.workspace.findFiles("**/*.lang")
      .then((uris: vscode.Uri[]) => {
        this.schemas = uris
          .filter((uri) => isBase(uri.fsPath))
          .reduce((schemas: SchemaDictionary, uri) => {
            const newSchema = generateSchemaSync(uri.fsPath);
            schemas[uri.fsPath] = newSchema;
            languages.forEach((lang) => {
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
        const validator = new Validator();
        const module = JSON.parse(data);
        const res = validator.validate(module, schema);
        if (res.errors.length) {
          OutputWindow.show(`Validation errors for ${localizedFsPath}`, res.errors.map(e => e.message), true);
        }
      }
    });
  }

  compile(uri: vscode.Uri) {
    if (isBase(uri.fsPath)) {
      const schema = this.schemas[uri.fsPath] = generateSchemaSync(uri.fsPath);
      languages.forEach((lang) => {
        const localizedFsPath = getLocalizedFsPath(uri.fsPath, lang);
        this.validateLocalized(schema, localizedFsPath);
      });
      transpile(uri.fsPath, (err, path) => {
        if (err !== null) {
          OutputWindow.show("Error occurred in lang-compilation", [err.message], true);
          return;
        }
        OutputWindow.show(`Compiled ${path}`, [], true);
      });
    } else {
      const schema = this.schemas[getBaseFsPath(uri.fsPath)];
      if (schema) {
        this.validateLocalized(schema, uri.fsPath);
      }
    }
  }
}