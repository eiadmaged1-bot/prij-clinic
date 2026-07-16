import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [service, page, search, reports, dashboard, guard] = await Promise.all([
  readFile("apps/api/src/data-hygiene/data-hygiene.service.ts", "utf8"),
  readFile("apps/web/app/admin/data-hygiene/page.tsx", "utf8"),
  readFile("apps/api/src/search/search.service.ts", "utf8"),
  readFile("apps/api/src/reports/reports.service.ts", "utf8"),
  readFile("apps/api/src/dashboard/dashboard.service.ts", "utf8"),
  readFile("scripts/test-database-guard.mjs", "utf8")
]);

for (const signal of ["Demo Route", "Demo Workflow", "Demo Clinical", "Test Intake Only", "configured_automated_actor_candidate", "clinically_empty_ultrasound_candidate", "test_external_submission_candidate", "orphan_or_inactive_queue_lock"]) assert.match(service, new RegExp(signal));
assert.match(service, /Signals create review candidates only/);
assert.match(service, /assertOwner/);
assert.match(service, /beforeClassification/);
assert.match(service, /afterClassification/);
assert.doesNotMatch(service, /DELETE FROM|deleteMany|TRUNCATE/);
for (const action of ["Mark Real", "Restore", "Mark Test", "Mark Needs Review", "Quarantine"]) assert.match(page, new RegExp(action));
for (const view of ["external-intake", "empty-ultrasounds", "orphan-locks"]) assert.match(page, new RegExp(view));
for (const source of [search, reports, dashboard]) {
  assert.match(source, /operationalPatientRelation/);
  assert.match(source, /TEST/);
  assert.match(source, /QUARANTINED/);
}
assert.match(guard, /TEST_DATABASE_URL is required/);
assert.match(guard, /TEST_DATABASE_URL equals DATABASE_URL/);
assert.match(guard, /clearly isolated test database/);

console.log("v1.5.0 audited data hygiene and test isolation regressions PASS");
