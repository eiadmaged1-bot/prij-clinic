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
const prodExample = read(".env.production.example");
const env = read("apps/api/src/config/env.ts");
const cors = read("apps/api/src/config/cors-origins.ts");
const docs = [
  "docs/DEPLOYMENT_PREP_CHECKLIST.md",
  "docs/STAGING_DEPLOYMENT_PLAN.md",
  "docs/ENVIRONMENT_VARIABLES.md",
  "docs/BACKUP_RESTORE_RUNBOOK.md",
  "docs/PRODUCTION_SAFETY_LIMITATIONS.md",
  "docs/V0_16_1_SECURITY_DEPLOYMENT_PREP_LOCK.md",
  "README.md"
].map(read).join("\n");

assert(packageJson.scripts["test:v161:deployment-prep"] === "node scripts/v161-deployment-prep-test.mjs", "deployment prep test script is registered");
assert(fs.existsSync(path.join(root, ".env.production.example")), ".env.production.example exists");
assert(prodExample.includes("DEMO_MODE=false") && docs.includes("DEMO_MODE=false"), "DEMO_MODE=false is documented for production-shaped environments");
assert(prodExample.includes("PATIENT_FILE_STORAGE_MODE=metadata_only") || docs.includes("PATIENT_FILE_STORAGE_MODE=metadata_only"), "patient file storage metadata-only or safe production guidance exists");
assert(docs.includes("APP_URL") && docs.includes("HTTPS") && env.includes("APP_URL must use HTTPS"), "APP_URL production HTTPS requirement exists");
assert(env.includes("JWT_SECRET") && !/console\.(log|warn|error)\([^)]*JWT_SECRET/.test(env), "JWT secret presence is checked without printing value");
assert(env.includes("DATABASE_URL") && !/console\.(log|warn|error)\([^)]*DATABASE_URL/.test(env), "database URL presence is checked without printing value");
assert(docs.includes("backup path") || docs.includes("backups/") || docs.includes("backup artifacts"), "backup path guidance exists");
assert(docs.includes("upload/storage path") || docs.includes("Patient file storage"), "upload/storage path guidance exists");
assert(cors.includes("CORS") && docs.includes("CORS"), "CORS production guidance exists");
assert(prodExample.includes("AI_FEATURES_ENABLED=false") && prodExample.includes("AI_PROVIDER=disabled") && docs.includes("External AI remains disabled"), "external AI is disabled by default");
assert(docs.includes("Real patient data entry is still blocked") || docs.includes("Real patient data entry remains blocked"), "real patient data warning is present");
assert(docs.includes("not a production release") || docs.includes("not a production launch approval"), "v0.16.1 is not claimed as production release");

console.log(`v0.16.1 deployment prep checks passed (${checks.length})`);
