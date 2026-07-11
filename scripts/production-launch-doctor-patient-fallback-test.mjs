import { readFileSync } from "node:fs";

const doctorPage = file("apps/web/app/doctor/page.tsx");
const create = file("apps/web/components/patients/DoctorQuickPatientCreate.tsx");
const search = file("apps/web/components/patients/PatientSearchMobile.tsx");
const candidates = file("apps/web/components/patients/PatientDuplicateCandidates.tsx");
const actions = file("packages/shared/src/app-actions.ts");
const reception = file("apps/web/app/reception/page.tsx");

for (const label of ["Today", "Search", "New Patient", "Current Visit", "Account"]) assert(doctorPage.includes(`>${label}<`) || doctorPage.includes(`${label}</`), `mobile label ${label} exists`);
for (const label of ["Save & Start Visit", "Save Patient Only", "Create New Anyway"]) assert(create.includes(label), `${label} exists`);
assert(search.includes("/patients/duplicate-candidates"), "doctor search uses limited duplicate candidate endpoint");
assert(candidates.includes("Open Existing Patient") && candidates.includes('data-action-id="patient.openExistingCandidate"'), "existing candidate can be opened");
for (const action of ["patient.search", "patient.create", "patient.duplicateCheck", "patient.createOverrideDuplicate", "patient.saveOnly", "patient.saveAndStartVisit", "visit.startAfterPatientCreate", "patient.openExistingCandidate"]) {
  assert(actions.includes(`id: "${action}"`), `${action} action exists`);
}
assert(!create.includes("sessionStorage") && !search.includes("sessionStorage"), "fallback flow adds no browser token storage");
assert(reception.includes("/patients/new") && reception.includes("queue/check-in"), "reception patient creation and check-in remain available");
console.log("PRODUCTION-LAUNCH-DOCTOR-PATIENT-FALLBACK PASS");
function file(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
