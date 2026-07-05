import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

function run(script) {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", `npm run ${script}`] : ["run", script];
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit"
  });
  if (result.status !== 0) throw new Error(`npm run ${script} failed`);
  checks.push(`npm run ${script}`);
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

const requiredEnvNames = [
  "APP_ENV",
  "NODE_ENV",
  "DEMO_MODE",
  "DATABASE_URL",
  "JWT_SECRET",
  "APP_URL",
  "WEB_ORIGIN",
  "CORS_ALLOWED_ORIGINS",
  "PATIENT_FILE_STORAGE_MODE",
  "BACKUP_DIR",
  "AI_PROVIDER",
  "EXTERNAL_AI_ENABLED"
];

assert(exists(".env.staging.example"), ".env.staging.example exists");
const stagingEnv = parseEnv(".env.staging.example");
for (const name of requiredEnvNames) {
  assert(stagingEnv.has(name), `${name} is documented in .env.staging.example`);
}

assert(stagingEnv.get("APP_ENV") === "staging", "APP_ENV staging example is staging");
assert(stagingEnv.get("NODE_ENV") === "production", "NODE_ENV staging example is production");
assert(stagingEnv.get("DEMO_MODE") === "false", "DEMO_MODE is false");
assert(stagingEnv.get("AI_PROVIDER") === "disabled_mock", "AI provider is disabled_mock");
assert(stagingEnv.get("EXTERNAL_AI_ENABLED") === "false", "external AI disabled");
assert(stagingEnv.get("PATIENT_FILE_STORAGE_MODE") === "metadata_only", "patient storage is metadata_only");
assert(stagingEnv.get("SEED_DEMO_DATA") === "false", "staging demo data seed is disabled by default");
assert(stagingEnv.get("SEED_DEMO_OWNER") === "false", "staging demo owner seed is disabled by default");

const seed = read("apps/api/prisma/seed.js");
assert(!/real patient|production patient|autonomous diagnosis|autonomous prescribing/i.test(seed), "seed source has no real patient or autonomous clinical claims");

const gitignore = read(".gitignore");
assert(gitignore.includes("backups/"), "backup path is ignored");
assert(gitignore.includes("uploads/") && gitignore.includes("storage/*"), "storage/uploads paths are ignored");
assert(exists("docker-compose.staging.yml"), "Docker staging config exists");

run("prisma:migrate:deploy");
run("test:v180:staging-smoke");
run("test:v180:backup-staging-readiness");
run("build");

console.log(`v0.18.0 local production simulation passed (${checks.length})`);
