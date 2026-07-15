import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [search, lookup, patientService, queue, picker, checkIn, qr, events, filter, seed] = await Promise.all([
  readFile("apps/api/src/patients/services/patient-search.service.ts", "utf8"),
  readFile("apps/api/src/patients/services/patient-lookup.service.ts", "utf8"),
  readFile("apps/api/src/patients/patients.service.ts", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8"),
  readFile("apps/web/components/clinic/PatientPicker.tsx", "utf8"),
  readFile("apps/web/app/reception/check-in/page.tsx", "utf8"),
  readFile("apps/web/app/reception/qr-scan/page.tsx", "utf8"),
  readFile("apps/web/lib/clinic-data-events.ts", "utf8"),
  readFile("apps/api/src/common/filters/global-exception.filter.ts", "utf8"),
  readFile("apps/api/prisma/seed.js", "utf8")
]);

assert.doesNotMatch(search, /\.\.\.branchScope\(user\)/, "patient search must not inherit queue branch scope");
assert.match(search, /medicalRecordNumber: \{ equals: query/);
assert.match(search, /queryTokens\.length > 1/);
assert.match(search, /patientSearchScore/);
assert.match(search, /pageInfo: \{ page, limit, hasMore/);
assert.match(lookup, /findUnique\(\{ where: \{ id \}/, "permitted identity lookup supports cross-branch selection");
assert.doesNotMatch(patientService, /qrInfo[\s\S]{0,500}\.\.\.branchScope\(user\)/);

assert.match(queue, /const branchId = this\.resolveWorkingBranchId\(user\)/);
assert.doesNotMatch(queue, /patient\.branchId \?\? \(await this\.resolveBranchId/);
assert.match(queue, /WORKING_BRANCH_REQUIRED/);
assert.match(queue, /PATIENT_NOT_ACCESSIBLE/);
assert.match(queue, /QUEUE_LOCK_CONFLICT/);
assert.match(queue, /QUEUE_NUMBER_CONFLICT/);
assert.match(queue, /QUEUE_VALIDATION_ERROR/);
assert.match(queue, /queue\.stale_lock_repaired/);
assert.match(queue, /branchId_patientId_queueDate/);
assert.match(queue, /status: \{ in: \["waiting", "called", "in_room"\] \}/);
assert.match(queue, /queueResponse\(activeTicket, true\)/);
assert.match(queue, /rawKey: idempotencyKey/);

assert.match(filter, /SESSION_EXPIRED/);
assert.match(filter, /QUEUE_PERMISSION_DENIED/);
assert.match(filter, /SERVER_ERROR/);
assert.match(filter, /requestId/);
assert.match(seed, /Receptionist:\s*\[[\s\S]*?"queue\.manage"/);

assert.doesNotMatch(picker, /isDemoLikePatient/);
assert.doesNotMatch(picker, /patient\.status !== "archived"/);
assert.match(picker, /searchState === "loading"/);
assert.match(picker, /searchState === "empty"/);
assert.match(picker, /searchState === "permission"/);
assert.match(picker, /role="alert"/);
assert.match(picker, /setSelectedSnapshot\(patient\)/);
assert.match(picker, /Load more patients/);
assert.match(picker, /patientTypeLabel/);
assert.doesNotMatch(picker, /results\[0\]|patients\[0\]/);

assert.match(checkIn, /publishClinicDataChange\(\["queue", "patient", "timeline", "owner-operations"\]/);
assert.match(qr, /publishClinicDataChange\(\["queue", "patient", "timeline", "owner-operations"\]/);
assert.match(events, /BroadcastChannel/);
assert.match(events, /clinic-queue:changed/);

console.log("v1.4.9 patient search and queue recovery PASS (42 assertions)");
