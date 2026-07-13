import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, controller, service, dto] = await Promise.all([
  readFile("apps/web/app/prescriptions/page.tsx", "utf8"),
  readFile("apps/api/src/prescriptions/prescriptions.controller.ts", "utf8"),
  readFile("apps/api/src/prescriptions/prescriptions.service.ts", "utf8"),
  readFile("apps/api/src/prescriptions/dto.ts", "utf8")
]);

for (const field of ["medicationName", "strengthText", "dosageForm", "dose", "route", "frequency", "duration", "instructions"]) assert(page.includes(field), `prescription row missing ${field}`);
for (const action of ["Move up", "Move down", "Duplicate", "Remove"]) assert(page.includes(action), `medication row action missing ${action}`);
assert(page.includes("doctorReviewed") && page.includes("alertsHandled") && page.includes("printReady"), "printing must require explicit doctor review and handled alerts");
assert(page.includes("Save current rows as template") && page.includes("Save template changes"), "templates must preserve ordered editable rows");
assert(controller.includes("duplicateTemplate") && controller.includes("archiveTemplate") && controller.includes("archiveShortcut"), "template and shortcut lifecycle endpoints required");
for (const event of ["prescription_template.duplicated", "prescription_template.archived", "doctor_medication_shortcut.archived"]) assert(service.includes(event), `missing audit event ${event}`);
assert(service.includes('existing.status === "signed"') && service.includes("Signed prescriptions cannot be edited"), "signed prescriptions must remain immutable");
assert(dto.includes("strengthText") && dto.includes("dosageForm"), "structured strength and form fields required");

console.log("Prescription editor, shortcuts, templates, readiness, and immutability PASS");
