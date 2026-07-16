import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { v152GuidelineRegistryDocuments } = require("../apps/api/prisma/seeds/v152-guideline-registry");
const [center, viewer, controller, service] = await Promise.all([
  readFile("apps/web/app/guidelines/GuidelineCenter.tsx", "utf8"),
  readFile("apps/web/components/guidelines/PdfCanvasViewer.tsx", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8")
]);
assert.ok(v152GuidelineRegistryDocuments.length >= 55, "official registry must add at least 55 governed records");
assert.equal(new Set(v152GuidelineRegistryDocuments.map((row) => `${row.sourceKey}|${row.title.toLowerCase()}|${row.versionLabel}`)).size, v152GuidelineRegistryDocuments.length, "registry title/version keys must be unique");
assert.match(center, /Total documents/); assert.match(center, /Department folders/); assert.match(center, /Paginated|Showing/);
assert.match(viewer, /getDocument/); assert.match(viewer, /pdfjs-text-layer/); assert.match(viewer, /PdfThumbnail/); assert.match(viewer, /search/);
assert.match(controller, /content-range/); assert.match(controller, /status\(206\)/); assert.match(service, /metadataOnly/);
assert.doesNotMatch(center, /Â·|â€“|ØªÙƒÙŠØ³/);
console.log(`v1.5.2 guideline registry, search, PDF.js and range contracts PASS (${v152GuidelineRegistryDocuments.length} registry rows)`);
