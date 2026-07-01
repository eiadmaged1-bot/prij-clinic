import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
const args = parseArgs();
const apply = args.apply === "true";
const storageReportDir = resolve("storage/official-medication-reimport");
const allowedEnvs = new Set(["local", "dev", "test", "ci"]);
const sourceMap = {
  NHRA: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
  OMAN_MOH: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
  GENERIC: null
};
const countryMap = { BH: "BHR", OM: "OMN", BHR: "BHR", OMN: "OMN" };

export const fieldAliases = {
  tradeName: ["Trade Name", "Product Name", "Brand Name", "Name"],
  genericName: ["Generic Name", "Scientific Name", "Active Ingredient", "Composition"],
  strengthText: ["Strength", "Concentration", "Strength Text"],
  dosageForm: ["Dosage Form", "Pharmaceutical Form", "Form"],
  registrationNumber: ["Registration Number", "Reg No", "Registration No", "License Number"],
  manufacturer: ["Manufacturer", "Marketing Authorization Holder", "Applicant", "Company"],
  authorizationStatus: ["Status", "Authorization Status", "Source", "Country"],
  packageText: ["Package", "Pack", "Pack Size", "Package Size"],
  marketingCompany: ["Marketing Company", "Marketing Authorization Holder", "Applicant", "Company"],
  verificationStatus: ["verificationStatus", "Verification Status", "Project Verification Status"]
};

if (isMain) {
  const prisma = new PrismaClient();
  const report = {
    generatedAt: new Date().toISOString(),
    mode: apply ? "apply" : "dry-run",
    source: args.source ?? null,
    country: args.country ?? null,
    dbCountryCode: countryMap[String(args.country ?? "").toUpperCase()] ?? null,
    file: null,
    parser: null,
    rowsRead: 0,
    rowsMapped: 0,
    inserted: 0,
    merged: 0,
    skippedDuplicates: 0,
    skippedVerifiedConflicts: 0,
    verifiedRowsInSource: 0,
    needsReviewRows: 0,
    warnings: [],
    errors: []
  };

  try {
    if (apply) validateApplySafety();
    const input = resolveInputFile(args);
    if (!input) throw new Error("No source file found. Acquire official files first with medication:v100:source-acquire.");
    report.file = input;
    const parsed = parseOfficialMedicationFile({ file: input, source: args.source ?? "GENERIC", country: args.country });
    report.parser = parsed.parser;
    report.rowsRead = parsed.rowsRead;
    report.rowsMapped = parsed.records.length;
    report.verifiedRowsInSource = parsed.records.filter((row) => row.verificationStatus === "verified").length;
    report.needsReviewRows = parsed.records.filter((row) => row.verificationStatus !== "verified").length;
    if (apply) await importRecords({ prisma, records: parsed.records, report, sourceArg: args.source, dbCountryCode: parsed.dbCountryCode, fileName: basename(input) });
    else report.warnings.push("Dry run only. No DB rows were written.");
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    writeReport(report);
    console.log("V100 OFFICIAL MEDICATION REIMPORT");
    console.log(JSON.stringify(report, null, 2));
    await prisma.$disconnect();
  }
}

export function parseOfficialMedicationFile({ file, source = "GENERIC", country }) {
  const absolute = resolve(file);
  if (!existsSync(absolute)) throw new Error(`Source file not found: ${absolute}`);
  const extension = extname(absolute).toLowerCase();
  if (![".csv", ".xlsx", ".xls", ".json", ".jsonl"].includes(extension)) {
    throw new Error(`${extension || "file"} parsing is not supported by v100 re-import. Convert/extract to CSV, XLSX, JSON, or JSONL after source approval.`);
  }
  const dbCountryCode = countryMap[String(country ?? "").toUpperCase()];
  if (!dbCountryCode) throw new Error("--country must be BH or OM for v100 re-import.");
  const rows = readRows(absolute, extension);
  const parser = parserName(source, extension);
  const records = rows
    .map((row, index) => normalizeOfficialRow({ row, source, dbCountryCode, rowNumber: index + 1 }))
    .filter((record) => record.tradeName);
  return { file: absolute, extension, parser, rowsRead: rows.length, records, dbCountryCode };
}

