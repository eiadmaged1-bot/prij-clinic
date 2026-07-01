import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const args = parseArgs();
const apply = args.apply === "true";
const file = resolve(args.file ?? "storage/medication-provenance-recovery/official-medication-recovered.jsonl");
const reportDir = resolve("storage/medication-provenance-recovery");
const jsonReport = join(reportDir, "v099-import-report.json");
const mdReport = join(reportDir, "v099-import-report.md");
const allowedEnvs = new Set(["local", "dev", "test", "ci"]);
const report = {
  generatedAt: new Date().toISOString(),
  file,
  mode: apply ? "apply" : "dry-run",
  totalRecords: 0,
  counts: {},
  officialVariants: 0,
  verifiedVariants: 0,
  needsReviewVariants: 0,
  inserted: 0,
  updated: 0,
  skippedVerifiedConflicts: 0,
  warnings: [],
  errors: []
};

try {
  mkdirSync(reportDir, { recursive: true });
  if (!existsSync(file)) throw new Error(`Recovered export file not found: ${file}`);
  if (apply) validateApplySafety();
  const records = readExport(file);
  report.totalRecords = records.length;
  for (const record of records) report.counts[record.type] = (report.counts[record.type] ?? 0) + 1;
  for (const type of importOrder()) {
    for (const record of records.filter((item) => item.type === type)) await dryRunOrImport(type, record.data);
  }
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  writeReports();
  console.log("V099 IMPORT RECOVERED OFFICIAL MEDICATIONS");
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

function readExport(path) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error("Recovered export is empty.");
  const manifest = JSON.parse(lines[0]);
  if (manifest.type !== "manifest" || manifest.format !== "official-medication-jsonl-v1") {
    throw new Error("Recovered export manifest is not supported.");
  }
  const dataText = `${lines.slice(1).join("\n")}\n`;
  if (manifest.sha256 && createHash("sha256").update(dataText).digest("hex") !== manifest.sha256) {
    throw new Error("Recovered export sha256 verification failed.");
  }
  return lines.slice(1).map((line) => JSON.parse(line)).filter((record) => safeTypes().has(record.type));
}

async function dryRunOrImport(type, data) {
  if (!data || typeof data !== "object") return;
  if (type === "DrugMarketVariant") {
    if (data.isDemo === true) {
      report.warnings.push(`Skipped demo variant ${data.id ?? data.sourceRowHash ?? "unknown"}.`);
      return;
    }
    report.officialVariants++;
    if (data.verificationStatus === "verified") report.verifiedVariants++;
    else report.needsReviewVariants++;
  }
  if (!apply) return;
  if (type === "DrugMarketVariant") return importVariant(data);
  const delegate = delegateFor(type);
  if (!delegate?.upsert || !data.id) return;
  const existing = await delegate.findUnique({ where: { id: data.id } }).catch(() => null);
  await delegate.upsert({ where: { id: data.id }, create: data, update: data });
  existing ? report.updated++ : report.inserted++;
}

async function importVariant(data) {
  const safeData = { ...data, isDemo: false, verificationStatus: data.verificationStatus === "verified" ? "verified" : "needs_review" };
  const existing = await prisma.drugMarketVariant.findUnique({ where: { id: safeData.id } });
  if (existing?.verificationStatus === "verified" && materiallyDifferent(existing, safeData)) {
    report.skippedVerifiedConflicts++;
    await prisma.drugMarketManualReviewQueue.create({
      data: {
        queueType: "v099_recovered_official_conflict",
        productId: existing.productId,
        variantId: existing.id,
        status: "open",
        reason: "Recovered official medication row differs from an existing verified row. Existing verified row was not overwritten."
      }
    });
    return;
  }
  await prisma.drugMarketVariant.upsert({ where: { id: safeData.id }, create: safeData, update: safeData });
  existing ? report.updated++ : report.inserted++;
}

function delegateFor(type) {
  return {
    DrugMarketCountry: prisma.drugMarketCountry,
    DrugMarketSource: prisma.drugMarketSource,
    DrugMarketProduct: prisma.drugMarketProduct,
    DrugMarketAvailability: prisma.drugMarketAvailability,
    DrugMarketImportJob: prisma.drugMarketImportJob,
    DrugMarketImportRun: prisma.drugMarketImportRun,
    DrugMarketManualReviewQueue: prisma.drugMarketManualReviewQueue,
    OfficialMedicationSourceSnapshot: prisma.officialMedicationSourceSnapshot,
    DrugMarketMergeCandidate: prisma.drugMarketMergeCandidate,
    MedicationDataSource: prisma.medicationDataSource,
    MedicationDataImportJob: prisma.medicationDataImportJob,
    MedicationIngredient: prisma.medicationIngredient,
    MedicationProduct: prisma.medicationProduct
  }[type];
}

function safeTypes() {
  return new Set(importOrder());
}

function importOrder() {
  return [
    "DrugMarketCountry",
    "DrugMarketSource",
    "DrugMarketProduct",
    "DrugMarketImportJob",
    "DrugMarketImportRun",
    "OfficialMedicationSourceSnapshot",
    "MedicationDataSource",
    "MedicationDataImportJob",
    "MedicationIngredient",
    "MedicationProduct",
    "DrugMarketVariant",
    "DrugMarketAvailability",
    "DrugMarketManualReviewQueue",
    "DrugMarketMergeCandidate"
  ];
}

function validateApplySafety() {
  const appEnv = process.env.APP_ENV || "";
  if (args.confirm !== "IMPORT_RECOVERED_OFFICIAL_MEDICATIONS") throw new Error("Apply requires --confirm IMPORT_RECOVERED_OFFICIAL_MEDICATIONS.");
  if (!allowedEnvs.has(appEnv)) throw new Error(`Apply refused for APP_ENV=${appEnv || "not set"}.`);
  if (!process.env.DATABASE_URL) throw new Error("Apply requires DATABASE_URL.");
  if (process.env.NODE_ENV === "production" || /(prod|production|primary|live|real|patient|phi)/i.test(process.env.DATABASE_URL)) {
    throw new Error("Apply refused because the environment looks production-like.");
  }
}

function materiallyDifferent(existing, incoming) {
  for (const key of ["sourceRowHash", "tradeName", "genericName", "strengthText", "dosageForm", "officialPriceText", "currency", "registrationNumber"]) {
    if (String(existing[key] ?? "") !== String(incoming[key] ?? "")) return true;
  }
  return false;
}

function writeReports() {
  writeFileSync(jsonReport, `${JSON.stringify(report, null, 2)}\n`);
  const lines = [
    "# v0.9.9 Recovered Official Medication Import Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `File: ${report.file}`,
    "",
    "## Counts",
    "",
    `- Total records: ${report.totalRecords}`,
    `- Official variants: ${report.officialVariants}`,
    `- Verified variants: ${report.verifiedVariants}`,
    `- Needs review variants: ${report.needsReviewVariants}`,
    `- Inserted: ${report.inserted}`,
    `- Updated: ${report.updated}`,
    `- Skipped verified conflicts: ${report.skippedVerifiedConflicts}`,
    "",
    "## Safety",
    "",
    "No patient, prescription, encounter, invoice, user credential, secret, or dosing-instruction records are imported by this workflow.",
    "",
    "## Errors",
    "",
    report.errors.length ? report.errors.map((error) => `- ${error}`).join("\n") : "None."
  ];
  writeFileSync(mdReport, `${lines.join("\n")}\n`);
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
