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
    return { ...product, badges: compactCountryBadges(product.availabilities) };
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
    const [sources, realCounts, demoCounts] = await Promise.all([
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
        requiredNextAction: nextActionForSource(source.coverageStatus, source.sourceAccessMode)
      };
    });
  }

  async reviewQueue() {
    const items = await this.prisma.drugMarketManualReviewQueue.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
    const variantIds = items.map((item) => item.variantId).filter((id): id is string => Boolean(id));
    const variants = variantIds.length
      ? await this.prisma.drugMarketVariant.findMany({
          where: { id: { in: variantIds } },
          include: { product: true }
        })
      : [];
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));
    return items.map((item) => {
      const variant = item.variantId ? variantById.get(item.variantId) : null;
      return {
        ...item,
        variant: variant
          ? {
              id: variant.id,
              productId: variant.productId,
              countryCode: variant.countryCode,
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
              productTradeName: variant.product.tradeName
            }
          : null
      };
    });
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
