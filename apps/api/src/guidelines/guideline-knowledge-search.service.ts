import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { GuidelinesService } from "./guidelines.service";

@Injectable()
export class GuidelineKnowledgeSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guidelines: GuidelinesService,
    private readonly audit: AuditService
  ) {}

  async search(input: { q?: string; limit?: string }, user: AuthUser) {
    const query = input.q?.trim() ?? "";
    if (query.length < 2) {
      throw new BadRequestException("Enter at least two characters to search guidelines and protocols.");
    }
    const limit = Math.min(Math.max(Number(input.limit) || 10, 1), 20);

    const [guidelineSearch, protocols] = await Promise.all([
      this.guidelines.search({ q: query, limit: String(limit) }, user, "SEARCH_ONLY"),
      this.prisma.clinicalProtocol.findMany({
        where: {
          AND: [
            {
              OR: [
                { implementationStatus: "verified" },
                { publicationState: "SOURCE_VERIFIED_REFERENCE" }
              ]
            },
            { implementationStatus: { not: "retired" } },
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { condition: { contains: query, mode: "insensitive" } },
                { specialtyGroup: { contains: query, mode: "insensitive" } },
                { clinicalArea: { contains: query, mode: "insensitive" } },
                { sourceName: { contains: query, mode: "insensitive" } },
                { sourceIdentifier: { contains: query, mode: "insensitive" } }
              ]
            }
          ]
        },
        orderBy: [{ riskLevel: "desc" }, { title: "asc" }],
        take: limit,
        select: {
          id: true,
          code: true,
          title: true,
          specialtyGroup: true,
          condition: true,
          clinicalArea: true,
          riskLevel: true,
          implementationStatus: true,
          publicationState: true,
          sourceName: true,
          sourceYear: true,
          sourceVersion: true,
          sourceIdentifier: true,
          sourceCitationsJson: true,
          aliases: true,
          updatedAt: true
        }
      })
    ]);

    const protocolResults = protocols.map((protocol) => ({
      ...protocol,
      verified: protocol.implementationStatus === "verified" || protocol.publicationState === "SOURCE_VERIFIED_REFERENCE",
      citations: normalizeCitations(protocol.sourceCitationsJson),
      aliases: normalizeStringArray(protocol.aliases),
      link: `/protocol-atlas/${protocol.id}`
    }));

    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.unified_knowledge_search",
      resourceType: "guideline_query",
      severity: "medium",
      metadataJson: {
        guidelineResultCount: guidelineSearch.results.length,
        protocolResultCount: protocolResults.length,
        externalAiAccess: false
      }
    });

    return {
      query,
      guidelineResults: guidelineSearch.results,
      groupedGuidelineResults: guidelineSearch.groupedResults,
      protocolResults,
      noSourceFound: guidelineSearch.results.length === 0 && protocolResults.length === 0,
      doctorReviewRequired: true,
      externalAiAccess: false
    };
  }
}

function normalizeCitations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const label = typeof row.label === "string"
      ? row.label
      : typeof row.citationLabel === "string"
        ? row.citationLabel
        : null;
    const page = typeof row.page === "number"
      ? row.page
      : typeof row.pageStart === "number"
        ? row.pageStart
        : null;
    return label ? [{ label, page }] : [];
  });
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string").slice(0, 8)
    : [];
}
