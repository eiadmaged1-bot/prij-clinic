import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const apiBase = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const session = readFileSync("apps/web/app/session.tsx", "utf8");
const login = readFileSync("apps/web/app/login/page.tsx", "utf8");

const friendlyEnglish = "Connection problem. Please check that the clinic server is running, then try again.";
const friendlyArabic = "توجد مشكلة في الاتصال. تأكد أن سيرفر العيادة يعمل ثم حاول مرة أخرى.";

assert(apiBase.includes(friendlyEnglish), "English friendly connection message is missing");
assert(apiBase.includes(friendlyArabic) || session.includes("توجد مشكلة في الاتصال"), "Arabic friendly connection message is missing");
assert(session.includes("connectionProblemMessage()"), "session login should use language-aware friendly connection message");
assert(session.includes('localStorage.getItem("prijClinicLanguage") === "ar"'), "Arabic connection message should follow language switcher state");

for (const [label, source] of [
  ["api base", apiBase],
  ["session", session],
  ["login", login]
]) {
  assert(!source.includes("Cannot reach Prij API from this device"), `${label} still contains old technical API failure text`);
  assert(!source.includes("LAN API fallback is disabled"), `${label} still exposes LAN fallback text`);
  assert(!source.includes("NEXT_PUBLIC_LAN_API_ORIGIN") || label === "api base", `${label} exposes normal UI env variable text`);
  assert(!/<pre>|stack trace|schema\.prisma|JWT|CORS/i.test(source), `${label} exposes technical diagnostic text in normal UI`);
}

const forbiddenNormalUi = ["LAN API fallback", "NEXT_PUBLIC", "localhost", "ngrok", "CORS"];
for (const phrase of forbiddenNormalUi) {
  assert(!login.includes(phrase), `login normal UI must not mention ${phrase}`);
}

assert(login.includes("premium-login-card") && login.includes("premium-login-button"), "login card must remain premium/minimal");
assert(login.includes("login-language-row") && login.includes("<LoginLanguageSwitcher />"), "language switcher must remain in stable row");

console.log("V134 friendly connection UI PASS");
