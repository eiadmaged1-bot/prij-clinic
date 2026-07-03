import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { ImageSanitizerService } from "../files/image-sanitizer.service";
import { prismaStorageMode, resolvePatientFileStoragePolicy } from "../files/file-storage-policy";
import { sha256 } from "../files/file-hash";
import { PatientFileStorageService, safeDisplayFileName } from "../files/patient-file-storage.service";
import { PrismaService } from "../prisma/prisma.service";
import { ArchivePatientDocumentDto, CreatePatientDocumentDto, UpdatePatientDocumentDto, UploadPatientDocumentDto, VoidPatientDocumentDto } from "./dto";

const includeDocument = { patient: true } satisfies Prisma.PatientDocumentInclude;
const ALLOWED_NON_IMAGE_MIME_TYPES = new Set(["application/pdf", "text/plain"]);

type UploadedPatientDocumentFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class PatientDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly imageSanitizer: ImageSanitizerService,
    private readonly patientFileStorage: PatientFileStorageService
  ) {}

  async list(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const where: Prisma.PatientDocumentWhereInput = { patientId, ...branchScope(user) };
    if (!user.permissions.includes("patient_document.restricted_read")) {
      where.confidentialityLevel = { not: "restricted" };
    }
    const documents = await this.prisma.patientDocument.findMany({ where, orderBy: { createdAt: "desc" }, include: includeDocument });
    return documents.map(safeDocument);
  }

  async create(patientId: string, dto: CreatePatientDocumentDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const policy = resolvePatientFileStoragePolicy(dto.storageMode);
    if (policy.mode !== "metadata_only") throw new BadRequestException("Use the upload endpoint for local demo file storage.");
    if (dto.confidentialityLevel === "restricted" && !user.permissions.includes("patient_document.restricted_read")) {
      throw new ForbiddenException("Restricted documents require restricted document permission.");
    }
    const document = await this.prisma.patientDocument.create({
      data: {
        patientId,
        branchId: patient.branchId,
        linkedReportId: dto.linkedReportId ?? null,
        linkedResultId: dto.linkedResultId ?? null,
        linkedConsentRecordId: dto.linkedConsentRecordId ?? null,
        linkedEncounterId: dto.linkedEncounterId ?? null,
        linkedPrescriptionId: dto.linkedPrescriptionId ?? null,
        title: dto.title.trim(),
        documentType: dto.documentType,
        category: dto.category.trim(),
        storageMode: prismaStorageMode(policy.mode),
        fileName: clean(dto.fileName),
        fileMimeType: clean(dto.fileMimeType),
        fileSizeBytes: dto.fileSizeBytes,
        fileReference: clean(dto.fileReference),
        fileSha256: clean(dto.fileSha256),
        sourceText: clean(dto.sourceText),
        summaryText: clean(dto.summaryText),
        tagsJson: dto.tagsJson as Prisma.InputJsonValue | undefined,
        confidentialityLevel: dto.confidentialityLevel ?? "normal",
        uploadedByUserId: user.id
      },
      include: includeDocument
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.created", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", metadataJson: { patientId, documentType: document.documentType, storageMode: document.storageMode, confidentialityLevel: document.confidentialityLevel } });
    return safeDocument(document);
  }

  async createFromUpload(patientId: string, file: UploadedPatientDocumentFile, dto: UploadPatientDocumentDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    if (!file?.buffer) throw new BadRequestException("Upload a file.");
    if (dto.confidentialityLevel === "restricted" && !user.permissions.includes("patient_document.restricted_read")) {
      throw new ForbiddenException("Restricted documents require restricted document permission.");
    }

    const originalMimeType = clean(file.mimetype) ?? "application/octet-stream";
    const policy = resolvePatientFileStoragePolicy(dto.storageMode);
    const isImage = this.imageSanitizer.isImageMimeType(originalMimeType);
    let bufferForStorage = file.buffer;
    let fileMimeType = originalMimeType;
    let safeExtension = extensionForMime(originalMimeType);
    let originalSha256Internal = sha256(file.buffer);
    let storedSha256 = originalSha256Internal;
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;
    let exifStripped = false;
    let metadataSanitizedAt: Date | null = null;
    const removedMetadataTypes: string[] = [];
    const ingestWarnings: string[] = [];

    if (isImage) {
      const sanitized = await this.imageSanitizer.sanitizeImageUpload({
        buffer: file.buffer,
        originalFilename: file.originalname,
        mimeType: originalMimeType
      });
      bufferForStorage = sanitized.sanitizedBuffer;
      fileMimeType = sanitized.sanitizedMimeType;
      safeExtension = sanitized.safeExtension;
      originalSha256Internal = sanitized.originalSha256;
      storedSha256 = sanitized.sanitizedSha256;
      imageWidth = sanitized.width;
      imageHeight = sanitized.height;
      exifStripped = true;
      metadataSanitizedAt = new Date();
      removedMetadataTypes.push(...sanitized.removedMetadataTypes);
      ingestWarnings.push(...sanitized.warnings);
    } else if (!ALLOWED_NON_IMAGE_MIME_TYPES.has(originalMimeType)) {
      throw new BadRequestException("Unsupported document file type.");
    }

    const prepared = await this.patientFileStorage.prepareForPatientDocument({
      buffer: bufferForStorage,
      mimeType: fileMimeType,
      safeExtension,
      sha256Override: storedSha256,
      policy
    });
    ingestWarnings.push(...prepared.warnings);

    const displayFileName = safeDisplayFileName(file.originalname);
    const document = await this.prisma.patientDocument.create({
      data: {
        patientId,
        branchId: patient.branchId,
        linkedReportId: dto.linkedReportId ?? null,
        linkedResultId: dto.linkedResultId ?? null,
        linkedConsentRecordId: dto.linkedConsentRecordId ?? null,
        linkedEncounterId: dto.linkedEncounterId ?? null,
        linkedPrescriptionId: dto.linkedPrescriptionId ?? null,
        title: dto.title?.trim() || displayFileName,
        documentType: dto.documentType,
        category: dto.category?.trim() || "Uploaded document",
        storageMode: prismaStorageMode(prepared.storageMode),
        fileName: displayFileName,
        originalFileName: displayFileName,
        displayFileName,
        fileMimeType,
        fileSizeBytes: prepared.fileSizeBytes,
        fileReference: prepared.localDemoFilePath ?? null,
        fileSha256: storedSha256,
        imageWidth,
        imageHeight,
        sanitizedSha256: isImage ? storedSha256 : null,
        originalSha256Internal,
        exifStripped,
        metadataSanitizedAt,
        localDemoFilePath: prepared.localDemoFilePath ?? null,
        ingestWarnings: ingestWarnings.length ? ingestWarnings : undefined,
        sourceText: clean(dto.sourceText),
        summaryText: clean(dto.summaryText),
        tagsJson: dto.tagsJson as Prisma.InputJsonValue | undefined,
        confidentialityLevel: dto.confidentialityLevel ?? "normal",
        uploadedByUserId: user.id
      },
      include: includeDocument
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient_document.uploaded",
      resourceType: "patient_document",
      resourceId: document.id,
      branchId: document.branchId,
      severity: "high",
      metadataJson: {
        patientId,
        uploadedByUserId: user.id,
        originalMimeType,
        sanitizedMimeType: fileMimeType,
        storageMode: document.storageMode,
        exifStripped,
        originalSizeBytes: file.size ?? file.buffer.length,
        storedSizeBytes: prepared.fileSizeBytes,
        imageWidth,
        imageHeight,
        removedMetadataTypes,
        warningCodes: ingestWarnings
      }
    });

    return safeDocument(document);
  }

  async get(patientId: string, documentId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const document = await this.prisma.patientDocument.findFirst({ where: { id: documentId, patientId, ...branchScope(user) }, include: includeDocument });
    if (!document) throw new NotFoundException("Patient document not found.");
    if (document.confidentialityLevel === "restricted" && !user.permissions.includes("patient_document.restricted_read")) {
      throw new ForbiddenException("Restricted document access denied.");
    }
    return safeDocument(document);
  }

  async update(patientId: string, documentId: string, dto: UpdatePatientDocumentDto, user: AuthUser) {
    const existing = await this.get(patientId, documentId, user);
    if (existing.status === "archived" || existing.status === "voided") throw new BadRequestException("Archived or voided documents cannot be edited.");
    const document = await this.prisma.patientDocument.update({ where: { id: documentId }, data: { title: dto.title?.trim(), status: dto.status, summaryText: dto.summaryText === undefined ? undefined : clean(dto.summaryText), tagsJson: dto.tagsJson as Prisma.InputJsonValue | undefined }, include: includeDocument });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.updated", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", metadataJson: { patientId, changedFields: Object.keys(dto) } });
    return safeDocument(document);
  }

  async review(patientId: string, documentId: string, user: AuthUser) {
    await this.get(patientId, documentId, user);
    const document = await this.prisma.patientDocument.update({ where: { id: documentId }, data: { status: "reviewed", reviewedByUserId: user.id, reviewedAt: new Date() }, include: includeDocument });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.reviewed", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", metadataJson: { patientId } });
    return safeDocument(document);
  }

  async archive(patientId: string, documentId: string, dto: ArchivePatientDocumentDto, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Archive reason is required.");
    await this.get(patientId, documentId, user);
    const document = await this.prisma.patientDocument.update({ where: { id: documentId }, data: { status: "archived", archivedByUserId: user.id, archivedAt: new Date(), archiveReason: dto.reason.trim() }, include: includeDocument });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.archived", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", reason: dto.reason.trim(), metadataJson: { patientId } });
    return safeDocument(document);
  }

  async void(patientId: string, documentId: string, dto: VoidPatientDocumentDto, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Void reason is required.");
    await this.get(patientId, documentId, user);
    const document = await this.prisma.patientDocument.update({ where: { id: documentId }, data: { status: "voided", voidReason: dto.reason.trim() }, include: includeDocument });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.voided", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", reason: dto.reason.trim(), metadataJson: { patientId } });
    return document;
  }
}

function clean(value?: string) {
  return value?.trim() || null;
}

function safeDocument<T extends { originalSha256Internal?: string | null }>(document: T) {
  const { originalSha256Internal: _originalSha256Internal, ...safe } = document;
  return safe;
}

function extensionForMime(mimeType: string) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "text/plain") return ".txt";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".bin";
}
