import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
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
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
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
import { CreateGuidelineSummaryDto, ReviewGuidelineSummaryDto } from "./dto/guideline-summary.dto";
import { buildCitationLabel } from "./utils/citation-builder";
import { chunkText } from "./utils/chunk-text";
import { sha256 } from "./utils/file-hash";
import { assertSafePublicUrl } from "./utils/safe-url";
import { keywords, normalizeText } from "./utils/text-normalizer";

type SearchMode = "SEARCH_ONLY" | "MOCK_RAG" | "CITATION_SUMMARY";
const requiredSummarySections = ["AT_A_GLANCE", "SCOPE_POPULATION", "KEY_RECOMMENDATIONS", "ASSESSMENT_DIAGNOSIS", "INVESTIGATIONS", "RISK_STRATIFICATION", "MANAGEMENT", "MEDICATION_GUIDANCE", "PROCEDURES_INTERVENTIONS", "SPECIAL_POPULATIONS", "PREGNANCY_LACTATION", "MONITORING", "FOLLOW_UP", "ESCALATION_REFERRAL", "RED_FLAGS", "WHAT_NOT_TO_DO", "EVIDENCE_LIMITATIONS", "DECISION_PATHWAY"];
const supportedGuidelineOrganizations = ["ACOG", "RCOG", "NICE", "WHO", "FIGO", "ESHRE", "ASRM", "SMFM", "CDC", "Other women’s health sources"];
const demoGuidelineDisclaimer = "Demo guideline sample - not clinical use.";
type UploadedGuidelineFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};
type FileAction = "view" | "download";
type FileAccessDecision = {
  allowed: boolean;
  reason?: string;
};
type StoredFilePayload = {
  buffer: Buffer;
  encrypted: boolean;
  encryptionKeyId?: string | null;
  encryptionIv?: string | null;
  encryptionTag?: string | null;
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

  async listDocuments(user: AuthUser, options: { page?: string; limit?: string; status?: string } = {}) {
    const page = Math.max(1, Number.parseInt(options.page ?? "1", 10) || 1);
    const limit = Math.max(5, Math.min(50, Number.parseInt(options.limit ?? "20", 10) || 20));
    const accessWhere = this.documentAccessWhere(user);
    const where = { ...accessWhere, ...(isGuidelineStatus(options.status) ? { guidelineStatus: options.status } : {}) };
    const total = await this.prisma.guidelineDocument.count({ where });
    const documents = await this.prisma.guidelineDocument.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { source: true, _count: { select: { chunks: true, sections: true } } }
    });
    const [grouped, departments] = await Promise.all([
      this.prisma.guidelineDocument.groupBy({ by: ["guidelineStatus"], where: accessWhere, _count: { _all: true } }),
      this.prisma.guidelineDocument.groupBy({ by: ["specialty"], where: accessWhere, _count: { _all: true }, orderBy: { specialty: "asc" } })
    ]);
    return { documents: await this.withLastFileAccess(documents.map(safeDocument)), pageInfo: { page, limit, total, hasMore: page * limit < total }, counts: Object.fromEntries(grouped.map((item) => [item.guidelineStatus, item._count._all])), departmentCounts: Object.fromEntries(departments.map((item) => [item.specialty, item._count._all])) };
  }

  async getDocument(id: string, user: AuthUser) {
    const document = await this.prisma.guidelineDocument.findFirst({
      where: { id, ...this.documentAccessWhere(user) },
      include: {
        source: true,
        versions: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, versionLabel: true, publishedYear: true, publicationDate: true, status: true, fileSha256: true, createdAt: true } },
        sections: { orderBy: { orderIndex: "asc" }, take: 20 },
        chunks: { orderBy: { chunkIndex: "asc" }, take: 20 },
        summaries: { orderBy: { createdAt: "desc" }, take: 3, include: { sections: { orderBy: { orderIndex: "asc" }, include: { citations: { orderBy: [{ bulletIndex: "asc" }, { pageStart: "asc" }] } } }, reviewedBy: { select: { id: true, displayName: true } } } },
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
    const pageStats = await this.prisma.guidelineSection.aggregate({
      where: { documentId: document.id },
      _max: { pageStart: true, pageEnd: true }
    });
    const storedPageCount = (document as typeof document & { pageCount?: number | null }).pageCount;
    const pageCount = storedPageCount ?? (Math.max(pageStats._max.pageEnd ?? 0, pageStats._max.pageStart ?? 0) || null);
    return this.withLastFileAccess({ ...safeDocument(document), pageCount });
  }

  async viewDocumentFile(id: string, user: AuthUser) {
    return this.documentFileResponse(id, user, "view");
  }

  async downloadDocumentFile(id: string, user: AuthUser) {
    return this.documentFileResponse(id, user, "download");
  }

  async updateFileAccessSettings(id: string, dto: { downloadsAllowed?: boolean }, user: AuthUser) {
    if (!isOwner(user)) {
      await this.audit.record({
        actorUserId: user.id,
        action: "guideline.file_access_settings_denied",
        resourceType: "guideline_document",
        resourceId: id,
        severity: "high",
        metadataJson: { reason: "owner_only_setting" }
      });
      throw new ForbiddenException("Only the owner can change private vault file access settings.");
    }
    const existing = await this.prisma.guidelineDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Guideline document not found.");
    const document = await this.prisma.guidelineDocument.update({
      where: { id },
      data: { downloadsAllowed: dto.downloadsAllowed === true },
      include: {
        source: true,
        _count: { select: { chunks: true, sections: true } }
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.file_access_settings_updated",
      resourceType: "guideline_document",
      resourceId: id,
      severity: "high",
      metadataJson: {
        downloadsAllowed: document.downloadsAllowed,
        accessLevel: document.accessLevel,
        licenseStatus: document.licenseStatus
      }
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

  async createSummary(documentId: string, dto: CreateGuidelineSummaryDto, user: AuthUser) {
    await this.ensureDocument(documentId, user);
    const sectionTypes = dto.sections.map((section) => section.sectionType);
    if (new Set(sectionTypes).size !== sectionTypes.length) throw new BadRequestException("Summary section types must be unique.");
    for (const section of dto.sections) {
      const citedBullets = new Set(section.citations.map((citation) => citation.bulletIndex));
      if (section.bullets.some((_, index) => !citedBullets.has(index))) throw new BadRequestException(`Every summary bullet requires a page citation: ${section.heading}.`);
      if (section.citations.some((citation) => citation.bulletIndex >= section.bullets.length || (citation.pageEnd && citation.pageEnd < citation.pageStart))) throw new BadRequestException(`Invalid citation range in ${section.heading}.`);
    }
    const sectionIds = dto.sections.flatMap((section) => section.citations.flatMap((citation) => citation.sectionId ? [citation.sectionId] : []));
    const chunkIds = dto.sections.flatMap((section) => section.citations.flatMap((citation) => citation.chunkId ? [citation.chunkId] : []));
    const [validSections, validChunks] = await Promise.all([
      this.prisma.guidelineSection.count({ where: { id: { in: sectionIds }, documentId } }),
      this.prisma.guidelineChunk.count({ where: { id: { in: chunkIds }, documentId } })
    ]);
    if (validSections !== new Set(sectionIds).size || validChunks !== new Set(chunkIds).size) throw new BadRequestException("Summary citations must reference this guideline document only.");
    const summary = await this.prisma.guidelineSummary.create({ data: {
      documentId, versionId: dto.versionId, status: "NEEDS_REVIEW", provenanceType: dto.provenanceType, createdByUserId: user.id,
      sections: { create: dto.sections.map((section, orderIndex) => ({ sectionType: section.sectionType, heading: section.heading.trim(), bulletsJson: section.bullets.map((bullet) => bullet.trim()), orderIndex, citations: { create: section.citations.map((citation) => ({ documentId, sectionId: citation.sectionId, chunkId: citation.chunkId, bulletIndex: citation.bulletIndex, pageStart: citation.pageStart, pageEnd: citation.pageEnd, citationType: citation.citationType, label: citation.label.trim() })) } })) }
    }, include: { sections: { orderBy: { orderIndex: "asc" }, include: { citations: true } } } });
    await this.audit.record({ actorUserId: user.id, action: "guideline.summary_draft_created", resourceType: "guideline_summary", resourceId: summary.id, severity: "high", metadataJson: { documentId, provenanceType: dto.provenanceType, sectionCount: dto.sections.length, status: "NEEDS_REVIEW" } });
    return summary;
  }

  async reviewSummary(documentId: string, summaryId: string, dto: ReviewGuidelineSummaryDto, user: AuthUser) {
    await this.ensureDocument(documentId, user);
    if (!user.roles.includes("Doctor")) throw new ForbiddenException("A Doctor role is required to approve or reject a clinical guideline summary.");
    const existing = await this.prisma.guidelineSummary.findFirst({ where: { id: summaryId, documentId }, include: { sections: { include: { citations: true } } } });
    if (!existing) throw new NotFoundException("Guideline summary not found.");
    if (dto.decision === "CLINIC_APPROVED") {
      const present = new Set(existing.sections.map((section) => section.sectionType));
      const missing = requiredSummarySections.filter((section) => !present.has(section));
      if (missing.length) throw new BadRequestException(`A clinic-approved summary requires all structured sections. Missing: ${missing.join(", ")}.`);
      if (existing.sections.some((section) => !section.citations.length)) throw new BadRequestException("Every clinic-approved summary section requires page citations.");
    }
    const reviewed = await this.prisma.$transaction(async (tx) => {
      if (dto.decision === "CLINIC_APPROVED") await tx.guidelineSummary.updateMany({ where: { documentId, status: "CLINIC_APPROVED", id: { not: summaryId } }, data: { status: "SUPERSEDED" } });
      return tx.guidelineSummary.update({ where: { id: summaryId }, data: { status: dto.decision, reviewReason: dto.reason.trim(), reviewedByUserId: user.id, reviewedAt: new Date(), publishedAt: dto.decision === "CLINIC_APPROVED" ? new Date() : null }, include: { sections: { orderBy: { orderIndex: "asc" }, include: { citations: true } } } });
    });
    await this.audit.record({ actorUserId: user.id, action: "guideline.summary_reviewed", resourceType: "guideline_summary", resourceId: summaryId, severity: "high", reason: dto.reason.trim(), metadataJson: { documentId, previousStatus: existing.status, decision: dto.decision, autoApproved: false } });
    return reviewed;
  }

  async upload(file: UploadedGuidelineFile, dto: UploadGuidelineDto, user: AuthUser) {
    if (!file?.buffer) throw new BadRequestException("Upload a PDF, plain text, or Markdown guideline file.");
    const extension = extname(file.originalname).toLowerCase();
    const accepted = file.mimetype === "application/pdf" && extension === ".pdf"
      || ["text/plain", "text/markdown"].includes(file.mimetype) && [".txt", ".md", ".markdown"].includes(extension);
    if (!accepted) {
      throw new BadRequestException("Only matching PDF, TXT, and Markdown files are accepted.");
    }
    assertGuidelineFileSignature(file.buffer, file.mimetype);

    const documentsBefore = await this.prisma.guidelineDocument.count();
    const hash = sha256(file.buffer);
    const duplicate = await this.prisma.guidelineDocument.findFirst({ where: { fileSha256: hash } });
    if (duplicate) {
      await this.audit.record({ actorUserId: user.id, action: "guideline.upload_duplicate_rejected", resourceType: "guideline_document", resourceId: duplicate.id, severity: "high", metadataJson: { documentsBefore, documentsAfter: documentsBefore, hash, duplicateDecision: "reject_exact_duplicate", uploadIntent: dto.uploadIntent } });
      throw new BadRequestException({ code: "GUIDELINE_EXACT_DUPLICATE", message: "This exact guideline file is already stored in the local library.", documentId: duplicate.id, hash });
    }
    if (dto.uploadIntent !== "create_new_guideline") {
      throw new BadRequestException({ code: "GUIDELINE_VERSION_ASSET_STORAGE_REQUIRED", message: "Version and restore uploads require version-specific authoritative asset storage and cannot replace an existing document." });
    }

    const source = dto.sourceId
      ? await this.ensureSource(dto.sourceId)
      : await this.findOrCreateLicensedUploadSource(dto.sourceOrganization ?? "Private Licensed Upload");

    const storageRoot = join(process.cwd(), "storage", "guidelines", "private");
    await mkdir(storageRoot, { recursive: true });
    const fileName = `${hash}${extension}`;
    const localFilePath = join(storageRoot, fileName);
    const storedFile = encryptForVault(file.buffer);
    await writeFile(localFilePath, storedFile.buffer);

    const job = await this.createJob("PRIVATE_UPLOAD", "RUNNING", user, {
      sourceId: source.id,
      inputFileName: file.originalname,
      message: "Private licensed upload received for local extraction."
    });

    try {
      const extracted = await extractDocument(file.buffer, file.mimetype);
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
        pageCount: extracted.pageCount,
        fileSha256: hash,
        localFilePath,
        fileEncrypted: storedFile.encrypted,
        fileEncryptionKeyId: storedFile.encryptionKeyId,
        fileEncryptionIv: storedFile.encryptionIv,
        fileEncryptionTag: storedFile.encryptionTag,
        importedByUserId: user.id,
        text: extracted.text
      });
      await this.finishJob(job.id, "SUCCEEDED", { documentId: document.id, chunkCount: document._count.chunks });
      await this.audit.record({
        actorUserId: user.id,
        action: "guideline.uploaded",
        resourceType: "guideline_document",
        resourceId: document.id,
        severity: "high",
        metadataJson: {
          fileMimeType: file.mimetype,
          fileSha256: hash,
          accessLevel: document.accessLevel,
          encryptedAtRest: document.fileEncrypted,
          downloadsAllowed: document.downloadsAllowed,
          documentsBefore,
          documentsAfter: documentsBefore + 1,
          newDocumentId: document.id,
          newVersionId: null,
          hash,
          duplicateDecision: "unique_file_created",
          statusChanges: [{ documentId: document.id, from: null, to: document.guidelineStatus }]
        }
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
      const duplicate = await this.prisma.guidelineDocument.findFirst({
        where: {
          OR: [
            { originalUrl: url.toString() },
            { fileSha256: hash }
          ]
        },
        include: { source: true, _count: { select: { chunks: true, sections: true } } }
      });
      if (duplicate) {
        await this.finishJob(job.id, "SUCCEEDED", {
          documentId: duplicate.id,
          chunkCount: duplicate._count.chunks,
          skippedExisting: true
        });
        return { document: safeDocument(duplicate), importJobId: job.id, skippedExisting: true };
      }
      const isPdf = contentType.includes("application/pdf") || url.pathname.toLowerCase().endsWith(".pdf") || buffer.subarray(0, 4).toString("utf8") === "%PDF";
      if (isPdf) assertGuidelineFileSignature(buffer, "application/pdf");
      const localFile = isPdf ? await this.storeOpenImportFile(buffer, hash, ".pdf") : null;
      const extracted = isPdf ? await extractDocument(buffer, "application/pdf") : { text: htmlToText(buffer.toString("utf8")), pageCount: null };
      const document = await this.createIndexedDocument({
        source,
        title: dto.title,
        specialty: dto.specialty,
        topic: dto.topic,
        versionLabel: dto.versionLabel,
        licenseStatus: source.sourceType === "OPEN_PUBLIC" ? "OPEN" : "CHECK_REQUIRED",
        accessLevel: dto.accessLevel ?? source.defaultAccessLevel,
        originalUrl: url.toString(),
        localFilePath: localFile?.localFilePath,
        fileName: localFile?.fileName,
        fileMimeType: localFile?.fileMimeType,
        pageCount: extracted.pageCount,
        fileSha256: hash,
        fileEncrypted: localFile?.fileEncrypted,
        fileEncryptionKeyId: localFile?.fileEncryptionKeyId,
        fileEncryptionIv: localFile?.fileEncryptionIv,
        fileEncryptionTag: localFile?.fileEncryptionTag,
        importedByUserId: user.id,
        text: extracted.text
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

  async uploadDemoText(body: Record<string, unknown>, user: AuthUser) {
    const title = String(body.title ?? "").trim();
    const text = String(body.text ?? "").trim();
    if (!title || !text) throw new BadRequestException("Title and text are required.");

    const sourceName = String(body.sourceName ?? "Local Clinic Protocol").trim() || "Local Clinic Protocol";
    let source = await this.prisma.guidelineSource.findFirst({ where: { name: sourceName } });
    if (!source) {
      source = await this.prisma.guidelineSource.create({
        data: {
          name: sourceName,
          organization: sourceName,
          sourceType: "LINK_ONLY",
          specialties: ["women_health", "obgyn"],
          defaultAccessLevel: "OWNER_DOCTOR",
          notes: "Local demo text source. Imported documents require clinical governance review.",
          active: true
        }
      });
    }

    const document = await this.createIndexedDocument({
      source,
      title,
      specialty: String(body.specialty ?? "Women's health"),
      topic: String(body.topic ?? "Guideline center safety"),
      subtopic: clean(String(body.subtopic ?? "")) ?? undefined,
      versionLabel: String(body.versionLabel ?? "demo_text"),
      licenseStatus: "CHECK_REQUIRED",
      accessLevel: "OWNER_DOCTOR",
      importedByUserId: user.id,
      text
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.demo_text_uploaded",
      resourceType: "guideline_document",
      resourceId: document.id,
      severity: "high",
      metadataJson: { sourceName, externalAiAccess: false }
    });
    return safeDocument(document);
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

  async reindexAll(user: AuthUser) {
    const documents = await this.prisma.guidelineDocument.findMany({
      where: this.documentAccessWhere(user),
      select: { id: true }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.reindex_requested",
      resourceType: "guideline_document",
      severity: "high",
      metadataJson: { documentCount: documents.length, externalAiAccess: false }
    });
    return { status: "accepted", documentCount: documents.length };
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

  async archiveDocument(id: string, dto: Partial<ReviewGuidelineDto> | undefined, user: AuthUser) {
    return this.reviewDocument(id, { ...(dto ?? {}), decision: "ARCHIVED" }, user);
  }

  async search(query: SearchGuidelinesDto, user: AuthUser, mode: SearchMode = "SEARCH_ONLY") {
    const q = query.q?.trim() ?? "";
    const limit = Math.min(Math.max(Number(query.limit) || 8, 1), 20);
    const terms = expandGuidelineConcepts(q);
    const requestedYear = Number(query.year);
    const chunks = await this.prisma.guidelineChunk.findMany({
      where: {
        document: {
          ...this.documentAccessWhere(user),
          ...(query.specialty ? { specialty: query.specialty.toLowerCase() } : {}),
          ...(query.topic ? { topic: query.topic.toLowerCase() } : {}),
          ...(query.organization ? { organization: { contains: query.organization, mode: "insensitive" } } : {}),
          ...(query.status ? { guidelineStatus: query.status as GuidelineStatus } : {}),
          ...(query.reviewStatus ? { reviewStatus: query.reviewStatus } : {}),
          ...(Number.isInteger(requestedYear) ? { publicationDate: { gte: new Date(`${requestedYear}-01-01T00:00:00.000Z`), lt: new Date(`${requestedYear + 1}-01-01T00:00:00.000Z`) } } : {}),
          ...(query.region || query.sourceKind ? { source: {
            ...(query.region ? { countryOrRegion: { contains: query.region, mode: "insensitive" as const } } : {}),
            ...(query.sourceKind === "official" ? { sourceType: "OPEN_PUBLIC" as const } : query.sourceKind === "custom" ? { sourceType: "LICENSED_UPLOAD" as const } : {})
          } } : {})
        }
      },
      include: { section: true, document: { include: { source: true, summaries: { where: { status: { in: ["CLINIC_APPROVED", "NEEDS_REVIEW"] } }, orderBy: { createdAt: "desc" }, take: 2, include: { sections: { orderBy: { orderIndex: "asc" }, include: { citations: true } } } } } } },
      take: 500,
      orderBy: { createdAt: "desc" }
    });
    const ranked = chunks
      .filter((chunk) => !query.clinicalArea || normalizeText(`${chunk.document.specialty} ${chunk.document.topic} ${chunk.document.subtopic ?? ""} ${chunk.section?.heading ?? ""} ${chunk.text}`).includes(normalizeText(query.clinicalArea)))
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
    const groupedMap = ranked.reduce<Record<string, typeof ranked>>((groups, result) => { (groups[result.clinicalSubtopic] ??= []).push(result); return groups; }, {});
    const groupedResults = Object.entries(groupedMap).map(([clinicalSubtopic, results]) => ({ clinicalSubtopic, results }));
    const synthesis = query.synthesis === "true" && ranked.length ? {
      status: "DOCTOR_REVIEW_REQUIRED",
      agreement: ranked.slice(0, 3).map((result) => ({ bullet: result.citedBullets[0] ?? result.snippet.slice(0, 220), documentId: result.documentId, page: result.pageStart })),
      differences: "Compare population, version, region, and recommendation wording in each cited source.",
      evidenceGaps: "No inference is made where the indexed sources do not provide a page-cited statement.",
      sourceLinks: ranked.slice(0, 5).map((result) => ({ documentId: result.documentId, page: result.pageStart }))
    } : null;
    return { results: ranked, groupedResults, synthesis, doctorReviewRequired: true, expandedConcepts: terms, noSourceFound: ranked.length === 0 };
  }

  async ask(dto: AskGuidelineDto, user: AuthUser) {
    const search = await this.search({ q: dto.question, specialty: dto.specialty, topic: dto.topic, limit: "5" }, user, "MOCK_RAG");
    if (!search.results.length) {
      return {
        answer: "No matching source found in your local guideline library.",
        warning: "Doctor review required. Evidence summary only.",
        citations: [],
        mode: dto.mode ?? "concise",
        externalAiEnabled: false,
        externalAiAccess: false,
        doctorReviewRequired: true
      };
    }
    const sentences = search.results
      .flatMap((result) => sanitizeRetrievedEvidence(result.snippet).split(/(?<=[.!?])\s+/).slice(0, 2))
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
      mode: dto.mode ?? "concise",
      externalAiEnabled: false,
      externalAiAccess: false,
      doctorReviewRequired: true
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
    pageCount?: number | null;
    fileSha256?: string;
    fileEncrypted?: boolean;
    fileEncryptionKeyId?: string | null;
    fileEncryptionIv?: string | null;
    fileEncryptionTag?: string | null;
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
        pageCount: input.pageCount,
        fileSha256: input.fileSha256,
        fileEncrypted: input.fileEncrypted ?? false,
        fileEncryptionKeyId: input.fileEncryptionKeyId,
        fileEncryptionIv: input.fileEncryptionIv,
        fileEncryptionTag: input.fileEncryptionTag,
        importedByUserId: input.importedByUserId,
        accessLevel: input.accessLevel
      } as unknown as Prisma.GuidelineDocumentUncheckedCreateInput
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

  private async storeOpenImportFile(buffer: Buffer, hash: string, extension: string) {
    const storageRoot = join(process.cwd(), "storage", "guidelines", "private");
    await mkdir(storageRoot, { recursive: true });
    const fileName = `${hash}${extension}`;
    const localFilePath = join(storageRoot, fileName);
    const storedFile = encryptForVault(buffer);
    await writeFile(localFilePath, storedFile.buffer);
    return {
      localFilePath,
      fileName,
      fileMimeType: extension === ".pdf" ? "application/pdf" : "text/plain",
      fileEncrypted: storedFile.encrypted,
      fileEncryptionKeyId: storedFile.encryptionKeyId,
      fileEncryptionIv: storedFile.encryptionIv,
      fileEncryptionTag: storedFile.encryptionTag
    };
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

  private async documentFileResponse(id: string, user: AuthUser, action: FileAction) {
    const document = await this.prisma.guidelineDocument.findUnique({
      where: { id },
      include: {
        source: true,
        reviewDecisions: { orderBy: { decidedAt: "desc" }, take: 1 },
        _count: { select: { chunks: true, sections: true } }
      }
    });

    if (!document) {
      await this.auditFileAccess(user, action, id, false, "not_found");
      throw new NotFoundException("Guideline document not found.");
    }

    const decision = this.canAccessDocumentFile(document, user, action);
    if (!decision.allowed) {
      await this.auditFileAccess(user, action, id, false, decision.reason ?? "denied", document);
      throw new ForbiddenException("Guideline file access is not allowed.");
    }

    if (!document.localFilePath) {
      await this.auditFileAccess(user, action, id, false, "no_local_file", document);
      throw new NotFoundException("No private guideline file is stored for this document.");
    }

    const path = resolve(document.localFilePath);
    if (!isPathInsideVault(path)) {
      await this.auditFileAccess(user, action, id, false, "unsafe_storage_reference", document);
      throw new ForbiddenException("Guideline file storage reference is not allowed.");
    }

    try {
      await stat(path);
    } catch {
      await this.auditFileAccess(user, action, id, false, "file_missing", document);
      throw new NotFoundException("Guideline file is not available in secure storage.");
    }

    const stored = await readFile(path);
    let buffer: Buffer;
    try {
      buffer = document.fileEncrypted
        ? decryptFromVault(stored, {
            keyId: document.fileEncryptionKeyId,
            iv: document.fileEncryptionIv,
            tag: document.fileEncryptionTag
          })
        : stored;
    } catch (error) {
      await this.auditFileAccess(user, action, id, false, "encryption_unavailable", document);
      throw error;
    }

    await this.auditFileAccess(user, action, id, true, "allowed", document);

    const textPreview = action === "view" && document.fileMimeType === "text/plain";
    return {
      buffer,
      fileName: safeDownloadName(document.fileName ?? `${document.title}.txt`),
      mimeType: textPreview ? "text/plain; charset=utf-8" : document.fileMimeType ?? "application/octet-stream",
      disposition: action === "download" ? "attachment" : "inline",
      document: safeDocument(document),
      encryptedAtRest: document.fileEncrypted
    };
  }

  private canAccessDocumentFile(
    document: { accessLevel: GuidelineAccessLevel; guidelineStatus: GuidelineStatus; downloadsAllowed: boolean },
    user: AuthUser,
    action: FileAction
  ): FileAccessDecision {
    if (!user.permissions.includes("guidelines.read") && !user.permissions.includes("guidelines.search")) {
      return { allowed: false, reason: "missing_guideline_permission" };
    }
    if (action === "download" && !document.downloadsAllowed) {
      return { allowed: false, reason: "downloads_disabled_by_owner" };
    }
    if (document.guidelineStatus === "ARCHIVED") {
      return { allowed: isOwner(user), reason: isOwner(user) ? undefined : "archived_owner_only" };
    }
    if (document.accessLevel === "OWNER_ONLY") {
      return { allowed: isOwner(user), reason: isOwner(user) ? undefined : "owner_only" };
    }
    if (document.accessLevel === "OWNER_DOCTOR") {
      return { allowed: isOwner(user) || user.roles.includes("Doctor"), reason: "owner_doctor_only" };
    }
    if (document.accessLevel === "CLINICAL_TEAM") {
      return { allowed: isOwner(user) || user.roles.includes("Doctor") || user.roles.includes("Nurse"), reason: "clinical_team_only" };
    }
    return { allowed: false, reason: "unknown_access_level" };
  }

  private auditFileAccess(
    user: AuthUser,
    action: FileAction,
    documentId: string,
    allowed: boolean,
    reason: string,
    document?: {
      accessLevel: GuidelineAccessLevel;
      guidelineStatus: GuidelineStatus;
      licenseStatus: GuidelineLicenseStatus;
      downloadsAllowed: boolean;
      fileEncrypted: boolean;
      fileMimeType: string | null;
    }
  ) {
    return this.audit.record({
      actorUserId: user.id,
      action: `guideline.file_${action}_${allowed ? "allowed" : "denied"}`,
      resourceType: "guideline_document",
      resourceId: documentId,
      severity: allowed ? "medium" : "high",
      metadataJson: {
        outcome: allowed ? "allowed" : "denied",
        reason,
        accessLevel: document?.accessLevel,
        guidelineStatus: document?.guidelineStatus,
        licenseStatus: document?.licenseStatus,
        downloadsAllowed: document?.downloadsAllowed,
        encryptedAtRest: document?.fileEncrypted,
        fileMimeType: document?.fileMimeType
      }
    });
  }

  private async withLastFileAccess<T extends { id: string }>(documents: T[]): Promise<Array<T & { lastFileAccess?: unknown }>>;
  private async withLastFileAccess<T extends { id: string }>(document: T): Promise<T & { lastFileAccess?: unknown }>;
  private async withLastFileAccess<T extends { id: string }>(input: T | T[]) {
    const documents = Array.isArray(input) ? input : [input];
    if (!documents.length) return input;
    const ids = documents.map((document) => document.id);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        resourceType: "guideline_document",
        resourceId: { in: ids },
        action: { in: ["guideline.file_view_allowed", "guideline.file_download_allowed"] }
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(ids.length * 2, 20),
      select: { resourceId: true, action: true, createdAt: true }
    });
    const byDocument = new Map<string, { action: string; createdAt: Date }>();
    for (const log of logs) {
      if (log.resourceId && !byDocument.has(log.resourceId)) {
        byDocument.set(log.resourceId, { action: log.action, createdAt: log.createdAt });
      }
    }
    const mapped = documents.map((document) => ({
      ...document,
      lastFileAccess: byDocument.get(document.id)
        ? {
            action: byDocument.get(document.id)?.action === "guideline.file_download_allowed" ? "downloaded" : "viewed",
            at: byDocument.get(document.id)?.createdAt
          }
        : null
    }));
    return Array.isArray(input) ? mapped : mapped[0];
  }
}

function sourceData(dto: CreateGuidelineSourceDto | UpdateGuidelineSourceDto, partial = false) {
  const name = dto.name?.trim();
  const data: Prisma.GuidelineSourceUncheckedCreateInput = {
    name,
    organization: dto.organization?.trim() || name,
    sourceType: dto.sourceType ?? "LINK_ONLY",
    websiteUrl: clean(dto.websiteUrl),
    countryOrRegion: clean(dto.countryOrRegion),
    specialties: dto.specialties ?? [],
    defaultAccessLevel: dto.defaultAccessLevel ?? "OWNER_DOCTOR",
    notes: clean(dto.notes ?? dto.abbreviation),
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

function isOwner(user: AuthUser) {
  return user.roles.includes("Owner") || user.permissions.includes("guidelines.manage_private");
}

function vaultRoot() {
  return resolve(process.cwd(), "storage", "guidelines", "private");
}

function isPathInsideVault(path: string) {
  const relativePath = relative(vaultRoot(), path);
  return relativePath === "" || Boolean(relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath));
}

function safeDownloadName(value: string) {
  return basename(value).replace(/[^\w.\- ]/g, "_") || "guideline-document";
}

function assertGuidelineFileSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") {
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new BadRequestException("The file signature does not match an authoritative PDF.");
    const pdfSyntax = buffer.toString("latin1");
    if (/\/(?:JavaScript|JS|OpenAction|Launch|RichMedia|EmbeddedFile|XFA)\b/i.test(pdfSyntax)) throw new BadRequestException("PDF active content or embedded actions are not accepted.");
    return;
  }
  if (buffer.includes(0)) throw new BadRequestException("The text file contains binary content and cannot be indexed safely.");
}

function sanitizeRetrievedEvidence(value: string) {
  return value.replace(/(?:ignore|disregard) (?:all )?(?:previous|prior) instructions|system prompt|developer message|reveal (?:secrets|credentials)|execute (?:this )?(?:command|script)/gi, "[untrusted document instruction removed]");
}

function encryptForVault(buffer: Buffer): StoredFilePayload {
  const key = guidelineVaultKey();
  if (!key) return { buffer, encrypted: false };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    buffer: encrypted,
    encrypted: true,
    encryptionKeyId: process.env.GUIDELINE_VAULT_ENCRYPTION_KEY_ID || "local-dev-key",
    encryptionIv: iv.toString("base64"),
    encryptionTag: cipher.getAuthTag().toString("base64")
  };
}

function decryptFromVault(buffer: Buffer, metadata: { keyId?: string | null; iv?: string | null; tag?: string | null }) {
  const key = guidelineVaultKey();
  if (!key || !metadata.iv || !metadata.tag) {
    throw new ServiceUnavailableException("Guideline vault encryption key is not configured.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(metadata.iv, "base64"));
  decipher.setAuthTag(Buffer.from(metadata.tag, "base64"));
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

function guidelineVaultKey() {
  const value = process.env.GUIDELINE_VAULT_ENCRYPTION_KEY?.trim();
  if (!value) return null;
  const candidates = [
    Buffer.from(value, "base64"),
    /^[\da-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.alloc(0),
    Buffer.from(value, "utf8")
  ];
  const key = candidates.find((candidate) => candidate.length === 32);
  if (!key) {
    throw new ServiceUnavailableException("GUIDELINE_VAULT_ENCRYPTION_KEY must resolve to 32 bytes.");
  }
  return key;
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

type SearchChunk = {
  id: string; text: string; normalizedText: string; citationLabel: string; pageStart: number | null; pageEnd: number | null;
  section: { heading: string } | null;
  document: {
    id: string; title: string; organization: string; versionLabel: string | null; publicationDate: Date | null; guidelineStatus: GuidelineStatus; reviewStatus: string; accessLevel: GuidelineAccessLevel; specialty: string; topic: string; subtopic: string | null;
    source: { name: string; countryOrRegion: string | null; sourceType: string };
    summaries: Array<{ status: string; sections: Array<{ heading: string; bulletsJson: Prisma.JsonValue; citations: Array<{ bulletIndex: number; pageStart: number; pageEnd: number | null }> }> }>;
  };
};

function rankChunk(
  chunk: SearchChunk,
  terms: string[],
  query: SearchGuidelinesDto
) {
  let score = 0;
  let matches = 0;
  const summaryText = summaryBullets(chunk).join(" ");
  const metadataText = normalizeText(`${chunk.document.title} ${chunk.document.organization} ${chunk.document.specialty} ${chunk.document.topic} ${chunk.document.subtopic ?? ""} ${chunk.section?.heading ?? ""}`);
  const combined = `${chunk.normalizedText} ${metadataText} ${normalizeText(summaryText)}`;
  const exactQuery = normalizeText(query.q ?? "");
  for (const term of terms) {
    if (combined.includes(term)) {
      matches += 1;
      score += 3;
    }
  }
  if (terms.length && matches === 0) return 0;
  if (exactQuery && combined.includes(exactQuery)) score += 12;
  if (exactQuery && metadataText.includes(exactQuery)) score += 6;
  if (query.specialty && chunk.document.specialty === query.specialty.toLowerCase()) score += 4;
  if (query.topic && chunk.document.topic === query.topic.toLowerCase()) score += 4;
  if (chunk.document.guidelineStatus === "ACTIVE") score += 6;
  if (chunk.document.guidelineStatus === "NEEDS_REVIEW") score += 1;
  if (chunk.document.summaries.some((summary) => summary.status === "CLINIC_APPROVED")) score += 5;
  if (/recommend|management|treatment|what not/i.test(chunk.section?.heading ?? "")) score += 4;
  if (chunk.document.publicationDate) score += Math.max(0, chunk.document.publicationDate.getUTCFullYear() - 2015) / 10;
  if (query.clinicalArea && combined.includes(normalizeText(query.clinicalArea))) score += 4;
  return score;
}

function formatSearchResult(
  chunk: SearchChunk,
  score: number
) {
  const citedBullets = summaryBullets(chunk).slice(0, 4);
  const summaryCitation = chunk.document.summaries.flatMap((summary) => summary.sections).flatMap((section) => section.citations)[0];
  const pageStart = chunk.pageStart ?? summaryCitation?.pageStart ?? 1;
  return {
    chunkId: chunk.id,
    documentId: chunk.document.id,
    title: chunk.document.title,
    organization: chunk.document.organization,
    versionLabel: chunk.document.versionLabel,
    publicationDate: chunk.document.publicationDate,
    status: chunk.document.guidelineStatus,
    reviewStatus: chunk.document.reviewStatus,
    region: chunk.document.source.countryOrRegion,
    sourceKind: chunk.document.source.sourceType === "OPEN_PUBLIC" ? "official" : "custom",
    sectionHeading: chunk.section?.heading ?? "Guideline section",
    snippet: chunk.text.slice(0, 650),
    citedBullets,
    pageStart,
    pageEnd: chunk.pageEnd ?? summaryCitation?.pageEnd ?? pageStart,
    clinicalSubtopic: classifyGuidelineSubtopic(`${chunk.section?.heading ?? ""} ${chunk.text}`),
    matchReason: citedBullets.length ? "Matched reviewed summary and indexed source text" : "Matched original indexed PDF text or metadata",
    citationLabel: chunk.citationLabel,
    accessLevel: chunk.document.accessLevel,
    score
  };
}

function summaryBullets(chunk: SearchChunk) {
  return chunk.document.summaries.flatMap((summary) => summary.sections.flatMap((section) => Array.isArray(section.bulletsJson) ? section.bulletsJson.filter((bullet): bullet is string => typeof bullet === "string") : []));
}

function expandGuidelineConcepts(query: string) {
  const normalized = normalizeText(query);
  const concepts = [
    ["pco", "pcos", "polycystic ovary syndrome", "polycystic ovarian syndrome", "تكيس المبايض", "متلازمة تكيس المبايض"],
    ["hyperpigmentation", "pigmentation", "تصبغات", "فرط التصبغ"],
    ["sensitive area", "sensitive areas", "منطقة حساسة", "المناطق الحساسة"],
    ["pregnancy", "pregnant", "الحمل", "حامل"],
    ["infertility", "subfertility", "تأخر الانجاب", "العقم"]
  ].map((aliases) => aliases.map(normalizeText));
  const matched = concepts.find((aliases) => aliases.some((alias) => alias === normalized || alias.includes(normalized) || normalized.includes(alias)));
  return [...new Set([...(matched ?? []), ...keywords(query)])].filter(Boolean);
}

function classifyGuidelineSubtopic(value: string) {
  const text = normalizeText(value);
  if (/infertil|خصوب|عقم|تاخر الانجاب/.test(text)) return "PCOS and infertility";
  if (/pregnan|حمل/.test(text)) return "PCOS and pregnancy";
  if (/metabolic|insulin|weight|سكري/.test(text)) return "PCOS and metabolic risk";
  if (/ovulat|تبويض/.test(text)) return "PCOS and ovulation";
  if (/menstrual|bleeding|cycle|دور|نزف/.test(text)) return "PCOS and menstrual disorders";
  if (/endometr|بطان/.test(text)) return "PCOS and endometrial risk";
  if (/monitor|follow up|متابع/.test(text)) return "PCOS monitoring";
  if (/treat|management|medication|علاج/.test(text)) return "PCOS treatment-related guidance";
  return "General clinical guidance";
}

async function extractDocument(buffer: Buffer, mimeType: string): Promise<{ text: string; pageCount: number | null }> {
  if (mimeType === "text/plain" || mimeType === "text/markdown") return { text: buffer.toString("utf8"), pageCount: null };
  const pdfModule = (await import("pdf-parse")) as unknown as {
    default?: (input: Buffer) => Promise<{ text: string; numpages?: number }>;
    PDFParse?: new (input: { data: Buffer }) => { getText: () => Promise<{ text: string; total?: number }>; destroy?: () => Promise<void> | void };
    legacyParser?: (input: Buffer) => Promise<{ text: string; numpages?: number }>;
  };
  if (typeof pdfModule.default === "function") {
    const parsed = await pdfModule.default(buffer);
    return { text: parsed.text, pageCount: parsed.numpages ?? null };
  }
  if (typeof pdfModule.legacyParser === "function") {
    const parsed = await pdfModule.legacyParser(buffer);
    return { text: parsed.text, pageCount: parsed.numpages ?? null };
  }
  if (typeof pdfModule.PDFParse === "function") {
    const parser = new pdfModule.PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return { text: parsed.text, pageCount: parsed.total ?? null };
    } finally {
      await parser.destroy?.();
    }
  }
  throw new ServiceUnavailableException("PDF text extraction is not available.");
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

function isGuidelineStatus(value?: string): value is GuidelineStatus {
  return Boolean(value && Object.values(GuidelineStatus).includes(value as GuidelineStatus));
}
