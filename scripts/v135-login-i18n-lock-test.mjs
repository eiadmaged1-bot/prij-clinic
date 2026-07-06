import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const login = readFileSync("apps/web/app/login/page.tsx", "utf8");
const session = readFileSync("apps/web/app/session.tsx", "utf8");
const css = readFileSync("apps/web/app/globals.css", "utf8");

const english = [
  "Welcome back",
  "Staff ID or email",
  "Password",
  "Sign in",
  "Use owner login",
  "Fill owner login",
  "Your session ended. Please sign in again.",
  "Connection problem. Please check that the clinic server is running, then try again."
];

const arabic = [
  "أهلاً بعودتك",
  "رقم الموظف أو البريد الإلكتروني",
  "كلمة المرور",
  "تسجيل الدخول",
  "استخدام دخول المالك",
  "ملء بيانات المالك",
  "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  "توجد مشكلة في الاتصال. تأكد أن سيرفر العيادة يعمل ثم حاول مرة أخرى."
];

for (const phrase of english) {
  assert(login.includes(phrase) || session.includes(phrase), `missing English login phrase: ${phrase}`);
}

for (const phrase of arabic) {
  assert(login.includes(phrase) || session.includes(phrase), `missing Arabic login phrase: ${phrase}`);
}

assert(login.includes("loginText[language]"), "login language state must select from one source of truth");
assert(login.includes("<LoginLanguageSwitcher />"), "login must use stable local language switcher");
assert(login.includes("عربي"), "Arabic toggle label must render correctly");
assert(!login.includes("Ø¹Ø±Ø¨") && !login.includes("ÙŠ"), "login page must not contain mojibake Arabic");
assert(!login.includes("html.dir") && !login.includes('document.documentElement.dir = "rtl"'), "login must not flip global layout direction");
assert(css.includes(".language-switcher button") && css.includes("min-width: 3.1rem") && css.includes("white-space: nowrap"), "language toggle spacing must be locked");
assert(css.includes(".form-error") && css.includes("font-size: 0.9rem") && css.includes("overflow-wrap: anywhere"), "login error text must stay compact and wrap");
assert(css.includes(".premium-login-card") && css.includes("overflow-wrap: anywhere"), "mobile login card must resist overflow");

console.log("V135 login i18n lock PASS");
