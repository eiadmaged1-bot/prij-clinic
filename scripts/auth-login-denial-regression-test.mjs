import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const authServicePath = path.join(repositoryRoot, "apps", "api", "src", "auth", "auth.service.ts");
const source = await readFile(authServicePath, "utf8");

assert.match(
  source,
  /private async recordDeniedLoginSafely\(/,
  "Denied-login audit writes must be isolated from the authentication response."
);
assert.match(
  source,
  /private async trackFailedLoginSafely\(/,
  "Failed-login counter persistence must be isolated from the authentication response."
);
assert.match(
  source,
  /await this\.recordDeniedLoginSafely\([\s\S]*?throw new UnauthorizedException\("Invalid email or password\."\);/,
  "Unknown or inactive users must still receive an Unauthorized response after audit degradation."
);
assert.match(
  source,
  /await this\.trackFailedLoginSafely\([\s\S]*?await this\.recordDeniedLoginSafely\([\s\S]*?throw new UnauthorizedException\("Invalid email or password\."\);/,
  "Wrong passwords must still receive an Unauthorized response after tracking or audit degradation."
);
assert.match(
  source,
  /const sessionToken = await this\.sessionService\.createSession\([\s\S]*?await this\.audit\.record\([\s\S]*?return \{ user: safeUser, sessionToken \};/,
  "Successful login must remain strict: session creation and success audit complete before access is returned."
);
assert.doesNotMatch(
  source,
  /password[^\n]*this\.logger|this\.logger[^\n]*password/i,
  "Authentication logs must not include passwords."
);

console.log("Auth login denial regression: PASS");
