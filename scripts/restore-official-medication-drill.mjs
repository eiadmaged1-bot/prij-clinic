import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  compareMedicationSummaries,
  RESTORE_COMPATIBILITY_VERSION
} from "./official-medication-data-summary.mjs";

const args = parseArgs();
loadEnvFile(".env");

const exportFile = resolve(args.file ?? (args.latest === "true" ? latestExportFile() : ""));
if (!exportFile || !existsSync(exportFile)) throw new Error("--file or --latest must point to an official medication export.");

const mainDatabaseUrl = process.env.DATABASE_URL;
const restoreDatabaseUrl = args["database-url"] ?? process.env.MEDICATION_RESTORE_DATABASE_URL ?? deriveRestoreDatabaseUrl(mainDatabaseUrl);
if (!restoreDatabaseUrl) throw new Error("MEDICATION_RESTORE_DATABASE_URL or a derivable DATABASE_URL is required.");
if (sameDatabase(mainDatabaseUrl, restoreDatabaseUrl) && args["allow-main-database"] !== "true") {
  throw new Error("Restore drill refused to use the main DATABASE_URL. Set MEDICATION_RESTORE_DATABASE_URL to an isolated database.");
}

const { manifest, records, sha256 } = readAndValidateExport(exportFile);
if (manifest.restoreCompatibilityVersion !== RESTORE_COMPATIBILITY_VERSION) {
  throw new Error(`Unsupported restore compatibility version: ${manifest.restoreCompatibilityVersion ?? "missing"}`);
}

await ensureRestoreDatabase(restoreDatabaseUrl);
runCommand("npm", ["run", "prisma:migrate:deploy"], restoreDatabaseUrl);
runCommand("node", ["scripts/import-official-medication-data.mjs", "--file", exportFile, "--dry-run", "false"], restoreDatabaseUrl);

process.env.DATABASE_URL = restoreDatabaseUrl;
const { prisma } = await import("./official-medication-utils.mjs");
const { buildOfficialMedicationSummary } = await import("./official-medication-data-summary.mjs");
const restoredSummary = await buildOfficialMedicationSummary(prisma);
const restoredDemoRows = restoredSummary.demoRowsExcludedCount;
restoredSummary.demoRowsExcludedCount = manifest.summary.demoRowsExcludedCount;
const mismatches = compareMedicationSummaries(manifest.summary, restoredSummary);
const patientDataRows = records.filter((record) => /patient|encounter|prescription|invoice|payment/i.test(record.type)).length;
if (patientDataRows) mismatches.push({ path: "patientDataRows", expected: 0, actual: patientDataRows });

const report = {
  status: mismatches.length ? "failed" : "passed",
  file: exportFile,
  exportSha256: sha256,
  restoreDatabaseName: databaseName(restoreDatabaseUrl),
  restoredAt: new Date().toISOString(),
  manifestSummary: manifest.summary,
  restoredSummary,
  mismatches,
  safety: {
    mainDatabaseRefusedByDefault: !sameDatabase(mainDatabaseUrl, restoreDatabaseUrl),
    patientDataRows,
    restoredDemoRows,
    demoRowsExcludedFromRestore: restoredDemoRows === 0,
    rawSourceFilesImported: false,
    exportFileCommitted: isTracked(exportFile),
    restoreReportCommitted: false
  }
};

const reportDir = resolve("storage/official-medication-restore-drills");
mkdirSync(reportDir, { recursive: true });
const reportFile = join(reportDir, `restore-drill-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(reportFile, JSON.stringify(report, null, 2));
await prisma.$disconnect();

console.log(JSON.stringify({ status: report.status, file: exportFile, reportFile, restoreDatabaseName: report.restoreDatabaseName, mismatches }, null, 2));
if (mismatches.length) process.exitCode = 1;

function readAndValidateExport(file) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const parsedManifest = JSON.parse(lines[0]);
  if (parsedManifest.type !== "manifest") throw new Error("First JSONL line must be the manifest.");
  const dataText = `${lines.slice(1).join("\n")}\n`;
  const fileSha256 = createHash("sha256").update(dataText).digest("hex");
  if (fileSha256 !== parsedManifest.sha256) throw new Error("Export sha256 mismatch.");
  const parsedRecords = lines.slice(1).map((line) => JSON.parse(line));
  return { manifest: parsedManifest, records: parsedRecords, sha256: fileSha256 };
}

async function ensureRestoreDatabase(url) {
  const dbName = databaseName(url);
  if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) throw new Error(`Unsafe restore database name: ${dbName}`);
  if (sameDatabase(mainDatabaseUrl, url) && args["allow-main-database"] !== "true") throw new Error("Refusing to create/use main database for restore drill.");
  const shell = `createdb -U "$POSTGRES_USER" "${dbName}" 2>/dev/null || true`;
  execFileSync("docker", ["compose", "exec", "-T", "postgres", "sh", "-lc", shell], { stdio: "pipe" });
}

function runCommand(command, argv, databaseUrl) {
  const executable = process.platform === "win32" && command === "npm" ? "cmd.exe" : command;
  const commandArgs = process.platform === "win32" && command === "npm" ? ["/d", "/s", "/c", ["npm", ...argv].join(" ")] : argv;
  execFileSync(executable, commandArgs, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl }
  });
}

function latestExportFile() {
  const dir = resolve("storage/official-medication-exports");
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => /^official-medication-data-.+\.jsonl$/.test(name)).sort() : [];
  if (!files.length) throw new Error("No official medication export file found. Run medication:official-data:export first.");
  return join(dir, files.at(-1));
}

function deriveRestoreDatabaseUrl(url) {
  if (!url) return null;
  const parsed = new URL(url);
  parsed.pathname = "/prij_clinic_medication_restore_test";
  return parsed.toString();
}

function sameDatabase(left, right) {
  if (!left || !right) return false;
  const a = new URL(left);
  const b = new URL(right);
  return a.hostname === b.hostname && a.port === b.port && a.pathname === b.pathname;
}

function databaseName(url) {
  return new URL(url).pathname.replace(/^\//, "");
}

function isTracked(path) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", path], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
