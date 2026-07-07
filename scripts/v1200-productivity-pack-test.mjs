import { readFile } from "node:fs/promises";

const checks = [];

async function main() {
  const doctor = await read("apps/web/app/doctor/page.tsx");
  const doctorVisit = await read("apps/web/app/doctor/visit/page.tsx");
  const patientFile = await read("apps/web/app/patients/[id]/page.tsx");
  const productivity = await read("apps/web/lib/v1200-productivity.ts");
  const autosave = await read("apps/web/lib/autosave-draft.ts");

  assertIncludes(`${autosave}${doctorVisit}`, ["useAutosaveDraft", "doctor_visit_draft", "beforeunload", "syncQueue"], "auto-save source exists");
  assertIncludes(doctorVisit, ["beforeunload", "Save Draft", "Leave"], "unsaved changes warning exists");
  assertIncludes(`${doctorVisit}${productivity}`, ["Continue Last Work", "Continue last patient", "Continue draft prescription"], "continue last work exists");
  assertIncludes(`${doctorVisit}${productivity}`, ["Doctor Results Review Inbox", "External document needs review", "Investigation requested but result missing"], "results review inbox exists");
  assertIncludes(`${doctorVisit}${productivity}`, ["Doctor Favorites", "Exam phrases", "Follow-up intervals"], "doctor favorites exist");
  assertNotIncludes(`${doctor}${productivity}`, ["Open Day Checklist", "Confirm doctors", "Check backup status", "Close Day Checklist", "Backup done"], "open/close day checklist removed from real UI");
  assertNotIncludes(productivity, ["Patient waiting 20+ minutes", "Patient waiting 40+ minutes", "waitingTimeAlert"], "waiting time alert logic removed from real UI");
  assertNotIncludes(doctor, ["Queue ticket / QR card print", "Print queue ticket", "Queue ticket QR", "patient sticker / file label / investigation request label"], "temporary queue ticket QR removed");
  assertIncludes(patientFile, ["Patient QR", "PatientQrModal", "patientQrSvgDataUri"], "permanent patient QR remains available");
  assertIncludes(`${patientFile}${productivity}`, ["Important patient banner", "Allergy", "High-risk pregnancy", "Pending result"], "important patient banner exists");
  assertNotIncludes(`${doctor}${productivity}`, ["Guided staff help", "How to add new patient", "How to scan QR", "How to print packet"], "guided help removed from real UI");
  assertNotIncludes(`${doctor}${productivity}`, ["Copyable message templates", "Appointment reminder", "Investigation result ready", "Copy text only"], "copyable message templates removed from real UI");
  assertIncludes(patientFile, ["lazy-feed-list", "slice(0, 16)", "smart-empty-state"], "performance polish source exists");
  assertIncludes(patientFile, ["roles:", "permissions:", "Role-based access applies"], "RBAC result remains source-backed");
  assertIncludes(`${doctor}${doctorVisit}${patientFile}`, ["AI draft", "draft-only", "doctor review"], "AI safety result remains draft-only");
  assertNotIncludes(`${doctor}${doctorVisit}${patientFile}`, ["DICOM", "PACS", "real payment gateway", "automatic patient communication"], "excluded integrations remain absent");

  passSummary("V1200-PRODUCTIVITY-PACK");
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needles, label) {
  const missing = needles.filter((needle) => !source.includes(needle));
  if (missing.length) throw new Error(`${label}: missing ${missing.join(", ")}`);
  checks.push(label);
  console.log(`V1200-PRODUCTIVITY-PACK PASS ${label}`);
}

function assertNotIncludes(source, needles, label) {
  const found = needles.filter((needle) => source.toLowerCase().includes(needle.toLowerCase()));
  if (found.length) throw new Error(`${label}: found ${found.join(", ")}`);
  checks.push(label);
  console.log(`V1200-PRODUCTIVITY-PACK PASS ${label}`);
}

function passSummary(prefix) {
  console.log(`${prefix} SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

await main().catch((error) => {
  console.error(`V1200-PRODUCTIVITY-PACK FAIL ${error.message}`);
  process.exitCode = 1;
});
