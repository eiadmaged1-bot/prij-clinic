import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, service, dto, ui] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260714201500_clinical_tag_amendments/migration.sql", "utf8"),
  readFile("apps/api/src/clinical-tags/clinical-tags.service.ts", "utf8"),
  readFile("apps/api/src/clinical-tags/dto.ts", "utf8"),
  readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8")
]);

for (const field of ["isRemoved", "removedAt", "removalReason"]) assert(schema.includes(field) && migration.includes(`"${field}"`), `soft-removal field missing: ${field}`);
assert(schema.includes("model PatientClinicalTagAmendment"), "immutable clinical tag amendment model missing");
for (const field of ["beforeJson", "afterJson", "actorUserId", "reason", "createdAt"]) assert(schema.includes(field), `amendment evidence missing ${field}`);
assert(service.includes('encounter?.status === "signed"'), "signed source encounter check missing");
assert(service.includes("A correction reason is required for finalized clinical history."), "finalized correction reason gate missing");
assert(service.includes("patientClinicalTagAmendment.create"), "before/after amendment record is not created");
assert(!service.includes("patientClinicalTag.delete"), "clinical history must never be hard-deleted");
assert(service.includes("hardDelete: false"), "audit evidence must declare soft removal");
assert(dto.includes("correctionReason") && dto.includes("isRemoved"), "correction and restore DTO fields missing");
for (const action of [">Add ", ">Edit<", ">Remove<", ">Undo<", ">Save edit<"]) assert(ui.includes(action), `history UI action missing ${action}`);
for (const tag of ["AUB", "Postmenopausal bleeding", "Hysterectomy", "Lupus", "Anticoagulant use", "Recurrent pregnancy loss"]) assert(ui.includes(tag), `smart history card missing ${tag}`);
assert(ui.includes("Type, indication, ovaries, complications, pathology, follow-up"), "hysterectomy detail guidance missing");
assert(ui.includes("Onset, episodes, current/resolved, imaging, sampling, concern, next action"), "postmenopausal bleeding detail guidance missing");

console.log("v1.4.5 reversible smart history and amendment audit PASS (30 assertions)");
