import { spawnSync } from "node:child_process";

const steps = [
  "test:security:ci",
  "test:routes:auth",
  "test:scope:records",
  "test:audit:assertions",
  "test:ai:regression",
  "test:admin:control"
];

let failed = 0;

for (const step of steps) {
  console.log(`EXPANDED running npm run ${step}`);
  const result = spawnSync(`npm run ${step}`, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    failed += 1;
    console.error(`EXPANDED FAIL npm run ${step}`);
  }
}

if (failed > 0) {
  console.error(`EXPANDED SUMMARY PASS ${steps.length - failed} FAIL ${failed}`);
  process.exit(1);
}

console.log(`EXPANDED SUMMARY PASS ${steps.length} FAIL 0`);
