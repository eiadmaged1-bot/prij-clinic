import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { normalizeMedicationSearch } from "../medications/normalize-medication-search";
import { PrismaService } from "../prisma/prisma.service";
import { DrugMarketBadgeService } from "./drug-market-badge.service";
import { assertAllowedSourcePolicy } from "./source-policy.guard";
import { parseStrengthText } from "./strength-normalizer";

@Injectable()
export class DrugMarketImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly badges: DrugMarketBadgeService
  ) {}

  async previewRows(dto: ImportRowsDto, user: AuthUser) {
    const source = await this.resolveSource(dto.sourceCode);
    assertAllowedSourcePolicy(source);
    const rows = mappedRows(dto);
    if (!rows.length) throw new BadRequestException("The import file does not contain any rows.");
    if (rows.length > 10000) throw new BadRequestException("Dry run is limited to 10,000 rows per batch.");
    const seen = new Set<string>();
    const errors: Array<{ rowNumber: number; message: string }> = [];
    const preview: Array<Record<string, string | null>> = [];
    let duplicateCount = 0;
    for (const [index, row] of rows.entries()) {
      try {
        const normalized = normalizeRow(row, source.importerKey ?? "generic-official-json", source.countryCode ?? row.countryCode);
        if (!normalized.tradeName && !normalized.genericName) throw new Error("Trade name or generic name is required.");
        if (!normalized.countryCode) throw new Error("Country is required.");
        const hash = sourceHash(normalized);
        const databaseDuplicate = await this.prisma.drugMarketVariant.findUnique({ where: { countryCode_sourceRowHash: { countryCode: normalized.countryCode, sourceRowHash: hash } }, select: { id: true } });
        if (seen.has(hash) || databaseDuplicate) duplicateCount += 1;
        seen.add(hash);
        if (preview.length < 20) preview.push({ tradeName: normalized.tradeName || null, genericName: normalized.genericName || null, countryCode: normalized.countryCode, strengthText: normalized.strengthText || null, dosageForm: normalized.dosageForm || null });
      } catch (error) {
        errors.push({ rowNumber: index + 1, message: error instanceof Error ? error.message : "Row validation failed." });
      }
    }
    await this.audit.record({ actorUserId: user.id, action: "drug_market.import_dry_run", resourceType: "drug_market_import_preview", severity: "high", metadataJson: { sourceCode: source.code, rowCount: rows.length, errorCount: errors.length, duplicateCount } });
    return { dryRun: true, rowCount: rows.length, validCount: rows.length - errors.length, errorCount: errors.length, duplicateCount, needsReviewCount: rows.length - errors.length, preview, errors: errors.slice(0, 100) };
  }

  async importRows(dto: ImportRowsDto, user: AuthUser) {
    const source = dto.sourceCode
      ? await this.prisma.drugMarketSource.findUnique({ where: { code: dto.sourceCode } })
      : await this.prisma.drugMarketSource.findUnique({ where: { code: "LOCAL_MANUAL" } });
    if (!source) throw new BadRequestException("Approved source is required.");
    assertAllowedSourcePolicy(source);

    const rows = mappedRows(dto);
    if (!rows.length) throw new BadRequestException("The import file does not contain any rows.");
    if (rows.length > 10000) throw new BadRequestException("Imports are limited to 10,000 rows per batch.");
    const run = await this.prisma.drugMarketImportRun.create({
      data: {
        sourceId: source.id,
        status: "running",
        dryRun: false,
        rowCount: rows.length,
        totalRowsSeen: rows.length,
        sourceUrl: cleanText(dto.sourceUrl),
        sourceFileName: dto.fileName ?? "manual rows",
        sourceFetchedAt: new Date(),
        parserName: source.importerKey ?? "generic-official-json",
        parserVersion: cleanText(dto.sourceVersion) ?? "manual-import-v1",
        createdByUserId: user.id
      }
    });
    const job = await this.prisma.drugMarketImportJob.create({
      data: { sourceId: source.id, importRunId: run.id, status: "imported", fileName: dto.fileName ?? "manual rows", rowCount: rows.length, requestedByUserId: user.id }
    });
    let importedCount = 0;
    let errorCount = 0;
    let needsReviewCount = 0;

    for (const [index, row] of rows.entries()) {
      try {
        const normalized = normalizeRow(row, source.importerKey ?? "generic-official-json", source.countryCode ?? row.countryCode);
        if (!normalized.tradeName && !normalized.genericName) throw new Error("Trade name or generic name is required.");
        if (!normalized.countryCode) throw new Error("Country is required.");
        const product = await upsertProduct(this.prisma, normalized);
        const variant = await upsertVariant(this.prisma, product.id, source.id, run.id, normalized);
        await this.badges.recomputeProduct(product.id);
        importedCount += 1;
        if (variant.verificationStatus !== "verified") needsReviewCount += 1;
      } catch (error) {
        errorCount += 1;
        await this.prisma.drugMarketImportRowError.create({
          data: {
            jobId: job.id,
            severity: "warning",
            rowNumber: index + 1,
            message: error instanceof Error ? error.message : "Import row failed.",
            rawRowJson: row,
            parserName: source.importerKey ?? "generic-official-json",
            parserConfidence: confidenceForRow(row),
            suggestedAction: "Review source row and column mapping."
          }
        });
      }
    }

    const updated = await this.prisma.drugMarketImportJob.update({
      where: { id: job.id },
      data: { importedCount, errorCount, status: errorCount ? "needs_review" : "imported", summaryText: "Imported rows default to review status until verified." },
      include: { errors: true }
    });
    await this.prisma.drugMarketImportRun.update({
      where: { id: run.id },
      data: {
        status: errorCount ? "needs_review" : "imported",
        message: errorCount ? "Import completed with row warnings. Review required." : "Import completed. Rows remain review-gated until verified.",
        parserConfidence: rows.length ? (rows.reduce((sum, row) => sum + confidenceForRow(row), 0) / rows.length) : null,
        rowsImported: importedCount,
        rowsNeedsReview: needsReviewCount,
        rowsFailed: errorCount,
        finishedAt: new Date()
      }
    });
    await this.prisma.drugMarketSource.update({
      where: { id: source.id },
      data: {
        lastCheckedAt: new Date(),
        lastSuccessfulImportAt: importedCount ? new Date() : source.lastSuccessfulImportAt,
        sourceFreshnessStatus: importedCount ? "current_checked_today" : "failed",
        coverageStatus: importedCount ? (errorCount ? "needs_review" : "imported") : "not_imported"
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: errorCount ? "drug_market.import_completed_with_errors" : "drug_market.import_completed",
      resourceType: "drug_market_import_job",
      resourceId: job.id,
      severity: "high",
      metadataJson: { importedCount, errorCount, sourceCode: source.code }
    });

    return updated;
  }

  async archiveImportJob(id: string, user: AuthUser) {
    const job = await this.prisma.drugMarketImportJob.findUnique({ where: { id } });
    if (!job?.importRunId) throw new BadRequestException("This import batch cannot be safely archived.");
    const result = await this.prisma.$transaction(async (tx) => {
      const variants = await tx.drugMarketVariant.updateMany({ where: { importRunId: job.importRunId, verificationStatus: "needs_review" }, data: { verificationStatus: "retired" } });
      await tx.drugMarketImportRun.update({ where: { id: job.importRunId! }, data: { status: "archived", message: "Unverified imported rows were archived. Verified rows were preserved." } });
      await tx.drugMarketImportJob.update({ where: { id }, data: { status: "archived", summaryText: "Unverified rows archived; verified rows preserved." } });
      return { archivedRows: variants.count, preservedVerifiedRows: true };
    });
    await this.audit.record({ actorUserId: user.id, action: "drug_market.import_batch_archived", resourceType: "drug_market_import_job", resourceId: id, severity: "high", metadataJson: result });
    return result;
  }

  async runConnector(connectorId: string, dryRun: boolean, user: AuthUser) {
    const connector = await this.prisma.drugMarketSourceConnector.findUnique({ where: { id: connectorId } });
    if (!connector) throw new BadRequestException("Connector not found.");
    assertAllowedSourcePolicy(connector);
    if (!connector.enabled) throw new BadRequestException("Connector is disabled.");
    const run = await this.prisma.drugMarketImportRun.create({
      data: {
        connectorId,
        sourceId: connector.sourceId,
        dryRun,
        status: "needs_review",
        message: dryRun ? "Dry run completed. No external fetching is implemented in this safe placeholder." : "Connector run recorded. Official import file/API adapter must be configured before fetching.",
        createdByUserId: user.id,
        finishedAt: new Date()
      }
    });
    await this.audit.record({ actorUserId: user.id, action: dryRun ? "drug_market.connector_dry_run" : "drug_market.connector_run", resourceType: "drug_market_import_run", resourceId: run.id, severity: "high" });
    return run;
  }

  private async resolveSource(sourceCode?: string) {
    const source = sourceCode
      ? await this.prisma.drugMarketSource.findUnique({ where: { code: sourceCode } })
      : await this.prisma.drugMarketSource.findUnique({ where: { code: "LOCAL_MANUAL" } });
    if (!source) throw new BadRequestException("Approved source is required.");
    return source;
  }
}

