import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V131-LANGUAGE PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const provider = await readFile("apps/web/i18n/useI18n.tsx", "utf8");
const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const ar = await readFile("apps/web/i18n/ar.ts", "utf8");
const login = await readFile("apps/web/app/login/page.tsx", "utf8");

assert(provider.includes('direction: "ltr" | "rtl"') && provider.includes('language === "ar" ? "rtl" : "ltr"'), "Arabic must select true RTL direction");
assert(provider.includes("document.documentElement.dir = direction"), "document direction must follow the selected language");
assert(provider.includes("textDirection"), "text direction metadata should remain available for mixed clinical text");
pass("Arabic switch applies full document RTL");

for (const label of ["تسجيل الدخول", "مريضة جديدة", "قائمة الانتظار", "مستعجل"]) {
  assert(ar.includes(label), `Arabic label missing: ${label}`);
}
assert(!/[ØÙÃ]|\uFFFD/.test(ar), "Arabic dictionary must not contain mojibake or replacement characters");
assert(!ar.includes(".\"") || ar.includes("السجل النهائي."), "Arabic punctuation should remain sentence-final");
pass("Arabic strings exist with normal punctuation");

assert(login.includes("login-language-row") && login.includes("<LoginLanguageSwitcher />"), "login language switcher missing");
assert(!login.includes("<main") || !login.includes("<main dir={"), "login inherits document direction without a conflicting local direction");
pass("login keeps a stable language switcher within document RTL");

console.log(`V131-LANGUAGE SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
