import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const patientPage = read("apps/web/app/patients/[id]/page.tsx");
const terminal = read("apps/web/components/medications/MedicationSafetyTerminal.tsx");
const careAssistPanel = read("apps/web/components/care-assist/CareAssistPanel.tsx");
const decisionControls = read("apps/web/components/care-assist/CareAssistDecisionControls.tsx");
const doctorVisitController = read("apps/api/src/doctor-visit/doctor-visit.controller.ts");
const doctorVisitService = read("apps/api/src/doctor-visit/doctor-visit.service.ts");
const appModule = read("apps/api/src/app.module.ts");

assertIncludes(patientPage, "DoctorVisitFlow", "patient workspace includes the guided doctor visit flow");
assertIncludes(patientPage, "Start Visit", "patient workspace has a Start Visit action");
assertIncludes(patientPage, "History", "workflow includes History");
assertIncludes(patientPage, "Care Assist", "workflow includes Care Assist");
assertIncludes(patientPage, "Encounter Draft", "workflow includes Encounter draft");
assertIncludes(patientPage, "Prescription Draft", "workflow includes Prescription draft");
assertIncludes(patientPage, "Investigations", "workflow includes Investigations");
assertIncludes(patientPage, "Follow-up", "workflow includes Follow-up");
assertIncludes(patientPage, "Print Packet", "workflow includes Print Packet");
assertIncludes(patientPage, "genericName", "prescription flow keeps generic name visible");
assertIncludes(patientPage, "MedicationSafetyTerminal", "prescription flow shows side terminal");
assertIncludes(patientPage, "onMouseEnter", "medication search updates terminal on hover");
assertIncludes(patientPage, "onFocus", "medication search updates terminal on keyboard focus");
assertIncludes(patientPage, "Dose, frequency, and duration are not auto-filled.", "dose/frequency/duration are not auto-filled by default");
assertIncludes(patientPage, "Show clinical considerations", "clinical note button exists");
assertIncludes(patientPage, "Show medication options for review", "medication options note button exists");
assertIncludes(patientPage, "Show dosing note from saved template", "dosing note button exists");
assertIncludes(patientPage, "Insert selected note into draft", "explicit note insertion button exists");
assertIncludes(patientPage, "Doctor review required", "clinical notes are labeled for doctor review");
assertIncludes(careAssistPanel, "Run Care Assist Check", "Care Assist can run inside visit");
assertIncludes(decisionControls, "ACCEPT", "Care Assist accept decision exists");
assertIncludes(decisionControls, "DISMISS", "Care Assist dismiss decision exists");
assertIncludes(decisionControls, "SNOOZE", "Care Assist snooze decision exists");
assertIncludes(decisionControls, "RESOLVE", "Care Assist resolve decision exists");
assertIncludes(doctorVisitController, "doctor-visit", "doctor visit backend route exists");
assertIncludes(doctorVisitService, "doctor_visit.started", "visit start audit exists");
assertIncludes(doctorVisitService, "doctor_visit.packet_generated", "packet generation audit exists");
assertIncludes(doctorVisitService, "patientTask.create", "follow-up uses patient task model");
assertIncludes(appModule, "DoctorVisitModule", "doctor visit module is registered");
assertIncludes(terminal, "Last checked", "terminal shows last checked freshness");
assertIncludes(terminal, "Review required", "terminal shows review required state");
assertIncludes(terminal, "safe in pregnancy", "NEGATIVE_CHECK_PLACEHOLDER", true);

console.log("v0.12.4 doctor visit flow static workflow checks passed.");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assertIncludes(source, needle, message, expectMissing = false) {
  const found = source.includes(needle);
  if (expectMissing ? found : !found) {
    throw new Error(`${message}: ${expectMissing ? "unexpectedly found" : "missing"} ${needle}`);
  }
}
