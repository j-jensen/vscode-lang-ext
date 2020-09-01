import { Schema } from "jsonschema";
import * as fs from "fs";
import * as p from "path";

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
    "id": fsPath,
    "type": "object"    
  };

  const data = fs.readFileSync(fsPath, 'utf8');
  const module = JSON.parse(data);
  schema.properties = Object.keys(module).reduce((props, key) => {
    props[key] = { type: "string" } as Schema;
    return props;
  }, {} as { [key: string]: Schema });
  schema.required = Object.keys(module);

  return schema;
};