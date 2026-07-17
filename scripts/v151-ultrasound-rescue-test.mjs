import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, controller, service, center, editor, panel, documents] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.controller.ts", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.service.ts", "utf8"),
  readFile("apps/web/app/ob-ultrasounds/page.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/ultrasounds/[scanId]/page.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/panel-components.tsx", "utf8"),
  readFile("apps/api/src/patient-documents/patient-documents.service.ts", "utf8")
]);

for (const lifecycle of ["complete-for-review", "review", "sign", "amend"]) assert.match(controller, new RegExp(lifecycle));
for (const status of ["draft", "complete_for_review", "reviewed", "signed", "amended"]) assert.match(schema, new RegExp(`\\b${status}\\b`));
assert.match(service, /dataClassification: \{ notIn: \["TEST", "QUARANTINED"\] \}/);
assert.match(service, /hasMeaningfulStructuredValue/);
assert.match(service, /doctor-authored impression is required before signing/i);
assert.match(service, /assertUltrasoundHasImage/);
assert.match(service, /At least one secured ultrasound image is required before review or signing/);
for (const queue of ["Today", "Drafts", "Needs review", "Signed", "Incomplete", "Amended", "All"]) assert.match(center, new RegExp(`>${queue}<`));
assert.match(center, /resultRange/);
assert.match(center, /\/ultrasounds\/\$\{encodeURIComponent\(scan\.id\)\}/);
assert.doesNotMatch(center, /advance\(scan/);
for (const feature of ["Clinical context", "Gynecology", "Fertility", "Obstetric", "Stable lesion ID", "FIGO classification", "Individual follicle measurements", "Previous signed source scan", "Measured comparison", "High-risk links and surveillance", "Create amendment", "Print report"]) assert.match(editor, new RegExp(feature));
assert.match(schema, /comparisonSourceScanId/);
assert.match(service, /The comparison source must be a signed operational scan for this patient/);
assert.match(service, /before: ultrasoundAuditSnapshot/);
assert.match(service, /status === "needs_review" \? "complete_for_review"/);
assert.match(editor, /documents\/upload/);
assert.match(editor, /image\/jpeg,image\/png,image\/webp/);
assert.match(editor, /SecureGallery/);
assert.match(editor, /ultrasound-lightbox/);
assert.match(documents, /imageSanitizer\.sanitizeImageUpload/);
assert.match(documents, /encryptedStorage\.writeQuarantine/);
assert.match(panel, /ultrasounds\/new\?encounterId=/);
assert.doesNotMatch(center + editor, /Ã‚|â€¦|\?\?\?\?/);

console.log("v1.5.1 ultrasound center, dedicated editor, lifecycle, image safety, and specialty contracts PASS");
