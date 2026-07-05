import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

function parseEnv(relativePath) {
  const values = new Map();
  for (const line of read(relativePath).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    values.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
  }
  return values;
}

function trackedFiles() {
  const result = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error("git ls-files failed");
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

const packageJson = JSON.parse(read("package.json"));
const stagingEnv = parseEnv(".env.staging.example");
const apiHealth = read("apps/api/src/health/health.controller.ts");
const apiEnv = read("apps/api/src/config/env.ts");
const cors = read("apps/api/src/config/cors-origins.ts");
const securityHeaders = read("apps/api/src/config/security-headers.ts");
const seed = read("apps/api/prisma/seed.js");
const docs = [
  "docs/STAGING_DEPLOYMENT_PLAN.md",
  "docs/STAGING_SMOKE_TESTS.md",
  "docs/ENVIRONMENT_VARIABLES.md",
  "docs/PRODUCTION_SAFETY_LIMITATIONS.md",
  "docs/KNOWN_LIMITATIONS.md",
  "README.md"
].filter(exists).map(read).join("\n");

assert(packageJson.scripts["test:v180:staging-smoke"] === "node scripts/v180-staging-smoke-test.mjs", "v0.18 staging smoke script is registered");
assert(exists(".env.staging.example"), ".env.staging.example exists");
assert(exists("docker-compose.staging.yml"), "docker-compose.staging.yml exists");
assert(apiHealth.includes('@Controller("health")') && apiHealth.includes('@Get("db")'), "health and DB health endpoints are configured");
assert(docs.includes("/health/db") && docs.includes("database"), "DB health path is documented");

for (const route of [
  "apps/web/app/login/page.tsx",
  "apps/web/app/clinic-day/walkthrough/page.tsx",
  "apps/web/app/patients/page.tsx",
  "apps/web/app/reception/check-in/page.tsx",
  "apps/web/app/doctor/waiting/page.tsx",
  "apps/web/app/ai-assistant/page.tsx",
  "apps/web/app/admin/security-readiness/page.tsx"
]) {
  assert(exists(route), `${route} exists`);
}

const aiRoute = read("apps/web/app/ai-assistant/page.tsx");
const securityRoute = read("apps/web/app/admin/security-readiness/page.tsx");
assert(aiRoute.includes("ai_draft") || aiRoute.includes("Assistant draft workspace"), "AI assistant route remains protected/draft-oriented");
assert(securityRoute.includes("security") || securityRoute.includes("Security"), "admin security readiness route exists");

assert(stagingEnv.get("APP_ENV") === "staging", "staging APP_ENV is documented");
assert(stagingEnv.get("NODE_ENV") === "production", "staging NODE_ENV is production-shaped");
assert(stagingEnv.get("DEMO_MODE") === "false", "staging DEMO_MODE is false");
assert(stagingEnv.get("PATIENT_FILE_STORAGE_MODE") === "metadata_only", "staging storage defaults to metadata_only");
assert(stagingEnv.get("AI_PROVIDER") === "disabled_mock", "staging AI provider defaults to disabled_mock");
assert(stagingEnv.get("EXTERNAL_AI_ENABLED") === "false", "external AI is disabled by default");
assert(stagingEnv.get("SEED_DEMO_DATA") === "false" && stagingEnv.get("SEED_DEMO_OWNER") === "false", "staging seed flags are safe by default");
assert(apiEnv.includes("EXTERNAL_AI_ENABLED must stay false"), "runtime env validation blocks external AI enablement");
assert(cors.includes("HTTP CORS origin is forbidden") && cors.includes("staging"), "CORS strict staging validation exists");
assert(securityHeaders.includes("X-Frame-Options") && securityHeaders.includes("X-Content-Type-Options"), "security headers are configured");
assert(!/real patient|production-ready medical|autonomous diagnosis/i.test(seed), "seed file does not advertise real patient data or autonomous diagnosis");

const normalUiSource = [
  "apps/web/app/login/page.tsx",
  "apps/web/app/patients/page.tsx",
  "apps/web/app/reception/check-in/page.tsx",
  "apps/web/app/doctor/waiting/page.tsx"
].map(read).join("\n");
assert(!/\b(Prisma|stack trace|endpoint|schema)\b/i.test(normalUiSource), "normal UI avoids raw developer wording");

const tracked = trackedFiles();
assert(!tracked.some((file) => /^(\.env|apps\/api\/\.env|apps\/web\/\.env\.local)$/.test(file)), "real env files are not tracked");
assert(
  !tracked.some((file) =>
    /^(uploads|storage\/|apps\/api\/uploads|apps\/api\/storage|logs\/|backups\/|incoming\/|\.tmp\/)/.test(file) &&
    file !== "storage/README.md"
  ),
  "sensitive runtime paths are not tracked"
);

const trackedText = tracked
  .filter((file) => /\.(?:md|mjs|js|ts|tsx|json|yml|yaml|example|ps1|sh|gitignore)$/i.test(file))
  .map((file) => read(file))
  .join("\n");
assert(
  !/(sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----)/i.test(trackedText),
  "no obvious secret-looking values are committed"
);

console.log(`v0.18.0 staging smoke checks passed (${checks.length})`);
