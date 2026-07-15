import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [service, picker, checkIn, doctor, newPatient] = await Promise.all([
  readFile("apps/api/src/patients/services/patient-search.service.ts", "utf8"),
  readFile("apps/web/components/clinic/PatientPicker.tsx", "utf8"),
  readFile("apps/web/app/reception/check-in/page.tsx", "utf8"),
  readFile("apps/web/components/patients/PatientSearchMobile.tsx", "utf8"),
  readFile("apps/web/app/patients/new/page.tsx", "utf8")
]);

assert.match(service, /firstName: \{ contains: query/);
assert.match(service, /lastName: \{ contains: query/);
assert.match(service, /medicalRecordNumber: \{ equals: query/);
assert.match(service, /patientSearchScore/);
assert.match(service, /includeArchived/);
assert.match(service, /pageInfo: \{ page, limit, hasMore/);
assert.match(service, /yearOfBirth|\.\.\.row/);
assert.match(picker, /export function PatientSearchResult/);
assert.match(picker, />Select<\/button>/);
assert.match(picker, /Include archived/);
assert.match(picker, /Load more patients/);
assert.match(picker, /sessionStorage\.setItem\(`prij:\$\{storageKey\}:query`/);
assert.match(picker, /prior results were kept/);
assert.doesNotMatch(picker, /results\[0\]|patients\[0\]/);
assert.match(checkIn, /onPatientSelect=\{selectPatient\}/);
assert.match(checkIn, /prij:check-in:selected-patient/);
assert.match(checkIn, /This patient must be restored before Check-in/);
assert.match(doctor, /PatientPicker/);
assert.match(newPatient, /PatientSearchResult/);
assert.match(newPatient, /\/patients\?q=/);

console.log("v1.4.7 shared patient search and persistent selection PASS (20 assertions)");
