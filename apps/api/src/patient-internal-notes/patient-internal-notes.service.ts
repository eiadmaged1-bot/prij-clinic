import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PatientInternalNoteVisibility, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope, isOwnerOrAdmin } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { ArchivePatientInternalNoteDto, CreatePatientInternalNoteDto, UpdatePatientInternalNoteDto } from "./dto";

const includeNote = { patient: true } satisfies Prisma.PatientInternalNoteInclude;

@Injectable()
export class PatientInternalNotesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.patientInternalNote.findMany({ where: { patientId, ...branchScope(user), ...visibilityWhere(user) }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], include: includeNote });
  }

  async create(patientId: string, dto: CreatePatientInternalNoteDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const visibility = dto.visibility ?? "internal_all";
    assertVisibilityPermission(visibility, user);
    const note = await this.prisma.patientInternalNote.create({
      data: {
        patientId,
        branchId: patient.branchId,
        createdByUserId: user.id,
        noteType: dto.noteType,
        visibility,
        title: clean(dto.title),
        bodyText: dto.bodyText.trim(),
        pinned: dto.pinned ?? false
      },
      include: includeNote
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_internal_note.created", resourceType: "patient_internal_note", resourceId: note.id, branchId: note.branchId, severity: "high", metadataJson: { patientId, noteType: note.noteType, visibility: note.visibility, pinned: note.pinned } });
    return note;
  }

  async update(patientId: string, noteId: string, dto: UpdatePatientInternalNoteDto, user: AuthUser) {
    await this.get(patientId, noteId, user);
    const note = await this.prisma.patientInternalNote.update({ where: { id: noteId }, data: { title: dto.title === undefined ? undefined : clean(dto.title), bodyText: dto.bodyText?.trim(), pinned: dto.pinned }, include: includeNote });
    await this.audit.record({ actorUserId: user.id, action: "patient_internal_note.updated", resourceType: "patient_internal_note", resourceId: note.id, branchId: note.branchId, severity: "high", metadataJson: { patientId, changedFields: Object.keys(dto) } });
    return note;
  }

  async archive(patientId: string, noteId: string, dto: ArchivePatientInternalNoteDto, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Archive reason is required.");
    await this.get(patientId, noteId, user);
    const note = await this.prisma.patientInternalNote.update({ where: { id: noteId }, data: { archived: true, archiveReason: dto.reason.trim() }, include: includeNote });
    await this.audit.record({ actorUserId: user.id, action: "patient_internal_note.archived", resourceType: "patient_internal_note", resourceId: note.id, branchId: note.branchId, severity: "high", reason: dto.reason.trim(), metadataJson: { patientId } });
    return note;
  }

  private async get(patientId: string, noteId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    const note = await this.prisma.patientInternalNote.findFirst({ where: { id: noteId, patientId, ...branchScope(user), ...visibilityWhere(user) }, include: includeNote });
    if (!note) throw new NotFoundException("Internal note not found.");
    return note;
  }
}

function visibilityWhere(user: AuthUser): Prisma.PatientInternalNoteWhereInput {
  if (isOwnerOrAdmin(user)) return {};
  const allowed: PatientInternalNoteVisibility[] = ["internal_all"];
  if (user.permissions.includes("patient_internal_note.clinical_read")) allowed.push("clinical_only");
  if (user.permissions.includes("patient_internal_note.admin_read")) allowed.push("admin_only");
  if (user.permissions.includes("patient_internal_note.finance_read")) allowed.push("finance_only");
  return { visibility: { in: allowed } };
}

function assertVisibilityPermission(visibility: PatientInternalNoteVisibility, user: AuthUser) {
  if (visibility === "clinical_only" && !user.permissions.includes("patient_internal_note.clinical_read") && !isOwnerOrAdmin(user)) throw new ForbiddenException("Clinical note visibility is not allowed for this role.");
  if (visibility === "admin_only" && !user.permissions.includes("patient_internal_note.admin_read") && !isOwnerOrAdmin(user)) throw new ForbiddenException("Admin note visibility is not allowed for this role.");
  if (visibility === "finance_only" && !user.permissions.includes("patient_internal_note.finance_read") && !isOwnerOrAdmin(user)) throw new ForbiddenException("Finance note visibility is not allowed for this role.");
}

function clean(value?: string) {
  return value?.trim() || null;
}
