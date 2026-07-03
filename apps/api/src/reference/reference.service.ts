import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  investigations() {
    return this.prisma.investigationCatalogItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, code: true, name: true, category: true, discipline: true, modality: true, sampleType: true }
    });
  }

  operations() {
    return this.prisma.operationCatalogItem.findMany({
      where: { isActive: true },
      orderBy: [{ isObGyn: "desc" }, { category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        specialty: true,
        bodySystem: true,
        isObGyn: true,
        isSurgical: true,
        reviewStatus: true
      }
    });
  }

  services() {
    return this.prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, code: true, name: true, category: true, price: true, currency: true, reviewStatus: true }
    });
  }

  async medicationReadiness() {
    const [medicationProductRows, officialRows, verifiedRows, needsReviewRows, sourcesPresent, importRuns, openReviewQueue] = await Promise.all([
      this.prisma.medicationProduct.count(),
      this.prisma.drugMarketVariant.count({ where: { isDemo: false } }),
      this.prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "verified" } }),
      this.prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "needs_review" } }),
      this.prisma.drugMarketSource.count(),
      this.prisma.drugMarketImportRun.count(),
      this.prisma.drugMarketManualReviewQueue.count({ where: { status: "open" } })
    ]);
    return {
      medicationProductRows,
      officialRows,
      verifiedRows,
      needsReviewRows,
      sourcesPresent,
      importRuns,
      openReviewQueue,
      status: officialRows > 0 ? "ready_for_review_gated_selection" : "official_source_missing",
      warning: officialRows === 0 ? "Official medication source rows are missing. No fake medication rows are seeded." : null
    };
  }
}
