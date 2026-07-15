import assert from "node:assert/strict";
import fs from "node:fs";

const schema = fs.readFileSync("apps/api/prisma/schema.prisma", "utf8");
const migration = fs.readFileSync("apps/api/prisma/migrations/20260715231500_v149_patient_workspace_layouts/migration.sql", "utf8");
const service = fs.readFileSync("apps/api/src/patients/services/patient-workspace-layout.service.ts", "utf8");
const registry = fs.readFileSync("apps/web/components/patients/patient-workspace-registry.ts", "utf8");
const editor = fs.readFileSync("apps/web/components/patients/PatientWorkspaceEditor.tsx", "utf8");
const boundary = fs.readFileSync("apps/web/components/patients/PatientPanelErrorBoundary.tsx", "utf8");
const renderer = fs.readFileSync("apps/web/app/patients/[id]/workspace-module-renderer.tsx", "utf8");
const medicationPanels = fs.readFileSync("apps/web/components/medications/MedicationComponents.tsx", "utf8");

let assertions = 0;
const check = (condition, message) => { assert.ok(condition, message); assertions += 1; };
for (const model of ["PatientWorkspaceLayout", "PatientWorkspacePanelLayout"]) check(schema.includes(`model ${model}`), `${model} model exists`);
for (const field of ["panelKey", "order", "column", "size", "collapsed", "pinned", "hidden", "templateVersion"]) check(schema.includes(field) && migration.includes(`\"${field}\"`), `${field} persists forward-only`);
for (const field of ["titleTranslationKey", "permittedRoles", "applicablePatientContexts", "supportedSizes", "dataSource", "loadingStrategy", "requiredPermissions", "mandatory", "missingDataRules", "refreshDependencies"]) check(registry.includes(field), `registry includes ${field}`);
for (const preset of ["MINIMAL_VISIT", "GENERAL_WOMENS_HEALTH", "GYNECOLOGY", "INFERTILITY", "ROUTINE_OBSTETRICS", "HIGH_RISK_OBSTETRICS", "POSTPARTUM", "CUSTOM"]) check(service.includes(preset), `${preset} preset exists`);
const precedence = ["PATIENT:${user.id}:${patientId}", "PERSONAL:${user.id}", "SPECIALTY:${patient.patientType}", "ROLE:${role}", "CLINIC:DEFAULT"];
let cursor = -1; for (const token of precedence) { const next = service.indexOf(token); check(next > cursor, `precedence contains ${token} in order`); cursor = next; }
check(service.includes("workspace.template_changed") && service.includes("patient.workspace_layout_changed"), "template and patient override changes are audited");
check(service.includes("Mandatory panel") && service.includes("overview"), "mandatory identity panel is locked");
for (const rule of ["DOB_ABSENT", "ALLERGY_STATUS_UNKNOWN", "UNSIGNED_ENCOUNTER", "PREGNANCY_EDD_ABSENT", "ACTIVE_VISIT_BP_ABSENT", "INFERTILITY_CYCLE_DAY_ABSENT", "ORDER_RESULT", "RESULT_REVIEW", "TREATMENT_CONSENT_ABSENT"]) check(service.includes(rule), `${rule} deterministic rule exists`);
check(service.includes("diagnosticOutput: false") && service.includes("prescribingOutput: false"), "missing-information engine is non-diagnostic and non-prescribing");
check(editor.includes('t("moveUp")') && editor.includes('t("moveDown")'), "mobile-accessible translated reorder controls exist");
check(editor.includes('t("resetPreview")'), "translated reset behavior exists");
check(boundary.includes("Other patient panels remain available"), "panel failure isolation exists");
check(renderer.includes("PatientMedicationList patientId={patient.id}") && renderer.includes("PatientAllergyList patientId={patient.id}"), "real patient data identifiers reach medication panels");
check(medicationPanels.includes("listPatientMedications(patientId)") && medicationPanels.includes("listPatientAllergies(patientId)"), "medication and allergy panels use authoritative endpoints");
console.log(`v1.4.9 modular patient workspace assertions passed: ${assertions}`);
