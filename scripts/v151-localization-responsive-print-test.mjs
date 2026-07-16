import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");
const [en, ar, i18n, shell, css, dermatology, intake, services, investigations, audit, ultrasoundEditor, prescriptionPrint, investigationPrint, patientPrint] = await Promise.all([
  read("apps/web/i18n/en.ts"), read("apps/web/i18n/ar.ts"), read("apps/web/i18n/useI18n.tsx"), read("apps/web/app/mvp-page.tsx"), read("apps/web/app/globals.css"), read("apps/web/components/medications/DermatologyWorkspace.tsx"), read("apps/web/app/external-intake/page.tsx"), read("apps/web/app/admin/services/page.tsx"), read("apps/web/app/admin/investigations/page.tsx"), read("apps/web/app/admin/audit/page.tsx"), read("apps/web/app/patients/[id]/ultrasounds/[scanId]/page.tsx"), read("apps/web/app/prescriptions/[id]/print/page.tsx"), read("apps/web/app/clinical-requests/[id]/print/page.tsx"), read("apps/web/app/patients/[id]/print/packet/page.tsx")
]);

const keys = (source) => [...source.matchAll(/^\s*,?([A-Za-z][A-Za-z0-9]*):/gm)].map((match) => match[1]).sort();
assert.deepEqual(keys(en), keys(ar), "English and Arabic dictionaries must have identical keys");
for (const key of ["dermatologySearch", "assessmentFirst", "redFlagsEscalation", "importHistory", "submissionHistory", "dataHygiene", "servicesPricing", "auditLog", "previous", "next"]) { assert.match(en, new RegExp(`${key}:`)); assert.match(ar, new RegExp(`${key}:`)); }
assert.match(i18n, /document\.documentElement\.dir = direction/);
assert.match(i18n, /document\.documentElement\.lang = language/);
assert.doesNotMatch(`${en}\n${ar}\n${dermatology}\n${intake}`, /\?\?\?\?/);
assert.match(dermatology, /useI18n/); assert.match(dermatology, /dir=\{direction\}/); assert.match(dermatology, /language === "ar"/);
assert.match(intake, /t\("importHistory"\)/); assert.match(intake, /t\("dataHygiene"\)/);
for (const route of [services, investigations, audit]) assert.match(route, /useI18n/);
for (const drawer of [services, investigations]) { assert.match(drawer, /event\.key === "Escape"/); assert.match(drawer, /document\.body\.style\.overflow = "hidden"/); assert.match(drawer, /aria-modal="true"/); }
for (const viewport of ["max-width: 720px", "safe-area-inset-bottom", "100dvh", "overflow-x: clip"]) assert.match(css, new RegExp(viewport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(shell, /closeOnEscape/); assert.match(shell, /document\.body\.style\.overflow = "hidden"/); assert.match(shell, /isReceptionistOnly/);
assert.match(ultrasoundEditor, /window\.print\(\)/); assert.match(prescriptionPrint, /data-prescription-print-page/); assert.match(investigationPrint, /data-investigation-print-page/); assert.match(patientPrint, /window\.print\(\)/);
assert.match(css, /@media print/);

console.log("v1.5.1 central localization, RTL, responsive drawers, shared shell, and clinical print contracts PASS");
