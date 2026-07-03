import { readFile } from "node:fs/promises";
import { createPrisma, normalizeName } from "./v121-reference-utils.mjs";

const allowedLegacyCategories = new Set(["A", "B", "C", "D", "X", "N", "UNKNOWN", "REVIEW_REQUIRED"]);
const allowedLactationLevels = new Set(["COMPATIBLE", "CAUTION", "AVOID", "INSUFFICIENT_DATA", "UNKNOWN", "REVIEW_REQUIRED"]);
const allowedSourceTypes = new Set(["official_label", "curated_reference", "guideline", "licensed_database", "manual_review", "not_reviewed"]);
const allowedReviewStatuses = new Set(["reviewed", "needs_review", "imported", "retired"]);
const allowedConfidenceLevels = new Set(["high", "moderate", "low", "unknown"]);
const forbiddenFields = new Set([
  "dose",
  "dosage",
  "frequency",
  "duration",
  "instructions",
  "price",
  "priceText",
  "stock",
  "inventory",
  "pharmacy",
  "tradeName",
  "brandName",
  "manufacturer",
  "packageText"
]);
const acceptedFields = new Set([
  "medicationGenericId",
  "genericName",
  "legacyPregnancyCategory",
  "pregnancyRiskSummary",
  "pregnancyClinicalConsiderations",
  "pregnancyDataSummary",
  "trimesterNotesJson",
  "lactationRiskLevel",
  "lactationRiskSummary",
  "lactationMilkTransferSummary",
  "lactationInfantEffectsSummary",
  "lactationClinicalConsiderations",
  "reproductivePotentialNotes",
  "sourceName",
  "sourceUrl",
  "sourceYear",
  "sourceType",
  "reviewStatus",
  "confidenceLevel",
  "reviewedByUserId",
  "reviewedAt"
]);

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run db:v123:import:med-safety-profiles -- path/to/owner-provided.csv|json");
  process.exit(1);
}

const prisma = createPrisma();

try {
  const rows = await loadRows(inputPath);
  let imported = 0;
  let mappedCategoryE = 0;
  let skipped = 0;

  for (const row of rows) {
    validateFields(row);
    if (!row.sourceName || !row.reviewStatus) {
      throw new Error("Each profile row must include sourceName and reviewStatus.");
    }

    const generic = await resolveGeneric(row);
    if (!generic) {
      skipped += 1;
      continue;
    }

    const categoryInput = String(row.legacyPregnancyCategory || "REVIEW_REQUIRED").trim().toUpperCase();
    const category = categoryInput === "E" ? "REVIEW_REQUIRED" : categoryInput;
    if (categoryInput === "E") mappedCategoryE += 1;
    if (!allowedLegacyCategories.has(category)) throw new Error(`Invalid legacyPregnancyCategory: ${categoryInput}`);

    const lactationRiskLevel = String(row.lactationRiskLevel || "REVIEW_REQUIRED").trim().toUpperCase();
    if (!allowedLactationLevels.has(lactationRiskLevel)) throw new Error(`Invalid lactationRiskLevel: ${lactationRiskLevel}`);

    const sourceType = String(row.sourceType || "not_reviewed").trim();
    const reviewStatus = String(row.reviewStatus).trim();
    const confidenceLevel = String(row.confidenceLevel || "unknown").trim();
    if (!allowedSourceTypes.has(sourceType)) throw new Error(`Invalid sourceType: ${sourceType}`);
    if (!allowedReviewStatuses.has(reviewStatus)) throw new Error(`Invalid reviewStatus: ${reviewStatus}`);
    if (!allowedConfidenceLevels.has(confidenceLevel)) throw new Error(`Invalid confidenceLevel: ${confidenceLevel}`);

    const data = {
      medicationGenericId: generic.id,
      legacyPregnancyCategory: category,
      pregnancyRiskSummary: clean(row.pregnancyRiskSummary),
      pregnancyClinicalConsiderations: clean(row.pregnancyClinicalConsiderations),
      pregnancyDataSummary: clean(row.pregnancyDataSummary),
      trimesterNotesJson: parseJson(row.trimesterNotesJson),
      lactationRiskLevel,
      lactationRiskSummary: clean(row.lactationRiskSummary),
      lactationMilkTransferSummary: clean(row.lactationMilkTransferSummary),
      lactationInfantEffectsSummary: clean(row.lactationInfantEffectsSummary),
      lactationClinicalConsiderations: clean(row.lactationClinicalConsiderations),
      reproductivePotentialNotes: joinNotes(clean(row.reproductivePotentialNotes), categoryInput === "E" ? "Imported category E mapped to REVIEW_REQUIRED for doctor review." : null),
      sourceName: clean(row.sourceName) || "Not reviewed",
      sourceUrl: clean(row.sourceUrl),
      sourceYear: row.sourceYear ? Number(row.sourceYear) : null,
      sourceType,
      reviewStatus: sourceType === "not_reviewed" || !clean(row.sourceName) ? "needs_review" : reviewStatus,
      confidenceLevel,
      reviewedByUserId: clean(row.reviewedByUserId),
      reviewedAt: row.reviewedAt ? new Date(String(row.reviewedAt)) : null
    };

    await prisma.medicationSafetyProfile.upsert({
      where: { medicationGenericId: generic.id },
      update: data,
      create: data
    });
    imported += 1;
  }

  console.log(`V123-IMPORT-MED-SAFETY-PROFILES PASS ${JSON.stringify({ inputPath, rows: rows.length, imported, skipped, mappedCategoryE })}`);
} finally {
  await prisma.$disconnect();
}

async function loadRows(path) {
  const text = await readFile(path, "utf8");
  if (path.toLowerCase().endsWith(".json")) {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("JSON input must be an array of profile rows.");
    return data;
  }
  if (!path.toLowerCase().endsWith(".csv")) {
    throw new Error("Only owner-provided CSV or JSON inputs are accepted.");
  }
  return parseCsv(text);
}

function parseCsv(text) {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length);
  if (!rows.length) return [];
  const headers = splitCsvLine(rows[0]).map((header) => header.trim());
  return rows.slice(1).map((line) => {
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
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function validateFields(row) {
  for (const key of Object.keys(row)) {
    if (forbiddenFields.has(key)) throw new Error(`Forbidden medication safety profile field: ${key}`);
    if (!acceptedFields.has(key)) throw new Error(`Unsupported medication safety profile field: ${key}`);
  }
}

async function resolveGeneric(row) {
  if (row.medicationGenericId) {
    return prisma.medicationGeneric.findUnique({ where: { id: String(row.medicationGenericId) }, select: { id: true } });
  }
  if (!row.genericName) throw new Error("Each row must include medicationGenericId or genericName.");
  return prisma.medicationGeneric.findUnique({
    where: { normalizedName: normalizeName(row.genericName) },
    select: { id: true }
  });
}

function clean(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseJson(value) {
  const text = clean(value);
  return text ? JSON.parse(text) : null;
}

function joinNotes(...notes) {
  return notes.filter(Boolean).join(" ");
}
