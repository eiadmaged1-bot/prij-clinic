import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const authServicePath = path.join(repositoryRoot, "apps", "api", "src", "auth", "auth.service.ts");
const sessionUiPath = path.join(repositoryRoot, "apps", "web", "app", "session.tsx");
const authSource = await readFile(authServicePath, "utf8");
const sessionUiSource = await readFile(sessionUiPath, "utf8");

assert.match(
  authSource,
  /private async recordDeniedLoginSafely\(/,
  "Denied-login audit writes must be isolated from the authentication response."
);
assert.match(
  authSource,
  /private async trackFailedLoginSafely\(/,
  "Failed-login counter persistence must be isolated from the authentication response."
);
assert.match(
  authSource,
  /await this\.recordDeniedLoginSafely\([\s\S]*?throw new UnauthorizedException\("Invalid email or password\."\);/,
  "Unknown or inactive users must still receive an Unauthorized response after audit degradation."
);
assert.match(
  authSource,
  /await this\.trackFailedLoginSafely\([\s\S]*?await this\.recordDeniedLoginSafely\([\s\S]*?throw new UnauthorizedException\("Invalid email or password\."\);/,
  "Wrong passwords must still receive an Unauthorized response after tracking or audit degradation."
);
assert.match(
  authSource,
  /private async updateSuccessfulLoginStateWithCompatibility\(/,
  "Local schema drift must not turn a verified credential into an HTTP 500."
);
assert.match(
  authSource,
  /private async recordSuccessfulLoginWithCompatibility\(/,
  "Local audit schema drift must not turn successful login into an HTTP 500."
);
assert.match(
  authSource,
  /process\.env\.NODE_ENV !== "production"/,
  "Compatibility handling must remain disabled in production."
);
assert.match(
  authSource,
  /const sessionToken = await this\.sessionService\.createSession\([\s\S]*?await this\.recordSuccessfulLoginWithCompatibility\([\s\S]*?return \{ user: safeUser, sessionToken \};/,
  "Successful login must still create a session before returning access."
);
assert.match(
  sessionUiSource,
  /if \(response\.status === 401\) \{[\s\S]*?throw new Error\(invalidLoginMessage\(\)\);/,
  "Credential rejection must show one stable, non-enumerating message."
);
assert.doesNotMatch(
  authSource,
  /password[^\n]*this\.logger|this\.logger[^\n]*password/i,
  "Authentication logs must not include passwords."
);

console.log("Authentication compatibility regression: PASS");
