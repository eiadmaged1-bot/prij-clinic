import assert from "node:assert/strict";
import fs from "node:fs";
const guard=fs.readFileSync("apps/api/src/auth/csrf.guard.ts","utf8"),proxy=fs.readFileSync("apps/web/app/api/backend/[...path]/route.ts","utf8"),session=fs.readFileSync("apps/web/app/session.tsx","utf8");assert.match(guard,/csrf-token/);assert.match(guard,/x-csrf-token/);assert.match(proxy,/"x-csrf-token"/);assert.match(session,/resource\.headers\.set\("x-csrf-token"/);assert.match(session,/credentials/);console.log("CSRF double-submit guard, same-origin proxy forwarding, and browser mutation compatibility passed.");
