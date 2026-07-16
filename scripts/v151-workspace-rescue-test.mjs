import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [patientPage, editorPage, editor, css, dto, service] = await Promise.all([
  read("apps/web/app/patients/[id]/page.tsx"),
  read("apps/web/app/patients/[id]/workspace-editor/page.tsx"),
  read("apps/web/components/patients/PatientWorkspaceEditor.tsx"),
  read("apps/web/app/globals.css"),
  read("apps/api/src/patients/workspace-layout.dto.ts"),
  read("apps/api/src/patients/services/patient-workspace-layout.service.ts")
]);

assert.match(editorPage, /PatientWorkspaceEditor dedicated/);
assert.match(patientPage, /workspaceGridColumn\(placement\)/);
assert.match(editor, /workspace-editor-three-pane/);
assert.match(editor, /draggable/);
assert.match(editor, /onDrop=\{\(\) => dropOn/);
assert.match(editor, /beforeunload/);
assert.match(editor, /Duplicate to My account/);
assert.match(editor, /Move left/);
assert.match(editor, /Move right/);
assert.match(editor, /Undo/);
assert.match(editor, /Cancel changes/);
assert.match(editor, /Small · 4/);
assert.match(editor, /Half · 6/);
assert.match(editor, /Wide · 8/);
assert.match(editor, /Full · 12/);
assert.match(css, /grid-template-columns: repeat\(12/);
assert.match(css, /@media \(max-width: 720px\)/);
assert.match(dto, /@Max\(12\) column/);
for (const token of ["PATIENT:${user.id}:${patientId}", "PERSONAL:${user.id}", "SPECIALTY:${patient.patientType}", "ROLE:${role}", "CLINIC:DEFAULT"]) assert.ok(service.includes(token));

console.log("v1.5.1 dedicated modular workspace rescue contracts passed");
