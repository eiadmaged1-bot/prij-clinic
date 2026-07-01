import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import {
  estimateRows,
  isV097RestoreSupported,
  recommendationForCandidate,
  sampleStructuredRecords,
  summarizeFile
} from "./v098-medication-source-utils.mjs";

export const INBOX_DIR = resolve("storage/official-medication-inbox");
export const V099_SUPPORTED_EXTENSIONS = new Set([".json", ".jsonl", ".csv", ".xlsx", ".xls", ".zip"]);
export const USABLE_RECOMMENDATIONS = new Set(["RESTORE_READY", "NEEDS_MAPPER"]);

export function ensureInbox() {
  if (!existsSync(INBOX_DIR)) mkdirSync(INBOX_DIR, { recursive: true });
}

export function scanInbox() {
  ensureInbox();
  const files = readdirSync(INBOX_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => resolve(INBOX_DIR, entry.name))
    .filter((path) => path !== resolve(INBOX_DIR, ".gitkeep"))
    .sort((a, b) => a.localeCompare(b));

  return files.map(scanFile);
}

export function scanFile(path) {
  const extension = extname(path).toLowerCase();
  const stat = statSync(path);

  if (!V099_SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      path: resolve(path),
      size: stat.size,
      modifiedTime: stat.mtime.toISOString(),
      extension: extension || "none",
      likelySourceCountry: "unknown",
      headersOnly: [],
      detectedColumns: [],
      recommendation: "UNSUPPORTED",
      reason: "Unsupported extension for v0.9.9 inbox intake."
    };
  }

  const summary = summarizeFile(path, extension);
  const records = sampleStructuredRecords(path, extension);
  const rowStats = inspectRows(records);
  summary.v097RestoreSupported = isV097RestoreSupported(path, extension);

  return {
    path: summary.path,
    size: summary.sizeBytes,
    modifiedTime: summary.modifiedTime,
    extension: summary.extension,
    likelySourceCountry: summary.likelyCountrySource,
    headersOnly: summary.sampleHeaders,
    detectedColumns: summary.detectedColumns,
    recommendation: recommendationForCandidate(summary, rowStats),
    artifactKind: summary.artifactKind,
    confidence: summary.confidence,
    mayContainVerificationStatus: summary.mayContainVerificationStatus,
    v097RestoreSupported: summary.v097RestoreSupported,
    totalRowsEstimate: estimateRows(path, extension)
  };
}

export function findUsableCandidates(results) {
  return results.filter((item) => USABLE_RECOMMENDATIONS.has(item.recommendation));
}

export function findRestoreReadyCandidates(results) {
  return results.filter((item) => item.recommendation === "RESTORE_READY");
}

export function parseArgs(argv = process.argv.slice(2)) {
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

function inspectRows(records) {
  const stats = { likelyMedicationRows: 0 };
  for (const raw of records) {
    const row = raw?.data && typeof raw.data === "object" ? raw.data : raw;
    if (!row || typeof row !== "object") continue;
    if (row.tradeName || row.genericName || row.registrationNumber || row.sourceRowHash) stats.likelyMedicationRows++;
  }
  return stats;
}
