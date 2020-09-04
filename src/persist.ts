import * as fs from "fs";

export const writeToFileIfChanged = (filename: string, content: string): string | undefined => {
  if (fs.existsSync(filename)) {
    const currentInput = fs.readFileSync(filename, 'utf-8');

    if (currentInput !== content) {
      fs.writeFileSync(filename, content, 'utf8');
      return "Updated";
    } else {
      return undefined;
    }
  } else {
    fs.writeFileSync(filename, content, 'utf8');
    return "Created";
  }
};
