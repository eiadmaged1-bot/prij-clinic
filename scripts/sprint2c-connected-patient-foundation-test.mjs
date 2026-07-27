import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(path, "utf8");
const creation = read("apps/web/app/patients/new/page.tsx");
const service = read("apps/api/src/patients/patients.service.ts");
const page = read("apps/web/app/patients/[id]/page.tsx");
const identity = read("apps/web/components/clinic/PatientVisitIdentityBar.tsx");
const visit = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const migration = read("apps/api/prisma/migrations/20260727234500_sprint2c_connected_patient_foundation/migration.sql");
const pregnancyEditor = read("apps/web/app/patients/[id]/pregnancy-components.tsx");
const compatibilityRoute = read("apps/web/app/patients/[id]/[workspace]/page.tsx");
assert.ok(creation.includes('const creationEndpoint = "/patients"'));
assert.ok(!creation.includes('creationEndpoint = saveIntent === "open"'));
assert.ok(creation.includes('router.push(`/patients/${patient.id}`)'));
assert.ok(service.includes("patientCareContextTransition.create"));
assert.ok(service.includes("contextTransition"));
for (const label of ["Overview", "Current Visit", "Clinical Record", "Results & Imaging", "Treatment & Follow-up"]) assert.ok(page.includes(label));
assert.ok(page.includes("PatientDetailsDrawer"));
assert.ok(identity.includes("patient.yearOfBirth"));
assert.ok(identity.includes('return "Pregnancy / Obstetric"'));
assert.ok(visit.includes("Show all complaints"));
assert.ok(visit.includes('"Pain", "Bleeding", "Vaginal / vulval", "Urinary / pelvic floor", "Pregnancy concerns", "Breast", "Postoperative"'));
assert.ok(migration.includes('CREATE TABLE "PatientCareContextTransition"'));
assert.ok(migration.includes('CREATE TABLE "PregnancyDatingHistory"'));
for (const forbidden of [/\\bDROP\\s/i, /\\bTRUNCATE\\s/i, /^\\s*DELETE\\s/im]) assert.ok(!forbidden.test(migration));
assert.ok(pregnancyEditor.includes("PregnancyContextEditor"));
assert.ok(pregnancyEditor.includes("eddReplacementReason"));
assert.ok(pregnancyEditor.includes("active.datingHistory"));
assert.ok(compatibilityRoute.includes("legacyWorkspaceRoutes"));
assert.ok(compatibilityRoute.includes("if (!moduleKey) notFound()"));
assert.ok(compatibilityRoute.includes("?module=${encodeURIComponent(moduleKey)}"));
console.log("Sprint 2C connected patient foundation contract PASS");