type ImportRowsDto = { sourceCode?: string; rows?: Array<Record<string, string>>; fileName?: string; sourceUrl?: string; sourceVersion?: string; columnMapping?: Record<string, string> };

function mappedRows(dto: ImportRowsDto) {
  const mapping = dto.columnMapping ?? {};
  return (dto.rows ?? []).map((row) => {
    const mapped = { ...row };
    for (const [target, sourceColumn] of Object.entries(mapping)) if (sourceColumn && row[sourceColumn] !== undefined) mapped[target] = String(row[sourceColumn]);
    return mapped;
  });
}

function normalizeRow(row: Record<string, string>, parserName: string, defaultCountry?: string | null) {
  const tradeName = row.tradeName ?? row["Trade Name"] ?? row["Product Name"] ?? "";
  const genericName = row.genericName ?? row["Generic Name"] ?? row["Scientific Name"] ?? row.scientificName ?? row["Active Ingredient"] ?? "";
  const strengthText = row.strengthText ?? row.Strength ?? row["Strength"] ?? row["Strength + Strength Unit"] ?? "";
  const priceText = row.officialPriceText ?? row.priceText ?? row.Price ?? row["Public Price"] ?? row["Selling Price"] ?? row["Price"] ?? null;
  return {
    tradeName: tradeName.trim(),
    genericName: genericName.trim(),
    countryCode: (row.countryCode ?? row.Country ?? defaultCountry ?? "").trim().toUpperCase(),
    strengthText: strengthText.trim(),
    dosageForm: (row.dosageForm ?? row["Dosage Form"] ?? "").trim().toLowerCase(),
    route: (row.route ?? row.Route ?? "").trim().toLowerCase(),
    packageText: row.packageText ?? row.Package ?? row["Package Size"] ?? null,
    manufacturer: row.manufacturer ?? row.Manufacturer ?? null,
    marketingCompany: row.marketingCompany ?? row["Marketing Company"] ?? row["Marketing Authorization Holder"] ?? null,
    registrationNumber: row.registrationNumber ?? row["Register Number"] ?? row["Registration Number"] ?? null,
    legalStatus: row.legalStatus ?? row["Legal Status"] ?? null,
    authorizationStatus: row.authorizationStatus ?? row["Authorization Status"] ?? null,
    atcCode: row.atcCode ?? row["ATC Code"] ?? row["ATC Code1"] ?? row["ATC Code2"] ?? null,
    priceText,
    officialPriceText: priceText,
    officialPriceAmount: parsePriceAmount(priceText),
    currency: row.currency ?? row.Currency ?? inferCurrency(row.countryCode ?? row.Country ?? defaultCountry),
    parserName,
    parserConfidence: confidenceForRow(row),
    rawRowJson: row
  };
}

