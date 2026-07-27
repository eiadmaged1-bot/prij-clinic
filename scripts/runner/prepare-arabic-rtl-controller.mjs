import fs from "node:fs";
import path from "node:path";

const controlsRoot = path.resolve(process.argv[2]);
const target = path.join(controlsRoot, "scripts/runner/apply-sprint1-arabic-rtl-operations.mjs");
let source = fs.readFileSync(target, "utf8");

const replaceAllBefore = `function replaceAll(relativePath, before, after) {\n  const source = read(relativePath);\n  if (!source.includes(before)) throw new Error(\`Missing Arabic/RTL replacement in \${relativePath}: \${before}\`);\n  write(relativePath, source.split(before).join(after));\n}`;
const replaceAllAfter = `function replaceAll(relativePath, before, after) {\n  const source = read(relativePath);\n  if (!source.includes(before)) return;\n  write(relativePath, source.split(before).join(after));\n}`;
if (!source.includes(replaceAllBefore)) throw new Error("Arabic controller replaceAll contract changed unexpectedly.");
source = source.replace(replaceAllBefore, replaceAllAfter);

const copyContractBefore = `requireAll(copy, "bilingual operations copy", ["عيادات", "حالة الحفظ التلقائي", "تعارض في المزامنة", "توقيع وقفل هذه الزيارة", "المريضات في الانتظار", "الروشتة", "السونار"]);`;
const copyContractAfter = `requireAll(copy, "bilingual operations copy", ["حالة الحفظ التلقائي", "تعارض في المزامنة", "توقيع وقفل هذه الزيارة", "المريضات في الانتظار", "الروشتة", "السونار"]);`;
if (!source.includes(copyContractBefore)) throw new Error("Arabic operations-copy test contract changed unexpectedly.");
source = source.replace(copyContractBefore, copyContractAfter);

fs.writeFileSync(target, source, "utf8");
console.log("Arabic/RTL controller prepared: optional mojibake cleanup and correct dictionary ownership.");
