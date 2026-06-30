import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DrugMarketBadgeService {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeProduct(productId: string) {
    const variants = await this.prisma.drugMarketVariant.groupBy({
      by: ["countryCode"],
      where: { productId, verificationStatus: { not: "retired" } },
      _count: { _all: true }
    });
    const hasEgypt = variants.some((item) => item.countryCode === "EG");
    for (const item of variants) {
      const country = await this.prisma.drugMarketCountry.findUnique({ where: { countryCode: item.countryCode } });
      const showCompactBadge = !hasEgypt && country?.showCompactBadgeByDefault === true;
      await this.prisma.drugMarketAvailability.upsert({
        where: { productId_countryCode: { productId, countryCode: item.countryCode } },
        update: {
          variantCount: item._count._all,
          compactBadgeLabel: showCompactBadge ? country?.compactBadgeLabel : null,
          showCompactBadge
        },
        create: {
          productId,
          countryCode: item.countryCode,
          variantCount: item._count._all,
          compactBadgeLabel: showCompactBadge ? country?.compactBadgeLabel : null,
          showCompactBadge
        }
      });
    }
    return this.prisma.drugMarketAvailability.findMany({ where: { productId }, orderBy: { countryCode: "asc" } });
  }
}