export function normalizeOfficialRow({ row, source = "GENERIC", dbCountryCode, rowNumber = 0 }) {
  const pick = (field) => pickAlias(row, fieldAliases[field]);
  const tradeName = clean(pick("tradeName"));
  const genericName = clean(pick("genericName"));
  const strengthText = clean(pick("strengthText"));
  const dosageForm = clean(pick("dosageForm"));
  const registrationNumber = clean(pick("registrationNumber"));
  const manufacturer = clean(pick("manufacturer"));
  const marketingCompany = clean(pick("marketingCompany"));
  const authorizationStatus = clean(pick("authorizationStatus"));
  const packageText = clean(pick("packageText"));
  const explicitStatus = clean(pick("verificationStatus")).toLowerCase();
  const verificationStatus = explicitStatus === "verified" ? "verified" : "needs_review";
  const sourceRowHash = computeSourceRowHash({ source, dbCountryCode, tradeName, genericName, strengthText, dosageForm, registrationNumber, row });
  return {
    rowNumber,
    tradeName,
    genericName,
    strengthText,
    dosageForm,
    registrationNumber,
    manufacturer,
    marketingCompany,
    authorizationStatus,
    packageText,
    verificationStatus,
    isDemo: false,
    sourceRowHash,
    officialRowJson: sanitizeOriginalRow(row),
    parserConfidence: parserConfidence({ tradeName, genericName, strengthText, dosageForm, registrationNumber }),
    normalizedSearchText: normalizeSearchText([tradeName, genericName, strengthText, dosageForm, registrationNumber].filter(Boolean).join(" ")),
    dbCountryCode
  };
}

