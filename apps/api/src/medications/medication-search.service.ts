import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeMedicationSearch } from "./normalize-medication-search";

@Injectable()
export class MedicationSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, take = 25) {
    const normalized = normalizeMedicationSearch(query);
    const contains = normalized || "__empty__";

    const [generics, families, ingredients, products, herbals, marketTradeVariants, marketOtherVariants] = await Promise.all([
      this.prisma.medicationGeneric.findMany({
        where: normalized
          ? {
              OR: [
                { normalizedName: { contains, mode: "insensitive" } },
                { genericName: { contains, mode: "insensitive" } },
                { familyName: { contains, mode: "insensitive" } },
                { className: { contains, mode: "insensitive" } },
                { pharmacologicClass: { contains, mode: "insensitive" } },
                { aliasesScoped: { some: { normalizedAlias: { contains, mode: "insensitive" }, status: "active" } } }
              ]
            }
          : { normalizedName: "__empty__" },
        include: { tags: { include: { tag: true } }, safetyProfile: true, aliasesScoped: { where: { status: "active" } } },
        orderBy: { genericName: "asc" },
        take: take * 4
      }),
      this.prisma.drugFamily.findMany({
        where: { normalizedSearchText: { contains, mode: "insensitive" }, genericMemberships: { some: {} } },
        take,
        orderBy: { displayName: "asc" }
      }),
      this.prisma.medicationIngredient.findMany({
        where: { OR: [{ normalizedSearchText: { contains, mode: "insensitive" } }, { therapeuticClass: { contains, mode: "insensitive" } }, { pharmacologicClass: { contains, mode: "insensitive" } }, { atcCode: { contains, mode: "insensitive" } }] },
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
          isDemo: false,
          OR: [
            { tradeName: { startsWith: contains, mode: "insensitive" } },
            { product: { tradeName: { startsWith: contains, mode: "insensitive" } } }
          ]
        },
        include: { product: true },
        take: Math.max(take * 2, 300),
        orderBy: { tradeName: "asc" }
      }),
      this.prisma.drugMarketVariant.findMany({
        where: {
          isDemo: false,
          OR: [
            { tradeName: { contains, mode: "insensitive" } },
            { genericName: { contains, mode: "insensitive" } },
            { strengthText: { contains, mode: "insensitive" } },
            { dosageForm: { contains, mode: "insensitive" } },
            { route: { contains, mode: "insensitive" } },
            { registrationNumber: { contains, mode: "insensitive" } },
            { countryCode: { contains, mode: "insensitive" } },
            { product: { normalizedSearchText: { contains, mode: "insensitive" } } }
          ]
        },
        include: { product: true },
        take: take * 4,
        orderBy: { tradeName: "asc" }
      })
    ]);
    const marketVariants = [...new Map([...marketTradeVariants, ...marketOtherVariants].map((variant) => [variant.id, variant])).values()];

    const matchingGenerics = generics.filter((generic) => {
      const searchText = normalizeMedicationSearch([
        generic.genericName,
        generic.familyName,
        generic.className,
        generic.pharmacologicClass,
        generic.parentClass,
        ...(Array.isArray(generic.aliases) ? generic.aliases.map(String) : []),
        ...generic.aliasesScoped.map((alias) => alias.alias),
        ...generic.tags.flatMap((membership) => [membership.tag.name, ...(Array.isArray(membership.tag.aliases) ? membership.tag.aliases.map(String) : [])])
      ].filter(Boolean).join(" "));
      return normalized.length >= 2 && searchText.includes(normalized);
    });

    const tradeKeys = [...new Set(marketVariants.map((variant) => normalizeMedicationSearch(variant.product.tradeName)))];
    const linkedAliases = tradeKeys.length
      ? await this.prisma.medicationAlias.findMany({
          where: { normalizedAlias: { in: tradeKeys }, status: "active", scopeType: "SOURCE_MARKET" },
          include: { medication: { select: { id: true, genericName: true, isActive: true, reviewStatus: true } } }
        })
      : [];
    const linksByTrade = new Map<string, typeof linkedAliases>();
    for (const alias of linkedAliases) {
      const current = linksByTrade.get(alias.normalizedAlias) ?? [];
      current.push(alias);
      linksByTrade.set(alias.normalizedAlias, current);
    }

    const results = [
        ...matchingGenerics.map((generic) => ({
          type: "generic_medication",
          id: generic.id,
          genericName: generic.genericName,
          brandName: null,
          tradeName: null,
          family: generic.familyName,
          className: generic.className,
          pharmacologicClass: generic.pharmacologicClass,
          verificationStatus: generic.reviewStatus,
          source: generic.sourceType,
          reviewStatus: generic.safetyProfile?.reviewStatus ?? generic.reviewStatus,
          lastReviewed: generic.safetyProfile?.reviewedAt ?? generic.safetyProfile?.lastCheckedAt ?? null,
          prescriptionEligible: generic.isActive,
          linkedTradeNames: generic.aliasesScoped.filter((alias) => alias.scopeType === "SOURCE_MARKET").slice(0, 8).map((alias) => alias.alias),
          pregnancyProfile: generic.safetyProfile?.legacyPregnancyCategory ?? null,
          lactationProfile: generic.safetyProfile?.lactationRiskLevel ?? null
        })),
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
        ...marketVariants.map((variant) => {
          const links = linksByTrade.get(normalizeMedicationSearch(variant.product.tradeName)) ?? [];
          const linkedGenerics = [...new Map(links.map((link) => [link.medication.id, link.medication])).values()];
          return {
            type: "market_variant",
            id: variant.id,
            productId: variant.productId,
            genericName: linkedGenerics.length ? linkedGenerics.map((item) => item.genericName).join(" + ") : variant.genericName ?? variant.product.genericName,
            genericIds: linkedGenerics.map((item) => item.id),
            linkedGenericId: linkedGenerics.length === 1 ? linkedGenerics[0]!.id : null,
            brandName: null,
            tradeName: variant.tradeName,
            tradeNameArabic: jsonText(variant.officialRowJson, "commercial_name_ar"),
            family: variant.product.familyText,
            manufacturer: variant.manufacturer ?? variant.product.manufacturer,
            route: variant.route,
            dosageForm: variant.dosageForm,
            strengthText: variant.strengthText,
            countryCode: variant.countryCode,
            source: variant.sourceId ? "Egyptian Drug Database" : null,
            lastReviewed: variant.updatedAt,
            mappingStatus: linkedGenerics.length ? "mapping_confirmed" : "mapping_under_review",
            clinicalProfileAvailable: linkedGenerics.some((item) => item.isActive && item.reviewStatus === "reviewed"),
            verificationStatus: linkedGenerics.length ? "mapping_confirmed" : "mapping_under_review"
          };
        }),
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
      ];
    return {
      query,
      results: results
        .map((result) => ({ result, score: rankResult(result, normalized) }))
        .sort((left, right) => right.score - left.score || displayName(left.result).localeCompare(displayName(right.result)))
        .slice(0, take)
        .map(({ result }) => result)
    };
  }
}