async function upsertProduct(prisma: PrismaService, row: ReturnType<typeof normalizeRow>) {
  const existing = await prisma.drugMarketProduct.findFirst({ where: { tradeName: row.tradeName || row.genericName, genericName: row.genericName || null } });
  const data = {
    tradeName: row.tradeName || row.genericName,
    genericName: row.genericName || null,
    normalizedSearchText: normalizeMedicationSearch(`${row.tradeName} ${row.genericName} ${row.strengthText} ${row.dosageForm} ${row.atcCode ?? ""} ${row.registrationNumber ?? ""} ${row.manufacturer ?? ""} ${row.marketingCompany ?? ""}`),
    manufacturer: row.manufacturer,
    marketingCompany: row.marketingCompany,
    verificationStatus: "needs_review",
    isDemo: false,
    dataCompletenessScore: row.parserConfidence,
    latestSourceFetchedAt: new Date()
  };
  return existing ? prisma.drugMarketProduct.update({ where: { id: existing.id }, data }) : prisma.drugMarketProduct.create({ data });
}

async function upsertVariant(prisma: PrismaService, productId: string, sourceId: string, importRunId: string, row: ReturnType<typeof normalizeRow>) {
  const sourceRowHash = sourceHash(row);
  const strength = parseStrengthText(row.strengthText);
  const existing = await prisma.drugMarketVariant.findUnique({ where: { countryCode_sourceRowHash: { countryCode: row.countryCode, sourceRowHash } } });
  if (existing?.verificationStatus === "verified") {
    await prisma.drugMarketManualReviewQueue.create({
      data: {
        queueType: "verified_row_conflict",
        productId,
        variantId: existing.id,
        reason: "Official import matched a verified row. Manual review is required before changing verified metadata."
      }
    });
    return existing;
  }
  return prisma.drugMarketVariant.upsert({
    where: { countryCode_sourceRowHash: { countryCode: row.countryCode, sourceRowHash } },
    update: {
      productId,
      sourceId,
      tradeName: row.tradeName || row.genericName,
      genericName: row.genericName || null,
      strengthText: strength.strengthText,
      strengthValue: strength.strengthValue,
      strengthUnit: strength.strengthUnit,
      dosageForm: row.dosageForm || null,
      route: row.route || null,
      packageText: row.packageText,
      manufacturer: row.manufacturer,
      marketingCompany: row.marketingCompany,
      registrationNumber: row.registrationNumber,
      legalStatus: row.legalStatus,
      authorizationStatus: row.authorizationStatus,
      atcCode: row.atcCode,
      priceText: row.priceText,
      officialPriceText: row.officialPriceText,
      officialPriceAmount: row.officialPriceAmount,
      currency: row.currency,
      sourceFetchedAt: new Date(),
      importRunId,
      parserConfidence: row.parserConfidence,
      officialRowJson: row.rawRowJson,
      verificationStatus: "needs_review"
    },
    create: {
      productId,
      sourceId,
      countryCode: row.countryCode,
      tradeName: row.tradeName || row.genericName,
      genericName: row.genericName || null,
      strengthText: strength.strengthText,
      strengthValue: strength.strengthValue,
      strengthUnit: strength.strengthUnit,
      dosageForm: row.dosageForm || null,
      route: row.route || null,
      packageText: row.packageText,
      manufacturer: row.manufacturer,
      marketingCompany: row.marketingCompany,
      registrationNumber: row.registrationNumber,
      legalStatus: row.legalStatus,
      authorizationStatus: row.authorizationStatus,
      atcCode: row.atcCode,
      priceText: row.priceText,
      officialPriceText: row.officialPriceText,
      officialPriceAmount: row.officialPriceAmount,
      currency: row.currency,
      sourceFetchedAt: new Date(),
      importRunId,
      parserConfidence: row.parserConfidence,
      officialRowJson: row.rawRowJson,
      sourceRowHash,
      verificationStatus: "needs_review",
      isDemo: false
    }
  });
}

