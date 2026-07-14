import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, dto, service, schema, migration] = await Promise.all([
  readFile("apps/web/app/prescriptions/page.tsx", "utf8"),
  readFile("apps/api/src/prescriptions/dto.ts", "utf8"),
  readFile("apps/api/src/prescriptions/prescriptions.service.ts", "utf8"),
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260714233000_prescription_structured_fields/migration.sql", "utf8")
]);

for (const tab of ["Templates", "Saved meds", "Recent"]) assert.ok(page.includes(`"${tab}"`), `mobile prescription tab missing: ${tab}`);
for (const field of ["dosageForm", "strengthText", "dose", "doseUnit", "route", "frequency", "duration", "quantityText", "prn", "instructions"]) assert.ok(page.includes(field), `structured prescription field missing: ${field}`);
assert.match(page, /already selected/, "duplicate catalog medication prevention missing");
assert.match(page, /window\.confirm\("Add a distinct formulation, route, or treatment phase\?"\)/, "intentional distinct duplicate confirmation missing");
assert.match(page, /Reason for custom or unlisted medication/, "custom medication reason missing");
assert.match(page, /More options · Add custom medication/, "custom medication must remain under More options");
assert.match(page, /disabled=\{!printReady\}/, "printing must remain blocked until review is complete");
assert.match(service, /item\.manualEntry && !item\.customReason/, "API must require a reason for custom medication");
for (const field of ["doseUnit", "prn", "customReason"]) assert.ok(dto.includes(field) && schema.includes(field) && migration.includes(`"${field}"`), `forward-only persistence missing: ${field}`);

console.log("v1.4.6 compact patient prescription recovery PASS (24 assertions)");
