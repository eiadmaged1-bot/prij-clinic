import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V131-LANGUAGE PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const provider = await readFile("apps/web/i18n/useI18n.tsx", "utf8");
const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const ar = await readFile("apps/web/i18n/ar.ts", "utf8");
const login = await readFile("apps/web/app/login/page.tsx", "utf8");

assert(provider.includes('document.documentElement.dir = "ltr"'), "document direction must stay ltr");
assert(!/<main[^>]+dir=\{direction\}/.test(shell), "app shell must not bind dir to language");
assert(provider.includes("textDirection"), "text direction metadata should remain available for targeted text");
pass("Arabic switch does not globally flip app layout");

for (const label of ["عيادة بريج", "تسجيل الدخول", "مريضة جديدة", "مستعجل"]) {
  assert(ar.includes(label), `Arabic label missing: ${label}`);
}
assert(!ar.includes(".\"") || ar.includes("السجل النهائي."), "Arabic punctuation should remain sentence-final");
pass("Arabic strings exist with normal punctuation");

assert(login.includes("login-language-row") && login.includes("<LoginLanguageSwitcher />"), "login language switcher missing");
assert(!login.includes("<main") || !login.includes("<main dir={"), "login must not add layout-level dir switching");
pass("login keeps a stable language switcher layout");

console.log(`V131-LANGUAGE SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
