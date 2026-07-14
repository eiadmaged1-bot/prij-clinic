import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const path of ["scripts/guidelines-reindex.mjs", "scripts/guidelines-check-updates.mjs", "scripts/guidelines-import-open.mjs"]) {
  const source = await readFile(path, "utf8");
  assert.doesNotMatch(source, /GUIDELINE_IMPORT_(?:LOGIN|PASSWORD)\s*\|\|\s*["']/, `${path} must not contain credential defaults`);
  assert.match(source, /GUIDELINE_IMPORT_LOGIN and GUIDELINE_IMPORT_PASSWORD are required/, `${path} must fail closed without credentials`);
}

console.log("v1.4.6 guideline maintenance credential safety PASS (6 assertions)");