export function computeSourceRowHash(input) {
  const stable = {
    source: input.source,
    countryCode: input.dbCountryCode,
    registrationNumber: clean(input.registrationNumber),
    tradeName: clean(input.tradeName),
    genericName: clean(input.genericName),
    strengthText: clean(input.strengthText),
    dosageForm: clean(input.dosageForm),
    row: sortObject(input.row)
  };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

async function importRecords({ prisma, records, report, sourceArg, dbCountryCode, fileName }) {
  const source = await resolveSource(prisma, sourceArg, dbCountryCode);
  const run = await prisma.drugMarketImportRun.create({
    data: {
      sourceId: source?.id ?? null,
      status: "needs_review",
      startedAt: new Date(),
      finishedAt: new Date(),
      rowCount: records.length,
      totalRowsSeen: records.length,
      rowsImported: 0,
      rowsNeedsReview: records.filter((record) => record.verificationStatus !== "verified").length,
      rowsFailed: 0,
      sourceFileName: fileName,
      sourceFetchedAt: new Date(),
      message: "v0.10.0 official medication re-import; rows default to needs_review unless explicit prior verificationStatus is present.",
      parserVersion: "v100"
    }
  }).catch(() => null);

  for (const record of records) {
    const existing = await findExistingVariant(prisma, record, dbCountryCode);
    if (existing?.verificationStatus === "verified" && materiallyDifferent(existing, record)) {
      report.skippedVerifiedConflicts += 1;
      await prisma.drugMarketManualReviewQueue.create({
        data: {
          queueType: "v100_official_reimport_conflict",
          productId: existing.productId,
          variantId: existing.id,
          status: "open",
          reason: "v0.10.0 official re-import row differs from an existing verified row. Existing verified row was not overwritten."
        }
      });
      continue;
    }
    if (existing) {
      if (existing.sourceRowHash === record.sourceRowHash) {
        report.skippedDuplicates += 1;
        continue;
      }
      await prisma.drugMarketVariant.update({ where: { id: existing.id }, data: variantData(record, source?.id, run?.id) });
      report.merged += 1;
      continue;
    }
    const product = await upsertProduct(prisma, record);
    await prisma.drugMarketVariant.create({ data: { ...variantData(record, source?.id, run?.id), productId: product.id } });
    report.inserted += 1;
  }

  if (run) {
    await prisma.drugMarketImportRun.update({
      where: { id: run.id },
      data: { rowsImported: report.inserted + report.merged, rowsFailed: report.skippedVerifiedConflicts, status: report.skippedVerifiedConflicts ? "needs_review" : "imported" }
    });
  }
  await recomputeAvailability(prisma, dbCountryCode);
}

async function resolveSource(prisma, sourceArg, dbCountryCode) {
  const code = sourceMap[sourceArg] ?? null;
  if (code) {
    const existing = await prisma.drugMarketSource.findUnique({ where: { code } });
    if (existing) return existing;
  }
  return prisma.drugMarketSource.findFirst({ where: { countryCode: dbCountryCode, sourceType: { in: ["official", "official_upload"] } } }).catch(() => null);
}

async function findExistingVariant(prisma, record, dbCountryCode) {
  const byHash = await prisma.drugMarketVariant.findUnique({ where: { countryCode_sourceRowHash: { countryCode: dbCountryCode, sourceRowHash: record.sourceRowHash } } }).catch(() => null);
  if (byHash) return byHash;
  return prisma.drugMarketVariant.findFirst({
    where: {
      countryCode: dbCountryCode,
      tradeName: record.tradeName,
      genericName: record.genericName || null,
      strengthText: record.strengthText || null,
      dosageForm: record.dosageForm || null,
      registrationNumber: record.registrationNumber || null
    }
  });
}

async function upsertProduct(prisma, record) {
  const existing = await prisma.drugMarketProduct.findFirst({
    where: {
      tradeName: record.tradeName,
      genericName: record.genericName || null,
      isDemo: false
    }
  });
  const data = {
    tradeName: record.tradeName,
    genericName: record.genericName || null,
    scientificName: record.genericName || null,
    normalizedSearchText: record.normalizedSearchText,
    manufacturer: record.manufacturer || null,
    marketingCompany: record.marketingCompany || null,
    verificationStatus: record.verificationStatus,
    isDemo: false,
    latestSourceFetchedAt: new Date()
  };
  if (existing) {
    if (existing.verificationStatus === "verified" && record.verificationStatus !== "verified") return existing;
    return prisma.drugMarketProduct.update({ where: { id: existing.id }, data });
  }
  return prisma.drugMarketProduct.create({ data });
}

function variantData(record, sourceId, importRunId) {
  return {
    countryCode: record.dbCountryCode,
    sourceId: sourceId ?? null,
    tradeName: record.tradeName,
    genericName: record.genericName || null,
    strengthText: record.strengthText || null,
    dosageForm: record.dosageForm || null,
    packageText: record.packageText || null,
    manufacturer: record.manufacturer || null,
    marketingCompany: record.marketingCompany || null,
    registrationNumber: record.registrationNumber || null,
    authorizationStatus: record.authorizationStatus || null,
    sourceFetchedAt: new Date(),
    importRunId: importRunId ?? null,
    parserConfidence: record.parserConfidence,
    officialRowJson: record.officialRowJson,
    sourceRowHash: record.sourceRowHash,
    verificationStatus: record.verificationStatus === "verified" ? "verified" : "needs_review",
    isDemo: false
  };
}

async function recomputeAvailability(prisma, countryCode) {
  const grouped = await prisma.drugMarketVariant.groupBy({ by: ["productId"], where: { countryCode, isDemo: false }, _count: { _all: true } });
  for (const row of grouped) {
    await prisma.drugMarketAvailability.upsert({
      where: { productId_countryCode: { productId: row.productId, countryCode } },
      create: { productId: row.productId, countryCode, variantCount: row._count._all, compactBadgeLabel: countryCode, showCompactBadge: true },
      update: { variantCount: row._count._all }
    }).catch(async () => {
      const existing = await prisma.drugMarketAvailability.findFirst({ where: { productId: row.productId, countryCode } });
      if (existing) await prisma.drugMarketAvailability.update({ where: { id: existing.id }, data: { variantCount: row._count._all } });
      else await prisma.drugMarketAvailability.create({ data: { productId: row.productId, countryCode, variantCount: row._count._all, compactBadgeLabel: countryCode, showCompactBadge: true } });
    });
  }
}

function readRows(file, extension) {
  if (extension === ".jsonl") return readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  if (extension === ".json") {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : parsed.rows ?? parsed.records ?? parsed.data ?? parsed.items ?? [];
  }
  if (extension === ".csv") {
    const workbook = XLSX.read(readFileSync(file, "utf8"), { type: "string" });
    return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
  }
  const workbook = XLSX.readFile(file, { cellDates: false });
  const rows = [];
  for (const sheetName of workbook.SheetNames) {
    const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    for (const row of sheetRows) rows.push({ ...row, __sheetName: sheetName });
  }
  return rows;
}

function pickAlias(row, aliases) {
  const entries = Object.entries(row ?? {});
  for (const alias of aliases) {
    const wanted = normalizeHeader(alias);
    const match = entries.find(([key]) => normalizeHeader(key) === wanted);
    if (match) return match[1];
  }
  return "";
}

function parserName(source, extension) {
  if (source === "NHRA") return `nhra-bahrain${extension}`;
  if (source === "OMAN_MOH") return `oman-moh${extension}`;
  return `generic-official-spreadsheet${extension}`;
}

function parserConfidence(record) {
  let score = 0.45;
  if (record.tradeName) score += 0.2;
  if (record.registrationNumber) score += 0.15;
  if (record.genericName) score += 0.08;
  if (record.strengthText) score += 0.06;
  if (record.dosageForm) score += 0.06;
  return Math.min(0.95, Number(score.toFixed(2)));
}

function resolveInputFile(parsedArgs) {
  if (parsedArgs.file) return resolve(parsedArgs.file);
  const dir = resolve(parsedArgs["source-dir"] ?? "storage/official-medication-sources");
  if (!existsSync(dir)) return null;
  const source = String(parsedArgs.source ?? "").toLowerCase();
  const files = require("node:fs").readdirSync(dir)
    .filter((name) => [".csv", ".xlsx", ".xls", ".json", ".jsonl"].includes(extname(name).toLowerCase()))
    .filter((name) => !source || name.toLowerCase().includes(source.replace("_", "-")) || name.toLowerCase().includes(source))
    .map((name) => resolve(dir, name));
  return files.sort((a, b) => require("node:fs").statSync(b).mtimeMs - require("node:fs").statSync(a).mtimeMs)[0] ?? null;
}

function validateApplySafety() {
  const appEnv = process.env.APP_ENV || "";
  if (args.confirm !== "REIMPORT_OFFICIAL_MEDICATIONS") throw new Error("Apply requires --confirm REIMPORT_OFFICIAL_MEDICATIONS.");
  if (!allowedEnvs.has(appEnv)) throw new Error(`Apply refused for APP_ENV=${appEnv || "not set"}.`);
  if (!process.env.DATABASE_URL) throw new Error("Apply requires DATABASE_URL.");
  if (process.env.NODE_ENV === "production" || /(prod|production|primary|live|real|patient|phi)/i.test(process.env.DATABASE_URL)) {
    throw new Error("Apply refused because the environment looks production-like.");
  }
}

function writeReport(report) {
  mkdirSync(storageReportDir, { recursive: true });
  const path = join(storageReportDir, `v100-reimport-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
}

function materiallyDifferent(existing, incoming) {
  for (const key of ["sourceRowHash", "tradeName", "genericName", "strengthText", "dosageForm", "registrationNumber"]) {
    if (String(existing[key] ?? "") !== String(incoming[key] ?? "")) return true;
  }
  return false;
}

function sanitizeOriginalRow(row) {
  const blocked = /(password|secret|token|api[_ -]?key|authorization|patient|dose|frequency|instruction)/i;
  return Object.fromEntries(Object.entries(row ?? {}).filter(([key]) => !blocked.test(key)));
}

function normalizeHeader(value) {
  return String(value ?? "").trim().replace(/^\uFEFF/, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function normalizeSearchText(value) {
  return clean(value).toLowerCase();
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]));
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
