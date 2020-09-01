import * as fs from "fs";
import * as os from "os";

export const writeToFileIfChanged = (filename: string, content: string) => {
  if (fs.existsSync(filename)) {
    const currentInput = fs.readFileSync(filename, 'utf-8');

    if (currentInput !== content) {
      writeFile(filename, content);
    } else {
      console.log("Same, same...");
    }
  } else {
    writeFile(filename, content);
  }
};

function writeFile(filename: string, content: string) {
  //Replace new lines with OS-specific new lines
  fs.writeFileSync(filename, content.replace(/\n/g, os.EOL), 'utf8');
}