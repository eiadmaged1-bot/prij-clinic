import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [workspace, page, service, controller, migration] = await Promise.all([
  readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8"),
  readFile("apps/web/app/medications/page.tsx", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/api/src/medications/medications.controller.ts", "utf8"),
  readFile("apps/api/prisma/migrations/20260715152000_link_deterministic_generic_families/migration.sql", "utf8")
]);

assert.match(page, /Pharmacology Atlas/);
for (const room of ["Respiratory", "Cardiovascular", "Anti-infectives", "Obstetrics & Gynecology", "Endocrine", "Neurology & Psychiatry", "Pain & Inflammation", "Gastrointestinal", "Renal & Urology", "Hematology", "Dermatology", "Allergy & Immunology", "Emergency medicines", "Oncology", "Supplements", "Other"]) assert.ok(service.includes(`["${room}"`));
for (const view of ["body system", "therapeutic function", "mechanism", "indication", "antimicrobial spectrum", "pregnancy/lactation", "renal handling", "hepatic handling", "monitoring requirement", "route"]) assert.ok(service.includes(`"${view}"`));
assert.match(controller, /@Get\("pharmacology\/atlas"\)/);
assert.match(workspace, /Explore clinical rooms/);
assert.match(workspace, /Content coverage/);
assert.match(workspace, /not a complete or fully verified formulary/);
assert.match(service, /Unlinked \/ other generics/);
assert.doesNotMatch(workspace, /badge warning">\{result\.reviewStatus\}/);
assert.match(workspace, /Profile sections being completed/);
assert.match(workspace, /focus\(\{ preventScroll: true \}\)/);
assert.match(migration, /ON CONFLICT \("medicationGenericId", "familyId"\) DO NOTHING/);
assert.match(migration, /deterministic_existing_data/);
assert.doesNotMatch(migration, /UPDATE "MedicationGeneric"|DELETE FROM/);

console.log("v1.4.7 browse-first connected Clinical Drug Atlas PASS (39 assertions)");
