import { spawnSync } from "node:child_process";
import { findUsableCandidates, parseArgs, scanInbox } from "./v099-official-medication-inbox-utils.mjs";

const args = parseArgs();
const requireCandidate = args["require-candidate"] === "true";
const results = scanInbox();
const usable = findUsableCandidates(results);
const validations = [];

for (const candidate of usable) {
  const validation = spawnSync(process.execPath, ["scripts/v098-validate-medication-source-candidate.mjs", "--file", candidate.path], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  validations.push({
    path: candidate.path,
    recommendation: candidate.recommendation,
    exitCode: validation.status ?? 1,
    validator: "scripts/v098-validate-medication-source-candidate.mjs"
  });
  if (validation.status !== 0) {
    console.warn(`V099-INBOX-VALIDATE WARN v0.9.8 validator failed for ${candidate.path}`);
    if (validation.stderr.trim()) console.warn(validation.stderr.trim());
  }
}

console.log("V099 OFFICIAL MEDICATION INBOX VALIDATION");
console.log(JSON.stringify({
  mode: requireCandidate ? "strict" : "warn-only",
  scannedFileCount: results.length,
  usableCandidateCount: usable.length,
  restoreReadyCandidateCount: results.filter((item) => item.recommendation === "RESTORE_READY").length,
  validations,
  files: results
}, null, 2));

if (!usable.length) {
  const message = "no usable official medication candidate exists in storage/official-medication-inbox/";
  if (requireCandidate) {
    console.error(`V099-INBOX-VALIDATE FAIL ${message}`);
    process.exitCode = 1;
  } else {
    console.warn(`V099-INBOX-VALIDATE WARN ${message}`);
  }
}
