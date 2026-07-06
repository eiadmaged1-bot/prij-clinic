import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const session = readFileSync("apps/web/app/session.tsx", "utf8");
const login = readFileSync("apps/web/app/login/page.tsx", "utf8");
const apiBase = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const css = readFileSync("apps/web/app/globals.css", "utf8");

for (const authPath of ["/auth/login", "/auth/me", "/auth/logout"]) {
  assert(session.includes(`\`${"${sameOriginApiProxyPath}"}${authPath}\``), `browser auth call must use same-origin ${authPath}`);
}

assert(apiBase.includes('sameOriginApiProxyPath = "/api/backend"'), "same-origin proxy base must remain /api/backend");
assert(!/localhost:3001\/auth\/(login|me|logout)/.test(session), "browser auth calls must not target localhost:3001");
assert(!/:3001\/auth\/(login|me|logout)/.test(session), "browser auth calls must not target public API port 3001");
assert(!/getApiBaseUrl\(\)\/auth\/(login|me|logout)/.test(session), "auth calls must not use configurable browser API origins");

const forbiddenNormalUi = ["LAN API fallback", "NEXT_PUBLIC", "localhost", "ngrok", "CORS", "PRIJ_API_INTERNAL_ORIGIN"];
for (const phrase of forbiddenNormalUi) {
  assert(!login.includes(phrase), `normal login UI must not mention ${phrase}`);
}

assert(login.includes("loginText[language]"), "login language switch must translate text from one source");
assert(login.includes("dir={textDirection}"), "Arabic/English switch must affect text direction only where needed");
assert(!login.includes("document.documentElement.dir") && !login.includes("html.dir"), "Arabic/English switch must not flip the global layout");
assert(css.includes(".login-language-row") && css.includes("justify-content: space-between"), "language row must stay stable");
assert(css.includes(".premium-login-card") && css.includes("overflow-wrap: anywhere"), "mobile login card must stay clean and resilient");

console.log("V136 public proxy login paths PASS");
