import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const root = process.cwd();
const nativeRequire = createRequire(import.meta.url);

function loadTypeScriptModule(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    },
    fileName: relativePath
  }).outputText;
  const module = { exports: {} };
  Function("module", "exports", "require", output)(module, module.exports, nativeRequire);
  return module.exports;
}

const dating = loadTypeScriptModule("packages/shared/src/pregnancy-dating.ts");
const editor = fs.readFileSync(path.join(root, "apps/web/components/clinic/ActiveVisitWorkspace.tsx"), "utf8");
const sharedIndex = fs.readFileSync(path.join(root, "packages/shared/src/index.ts"), "utf8");

assert.equal(typeof dating.calculateEddCandidate, "function", "shared dating helper must expose calculateEddCandidate");
assert.equal(typeof dating.confirmEddCandidate, "function", "shared dating helper must expose confirmEddCandidate");
assert.equal(typeof dating.isPregnancyMenstrualUiSuppressed, "function", "shared helper must expose pregnancy menstrual-context guard");

assert.deepEqual(
  dating.calculateEddCandidate({ mode: "calculated", source: "LMP", lmpDate: "2026-01-01" }),
  {
    mode: "calculated",
    source: "LMP",
    sourceDate: "2026-01-01",
    edd: "2026-10-08",
    formula: "LMP+280d"
  },
  "LMP candidate must use 280-day date-only arithmetic"
);

assert.deepEqual(
  dating.calculateEddCandidate({ mode: "calculated", source: "KNOWN_CONCEPTION", conceptionDate: "2026-01-01" }),
  {
    mode: "calculated",
    source: "KNOWN_CONCEPTION",
    sourceDate: "2026-01-01",
    edd: "2026-09-24",
    formula: "CONCEPTION+266d"
  },
  "known-conception candidate must use 266-day date-only arithmetic"
);

assert.equal(
  dating.calculateEddCandidate({ mode: "calculated", source: "IVF_ET", transferDate: "2026-01-01", embryoAgeDays: 5 }).edd,
  "2026-09-19",
  "day-5 embryo transfer must calculate transfer date +261 days"
);
assert.equal(
  dating.calculateEddCandidate({ mode: "calculated", source: "IVF_ET", transferDate: "2026-01-01", embryoAgeDays: 3 }).edd,
  "2026-09-21",
  "day-3 embryo transfer must calculate transfer date +263 days"
);
assert.equal(
  dating.calculateEddCandidate({ mode: "calculated", source: "ULTRASOUND", scanDate: "2026-01-01", gestationalWeeks: 8, gestationalDays: 0 }).edd,
  "2026-08-13",
  "ultrasound candidate must calculate from scan date plus remaining gestational days"
);
assert.equal(
  dating.calculateEddCandidate({ mode: "calculated", source: "ULTRASOUND", scanDate: "2026-01-01", ultrasoundEdd: "2026-08-15" }).edd,
  "2026-08-15",
  "explicit ultrasound EDD must be accepted without free-text inference"
);
assert.equal(
  dating.calculateEddCandidate({ mode: "manual", source: "MANUAL", manualEdd: "2026-10-10", sourceDate: "2026-01-02" }).edd,
  "2026-10-10",
  "manual mode must preserve the clinician-entered EDD"
);
assert.throws(
  () => dating.calculateEddCandidate({ mode: "calculated", source: "ULTRASOUND", scanDate: "2026-01-01" }),
  /ultrasound/i,
  "ultrasound mode must require either explicit scan EDD or complete scan date plus gestational age"
);

assert.equal(dating.isPregnancyMenstrualUiSuppressed("pregnancy"), true);
assert.equal(dating.isPregnancyMenstrualUiSuppressed("gynecology"), false);

const initial = dating.confirmEddCandidate({
  candidate: dating.calculateEddCandidate({ mode: "calculated", source: "LMP", lmpDate: "2026-01-01" }),
  clinician: "Dr Test",
  confirmationDate: "2026-01-02"
});
assert.equal(initial.edd, "2026-10-08");
assert.deepEqual(initial.datingHistory, []);

const replacementCandidate = dating.calculateEddCandidate({ mode: "manual", source: "MANUAL", manualEdd: "2026-10-10", sourceDate: "2026-01-03" });
assert.throws(
  () => dating.confirmEddCandidate({ candidate: replacementCandidate, current: initial, clinician: "Dr Test", confirmationDate: "2026-01-03" }),
  /replace|confirm/i,
  "a different confirmed EDD must not be silently overwritten"
);
assert.throws(
  () => dating.confirmEddCandidate({ candidate: replacementCandidate, current: initial, clinician: "Dr Test", confirmationDate: "2026-01-03", replaceConfirmed: true }),
  /reason/i,
  "a confirmed EDD replacement must require a correction reason"
);
const replaced = dating.confirmEddCandidate({
  candidate: replacementCandidate,
  current: initial,
  clinician: "Dr Test",
  confirmationDate: "2026-01-03",
  replaceConfirmed: true,
  correctionReason: "Reviewed source discrepancy"
});
assert.equal(replaced.edd, "2026-10-10");
assert.equal(replaced.datingHistory.length, 1);
assert.equal(replaced.datingHistory[0].edd, "2026-10-08");
assert.equal(replaced.datingCorrectionReason, "Reviewed source discrepancy");

for (const contract of [
  "pregnancyBleedingStatus",
  "pregnancyBleedingOnsetDate",
  "Pre-pregnancy menstrual baseline",
  "EDD mode",
  "Calculation preview",
  "Confirm authoritative EDD",
  "datingHistory",
  "isPregnancyMenstrualUiSuppressed"
]) {
  assert.match(editor, new RegExp(contract), `Active Visit must implement ${contract}`);
}
assert.match(sharedIndex, /pregnancy-dating/, "shared package index must export pregnancy dating helpers");
assert.match(editor, /Calculation preview[\s\S]*clinician confirmation required/i, "calculated EDD must remain a clinician-reviewed preview");
assert.match(editor, /Pre-pregnancy menstrual baseline[\s\S]*preserved/i, "pregnancy UI must retain historical menstrual baseline without treating it as an active cycle");

console.log("Pregnancy context separation and EDD provenance contract PASS");
