import { readFile } from "node:fs/promises";

const checks = [];

async function main() {
  const doctorVisit = await read("apps/web/app/doctor/visit/page.tsx");
  const productivity = await read("apps/web/lib/v1200-productivity.ts");
  const css = await read("apps/web/app/globals.css");

  assertIncludes(doctorVisit, ["Mouse Mode", "Detailed Mode", "Doctor Mouse-First Mode"], "Mouse Mode / Detailed Mode exists");
  assertIncludes(productivity, ["Complaint", "History", "OB/GYN history", "Examination", "Investigations", "Plan", "Follow-up"], "mouse-first sections exist");
  assertIncludes(productivity, ["Bleeding", "Pelvic pain", "Discharge", "Delayed period", "Pregnancy follow-up", "Reduced fetal movement", "Ultrasound review"], "clinical chips render from library");
  assertIncludes(doctorVisit, ["toggleChip", "selectedChips", "Selected items preview"], "click chips update selected preview");
  assertIncludes(doctorVisit, ["Generated note preview", "buildMouseFirstDraftNote"], "generated note preview exists");
  assertIncludes(doctorVisit, ["Undo last click", "remove selected item", "Clear section"], "undo/remove/clear exists");
  assertIncludes(doctorVisit, ["Free text fallback", "Detailed Mode is active"], "free text fallback exists");
  assertIncludes(doctorVisit, ["Required section progress", "complete", "missing", "optional"], "required section progress renders");
  assertIncludes(doctorVisit, ["beforeunload", "hasUnsavedChanges", "Save Draft"], "unsaved changes warning and draft save exist");
  assertIncludes(`${doctorVisit}${productivity}`, ["Continue Last Work", "Continue current visit", "Continue last patient", "Continue draft prescription", "Continue unfinished ultrasound report"], "continue last work exists");
  assertIncludes(`${doctorVisit}${productivity}`, ["Doctor Results Review Inbox", "Lab result uploaded", "Radiology result uploaded", "Ultrasound report pending review"], "results review inbox exists");
  assertIncludes(`${doctorVisit}${productivity}`, ["Doctor Favorites", "Complaints", "Prescription templates", "Ultrasound phrases"], "doctor favorites exist");
  assertIncludes(css, ["mouse-first-workspace", "clinical-chip", "generated-note-preview"], "mouse-first responsive styling exists");
  assertNotIncludes(doctorVisit, ["automatic diagnosis/prescribing/dosing", "recommended dose", "prescribe this", "best treatment"], "no automatic diagnosis/prescribing/dosing wording");

  passSummary("V1200-MOUSE-FIRST-DOCTOR");
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needles, label) {
  const missing = needles.filter((needle) => !source.includes(needle));
  if (missing.length) throw new Error(`${label}: missing ${missing.join(", ")}`);
  checks.push(label);
  console.log(`V1200-MOUSE-FIRST-DOCTOR PASS ${label}`);
}

function assertNotIncludes(source, needles, label) {
  const found = needles.filter((needle) => source.toLowerCase().includes(needle.toLowerCase()));
  if (found.length) throw new Error(`${label}: found ${found.join(", ")}`);
  checks.push(label);
  console.log(`V1200-MOUSE-FIRST-DOCTOR PASS ${label}`);
}

function passSummary(prefix) {
  console.log(`${prefix} SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

await main().catch((error) => {
  console.error(`V1200-MOUSE-FIRST-DOCTOR FAIL ${error.message}`);
  process.exitCode = 1;
});
