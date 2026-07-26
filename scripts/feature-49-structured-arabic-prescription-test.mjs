import assert from "node:assert/strict";
import fs from "node:fs";

const visit = fs.readFileSync("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8");
const css = fs.readFileSync("apps/web/app/globals.css", "utf8");
const medicationCenter = fs.readFileSync("apps/web/app/medications/page.tsx", "utf8");

for (const contract of [
  "prescriptionDoseOptions",
  "prescriptionFrequencyOptions",
  "prescriptionDurationOptions",
  "prescriptionInstructionOptions",
  "StructuredPrescriptionField",
  "structured-rx-workspace",
  "structured-rx-grid",
  "structured-rx-preview",
  "الجرعة",
  "عدد المرات",
  "المدة",
  "التعليمات",
  "إدخال مخصص"
]) {
  assert.match(visit, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Feature 49 must implement ${contract}`);
}

assert.match(visit, /label="Dose"[\s\S]*?label="Frequency"[\s\S]*?label="Duration"[\s\S]*?label="Instructions"/);
assert.match(visit, /dir="rtl"/);
assert.match(visit, /\[line\.dose, line\.frequency, line\.duration, line\.instructions\]\.filter\(Boolean\)\.join\(" · "\)/);
assert.match(visit, /window\.print\(\)/);

assert.match(css, /\.structured-rx-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.structured-rx-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
assert.match(css, /@media print[\s\S]*?\.structured-rx-options[\s\S]*?display:\s*none !important/);
assert.match(css, /\.rx-option\.active/);

assert.match(medicationCenter, /No auto-prescribing/);
assert.match(medicationCenter, /Doctor approval required/);

console.log("Feature 49 structured Arabic prescription PASS");
