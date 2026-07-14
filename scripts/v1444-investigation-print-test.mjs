import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, css, controller, service, dto, patientPanel] = await Promise.all([
  readFile("apps/web/app/clinical-requests/[id]/print/page.tsx", "utf8"),
  readFile("apps/web/app/clinical-requests/[id]/print/print.module.css", "utf8"),
  readFile("apps/api/src/investigations/investigations.controller.ts", "utf8"),
  readFile("apps/api/src/investigations/investigations.service.ts", "utf8"),
  readFile("apps/api/src/investigations/dto.ts", "utf8"),
  readFile("apps/web/components/patients/PatientClinicalWorkflowPanels.tsx", "utf8")
]);

assert(css.includes("size: A4 portrait"), "investigation request print must be A4 portrait");
assert(css.includes("break-inside: avoid"), "long and multiple investigations need controlled page breaks");
assert(css.includes(".toolbar { display: none !important; }"), "screen print control must be hidden on paper");
for (const forbidden of ["AppShell", "PatientPicker", "categoryTabs", "favoriteSets"]) assert(!page.includes(forbidden), `print route must not include app control: ${forbidden}`);
for (const required of ["patient", "medicalRecordNumber", "doctor", "Clinical indication", "Reference", "signature / stamp"]) assert(page.includes(required), `print content missing: ${required}`);
assert(page.includes("direction(") && page.includes("\\u0600-\\u06ff"), "Arabic and mixed-direction print must select direction safely");
assert(controller.includes('@Get(":id/print")') && service.includes("clinical_request.print_viewed"), "print reads must be scoped and audited");
assert(dto.includes("encounterId!: string"), "clinical requests must require an encounter");
assert(patientPanel.includes("/investigations?patientId=") && patientPanel.includes("encounterId="), "patient workspace must launch with locked patient and encounter context");

console.log("Patient-linked investigation and dedicated print contract PASS (16 assertions)");
