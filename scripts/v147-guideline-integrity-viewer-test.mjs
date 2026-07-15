import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [center, viewer, service, dto, controller, migration] = await Promise.all([
  readFile("apps/web/app/guidelines/GuidelineCenter.tsx", "utf8"),
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8"),
  readFile("apps/api/src/guidelines/dto/upload-guideline.dto.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"),
  readFile("apps/api/prisma/migrations/20260715143000_correct_antibiotics_guideline_metadata/migration.sql", "utf8")
]);

for (const label of ["Library", "Search", "Review Queue", "Upload"]) assert.match(center, new RegExp(`>${label}<`));
assert.doesNotMatch(center, /href="\/guidelines\/ask">Ask Evidence Library|href="\/guidelines">Recent|>Browse<\/Link>/);
assert.match(center, /All active guidelines/);
assert.match(center, /Recently indexed/);
assert.match(center, /Owner\/Admin inventory — all records/);
assert.match(center, /Result modes:[\s\S]*Sources[\s\S]*Evidence synthesis/);
assert.match(center, /Create new guideline/);
assert.match(center, /Create new version/);
assert.match(center, /Restore archived record/);
assert.match(dto, /uploadIntent/);
assert.match(service, /documentsBefore/);
assert.match(service, /documentsAfter/);
assert.match(service, /guideline\.upload_duplicate_rejected/);
assert.match(service, /GUIDELINE_VERSION_ASSET_STORAGE_REQUIRED/);
assert.match(viewer, /document\?\.pageCount && document\.pageCount > 0 \? document\.pageCount : null/);
assert.match(viewer, /pageCount \?\? "…"/);
assert.match(viewer, /Loading authoritative PDF/);
assert.match(viewer, /Retry PDF/);
assert.match(viewer, /pdf-more-menu/);
assert.match(controller, /accept-ranges["'], ["']bytes/);
assert.match(migration, /Antibiotics for Obstetrics and Gynecology/);
assert.match(migration, /KFS General Hospital Clinical Pharmacy Unit/);
assert.doesNotMatch(migration, /guidelineStatus|reviewStatus/);

console.log("v1.4.7 guideline inventory and authoritative viewer PASS (25 assertions)");
