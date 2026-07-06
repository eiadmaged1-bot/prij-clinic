import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const session = readFileSync("apps/web/app/session.tsx", "utf8");
const login = readFileSync("apps/web/app/login/page.tsx", "utf8");

const authMe401Index = session.indexOf("if (response.status === 401)");
assert(authMe401Index >= 0, "auth/me refresh must explicitly classify 401");
const authMe401Block = session.slice(authMe401Index, session.indexOf("if (!response.ok)", authMe401Index));
assert(authMe401Block.includes("clearSession(storedToken ? sessionEndedMessage() : undefined)"), "auth/me 401 must be logged-out state");
assert(!authMe401Block.includes("connectionProblemMessage()"), "auth/me 401 must not be a connection problem");

const login401Index = session.indexOf("if (response.status === 401)", authMe401Index + 1);
assert(login401Index >= 0, "login must explicitly classify 401");
const login401Block = session.slice(login401Index, session.indexOf("if (authRequestFailed(response))", login401Index));
assert(login401Block.includes("invalidLoginMessage()"), "login 401 must be invalid credentials");
assert(session.includes("Invalid staff ID/email or password."), "invalid credential copy must be staff ID/email specific");

const loginFailureBlock = session.slice(session.indexOf("if (!response)"), session.indexOf("if (response.status === 401)", login401Index));
assert(loginFailureBlock.includes("connectionProblemMessage()"), "network login failure must be connection problem");
assert(session.includes("response.status >= 500"), "5xx auth response must be connection problem");
assert(session.includes("throw new Error(connectionProblemMessage())"), "malformed successful auth response must be connection problem");

const initialFailureBlock = session.slice(session.indexOf("if (!response || authRequestFailed(response))"), authMe401Index);
assert(initialFailureBlock.includes('setMessage(storedToken ? connectionProblemMessage() : "")'), "initial auth/me failure without stored token must not show scary pre-click error");
assert(login.includes("session.clearMessage();"), "login submit must clear stale session notices");

const forbiddenNormalUi = ["localhost", "ngrok", "CORS", "NEXT_PUBLIC", "PRIJ_API_INTERNAL_ORIGIN", "stack trace", "proxy"];
for (const phrase of forbiddenNormalUi) {
  assert(!login.toLowerCase().includes(phrase.toLowerCase()), `normal login UI must not render technical text: ${phrase}`);
}

const connectionCopyCount = (login.match(/Connection problem/g) ?? []).length;
assert(connectionCopyCount <= 1, "login UI must not repeat connection problem text");

console.log("V137 auth status classification PASS");
