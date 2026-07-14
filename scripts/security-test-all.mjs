import { spawnSync } from "node:child_process";

const steps = [
  "test:security:ci",
  "test:routes:auth",
  "rate-limit-window",
  "test:scope:records",
  "test:audit:assertions",
  "test:ai:regression",
  "test:admin:control"
];

let failed = 0;
const runnableStepCount = steps.length - 1;

for (const step of steps) {
  if (step === "rate-limit-window") {
    console.log("EXPANDED waiting for the authentication rate-limit window to reset");
    await new Promise((resolve) => setTimeout(resolve, 61_000));
    continue;
  }
  console.log(`EXPANDED running npm run ${step}`);
  const result = spawnSync(`npm run ${step}`, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    failed += 1;
    console.error(`EXPANDED FAIL npm run ${step}`);
  }
}

if (failed > 0) {
  console.error(`EXPANDED SUMMARY PASS ${runnableStepCount - failed} FAIL ${failed}`);
  process.exit(1);
}

console.log(`EXPANDED SUMMARY PASS ${runnableStepCount} FAIL 0`);
