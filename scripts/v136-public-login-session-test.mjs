import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const session = readFileSync("apps/web/app/session.tsx", "utf8");
const login = readFileSync("apps/web/app/login/page.tsx", "utf8");
const route = readFileSync("apps/web/app/api/backend/[...path]/route.ts", "utf8");

assert(route.includes("export const GET = proxy"), "same-origin proxy must serve /api/backend/health and auth/me");
assert(session.includes('const authMePath = `${sameOriginApiProxyPath}/auth/me`'), "session refresh must use same-origin auth/me");
assert(session.includes('const authLoginPath = `${sameOriginApiProxyPath}/auth/login`'), "login submit must use same-origin auth/login");
assert(session.includes('const authLogoutPath = `${sameOriginApiProxyPath}/auth/logout`'), "logout must use same-origin auth/logout");
assert(session.includes("authRequestTimeoutMs"), "auth reachability must include a timeout path");
assert(session.includes("authRequestFailed(response)") && session.includes("response.status >= 500"), "5xx auth/proxy failures must be classified as reachability failures");
assert(session.includes("setMessage(connectionProblemMessage())"), "true auth reachability failures must show the friendly connection message");
assert(session.includes("clearSession(storedToken ? sessionEndedMessage() : undefined)"), "auth/me 401 must only show session-ended when a stored session existed");
assert(!session.includes("clearSession(response ? sessionEndedMessage() : undefined)"), "auth/me 401 without a stored token must not be treated as an ended session");
assert(login.includes("session.status === \"unauthenticated\"") || login.includes("premium-login-card"), "normal unauthenticated login form must render");
assert(login.includes("{session.message ? <p className=\"notice\""), "session-ended notice must be mild, not a blocking login error");

console.log("V136 public login session reachability PASS");
