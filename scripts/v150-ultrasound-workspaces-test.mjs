import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, controller, service, explorer, builder] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260716103000_v150_ultrasound_lifecycle/migration.sql", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.controller.ts", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.service.ts", "utf8"),
  readFile("apps/web/app/ob-ultrasounds/page.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/pregnancy-components.tsx", "utf8")
]);

for (const status of ["draft", "complete_for_review", "reviewed", "signed", "amended"]) assert.match(schema, new RegExp(`\\b${status}\\b`));
assert.doesNotMatch(migration, /DELETE FROM|TRUNCATE|DROP TABLE/);
for (const route of ["complete-for-review", "review", "sign", "amend"]) assert.match(controller, new RegExp(route));
for (const contract of ["assertUltrasoundComplete", "assertUltrasoundClinician", "doctor-authored impression is required before signing", "ob_ultrasound.signed", "ob_ultrasound.amended"]) assert.match(service, new RegExp(contract, "i"));
assert.match(service, /dataClassification: \{ notIn: \["TEST", "QUARANTINED"\] \}/);
for (const filter of ["Today", "Drafts", "Needs review", "Signed", "Incomplete", "Doctor / operator", "Patient / MRN", "Completeness"]) assert.match(explorer, new RegExp(filter));
assert.match(explorer, /pageInfo\.hasMore/);
assert.doesNotMatch(explorer, /Â|\?\?\?\?/);
for (const specialty of ["Clinical context", "Gynecology / pelvic", "Fertility / follicular monitoring", "Uterus dimensions", "Endometrium thickness", "Right ovary", "Stable lesion ID", "FIGO classification", "Follicle measurements"]) assert.match(builder, new RegExp(specialty));
assert.match(builder, /crypto\.randomUUID/);
assert.match(builder, /encounterId/);
assert.match(builder, /parseUltrasoundMeasurements/);

console.log("v1.5.0 ultrasound lifecycle, explorer, and specialty structured recording regressions PASS");
