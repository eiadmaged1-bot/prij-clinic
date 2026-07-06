import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const session = readFileSync("apps/web/app/session.tsx", "utf8");

const unauthorizedIndex = session.indexOf("if (response.status === 401)");
assert(unauthorizedIndex >= 0, "session refresh must explicitly handle auth/me 401");

const unauthorizedBlock = session.slice(unauthorizedIndex, session.indexOf("if (!response.ok)", unauthorizedIndex));
assert(unauthorizedBlock.includes("clearSession(storedToken ? sessionEndedMessage() : undefined)"), "auth/me 401 must mean logged out, with session-ended copy only for existing stored tokens");
assert(!unauthorizedBlock.includes("connectionProblemMessage()"), "auth/me 401 must not show connection problem");
assert(!unauthorizedBlock.includes("authRequestFailed"), "auth/me 401 must not be classified as API down");

const networkFailureIndex = session.indexOf("if (!response || authRequestFailed(response))");
assert(networkFailureIndex >= 0 && networkFailureIndex < unauthorizedIndex, "network/proxy/5xx failures must be handled before auth/me 401");

const networkFailureBlock = session.slice(networkFailureIndex, unauthorizedIndex);
assert(networkFailureBlock.includes('setMessage(storedToken ? connectionProblemMessage() : "")'), "network/proxy/5xx failures must show connection problem only for an existing stored session");
assert(networkFailureBlock.includes('setStatus("unauthenticated")'), "network/proxy/5xx failures must leave login reachable");

console.log("V136 auth/me 401 not API down PASS");
