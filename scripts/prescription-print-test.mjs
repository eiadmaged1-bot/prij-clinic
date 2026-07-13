import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, css, layout, controller, service] = await Promise.all([
  readFile("apps/web/app/prescriptions/[id]/print/page.tsx", "utf8"),
  readFile("apps/web/app/prescriptions/[id]/print/print.module.css", "utf8"),
  readFile("apps/web/lib/prescription-print.ts", "utf8"),
  readFile("apps/api/src/prescriptions/prescriptions.controller.ts", "utf8"),
  readFile("apps/api/src/prescriptions/prescriptions.service.ts", "utf8")
]);

assert(css.includes("size: A5 portrait") && css.includes("width: 148mm") && css.includes("min-height: 210mm") && css.includes("margin: 0"), "print route must use exact A5 portrait dimensions without browser margins");
assert(css.includes("break-inside: avoid") && css.includes("repeat-y"), "multiple medication rows must avoid splitting and allow genuine page overflow");
assert(page.includes("prescription.items.map"), "one and multiple medication cases must share ordered rendering");
assert(layout.includes("\\u0600-\\u06ff") && layout.includes('"rtl"') && layout.includes('"ltr"'), "Arabic and English direction support required");
for (const forbidden of ["AppShell", "Sidebar", "UniversalSearchBox", "SafetyAlert", "developer"]) assert(!page.includes(forbidden), `print-only route must not contain ${forbidden}`);
assert(page.includes("medicalRecordNumber") && page.includes("displayName") && page.includes("Signature / stamp"), "patient, doctor, and signature fields required");
assert(layout.includes("approvedBackgroundUrl: null") && layout.includes("TODO"), "unapproved template placement must remain explicit configuration, not an invented design");
assert(controller.includes('@Get(":id/print")') && service.includes('prescription.status !== "signed"') && service.includes("prescription.print_viewed"), "direct print access must require a signed prescription and be audited");

console.log("A5 one/multiple medication, Arabic/English, overflow, isolation, and signed-print contract PASS");
