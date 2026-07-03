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

  async searchInvestigations(query: string) {
    const normalized = normalize(query);
    const rows = await this.prisma.investigationCatalogItem.findMany({
      where: {
        active: true,
        ...(normalized
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
                { discipline: { contains: query, mode: "insensitive" } },
                { modality: { contains: query, mode: "insensitive" } },
                { sampleType: { contains: query, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 80,
      select: { id: true, code: true, name: true, category: true, discipline: true, modality: true, sampleType: true }
    });
    return rows.map((row) => ({ ...row, label: row.name, type: "investigation" }));
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

  async searchOperations(query: string) {
    const normalized = normalize(query);
    const rows = await this.prisma.operationCatalogItem.findMany({
      where: {
        isActive: true,
        ...(normalized
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { normalizedName: { contains: normalized } },
                { category: { contains: query, mode: "insensitive" } },
                { specialty: { contains: query, mode: "insensitive" } },
                { bodySystem: { contains: query, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ isObGyn: "desc" }, { category: "asc" }, { name: "asc" }],
      take: 80,
      select: { id: true, code: true, name: true, category: true, specialty: true, bodySystem: true, isObGyn: true, isSurgical: true, aliases: true, reviewStatus: true }
    });
    return rows
      .filter((row) => !normalized || matchesAliases(row.aliases, normalized) || normalize([row.name, row.category, row.specialty, row.bodySystem].join(" ")).includes(normalized))
      .map((row) => ({ ...row, label: row.name, type: "operation" }));
  }

  async searchMedications(query: string) {
    const normalized = normalize(query);
    const [medications, tags, classes] = await Promise.all([
      this.prisma.medicationGeneric.findMany({
        where: {
          isActive: true,
          isControlled: false,
          ...(normalized
            ? {
                OR: [
                  { normalizedName: { contains: normalized } },
                  { genericName: { contains: query, mode: "insensitive" } },
                  { familyName: { contains: query, mode: "insensitive" } },
                  { className: { contains: query, mode: "insensitive" } },
                  { pharmacologicClass: { contains: query, mode: "insensitive" } },
                  { tags: { some: { tag: { normalizedName: { contains: normalized }, isActive: true } } } }
                ]
              }
            : {})
        },
        include: { tags: { include: { tag: true } } },
        orderBy: [{ familyName: "asc" }, { genericName: "asc" }],
        take: 80
      }),
      this.prisma.medicationSearchTag.findMany({
        where: {
          isActive: true,
          ...(normalized
            ? {
                OR: [
                  { normalizedName: { contains: normalized } },
                  { name: { contains: query, mode: "insensitive" } }
                ]
              }
            : {})
        },
        orderBy: [{ type: "asc" }, { name: "asc" }],
        take: 40
      }),
      this.prisma.medicationClass.findMany({
        where: {
          isActive: true,
          ...(normalized
            ? {
                OR: [
                  { normalizedName: { contains: normalized } },
                  { name: { contains: query, mode: "insensitive" } }
                ]
              }
            : {})
        },
        orderBy: [{ type: "asc" }, { name: "asc" }],
        take: 40
      })
    ]);

    const medicationResults = medications
      .filter((row) => !normalized || matchesAliases(row.aliases, normalized) || row.tags.some(({ tag }) => matchesAliases(tag.aliases, normalized)) || normalize([row.genericName, row.familyName, row.className, row.pharmacologicClass, ...row.tags.map(({ tag }) => tag.name)].join(" ")).includes(normalized))
      .map((row) => ({
        type: "generic_medication",
        id: row.id,
        label: row.genericName,
        genericName: row.genericName,
        familyName: row.familyName,
        className: row.className,
        pharmacologicClass: row.pharmacologicClass,
        isControlled: row.isControlled,
        isAntibiotic: row.isAntibiotic,
        tags: row.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, type: tag.type }))
      }));

    const tagResults = tags
      .filter((row) => !normalized || matchesAliases(row.aliases, normalized) || normalize(row.name).includes(normalized))
      .map((row) => ({ type: "medication_tag", id: row.id, label: row.name, tagType: row.type }));
    const classResults = classes
      .filter((row) => !normalized || matchesAliases(row.aliases, normalized) || normalize(row.name).includes(normalized))
      .map((row) => ({ type: "medication_class", id: row.id, label: row.name, classType: row.type }));

    return [...tagResults, ...classResults, ...medicationResults].slice(0, 100);
  }

  medicationTags() {
    return this.prisma.medicationSearchTag.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true, aliases: true }
    });
  }

  medicationClasses() {
    return this.prisma.medicationClass.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true, parentId: true, aliases: true }
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
      genericReferenceRows: await this.prisma.medicationGeneric.count({ where: { isActive: true } }),
      status: officialRows > 0 ? "ready_for_review_gated_selection" : "official_source_missing",
      warning: officialRows === 0 ? "Official medication source rows are missing. No fake medication rows are seeded." : null
    };
  }
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function matchesAliases(aliases: unknown, normalizedQuery: string) {
  if (!normalizedQuery) return true;
  if (!Array.isArray(aliases)) return false;
  return aliases.some((alias) => normalize(alias).includes(normalizedQuery) || normalizedQuery.includes(normalize(alias)));
}
