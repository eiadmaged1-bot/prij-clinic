import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const sessionServicePath = path.join(
  repositoryRoot,
  "apps",
  "api",
  "src",
  "auth",
  "session.service.ts"
);
const source = await readFile(sessionServicePath, "utf8");

assert.match(
  source,
  /process\.env\.NODE_ENV !== "production"/,
  "The compatibility session store must never be enabled by default in production."
);
assert.match(
  source,
  /code === "P2021"[\s\S]*code === "P2022"/,
  "Only known Prisma schema-compatibility errors should enable the local fallback."
);
assert.match(
  source,
  /private readonly memorySessions = new Map/,
  "Local development sessions must be process-scoped and non-persistent."
);
assert.match(
  source,
  /createSession[\s\S]*createMemorySession/,
  "Session creation must fall back when the AuthSession table is unavailable locally."
);
assert.match(
  source,
  /validateSession[\s\S]*validateMemorySession/,
  "The authentication guard must be able to validate locally-created compatibility sessions."
);
assert.match(
  source,
  /revokeSession[\s\S]*memorySession\.revokedAt/,
  "Logout must revoke compatibility sessions."
);
assert.match(
  source,
  /ServiceUnavailableException[\s\S]*Apply the AuthSession database migration/,
  "Production schema problems must fail closed with a clear migration error."
);
assert.doesNotMatch(
  source,
  /logger\.(?:log|warn|error|debug)[^\n]*(?:rawToken|sessionTokenHash)/,
  "Session tokens or hashes must not be written to logs."
);

console.log("Auth session compatibility regression: PASS");
