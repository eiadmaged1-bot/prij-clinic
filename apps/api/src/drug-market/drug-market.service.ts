import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { DrugMarketBadgeService } from "./drug-market-badge.service";
import { compactCountryBadges } from "./country-badges";

@Injectable()
export class DrugMarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly badges: DrugMarketBadgeService
  ) {}

  countries() {
    return this.prisma.drugMarketCountry.findMany({ orderBy: { countryCode: "asc" } });
  }

  async updateCountry(id: string, dto: Record<string, string | boolean>, user: AuthUser) {
    const country = await this.prisma.drugMarketCountry.update({
      where: { id },
      data: {
        ...(dto.compactBadgeLabel !== undefined ? { compactBadgeLabel: String(dto.compactBadgeLabel || "") || null } : {}),
        ...(dto.showCompactBadgeByDefault !== undefined ? { showCompactBadgeByDefault: Boolean(dto.showCompactBadgeByDefault) } : {})
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "drug_market.country_updated", resourceType: "drug_market_country", resourceId: country.id, severity: "high" });
    return country;
  }

  sources() {
    return this.prisma.drugMarketSource.findMany({ orderBy: { code: "asc" } });
  }

  createSource(dto: Record<string, string>, user: AuthUser) {
    return this.prisma.drugMarketSource
      .create({
        data: {
          code: dto.code?.trim().toUpperCase() ?? "",
          name: dto.name?.trim() ?? "",
          countryCode: dto.countryCode?.trim().toUpperCase() || null,
          sourceType: dto.sourceType ?? "official_registry",
          policyStatus: dto.policyStatus ?? "approved",
          sourcePolicyStatus: dto.sourcePolicyStatus ?? dto.policyStatus ?? "approved",
          verificationStatus: "needs_review",
          websiteUrl: dto.websiteUrl ?? null,
          officialUrl: dto.officialUrl ?? dto.websiteUrl ?? null,
          sourceAccessMode: dto.sourceAccessMode ?? "official_upload",
          importerKey: dto.importerKey ?? null,
          notes: dto.notes ?? null
        }
      })
      .then(async (source) => {
        await this.audit.record({ actorUserId: user.id, action: "drug_market.source_created", resourceType: "drug_market_source", resourceId: source.id, severity: "high" });
        return source;
      });
  }

  updateSource(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.drugMarketSource
      .update({
        where: { id },
        data: {
          ...(dto.policyStatus ? { policyStatus: dto.policyStatus } : {}),
          ...(dto.sourcePolicyStatus ? { sourcePolicyStatus: dto.sourcePolicyStatus } : {}),
          ...(dto.sourceAccessMode ? { sourceAccessMode: dto.sourceAccessMode } : {}),
          ...(dto.coverageStatus ? { coverageStatus: dto.coverageStatus } : {}),
          ...(dto.sourceFreshnessStatus ? { sourceFreshnessStatus: dto.sourceFreshnessStatus } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
          ...(dto.active !== undefined ? { active: dto.active === "true" } : {})
        }
      })
      .then(async (source) => {
        await this.audit.record({ actorUserId: user.id, action: "drug_market.source_updated", resourceType: "drug_market_source", resourceId: source.id, severity: "high" });
        return source;
      });
  }

  products() {
    const showDemo = process.env.NODE_ENV === "test" || process.env.DEMO_MODE === "true";
    return this.prisma.drugMarketProduct.findMany({
      where: { isDemo: showDemo ? undefined : false },
      include: { variants: { where: { isDemo: showDemo ? undefined : false } }, availabilities: true },
      orderBy: { tradeName: "asc" },
      take: 100
    });
  }

  async product(id: string) {
    const showDemo = process.env.NODE_ENV === "test" || process.env.DEMO_MODE === "true";
    const product = await this.prisma.drugMarketProduct.findUnique({
      where: { id },
      include: {
        variants: { where: { isDemo: showDemo ? undefined : false }, orderBy: [{ countryCode: "asc" }, { tradeName: "asc" }] },
        availabilities: true
      }
    });
    if (!product) throw new BadRequestException("Product not found.");
    const sourceIds = [...new Set(product.variants.map((variant) => variant.sourceId).filter((sourceId): sourceId is string => Boolean(sourceId)))];
    const importRunIds = [...new Set(product.variants.map((variant) => variant.importRunId).filter((runId): runId is string => Boolean(runId)))];
    const [sources, runs] = await Promise.all([
      sourceIds.length ? this.prisma.drugMarketSource.findMany({ where: { id: { in: sourceIds } } }) : [],
      importRunIds.length ? this.prisma.drugMarketImportRun.findMany({ where: { id: { in: importRunIds } } }) : []
    ]);
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const runById = new Map(runs.map((run) => [run.id, run]));
    return {
      ...product,
      variants: product.variants.map((variant) => {
        const source = variant.sourceId ? sourceById.get(variant.sourceId) : null;
        const run = variant.importRunId ? runById.get(variant.importRunId) : null;
        return {
          ...variant,
          sourceCode: source?.code ?? null,
          sourceName: source?.name ?? null,
          sourceFreshnessStatus: source?.sourceFreshnessStatus ?? null,
          latestSourceLabel: source?.latestSourceLabel ?? null,
          latestSourcePublishedAt: source?.latestSourcePublishedAt ?? null,
          sourceFileHash: run?.sourceFileSha256 ?? null,
          sourceFileName: run?.sourceFileName ?? null,
          hasOfficialRowJson: Boolean(variant.officialRowJson),
          officialRowJson: undefined
        };
      }),
      badges: compactCountryBadges(product.availabilities)
    };
  }

  variants(productId?: string) {
    const showDemo = process.env.NODE_ENV === "test" || process.env.DEMO_MODE === "true";
    return this.prisma.drugMarketVariant.findMany({ where: { ...(productId ? { productId } : {}), isDemo: showDemo ? undefined : false }, orderBy: [{ tradeName: "asc" }, { countryCode: "asc" }], take: 200 });
  }

  variant(id: string) {
    return this.prisma.drugMarketVariant.findUniqueOrThrow({ where: { id } });
  }

  async updateVariant(id: string, dto: Record<string, string>, user: AuthUser) {
    const variant = await this.prisma.drugMarketVariant.update({ where: { id }, data: { ...(dto.verificationStatus ? { verificationStatus: dto.verificationStatus } : {}), ...(dto.registrationNumber !== undefined ? { registrationNumber: dto.registrationNumber || null } : {}) } });
    await this.badges.recomputeProduct(variant.productId);
    await this.audit.record({ actorUserId: user.id, action: "drug_market.variant_updated", resourceType: "drug_market_variant", resourceId: variant.id, severity: "high" });
    return variant;
  }

  async verifyVariant(id: string, dto: Record<string, string>, user: AuthUser) {
    const reason = requiredDecisionReason(dto);
    const variant = await this.updateVariant(id, { verificationStatus: "verified" }, user);
    await this.resolveOpenVariantReviewItems(variant.id, "verified", reason);
    await this.audit.record({ actorUserId: user.id, action: "drug_market.variant_verified", resourceType: "drug_market_variant", resourceId: variant.id, severity: "high", reason });
    return variant;
  }

  async rejectVariant(id: string, dto: Record<string, string>, user: AuthUser) {
    const reason = requiredDecisionReason(dto);
    const variant = await this.updateVariant(id, { verificationStatus: "rejected" }, user);
    await this.resolveOpenVariantReviewItems(variant.id, "rejected", reason);
    await this.audit.record({ actorUserId: user.id, action: "drug_market.variant_rejected", resourceType: "drug_market_variant", resourceId: variant.id, severity: "high", reason });
    return variant;
  }

  async retireVariant(id: string, dto: Record<string, string>, user: AuthUser) {
    const reason = requiredDecisionReason(dto);
    const variant = await this.updateVariant(id, { verificationStatus: "retired" }, user);
    await this.resolveOpenVariantReviewItems(variant.id, "retired", reason);
    await this.audit.record({ actorUserId: user.id, action: "drug_market.variant_retired", resourceType: "drug_market_variant", resourceId: variant.id, severity: "high", reason });
    return variant;
  }

  async verifyBatch(dto: { countryCode?: string; sourceCode?: string; limit?: number; reason?: string; confirmation?: string }, user: AuthUser) {
    const reason = requiredDecisionReason({ reason: dto.reason ?? "" });
    const countryCode = String(dto.countryCode ?? "").trim().toUpperCase();
    const sourceCode = String(dto.sourceCode ?? "").trim();
    if (!countryCode) throw new BadRequestException("Country is required for bulk verification.");
    if (!sourceCode) throw new BadRequestException("Source is required for bulk verification.");
    const limit = Math.max(1, Math.min(Number(dto.limit ?? 100) || 100, 1000));
    if (limit > 100 && dto.confirmation !== `VERIFY ${countryCode} ${sourceCode} ${limit}`) {
      throw new BadRequestException("Large verification batches require the confirmation phrase.");
    }
    const source = await this.prisma.drugMarketSource.findUnique({ where: { code: sourceCode } });
    if (!source) throw new BadRequestException("Official source not found.");
    const candidates = await this.prisma.drugMarketVariant.findMany({
      where: {
        countryCode,
        sourceId: source.id,
        isDemo: false,
        verificationStatus: { in: ["needs_review", "imported"] }
      },
      orderBy: [{ tradeName: "asc" }],
      take: 5000
    });
    const duplicateKeys = duplicateRiskKeys(candidates);
    const selected = candidates.filter((variant) => isHighConfidenceOfficialCandidate(variant, duplicateKeys)).slice(0, limit);
    for (const variant of selected) {
      await this.prisma.drugMarketVariant.update({ where: { id: variant.id }, data: { verificationStatus: "verified" } });
      await this.resolveOpenVariantReviewItems(variant.id, "verified", reason);
      await this.badges.recomputeProduct(variant.productId);
      await this.audit.record({
        actorUserId: user.id,
        action: "drug_market.variant_verified",
        resourceType: "drug_market_variant",
        resourceId: variant.id,
        severity: "high",
        reason,
        metadataJson: { countryCode, sourceCode, bulk: true, highConfidenceOnly: true, limit }
      });
    }
    return {
      countryCode,
      sourceCode,
      requestedLimit: limit,
      highConfidenceCandidates: candidates.filter((variant) => isHighConfidenceOfficialCandidate(variant, duplicateKeys)).length,
      verified: selected.length,
      skippedLowConfidenceOrIncomplete: Math.max(0, candidates.length - selected.length)
    };
  }

  availability(productId: string) {
    return this.prisma.drugMarketAvailability.findMany({ where: { productId }, orderBy: { countryCode: "asc" } });
  }

  recomputeAvailability() {
    return this.prisma.drugMarketProduct.findMany({ where: { isDemo: false }, select: { id: true } }).then(async (products) => {
      for (const product of products) await this.badges.recomputeProduct(product.id);
      return { recomputedProducts: products.length };
    });
  }

  importJobs() {
    return this.prisma.drugMarketImportJob.findMany({ include: { errors: true }, orderBy: { createdAt: "desc" }, take: 50 });
  }

  importJob(id: string) {
    return this.prisma.drugMarketImportJob.findUniqueOrThrow({ where: { id }, include: { errors: true } });
  }

  importJobErrors(id: string) {
    return this.prisma.drugMarketImportRowError.findMany({ where: { jobId: id }, orderBy: { rowNumber: "asc" } });
  }

  connectors() {
    return this.prisma.drugMarketSourceConnector.findMany({ orderBy: { code: "asc" } });
  }

  runs() {
    return this.prisma.drugMarketImportRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
  }

  async coverage() {
    const [sources, realCounts, demoCounts, confidenceRows] = await Promise.all([
      this.prisma.drugMarketSource.findMany({ orderBy: [{ countryCode: "asc" }, { code: "asc" }] }),
      this.prisma.drugMarketVariant.groupBy({
        by: ["countryCode", "verificationStatus"],
        where: { isDemo: false },
        _count: { _all: true },
        _avg: { parserConfidence: true }
      }),
      this.prisma.drugMarketVariant.groupBy({
        by: ["countryCode"],
        where: { isDemo: true },
        _count: { _all: true }
      }),
      this.prisma.drugMarketVariant.findMany({
        where: { isDemo: false },
        select: { sourceId: true, parserConfidence: true }
      })
    ]);
    const openReviewItems = await this.prisma.drugMarketManualReviewQueue.findMany({
      where: { queueType: "official_import_review", status: "open" },
      select: { variantId: true }
    });
    const openReviewVariantIds = openReviewItems.map((item) => item.variantId).filter((id): id is string => Boolean(id));
    const reviewVariants = openReviewVariantIds.length
      ? await this.prisma.drugMarketVariant.findMany({ where: { id: { in: openReviewVariantIds }, isDemo: false }, select: { countryCode: true } })
      : [];
    return sources.map((source) => {
      const counts = realCounts.filter((item) => item.countryCode === source.countryCode);
      const demoRows = demoCounts.find((item) => item.countryCode === source.countryCode)?._count._all ?? 0;
      const rowsImported = counts.reduce((sum, item) => sum + item._count._all, 0);
      const rowsNeedsReview = counts.filter((item) => item.verificationStatus === "needs_review" || item.verificationStatus === "imported").reduce((sum, item) => sum + item._count._all, 0);
      const rowsVerified = counts.filter((item) => item.verificationStatus === "verified").reduce((sum, item) => sum + item._count._all, 0);
      const rowsRejected = counts.filter((item) => item.verificationStatus === "rejected").reduce((sum, item) => sum + item._count._all, 0);
      const rowsRetired = counts.filter((item) => item.verificationStatus === "retired").reduce((sum, item) => sum + item._count._all, 0);
      const reviewItemCount = reviewVariants.filter((variant) => variant.countryCode === source.countryCode).length;
      const confidenceValues = counts.map((item) => item._avg.parserConfidence).filter((value): value is number => typeof value === "number");
      const sourceConfidenceRows = confidenceRows.filter((row) => row.sourceId === source.id);
      return {
        sourceId: source.id,
        sourceCode: source.code,
        sourceName: source.name,
        countryCode: source.countryCode,
        officialUrl: source.officialUrl ?? source.websiteUrl,
        sourceAccessMode: source.sourceAccessMode,
        lastCheckedAt: source.lastCheckedAt,
        lastSuccessfulImportAt: source.lastSuccessfulImportAt,
        latestSourcePublishedAt: source.latestSourcePublishedAt,
        latestSourceLabel: source.latestSourceLabel,
        sourceFreshnessStatus: source.sourceFreshnessStatus,
        coverageStatus: source.coverageStatus,
        rowsImported,
        rowsNeedsReview,
        reviewItemCount,
        rowsVerified,
        rowsRejected,
        rowsRetired,
        rowsFailed: 0,
        demoRowsExcluded: demoRows,
        parserConfidenceAverage: confidenceValues.length ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : null,
        parserConfidenceDistribution: {
          gte090: sourceConfidenceRows.filter((row) => Number(row.parserConfidence ?? 0) >= 0.9).length,
          gte080: sourceConfidenceRows.filter((row) => Number(row.parserConfidence ?? 0) >= 0.8).length,
          gte070: sourceConfidenceRows.filter((row) => Number(row.parserConfidence ?? 0) >= 0.7).length,
          gte060: sourceConfidenceRows.filter((row) => Number(row.parserConfidence ?? 0) >= 0.6).length,
          lt060: sourceConfidenceRows.filter((row) => Number(row.parserConfidence ?? 0) < 0.6).length
        },
        requiredNextAction: nextActionForSource(source.coverageStatus, source.sourceAccessMode)
      };
    });
  }

  async reviewQueue(filters: { countryCode?: string; sourceCode?: string; status?: string; confidence?: string; missing?: string; highConfidence?: string } = {}) {
    const status = filters.status?.trim() || undefined;
    const items = await this.prisma.drugMarketManualReviewQueue.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 1000
    });
    const variantIds = items.map((item) => item.variantId).filter((id): id is string => Boolean(id));
    const source = filters.sourceCode ? await this.prisma.drugMarketSource.findUnique({ where: { code: filters.sourceCode } }) : null;
    const variants = variantIds.length
      ? await this.prisma.drugMarketVariant.findMany({
          where: {
            id: { in: variantIds },
            ...(filters.countryCode ? { countryCode: filters.countryCode.trim().toUpperCase() } : {}),
            ...(source?.id ? { sourceId: source.id } : {})
          },
          include: { product: true }
        })
      : [];
    const duplicateKeys = duplicateRiskKeys(variants);
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));
    return items.map((item) => {
      const variant = item.variantId ? variantById.get(item.variantId) : null;
      if (variantIds.length && item.variantId && !variant) return null;
      if (variant && filters.confidence === "low" && Number(variant.parserConfidence ?? 0) >= 0.65) return null;
      if (variant && filters.confidence === "high" && Number(variant.parserConfidence ?? 0) < 0.65) return null;
      if (variant && filters.highConfidence === "true" && !isHighConfidenceOfficialCandidate(variant, duplicateKeys)) return null;
      if (variant && filters.missing && !missingFieldKeys(variant).includes(filters.missing)) return null;
      return {
        ...item,
        highConfidenceCandidate: variant ? isHighConfidenceOfficialCandidate(variant, duplicateKeys) : false,
        missingFields: variant ? missingFieldKeys(variant) : [],
        duplicateRisk: variant ? duplicateKeys.has(duplicateKey(variant)) : false,
        variant: variant
          ? {
              id: variant.id,
              productId: variant.productId,
              countryCode: variant.countryCode,
              sourceId: variant.sourceId,
              importRunId: variant.importRunId,
              tradeName: variant.tradeName,
              genericName: variant.genericName,
              strengthText: variant.strengthText,
              dosageForm: variant.dosageForm,
              route: variant.route,
              packageText: variant.packageText,
              registrationNumber: variant.registrationNumber,
              officialPriceText: variant.officialPriceText,
              officialPriceAmount: variant.officialPriceAmount,
              currency: variant.currency,
              verificationStatus: variant.verificationStatus,
              parserConfidence: variant.parserConfidence,
              sourceFetchedAt: variant.sourceFetchedAt,
              sourcePublishedAt: variant.sourcePublishedAt,
              sourceRowHash: variant.sourceRowHash,
              hasOfficialRowJson: Boolean(variant.officialRowJson),
              productTradeName: variant.product.tradeName
            }
          : null
      };
    }).filter(Boolean);
  }

  resolveReviewQueue(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.drugMarketManualReviewQueue
      .update({ where: { id }, data: { status: "resolved", resolutionNote: dto.note ?? null } })
      .then(async (item) => {
        await this.audit.record({ actorUserId: user.id, action: "drug_market.review_queue_resolved", resourceType: "drug_market_review_queue", resourceId: item.id, severity: "high" });
        return item;
      });
  }

  dismissReviewQueue(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.drugMarketManualReviewQueue
      .update({ where: { id }, data: { status: "dismissed", resolutionNote: dto.note ?? null } })
      .then(async (item) => {
        await this.audit.record({ actorUserId: user.id, action: "drug_market.review_queue_dismissed", resourceType: "drug_market_review_queue", resourceId: item.id, severity: "high" });
        return item;
      });
  }

  mergeCandidates() {
    return this.prisma.drugMarketMergeCandidate.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  }

  dismissMergeCandidate(id: string, user: AuthUser) {
    return this.prisma.drugMarketMergeCandidate.update({ where: { id }, data: { status: "dismissed" } }).then(async (item) => {
      await this.audit.record({ actorUserId: user.id, action: "drug_market.merge_candidate_dismissed", resourceType: "drug_market_merge_candidate", resourceId: item.id, severity: "high" });
      return item;
    });
  }

  private resolveOpenVariantReviewItems(variantId: string, status: string, reason: string) {
    return this.prisma.drugMarketManualReviewQueue.updateMany({
      where: { variantId, status: "open" },
      data: { status, resolutionNote: reason }
    });
  }
}

