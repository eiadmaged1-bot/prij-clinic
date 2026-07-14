import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [controller, service, proxy, viewer] = await Promise.all([
  readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8"),
  readFile("apps/web/app/api/backend/[...path]/route.ts", "utf8"),
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8")
]);

assert.match(proxy, /"range"/, "same-origin proxy must forward PDF byte ranges");
assert.match(proxy, /export const HEAD = proxy/, "same-origin proxy must support PDF HEAD requests");
assert.match(controller, /accept-ranges["'], ["']bytes/, "viewer endpoint must advertise byte ranges");
assert.match(controller, /content-range/, "viewer endpoint must return Content-Range");
assert.match(controller, /status\(206\)/, "valid range request must return partial content");
assert.match(controller, /status\(416\)/, "invalid range request must return range-not-satisfiable");
assert.match(controller, /cache-control["'], ["']private, no-store/, "private PDF responses must not be cached publicly");
assert.match(service, /guidelineSection\.aggregate/, "viewer metadata must derive page count from all extracted sections");
assert.match(service, /pageCount/, "authoritative viewer response must expose page count");
assert.match(viewer, /document\?\.pageCount/, "viewer controls must use the server page count");
assert.match(viewer, /\/view#page=/, "PDF tab and open-original action must use the authoritative view endpoint");
assert.match(viewer, /GuidelinePageFallback/, "page text fallback must remain available");

console.log("v1.4.6 authoritative guideline PDF range delivery PASS (12 assertions)");
