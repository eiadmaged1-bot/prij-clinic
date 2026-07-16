import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, route, viewer, pdf, proxy, controller, service, protocolPage, protocolBrowser] = await Promise.all([
  read("apps/web/app/guidelines/GuidelineCenter.tsx"),
  read("apps/web/app/guidelines/page.tsx"),
  read("apps/web/app/guidelines/[id]/page.tsx"),
  read("apps/web/components/guidelines/PdfCanvasViewer.tsx"),
  read("apps/web/app/api/backend/[...path]/route.ts"),
  read("apps/api/src/guidelines/guidelines.controller.ts"),
  read("apps/api/src/guidelines/guidelines.service.ts"),
  read("apps/web/app/protocol-atlas/[id]/page.tsx"),
  read("apps/web/components/protocol-atlas/ProtocolAtlasBrowser.tsx")
]);

assert.match(route, /GuidelineCenter view="home"/);
assert.match(home, /Knowledge Center metrics/);
assert.match(home, /Department folders/);
assert.match(home, /All documents/);
assert.match(home, /Showing/);
assert.match(pdf, /import\("pdfjs-dist"\)/);
assert.match(pdf, /GlobalWorkerOptions\.workerSrc/);
assert.match(pdf, /<canvas/);
assert.match(pdf, /pdfjs-text-layer/);
assert.match(pdf, /PdfThumbnail/);
assert.match(viewer, /PDF rendering unavailable — Text fallback mode/);
assert.match(viewer, /reliableHeading/);
assert.doesNotMatch(viewer, /Page \{section\.pageStart \?\? "—"\}/);
for (const tab of ["Overview", "PDF", "Clinical Summary", "Related Protocols", "Notes", "Version History"]) assert.ok(viewer.includes(`"${tab}"`));
assert.match(proxy, /"range"/);
assert.match(controller, /accept-ranges/);
assert.match(controller, /content-range/);
assert.match(service, /fileSha256: hash/);
assert.match(service, /guideline\.upload_duplicate_rejected/);
assert.match(service, /sanitizeRetrievedEvidence/);
assert.match(protocolBrowser, /Open protocol/);
assert.match(protocolPage, /Completion questionnaire/);
assert.match(protocolPage, /Save draft questionnaire/);
assert.match(protocolPage, /cannot diagnose, prescribe, order, or change a patient record/);

console.log("v1.5.1 live knowledge, PDF, and protocol route contracts passed");
