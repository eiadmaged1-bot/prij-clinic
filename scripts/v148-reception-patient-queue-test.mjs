import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [search, controller, picker, checkIn, qr, directory, newPatient, patientService, queue] = await Promise.all([
  readFile("apps/api/src/patients/services/patient-search.service.ts", "utf8"),
  readFile("apps/api/src/patients/patients.controller.ts", "utf8"),
  readFile("apps/web/components/clinic/PatientPicker.tsx", "utf8"),
  readFile("apps/web/app/reception/check-in/page.tsx", "utf8"),
  readFile("apps/web/app/reception/qr-scan/page.tsx", "utf8"),
  readFile("apps/web/app/patients/page.tsx", "utf8"),
  readFile("apps/web/app/patients/new/page.tsx", "utf8"),
  readFile("apps/api/src/patients/patients.service.ts", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8")
]);

assert.match(search, /firstName: \{ contains: query/);
assert.match(search, /lastName: \{ contains: query/);
assert.match(search, /medicalRecordNumber: \{ equals: query/);
assert.match(search, /phone: \{ contains: normalizedPhone/);
assert.match(search, /pageInfo: \{ page, limit, hasMore/);
assert.match(controller, /@Query\("branchId"\)/);
assert.match(controller, /@Query\("patientType"\)/);
assert.match(picker, />Select<\/button>/);
assert.match(picker, /setSelectedSnapshot\(patient\)/);
assert.match(picker, /Load more patients/);
assert.doesNotMatch(picker, /Include archived/);
assert.doesNotMatch(picker, /setExpanded\(false\)/);
assert.doesNotMatch(checkIn, /must be restored before Check-in/);
assert.doesNotMatch(qr, /patient\.status !== "archived"/);
assert.match(checkIn, /"idempotency-key": idempotencyKey/);
assert.match(checkIn, /patientId: selectedPatient\.id/);
assert.match(directory, /mode: "directory"/);
assert.match(directory, /Patient directory pagination/);
assert.match(directory, /Last visit \(recent first\)/);
assert.match(directory, /All permitted branches/);
assert.match(patientService, /status: "active"/);
assert.match(newPatient, /addCreatedPatientToQueue\(createdPatientId\)/);
assert.doesNotMatch(newPatient, /response\.status === 409\) return \{ kind: "already"/);
assert.match(queue, /status: \{ in: \["waiting", "called", "in_room"\] \}/);
assert.match(queue, /queueResponse\(activeTicket, true\)/);

console.log("v1.4.8 Reception patient selection and queue workflow PASS (25 assertions)");
