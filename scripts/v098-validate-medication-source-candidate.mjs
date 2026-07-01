import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";
import {
  estimateRows,
  isV097RestoreSupported,
  recommendationForCandidate,
  sampleStructuredRecords,
  summarizeFile
} from "./v098-medication-source-utils.mjs";

const args = parseArgs();
const file = args.file ? resolve(args.file) : null;

if (!file || !existsSync(file)) {
  console.error("Usage: node scripts/v098-validate-medication-source-candidate.mjs --file \"PATH\"");
  process.exit(1);
}

const extension = extname(file).toLowerCase();
const summary = summarizeFile(file, extension);
const records = sampleStructuredRecords(file, extension);
const rowStats = inspectRows(records);
summary.v097RestoreSupported = isV097RestoreSupported(file, extension);
const recommendation = recommendationForCandidate(summary, rowStats);

const report = {
  file: summary.path,
  mode: "dry-run metadata-validation-only",
  extension: summary.extension,
  sizeBytes: summary.sizeBytes,
  modifiedTime: summary.modifiedTime,
  totalRowsEstimate: estimateRows(file, extension),
  likelyNonDemoRows: rowStats.likelyNonDemoRows,
  countries: rowStats.countries,
  sources: rowStats.sources,
  verificationStatuses: rowStats.verificationStatuses,
  duplicateRiskFields: rowStats.duplicateRiskFields,
  detectedColumns: summary.detectedColumns,
  sampleHeaders: summary.sampleHeaders,
  likelyCountrySource: summary.likelyCountrySource,
  artifactKind: summary.artifactKind,
  confidence: summary.confidence,
  mayContainVerificationStatus: summary.mayContainVerificationStatus,
  v097RestoreSupported: summary.v097RestoreSupported,
  recommendation
};

console.log("V098 MEDICATION SOURCE CANDIDATE VALIDATION");
console.log(JSON.stringify(report, null, 2));

function inspectRows(records) {
  const stats = {
    likelyNonDemoRows: 0,
    likelyMedicationRows: 0,
    countries: {},
    sources: {},
    verificationStatuses: {},
    duplicateRiskFields: []
  };

  for (const raw of records) {
    const row = raw?.data && typeof raw.data === "object" ? raw.data : raw;
    if (!row || typeof row !== "object") continue;
    if (row.tradeName || row.genericName || row.registrationNumber || row.sourceRowHash) stats.likelyMedicationRows++;
    if (row.isDemo !== true && row.isDemo !== "true") stats.likelyNonDemoRows++;
    addCount(stats.countries, row.countryCode ?? row.country ?? row.Country);
    addCount(stats.sources, row.sourceName ?? row.sourceId ?? row.source ?? row.Source);
    addCount(stats.verificationStatuses, row.verificationStatus ?? row.verification_status ?? row.status);
  }

  const duplicateRisk = [];
  const first = records.map((raw) => raw?.data && typeof raw.data === "object" ? raw.data : raw).find((row) => row && typeof row === "object") ?? {};
  for (const fieldSet of [
    ["sourceRowHash"],
    ["countryCode", "sourceName", "registrationNumber"],
    ["countryCode", "sourceId", "registrationNumber"],
    ["countryCode", "tradeName", "strengthText", "dosageForm"]
  ]) {
    if (fieldSet.every((field) => Object.prototype.hasOwnProperty.call(first, field))) duplicateRisk.push(fieldSet.join("+"));
  }
  stats.duplicateRiskFields = duplicateRisk;
  return stats;
}

function addCount(target, value) {
  const key = String(value ?? "").trim();
  if (!key) return;
  target[key] = (target[key] ?? 0) + 1;
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
