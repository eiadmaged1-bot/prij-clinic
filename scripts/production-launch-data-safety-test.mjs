import fs from "node:fs";

const requiredFiles = [
  "scripts/production-launch-inventory.mjs",
  "scripts/production-launch-reset-plan.mjs",
  "scripts/production-launch-reset-apply.mjs",
  "scripts/production-launch-verify.mjs",
  "scripts/production-launch-backup.ps1",
  "scripts/production-launch-restore-drill.ps1"
];

const applySource = fs.readFileSync("scripts/production-launch-reset-apply.mjs", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const checks = [];

for (const file of requiredFiles) assert(fs.existsSync(file), `${file} exists`);
for (const script of [
  "db:production-launch:inventory",
  "db:production-launch:backup",
  "db:production-launch:plan",
  "db:production-launch:apply",
  "db:production-launch:verify",
  "db:production-launch:restore-drill",
  "test:production-launch:data-safety"
]) {
  assert(Boolean(packageJson.scripts[script]), `${script} is registered`);
}

assert(applySource.includes("reset apply requires explicit --apply"), "apply requires explicit --apply");
assert(applySource.includes("backup manifest database fingerprint"), "apply checks backup manifest fingerprint");
assert(applySource.includes("database changed after plan generation"), "apply refuses changed database");
assert(applySource.includes("unresolved uncertain records remain"), "apply refuses unresolved uncertain records");
assert(!/migrate reset|force-reset|drop schema|drop database/i.test(applySource), "apply script contains no destructive schema reset command");

console.log(`production launch data safety checks passed (${checks.length})`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

