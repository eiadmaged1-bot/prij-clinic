import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V131-PREMIUM PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const root = await readFile("apps/web/app/page.tsx", "utf8");
const dashboard = await readFile("apps/web/app/dashboard/page.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");
const normalUi = `${root}\n${dashboard}\n${await readFile("apps/web/app/mvp-page.tsx", "utf8")}`;

assert(root.includes("premium-root-card") && root.includes("Staff login"), "landing page must be a minimal premium entry");
assert(!root.includes("module-grid") && !root.includes("Workflow modules"), "landing page must not show module showcase");
assert(!/Premium V0\.1|clinic demo|Demo\/local only|No real patient data|Not production-ready|AI disabled/.test(root), "landing page contains removed wording");
pass("landing page is premium minimal");

assert(css.includes(".metric-card") && css.includes("min-height: 104px") && css.includes("repeat(4"), "compact card CSS missing");
assert(!dashboard.includes("Local demo summary") && !dashboard.includes("Local Demo"), "dashboard still contains local demo wording");
assert(!normalUi.includes("No real patient data") && !normalUi.includes("Demo/local only"), "normal UI still contains removed visible wording");
pass("dashboard and normal UI copy are compact and clean");

assert(!css.includes("rotate(-") && !css.includes("skew("), "grey diagonal overlay style should not be introduced");
pass("no broken diagonal overlay styling introduced");

console.log(`V131-PREMIUM SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
