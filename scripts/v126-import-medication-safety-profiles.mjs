import { readFile } from "node:fs/promises";
import { createPrisma, normalizeName } from "./v121-reference-utils.mjs";

const allowedLegacyCategories = new Set(["A", "B", "C", "D", "X", "N", "UNKNOWN", "REVIEW_REQUIRED"]);
const allowedLactationLevels = new Set(["COMPATIBLE", "CAUTION", "AVOID", "INSUFFICIENT_DATA", "UNKNOWN", "REVIEW_REQUIRED"]);
const allowedSourceTypes = new Set(["official_label", "curated_reference", "guideline", "licensed_database", "manual_review", "not_reviewed"]);
const allowedConfidenceLevels = new Set(["high", "moderate", "low", "unknown"]);
const allowedReviewStatuses = new Set(["reviewed", "needs_review", "imported", "rejected", "retired"]);
const forbiddenFields = new Set(["dose", "dosage", "frequency", "duration", "instructions", "price", "stock", "inventory", "pharmacy", "tradeName", "brandName"]);
const acceptedFields = new Set(["genericName", "legacyPregnancyCategory", "pregnancyRiskSummary", "pregnancyClinicalConsiderations", "pregnancyDataSummary", "lactationRiskLevel", "lactationRiskSummary", "lactationMilkTransferSummary", "lactationInfantEffectsSummary", "lactationClinicalConsiderations", "reproductivePotentialNotes", "sourceName", "sourceUrl", "sourceYear", "sourceType", "confidenceLevel", "reviewStatus"]);

const fileArg = argValue("--file");
const commit = process.argv.includes("--commit");
const inputPath = fileArg ?? "scripts/fixtures/medication-safety/v126-sample.csv";
const prisma = createPrisma();

try {
  const rows = await loadRows(inputPath);
  const preview = await previewRows(rows);
  if (!commit || !fileArg) {
    console.log(`V126-IMPORT-MED-SAFETY-PREVIEW PASS ${JSON.stringify({ inputPath, rows: rows.length, accepted: preview.accepted.length, rejected: preview.rejected.length, warnings: preview.warnings, committed: false })}`);
    process.exit(0);
  }

  let written = 0;
  for (const row of preview.accepted) {
    await prisma.medicationSafetyProfile.upsert({
      where: { medicationGenericId: row.medicationGenericId },
      update: row.data,
      create: { medicationGenericId: row.medicationGenericId, ...row.data }
    });
    written += 1;
  }
  console.log(`V126-IMPORT-MED-SAFETY-COMMIT PASS ${JSON.stringify({ inputPath, accepted: preview.accepted.length, rejected: preview.rejected.length, written, reviewStatus: "needs_review" })}`);
} finally {
  await prisma.$disconnect();
}

async function previewRows(rows) {
  const accepted = [];
  const rejected = [];
  let warnings = 0;
  for (const [index, row] of rows.entries()) {
    const result = await validateRow(row);
    warnings += result.warnings.length;
    if (result.errors.length) {
      rejected.push({ rowNumber: index + 2, errors: result.errors, warnings: result.warnings });
    } else {
      accepted.push(result);
    }
  }
  return { accepted, rejected, warnings };
}

async function validateRow(row) {
  const errors = [];
  const warnings = [];
  for (const key of Object.keys(row)) {
    if (forbiddenFields.has(key)) errors.push(`Forbidden field: ${key}`);
    if (!acceptedFields.has(key)) errors.push(`Unsupported field: ${key}`);
  }
  const genericName = clean(row.genericName);
  if (!genericName) errors.push("genericName is required");
  const categoryInput = String(row.legacyPregnancyCategory || "REVIEW_REQUIRED").trim().toUpperCase();
  const legacyPregnancyCategory = categoryInput === "E" ? "REVIEW_REQUIRED" : categoryInput;
  if (categoryInput === "E") warnings.push("category E mapped to REVIEW_REQUIRED");
  if (!allowedLegacyCategories.has(legacyPregnancyCategory)) errors.push(`Invalid legacyPregnancyCategory: ${categoryInput}`);
  const lactationRiskLevel = String(row.lactationRiskLevel || "REVIEW_REQUIRED").trim().toUpperCase();
  if (!allowedLactationLevels.has(lactationRiskLevel)) errors.push(`Invalid lactationRiskLevel: ${lactationRiskLevel}`);
  const sourceName = clean(row.sourceName) || "Not reviewed";
  if (sourceName === "Not reviewed") warnings.push("missing sourceName forces needs_review");
  const sourceType = clean(row.sourceType) || "not_reviewed";
  if (!allowedSourceTypes.has(sourceType)) errors.push(`Invalid sourceType: ${sourceType}`);
  const confidenceLevel = clean(row.confidenceLevel) || "unknown";
  if (!allowedConfidenceLevels.has(confidenceLevel)) errors.push(`Invalid confidenceLevel: ${confidenceLevel}`);
  const reviewStatus = clean(row.reviewStatus) || "needs_review";
  if (!allowedReviewStatuses.has(reviewStatus)) errors.push(`Invalid reviewStatus: ${reviewStatus}`);
  if (reviewStatus === "reviewed") warnings.push("reviewed input remains needs_review until UI approval");

  const generic = genericName ? await prisma.medicationGeneric.findUnique({ where: { normalizedName: normalizeName(genericName) }, select: { id: true } }) : null;
  if (genericName && !generic && process.argv.includes("--commit")) errors.push("No matching generic medication found");

  return {
    errors,
    warnings,
    medicationGenericId: generic?.id,
    data: {
      legacyPregnancyCategory,
      pregnancyRiskSummary: clean(row.pregnancyRiskSummary),
      pregnancyClinicalConsiderations: clean(row.pregnancyClinicalConsiderations),
      pregnancyDataSummary: clean(row.pregnancyDataSummary),
      lactationRiskLevel,
      lactationRiskSummary: clean(row.lactationRiskSummary),
      lactationMilkTransferSummary: clean(row.lactationMilkTransferSummary),
      lactationInfantEffectsSummary: clean(row.lactationInfantEffectsSummary),
      lactationClinicalConsiderations: clean(row.lactationClinicalConsiderations),
      reproductivePotentialNotes: [clean(row.reproductivePotentialNotes), categoryInput === "E" ? "Imported category E mapped to REVIEW_REQUIRED for doctor review." : null].filter(Boolean).join(" ") || null,
      sourceName,
      sourceUrl: clean(row.sourceUrl),
      sourceYear: row.sourceYear ? Number(row.sourceYear) : null,
      sourceType: sourceName === "Not reviewed" ? "not_reviewed" : sourceType,
      reviewStatus: "needs_review",
      confidenceLevel,
      sourceRefreshStatus: "REVIEW_REQUIRED",
      sourceRefreshNote: warnings.join(" ") || "Imported source row requires Owner/Admin review.",
      reviewedByUserId: null,
      reviewedAt: null
    }
  };
}

async function loadRows(path) {
  const text = await readFile(path, "utf8");
  if (path.toLowerCase().endsWith(".json")) return JSON.parse(text);
  return parseCsv(text);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = splitCsvLine(lines[0] ?? "").map((header) => header.trim());
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, splitCsvLine(line)[index] ?? ""])));
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function clean(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}
