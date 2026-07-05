import { spawnSync } from "node:child_process";
import fs from "node:fs";

const commands = [
  "test:v144:clinic-walkthrough",
  "test:v150:mvp-business-walkthrough",
  "test:v160:security-real-data-readiness",
  "test:v161:startup-readiness",
  "test:v161:deployment-prep",
  "test:v161:backup-runbook",
  "test:v161:role-by-role-readiness"
];

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

for (const command of commands) {
  console.log(`\n[v0.16.1] npm run ${command}`);
  const script = packageJson.scripts?.[command];
  if (!script) throw new Error(`${command} is not registered`);

  const executable = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm", "run", command] : ["run", command];
  const result = spawnSync(executable, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${command} failed`);
  }
}

console.log(`\nv0.16.1 security deployment prep lock suite passed (${commands.length})`);
