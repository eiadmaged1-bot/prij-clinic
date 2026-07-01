import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { findRestoreReadyCandidates, parseArgs, scanInbox } from "./v099-official-medication-inbox-utils.mjs";

const args = parseArgs();
const apply = args.apply === "true";
const confirm = args.confirm;
const selectedFile = args.file ? resolve(args.file) : null;
const restoreReady = findRestoreReadyCandidates(scanInbox());

let file = selectedFile;
if (!file && restoreReady.length === 1) file = restoreReady[0].path;

const report = {
  mode: apply ? "apply" : "dry-run",
  selectedFile: file,
  restoreReadyCandidateCount: restoreReady.length,
  restoreReadyCandidates: restoreReady.map((item) => item.path),
  restoreApplied: false
};

try {
  if (!file) {
    if (restoreReady.length > 1) throw new Error("Multiple RESTORE_READY candidates found. Re-run with --file \"PATH\".");
    console.warn("V099-RESTORE-INBOX WARN no RESTORE_READY candidate found; restore not run");
    printReport();
  } else {
    if (!existsSync(file)) throw new Error(`Selected file does not exist: ${file}`);
    if (!restoreReady.some((item) => resolve(item.path) === file)) throw new Error("Selected file is not a RESTORE_READY candidate from storage/official-medication-inbox/.");
    if (apply) validateApplyRequest();
    runV097Restore(file);
    if (apply) {
      runNpm("medication:v097:ready-check:strict");
      runNpm("prescriptions:v097:medication-selection-check");
      report.restoreApplied = true;
    }
    printReport();
  }
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error);
  printReport();
  process.exitCode = 1;
}

function runV097Restore(path) {
  const restoreArgs = ["scripts/v097-restore-official-medications.mjs", "--file", path];
  if (apply) restoreArgs.push("--apply", "--confirm", confirm);
  const result = spawnSync(process.execPath, restoreArgs, { cwd: process.cwd(), stdio: "inherit" });
  if (result.status !== 0) throw new Error(`v0.9.7 restore orchestrator failed with exit code ${result.status ?? 1}`);
}

function runNpm(script) {
  const result = spawnSync("npm", ["run", script], { cwd: process.cwd(), shell: true, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status ?? 1}`);
}

function validateApplyRequest() {
  const allowedEnvs = new Set(["local", "dev", "test", "ci"]);
  const appEnv = process.env.APP_ENV || "";
  if (confirm !== "RESTORE_OFFICIAL_MEDICATION_REFERENCE_DATA") throw new Error("Apply mode requires --confirm RESTORE_OFFICIAL_MEDICATION_REFERENCE_DATA.");
  if (!allowedEnvs.has(appEnv)) throw new Error(`Apply refused for APP_ENV=${appEnv || "not set"}.`);
}

function printReport() {
  console.log("V099 RESTORE FROM OFFICIAL MEDICATION INBOX");
  console.log(JSON.stringify(report, null, 2));
}