function jsonText(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = (value as Record<string, unknown>)[key];
  return candidate === undefined || candidate === null ? null : String(candidate);
}

function displayName(result: { tradeName?: string | null; genericName?: string | null; family?: string | null }) {
  return result.tradeName ?? result.genericName ?? result.family ?? "";
}

function rankResult(result: { type: string; tradeName?: string | null; tradeNameArabic?: string | null; genericName?: string | null; brandName?: string | null; family?: string | null; className?: string | null; manufacturer?: string | null; mappingStatus?: string | null }, query: string) {
  if (!query) return 0;
  const trade = normalizeMedicationSearch(result.tradeName ?? result.brandName ?? "");
  const arabic = normalizeMedicationSearch(result.tradeNameArabic ?? "");
  const generic = normalizeMedicationSearch(result.genericName ?? "");
  const family = normalizeMedicationSearch([result.family, result.className].filter(Boolean).join(" "));
  const manufacturer = normalizeMedicationSearch(result.manufacturer ?? "");
  if (trade === query) return 1000;
  if (generic === query) return result.type === "generic_medication" ? 950 : 900;
  if (arabic === query) return 925;
  if (trade.startsWith(query)) return 850 + (result.mappingStatus === "mapping_confirmed" && generic.startsWith(query) ? 75 : result.mappingStatus === "mapping_confirmed" ? 20 : 0);
  if (generic.startsWith(query)) return result.type === "generic_medication" ? 875 : 800 + (result.mappingStatus === "mapping_confirmed" ? 25 : 0);
  if (generic.includes(query)) return 700;
  if (trade.includes(query) || arabic.includes(query)) return 650;
  if (manufacturer.includes(query)) return 400;
  if (family.includes(query)) return 300;
  return result.type === "family" ? 100 : 50;
}
