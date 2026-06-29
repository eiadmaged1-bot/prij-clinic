import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  GuidelineAccessLevel,
  GuidelineAnswerMode,
  GuidelineImportJobStatus,
  GuidelineLicenseStatus,
  GuidelineReviewDecisionValue,
  GuidelineSourceType,
  GuidelineStatus,
  Prisma
} from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { AskGuidelineDto } from "./dto/ask-guideline.dto";
import { CreateGuidelineSourceDto } from "./dto/create-guideline-source.dto";
import { ImportUrlDto } from "./dto/import-url.dto";
import { ReviewGuidelineDto } from "./dto/review-guideline.dto";
import { SearchGuidelinesDto } from "./dto/search-guidelines.dto";
import { UpdateGuidelineSourceDto } from "./dto/update-guideline-source.dto";
import { UploadGuidelineDto } from "./dto/upload-guideline.dto";
import { buildCitationLabel } from "./utils/citation-builder";
import { chunkText } from "./utils/chunk-text";
import { sha256 } from "./utils/file-hash";
import { assertSafePublicUrl } from "./utils/safe-url";
import { keywords, normalizeText } from "./utils/text-normalizer";

type SearchMode = "SEARCH_ONLY" | "MOCK_RAG" | "CITATION_SUMMARY";
type UploadedGuidelineFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@Injectable()
export class GuidelinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async listSources() {
    const sources = await this.prisma.guidelineSource.findMany({
      orderBy: [{ active: "desc" }, { organization: "asc" }]
    });
    return { sources };
  }

  async createSource(dto: CreateGuidelineSourceDto, user: AuthUser) {
    const source = await this.prisma.guidelineSource.create({
      data: sourceData(dto) as Prisma.GuidelineSourceCreateInput
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.source_created",
      resourceType: "guideline_source",
      resourceId: source.id,
      severity: "high",
      metadataJson: { organization: source.organization, sourceType: source.sourceType }
    });
    return source;
  }

  async updateSource(id: string, dto: UpdateGuidelineSourceDto, user: AuthUser) {
    await this.ensureSource(id);
    const source = await this.prisma.guidelineSource.update({
      where: { id },
      data: sourceData(dto, true)
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.source_updated",
      resourceType: "guideline_source",
      resourceId: source.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), sourceType: source.sourceType }
    });
    return source;
  }

  async listDocuments(user: AuthUser) {
    const documents = await this.prisma.guidelineDocument.findMany({
      where: this.documentAccessWhere(user),
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { source: true, _count: { select: { chunks: true, sections: true } } }
    });
    return { documents: documents.map(safeDocument) };
  }

  async getDocument(id: string, user: AuthUser) {
    const document = await this.prisma.guidelineDocument.findFirst({
      where: { id, ...this.documentAccessWhere(user) },
      include: {
        source: true,
        sections: { orderBy: { orderIndex: "asc" }, take: 20 },
        chunks: { orderBy: { chunkIndex: "asc" }, take: 20 },
        _count: { select: { chunks: true, sections: true } }
      }
    });
    if (!document) throw new NotFoundException("Guideline document not found.");
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.document_read",
      resourceType: "guideline_document",
      resourceId: document.id,
      severity: "medium",
      metadataJson: { title: document.title, accessLevel: document.accessLevel }
    });
    return safeDocument(document);
  }

  async updateDocument(id: string, dto: Partial<UploadGuidelineDto>, user: AuthUser) {
    await this.ensureDocument(id, user);
    const document = await this.prisma.guidelineDocument.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.specialty ? { specialty: dto.specialty.trim().toLowerCase() } : {}),
        ...(dto.topic ? { topic: dto.topic.trim().toLowerCase() } : {}),
        ...(dto.subtopic !== undefined ? { subtopic: clean(dto.subtopic) } : {}),
        ...(dto.versionLabel !== undefined ? { versionLabel: clean(dto.versionLabel) } : {}),
        ...(dto.accessLevel ? { accessLevel: dto.accessLevel } : {})
      },
      include: { source: true, _count: { select: { chunks: true, sections: true } } }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.document_updated",
      resourceType: "guideline_document",
      resourceId: document.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto) }
    });
    return safeDocument(document);
  }

  async upload(file: UploadedGuidelineFile, dto: UploadGuidelineDto, user: AuthUser) {
    if (!file?.buffer) throw new BadRequestException("Upload a PDF or plain text guideline file.");
    if (!["application/pdf", "text/plain"].includes(file.mimetype)) {
      throw new BadRequestException("Only PDF and plain text guideline files are accepted.");
    }

    const hash = sha256(file.buffer);
    const duplicate = await this.prisma.guidelineDocument.findFirst({ where: { fileSha256: hash } });
    if (duplicate) throw new BadRequestException("This guideline file is already stored in the local library.");

    const source = dto.sourceId
      ? await this.ensureSource(dto.sourceId)
      : await this.findOrCreateLicensedUploadSource(dto.sourceOrganization ?? "Private Licensed Upload");

    const storageRoot = join(process.cwd(), "storage", "guidelines", "private");
    await mkdir(storageRoot, { recursive: true });
    const extension = extname(file.originalname) || (file.mimetype === "application/pdf" ? ".pdf" : ".txt");
    const fileName = `${hash}${extension}`;
    const localFilePath = join(storageRoot, fileName);
    await writeFile(localFilePath, file.buffer);

    const job = await this.createJob("PRIVATE_UPLOAD", "RUNNING", user, {
      sourceId: source.id,
      inputFileName: file.originalname,
      message: "Private licensed upload received for local extraction."
    });

    try {
      const extractedText = await extractText(file.buffer, file.mimetype);
      const document = await this.createIndexedDocument({
        source,
        title: dto.title,
        specialty: dto.specialty,
        topic: dto.topic,
        subtopic: dto.subtopic,
        versionLabel: dto.versionLabel,
        licenseStatus: dto.licenseStatus ?? "LICENSED_PRIVATE",
        accessLevel: dto.accessLevel ?? "OWNER_DOCTOR",
        fileName: file.originalname,
        fileMimeType: file.mimetype,
        fileSha256: hash,
        localFilePath,
        importedByUserId: user.id,
        text: extractedText
      });
      await this.finishJob(job.id, "SUCCEEDED", { documentId: document.id, chunkCount: document._count.chunks });
      await this.audit.record({
        actorUserId: user.id,
        action: "guideline.uploaded",
        resourceType: "guideline_document",
        resourceId: document.id,
        severity: "high",
        metadataJson: { fileMimeType: file.mimetype, fileSha256: hash, accessLevel: document.accessLevel }
      });
      return { document: safeDocument(document), importJobId: job.id };
    } catch (error) {
      await this.finishJob(job.id, "FAILED", undefined, errorMessage(error));
      throw error;
    }
  }

  async importUrl(dto: ImportUrlDto, user: AuthUser) {
    const source = await this.ensureSource(dto.sourceId);
    if (source.sourceType === "LOGIN_REQUIRED" || source.sourceType === "DO_NOT_IMPORT" || source.sourceType === "LINK_ONLY") {
      await this.audit.record({
        actorUserId: user.id,
        action: "guideline.import_refused",
        resourceType: "guideline_source",
        resourceId: source.id,
        severity: "high",
        metadataJson: { sourceType: source.sourceType, reason: "source type cannot be imported" }
      });
      throw new ForbiddenException("This source is link-only, login-required, or marked do-not-import.");
    }
    if (source.sourceType === "PUBLIC_RESTRICTED" && !dto.userApprovedPublicRestricted) {
      throw new BadRequestException("Public restricted sources need explicit owner approval before import.");
    }

    const url = assertSafePublicUrl(dto.url);
    const job = await this.createJob("OPEN_SOURCE_IMPORT", "RUNNING", user, {
      sourceId: source.id,
      inputUrl: url.toString(),
      message: "Open guideline import started."
    });

    try {
      const response = await fetch(url, { headers: { accept: "application/pdf,text/plain,text/html" } });
      if (!response.ok) throw new BadRequestException(`Open guideline import failed with HTTP ${response.status}.`);
      const contentType = response.headers.get("content-type") ?? "";
      const buffer = Buffer.from(await response.arrayBuffer());
      const hash = sha256(buffer);
      const text = contentType.includes("application/pdf")
        ? await extractText(buffer, "application/pdf")
        : htmlToText(buffer.toString("utf8"));
      const document = await this.createIndexedDocument({
        source,
        title: dto.title,
        specialty: dto.specialty,
        topic: dto.topic,
        versionLabel: dto.versionLabel,
        licenseStatus: source.sourceType === "OPEN_PUBLIC" ? "OPEN" : "CHECK_REQUIRED",
        accessLevel: dto.accessLevel ?? source.defaultAccessLevel,
        originalUrl: url.toString(),
        fileSha256: hash,
        importedByUserId: user.id,
        text
      });
      await this.finishJob(job.id, "SUCCEEDED", { documentId: document.id, chunkCount: document._count.chunks });
      await this.audit.record({
        actorUserId: user.id,
        action: "guideline.imported",
        resourceType: "guideline_document",
        resourceId: document.id,
        severity: "high",
        metadataJson: { sourceId: source.id, originalUrl: url.toString(), externalAiAccess: false }
      });
      return { document: safeDocument(document), importJobId: job.id };
    } catch (error) {
      await this.finishJob(job.id, "FAILED", undefined, errorMessage(error));
      throw error;
    }
  }

  async reindex(id: string, user: AuthUser) {
    const existing = await this.ensureDocument(id, user);
    if (!existing.chunks.length) throw new BadRequestException("No indexed text is available for this document.");
    const text = existing.chunks.map((chunk) => chunk.text).join("\n\n");
    await this.prisma.guidelineSection.deleteMany({ where: { documentId: id } });
    await this.indexText(existing, text);
    const document = await this.getDocument(id, user);
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.reindexed",
      resourceType: "guideline_document",
      resourceId: id,
      severity: "high",
      metadataJson: { externalAiAccess: false }
    });
    return document;
  }

  async reviewDocument(id: string, dto: ReviewGuidelineDto, user: AuthUser) {
    const existing = await this.ensureDocument(id, user);
    const status = reviewDecisionToStatus(dto.decision);
    if ((dto.decision === "REJECTED" || dto.decision === "ARCHIVED") && !dto.reason?.trim()) {
      throw new BadRequestException("A reason is required for reject or archive decisions.");
    }
    const document = await this.prisma.guidelineDocument.update({
      where: { id },
      data: {
        guidelineStatus: status,
        reviewedByUserId: user.id,
        reviewedAt: new Date()
      },
      include: { source: true, _count: { select: { chunks: true, sections: true } } }
    });
    await this.prisma.guidelineReviewDecision.create({
      data: { documentId: id, decision: dto.decision, reason: clean(dto.reason), decidedByUserId: user.id }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.reviewed",
      resourceType: "guideline_document",
      resourceId: id,
      severity: "high",
      reason: dto.reason,
      metadataJson: { fromStatus: existing.guidelineStatus, toStatus: status, decision: dto.decision }
    });
    return safeDocument(document);
  }

  async archiveDocument(id: string, dto: ReviewGuidelineDto, user: AuthUser) {
    return this.reviewDocument(id, { ...dto, decision: "ARCHIVED" }, user);
  }

  async search(query: SearchGuidelinesDto, user: AuthUser, mode: SearchMode = "SEARCH_ONLY") {
    const q = query.q?.trim() ?? "";
    const limit = Math.min(Math.max(Number(query.limit) || 8, 1), 20);
    const terms = keywords(q);
    const chunks = await this.prisma.guidelineChunk.findMany({
      where: {
        document: {
          ...this.documentAccessWhere(user),
          ...(query.specialty ? { specialty: query.specialty.toLowerCase() } : {}),
          ...(query.topic ? { topic: query.topic.toLowerCase() } : {}),
          ...(query.organization ? { organization: { contains: query.organization, mode: "insensitive" } } : {}),
          ...(query.status ? { guidelineStatus: query.status as GuidelineStatus } : {})
        }
      },
      include: { section: true, document: { include: { source: true } } },
      take: 200,
      orderBy: { createdAt: "desc" }
    });
    const ranked = chunks
      .map((chunk) => ({ chunk, score: rankChunk(chunk, terms, query) }))
      .filter((item) => (terms.length ? item.score > 0 : true))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ chunk, score }) => formatSearchResult(chunk, score));

    await this.prisma.guidelineQueryLog.create({
      data: {
        userId: user.id,
        query: q || "(browse)",
        specialty: clean(query.specialty),
        topic: clean(query.topic),
        answerMode: mode as GuidelineAnswerMode,
        resultCount: ranked.length,
        citedChunkIds: ranked.map((result) => result.chunkId)
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: mode === "MOCK_RAG" ? "guideline.ask" : "guideline.search",
      resourceType: "guideline_query",
      severity: "medium",
      metadataJson: { resultCount: ranked.length, answerMode: mode, externalAiAccess: false }
    });
    return { results: ranked };
  }

  async ask(dto: AskGuidelineDto, user: AuthUser) {
    const search = await this.search({ q: dto.question, specialty: dto.specialty, topic: dto.topic, limit: "5" }, user, "MOCK_RAG");
    if (!search.results.length) {
      return {
        answer: "No source found in your local library.",
        warning: "Doctor review required. Evidence summary only.",
        citations: [],
        mode: dto.mode ?? "concise"
      };
    }
    const sentences = search.results
      .flatMap((result) => result.snippet.split(/(?<=[.!?])\s+/).slice(0, 2))
      .filter(Boolean)
      .slice(0, 5);
    return {
      answer: `Evidence summary from local library only. ${sentences.join(" ")}`,
      warning: "Doctor review required. Evidence summary only.",
      citations: search.results.map((result) => ({
        chunkId: result.chunkId,
        citationLabel: result.citationLabel,
        title: result.title,
        versionLabel: result.versionLabel,
        sectionHeading: result.sectionHeading
      })),
      mode: dto.mode ?? "concise"
    };
  }

  async checkUpdates(input: { sourceId?: string; documentId?: string; url?: string; user: AuthUser }) {
    const source = input.sourceId ? await this.ensureSource(input.sourceId) : null;
    const checkedUrl = input.url ?? source?.websiteUrl;
    if (!checkedUrl) throw new BadRequestException("A source website URL or explicit URL is required.");
    const url = assertSafePublicUrl(checkedUrl);
    const check = await this.prisma.guidelineUpdateCheck.create({
      data: {
        sourceId: source?.id,
        documentId: input.documentId,
        status: source?.sourceType === "OPEN_PUBLIC" ? "NEEDS_REVIEW" : "POSSIBLE_UPDATE",
        checkedUrl: url.toString(),
        message: "Simple local update check recorded. No automatic replacement was performed.",
        resultJson: { externalAiAccess: false }
      }
    });
    await this.audit.record({
      actorUserId: input.user.id,
      action: "guideline.update_check",
      resourceType: input.documentId ? "guideline_document" : "guideline_source",
      resourceId: input.documentId ?? source?.id,
      severity: "medium",
      metadataJson: { checkedUrl: url.toString(), autoImported: false }
    });
    return check;
  }

  async importJobs() {
    return { importJobs: await this.prisma.guidelineImportJob.findMany({ orderBy: { createdAt: "desc" }, take: 100 }) };
  }

  async updateChecks() {
    return { updateChecks: await this.prisma.guidelineUpdateCheck.findMany({ orderBy: { checkedAt: "desc" }, take: 100 }) };
  }

  async queryLogs() {
    return { queryLogs: await this.prisma.guidelineQueryLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }) };
  }

  private async createIndexedDocument(input: {
    source: { id: string; organization: string; defaultAccessLevel: GuidelineAccessLevel };
    title: string;
    specialty: string;
    topic: string;
    subtopic?: string;
    versionLabel?: string;
    licenseStatus: GuidelineLicenseStatus;
    accessLevel: GuidelineAccessLevel;
    originalUrl?: string;
    localFilePath?: string;
    fileName?: string;
    fileMimeType?: string;
    fileSha256?: string;
    importedByUserId?: string;
    text: string;
  }) {
    if (!input.text.trim()) throw new BadRequestException("No extractable guideline text was found.");
    const document = await this.prisma.guidelineDocument.create({
      data: {
        sourceId: input.source.id,
        title: input.title.trim(),
        specialty: input.specialty.trim().toLowerCase(),
        topic: input.topic.trim().toLowerCase(),
        subtopic: clean(input.subtopic),
        organization: input.source.organization,
        versionLabel: clean(input.versionLabel),
        guidelineStatus: "NEEDS_REVIEW",
        licenseStatus: input.licenseStatus,
        originalUrl: input.originalUrl,
        localFilePath: input.localFilePath,
        fileName: input.fileName,
        fileMimeType: input.fileMimeType,
        fileSha256: input.fileSha256,
        importedByUserId: input.importedByUserId,
        accessLevel: input.accessLevel
      }
    });
    await this.indexText(document, input.text);
    return this.prisma.guidelineDocument.findUniqueOrThrow({
      where: { id: document.id },
      include: { source: true, _count: { select: { chunks: true, sections: true } } }
    });
  }

  private async indexText(document: { id: string; organization: string; title: string; versionLabel: string | null }, text: string) {
    const chunks = chunkText({ text });
    for (const chunk of chunks) {
      const section = await this.prisma.guidelineSection.create({
        data: {
          documentId: document.id,
          heading: chunk.heading,
          sectionPath: chunk.heading,
          orderIndex: chunk.chunkIndex,
          text: chunk.text
        }
      });
      await this.prisma.guidelineChunk.create({
        data: {
          documentId: document.id,
          sectionId: section.id,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          normalizedText: chunk.normalizedText,
          tokenEstimate: chunk.tokenEstimate,
          citationLabel: buildCitationLabel({
            organization: document.organization,
            title: document.title,
            versionLabel: document.versionLabel,
            heading: section.heading,
            chunkIndex: chunk.chunkIndex
          }),
          searchVectorText: chunk.normalizedText
        }
      });
    }
  }

  private async ensureSource(id: string) {
    const source = await this.prisma.guidelineSource.findUnique({ where: { id } });
    if (!source) throw new NotFoundException("Guideline source not found.");
    return source;
  }

  private async ensureDocument(id: string, user: AuthUser) {
    const document = await this.prisma.guidelineDocument.findFirst({
      where: { id, ...this.documentAccessWhere(user) },
      include: { chunks: true }
    });
    if (!document) throw new NotFoundException("Guideline document not found.");
    return document;
  }

  private async findOrCreateLicensedUploadSource(organization: string) {
    const existing = await this.prisma.guidelineSource.findFirst({
      where: { organization, sourceType: "LICENSED_UPLOAD" }
    });
    if (existing) return existing;
    return this.prisma.guidelineSource.create({
      data: {
        name: organization,
        organization,
        sourceType: "LICENSED_UPLOAD",
        specialties: ["obstetrics", "gynecology"],
        defaultAccessLevel: "OWNER_DOCTOR",
        notes: "Local private licensed upload source. Do not commit uploaded files."
      }
    });
  }

  private async createJob(
    jobType: Prisma.GuidelineImportJobCreateInput["jobType"],
    status: GuidelineImportJobStatus,
    user: AuthUser,
    data: { sourceId?: string; documentId?: string; inputUrl?: string; inputFileName?: string; message?: string }
  ) {
    return this.prisma.guidelineImportJob.create({
      data: {
        jobType,
        status,
        sourceId: data.sourceId,
        documentId: data.documentId,
        requestedByUserId: user.id,
        inputUrl: data.inputUrl,
        inputFileName: data.inputFileName,
        message: data.message,
        startedAt: new Date()
      }
    });
  }

  private async finishJob(id: string, status: GuidelineImportJobStatus, resultJson?: unknown, errorMessageValue?: string) {
    await this.prisma.guidelineImportJob.update({
      where: { id },
      data: { status, resultJson: resultJson as Prisma.InputJsonValue, errorMessage: errorMessageValue, finishedAt: new Date() }
    });
  }

  private documentAccessWhere(user: AuthUser): Prisma.GuidelineDocumentWhereInput {
    if (user.roles.includes("Owner") || user.permissions.includes("guidelines.manage_private")) return {};
    if (user.roles.includes("Doctor")) return { accessLevel: { in: ["OWNER_DOCTOR", "CLINICAL_TEAM"] } };
    return { accessLevel: "CLINICAL_TEAM" };
  }
}

