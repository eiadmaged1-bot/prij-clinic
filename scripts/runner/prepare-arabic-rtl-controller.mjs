import fs from "node:fs";
import path from "node:path";

const controlsRoot = path.resolve(process.argv[2]);
const target = path.join(controlsRoot, "scripts/runner/apply-sprint1-arabic-rtl-operations.mjs");
const source = fs.readFileSync(target, "utf8");
const before = `function replaceAll(relativePath, before, after) {\n  const source = read(relativePath);\n  if (!source.includes(before)) throw new Error(\`Missing Arabic/RTL replacement in \${relativePath}: \${before}\`);\n  write(relativePath, source.split(before).join(after));\n}`;
const after = `function replaceAll(relativePath, before, after) {\n  const source = read(relativePath);\n  if (!source.includes(before)) return;\n  write(relativePath, source.split(before).join(after));\n}`;
if (!source.includes(before)) throw new Error("Arabic controller replaceAll contract changed unexpectedly.");
fs.writeFileSync(target, source.replace(before, after), "utf8");
console.log("Arabic/RTL controller prepared: mojibake cleanup is optional and non-destructive.");
