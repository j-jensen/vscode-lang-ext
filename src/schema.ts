import * as fs from "fs";
import * as p from "path";
import { Uri, Diagnostic, DiagnosticSeverity, Range, Position } from "vscode";

interface SchemaProp { name: string; type: any }
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
    return { name: key, type: "string" } as SchemaProp;
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
    const propsNotInBase = Object.keys(module)
      .filter((key) => !schema.props.some((p) => p.name === key))
      .map((key) => {
        return new Diagnostic(getRange(data, key), `Property '${key}' is not part of base lang-file.`, DiagnosticSeverity.Hint);
      });
    return [...missingPropsInTranslation, ...propsNotInBase];
  }
  catch (e) {
    return [new Diagnostic(new Range(new Position(0, 0), new Position(0, 0)), e.message, DiagnosticSeverity.Error)];
  }
};