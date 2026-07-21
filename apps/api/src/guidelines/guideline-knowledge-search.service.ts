import { BadRequestException, Injectable } from "@nestjs/common";
import { GuidelineAccessLevel, Prisma } from "@prisma/client";
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

    const sourceTerms = unique(protocols.flatMap((protocol) => [
      protocol.sourceIdentifier,
      protocol.sourceName,
      protocol.sourceVersion
    ].filter((value): value is string => Boolean(value?.trim()))));

    const linkedDocuments = sourceTerms.length
      ? await this.prisma.guidelineDocument.findMany({
          where: {
            ...documentAccessWhere(user),
            archivedAt: null,
            guidelineStatus: { notIn: ["ARCHIVED", "SUPERSEDED"] },
            OR: sourceTerms.flatMap((term) => [
              { citationLabel: { contains: term, mode: "insensitive" as const } },
              { originalUrl: { contains: term, mode: "insensitive" as const } },
              { title: { contains: term, mode: "insensitive" as const } },
              { organization: { contains: term, mode: "insensitive" as const } },
              { versionLabel: { contains: term, mode: "insensitive" as const } }
            ])
          },
          select: {
            id: true,
            title: true,
            organization: true,
            versionLabel: true,
            citationLabel: true,
            originalUrl: true,
            guidelineStatus: true
          },
          take: 100
        })
      : [];

    const protocolResults = protocols.map((protocol) => {
      const linkedDocument = bestLinkedDocument(protocol, linkedDocuments);
      return {
        ...protocol,
        verified: protocol.implementationStatus === "verified" || protocol.publicationState === "SOURCE_VERIFIED_REFERENCE",
        citations: normalizeCitations(protocol.sourceCitationsJson),
        aliases: normalizeStringArray(protocol.aliases),
        link: `/protocol-atlas/${protocol.id}`,
        linkedDocument: linkedDocument
          ? {
              id: linkedDocument.id,
              title: linkedDocument.title,
              organization: linkedDocument.organization,
              versionLabel: linkedDocument.versionLabel,
              status: linkedDocument.guidelineStatus,
              link: `/guidelines/${linkedDocument.id}`
            }
          : null
      };
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.unified_knowledge_search",
      resourceType: "guideline_query",
      severity: "medium",
      metadataJson: {
        guidelineResultCount: guidelineSearch.results.length,
        protocolResultCount: protocolResults.length,
        linkedProtocolSourceCount: protocolResults.filter((protocol) => protocol.linkedDocument).length,
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

function documentAccessWhere(user: AuthUser): Prisma.GuidelineDocumentWhereInput {
  if (user.isSystemOwner || user.roles.includes("Owner")) return {};
  if (user.roles.includes("Doctor")) {
    return {
      accessLevel: {
        in: [GuidelineAccessLevel.OWNER_DOCTOR, GuidelineAccessLevel.CLINICAL_TEAM]
      }
    };
  }
  return { accessLevel: GuidelineAccessLevel.CLINICAL_TEAM };
}

function bestLinkedDocument(
  protocol: {
    sourceIdentifier: string | null;
    sourceName: string;
    sourceVersion: string | null;
  },
  documents: Array<{
    id: string;
    title: string;
    organization: string;
    versionLabel: string | null;
    citationLabel: string;
    originalUrl: string | null;
    guidelineStatus: string;
  }>
) {
  const terms = [protocol.sourceIdentifier, protocol.sourceName, protocol.sourceVersion]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalize);
  if (!terms.length) return null;

  return documents
    .map((document) => {
      const haystack = normalize([
        document.title,
        document.organization,
        document.versionLabel,
        document.citationLabel,
        document.originalUrl
      ].filter(Boolean).join(" "));
      const score = terms.reduce((total, term, index) => total + (haystack.includes(term) ? (index === 0 ? 6 : index === 1 ? 3 : 1) : 0), 0);
      return { document, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.document ?? null;
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

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

function unique(values: string[]) {
  return [...new Set(values)];
}
