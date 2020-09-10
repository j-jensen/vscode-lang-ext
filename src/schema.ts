import * as fs from "fs";
import * as p from "path";
import { Diagnostic, DiagnosticSeverity, Range, Position } from "vscode";
import { templatePattern } from "lang-core";

interface SchemaProp {
  name: string;
  pattern: string;
  template: string;
}
export interface Schema {
  props: SchemaProp[];
}
export interface SchemaDictionary {
  [path: string]: Schema;
}

export const isBase = (fsPath: string): boolean => {
  const parts = p.basename(fsPath).split(".");
  return parts.length === 2;
};

export const getBaseFsPath = (fsPath: string): string => {
  const parts = p.basename(fsPath).split(".");
  return p.dirname(fsPath) + "\\" + [parts[0], parts[2]].join(".");
};

export const getLocalizedFsPath = (baseFsPath: string, lang: string): string => {
  const parts = p.basename(baseFsPath).split(".");
  return p.dirname(baseFsPath) + "\\" + [parts[0], lang, parts[1]].join(".");
};

export const generateSchemaSync = (fsPath: string): Schema => {
  const schema: Schema = {
    props: []
  };

  const data = fs.readFileSync(fsPath, 'utf8');
  const module = JSON.parse(data);
  schema.props = Object.keys(module).map((key) => {
    const re = new RegExp(templatePattern, "g");
    const patterns: string[] = [];
    const compPattern: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(module[key])) !== null) {
      patterns.push(`\\\${${m[1]}\\s*:\\s*${m[2]}}`);
      compPattern.push(`\${${m[1]}: ${m[2]}}`);
    }
    return {
      name: key,
      pattern: `^.*${patterns.join(".*")}.*$`,
      template: compPattern.join("  ")
    };
  });

  return schema;
};

const getRange = (content: string, phrase: string): Range => {
  const [start] = content
    .split("\n")
    .map((line, idx) => ({ line: idx, col: line.indexOf(phrase) }))
    .filter((pos) => pos.line > -1 && pos.col > -1)
    .map((pos) => new Position(pos.line, pos.col));
  return new Range(start, new Position(start.line, start.character + phrase.length));
};

export const validate = (data: string, schema: Schema): Diagnostic[] => {
  try {
    const module = JSON.parse(data);

    const missingPropsInTranslation = schema.props
      .filter((p) => !module.hasOwnProperty(p.name))
      .map((p) => {
        return new Diagnostic(new Range(new Position(0, 0), new Position(0, 0)), `Missing property '${p.name}'.`, DiagnosticSeverity.Error);
      });

    const formatErrors = Object.keys(module)
      .filter((key) => {
        const prop = schema.props.find((p) => p.name === key);
        if (prop === undefined) { return false; }
        const re = new RegExp(prop.pattern, "gm");
        return (!re.test(module[key]));
      })
      .map((key) => {
        const prop = schema.props.find((p) => p.name === key);
        return new Diagnostic(getRange(data, module[key]), `Missing template tag. String must contain: '${prop!.template}'`, DiagnosticSeverity.Warning);
      });

    const propsNotInBase = Object.keys(module)
      .filter((key) => !schema.props.some((p) => p.name === key))
      .map((key) => {
        return new Diagnostic(getRange(data, key), `Property '${key}' is not part of base lang-file.`, DiagnosticSeverity.Hint);
      });
    return [...missingPropsInTranslation, ...propsNotInBase, ...formatErrors];
  }
  catch (e) {
    return [new Diagnostic(new Range(new Position(0, 0), new Position(0, 0)), e.message, DiagnosticSeverity.Error)];
  }
};