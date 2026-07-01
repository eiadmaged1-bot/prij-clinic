import { createHash } from "node:crypto";
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

export const SUPPORTED_EXTENSIONS = new Set([".json", ".jsonl", ".csv", ".xlsx", ".xls", ".zip", ".sql", ".dump", ".backup", ".bak"]);
export const SKIP_DIR_NAMES = new Set(["node_modules", ".git", ".next", "dist", "build", "playwright-report", "test-results"]);
export const EXPECTED_COLUMNS = [
  "tradeName",
  "genericName",
  "countryCode",
  "sourceName",
  "verificationStatus",
  "registrationNumber",
  "strengthText",
  "dosageForm",
  "sourceRowHash",
  "isDemo"
];

export const KEYWORDS = [
  "official medication",
  "official-medication",
  "drug-market",
  "drug_market",
  "medication export",
  "medication-export",
  "restore",
  "Bahrain",
  "NHRA",
  "Oman",
  "MOH",
  "SFDA",
  "Saudi",
  "UAE",
  "EDA",
  "EDDB",
  "Egypt",
  "Qatar",
  "Kuwait",
  "formulary",
  "register",
  "registry",
  "medicine",
  "medicines",
  "drugs",
  "products"
];

const COUNTRY_PATTERNS = [
  ["Bahrain/NHRA", /(^|[^a-z0-9])(bahrain|nhra|bhr)([^a-z0-9]|$)/i],
  ["Oman/MOH", /(^|[^a-z0-9])(oman|moh|omn)([^a-z0-9]|$)/i],
  ["Saudi/SFDA", /(^|[^a-z0-9])(sfda|saudi|ksa)([^a-z0-9]|$)/i],
  ["UAE/MOHAP", /(^|[^a-z0-9])(uae|mohap)([^a-z0-9]|$)|united arab emirates/i],
  ["Egypt/EDA", /(^|[^a-z0-9])(egypt|eda|eddb)([^a-z0-9]|$)/i],
  ["Qatar/MOPH", /(^|[^a-z0-9])(qatar|moph|qat)([^a-z0-9]|$)/i],
  ["Kuwait/MOH", /(^|[^a-z0-9])(kuwait|kwt)([^a-z0-9]|$)/i]
];

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /authorization/i,
  /database_url/i,
  /connection\s*string/i
];

export function shouldSkipDirName(name) {
  return SKIP_DIR_NAMES.has(name);
}

export function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

export function findExpectedColumns(headers) {
  const normalized = new Set(headers.map(normalizeHeader).filter(Boolean));
  return EXPECTED_COLUMNS.filter((column) => normalized.has(normalizeHeader(column)));
}

export function detectKeywords(text) {
  const haystack = String(text ?? "").toLowerCase();
  return KEYWORDS.filter((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function detectLikelySource(text) {
  const matches = COUNTRY_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  return matches.length ? matches.join(", ") : "unknown";
}

export function containsSecretSignal(text) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(String(text ?? "")));
}

export function classifyCandidate({ path = "", extension = "", headers = [], sampleText = "", sizeBytes = 0 }) {
  const combined = `${path}\n${headers.join("\n")}\n${sampleText}`;
  const keywordMatches = detectKeywords(combined);
  const expectedColumns = findExpectedColumns(headers);
  const hasVerificationStatus = expectedColumns.includes("verificationStatus") || /verificationstatus|verification_status|verified|needs_review/i.test(combined);
  const hasOfficialExportManifest = /official-medication-jsonl-v1/i.test(combined);
  const hasTypedDrugMarketExport = /"type"\s*:\s*"DrugMarketVariant"[\s\S]{0,200}"data"\s*:/i.test(combined) || /"data"\s*:[\s\S]{0,200}"type"\s*:\s*"DrugMarketVariant"/i.test(combined);
  const hasDrugMarketShape = hasTypedDrugMarketExport || expectedColumns.includes("sourceRowHash");
  const hasMedicationNames = expectedColumns.includes("tradeName") || expectedColumns.includes("genericName") || /\btrade\s*name\b|\bgeneric\s*name\b/i.test(combined);
  const source = detectLikelySource(combined);
  const lowerExt = extension.toLowerCase();

  let artifactKind = "unknown";
  if ([".dump", ".backup", ".bak"].includes(lowerExt)) artifactKind = "possible DB backup";
  else if (lowerExt === ".sql" && /pg_dump|mysql dump|sqlite_master|copy public\.|insert into .*drugmarket|insert into .*medication/i.test(combined)) artifactKind = "possible DB backup";
  else if (lowerExt !== ".sql" && (hasOfficialExportManifest || hasDrugMarketShape)) artifactKind = "previous app export";
  else if (source !== "unknown" && (hasMedicationNames || /\bregistered medicine\b|\bpharmaceutical products\b|\bformulary\b/i.test(combined))) artifactKind = "raw official source";

  let confidence = "low";
  if (artifactKind === "previous app export" && hasVerificationStatus && (hasOfficialExportManifest || hasDrugMarketShape)) confidence = "high";
  else if (artifactKind === "possible DB backup" && keywordMatches.length >= 2) confidence = "medium";
  else if (artifactKind === "raw official source" && (source !== "unknown" || expectedColumns.length >= 3)) confidence = "medium";
  else if (keywordMatches.length >= 4 && (hasMedicationNames || source !== "unknown")) confidence = "medium";

  if (sizeBytes === 0 && !headers.length && !sampleText) confidence = "low";

  return {
    keywordMatches,
    likelyCountrySource: source,
    confidence,
    mayContainVerificationStatus: hasVerificationStatus,
    artifactKind,
    detectedColumns: expectedColumns
  };
}

export function summarizeFile(path, extension = extname(path).toLowerCase()) {
  const stat = statSync(path);
  const headers = safeReadHeaders(path, extension);
  const sampleText = safeReadSampleText(path, extension);
  const classification = classifyCandidate({ path, extension, headers, sampleText, sizeBytes: stat.size });
  return {
    path: resolve(path),
    extension,
    sizeBytes: stat.size,
    modifiedTime: stat.mtime.toISOString(),
    sha256Prefix: hashPrefix(path),
    sampleHeaders: headers,
    secretSignalInSample: containsSecretSignal(sampleText) || headers.some(containsSecretSignal),
    ...classification
  };
}

export function safeReadSampleText(path, extension, limitBytes = 128 * 1024) {
  if ([".xlsx", ".xls", ".zip", ".dump", ".backup", ".bak"].includes(extension)) return "";
  try {
    return readPrefix(path, limitBytes).toString("utf8");
  } catch {
    return "";
  }
}

export function safeReadHeaders(path, extension) {
  try {
    if (extension === ".jsonl") return jsonlHeaders(path);
    if (extension === ".json") return jsonHeaders(path);
    if (extension === ".csv") return csvHeaders(path);
    if (extension === ".xlsx" || extension === ".xls") return workbookHeaders(path);
  } catch {
    return [];
  }
  return [];
}

export function estimateRows(path, extension) {
  try {
    if (extension === ".jsonl") return Math.max(0, readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).length - 1);
    if (extension === ".json") {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      if (Array.isArray(parsed)) return parsed.length;
      for (const key of ["records", "rows", "data", "items"]) if (Array.isArray(parsed?.[key])) return parsed[key].length;
    }
    if (extension === ".csv") return Math.max(0, readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).length - 1);
    if (extension === ".xlsx" || extension === ".xls") {
      const workbook = XLSX.readFile(path, { sheetRows: 1 });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:A1");
      return Math.max(0, range.e.r);
    }
  } catch {
    return null;
  }
  return null;
}

