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
          verificationStatus: "needs_review",
          websiteUrl: dto.websiteUrl ?? null
        }
      })
      .then(async (source) => {
        await this.audit.record({ actorUserId: user.id, action: "drug_market.source_created", resourceType: "drug_market_source", resourceId: source.id, severity: "high" });
        return source;
      });
  }

  updateSource(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.drugMarketSource
      .update({ where: { id }, data: { ...(dto.policyStatus ? { policyStatus: dto.policyStatus } : {}), ...(dto.active !== undefined ? { active: dto.active === "true" } : {}) } })
      .then(async (source) => {
        await this.audit.record({ actorUserId: user.id, action: "drug_market.source_updated", resourceType: "drug_market_source", resourceId: source.id, severity: "high" });
        return source;
      });
  }

  products() {
    return this.prisma.drugMarketProduct.findMany({ include: { variants: true, availabilities: true }, orderBy: { tradeName: "asc" }, take: 100 });
  }

  async product(id: string) {
    const product = await this.prisma.drugMarketProduct.findUnique({ where: { id }, include: { variants: true, availabilities: true } });
    if (!product) throw new BadRequestException("Product not found.");
    return { ...product, badges: compactCountryBadges(product.availabilities) };
  }

  variants(productId?: string) {
    return this.prisma.drugMarketVariant.findMany({ where: productId ? { productId } : {}, orderBy: [{ tradeName: "asc" }, { countryCode: "asc" }], take: 200 });
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

  verifyVariant(id: string, user: AuthUser) {
    return this.updateVariant(id, { verificationStatus: "verified" }, user).then(async (variant) => {
      await this.audit.record({ actorUserId: user.id, action: "drug_market.variant_verified", resourceType: "drug_market_variant", resourceId: variant.id, severity: "high" });
      return variant;
    });
  }

  retireVariant(id: string, user: AuthUser) {
    return this.updateVariant(id, { verificationStatus: "retired" }, user).then(async (variant) => {
      await this.audit.record({ actorUserId: user.id, action: "drug_market.variant_retired", resourceType: "drug_market_variant", resourceId: variant.id, severity: "high" });
      return variant;
    });
  }

  availability(productId: string) {
    return this.prisma.drugMarketAvailability.findMany({ where: { productId }, orderBy: { countryCode: "asc" } });
  }

  recomputeAvailability() {
    return this.prisma.drugMarketProduct.findMany({ select: { id: true } }).then(async (products) => {
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

  coverage() {
    return this.prisma.drugMarketVariant.groupBy({ by: ["countryCode", "verificationStatus"], _count: { _all: true } });
  }

  reviewQueue() {
    return this.prisma.drugMarketManualReviewQueue.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
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
}
