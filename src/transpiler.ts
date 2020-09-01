import * as fs from "fs";
import * as p from "path";
import * as codeGen from "./code-gen";
import * as persist from "./persist";

export function transpile(path: string, callback: (err: Error | null, path?: string) => void) {
  if (p.extname(path) !== ".lang") {
    console.warn("Only lang files are supported.", p.extname(path));
    return;
  }
  fs.readFile(path, 'utf8', (err, data: string) => {
    if (!err) {
      try {
        const module = JSON.parse(data);
        const typingsFileName = codeGen.filenameToTypingsFilename(path);
        persist.writeToFileIfChanged(typingsFileName, codeGen.generateGenericExportInterface(module, path, '\t'));
        callback(null, path);
      }
      catch (e) {
        callback(e);
      }
    } else {
      callback(err);
    }
  });
}