export function sampleStructuredRecords(path, extension, maxRecords = 500) {
  try {
    if (extension === ".jsonl") {
      return readFileSync(path, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(1, maxRecords + 1)
        .map((line) => JSON.parse(line));
    }
    if (extension === ".json") {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      const records = Array.isArray(parsed) ? parsed : parsed.records ?? parsed.rows ?? parsed.data ?? parsed.items ?? [];
      return Array.isArray(records) ? records.slice(0, maxRecords) : [];
    }
    if (extension === ".csv") {
      const workbook = XLSX.read(readFileSync(path, "utf8"), { type: "string" });
      return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" }).slice(0, maxRecords);
    }
    if (extension === ".xlsx" || extension === ".xls") {
      const workbook = XLSX.readFile(path, { sheetRows: maxRecords + 1 });
      return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" }).slice(0, maxRecords);
    }
  } catch {
    return [];
  }
  return [];
}

export function isV097RestoreSupported(path, extension) {
  if (extension === ".jsonl") {
    try {
      const firstLine = readFileSync(path, "utf8").split(/\r?\n/).find(Boolean);
      const manifest = JSON.parse(firstLine);
      return manifest?.type === "manifest" && manifest?.format === "official-medication-jsonl-v1";
    } catch {
      return false;
    }
  }
  if (extension === ".json") {
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      const records = Array.isArray(parsed) ? parsed : parsed.records ?? parsed.rows ?? [];
      return Array.isArray(records) && records.some((item) => item?.type === "DrugMarketVariant" && item?.data);
    } catch {
      return false;
    }
  }
  return false;
}

export function recommendationForCandidate(summary, rowStats = {}) {
  if ([".sql", ".dump", ".backup", ".bak"].includes(summary.extension)) return "DB_BACKUP_RESTORE_REQUIRED";
  if (!summary.keywordMatches.length && !summary.detectedColumns.length) return "NOT_MEDICATION_DATA";
  if (summary.v097RestoreSupported) return "RESTORE_READY";
  if (summary.artifactKind === "raw official source" || rowStats.likelyMedicationRows > 0) return "NEEDS_MAPPER";
  if (summary.artifactKind === "previous app export") return "NEEDS_MAPPER";
  if (summary.extension === ".zip") return "UNSUPPORTED";
  return "NOT_MEDICATION_DATA";
}

function jsonlHeaders(path) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  for (const line of lines.slice(0, 25)) {
    const parsed = JSON.parse(line);
    const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
    const headers = Object.keys(data ?? {});
    if (headers.length) return headers;
  }
  return [];
}

function jsonHeaders(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const rows = Array.isArray(parsed) ? parsed : parsed.records ?? parsed.rows ?? parsed.data ?? parsed.items ?? [];
  if (Array.isArray(rows) && rows.length) {
    const first = rows[0]?.data && typeof rows[0].data === "object" ? rows[0].data : rows[0];
    return Object.keys(first ?? {});
  }
  if (parsed && typeof parsed === "object") return Object.keys(parsed);
  return [];
}

function csvHeaders(path) {
  const firstLine = readFileSync(path, "utf8").split(/\r?\n/).find(Boolean) ?? "";
  return parseCsvLine(firstLine);
}

function workbookHeaders(path) {
  const workbook = XLSX.readFile(path, { sheetRows: 1 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  return (rows[0] ?? []).map(String).filter(Boolean);
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index++;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function hashPrefix(path) {
  if (!existsSync(path)) return null;
  return createHash("sha256").update(readPrefix(path, 1024 * 1024)).digest("hex").slice(0, 16);
}

export function reportSafePath(path) {
  return resolve(path);
}

export function displayName(path) {
  return basename(path);
}

function readPrefix(path, limitBytes) {
  const fd = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(limitBytes);
    const bytesRead = readSync(fd, buffer, 0, limitBytes, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    closeSync(fd);
  }
}
