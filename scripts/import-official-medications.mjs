import {
  getSource,
  isSourceGated,
  normalizeOfficialRow,
  parseArgs,
  parseOfficialFile,
  prisma,
  recordBlockedRun,
  rowHash
} from "./official-medication-utils.mjs";
import { createHash } from "node:crypto";

const args = parseArgs();
const countryCode = String(args.country ?? "").toUpperCase();
const source = await getSource(countryCode, args.source);
const mode = args.mode ?? "live";

try {
  if (mode === "upload-required" || source.sourceAccessMode === "official_upload" || source.sourceAccessMode === "gated_manual_required") {
    if (!args.file) {
      const run = await recordBlockedRun(source, "needs_review", "Official owner-provided file is required. No fallback rows were created.");
      console.log(JSON.stringify({ source: source.code, status: run.status, rowsImported: 0, reason: run.message }, null, 2));
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  if (isSourceGated(source) && !args.file) {
    const run = await recordBlockedRun(source, "needs_review", "Source is gated or requires approved API access. No bypass attempted.");
    console.log(JSON.stringify({ source: source.code, status: run.status, rowsImported: 0, reason: run.message }, null, 2));
    await prisma.$disconnect();
    process.exit(0);
  }

  if (!args.file) {
    const run = await recordBlockedRun(source, "failed", "Live public downloader is not configured for this source in v0.8. Use an official CSV/JSON file upload or approved connector.");
    console.log(JSON.stringify({ source: source.code, status: run.status, rowsImported: 0, reason: run.message }, null, 2));
    await prisma.$disconnect();
    process.exit(0);
  }

  const parsed = parseOfficialFile(args.file);
  const now = new Date();
  const run = await prisma.drugMarketImportRun.create({
    data: {
      sourceId: source.id,
      status: "running",
      dryRun: mode === "dry-run",
      sourceFileName: parsed.fileName,
      sourceFileSha256: parsed.fileSha256,
      sourceFetchedAt: now,
      parserName: parserForSource(source, parsed.parserName),
      parserVersion: "v0.8",
      rowCount: parsed.rows.length,
      totalRowsSeen: parsed.rows.length,
      sourceSnapshotJson: { fileName: parsed.fileName, sourceCode: source.code },
      coverageJson: { countryCode, sourceCode: source.code }
    }
  });

  let rowsImported = 0;
  let rowsNeedsReview = 0;
  let rowsSkipped = 0;
  let rowsFailed = 0;
  let confidenceTotal = 0;

  if (mode !== "dry-run") {
    for (const [index, rawRow] of parsed.rows.entries()) {
      try {
        const row = normalizeOfficialRow(rawRow, source.countryCode ?? countryCode);
        if (!row.tradeName && !row.genericName) {
          rowsSkipped += 1;
          continue;
        }
        const product = await upsertProduct(row);
        const variant = await upsertVariant(product.id, row, run.id, source.id);
        if (variant.verificationStatus !== "verified") rowsNeedsReview += 1;
        rowsImported += 1;
        confidenceTotal += row.parserConfidence;
      } catch (error) {
        rowsFailed += 1;
        await prisma.drugMarketImportRowError.create({
          data: {
            jobId: await ensureLegacyJob(source.id, parsed.fileName),
            severity: "warning",
            rowNumber: index + 1,
            message: error instanceof Error ? error.message : "Row import failed.",
            rawRowJson: rawRow,
            parserName: parserForSource(source, parsed.parserName),
            parserConfidence: 0.2,
            suggestedAction: "Review official row mapping."
          }
        });
      }
    }
  }

  await prisma.officialMedicationSourceSnapshot.create({
    data: {
      sourceId: source.id,
      countryCode: source.countryCode ?? countryCode,
      sourceName: source.name,
      sourceUrl: source.officialUrl ?? source.websiteUrl,
      sourceType: source.sourceType,
      fetchedAt: now,
      fileName: parsed.fileName,
      fileSha256: parsed.fileSha256,
      rowCount: parsed.rows.length,
      importRunId: run.id,
      status: rowsFailed ? "needs_review" : "captured",
      metadataJson: { parserName: parserForSource(source, parsed.parserName), dryRun: mode === "dry-run" }
    }
  });

  await prisma.drugMarketImportRun.update({
    where: { id: run.id },
    data: {
      status: rowsFailed ? "needs_review" : "imported",
      message: mode === "dry-run" ? "Dry run completed; no rows written." : "Official file import completed. Rows require review before verification.",
      rowsImported,
      rowsNeedsReview,
      rowsSkipped,
      rowsFailed,
      parserConfidence: rowsImported ? confidenceTotal / rowsImported : null,
      finishedAt: new Date()
    }
  });
  await prisma.drugMarketSource.update({
    where: { id: source.id },
    data: {
      lastCheckedAt: now,
      lastSuccessfulImportAt: rowsImported ? now : source.lastSuccessfulImportAt,
      sourceFreshnessStatus: rowsImported ? "current_checked_today" : "failed",
      coverageStatus: rowsImported ? (rowsNeedsReview ? "needs_review" : "imported") : source.coverageStatus
    }
  });

  console.log(JSON.stringify({ source: source.code, status: rowsFailed ? "needs_review" : "imported", rowsImported, rowsNeedsReview, rowsSkipped, rowsFailed }, null, 2));
} finally {
  await prisma.$disconnect();
}

function parserForSource(source, fallback) {
  return source.importerKey || fallback || "generic-official-file";
}

function searchText(row) {
  return [row.tradeName, row.genericName, row.strengthText, row.dosageForm, row.route, row.packageText, row.registrationNumber, row.atcCode, row.manufacturer, row.marketingCompany].filter(Boolean).join(" ").toLowerCase();
}

async function upsertProduct(row) {
  const tradeName = row.tradeName || row.genericName;
  const existing = await prisma.drugMarketProduct.findFirst({ where: { tradeName, genericName: row.genericName } });
  const data = {
    tradeName,
    genericName: row.genericName,
    normalizedSearchText: searchText(row),
    manufacturer: row.manufacturer,
    marketingCompany: row.marketingCompany,
    verificationStatus: "needs_review",
    isDemo: false,
    dataCompletenessScore: row.parserConfidence,
    latestSourceFetchedAt: new Date()
  };
  return existing ? prisma.drugMarketProduct.update({ where: { id: existing.id }, data }) : prisma.drugMarketProduct.create({ data });
}

async function upsertVariant(productId, row, importRunId, sourceId) {
  const sourceRowHash = rowHash(row.raw, row.countryCode);
  const existing = await prisma.drugMarketVariant.findUnique({ where: { countryCode_sourceRowHash: { countryCode: row.countryCode, sourceRowHash } } });
  if (existing?.verificationStatus === "verified") {
    await prisma.drugMarketManualReviewQueue.create({
      data: { queueType: "verified_row_conflict", productId, variantId: existing.id, reason: "Verified official medication row matched a new import. Manual review required." }
    });
    return existing;
  }
  const data = {
    productId,
    sourceId,
    countryCode: row.countryCode,
    tradeName: row.tradeName || row.genericName,
    genericName: row.genericName,
    strengthText: row.strengthText,
    dosageForm: row.dosageForm,
    route: row.route,
    packageText: row.packageText,
    manufacturer: row.manufacturer,
    marketingCompany: row.marketingCompany,
    registrationNumber: row.registrationNumber,
    legalStatus: row.legalStatus,
    authorizationStatus: row.authorizationStatus,
    atcCode: row.atcCode,
    priceText: row.officialPriceText,
    officialPriceText: row.officialPriceText,
    officialPriceAmount: row.officialPriceAmount,
    currency: row.currency,
    sourceFetchedAt: new Date(),
    importRunId,
    parserConfidence: row.parserConfidence,
    officialRowJson: row.raw,
    sourceRowHash,
    verificationStatus: "needs_review",
    isDemo: false
  };
  return existing ? prisma.drugMarketVariant.update({ where: { id: existing.id }, data }) : prisma.drugMarketVariant.create({ data });
}

let legacyJobId = null;
async function ensureLegacyJob(sourceId, fileName) {
  if (legacyJobId) return legacyJobId;
  const job = await prisma.drugMarketImportJob.create({
    data: { sourceId, status: "needs_review", fileName, rowCount: 0, summaryText: "Official medication import row warnings." }
  });
  legacyJobId = job.id;
  return legacyJobId;
}

