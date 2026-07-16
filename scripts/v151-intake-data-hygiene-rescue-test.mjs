import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");
const [service, controller, dto, hashRoute, importPage, intakeService, intakeController, intakePage, hygienePage, docs, cli, en] = await Promise.all([
  read("apps/api/src/patient-import/patient-import.service.ts"),
  read("apps/api/src/patient-import/patient-import.controller.ts"),
  read("apps/api/src/patient-import/dto.ts"),
  read("apps/web/app/api/patient-import/hash/route.ts"),
  read("apps/web/app/patients/import/page.tsx"),
  read("apps/api/src/external-intake/external-intake.service.ts"),
  read("apps/api/src/external-intake/external-intake.controller.ts"),
  read("apps/web/app/external-intake/page.tsx"),
  read("apps/web/app/admin/data-hygiene/page.tsx"),
  read("docs/PATIENT_IMPORT_AND_GOOGLE_SHEETS.md"),
  read("scripts/patient-import.mjs"),
  read("apps/web/i18n/en.ts")
]);

assert.match(service, /decision: duplicates\.length \? "RESOLVE_EXISTING" : "CONFIRM_CREATE"/);
assert.match(service, /decision: "BLOCKED", selected: false/);
assert.match(service, /patientReferenceCount/);
assert.match(service, /PATIENT_HAS_DEPENDENT_RECORDS/);
assert.match(service, /patient_import\.rolled_back/);
assert.match(controller, /@Get\(\).*list/);
assert.match(controller, /:id\/rollback/);
assert.match(dto, /RollbackPatientImportDto/);
for (const guard of ["5 MB", "5,000-row", "100-column", "10,000"]) assert.match(`${hashRoute}\n${importPage}\n${service}\n${docs}`, new RegExp(guard.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(hashRoute, /XLSX signature is invalid/);
assert.match(hashRoute, /vbaProject/);
assert.match(cli, /Macro-enabled workbooks are not accepted/);
assert.match(importPage, /CONFIRM_CREATE/);
assert.match(importPage, /RESOLVE_EXISTING/);
assert.match(importPage, /رقم الهاتف/);

assert.match(intakeController, /x-prij-timestamp/);
assert.match(intakeController, /x-prij-signature/);
assert.match(intakeService, /verifyGoogleSheetSignature/);
assert.match(intakeService, /5 \* 60 \* 1000/);
assert.match(intakeService, /createHmac\("sha256"/);
assert.match(intakeService, /duplicateCandidatesJson: duplicateCandidates/);
assert.match(intakeService, /mappedPatient\.phone \?\? row\.mappedPatient\.primaryPhone/);
assert.match(intakeService, /if \(!phone\) return \[\]/);
const duplicateMethod = intakeService.slice(intakeService.indexOf("private async duplicates"), intakeService.indexOf("private async nextExternalMrn"));
assert.match(duplicateMethod, /where: \{ phone: \{ in: egyptianPhoneVariants\(phone\) \} \}/);
assert.doesNotMatch(duplicateMethod, /where:[\s\S]*?\bOR\b/);
assert.match(intakePage, /t\("intakeCenter"\)/);
assert.match(en, /intakeCenter:\s*"Intake Center"/);
for (const tab of ["google-forms", "google-sheets", "excel-csv", "manual", "import-history", "data-hygiene"]) assert.match(intakePage, new RegExp(tab));
assert.match(intakePage, /Constrained rollback/);
assert.match(hygienePage, /Merge unavailable/);
assert.match(docs, /PropertiesService\.getScriptProperties/);
assert.match(docs, /exact normalized-phone match/);

console.log("v1.5.1 intake, exact-phone staging, constrained rollback, and Data Hygiene contracts PASS");
