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
import { detectAndValidateDocument } from "./storage/document-signature";
import { LocalEncryptedStorageService } from "./storage/local-encrypted-storage.service";
import { NotConfiguredDocumentMalwareScanner } from "./storage/document-malware-scanner";

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
    private readonly patientFileStorage: PatientFileStorageService,
    private readonly encryptedStorage: LocalEncryptedStorageService,
    private readonly malwareScanner: NotConfiguredDocumentMalwareScanner
  ) {}

  async list(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const where: Prisma.PatientDocumentWhereInput = { patientId, ...branchScope(user) };
    if (!user.permissions.includes("patient_document.restricted_read")) {
      where.confidentialityLevel = { not: "restricted" };
    }
    if (user.roles.includes("Receptionist")) {
      where.documentType = { in: ["insurance_document_placeholder", "consent_form"] };
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

  async createFromUpload(patientId: string, file: UploadedPatientDocumentFile, dto: UploadPatientDocumentDto, user: AuthUser, requestId?: string) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    if (!file?.buffer) throw new BadRequestException("Upload a file.");
    if (dto.confidentialityLevel === "restricted" && !user.permissions.includes("patient_document.restricted_read")) {
      throw new ForbiddenException("Restricted documents require restricted document permission.");
    }

    const originalMimeType = clean(file.mimetype) ?? "application/octet-stream";
    const detected = detectAndValidateDocument(file.buffer, originalMimeType, file.originalname);
    const maximum = detected.kind === "image" ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.buffer.length > maximum) throw new BadRequestException({ code: "DOCUMENT_TOO_LARGE", message: "Document exceeds the route limit." });
    const isImage = detected.kind === "image";
    let bufferForStorage = file.buffer;
    let fileMimeType = originalMimeType;
    let safeExtension: string = detected.extension;
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
    }

    const scan = await this.malwareScanner.scan(bufferForStorage);
    const failClosed = process.env.APP_ENV === "production" || process.env.PATIENT_DOCUMENT_SCAN_FAIL_CLOSED === "true";
    if (scan.status === "REJECTED") throw new BadRequestException({ code: "DOCUMENT_QUARANTINED", message: "Document was rejected by security scanning." });
    if (failClosed && scan.status !== "CLEAN") throw new BadRequestException({ code: "DOCUMENT_SCAN_REQUIRED", message: "A clean malware scan is required." });

    const prepared = await this.encryptedStorage.writeQuarantine(bufferForStorage);

    const displayFileName = safeDisplayFileName(file.originalname);
    let document;
    try {
      document = await this.prisma.$transaction(tx => tx.patientDocument.create({ data: {
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
        storageMode: "secure_encrypted_local",
        fileName: displayFileName,
        originalFileName: displayFileName,
        displayFileName,
        fileMimeType,
        fileSizeBytes: prepared.sizeBytes,
        fileReference: null,
        fileSha256: storedSha256,
        imageWidth,
        imageHeight,
        sanitizedSha256: isImage ? storedSha256 : null,
        originalSha256Internal,
        exifStripped,
        metadataSanitizedAt,
        localDemoFilePath: null,
        storageKey: prepared.storageKey,
        originalFilenameSafe: displayFileName,
        detectedMimeType: fileMimeType,
        declaredMimeType: originalMimeType,
        sha256: storedSha256,
        encryptionVersion: prepared.encryptionVersion,
        encryptionKeyId: prepared.encryptionKeyId,
        scanStatus: scan.status,
        scanProvider: scan.provider,
        scanCompletedAt: new Date(),
        quarantineStatus: "QUARANTINED",
        createdRequestId: requestId ?? null,
        ingestWarnings: ingestWarnings.length ? ingestWarnings : undefined,
        sourceText: clean(dto.sourceText),
        summaryText: clean(dto.summaryText),
        tagsJson: dto.tagsJson as Prisma.InputJsonValue | undefined,
        confidentialityLevel: dto.confidentialityLevel ?? "normal",
        uploadedByUserId: user.id
      }, include: includeDocument }));
    } catch (error) { await this.encryptedStorage.deleteQuarantine(prepared.storageKey); throw error; }

    try {
      const promotedKey = await this.encryptedStorage.validateAndPromote(prepared.storageKey);
      document = await this.prisma.patientDocument.update({ where: { id: document.id }, data: { storageKey: promotedKey, quarantineStatus: "PROMOTED" }, include: includeDocument });
    } catch (error) {
      await this.prisma.patientDocument.update({ where: { id: document.id }, data: { quarantineStatus: "ORPHANED" } });
      throw new BadRequestException({ code: "DOCUMENT_QUARANTINED", message: "Document promotion failed and requires reconciliation." });
    }

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
        storedSizeBytes: prepared.sizeBytes,
        imageWidth,
        imageHeight,
        removedMetadataTypes,
        warningCodes: ingestWarnings
      }
    });

    return safeDocument(document);
  }

  async download(patientId: string, documentId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const document = await this.prisma.patientDocument.findFirst({ where: { id: documentId, patientId, ...branchScope(user) } });
    if (!document) throw new NotFoundException({ code: "DOCUMENT_NOT_FOUND", message: "Document not found." });
    if (document.confidentialityLevel === "restricted" && !user.permissions.includes("patient_document.restricted_read")) throw new ForbiddenException({ code: "DOCUMENT_ACCESS_DENIED", message: "Document access denied." });
    if (user.roles.includes("Receptionist") && !["insurance_document_placeholder", "consent_form"].includes(document.documentType)) throw new ForbiddenException({ code: "DOCUMENT_ACCESS_DENIED", message: "Document access denied." });
    if (document.status === "archived" || document.status === "voided" || document.quarantineStatus !== "PROMOTED" || !document.storageKey) throw new BadRequestException({ code: "DOCUMENT_NOT_READY", message: "Document is not ready." });
    const buffer = await this.encryptedStorage.readAuthorized(document.storageKey, document.encryptionKeyId);
    if (sha256(buffer) !== document.sha256) throw new BadRequestException({ code: "DOCUMENT_INTEGRITY_FAILED", message: "Document integrity check failed." });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.downloaded", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", metadataJson: { access: "authorized" } });
    return { buffer, mimeType: document.detectedMimeType ?? "application/octet-stream", filename: safeDisplayFileName(document.originalFilenameSafe ?? document.displayFileName ?? "document") };
  }

  async get(patientId: string, documentId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const document = await this.prisma.patientDocument.findFirst({ where: { id: documentId, patientId, ...branchScope(user) }, include: includeDocument });
    if (!document) throw new NotFoundException({ code: "DOCUMENT_NOT_FOUND", message: "Patient document not found." });
    if (document.confidentialityLevel === "restricted" && !user.permissions.includes("patient_document.restricted_read")) {
      throw new ForbiddenException({ code: "DOCUMENT_ACCESS_DENIED", message: "Document access denied." });
    }
    if (user.roles.includes("Receptionist") && !["insurance_document_placeholder", "consent_form"].includes(document.documentType)) throw new ForbiddenException({ code: "DOCUMENT_ACCESS_DENIED", message: "Document access denied." });
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

function safeDocument<T extends { originalSha256Internal?: string | null; localDemoFilePath?: string | null; fileReference?: string | null; storageKey?: string | null }>(document: T) {
  const { originalSha256Internal: _originalSha256Internal, localDemoFilePath: _localDemoFilePath, fileReference: _fileReference, storageKey: _storageKey, ...safe } = document;
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
