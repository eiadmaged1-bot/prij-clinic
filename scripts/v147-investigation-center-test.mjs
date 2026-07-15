import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, css] = await Promise.all([readFile("apps/web/app/investigations/page.tsx", "utf8"), readFile("apps/web/app/globals.css", "utf8")]);
for (const tab of ["catalog", "sets", "followup", "manage"]) assert.ok(page.includes(`"${tab}"`));
for (const section of ["mobile-catalog", "mobile-sets", "mobile-manage-panel"]) assert.ok(page.includes(section));
assert.match(css, /data-mobile-active="catalog"[\s\S]*mobile-catalog/);
assert.match(css, /data-mobile-active="sets"[\s\S]*mobile-sets/);
assert.match(css, /data-mobile-active="manage"[\s\S]*article:first-child/);
assert.doesNotMatch(css, /form > :nth-child/);
assert.match(page, /function remove\(index: number\)/);
assert.match(page, /function undoRemove\(\)/);
assert.match(page, /Undo remove/);
assert.match(page, /if \(!response\.ok\) return setStatus/);
assert.match(page, /patientId, encounterId, priority/);
assert.match(page, /Management-only center/);

console.log("v1.4.7 focused responsive Investigation Center PASS (16 assertions)");
