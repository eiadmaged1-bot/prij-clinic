import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeMedicationSearch } from "./normalize-medication-search";

@Injectable()
export class MedicationSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, take = 25) {
    const normalized = normalizeMedicationSearch(query);
    const contains = normalized || "__empty__";

    const [families, ingredients, products, herbals, marketVariants] = await Promise.all([
      this.prisma.drugFamily.findMany({
        where: { normalizedSearchText: { contains, mode: "insensitive" } },
        take,
        orderBy: { displayName: "asc" }
      }),
      this.prisma.medicationIngredient.findMany({
        where: { normalizedSearchText: { contains, mode: "insensitive" } },
        include: { familyMemberships: { include: { family: true } } },
        take,
        orderBy: { genericName: "asc" }
      }),
      this.prisma.medicationProduct.findMany({
        where: { normalizedSearchText: { contains, mode: "insensitive" } },
        include: { ingredient: { include: { familyMemberships: { include: { family: true } } } } },
        take,
        orderBy: { genericName: "asc" }
      }),
      this.prisma.herbalProduct.findMany({
        where: { normalizedSearchText: { contains, mode: "insensitive" } },
        take,
        orderBy: { commonName: "asc" }
      }),
      this.prisma.drugMarketVariant.findMany({
        where: {
          OR: [
            { tradeName: { contains, mode: "insensitive" } },
            { genericName: { contains, mode: "insensitive" } },
            { strengthText: { contains, mode: "insensitive" } },
            { dosageForm: { contains, mode: "insensitive" } },
            { route: { contains, mode: "insensitive" } },
            { registrationNumber: { contains, mode: "insensitive" } },
            { product: { normalizedSearchText: { contains, mode: "insensitive" } } }
          ]
        },
        include: { product: true },
        take,
        orderBy: { tradeName: "asc" }
      })
    ]);

    return {
      query,
      results: [
        ...families.map((family) => ({
          type: "family",
          id: family.id,
          genericName: null,
          brandName: null,
          tradeName: null,
          family: family.displayName,
          verificationStatus: family.verificationStatus
        })),
        ...ingredients.map((ingredient) => ({
          type: "ingredient",
          id: ingredient.id,
          genericName: ingredient.genericName,
          brandName: null,
          tradeName: null,
          family: ingredient.familyMemberships.map((item) => item.family.displayName).join(", "),
          therapeuticClass: ingredient.therapeuticClass,
          pharmacologicClass: ingredient.pharmacologicClass,
          verificationStatus: ingredient.verificationStatus,
          reviewFlags: {
            pregnancy: ingredient.pregnancyReviewFlag,
            lactation: ingredient.lactationReviewFlag,
            renal: ingredient.renalReviewFlag,
            hepatic: ingredient.hepaticReviewFlag
          }
        })),
        ...products.map((product) => ({
          type: "product",
          id: product.id,
          genericName: product.genericName,
          brandName: product.brandName,
          tradeName: product.brandName,
          family: product.ingredient?.familyMemberships.map((item) => item.family.displayName).join(", ") ?? "",
          route: product.route,
          dosageForm: product.dosageForm,
          strengthText: product.strengthText,
          verificationStatus: product.verificationStatus
        })),
        ...marketVariants.map((variant) => ({
          type: "market_variant",
          id: variant.id,
          productId: variant.productId,
          genericName: variant.genericName ?? variant.product.genericName,
          brandName: null,
          tradeName: variant.tradeName,
          family: variant.product.familyText,
          route: variant.route,
          dosageForm: variant.dosageForm,
          strengthText: variant.strengthText,
          countryCode: variant.countryCode,
          verificationStatus: variant.verificationStatus
        })),
        ...herbals.map((herbal) => ({
          type: "herbal",
          id: herbal.id,
          genericName: herbal.commonName,
          brandName: null,
          tradeName: herbal.commonName,
          family: "herbal/supplement",
          verificationStatus: herbal.verificationStatus,
          reviewFlags: {
            pregnancy: herbal.pregnancyReviewFlag,
            lactation: herbal.lactationReviewFlag
          }
        }))
      ].slice(0, take)
    };
  }
}
