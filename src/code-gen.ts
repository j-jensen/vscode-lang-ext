import * as path from "path";

interface JsonObject {
  [key: string]: string;
}

export const templatePattern = /\${(\w+)(?:\s*)\:(?:\s*)(\w+)}/g.source;
const typedescRe = /(\${\w+)(:\w+)(})/g;

const filenameToInterfaceName = (filename: string): string => path.basename(filename)
  .replace(/^(\w)/, (_, c) => 'I' + c.toUpperCase())
  .replace(/\W+(\w)/g, (_, c) => c.toUpperCase());

const getPropertyTypesignature = (str: string): string => {
  const re = new RegExp(templatePattern, "g");
  let m = re.exec(str);
  const args = [];
  if (m !== null) {
    while (m !== null) {
      args.push([m[1], m[2] || 'any']);
      m = re.exec(str);
    }
    return `(${args.map(arg => `${arg[0]}: ${arg[1]}`).join(', ')}) => string`;
  }
  return 'string';
};

const getPropertyStringifiedValue = (str: string, orig: string): string => {
  const re = new RegExp(templatePattern, "g");
  let m = re.exec(orig);
  const args = [];
  if (m !== null) {
    while (m !== null) {
      args.push(m[1]);
      m = re.exec(orig);
    }
    // Outputs ES5 compliant code
    return `function(${args.map(arg => `${arg}`).join(', ')}){ return ${JSON.stringify(str.replace(typedescRe, '$1$3'))}${args.map(arg => `.replace("$\{${arg}}", ${arg})`).join('')}; }`;
    // ES6
    // return `(${args.map(arg => `${arg}`).join(', ')}) => \`${str.replace(typedescRe, '$1$3')}\``;
  }
  return JSON.stringify(str);
};

const langModuleToTypescriptInterfaceProperties = (mod: JsonObject, indent = '  '): string => Object.keys(mod)
  .map(key => `${indent}${key}: ${getPropertyTypesignature(mod[key])};`)
  .join('\n');

export const compileExport = (module: JsonObject, ref: JsonObject): string => {
  const orig = ref || module;
  const codelines = Object.keys(module).map(key => `  ${key}: ${getPropertyStringifiedValue(module[key], orig[key])}`);
  return `module.exports = {
${codelines.join(',\n')}
};`;
};

export const filenameToTypingsFilename = (filename: string): string => {
  const dirName = path.dirname(filename);
  const baseName = path.basename(filename);
  return path.join(dirName, `${baseName}.d.ts`);
};
export const filenameToLocalizedFilename = (filename: string, lang: string): string => {
  const parsedPath = path.parse(filename);
  return path.join(parsedPath.dir, parsedPath.name + '.' + lang + parsedPath.ext);
};
export const generateGenericExportInterface = (module: JsonObject, filename: string, indent: string): string => {
  const interfaceName = filenameToInterfaceName(filename);
  const interfaceProperties = langModuleToTypescriptInterfaceProperties(module, indent);
  return (
    `export interface ${interfaceName} {
${interfaceProperties}
}
declare const translator: ${interfaceName};
export default translator;
`);
};