function sourceHash(row: ReturnType<typeof normalizeRow>) {
  return createHash("sha256")
    .update(`${row.countryCode}|${row.tradeName}|${row.genericName}|${row.strengthText}|${row.dosageForm}|${row.registrationNumber ?? ""}`)
    .digest("hex");
}

function cleanText(value?: string) {
  return value?.trim() || null;
}

function parsePriceAmount(value?: string | null) {
  if (!value) return null;
  const match = String(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? match[0] : null;
}

function inferCurrency(countryCode?: string | null) {
  const code = String(countryCode ?? "").trim().toUpperCase();
  return ({ EG: "EGP", KSA: "SAR", UAE: "AED", QAT: "QAR", KWT: "KWD", BHR: "BHD", OMN: "OMR", YEM: "YER" } as Record<string, string>)[code] ?? null;
}

function confidenceForRow(row: Record<string, string>) {
  const fields = [
    row.tradeName ?? row["Trade Name"] ?? row["Product Name"],
    row.genericName ?? row["Generic Name"] ?? row["Scientific Name"] ?? row.scientificName,
    row.strengthText ?? row.Strength,
    row.dosageForm ?? row["Dosage Form"],
    row.registrationNumber ?? row["Register Number"] ?? row["Registration Number"],
    row.priceText ?? row.Price ?? row["Public Price"] ?? row["Selling Price"]
  ];
  const present = fields.filter((field) => String(field ?? "").trim()).length;
  return Math.min(0.99, 0.35 + present * 0.1);
}
