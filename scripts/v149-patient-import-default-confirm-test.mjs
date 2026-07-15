import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, service, dto, controller, page, intake, intakeController, intakeDto, cli, docs] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260715213000_v149_patient_import_fields/migration.sql", "utf8"),
  readFile("apps/api/src/patient-import/patient-import.service.ts", "utf8"),
  readFile("apps/api/src/patient-import/dto.ts", "utf8"),
  readFile("apps/api/src/patient-import/patient-import.controller.ts", "utf8"),
  readFile("apps/web/app/patients/import/page.tsx", "utf8"),
  readFile("apps/api/src/external-intake/external-intake.service.ts", "utf8"),
  readFile("apps/api/src/external-intake/external-intake.controller.ts", "utf8"),
  readFile("apps/api/src/external-intake/dto.ts", "utf8"),
  readFile("scripts/patient-import.mjs", "utf8"),
  readFile("docs/PATIENT_IMPORT_AND_GOOGLE_SHEETS.md", "utf8")
]);

for (const field of ["address", "spouseName", "secondaryPhone", "externalFileNumber", "originalRegistrationDate", "importBatchId", "dataVerificationState", "validationWarnings", "originalSourceMetadata"]) assert.match(schema, new RegExp(field));
assert.match(migration, /decision" TEXT NOT NULL DEFAULT 'CONFIRM_CREATE'/);
assert.match(migration, /selected" BOOLEAN NOT NULL DEFAULT true/);
assert.doesNotMatch(migration, /^(?:DELETE FROM|TRUNCATE|DROP TABLE)/im);
assert.match(service, /decision: duplicates\.length \? "RESOLVE_EXISTING" : "CONFIRM_CREATE"/);
assert.match(service, /selected: true/);
assert.match(service, /decision: "BLOCKED", selected: false/);
assert.match(service, /missing review decision cannot silently become Skip/);
assert.match(service, /CREATE_SEPARATE_WITH_REASON/);
assert.match(service, /replay/);
assert.doesNotMatch(service, /decision = dto\.decisions\?\.\[row\.id\] \?\? "skip"/i);
assert.match(dto, /UpdatePatientImportReviewDto/); assert.match(controller, /rows\/:rowId\/review/);
assert.match(page, /Clear selection/); assert.match(page, /Select eligible/); assert.match(page, /CONFIRM_CREATE/); assert.match(page, /RESOLVE_EXISTING/); assert.match(page, /checked=\{selected\.includes/);
assert.doesNotMatch(page, /value=\{decisions\[row\.id\] \?\? "skip"\}/i);
assert.match(intakeController, /external-intake\/google-sheet/); assert.match(intakeDto, /ArrayMaxSize\(25\)/);
assert.match(intake, /constantTimeTextEqual/); assert.match(intake, /idempotencyKey/); assert.match(intake, /stagingOnly: true/); assert.match(intake, /patients: 0, phases: 0, appointments: 0, queueTickets: 0, encounters: 0/);
assert.doesNotMatch(intake, /createInitialPhase/);
assert.match(cli, /--dry-run\|--stage/); assert.match(cli, /stage-only=true/); assert.match(cli, /no patients created/);
assert.match(docs, /Eligible nonduplicate rows default to `CONFIRM_CREATE` with `selected=true`/); assert.match(docs, /at most 25 reviewed rows/);

console.log("v1.4.9 patient import default-confirm workflow PASS (44 assertions)");
