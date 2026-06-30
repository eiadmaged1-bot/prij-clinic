import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { ArchivePatientDocumentDto, CreatePatientDocumentDto, UpdatePatientDocumentDto, VoidPatientDocumentDto } from "./dto";

const includeDocument = { patient: true } satisfies Prisma.PatientDocumentInclude;

@Injectable()
export class PatientDocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const where: Prisma.PatientDocumentWhereInput = { patientId, ...branchScope(user) };
    if (!user.permissions.includes("patient_document.restricted_read")) {
      where.confidentialityLevel = { not: "restricted" };
    }
    return this.prisma.patientDocument.findMany({ where, orderBy: { createdAt: "desc" }, include: includeDocument });
  }

  async create(patientId: string, dto: CreatePatientDocumentDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    if (dto.storageMode && dto.storageMode !== "metadata_only") {
      throw new BadRequestException("Document archive is metadata-only in this demo.");
    }
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
        storageMode: "metadata_only",
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
    return document;
  }

  async get(patientId: string, documentId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const document = await this.prisma.patientDocument.findFirst({ where: { id: documentId, patientId, ...branchScope(user) }, include: includeDocument });
    if (!document) throw new NotFoundException("Patient document not found.");
    if (document.confidentialityLevel === "restricted" && !user.permissions.includes("patient_document.restricted_read")) {
      throw new ForbiddenException("Restricted document access denied.");
    }
    return document;
  }

  async update(patientId: string, documentId: string, dto: UpdatePatientDocumentDto, user: AuthUser) {
    const existing = await this.get(patientId, documentId, user);
    if (existing.status === "archived" || existing.status === "voided") throw new BadRequestException("Archived or voided documents cannot be edited.");
    const document = await this.prisma.patientDocument.update({ where: { id: documentId }, data: { title: dto.title?.trim(), status: dto.status, summaryText: dto.summaryText === undefined ? undefined : clean(dto.summaryText), tagsJson: dto.tagsJson as Prisma.InputJsonValue | undefined }, include: includeDocument });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.updated", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", metadataJson: { patientId, changedFields: Object.keys(dto) } });
    return document;
  }

  async review(patientId: string, documentId: string, user: AuthUser) {
    await this.get(patientId, documentId, user);
    const document = await this.prisma.patientDocument.update({ where: { id: documentId }, data: { status: "reviewed", reviewedByUserId: user.id, reviewedAt: new Date() }, include: includeDocument });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.reviewed", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", metadataJson: { patientId } });
    return document;
  }

  async archive(patientId: string, documentId: string, dto: ArchivePatientDocumentDto, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Archive reason is required.");
    await this.get(patientId, documentId, user);
    const document = await this.prisma.patientDocument.update({ where: { id: documentId }, data: { status: "archived", archivedByUserId: user.id, archivedAt: new Date(), archiveReason: dto.reason.trim() }, include: includeDocument });
    await this.audit.record({ actorUserId: user.id, action: "patient_document.archived", resourceType: "patient_document", resourceId: document.id, branchId: document.branchId, severity: "high", reason: dto.reason.trim(), metadataJson: { patientId } });
    return document;
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
