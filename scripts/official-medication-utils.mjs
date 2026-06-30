import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

loadEnvFile(".env");

export const prisma = new PrismaClient();

export const countrySourceDefaults = {
  KSA: "SFDA_DRUGS_LIST",
  EG: "EDA_EGYPTIAN_DRUG_REGISTER",
  UAE: "UAE_MOHAP_REGISTERED_MEDICAL_PRODUCT_DIRECTORY",
  QAT: "QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
  KWT: "KUWAIT_MOH_DRUG_PRICE_LIST",
  BHR: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
  OMN: "OMAN_OFFICIAL_FILE_UPLOAD",
  YEM: "YEMEN_OFFICIAL_FILE_UPLOAD"
};

export const countryCurrency = {
  EG: "EGP",
  KSA: "SAR",
  UAE: "AED",
  QAT: "QAR",
  KWT: "KWD",
  BHR: "BHD",
  OMN: "OMR",
  YEM: "YER"
};

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = "true";
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function loadEnvFile(filePath) {
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

export function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function rowHash(row, countryCode) {
  return createHash("sha256").update(`${countryCode}|${JSON.stringify(row)}`).digest("hex");
}

export function parseOfficialFile(filePath) {
  const absolute = resolve(filePath);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error(`Official source file not found: ${filePath}`);
  const extension = extname(absolute).toLowerCase();
  const buffer = readFileSync(absolute);
  if (extension === ".json") {
    const parsed = JSON.parse(buffer.toString("utf8"));
    return { fileName: basename(absolute), fileSha256: sha256Buffer(buffer), rows: Array.isArray(parsed) ? parsed : parsed.rows ?? [], parserName: "generic-official-json" };
  }
  if (extension === ".csv") {
    const rows = parseCsv(buffer.toString("utf8"));
    return { fileName: basename(absolute), fileSha256: sha256Buffer(buffer), rows, parserName: "generic-official-csv" };
  }
  throw new Error(`${extension || "file"} parsing requires an approved parser/import dependency or pre-converted official CSV/JSON upload.`);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"" && line[index + 1] === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else current += char;
  }
  values.push(current);
  return values;
}

export async function getSource(country, sourceCode) {
  const countryCode = String(country ?? "").toUpperCase();
  const code = sourceCode ?? countrySourceDefaults[countryCode];
  if (!code) throw new Error("Country or source is required.");
  const source = await prisma.drugMarketSource.findUnique({ where: { code } });
  if (!source) throw new Error(`Source not found: ${code}`);
  return source;
}

export function isSourceGated(source) {
  return ["approved_api_required", "gated_manual_required", "unavailable"].includes(source.sourceAccessMode);
}

export async function recordBlockedRun(source, status, message) {
  const now = new Date();
  const run = await prisma.drugMarketImportRun.create({
    data: {
      sourceId: source.id,
      status,
      dryRun: true,
      message,
      rowCount: 0,
      totalRowsSeen: 0,
      rowsSkipped: 0,
      rowsFailed: 0,
      sourceUrl: source.officialUrl ?? source.websiteUrl,
      sourceFetchedAt: now,
      parserName: source.importerKey ?? "official-source-policy",
      parserVersion: "v0.8",
      finishedAt: now,
      coverageJson: { sourceCode: source.code, countryCode: source.countryCode, reason: message }
    }
  });
  await prisma.drugMarketSource.update({
    where: { id: source.id },
    data: {
      lastCheckedAt: now,
      sourceFreshnessStatus: status === "failed" ? "failed" : (source.sourceAccessMode === "approved_api_required" ? "gated" : "manual_required"),
      coverageStatus: status === "failed" ? "failed" : (source.sourceAccessMode === "approved_api_required" ? "blocked_requires_api_approval" : "blocked_requires_official_file"),
      notes: `${source.notes ?? ""}\n${message}`.trim()
    }
  });
  return run;
}

export function normalizeOfficialRow(row, countryCode) {
  const normalizedCountryCode = String(pick(row, ["countryCode", "Country", "Country Code"]) || countryCode || "").toUpperCase();
  const tradeName = pick(row, ["tradeName", "Trade Name", "Product Name", "Medicine Name", "Name", "Brand Name"]);
  const genericName = pick(row, ["genericName", "Generic Name", "Scientific Name", "Active Ingredient", "Ingredient"]);
  const strengthText = pick(row, ["strengthText", "Strength", "Strength Text", "Strength + Strength Unit"]);
  const dosageForm = pick(row, ["dosageForm", "Dosage Form", "Pharmaceutical Form", "Form"]);
  const route = pick(row, ["route", "Route", "Route of Administration"]);
  const packageText = pick(row, ["packageText", "Package", "Pack", "Pack Size", "Package Size"]);
  const registrationNumber = pick(row, ["registrationNumber", "Registration Number", "Register Number", "DRN", "Reg No"]);
  const priceText = pick(row, ["officialPriceText", "priceText", "Price", "Public Price", "Selling Price", "Public Price (KWD)"]);
  return {
    tradeName,
    genericName,
    countryCode: normalizedCountryCode,
    strengthText,
    dosageForm,
    route,
    packageText,
    registrationNumber,
    manufacturer: pick(row, ["manufacturer", "Manufacturer", "Company", "Manufacturer/Company"]),
    marketingCompany: pick(row, ["marketingCompany", "Marketing Company", "MAH", "Agent", "Applicant"]),
    legalStatus: pick(row, ["legalStatus", "Legal Status"]),
    authorizationStatus: pick(row, ["authorizationStatus", "Authorization Status", "Status"]),
    atcCode: pick(row, ["atcCode", "ATC Code", "ATC Code1", "ATC Code2"]),
    officialPriceText: priceText,
    officialPriceAmount: parseAmount(priceText),
    currency: pick(row, ["currency", "Currency"]) || countryCurrency[normalizedCountryCode] || null,
    parserConfidence: confidence({ tradeName, genericName, strengthText, dosageForm, packageText, registrationNumber, priceText }),
    raw: row
  };
}

function pick(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function parseAmount(value) {
  if (!value) return null;
  const match = String(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? match[0] : null;
}

function confidence(fields) {
  const present = Object.values(fields).filter((value) => String(value ?? "").trim()).length;
  return Math.min(0.99, 0.35 + present * 0.08);
}
