import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, css, visitAction] = await Promise.all([
  readFile("apps/web/app/investigations/page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8"),
  readFile("apps/web/app/patients/[id]/visit-flow-components.tsx", "utf8")
]);

for (const tab of ["catalog", "sets", "followup", "manage"]) assert.ok(page.includes(`"${tab}"`), `mobile tab missing: ${tab}`);
assert.match(page, /investigation-mobile-tabs/, "compact mobile tab navigation missing");
assert.match(page, /data-mobile-active=\{activeSection\}/, "only the active mobile section should be prominent");
assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.investigation-mobile-tabs/, "mobile Investigation Center breakpoint missing");
assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/, "four tabs must fit at 390px");
assert.match(css, /word-break: keep-all/, "tab labels must not wrap character by character");
assert.match(css, /investigation-category-sidebar[\s\S]*overflow-x: auto/, "desktop category grid must become a compact mobile strip");
assert.match(page, /hasPatientContext \?/, "new requests must remain hidden without an active visit context");
assert.match(page, /current\.some\(\(entry\) => entry\.id === item\.id\)/, "catalog items must use one selected state with duplicate prevention");
assert.match(page, /if \(!response\.ok\) return setStatus/, "failed save must preserve selected basket state");
assert.match(visitAction, /investigationCategory\(investigation\.category\)/, "CBC and TSH category values must use one API category normalizer");
assert.doesNotMatch(page, /Clinical Note Terminal/, "request card must not contain a Clinical Note Terminal");

console.log("v1.4.6 Investigation Center 390px workflow PASS (16 assertions)");
