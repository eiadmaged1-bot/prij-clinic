import assert from "node:assert/strict";
import fs from "node:fs";

const visit = fs.readFileSync("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8");
const css = fs.readFileSync("apps/web/app/globals.css", "utf8");

for (const contract of [
  "medication-result-grid",
  "medication-result-card compact-medication-card",
  "medication-trade-name",
  "medication-generic-name",
  "medication-core-meta",
  "medication-classification-chips",
  "medication-safety-chips",
  "Add to prescription"
]) {
  assert.match(visit, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Feature 48 must implement ${contract}`);
}

assert.match(visit, /const tradeName = result\.tradeName \?\? result\.brandName \?\? result\.genericName \?\? "Medication"/);
assert.match(visit, /const genericName = result\.genericName \?\? "Generic not recorded"/);
assert.match(visit, /\[result\.strengthText, result\.dosageForm, result\.route\]/);
assert.match(visit, /classifications\.slice\(0, 3\)/);
assert.doesNotMatch(visit, /Trade match:/);

assert.match(css, /\.medication-result-grid\s*\{[\s\S]*?max-height:\s*15rem/);
assert.match(css, /\.compact-medication-card\s*\{[\s\S]*?grid-template-areas:\s*"main action" "class action" "safety action"/);
assert.match(css, /@media \(max-width: 640px\)[\s\S]*?grid-template-areas:\s*"main" "class" "safety" "action"/);
assert.match(css, /\.compact-medication-card > \.button\s*\{[\s\S]*?min-width:\s*6\.4rem/);

console.log("Feature 48 compact medication cards PASS");