function sourceData(dto: CreateGuidelineSourceDto | UpdateGuidelineSourceDto, partial = false) {
  const data: Prisma.GuidelineSourceUncheckedCreateInput = {
    name: dto.name?.trim(),
    organization: dto.organization?.trim(),
    sourceType: dto.sourceType,
    websiteUrl: clean(dto.websiteUrl),
    countryOrRegion: clean(dto.countryOrRegion),
    specialties: dto.specialties ?? [],
    defaultAccessLevel: dto.defaultAccessLevel ?? "OWNER_DOCTOR",
    notes: clean(dto.notes),
    active: dto.active ?? true
  };
  if (!partial && (!data.name || !data.organization || !data.sourceType)) {
    throw new BadRequestException("Name, organization, and source type are required.");
  }
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function safeDocument<T extends { localFilePath?: string | null }>(document: T) {
  const { localFilePath: _localFilePath, ...safe } = document;
  return safe;
}

function clean(value?: string | null) {
  return value?.trim() || null;
}

function reviewDecisionToStatus(decision: GuidelineReviewDecisionValue): GuidelineStatus {
  if (decision === "APPROVED") return "ACTIVE";
  if (decision === "SUPERSEDED") return "SUPERSEDED";
  if (decision === "ARCHIVED" || decision === "REJECTED") return "ARCHIVED";
  return "NEEDS_REVIEW";
}

function rankChunk(
  chunk: { normalizedText: string; document: { guidelineStatus: GuidelineStatus; specialty: string; topic: string } },
  terms: string[],
  query: SearchGuidelinesDto
) {
  let score = 0;
  let matches = 0;
  for (const term of terms) {
    if (chunk.normalizedText.includes(term)) {
      matches += 1;
      score += 3;
    }
  }
  if (terms.length && matches === 0) return 0;
  if (query.specialty && chunk.document.specialty === query.specialty.toLowerCase()) score += 4;
  if (query.topic && chunk.document.topic === query.topic.toLowerCase()) score += 4;
  if (chunk.document.guidelineStatus === "ACTIVE") score += 2;
  if (chunk.document.guidelineStatus === "NEEDS_REVIEW") score += 1;
  return score;
}

function formatSearchResult(
  chunk: {
    id: string;
    text: string;
    citationLabel: string;
    section: { heading: string } | null;
    document: {
      id: string;
      title: string;
      organization: string;
      versionLabel: string | null;
      publicationDate: Date | null;
      guidelineStatus: GuidelineStatus;
      accessLevel: GuidelineAccessLevel;
      source: { name: string };
    };
  },
  score: number
) {
  return {
    chunkId: chunk.id,
    documentId: chunk.document.id,
    title: chunk.document.title,
    organization: chunk.document.organization,
    versionLabel: chunk.document.versionLabel,
    publicationDate: chunk.document.publicationDate,
    status: chunk.document.guidelineStatus,
    sectionHeading: chunk.section?.heading ?? "Guideline section",
    snippet: chunk.text.slice(0, 650),
    citationLabel: chunk.citationLabel,
    accessLevel: chunk.document.accessLevel,
    score
  };
}

async function extractText(buffer: Buffer, mimeType: string) {
  if (mimeType === "text/plain") return buffer.toString("utf8");
  const pdfModule = (await import("pdf-parse")) as unknown as {
    default?: (input: Buffer) => Promise<{ text: string }>;
  } & ((input: Buffer) => Promise<{ text: string }>);
  const pdfParse = pdfModule.default ?? pdfModule;
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

function htmlToText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown guideline import error.";
}
