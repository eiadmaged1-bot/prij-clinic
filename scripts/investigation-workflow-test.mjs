import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, controller, service, doctorPage, adminPage, migration] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/src/investigations/investigations.controller.ts", "utf8"),
  readFile("apps/api/src/investigations/investigations.service.ts", "utf8"),
  readFile("apps/web/app/investigations/page.tsx", "utf8"),
  readFile("apps/web/app/admin/investigations/page.tsx", "utf8"),
  readFile("apps/api/prisma/migrations/20260713223000_investigation_favorite_sets/migration.sql", "utf8")
]);

assert(schema.includes("model InvestigationFavoriteSet") && schema.includes("model InvestigationFavoriteSetItem"), "doctor-owned investigation set models required");
assert(migration.includes('ADD COLUMN IF NOT EXISTS "requestedFollowUpDate"') && migration.includes('REFERENCES "InvestigationCatalogItem"'), "forward-only migration must preserve catalog and orders");
for (const action of ["createFavoriteSet", "updateFavoriteSet", "duplicateFavoriteSet", "archiveFavoriteSet"]) assert(service.includes(action), `missing favorite-set action: ${action}`);
assert(service.includes("userId: user.id") && service.includes("investigation_favorite_set.archived"), "favorite sets must be owner-scoped and audited");
assert(controller.includes('@Permissions("investigations.manage_catalog")'), "catalog administration must use its dedicated permission");
assert(adminPage.includes("Deactivate") && adminPage.includes("Restore") && adminPage.includes("Synonyms"), "admin catalog must support edit/deactivate/restore/synonyms");
for (const category of ["Routine labs", "Antenatal", "High-risk pregnancy", "Infertility", "Gynecology", "Hormonal", "Infection", "Oncology", "Tumor markers", "Ultrasound", "Radiology", "Pathology", "Cervical screening", "Preoperative", "Postoperative", "Other"]) assert(doctorPage.includes(`"${category}"`), `doctor category missing: ${category}`);
assert(doctorPage.includes("Clinical indication") && doctorPage.includes("Move") && doctorPage.includes("Follow-up deadline"), "selected request basket must support indications, reordering, and follow-up");
assert(doctorPage.includes("Save as custom set") && doctorPage.includes("applySet"), "doctor reusable sets must be mouse-first");
assert(doctorPage.includes("Management-only center") && doctorPage.includes("hasPatientContext"), "standalone center must not create unscoped clinical requests");
assert(doctorPage.includes("/clinical-requests/") && doctorPage.includes("/print"), "saved requests must use the dedicated print route");

console.log("Investigation ordering, favorites, catalog RBAC, and audit contract PASS");
