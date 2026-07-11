import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const session = readFileSync("apps/web/app/session.tsx", "utf8");
const controller = readFileSync("apps/api/src/auth/auth.controller.ts", "utf8");
const guard = readFileSync("apps/api/src/auth/jwt-auth.guard.ts", "utf8");
const proxy = readFileSync("apps/web/app/api/backend/[...path]/route.ts", "utf8");

assert(!/(?:localStorage|sessionStorage)\.setItem\(tokenKey/.test(session), "session must not write the reusable auth token to browser storage");
assert(!session.includes("data.token"), "browser session must not consume the compatibility token response");
assert(!session.includes("authorization: `Bearer"), "browser session must not construct a Bearer credential");
assert(session.includes('credentials: "include"'), "browser auth requests must include cookies");
assert(controller.includes('response.cookie("prij_clinic_session"') && controller.includes("httpOnly: true"), "login must issue an HttpOnly session cookie");
assert(controller.includes('response.clearCookie("prij_clinic_session"'), "logout must clear the session cookie");
assert(guard.includes("cookies.prij_clinic_session"), "API guard must authenticate the session cookie");
assert(proxy.includes("appendSetCookieHeaders(upstream, responseHeaders)"), "same-origin proxy must preserve Set-Cookie");

console.log("PRODUCTION-LAUNCH-AUTH-STORAGE PASS");
