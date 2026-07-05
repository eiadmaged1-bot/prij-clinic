import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const env = read("apps/api/src/config/env.ts");
const cors = read("apps/api/src/config/cors-origins.ts");
const prodExample = read(".env.production.example");
const docs = read("docs/PRODUCTION_READINESS_CHECKLIST.md");

assert(packageJson.scripts["test:v160:production-readiness"] === "node scripts/v160-production-readiness-test.mjs", "production readiness test script is registered");
assert(env.includes("validateRuntimeEnv") && env.includes("DATABASE_URL") && env.includes("JWT_SECRET"), "environment validation checks required DATABASE_URL and JWT_SECRET presence");
assert(!/DATABASE_URL.*process\.env\.DATABASE_URL/.test(env), "environment validation does not print DATABASE_URL value");
assert(env.includes("DEMO_MODE is forbidden in staging and production"), "DEMO_MODE=true is blocked for production/staging");
assert(env.includes("PATIENT_FILE_STORAGE_MODE=local_demo_file is forbidden in staging and production"), "local_demo_file storage is blocked for production/staging");
assert(env.includes("APP_URL must use HTTPS in staging and production"), "non-HTTPS APP_URL is blocked for production/staging");
assert(env.includes("JWT_EXPIRES_IN must be a short seconds/minutes/hours value in production") && env.includes("^\\d+[smh]$"), "production JWT expiry format is checked");
assert(env.includes("AI_FEATURES_ENABLED must stay false") && env.includes("AI_PROVIDER must be disabled"), "AI/external calls are disabled unless explicitly configured in a later release");
assert(env.includes("Demo seed flags are forbidden in production") && env.includes("Demo passwords are forbidden in production"), "default/demo credential and seed warning exists");

assert(cors.includes("HTTP CORS origin is forbidden") && cors.includes("CORS_PRIVATE_CIDRS is forbidden in staging and production"), "CORS production guidance and strict-origin enforcement exist");
assert(prodExample.includes("Placeholder values only") && prodExample.includes("Do not put real secrets") && prodExample.includes("Production patient use remains blocked"), ".env.production.example avoids secrets and states launch gate");
assert(prodExample.includes("AI_FEATURES_ENABLED=false") && prodExample.includes("AI_PROVIDER=disabled"), "production env example disables AI/external provider by default");
assert(prodExample.includes("DEMO_MODE=false") && prodExample.includes("PATIENT_FILE_STORAGE_MODE=metadata_only"), "production env example disables demo mode and local demo storage");
assert(docs.includes("does not claim full legal") && docs.includes("Demo passwords are forbidden"), "production readiness docs state limits and demo credential warning");

console.log(`v0.16.0 production readiness checks passed (${checks.length})`);
