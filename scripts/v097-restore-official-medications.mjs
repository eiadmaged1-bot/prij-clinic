import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const args = parseArgs();
const apply = args.apply === "true";
const file = resolveInputFile();
const allowedEnvs = new Set(["local", "dev", "test", "ci"]);
const report = {
  file,
  mode: apply ? "apply" : "dry-run",
  totalRowsRead: 0,
  inserted: 0,
  updated: 0,
  skippedDuplicates: 0,
  verifiedRestored: 0,
  needsReviewRestored: 0,
  countries: {},
  sources: {},
  errors: [],
  warnings: []
};

try {
  if (!file) {
    report.warnings.push("No candidate official medication source/export file found.");
    writeMissingSourceReport();
    printReport();
  } else {
    if (apply) validateApplySafety();
    await restoreFile(file);
    printReport();
  }
  if (report.errors.length) process.exitCode = 1;
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  printReport();
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

async function restoreFile(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".jsonl") return restoreJsonlExport(path);
  if (extension === ".json") return restoreJsonExport(path);
  if ([".csv", ".xlsx", ".xls", ".zip"].includes(extension)) {
    report.errors.push(`${extension} detected but not restored by v0.9.7 orchestrator. Use existing official importer with explicit country/source after owner review.`);
    return;
  }
  report.errors.push(`Unsupported file format: ${extension || "unknown"}`);
}

async function restoreJsonlExport(path) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error("JSONL export is empty.");
  const manifest = JSON.parse(lines[0]);
  if (manifest.type !== "manifest" || manifest.format !== "official-medication-jsonl-v1") {
    throw new Error("JSONL file is not a supported official medication export manifest.");
  }
  const dataText = `${lines.slice(1).join("\n")}\n`;
  if (manifest.sha256 && createHash("sha256").update(dataText).digest("hex") !== manifest.sha256) {
    throw new Error("Export sha256 verification failed.");
  }
  const records = lines.slice(1).map((line) => JSON.parse(line));
  report.totalRowsRead = records.length;
  for (const type of ["DrugMarketCountry", "DrugMarketSource", "DrugMarketProduct", "DrugMarketImportRun", "OfficialMedicationSourceSnapshot", "DrugMarketVariant", "DrugMarketAvailability", "DrugMarketManualReviewQueue", "DrugMarketMergeCandidate"]) {
    for (const record of records.filter((item) => item.type === type)) await dryRunOrUpsert(type, record.data);
  }
}

async function restoreJsonExport(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const records = Array.isArray(parsed) ? parsed : parsed.records ?? parsed.rows ?? [];
  if (!Array.isArray(records) || !records.length) throw new Error("JSON file did not contain supported records/rows.");
  const typed = records.filter((item) => item.type && item.data);
  if (!typed.length) throw new Error("JSON file is not a supported typed official medication export.");
  report.totalRowsRead = typed.length;
  for (const record of typed) await dryRunOrUpsert(record.type, record.data);
}

async function dryRunOrUpsert(type, data) {
  if (type === "DrugMarketVariant") {
    report.countries[data.countryCode ?? "unknown"] = (report.countries[data.countryCode ?? "unknown"] ?? 0) + 1;
    if (data.sourceId) report.sources[data.sourceId] = (report.sources[data.sourceId] ?? 0) + 1;
    if (data.verificationStatus === "verified") report.verifiedRestored += 1;
    else report.needsReviewRestored += 1;
  }
  if (!apply) return;
  if (type === "DrugMarketVariant") return upsertVariant(data);
  const delegate = delegateFor(type);
  if (!delegate?.upsert) return;
  const existing = await delegate.findUnique({ where: { id: data.id } }).catch(() => null);
  await delegate.upsert({ where: { id: data.id }, create: data, update: data });
  existing ? report.updated++ : report.inserted++;
}

async function upsertVariant(data) {
  const existing = await prisma.drugMarketVariant.findUnique({ where: { id: data.id } });
  if (existing?.verificationStatus === "verified" && materiallyDifferent(existing, data)) {
    report.skippedDuplicates++;
    await prisma.drugMarketManualReviewQueue.create({
      data: {
        queueType: "official_data_restore_conflict",
        productId: existing.productId,
        variantId: existing.id,
        status: "open",
        reason: "Verified official medication row differs from v0.9.7 restore payload. Manual review required; verified row was not overwritten."
      }
    });
    return;
  }
  const safeData = { ...data, verificationStatus: data.verificationStatus === "verified" ? "verified" : "needs_review", isDemo: false };
  await prisma.drugMarketVariant.upsert({ where: { id: data.id }, create: safeData, update: safeData });
  existing ? report.updated++ : report.inserted++;
}

function delegateFor(type) {
  return {
    DrugMarketCountry: prisma.drugMarketCountry,
    DrugMarketSource: prisma.drugMarketSource,
    DrugMarketProduct: prisma.drugMarketProduct,
    DrugMarketImportRun: prisma.drugMarketImportRun,
    OfficialMedicationSourceSnapshot: prisma.officialMedicationSourceSnapshot,
    DrugMarketAvailability: prisma.drugMarketAvailability,
    DrugMarketManualReviewQueue: prisma.drugMarketManualReviewQueue,
    DrugMarketMergeCandidate: prisma.drugMarketMergeCandidate
  }[type];
}

function resolveInputFile() {
  if (args.file) return resolve(args.file);
  const dir = resolve(args["source-dir"] ?? "storage/official-medication-exports");
  if (args["auto-latest"] === "true") {
    if (!existsSync(dir)) return null;
    const files = readdirSync(dir).filter((name) => /^official-medication-data-.+\.jsonl$/i.test(name)).map((name) => resolve(dir, name));
    if (!files.length) return null;
    return files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  }
  return null;
}

function validateApplySafety() {
  const appEnv = process.env.APP_ENV || "";
  if (args.confirm !== "RESTORE_OFFICIAL_MEDICATION_REFERENCE_DATA") throw new Error("Apply mode requires --confirm RESTORE_OFFICIAL_MEDICATION_REFERENCE_DATA.");
  if (!allowedEnvs.has(appEnv)) throw new Error(`Apply refused for APP_ENV=${appEnv || "not set"}.`);
  if (!process.env.DATABASE_URL) throw new Error("Apply mode requires DATABASE_URL.");
  if (/(prod|production|primary|live|real|patient|phi)/i.test(process.env.DATABASE_URL) || process.env.NODE_ENV === "production") throw new Error("Apply refused because environment looks production-like.");
}

function materiallyDifferent(existing, incoming) {
  for (const key of ["sourceRowHash", "tradeName", "genericName", "strengthText", "dosageForm", "officialPriceText", "currency", "registrationNumber"]) {
    if (String(existing[key] ?? "") !== String(incoming[key] ?? "")) return true;
  }
  return false;
}

function writeMissingSourceReport() {
  writeFileSync("docs/V0_9_7_MISSING_MEDICATION_SOURCE_REPORT.md", `# v0.9.7 Missing Medication Source Report\n\nNo previous official medication export/source file was found in \`storage/official-medication-exports/\` for automatic restore.\n\nOfficial medication rows cannot be restored locally until an approved local export or owner-provided official source file is available. No fake medication rows were created, and no unverified rows were marked verified.\n`);
}

function printReport() {
  console.log("V097 OFFICIAL MEDICATION RESTORE");
  console.log(JSON.stringify(report, null, 2));
}

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {};
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index++;
    }
  }
  return parsed;
}
