import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeMedicationSearch } from "../medications/normalize-medication-search";
import { compactCountryBadges } from "./country-badges";

@Injectable()
export class DrugMarketSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: { query?: string; countryCode?: string }, user?: AuthUser) {
    const normalized = normalizeMedicationSearch(params.query ?? "");
    const contains = normalized || "__empty__";
    const products = await this.prisma.drugMarketProduct.findMany({
      where: {
        OR: [
          { normalizedSearchText: { contains, mode: "insensitive" } },
          { tradeName: { contains, mode: "insensitive" } },
          { genericName: { contains, mode: "insensitive" } },
          { variants: { some: { strengthText: { contains, mode: "insensitive" } } } },
          { variants: { some: { dosageForm: { contains, mode: "insensitive" } } } },
          { variants: { some: { countryCode: params.countryCode ?? undefined } } }
        ]
      },
      include: { variants: true, availabilities: true },
      take: 50,
      orderBy: { tradeName: "asc" }
    });

    await this.prisma.drugMarketSearchLog.create({
      data: {
        userId: user?.id,
        query: params.query ?? "",
        normalizedQuery: normalized,
        countryCode: params.countryCode ?? null,
        resultCount: products.length
      }
    });

    return {
      query: params.query ?? "",
      products: products.map((product) => ({
        id: product.id,
        tradeName: product.tradeName,
        genericName: product.genericName,
        scientificName: product.scientificName,
        family: product.familyText,
        verificationStatus: product.verificationStatus,
        badges: compactCountryBadges(product.availabilities),
        variantSummary: product.variants.map((variant) => ({
          id: variant.id,
          countryCode: variant.countryCode,
          strengthText: variant.strengthText,
          dosageForm: variant.dosageForm,
          route: variant.route,
          verificationStatus: variant.verificationStatus
        }))
      }))
    };
  }
}
