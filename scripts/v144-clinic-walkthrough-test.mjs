import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const walkthrough = read("apps/web/app/clinic-day/walkthrough/page.tsx");
const dashboard = read("apps/web/app/dashboard/page.tsx");
const admin = read("apps/web/app/admin/page.tsx");
const receptionToday = read("apps/web/app/reception/today/page.tsx");
const doctor = read("apps/web/app/doctor/page.tsx");
const newPatient = read("apps/web/app/patients/new/page.tsx");
const checkIn = read("apps/web/app/reception/check-in/page.tsx");
const doctorWaiting = read("apps/web/app/clinic-operations-page.tsx");
const patientProfile = read("apps/web/app/patients/[id]/page.tsx");
const doctorVisit = read("apps/web/app/doctor/visit/page.tsx");
const prescriptions = read("apps/web/app/prescriptions/page.tsx");
const investigations = read("apps/web/app/investigations/page.tsx");
const patientPicker = read("apps/web/components/clinic/PatientPicker.tsx");
const autosave = read("apps/web/lib/autosave-draft.ts");

assert(packageJson.scripts["test:v144:clinic-walkthrough"] === "node scripts/v144-clinic-walkthrough-test.mjs", "v0.14.4 walkthrough test script is registered");
assert(walkthrough.includes("Run clinic day demo") && walkthrough.includes("Local demo") && walkthrough.includes("Doctor review") && walkthrough.includes("AI draft-only"), "walkthrough route has compact local safety badges");
for (const label of ["Reception", "Patient creation", "Check-in", "Doctor waiting", "Patient profile", "Doctor visit", "Prescription draft", "Investigation request", "Follow-up", "Print packet"]) {
  assert(walkthrough.includes(label), `walkthrough includes ${label}`);
}
assert(dashboard.includes("/clinic-day/walkthrough") && admin.includes("/clinic-day/walkthrough") && receptionToday.includes("/clinic-day/walkthrough") && doctor.includes("/clinic-day/walkthrough"), "walkthrough launchers are present on dashboard, owner control, reception, and doctor workspace");
assert(!newPatient.includes(">Sex<") && !newPatient.includes("Patient type") && newPatient.includes("sex: \"female\"") && newPatient.includes("patientType: \"WOMEN_HEALTH\""), "new patient hides sex and patient type while keeping safe OB/GYN defaults");
assert(newPatient.includes("router.push(`/patients/${patient.id}`)") && newPatient.includes("Save and open patient file"), "new patient save opens patient profile");
assert(checkIn.includes("<PatientPicker") && checkIn.includes("check-in-wizard") && checkIn.includes("Walk-in / no appointment") && !checkIn.includes("<select value={selectedPatient"), "check-in uses compact PatientPicker walk-in wizard");
assert(!/Patient ID/i.test(checkIn.replace("patientId: selectedPatient.id", "")), "check-in page does not expose Patient ID as the primary UI field");
assert(doctorWaiting.includes("current-in-room-patient-compact") && doctorWaiting.includes("Open file") && doctorWaiting.includes("Continue visit") && doctorWaiting.includes("Complete"), "doctor waiting exposes compact current patient and expected actions");
for (const label of ["Appointment", "Check In", "Prescription", "Clinical Request", "Report", "Ultrasound", "Invoice", "Payment", "Consent"]) {
  assert(patientProfile.includes(label), `patient profile action drawer includes ${label}`);
}
assert(patientProfile.includes("SelectedPatientSummary") && patientProfile.includes("selected-patient-card"), "patient profile action drawers show selected patient context");
assert(patientProfile.includes("follow-up-hints") && patientProfile.includes("Print packet") && fs.existsSync(path.join(root, "apps/web/app/patients/[id]/print/packet/page.tsx")), "follow-up and print packet path are discoverable");
assert(doctorVisit.includes("complaintCards") && doctorVisit.includes("autosaveLabel") && doctorVisit.includes("Save Draft") && doctorVisit.includes("Previous") && doctorVisit.includes("Next"), "doctor visit has complaint cards, autosave, draft save, and step navigation");
assert(doctorVisit.includes("does not diagnose automatically") && doctorVisit.includes("No automatic prescribing") && doctorVisit.includes("Signed records stay protected"), "doctor visit keeps diagnosis, prescribing, and signed-record safety wording");
assert(prescriptions.includes("<PatientPicker") && prescriptions.includes("UniversalSearchBox") && prescriptions.includes("Save draft") && prescriptions.includes("doctor must manually review") && !/auto.?dose|auto.?prescrib/i.test(prescriptions), "prescription draft workflow uses PatientPicker and avoids auto-dose wording");
assert(patientPicker.includes("data-patient-picker") && patientPicker.includes("role=\"listbox\""), "shared PatientPicker remains compact and searchable");
assert(autosave.includes("saveLocalDraft") && autosave.includes("enqueueOfflineOperation"), "autosave and local queue utilities exist for draft workflows");
assert(investigations.includes("<PatientPicker") && investigations.includes("data-selected-request-chips") && investigations.includes("request-chip") && investigations.includes("Attach to patient"), "investigation request workflow uses PatientPicker and compact selected chips");
assert(!/Patient ID/i.test(investigations), "investigations page does not expose Patient ID as a primary field");
assert(walkthrough.includes("No real patient data") && walkthrough.includes("No real patient data, external AI calls") && walkthrough.includes("AI and Care Assist remain draft-only"), "walkthrough keeps no-real-data and AI draft-only safety wording");

console.log(`v0.14.4 clinic walkthrough checks passed (${checks.length})`);
