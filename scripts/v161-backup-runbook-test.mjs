import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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
const docs = `${read("docs/BACKUP_RESTORE_RUNBOOK.md")}\n${read("docs/BACKUP_READINESS.md")}\n${read("README.md")}`;
const trackedResult = spawnSync("git", ["ls-files"], { encoding: "utf8" });
if (trackedResult.status !== 0) throw new Error("git ls-files failed");
const tracked = trackedResult.stdout.split(/\r?\n/).filter(Boolean);

assert(packageJson.scripts["backup:local"] === "powershell -ExecutionPolicy Bypass -File scripts/backup-local-db.ps1", "backup:local exists");
assert(packageJson.scripts["backup:verify"] === "powershell -ExecutionPolicy Bypass -File scripts/backup-verify.ps1", "backup:verify exists");
assert(packageJson.scripts["backup:readiness"] === "powershell -ExecutionPolicy Bypass -File scripts/backup-readiness.ps1", "backup:readiness exists");
assert(packageJson.scripts["test:v161:backup-runbook"] === "node scripts/v161-backup-runbook-test.mjs", "backup runbook test script is registered");
assert(gitignore.includes("backups/"), "backups/ is ignored");

const backupFiles = fs.readdirSync(root).filter((name) => /\.(?:dump|backup\.sql|sql\.gz|bak)$/i.test(name));
assert(backupFiles.length === 0, "generated backup files are not present at repo root");
assert(!tracked.some((file) => file.startsWith("backups/") || /\.(?:dump|backup\.sql|sql\.gz|bak)$/i.test(file)), "generated backups are not committed");

assert(docs.includes("Generated backups must never be committed") || docs.includes("Generated backup files must never be committed"), "generated backups are documented as uncommitted");
assert(docs.includes("Restore is manual and admin-controlled only") || docs.includes("manual/admin-controlled"), "restore is documented as manual/admin-controlled only");
assert(docs.includes("Future task") || docs.includes("restore drill") || docs.includes("No restore was run"), "restore drill remains future or separately controlled");

const backupVerify = read("scripts/backup-verify.ps1");
const backupReadiness = read("scripts/backup-readiness.ps1");
assert(!/restore-local|psql\s+.*<|docker\s+exec\s+.*psql/i.test(`${backupVerify}\n${backupReadiness}`), "backup readiness scripts do not run destructive restore");

console.log(`v0.16.1 backup runbook checks passed (${checks.length})`);
