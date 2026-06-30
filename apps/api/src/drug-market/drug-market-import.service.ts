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

  async importRows(dto: { sourceCode?: string; rows?: Array<Record<string, string>>; fileName?: string }, user: AuthUser) {
    const source = dto.sourceCode
      ? await this.prisma.drugMarketSource.findUnique({ where: { code: dto.sourceCode } })
      : await this.prisma.drugMarketSource.findUnique({ where: { code: "LOCAL_MANUAL" } });
    if (!source) throw new BadRequestException("Approved source is required.");
    assertAllowedSourcePolicy(source);

    const job = await this.prisma.drugMarketImportJob.create({
      data: { sourceId: source.id, status: "imported", fileName: dto.fileName ?? "manual rows", rowCount: dto.rows?.length ?? 0, requestedByUserId: user.id }
    });
    let importedCount = 0;
    let errorCount = 0;

    for (const [index, row] of (dto.rows ?? []).entries()) {
      try {
        const normalized = normalizeRow(row, source.countryCode ?? row.countryCode);
        if (!normalized.tradeName && !normalized.genericName) throw new Error("Trade name or generic name is required.");
        if (!normalized.countryCode) throw new Error("Country is required.");
        const product = await upsertProduct(this.prisma, normalized);
        await upsertVariant(this.prisma, product.id, source.id, normalized);
        await this.badges.recomputeProduct(product.id);
        importedCount += 1;
      } catch (error) {
        errorCount += 1;
        await this.prisma.drugMarketImportRowError.create({
          data: { jobId: job.id, rowNumber: index + 1, message: error instanceof Error ? error.message : "Import row failed." }
        });
      }
    }

    const updated = await this.prisma.drugMarketImportJob.update({
      where: { id: job.id },
      data: { importedCount, errorCount, status: errorCount ? "needs_review" : "imported", summaryText: "Imported rows default to review status until verified." },
      include: { errors: true }
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
}

function normalizeRow(row: Record<string, string>, defaultCountry?: string | null) {
  const tradeName = row.tradeName ?? row["Trade Name"] ?? row["Product Name"] ?? "";
  const genericName = row.genericName ?? row["Generic Name"] ?? row["Scientific Name"] ?? row.scientificName ?? "";
  const strengthText = row.strengthText ?? row.Strength ?? "";
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
    atcCode: row.atcCode ?? row["ATC Code"] ?? null,
    priceText: row.priceText ?? row.Price ?? null,
    currency: row.currency ?? row.Currency ?? null
  };
}

async function upsertProduct(prisma: PrismaService, row: ReturnType<typeof normalizeRow>) {
  const existing = await prisma.drugMarketProduct.findFirst({ where: { tradeName: row.tradeName || row.genericName, genericName: row.genericName || null } });
  const data = {
    tradeName: row.tradeName || row.genericName,
    genericName: row.genericName || null,
    normalizedSearchText: normalizeMedicationSearch(`${row.tradeName} ${row.genericName} ${row.strengthText} ${row.dosageForm}`),
    verificationStatus: "needs_review"
  };
  return existing ? prisma.drugMarketProduct.update({ where: { id: existing.id }, data }) : prisma.drugMarketProduct.create({ data });
}

async function upsertVariant(prisma: PrismaService, productId: string, sourceId: string, row: ReturnType<typeof normalizeRow>) {
  const sourceRowHash = createHash("sha256")
    .update(`${row.countryCode}|${row.tradeName}|${row.genericName}|${row.strengthText}|${row.dosageForm}|${row.registrationNumber ?? ""}`)
    .digest("hex");
  const strength = parseStrengthText(row.strengthText);
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
      currency: row.currency,
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
      currency: row.currency,
      sourceRowHash,
      verificationStatus: "needs_review"
    }
  });
}
