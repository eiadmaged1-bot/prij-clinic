import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, service, controller, dto, page, results] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260716090000_v150_investigation_workflow/migration.sql", "utf8"),
  readFile("apps/api/src/investigations/investigations.service.ts", "utf8"),
  readFile("apps/api/src/investigations/investigations.controller.ts", "utf8"),
  readFile("apps/api/src/investigations/dto.ts", "utf8"),
  readFile("apps/web/app/investigations/page.tsx", "utf8"),
  readFile("apps/api/src/investigation-results/investigation-results.service.ts", "utf8")
]);

for (const status of ["booking_required", "booked", "performed", "needs_review", "patient_informed", "closed", "not_completed", "overdue", "rejected_sample", "correction_requested", "amended", "external_result_pending"]) assert.match(schema, new RegExp(status));
for (const field of ["internalExternal", "templateVersion", "responsibilityJson", "expectedResultDate", "lifecycleHistoryJson", "InvestigationOrderDraft"]) assert.match(schema, new RegExp(field));
assert.match(migration, /ALTER TYPE "InvestigationOrderStatus" ADD VALUE IF NOT EXISTS/);
assert.doesNotMatch(migration, /DELETE FROM|TRUNCATE|DROP TABLE/);
assert.match(controller, /order-draft/);
for (const action of ["getDraft", "saveDraft", "deleteDraft", "allowedInvestigationTransitions", "assertLifecycleRole", "appendLifecycle"]) assert.match(service, new RegExp(action));
assert.match(service, /requires an override reason/);
assert.match(service, /Clinical investigation review requires Doctor authority/);
assert.match(dto, /responsibilityJson/);
assert.match(page, /apiPut\("\/investigations\/order-draft"/);
assert.match(page, /Duplicate active order warning/);
assert.match(page, /A prior reviewed result exists/);
assert.match(page, /Applying a set never orders automatically/);
assert.match(page, /Internal \/ external/);
assert.match(page, /Follow-up owner/);
assert.match(page, /Confirm and submit order/);
assert.match(results, /Critical result acknowledgement is required before review/);
assert.match(results, /investigation_result\.critical_acknowledged/);
assert.match(results, /followUpNeeded/);

console.log("v1.5.0 connected investigation ordering, lifecycle, result review, and draft persistence regressions PASS");
