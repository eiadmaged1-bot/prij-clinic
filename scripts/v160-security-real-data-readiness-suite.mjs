import { spawnSync } from "node:child_process";
import fs from "node:fs";

const commands = [
  "test:v160:real-data-readiness",
  "test:v160:security-readiness-dashboard",
  "test:v160:rbac-readiness",
  "test:v160:audit-governance",
  "test:v160:backup-readiness",
  "test:v160:phi-document-safety",
  "test:v160:production-readiness",
  "test:v160:ai-safety-readiness"
];

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

for (const command of commands) {
  console.log(`\n[v0.16] npm run ${command}`);
  const script = packageJson.scripts?.[command];
  const match = /^node\s+([^\s]+\.mjs)$/.exec(script ?? "");
  if (!match) {
    throw new Error(`${command} must be a fixed node .mjs script`);
  }

  const result = spawnSync(process.execPath, [match[1]], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${command} failed`);
  }
}

console.log(`\nv0.16.0 security real patient data readiness suite passed (${commands.length})`);
