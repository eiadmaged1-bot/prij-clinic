import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AiDraftStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAiDraftDto, ReviewAiDraftDto } from "./dto";

@Injectable()
export class AiDraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreateAiDraftDto, user: AuthUser) {
    if (!dto.patientId) {
      throw new BadRequestException("Patient is required for AI draft placeholders.");
    }

    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });

    const draft = await this.prisma.aiDraft.create({
      data: {
        branchId: patient?.branchId ?? user.branchId,
        patientId: dto.patientId ?? null,
        encounterId: dto.encounterId ?? null,
        draftType: dto.draftType,
        status: "pending_doctor_review",
        inputSourceSummary: clean(dto.inputSourceSummary),
        generatedText: placeholderText(dto.draftType),
        requestedByUserId: user.id
      },
      include: aiDraftIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_draft.placeholder_created",
      resourceType: "ai_draft",
      resourceId: draft.id,
      branchId: draft.branchId,
      severity: "high",
      metadataJson: {
        draftType: draft.draftType,
        status: draft.status,
        modelProvider: draft.modelProvider,
        externalAiAccess: false
      }
    });

    return draft;
  }

  async list(user: AuthUser) {
    const drafts = await this.prisma.aiDraft.findMany({
      where: branchScope(user),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: aiDraftIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_draft.list_read",
      resourceType: "ai_draft",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: drafts.length, externalAiAccess: false }
    });

    return drafts;
  }

  async get(id: string, user: AuthUser) {
    const draft = await this.prisma.aiDraft.findFirst({ where: { id, ...branchScope(user) }, include: aiDraftIncludes });
    if (!draft) {
      throw new NotFoundException("AI draft placeholder not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "ai_draft.read",
      resourceType: "ai_draft",
      resourceId: draft.id,
      branchId: draft.branchId,
      severity: "medium",
      metadataJson: { draftType: draft.draftType, status: draft.status, externalAiAccess: false }
    });

    return draft;
  }

  async review(id: string, dto: ReviewAiDraftDto, user: AuthUser) {
    const existing = await this.get(id, user);
    const allowed: AiDraftStatus[] = ["approved", "rejected", "doctor_edited", "expired", "voided"];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException("Review status must be approved, rejected, doctor_edited, expired, or voided.");
    }

    const draft = await this.prisma.aiDraft.update({
      where: { id },
      data: {
        status: dto.status,
        reviewNote: clean(dto.reviewNote),
        reviewedAt: new Date(),
        reviewedByUserId: user.id
      },
      include: aiDraftIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: `ai_draft.${dto.status}`,
      resourceType: "ai_draft",
      resourceId: draft.id,
      branchId: draft.branchId,
      severity: "high",
      metadataJson: {
        fromStatus: existing.status,
        toStatus: draft.status,
        insertedIntoClinicalRecord: false
      }
    });

    return draft;
  }

}

const aiDraftIncludes = {
  patient: true,
  encounter: true
} satisfies Prisma.AiDraftInclude;

function clean(value?: string) {
  return value?.trim() || null;
}

function placeholderText(draftType: string) {
  return [
    `AI draft placeholder for ${draftType}.`,
    "External AI access is disabled in this MVP.",
    "This is not a diagnosis, prescription, signed record, final interpretation, or patient instruction.",
    "Any future AI output must remain draft-only until reviewed and approved by an authorized doctor."
  ].join(" ");
}
