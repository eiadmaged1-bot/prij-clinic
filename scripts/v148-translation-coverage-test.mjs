import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const [en, ar, i18n, shell, navigation, encounters, ultrasound] = await Promise.all([
  readFile("apps/web/i18n/en.ts", "utf8"),
  readFile("apps/web/i18n/ar.ts", "utf8"),
  readFile("apps/web/i18n/useI18n.tsx", "utf8"),
  readFile("apps/web/app/mvp-page.tsx", "utf8"),
  readFile("apps/web/app/navigation-registry.ts", "utf8"),
  readFile("apps/web/app/encounters/page.tsx", "utf8"),
  readFile("apps/web/app/ob-ultrasounds/page.tsx", "utf8")
]);

const keys = (source) => [...source.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):/gm)].map((match) => match[1]).sort();
assert.deepEqual(keys(ar), keys(en), "English and Arabic dictionaries must expose identical keys");
assert.match(i18n, /localStorage\.getItem\("prijClinicLanguage"\)/);
assert.match(i18n, /localStorage\.setItem\("prijClinicLanguage", next\)/);
assert.match(i18n, /document\.documentElement\.dir = direction/);
assert.match(i18n, />عربي</);
assert.match(shell, /t\("account"\)/);
assert.match(shell, /t\("appearanceSettings"\)/);
assert.match(shell, /"Investigation Catalog": "investigationCatalog"/);
assert.match(shell, /"Medication Data": "medicationData"/);
assert.match(encounters, /useI18n/);
assert.match(encounters, /t\("encounterHistory"\)/);
assert.match(ultrasound, /useI18n/);
assert.match(ultrasound, /t\("ultrasoundWorkspace"\)/);

const affectedRoots = [
  "apps/web/i18n", "apps/web/app/reception", "apps/web/app/patients", "apps/web/app/admin",
  "apps/web/app/external-intake", "apps/web/app/guidelines", "apps/web/app/investigations",
  "apps/web/app/ob-ultrasounds", "apps/web/app/encounters", "apps/web/components/medications",
  "apps/web/components/protocol-atlas"
];
for (const file of await sourceFiles(affectedRoots)) {
  const source = await readFile(file, "utf8");
  assert.doesNotMatch(source, /[ÃÂØÙ]|�/, `Mojibake found in ${file}`);
}
assert.match(navigation, /roles: \["Owner", "Admin", "Doctor"\]/);

console.log("v1.4.8 English/Arabic translation coverage PASS (dictionary parity, persistence, RTL, navigation, mojibake)");

async function sourceFiles(roots) {
  const files = [];
  for (const root of roots) await walk(root, files);
  return files;
}
async function walk(directory, files) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target, files);
    else if (/\.tsx?$/.test(entry.name)) files.push(target);
  }
}
