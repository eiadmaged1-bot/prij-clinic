import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile("apps/api/prisma/migrations/20260727223000_sprint2b_queue_encounter_link/migration.sql", "utf8");
const schema = await readFile("apps/api/prisma/schema.prisma", "utf8");
const visit = await readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8");
const encounters = await readFile("apps/api/src/encounters/encounters.service.ts", "utf8");
const doctor = await readFile("apps/web/app/doctor/page.tsx", "utf8");
const reception = await readFile("apps/web/app/reception/check-in/page.tsx", "utf8");

assert.match(schema, /queueTicketId\s+String\?\s+@unique/);
assert.match(schema, /visitType\s+VisitType\?/);
assert.doesNotMatch(migration, /^\s*(DROP|DELETE FROM|TRUNCATE|UPDATE\s)/im);
assert.match(migration, /ON DELETE SET NULL/);
assert.match(visit, /dto\.queueTicketId/);
assert.match(visit, /status: "in_room"/);
assert.match(visit, /queueTicketId: ticket\?\.id/);
assert.match(encounters, /signed\.queueTicketId/);
assert.doesNotMatch(encounters, /findFirst\(\{ where: \{ patientId: signed\.patientId, branchId: signed\.branchId, status: "in_room"/);
assert.match(doctor, /ticket\.status === "in_room"/);
assert.match(doctor, /queueTicketId=\{ticket\.id\}>Start/);
assert.match(doctor, /queueTicketId=\{current\.id\}>Resume active visit/);
assert.match(reception, /regenerateIdempotencyKey\(\)/);
assert.match(reception, /setSelectedPatient\(null\)/);
console.log("Sprint 2B operations foundation: 14 assertions passed");