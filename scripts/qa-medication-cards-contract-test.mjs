import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [visit, css] = await Promise.all([
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const contract of [
  "medication-result-grid",
  "medication-result-card compact-medication-card",
  "medication-trade-name",
  "medication-generic-name",
  "medication-core-meta",
  "medication-classification-chips",
  "medication-safety-chips",
  "Add to prescription"
]) assert.match(visit, new RegExp(contract));

assert.match(visit, /const tradeName = result\.tradeName \?\? result\.brandName \?\? result\.genericName \?\? "Medication"/);
assert.match(visit, /const genericName = result\.genericName \?\? "Generic not recorded"/);
assert.match(visit, /\[result\.strengthText, result\.dosageForm, result\.route\]/);
assert.doesNotMatch(visit, /Trade match:/);

for (const contract of [
  ".medication-result-grid",
  ".compact-medication-card",
  ".medication-trade-name",
  ".medication-generic-name",
  ".medication-core-meta",
  ".medication-classification-chips",
  ".medication-safety-chips"
]) assert.match(css, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.match(css, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*18rem\),\s*1fr\)\)/);
assert.match(css, /max-height:\s*15rem/);

console.log("Compact medication card contract PASS");