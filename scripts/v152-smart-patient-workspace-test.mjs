import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [labels, schema, migration, patientPage, editorPage, identity, missingInformation, registry, css, medications] = await Promise.all([
  readFile("apps/web/lib/patient-labels.ts", "utf8"),
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260717020000_v152_patient_type_taxonomy/migration.sql", "utf8"),
  readFile("apps/web/app/patients/[id]/page.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/workspace-editor/page.tsx", "utf8"),
  readFile("apps/web/components/patients/PatientSmartIdentityBar.tsx", "utf8"),
  readFile("apps/web/components/patients/MissingInformationCenter.tsx", "utf8"),
  readFile("apps/web/components/patients/patient-workspace-registry.ts", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("apps/web/app/medications/page.tsx", "utf8")
]);

for (const type of ["OBSTETRIC", "HIGH_RISK_OBSTETRIC", "GYNECOLOGY", "INFERTILITY", "POSTPARTUM", "PREVENTIVE_WELL_WOMAN", "OTHER"]) {
  assert.match(schema, new RegExp(`\\b${type}\\b`));
  assert.match(labels, new RegExp(`\\b${type}\\b`));
}
for (const legacy of ["OB", "PREGNANCY", "GYN", "WOMEN_HEALTH", "FERTILITY", "GENERAL"]) assert.match(labels, new RegExp(`\\b${legacy}\\b`));
assert.match(migration, /without rewriting ambiguous historical patient records/i);
assert(!/UPDATE\s+"Patient"/i.test(migration), "taxonomy migration must not silently reclassify patients");
assert.match(patientPage, /PatientSmartIdentityBar/);
assert(!/import\s*\{\s*PatientWorkspaceEditor/.test(patientPage), "patient profile must not import the inline editor");
assert.match(editorPage, /PatientWorkspaceEditor/);
assert.match(patientPage, /workspace-layout/);
for (const field of ["MRN", "Allergies", "Cycle day", "Doctor", "Branch", "workspace-editor"]) assert.match(identity, new RegExp(field));
for (const action of ["Record now", "Not applicable", "Patient declined", "Awaiting result", "Snooze", "Dismiss with reason"]) assert.match(missingInformation, new RegExp(action));
assert.match(missingInformation, /saved and audited/i);
for (const width of ["SMALL", "MEDIUM", "WIDE", "FULL"]) assert.match(registry, new RegExp(width));
for (const semanticClass of ["obstetric", "high-risk-obstetric", "gynecology", "infertility", "postpartum", "preventive-well-woman", "other"]) assert.match(css, new RegExp(`patient-type-${semanticClass}`));
assert.match(css, /grid-template-columns:\s*repeat\(12/);
assert.match(css, /@media \(max-width: 760px\)/);
assert(!/DermatologyWorkspace/.test(medications), "Drug Atlas route must not embed the parallel Dermatology workspace");
assert.match(medications, /href="\/dermatology"/);
assert(!/[ØÙ]{2}/.test(registry), "workspace registry must not contain mojibake Arabic labels");

console.log("v1.5.2 smart patient taxonomy, canonical routes and saved-layout contracts PASS");
