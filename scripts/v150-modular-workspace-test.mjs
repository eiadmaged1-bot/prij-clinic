import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, editor, service, css, boundary, registry] = await Promise.all([
  readFile("apps/web/app/patients/[id]/page.tsx", "utf8"),
  readFile("apps/web/components/patients/PatientWorkspaceEditor.tsx", "utf8"),
  readFile("apps/api/src/patients/services/patient-workspace-layout.service.ts", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("apps/web/components/patients/PatientPanelErrorBoundary.tsx", "utf8"),
  readFile("apps/web/components/patients/patient-workspace-registry.ts", "utf8")
]);

assert.match(page, /visibleTabs\.map/);
assert.match(page, /patient-workspace-grid/);
assert.match(page, /PatientPanelErrorBoundary panelKey=\{tab\.key\}/);
assert.match(page, /WorkspaceModuleRenderer[\s\S]*active=\{tab\}/);
assert.match(page, /visibleKeys\.has\(tab\.key\)/);
assert.match(page, /Confirmed phase:/);
assert.match(page, /Pregnancy record present · phase needs review/);
for (const span of ["span 4", "span 6", "span 8", "1 / -1"]) assert.match(css, new RegExp(span.replace("/", "\\/")));
assert.match(css, /@media \(max-width: 720px\)[\s\S]*grid-column: 1 \/ -1/);
for (const scope of ["PERSONAL", "PATIENT", "ROLE", "SPECIALTY", "CLINIC"]) assert.match(editor, new RegExp(scope));
for (const preset of ["MINIMAL_VISIT", "GENERAL_WOMENS_HEALTH", "GYNECOLOGY", "AUB_FIBROID", "PCOS_OVARIAN_MONITORING", "INFERTILITY", "ROUTINE_OBSTETRICS", "HIGH_RISK_OBSTETRICS", "POSTPARTUM", "CUSTOM"]) assert.match(service, new RegExp(preset));
assert.match(service, /validatePanels/);
assert.match(service, /Mandatory panel/);
assert.match(editor, /groupFindings/);
assert.match(editor, /Impact:/);
for (const action of ["Complete now", "Not applicable", "Patient declined", "Awaiting external result", "Snooze", "Dismiss with reason"]) assert.match(editor, new RegExp(action));
assert.match(service, /patient\.missing_information_decision/);
assert.match(service, /Mandatory safety information cannot be dismissed/);
assert.doesNotMatch(editor, /rule \{finding\.ruleVersion\}|finding\.ruleSource/);
assert.match(boundary, /Other patient panels remain available/);
for (const field of ["supportedSizes", "dataSource", "requiredPermissions", "mandatory", "refreshDependencies"]) assert.match(registry, new RegExp(field));

console.log("v1.5.0 multi-column modular patient workspace regressions PASS");
