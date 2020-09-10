import * as fs from "fs";
import * as p from "path";
import { filenameToTypingsFilename, generateGenericExportInterface } from "lang-core";
import * as persist from "./persist";

export function transpile(path: string, callback: (err: Error | null, evt?: { path: string, name?: string }) => void) {
  if (p.extname(path) !== ".lang") {
    console.warn("Only lang files are supported.", p.extname(path));
    return;
  }
  fs.readFile(path, 'utf8', (err, data: string) => {
    if (!err) {
      try {
        const module = JSON.parse(data);
        const typingsFileName = filenameToTypingsFilename(path);
        const change = persist.writeToFileIfChanged(typingsFileName, generateGenericExportInterface(module, path, '\t'));
        callback(null, { path, name: change });
      }
      catch (e) {
        callback(e);
      }
    } else {
      callback(err);
    }
  });
}