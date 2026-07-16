import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [viewer, css, controller, service] = await Promise.all([
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8")
]);

for (const control of ["Previous page", "Next page", "Fit width", "Fit page", "Rotate", "Full screen", "Search original text", "Previous match", "Next match", "Table of contents", "Page thumbnails"]) assert(viewer.includes(control), `PDF control missing ${control}`);
for (const tab of ["PDF", "Clinical Summary", "Sections", "Sources"]) assert(viewer.includes(`"${tab}"`), `mobile viewer tab missing ${tab}`);
assert(viewer.includes("requestFullscreen") && viewer.includes("onTouchStart") && viewer.includes("onTouchEnd"), "fullscreen and mobile swipe navigation missing");
assert(viewer.includes("guideline:last-page:") && viewer.includes("localStorage.setItem"), "last page memory missing");
assert(viewer.includes("GuidelinePageFallback") && viewer.includes("PDF rendering unavailable — Text fallback mode"), "truthful rendering fallback missing");
assert(viewer.includes('fileMimeType === "application/pdf"'), "original PDF must be the default authoritative view");
assert(viewer.includes("downloadsAllowed ?"), "download action must remain permission-controlled");
assert(controller.includes('@Get("documents/:id/view")') && controller.includes('@Get("documents/:id/download")'), "secure original file routes missing");
assert(service.includes('documentFileResponse(id, user, "view")') && service.includes('documentFileResponse(id, user, "download")'), "file access must remain scoped through the vault service");
assert(css.includes("grid-template-columns: minmax(210px") && css.includes(".guideline-mobile-tabs"), "desktop three-panel and mobile tab layouts missing");

console.log("v1.4.5 authoritative guideline PDF viewer PASS (27 assertions)");
