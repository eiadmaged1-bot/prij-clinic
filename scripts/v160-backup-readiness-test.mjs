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
const gitignore = read(".gitignore");
const backupLocal = read("scripts/backup-local-db.ps1");
const backupVerify = read("scripts/backup-verify.ps1");
const backupReadiness = read("scripts/backup-readiness.ps1");
const docs = read("docs/BACKUP_READINESS.md");

assert(packageJson.scripts["backup:local"] === "powershell -ExecutionPolicy Bypass -File scripts/backup-local-db.ps1", "backup:local script is registered");
assert(packageJson.scripts["backup:verify"] === "powershell -ExecutionPolicy Bypass -File scripts/backup-verify.ps1", "backup:verify script is registered");
assert(packageJson.scripts["backup:readiness"] === "powershell -ExecutionPolicy Bypass -File scripts/backup-readiness.ps1", "backup:readiness script is registered");
assert(packageJson.scripts["test:v160:backup-readiness"] === "node scripts/v160-backup-readiness-test.mjs", "backup readiness test script is registered");

for (const pattern of ["backups/", "*.dump", "*.backup.sql", "*.sql.gz"]) {
  assert(gitignore.includes(pattern), `.gitignore excludes ${pattern}`);
}

assert(backupLocal.includes('"backups"') && backupLocal.includes(".backup.sql"), "local backups write to ignored backup folder and ignored extension");
assert(backupLocal.includes("pg_dump --version") && backupLocal.includes("pg_dump is not available"), "backup:local gives clear pg_dump missing message");
assert(!/DATABASE_URL|password|secret|token/i.test(backupLocal), "backup:local does not print secrets");
assert(backupVerify.includes("pg_dump --version") && backupVerify.includes("No restore was run"), "backup:verify checks tooling without restore");
assert(!/restore-local|psql .*<|docker exec .* psql/i.test(backupVerify + backupReadiness), "backup readiness workflow does not run destructive restore automatically");
assert(backupReadiness.includes("Generated backup files must never be committed") || docs.includes("Generated backup files must never be committed"), "backup workflow documents no committed backup artifacts");
assert(docs.includes("not a production backup") && docs.includes("Production backups require"), "backup docs state local readiness limitation");

console.log(`v0.16.0 backup readiness checks passed (${checks.length})`);