function nextActionForSource(coverageStatus: string, sourceAccessMode: string) {
  if (coverageStatus === "blocked_requires_api_approval" || sourceAccessMode === "approved_api_required") return "Configure approved official API access or upload an official file.";
  if (coverageStatus === "blocked_requires_official_file" || sourceAccessMode === "official_upload" || sourceAccessMode === "gated_manual_required") return "Upload an owner-provided official or licensed source file.";
  if (coverageStatus === "not_imported") return "Run safe official discovery/import.";
  if (coverageStatus === "needs_review" || coverageStatus === "partial") return "Review imported rows and verify selected records with a reason.";
  return "Monitor freshness and re-import when the official source changes.";
}

function requiredDecisionReason(dto: Record<string, string>) {
  const reason = String(dto.reason ?? dto.note ?? "").trim();
  if (reason.length < 3) throw new BadRequestException("A review decision reason is required.");
  return reason;
}

function isHighConfidenceOfficialCandidate(variant: { verificationStatus: string; tradeName: string | null; genericName: string | null; strengthText?: string | null; dosageForm?: string | null; packageText?: string | null; registrationNumber?: string | null; sourceId: string | null; importRunId: string | null; officialRowJson: unknown; sourceRowHash: string | null; parserConfidence: number | null; }, duplicateKeys: Set<string>) {
  return (
    ["needs_review", "imported"].includes(variant.verificationStatus) &&
    Boolean(variant.tradeName || variant.genericName) &&
    Boolean(variant.sourceId && variant.importRunId && variant.officialRowJson && variant.sourceRowHash) &&
    Boolean(variant.genericName || variant.strengthText || variant.dosageForm || variant.packageText || variant.registrationNumber) &&
    !hasCommerceFieldKey(variant.officialRowJson) &&
    Number(variant.parserConfidence ?? 0) >= 0.65 &&
    !duplicateKeys.has(duplicateKey(variant))
  );
}

