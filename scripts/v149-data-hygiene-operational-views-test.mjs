import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, hygiene, page, search, queue, cases, casePage, guidelines, guidelineUi, investigations, css, isolation] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260715201500_v149_data_classification/migration.sql", "utf8"),
  readFile("apps/api/src/data-hygiene/data-hygiene.service.ts", "utf8"),
  readFile("apps/web/app/admin/data-hygiene/page.tsx", "utf8"),
  readFile("apps/api/src/patients/services/patient-search.service.ts", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8"),
  readFile("apps/api/src/case-library/case-library.service.ts", "utf8"),
  readFile("apps/web/app/doctor/case-library/page.tsx", "utf8"),
  readFile("apps/web/lib/guidelines.ts", "utf8"),
  readFile("apps/web/components/guidelines/GuidelineCenterClient.tsx", "utf8"),
  readFile("apps/web/app/investigations/page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("scripts/test-database-guard.mjs", "utf8")
]);

for (const model of ["Patient", "ExternalPatientSubmission", "ObUltrasound", "Encounter", "QueueTicket"]) assert.match(schema, new RegExp(`model ${model}[\\s\\S]*?dataClassification`));
assert.match(schema, /enum DataClassification[\s\S]*REAL[\s\S]*TEST[\s\S]*NEEDS_REVIEW[\s\S]*QUARANTINED/);
assert.match(migration, /ALTER TABLE "Patient"/);
assert.doesNotMatch(migration, /DELETE FROM|DROP TABLE|TRUNCATE/i);
assert.match(hygiene, /data_classification\.changed/);
assert.match(hygiene, /Signals create review candidates only/);
assert.match(hygiene, /assertOwner/);
assert.match(hygiene, /exact_normalized_phone/);
assert.match(page, /Mark Real/); assert.match(page, /Mark Test/); assert.match(page, /Quarantine/); assert.match(page, /Export review report/);
for (const source of [search, queue, cases]) { assert.match(source, /TEST/); assert.match(source, /QUARANTINED/); }
assert.doesNotMatch(casePage, /isDemoLikeCase/);
assert.match(casePage, /Access denied/); assert.match(casePage, /Database or API unavailable/); assert.match(casePage, /Filters returned zero/);
assert.match(guidelines, /SESSION_EXPIRED/); assert.match(guidelines, /ACCESS_DENIED/); assert.match(guidelines, /NETWORK_ERROR/); assert.match(guidelines, /DATABASE_OR_API_ERROR/);
assert.match(guidelineUi, /Loading guideline inventory/); assert.match(guidelineUi, /No guideline documents are currently registered/); assert.match(guidelineUi, /Retry inventory/);
assert.doesNotMatch(investigations, /response\.ok \? response\.json\(\) : \{\}/);
assert.match(css, /data-mobile-active="catalog"/); assert.match(css, /display: none/); assert.match(css, /min-width: 0/);
assert.match(isolation, /TEST_DATABASE_URL is required/); assert.match(isolation, /TEST_DATABASE_URL equals DATABASE_URL/); assert.match(isolation, /clearly isolated test database/);

console.log("v1.4.9 data hygiene and operational views PASS (43 assertions)");
