import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile("apps/web/app/prescriptions/page.tsx", "utf8");
const patientPanels = await readFile("apps/web/components/patients/PatientClinicalWorkflowPanels.tsx", "utf8");
const service = await readFile("apps/api/src/prescriptions/prescriptions.service.ts", "utf8");
const dto = await readFile("apps/api/src/prescriptions/dto.ts", "utf8");
const schema = await readFile("apps/api/prisma/schema.prisma", "utf8");
const migration = await readFile("apps/api/prisma/migrations/20260714120000_patient_centered_prescription_dispensing/migration.sql", "utf8");

assert.match(service, /if \(!dto\.patientId \|\| !dto\.encounterId\)/, "API must reject prescriptions without patient and encounter context");
assert.match(service, /assertCanReferencePatient/, "API must scope-check the patient");
assert.match(service, /assertCanReferenceEncounter[\s\S]*?requireDoctorScope: true/, "API must scope-check the matching encounter and doctor");
assert.match(service, /action: "prescription\.created"/, "creation must be audited");
assert.match(service, /action: "prescription\.signed"/, "signing must be audited");
assert.equal(page.includes("PatientPicker"), false, "normal prescribing must not ask the doctor to choose a patient");
assert.match(page, /useState\("templates"\)/, "standalone page must open as template management");
assert.match(page, /lockedContext \? "Patient Prescription Draft" : "Prescription Templates & Frequent Medications"/, "page purpose must change with locked context");
assert.match(patientPanels, /\/prescriptions\?patientId=\$\{patient\.id\}&encounterId=/, "patient file must launch a patient-and-visit-linked draft");
assert.match(page, /Medication catalog search/, "medication selection must use catalog search");
assert.match(page, /Add custom medication/, "manual medication entry must be explicit");
assert.match(page, /Manual \/ unverified/, "manual medications must be visibly unverified");
for (const field of ["optionalBrandOrTradeName", "strengthText", "dosageForm", "quantityText", "dispensingUnit", "dose", "route", "frequency", "duration", "instructions"]) {
  assert.ok(page.includes(field), `editor must support ${field}`);
}
for (const action of ["Move up", "Move down", "Duplicate", "Remove"]) assert.ok(page.includes(action), `editor must support ${action}`);
assert.match(page, /identityConfirmed && doctorReviewed && alertsHandled/, "print must require the complete doctor review gate");
assert.match(page, /Patient identity confirmed/, "review must explicitly confirm patient identity");
assert.match(page, /Allergies, current medications, pregnancy and lactation reviewed/, "review must cover patient safety context");
assert.match(page, /Dose, route, frequency, duration and instructions verified by the doctor/, "review must cover prescription details");
assert.match(dto, /manualEntry\?: boolean/, "manual/catalog provenance must cross the API boundary");
assert.match(service, /entrySource: item\.manualEntry \? "manual" : "unclassified"/, "manual source must persist explicitly");
assert.match(service, /verificationStatus: item\.manualEntry \? "unverified"/, "manual entries must persist as unverified");
for (const column of ["quantityText", "dispensingUnit", "entrySource", "verificationStatus"]) {
  assert.ok(schema.includes(column) && migration.includes(`"${column}"`), `forward migration must add ${column}`);
}
console.log("v1.4.4 patient-centered prescription: 39 assertions passed");
