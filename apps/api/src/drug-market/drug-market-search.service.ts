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
    const showDemo = process.env.NODE_ENV === "test" || process.env.DEMO_MODE === "true";
    const countryCode = params.countryCode?.trim().toUpperCase();
    const matchingSources = normalized
      ? await this.prisma.drugMarketSource.findMany({
          where: {
            OR: [
              { code: { contains: normalized, mode: "insensitive" } },
              { name: { contains: normalized, mode: "insensitive" } },
              { latestSourceLabel: { contains: normalized, mode: "insensitive" } }
            ]
          },
          select: { id: true }
        })
      : [];
    const matchingSourceIds = matchingSources.map((source) => source.id);
    const products = await this.prisma.drugMarketProduct.findMany({
      where: {
        isDemo: showDemo ? undefined : false,
        AND: [
          countryCode ? { variants: { some: { countryCode, isDemo: showDemo ? undefined : false } } } : {},
          {
            OR: [
              { normalizedSearchText: { contains, mode: "insensitive" } },
              { tradeName: { contains, mode: "insensitive" } },
              { genericName: { contains, mode: "insensitive" } },
              { scientificName: { contains, mode: "insensitive" } },
              { familyText: { contains, mode: "insensitive" } },
              { manufacturer: { contains, mode: "insensitive" } },
              { marketingCompany: { contains, mode: "insensitive" } },
              { variants: { some: { strengthText: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { dosageForm: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { route: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { packageText: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { manufacturer: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { marketingCompany: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { registrationNumber: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { atcCode: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { officialPriceText: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { priceText: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { currency: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              { variants: { some: { countryCode: { contains, mode: "insensitive" }, isDemo: showDemo ? undefined : false } } },
              ...(matchingSourceIds.length ? [{ variants: { some: { sourceId: { in: matchingSourceIds }, isDemo: showDemo ? undefined : false } } }] : [])
            ]
          }
        ]
      },
      include: {
        variants: {
          where: { isDemo: showDemo ? undefined : false },
          orderBy: [{ countryCode: "asc" }, { tradeName: "asc" }]
        },
        availabilities: true
      },
      take: 50,
      orderBy: { tradeName: "asc" }
    });

    const sourceIds = [...new Set(products.flatMap((product) => product.variants.map((variant) => variant.sourceId)).filter((id): id is string => Boolean(id)))];
    const sources = sourceIds.length ? await this.prisma.drugMarketSource.findMany({ where: { id: { in: sourceIds } } }) : [];
    const sourceById = new Map(sources.map((source) => [source.id, source]));

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
        tradeNameArabic: jsonText(product.variants[0]?.officialRowJson, "commercial_name_ar"),
        genericName: product.genericName,
        scientificName: product.scientificName,
        family: product.familyText,
        verificationStatus: product.verificationStatus,
        isDemo: product.isDemo,
        sourceFreshness: product.latestSourceFetchedAt,
        badges: compactCountryBadges(product.availabilities),
        variantSummary: product.variants.map((variant) => ({
          id: variant.id,
          countryCode: variant.countryCode,
          strengthText: variant.strengthText,
          dosageForm: variant.dosageForm,
          route: variant.route,
          manufacturer: variant.manufacturer,
          marketingCompany: variant.marketingCompany,
          registrationNumber: variant.registrationNumber,
          atcCode: variant.atcCode,
          officialPriceText: variant.officialPriceText ?? variant.priceText,
          officialPriceAmount: variant.officialPriceAmount,
          currency: variant.currency,
          sourceFetchedAt: variant.sourceFetchedAt,
          sourcePublishedAt: variant.sourcePublishedAt,
          sourceCode: variant.sourceId ? sourceById.get(variant.sourceId)?.code ?? null : null,
          sourceName: variant.sourceId ? sourceById.get(variant.sourceId)?.name ?? null : null,
          sourceFreshnessStatus: variant.sourceId ? sourceById.get(variant.sourceId)?.sourceFreshnessStatus ?? null : null,
          parserConfidence: variant.parserConfidence,
          verificationStatus: variant.verificationStatus,
          trustStatus: variant.verificationStatus === "verified" ? "verified" : "needs_review",
          isDemo: variant.isDemo
        }))
      })).sort((left, right) => searchRank(right, normalized) - searchRank(left, normalized))
    };
  }
}

function jsonText(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = (value as Record<string, unknown>)[key];
  return candidate === undefined || candidate === null ? null : String(candidate);
}

function searchRank(product: { tradeName: string; tradeNameArabic: string | null; genericName: string | null; scientificName: string | null; family: string | null }, query: string) {
  if (!query) return 0;
  const values = [product.scientificName, product.genericName, product.tradeName, product.tradeNameArabic, product.family].map((value) => normalizeMedicationSearch(value ?? ""));
  if (values[2] === query || values[3] === query) return 100;
  if (values[0] === query || values[1] === query) return 95;
  if (values[2]?.startsWith(query) || values[3]?.startsWith(query)) return 85;
  if (values[0]?.startsWith(query) || values[1]?.startsWith(query)) return 80;
  return values.some((value) => value.includes(query)) ? 50 : 0;
}
