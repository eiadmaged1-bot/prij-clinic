import fs from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';

export function loadTypeScript(relativePath) {
  const filename = path.resolve(relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const loaded = new Module(filename); loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename)); loaded._compile(output, filename);
  return loaded.exports;
}
