import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [schema, migration, dto, service, center, editor, css] = await Promise.all([
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260717073000_v152_ultrasound_comparison_source/migration.sql", "utf8"),
  readFile("apps/api/src/pregnancy/dto.ts", "utf8"),
  readFile("apps/api/src/pregnancy/pregnancy.service.ts", "utf8"),
  readFile("apps/web/app/ob-ultrasounds/page.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/ultrasounds/[scanId]/page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

assert.match(schema, /comparisonSourceScanId\s+String\?/);
assert.match(schema, /@relation\("ObUltrasoundComparisons"/);
assert.match(migration, /ON DELETE SET NULL/);
assert.match(dto, /comparisonSourceScanId\?: string/);
assert.match(service, /sourceId === currentScanId/);
assert.match(service, /status: \{ in: \["signed", "final", "amended"\] \}/);
assert.match(service, /patientId,\s*\.\.\.branchScope\(user\)/);
assert.match(service, /before: ultrasoundAuditSnapshot\(existing\)/);
assert.match(service, /after: ultrasoundAuditSnapshot\(ultrasound\)/);
assert.match(service, /existing\.status === "amended"/);
assert.match(service, /status === "needs_review" \? "complete_for_review"/);
assert.match(service, /status === "signed" \? \{ in: \["signed", "final"\] \}/);
assert.match(service, /const incomplete = candidates\.filter/);
assert.match(service, /dataClassification: \{ notIn: \["TEST", "QUARANTINED"\] \}/);
assert.match(service, /patient: \{ dataClassification: \{ notIn: \["TEST", "QUARANTINED"\] \}/);

for (const filter of ["patientType", "doctorOperator", "branch", "context", "date"]) assert.match(center, new RegExp(filter, "i"));
for (const field of ["Previous signed source scan", "Measured comparison", "High-risk links and surveillance", "NST / CTG record reference", "Maternal-vitals record reference", "Delivery-planning record reference"]) assert.match(editor, new RegExp(field));
for (const control of ["Previous image", "Next image", "Close image viewer"]) assert.match(editor, new RegExp(control));
assert.match(editor, /role="dialog" aria-modal="true"/);
assert.match(css, /\.ultrasound-lightbox/);
assert.doesNotMatch(center + editor, /Ã‚|â€¦|\?\?\?\?/);

console.log("v1.5.2 ultrasound comparison source, queue accuracy, specialty fields, amendment audit, and gallery contracts PASS");
