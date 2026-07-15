import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [queue, patientService, patientDto, patientPage, schema, migration] = await Promise.all([
  readFile("apps/api/src/queue/queue.service.ts", "utf8"),
  readFile("apps/api/src/patients/patients.service.ts", "utf8"),
  readFile("apps/api/src/patients/dto.ts", "utf8"),
  readFile("apps/web/app/patients/new/page.tsx", "utf8"),
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260715120000_queue_in_room_and_patient_birth_year/migration.sql", "utf8")
]);

assert.match(queue, /patientId: dto\.patientId,[\s\S]{0,120}queueDate,[\s\S]{0,120}status: \{ in: \["waiting", "called", "in_room"\] \}/);
assert.match(queue, /queueResponse\(activeTicket, true\)/);
assert.match(queue, /QUEUE_NUMBER_CONFLICT/);
assert.match(queue, /const queueState = ticket\.status === "waiting" \? "WAITING"/);
assert.match(queue, /\["WAITING", "CALLED", "IN_ROOM"\]\.includes\(queueState\)/);
assert.match(queue, /activeQueueTicketLock\.create/);
assert.match(patientPage, /setCreatedPatientId\(patient\.id\)/);
assert.match(patientPage, /addCreatedPatientToQueue\(patient\.id\)/);
assert.match(patientPage, /addCreatedPatientToQueue\(createdPatientId\)/);
assert.match(patientPage, /"idempotency-key": queueIdempotencyKey/);
assert.match(patientPage, /yearOfBirth: form\.yearOfBirth \? Number\(form\.yearOfBirth\) : undefined/);
assert.match(patientService, /yearOfBirth: dto\.yearOfBirth/);
assert.match(patientDto, /yearOfBirth\?: number/);
assert.match(schema, /in_room/);
assert.match(schema, /yearOfBirth\s+Int\?/);
assert.match(migration, /ALTER TYPE "QueueTicketStatus" ADD VALUE IF NOT EXISTS 'in_room'/);
assert.match(migration, /ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "yearOfBirth" INTEGER/);

console.log("v1.4.7 authoritative patient-to-queue transaction PASS (17 assertions)");
