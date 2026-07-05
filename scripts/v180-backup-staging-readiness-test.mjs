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

function trackedFiles() {
  const result = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error("git ls-files failed");
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

const packageJson = JSON.parse(read("package.json"));
const gitignore = read(".gitignore");
const runbook = read("docs/BACKUP_RESTORE_RUNBOOK.md");
const stagingPlan = read("docs/STAGING_DEPLOYMENT_PLAN.md");
const backupScript = read("scripts/backup-staging-db.ps1");
const backupReadiness = read("scripts/backup-readiness.ps1");
const backupVerify = read("scripts/backup-verify.ps1");

assert(packageJson.scripts["backup:staging"] === "powershell -ExecutionPolicy Bypass -File scripts/backup-staging-db.ps1", "backup:staging script exists");
assert(packageJson.scripts["test:v180:backup-staging-readiness"] === "node scripts/v180-backup-staging-readiness-test.mjs", "v0.18 backup readiness test is registered");
assert(gitignore.includes("backups/"), "backups are ignored");
assert(runbook.includes("staging backup frequency") || runbook.includes("Staging backup frequency"), "staging backup frequency placeholder is documented");
assert(runbook.includes("npm run backup:staging"), "manual staging backup command is documented");
assert(runbook.includes("npm run backup:verify"), "backup verify command is documented");
assert(/restore must never run automatically/i.test(runbook), "restore never runs automatically");
assert(/explicit admin\/operator approval/i.test(runbook), "restore requires explicit admin/operator approval");
assert(/encrypted\/secured/i.test(runbook), "real deployment backup encryption/security is documented");
assert(/local readiness is not production backup readiness/i.test(runbook), "local readiness limitation is documented");
assert(stagingPlan.includes("backup") && stagingPlan.includes("restore drill"), "staging plan references backup and restore drill");
assert(!/restore-local|docker\s+compose\s+down\s+-v|DROP\s+DATABASE|prisma\s+migrate\s+reset/i.test(`${backupScript}\n${backupReadiness}\n${backupVerify}`), "backup readiness scripts avoid destructive restore/reset operations");
assert(!trackedFiles().some((file) => file.startsWith("backups/") || /\.(?:dump|backup\.sql|sql\.gz|bak)$/i.test(file)), "backup artifacts are not tracked");
assert(exists("scripts/backup-staging-db.ps1"), "staging backup script exists");

console.log(`v0.18.0 staging backup readiness checks passed (${checks.length})`);
