import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [external, importService, importUi, guidelineService, guidelineController, guidelineUi, viewer, schema, migration, medicationService, pharmacologyUi] = await Promise.all([
  readFile("apps/api/src/external-intake/external-intake.service.ts", "utf8"),
  readFile("apps/api/src/patient-import/patient-import.service.ts", "utf8"),
  readFile("apps/web/app/patients/import/page.tsx", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"),
  readFile("apps/web/app/guidelines/GuidelineCenter.tsx", "utf8"),
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8"),
  readFile("apps/api/prisma/schema.prisma", "utf8"),
  readFile("apps/api/prisma/migrations/20260715190000_guideline_authoritative_page_count/migration.sql", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8")
]);

assert.match(external, /where: \{ phone: \{ in: egyptianPhoneVariants\(phone\) \} \}/);
assert.doesNotMatch(external.slice(external.indexOf("private async duplicates"), external.indexOf("private async nextExternalMrn")), /OR:|contains:/);
assert.match(importService, /phone: \{ in: egyptianPhoneVariants\(normalized\.primaryPhone\) \}/);
assert.match(importService, /decision === "UPDATE_EXISTING"/);
assert.match(importService, /status: "active"/);
assert.match(importService, /patient_import\.row_created/);
assert.doesNotMatch(importService, /queueTicket\.create|encounter\.create|prescription\.create/);
assert.match(importUi, /CONFIRM_CREATE|Confirm create/i);
assert.match(importUi, /Download failed rows/);
assert.match(guidelineService, /fileSha256: hash/);
assert.match(guidelineService, /GUIDELINE_EXACT_DUPLICATE/);
assert.match(guidelineService, /skip: \(page - 1\) \* limit/);
assert.match(guidelineController, /@Query\("page"\)/);
assert.match(guidelineUi, /Guideline inventory pagination/);
assert.match(schema, /pageCount\s+Int\?/);
assert.match(migration, /ADD COLUMN IF NOT EXISTS "pageCount" INTEGER/);
assert.match(guidelineService, /parsed\.total \?\? null/);
assert.match(viewer, /<PdfCanvasViewer/);
assert.match(viewer, /Retry PDF/);
assert.match(viewer, /Open the same authoritative PDF/);
assert.match(medicationService, /familiesBeingCompleted/);
assert.match(medicationService, /recentlyReviewed/);
for (const label of ["Browse all generics", "Browse all families", "Unlinked generics", "Recently reviewed", "Favorites", "Content being completed"]) assert.match(pharmacologyUi, new RegExp(label));
assert.doesNotMatch(pharmacologyUi, />needs_review</);

console.log("v1.4.8 import, guideline, PDF, and pharmacology contracts PASS (28 assertions)");
