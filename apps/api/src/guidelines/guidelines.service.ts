import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

const sourceNames = ["WHO", "NICE", "RCOG", "ACOG", "FIGO", "ESHRE", "ASRM", "SMFM", "CDC", "FSRH", "Local Clinic Protocol"];

@Injectable()
export class GuidelinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async seedSourceRegistry() {
    for (const name of sourceNames) {
      await this.prisma.guidelineSource.upsert({
        where: { name },
        update: { status: "active", active: true },
        create: {
          name,
          organization: name,
          sourceType: "LINK_ONLY",
          abbreviation: name,
          specialties: ["women_health", "obgyn"],
          defaultAccessLevel: "OWNER_DOCTOR",
          active: true,
          status: "active",
          notes: "Seeded source registry metadata only. Document import requires governance review."
        }
      });
    }
  }

  async listSources(user: AuthUser) {
    const sources = await this.prisma.guidelineSource.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { documents: true } } } });
    await this.audit.record({ actorUserId: user.id, action: "guideline.sources_read", resourceType: "guideline_source", branchId: user.branchId, severity: "medium", metadataJson: { count: sources.length } });
    return sources;
  }

  async createSource(input: Record<string, unknown>, user: AuthUser) {
    const name = clean(input.name, 120);
    if (!name) throw new BadRequestException("Source name is required.");
    const source = await this.prisma.guidelineSource.upsert({
      where: { name },
      update: {
        organization: name,
        sourceType: "LINK_ONLY",
        abbreviation: clean(input.abbreviation, 30) || null,
        websiteUrl: clean(input.websiteUrl, 300) || null,
        specialties: ["women_health", "obgyn"],
        defaultAccessLevel: "OWNER_DOCTOR",
        active: true,
        notes: clean(input.notes, 500) || null,
        status: clean(input.status, 40) || "active"
      },
      create: {
        name,
        organization: name,
        sourceType: "LINK_ONLY",
        abbreviation: clean(input.abbreviation, 30) || null,
        websiteUrl: clean(input.websiteUrl, 300) || null,
        specialties: ["women_health", "obgyn"],
        defaultAccessLevel: "OWNER_DOCTOR",
        active: true,
        notes: clean(input.notes, 500) || null,
        status: clean(input.status, 40) || "active"
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "guideline.source_upserted", resourceType: "guideline_source", branchId: user.branchId, severity: "high", metadataJson: { sourceId: source.id, name: source.name } });
    return source;
  }

  async updateSource(id: string, input: Record<string, unknown>, user: AuthUser) {
    const existing = await this.prisma.guidelineSource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Guideline source not found.");
    const source = await this.prisma.guidelineSource.update({
      where: { id },
      data: {
        organization: existing.name,
        sourceType: "LINK_ONLY",
        abbreviation: clean(input.abbreviation, 30) || null,
        websiteUrl: clean(input.websiteUrl, 300) || null,
        specialties: ["women_health", "obgyn"],
        defaultAccessLevel: "OWNER_DOCTOR",
        active: clean(input.status, 40) !== "inactive",
        notes: clean(input.notes, 500) || null,
        status: clean(input.status, 40) || "active"
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "guideline.source_updated", resourceType: "guideline_source", branchId: user.branchId, severity: "high", metadataJson: { sourceId: source.id, name: source.name } });
    return source;
  }

  async listDocuments(user: AuthUser) {
    const documents = await this.prisma.guidelineDocument.findMany({ where: { archivedAt: null }, orderBy: { createdAt: "desc" }, include: { source: true, _count: { select: { sections: true } } } });
    await this.audit.record({ actorUserId: user.id, action: "guideline.documents_read", resourceType: "guideline_document", branchId: user.branchId, severity: "medium", metadataJson: { count: documents.length } });
    return documents;
  }

  async getDocument(id: string, user: AuthUser) {
    const document = await this.prisma.guidelineDocument.findUnique({
      where: { id },
      include: { source: true, versions: true, sections: { orderBy: { sortOrder: "asc" }, include: { chunks: { orderBy: { chunkIndex: "asc" } } } }, reviewDecisions: { orderBy: { createdAt: "desc" } } }
    });
    if (!document || document.archivedAt) throw new NotFoundException("Guideline document not found.");
    await this.audit.record({ actorUserId: user.id, action: "guideline.document_read", resourceType: "guideline_document", branchId: user.branchId, severity: "medium", metadataJson: { documentId: id } });
    return document;
  }

  async reviewDocument(id: string, input: Record<string, unknown>, user: AuthUser) {
    const decision = clean(input.decision, 40);
    if (!["APPROVED", "REJECTED", "SUPERSEDED", "ARCHIVED"].includes(decision)) throw new BadRequestException("Review decision is not valid.");
    const document = await this.prisma.guidelineDocument.update({ where: { id }, data: { reviewStatus: decision } });
    const review = await this.prisma.guidelineReviewDecision.create({ data: { documentId: id, decision: decision as "APPROVED" | "REJECTED" | "SUPERSEDED" | "ARCHIVED", reason: clean(input.reason, 500) || null, decidedByUserId: user.id, decidedAt: new Date(), reviewerUserId: user.id } });
    await this.audit.record({ actorUserId: user.id, action: "guideline.document_reviewed", resourceType: "guideline_document", branchId: user.branchId, severity: "high", reason: clean(input.reason, 500) || undefined, metadataJson: { documentId: id, decision, reviewId: review.id } });
    return { ...document, latestReview: review };
  }

  async archiveDocument(id: string, user: AuthUser) {
    const document = await this.prisma.guidelineDocument.update({ where: { id }, data: { archivedAt: new Date(), reviewStatus: "archived" } });
    await this.audit.record({ actorUserId: user.id, action: "guideline.document_archived", resourceType: "guideline_document", branchId: user.branchId, severity: "high", metadataJson: { documentId: id } });
    return document;
  }

  async uploadDemoText(input: Record<string, unknown>, user: AuthUser) {
    const sourceName = clean(input.sourceName, 120) || "Local Clinic Protocol";
    const title = clean(input.title, 180);
    const text = clean(input.text, 5000);
    if (!title || !text) throw new BadRequestException("Demo text title and text are required.");
    const source = await this.prisma.guidelineSource.upsert({
      where: { name: sourceName },
      update: { active: true, status: "active" },
      create: {
        name: sourceName,
        organization: sourceName,
        sourceType: "LINK_ONLY",
        abbreviation: sourceName.slice(0, 20),
        specialties: ["women_health", "obgyn"],
        defaultAccessLevel: "OWNER_DOCTOR",
        active: true,
        status: "active",
        notes: "Demo source metadata only."
      }
    });
    const citationLabel = clean(input.citationLabel, 160) || `${sourceName}: ${title}`;
    const document = await this.prisma.guidelineDocument.create({
      data: {
        sourceId: source.id,
        title,
        citationLabel,
        specialty: "Women's health",
        topic: "Guideline center",
        organization: sourceName,
        guidelineStatus: "NEEDS_REVIEW",
        documentType: "demo_text",
        licenseStatus: "CHECK_REQUIRED",
        accessLevel: "OWNER_DOCTOR",
        reviewStatus: "pending_governance_review",
        importedByUserId: user.id,
        versions: { create: { versionLabel: clean(input.versionLabel, 80) || "demo_text_v1", status: "ACTIVE" } },
        importJobs: { create: { jobType: "TEXT_EXTRACTION", status: "SUCCEEDED", importType: "TEXT_EXTRACTION", summary: "Demo text chunked locally. No external AI call.", message: "Local demo text import.", requestedByUserId: user.id, createdByUserId: user.id, startedAt: new Date(), finishedAt: new Date() } }
      }
    });
    await this.createChunks(document.id, text, citationLabel);
    await this.audit.record({ actorUserId: user.id, action: "guideline.demo_text_imported", resourceType: "guideline_document", branchId: user.branchId, severity: "high", metadataJson: { documentId: document.id, sourceName, externalAiAccess: false } });
    return this.getDocument(document.id, user);
  }

  async reindex(user: AuthUser) {
    const count = await this.prisma.guidelineChunk.count();
    await this.audit.record({ actorUserId: user.id, action: "guideline.reindex_requested", resourceType: "guideline_chunk", branchId: user.branchId, severity: "medium", metadataJson: { chunkCount: count, externalAiAccess: false } });
    return { status: "ready", chunkCount: count, externalAiAccess: false };
  }

  async search(query: string | undefined, user: AuthUser) {
    const q = clean(query, 120);
    const chunks = q ? await this.searchChunks(q) : [];
    await this.logQuery(q, "search", chunks.length, user);
    return { query: q, results: chunks.map(toCitationResult), noSourceFound: chunks.length === 0 };
  }

  async ask(input: Record<string, unknown>, user: AuthUser) {
    const question = clean(input.question, 240);
    if (!question) throw new BadRequestException("Question is required.");
    const chunks = await this.searchChunks(question);
    await this.logQuery(question, "ask", chunks.length, user);
    if (!chunks.length) {
      return { answer: "No source found in the local evidence library. Doctor review required.", citations: [], externalAiAccess: false, doctorReviewRequired: true };
    }
    return {
      answer: "Evidence library extract only. Doctor review required. " + chunks.slice(0, 2).map((chunk) => chunk.text).join(" "),
      citations: chunks.map(toCitationResult),
      externalAiAccess: false,
      doctorReviewRequired: true
    };
  }

  async queryLogs(user: AuthUser) {
    const logs = await this.prisma.guidelineQueryLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    await this.audit.record({ actorUserId: user.id, action: "guideline.query_logs_read", resourceType: "guideline_query_log", branchId: user.branchId, severity: "medium", metadataJson: { count: logs.length } });
    return logs;
  }

  private async createChunks(documentId: string, text: string, citationLabel: string) {
    const section = await this.prisma.guidelineSection.create({ data: { documentId, heading: "Demo evidence text", sectionPath: "Demo evidence text", orderIndex: 1, sortOrder: 1, text: "Demo evidence text." } });
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean).slice(0, 20) ?? [text];
    for (const [index, chunk] of chunks.entries()) {
      await this.prisma.guidelineChunk.create({ data: { documentId, sectionId: section.id, chunkIndex: index, text: chunk.slice(0, 1000), normalizedText: chunk.toLowerCase().replace(/\W+/g, " ").slice(0, 1000), citationLabel } });
    }
  }

  private async searchChunks(query: string) {
    const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2).slice(0, 8);
    const chunks = await this.prisma.guidelineChunk.findMany({
      where: { section: { document: { archivedAt: null } } },
      include: { section: { include: { document: { include: { source: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200
    });
    return chunks
      .map((chunk) => ({ chunk, score: terms.reduce((sum, term) => sum + (chunk.text.toLowerCase().includes(term) ? 1 : 0), 0) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.chunk);
  }

  private async logQuery(queryText: string, mode: string, resultCount: number, user: AuthUser) {
    await this.prisma.guidelineQueryLog.create({ data: { userId: user.id, query: queryText || "(empty)", queryText: queryText || "(empty)", mode, answerMode: mode === "ask" ? "MOCK_RAG" : "SEARCH_ONLY", citedChunkIds: [], resultCount, actorUserId: user.id } });
    await this.audit.record({ actorUserId: user.id, action: `guideline.${mode}`, resourceType: "guideline_query_log", branchId: user.branchId, severity: "medium", metadataJson: { resultCount, externalAiAccess: false } });
  }
}

function toCitationResult(chunk: Prisma.GuidelineChunkGetPayload<{ include: { section: { include: { document: { include: { source: true } } } } } }>) {
  return {
    chunkId: chunk.id,
    text: chunk.text,
    citationLabel: chunk.citationLabel,
    documentTitle: chunk.section.document.title,
    sourceName: chunk.section.document.source.name,
    reviewStatus: chunk.reviewStatus
  };
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}
