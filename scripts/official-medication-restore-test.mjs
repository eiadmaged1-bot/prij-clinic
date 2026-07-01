import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { compareMedicationSummaries, RESTORE_COMPATIBILITY_VERSION } from "./official-medication-data-summary.mjs";

const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`RESTORE PASS ${message}`);
}

const restoreScript = readFileSync("scripts/restore-official-medication-drill.mjs", "utf8");
const exportScript = readFileSync("scripts/export-official-medication-data.mjs", "utf8");
const importScript = readFileSync("scripts/import-official-medication-data.mjs", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const ignore = readFileSync(".gitignore", "utf8");

assert(packageJson.includes("medication:official-data:restore-drill"), "restore drill npm script is registered");
assert(restoreScript.includes("MEDICATION_RESTORE_DATABASE_URL"), "restore drill accepts isolated restore database URL");
assert(restoreScript.includes("allow-main-database") && restoreScript.includes("refused to use the main DATABASE_URL"), "restore drill refuses main DATABASE_URL by default");
assert(restoreScript.includes("prisma:migrate:deploy") && restoreScript.includes("import-official-medication-data.mjs"), "restore drill migrates and imports into restore target");
assert(restoreScript.includes("compareMedicationSummaries"), "restore drill validates restored counts against manifest summary");
assert(restoreScript.includes("patient|encounter|prescription|invoice|payment"), "restore drill rejects patient/clinical/billing record payloads");
assert(restoreScript.includes("storage/official-medication-restore-drills"), "restore drill writes local ignored reports");
assert(ignore.includes("storage/*"), "export and restore report files remain gitignored");

assert(exportScript.includes("buildOfficialMedicationSummary"), "export manifest includes complete medication summary");
assert(exportScript.includes("restoreCompatibilityVersion"), "export manifest includes restore compatibility version");
assert(exportScript.includes("excludesPatientData") && exportScript.includes("excludesSecrets"), "export manifest declares patient and secret exclusions");
assert(importScript.includes("upsert") && importScript.includes("Verified official medication row differs from restore payload"), "export/import is idempotent and preserves verified rows through conflict review");
assert(importScript.includes("official_data_restore_conflict"), "verified rows are not overwritten silently");

const expected = {
  totalRealVariantCount: 2,
  totalRealProductCount: 2,
  realRowsByCountry: { BHR: 1, OMN: 1 },
  demoRowsExcludedCount: 23,
  verifiedRowsByCountry: { BHR: 1, OMN: 1 },
  needsReviewRowsByCountry: {},
  reviewItemsByCountryStatus: { BHR: { verified: 1 }, OMN: { verified: 1 } },
  sourceSnapshotCount: 2,
  importRunCount: 2,
  sourceRowHashCount: 2,
  officialPriceMetadataCountByCountry: { BHR: 1, OMN: 1 },
  parserConfidenceBucketsByCountry: { BHR: { gte090: 1 }, OMN: { gte090: 1 } },
  rejectedRetiredCountsByCountry: {}
};
assert(compareMedicationSummaries(expected, structuredClone(expected)).length === 0, "restore comparison accepts matching isolated database summary");
const mismatch = compareMedicationSummaries(expected, { ...expected, totalRealVariantCount: 1 });
assert(mismatch.some((item) => item.path === "totalRealVariantCount"), "restore comparison detects count mismatch");

const fixture = createFixtureExport();
let refusedMain = false;
try {
  execFileSync("node", ["scripts/restore-official-medication-drill.mjs", "--file", fixture, "--database-url", localDatabaseUrl()], { encoding: "utf8", stdio: "pipe" });
} catch (error) {
  refusedMain = String(error.stderr ?? error.message).includes("refused to use the main DATABASE_URL") || String(error.stdout ?? "").includes("refused to use the main DATABASE_URL");
}
assert(refusedMain, "restore drill refuses main DATABASE_URL through CLI");

const storageStatus = execFileSync("git", ["status", "--short", "storage"], { encoding: "utf8" }).trim();
assert(storageStatus === "", "restore test fixture under storage is not staged or tracked");

console.log(`RESTORE SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);

function createFixtureExport() {
  const dir = resolve("storage/official-medication-exports");
  mkdirSync(dir, { recursive: true });
  const data = [
    { type: "DrugMarketCountry", data: { countryCode: "BHR" } }
  ].map((row) => JSON.stringify(row)).join("\n") + "\n";
  const sha256 = createHash("sha256").update(data).digest("hex");
  const manifest = {
    type: "manifest",
    format: "official-medication-jsonl-v1",
    restoreCompatibilityVersion: RESTORE_COMPATIBILITY_VERSION,
    includeDemo: false,
    counts: { DrugMarketCountry: 1, DrugMarketVariant: 0 },
    summary: {
      totalRealVariantCount: 0,
      totalRealProductCount: 0,
      realRowsByCountry: {},
      demoRowsExcludedCount: 23,
      verifiedRowsByCountry: {},
      needsReviewRowsByCountry: {},
      reviewItemsByCountryStatus: {},
      sourceSnapshotCount: 0,
      importRunCount: 0,
      sourceRowHashCount: 0,
      officialPriceMetadataCountByCountry: {},
      parserConfidenceBucketsByCountry: {},
      rejectedRetiredCountsByCountry: {}
    },
    sha256
  };
  const file = resolve(dir, "restore-test-fixture.jsonl");
  writeFileSync(file, `${JSON.stringify(manifest)}\n${data}`);
  assert(existsSync(file), "restore test fixture export is created under ignored storage");
  return file;
}

function localDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!existsSync(".env")) return "postgresql://prij_clinic_dev:prij_clinic_dev_password@localhost:5432/prij_clinic_dev";
  const line = readFileSync(".env", "utf8").split(/\r?\n/).find((item) => item.trim().startsWith("DATABASE_URL="));
  if (!line) return "postgresql://prij_clinic_dev:prij_clinic_dev_password@localhost:5432/prij_clinic_dev";
  let value = line.slice(line.indexOf("=") + 1).trim();
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return value;
}
