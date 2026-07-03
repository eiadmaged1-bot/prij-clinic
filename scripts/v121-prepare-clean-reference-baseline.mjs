import { spawnSync } from "node:child_process";
import { parseFlags } from "./v121-reference-utils.mjs";

const flags = parseFlags();

const steps = [
  ["inventory", ["scripts/v121-db-inventory.mjs"]],
  ["cleanup dry-run", ["scripts/v121-clean-operational-data.mjs", "--dry-run", ...(flags.json ? ["--json"] : [])]]
];

if (flags.apply) {
  if (!flags.skipClean) steps.push(["cleanup apply", ["scripts/v121-clean-operational-data.mjs", "--apply", "--all-operational-local", ...(flags.json ? ["--json"] : [])]]);
  steps.push(["seed investigations", ["scripts/v121-seed-investigation-catalog.mjs"]]);
  steps.push(["seed operations", ["scripts/v121-seed-operation-catalog.mjs"]]);
  steps.push(["seed services", ["scripts/v121-seed-service-catalog.mjs"]]);
  steps.push(["medication readiness", ["scripts/v121-medication-reference-readiness.mjs"]]);
  steps.push(["verify clean baseline", ["scripts/v121-verify-clean-baseline.mjs"]]);
}

console.log(`V121-BASELINE ${flags.apply ? "APPLY" : "DRY-RUN"}`);
for (const [label, args] of steps) {
  console.log(`V121-BASELINE start ${label}`);
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.error(`V121-BASELINE FAIL ${label} exited ${result.status}`);
    process.exit(result.status || 1);
  }
  console.log(`V121-BASELINE done ${label}`);
}
console.log("V121-BASELINE PASS");