function missingFieldKeys(variant: { genericName: string | null; strengthText?: string | null; dosageForm?: string | null; officialPriceAmount?: unknown; officialPriceText?: string | null; priceText?: string | null; registrationNumber?: string | null; sourceId?: string | null; importRunId?: string | null; officialRowJson?: unknown; sourceRowHash?: string | null }) {
  const missing: string[] = [];
  if (!variant.genericName) missing.push("missing_generic");
  if (!variant.strengthText) missing.push("missing_strength");
  if (!variant.dosageForm) missing.push("missing_dosage_form");
  if (!(variant.officialPriceAmount || variant.officialPriceText || variant.priceText)) missing.push("missing_price");
  if (!variant.registrationNumber) missing.push("registration_number_missing");
  if (!variant.sourceId && !variant.importRunId) missing.push("missing_source_metadata");
  if (!variant.officialRowJson) missing.push("missing_official_row_json");
  if (!variant.sourceRowHash) missing.push("missing_source_row_hash");
  return missing;
}

function duplicateRiskKeys(variants: Array<{ countryCode: string; registrationNumber: string | null; tradeName: string | null; genericName: string | null; strengthText?: string | null; dosageForm?: string | null }>) {
  const counts = new Map<string, number>();
  for (const variant of variants) {
    const key = duplicateKey(variant);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function duplicateKey(variant: { countryCode?: string | null; registrationNumber?: string | null; tradeName?: string | null; genericName?: string | null; strengthText?: string | null; dosageForm?: string | null }) {
  return [
    variant.countryCode ?? "",
    variant.registrationNumber ?? "",
    variant.tradeName ?? "",
    variant.genericName ?? "",
    variant.strengthText ?? "",
    variant.dosageForm ?? ""
  ].join("|").toLowerCase();
}

function hasCommerceFieldKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (/^(stock|stockStatus|branchStock|order|checkout|cart|purchase|availability)$/i.test(key)) return true;
    if (nested && typeof nested === "object" && hasCommerceFieldKey(nested)) return true;
  }
  return false;
}
