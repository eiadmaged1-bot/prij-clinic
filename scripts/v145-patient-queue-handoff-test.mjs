import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [patientPage, queueService, queueController, queueDate, audit] = await Promise.all([
  readFile(new URL("../apps/web/app/patients/new/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/api/src/queue/queue.service.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/api/src/queue/queue.controller.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/api/src/queue/queue-date.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/api/src/audit/audit.service.ts", import.meta.url), "utf8")
]);

assert.equal((patientPage.match(/useIdempotencyKey\(\)/g) ?? []).length, 2);
assert.match(patientPage, /"idempotency-key": patientIdempotencyKey/);
assert.match(patientPage, /"idempotency-key": queueIdempotencyKey/);
assert.match(patientPage, /async function retryQueue/);
assert.match(patientPage, /addCreatedPatientToQueue\(createdPatientId\)/);
assert.match(patientPage, /Patient created\. Queue addition failed/);
assert.match(patientPage, /retry without recreating the patient/);
assert.match(patientPage, /patientAlreadyQueued/);
assert.match(patientPage, /queuePermissionDenied/);
assert.match(patientPage, /queueUnavailable/);
assert.match(patientPage, /clinic-queue:changed/);
assert.match(patientPage, /patientId, visitType, priority/);
assert.match(patientPage, /checkInMethod: "New Patient"/);
assert.match(patientPage, /تم إنشاء ملف المريضة/);

assert.match(queueController, /@Headers\("idempotency-key"\)/);
assert.match(queueService, /beginOrReplay/);
assert.match(queueService, /operation: "queue\.checkIn"/);
assert.match(queueService, /branchId,\s*patientId: dto\.patientId,\s*queueDate/s);
assert.match(queueService, /return \{ \.\.\.activeTicket, alreadyQueued: true \}/);
assert.match(queueService, /activeQueueTicketLock\.create/);
assert.match(queueService, /P2002/);
assert.match(queueService, /action: "queue\.checked_in"/);
assert.match(queueService, /this\.clinicTime\.getClinicDate/);
assert.match(queueDate, /Date\.UTC/);
assert.match(audit, /SENSITIVE_KEY_PATTERN/);

console.log("v1.4.5 patient creation and queue handoff: 25 assertions passed");
