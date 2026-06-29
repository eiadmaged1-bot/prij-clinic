import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { isOwnerOrAdmin } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { detectUnsafeClinicalPhrases, validateProtocolContentForStatus } from "../protocol-atlas/protocol-content.schema";
import { ProtocolAtlasService } from "../protocol-atlas/protocol-atlas.service";
import { CreateManagementSnapshotDto } from "./dto/create-management-snapshot.dto";
import { ReviewManagementSnapshotDto } from "./dto/review-management-snapshot.dto";
import { SaveMemoryDto } from "./dto/save-memory.dto";

@Injectable()
export class AiManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly atlas: ProtocolAtlasService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreateManagementSnapshotDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const encounter = await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: dto.patientId, requireDoctorScope: true });
    if (encounter?.status === "signed") throw new BadRequestException("Signed encounters cannot be modified by AI management snapshots.");
    const protocol = dto.protocolCode ? await this.findByCode(dto.protocolCode) : await this.findBestMatch(dto.diagnosisText, user);
    const outputJson = buildOutput(protocol, dto);
    const snapshot = await this.prisma.aIManagementSnapshot.create({
      data: {
        patientId: dto.patientId,
        encounterId: dto.encounterId ?? null,
        protocolId: protocol?.id ?? null,
        diagnosisText: dto.diagnosisText.trim(),
        clinicalGoal: dto.clinicalGoal?.trim() || null,
        inputContextJson: scrubInput(dto),
        outputJson,
        createdByUserId: user.id
      },
      include: snapshotInclude
    });
    await this.audit.record({ actorUserId: user.id, action: "ai_management_snapshot_created", resourceType: "ai_management_snapshot", branchId: patient.branchId, severity: "high", metadataJson: { snapshotId: snapshot.id, patientId: dto.patientId, protocolCode: protocol?.code, implementationStatus: protocol?.implementationStatus, externalAiAccess: false } });
    return snapshot;
  }

  async list(patientId: string | undefined, user: AuthUser) {
    if (patientId) await assertCanReferencePatient(this.prisma, patientId, user);
    const snapshots = await this.prisma.aIManagementSnapshot.findMany({
      where: { ...(patientId ? { patientId } : {}), ...(isOwnerOrAdmin(user) ? {} : { patient: { branchId: user.branchId ?? "00000000-0000-0000-0000-000000000000" } }) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: snapshotInclude
    });
    return snapshots;
  }

  async get(id: string, user: AuthUser) {
    const snapshot = await this.prisma.aIManagementSnapshot.findFirst({
      where: { id, ...(isOwnerOrAdmin(user) ? {} : { patient: { branchId: user.branchId ?? "00000000-0000-0000-0000-000000000000" } }) },
      include: snapshotInclude
    });
    if (!snapshot) throw new NotFoundException("Management snapshot not found.");
    return snapshot;
  }

  async review(id: string, dto: ReviewManagementSnapshotDto, user: AuthUser) {
    const existing = await this.get(id, user);
    if (dto.decision === "rejected" && !dto.reason?.trim()) throw new BadRequestException("Rejected snapshots require a reason.");
    if (dto.decision === "edited" && !dto.doctorEditedPlan?.trim()) throw new BadRequestException("Edited approval requires the doctor-edited plan.");
    const snapshot = await this.prisma.aIManagementSnapshot.update({
      where: { id },
      data: {
        status: dto.decision,
        doctorDecision: dto.reason?.trim() || dto.decision,
        doctorEditedPlan: dto.doctorEditedPlan?.trim() || null,
        reviewedByUserId: user.id,
        reviewedAt: new Date()
      },
      include: snapshotInclude
    });
    await this.audit.record({ actorUserId: user.id, action: dto.decision === "rejected" ? "ai_management_snapshot_rejected" : "ai_management_snapshot_reviewed", resourceType: "ai_management_snapshot", branchId: snapshot.patient.branchId, severity: "high", reason: dto.reason, metadataJson: { snapshotId: id, fromStatus: existing.status, toStatus: snapshot.status, clinicalRecordModified: false } });
    return snapshot;
  }

  async saveMemory(id: string, dto: SaveMemoryDto, user: AuthUser) {
    const snapshot = await this.get(id, user);
    if (!["approved", "edited"].includes(snapshot.status)) throw new BadRequestException("Patient memory can be saved only after approved or edited snapshot review.");
    const memory = await this.prisma.patientClinicalMemory.create({
      data: {
        patientId: snapshot.patientId,
        memoryType: dto.memoryType,
        title: dto.title.trim(),
        valueJson: dto.valueJson as Prisma.InputJsonValue,
        sourceSnapshotId: snapshot.id,
        approvedByUserId: user.id
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "ai_management_snapshot_memory_saved", resourceType: "patient_clinical_memory", branchId: snapshot.patient.branchId, severity: "high", metadataJson: { memoryId: memory.id, patientId: snapshot.patientId, snapshotId: snapshot.id, memoryType: memory.memoryType } });
    return memory;
  }

  private async findByCode(code: string) {
    return this.prisma.clinicalProtocol.findUnique({ where: { code } });
  }

  private async findBestMatch(diagnosisText: string, user: AuthUser) {
    const matches = await this.atlas.search({ query: diagnosisText }, user);
    if (!matches.length) return null;
    return this.prisma.clinicalProtocol.findUnique({ where: { id: matches[0]!.id } });
  }
}

function buildOutput(protocol: Awaited<ReturnType<AiManagementService["findByCode"]>>, dto: CreateManagementSnapshotDto) {
  const base = {
    title: protocol?.title ?? "No verified protocol matched.",
    statusLabel: "Draft support only - doctor review required",
    protocolCode: protocol?.code ?? null,
    implementationStatus: protocol?.implementationStatus ?? "none",
    keyContext: context(dto),
    guidelineBasedOptions: [] as string[],
    safetyChecks: ["Doctor review required"],
    source: {
      name: protocol?.sourceName ?? null,
      year: protocol?.sourceYear ?? null,
      version: protocol?.sourceVersion ?? null,
      url: protocol?.sourceUrl ?? null
    },
    limitations: ["If no verified protocol is available, this tool cannot provide management options.", "No automatic diagnosis.", "No automatic prescribing.", "No final plan without doctor approval.", "No external AI call."],
    doctorDecisionRequired: true
  };
  const noVerifiedMessage = "If no verified protocol is available, this tool cannot provide management options.";
  if (!protocol) return { ...base, keyContext: [...base.keyContext, "No verified protocol matched.", noVerifiedMessage] };
  if (protocol.implementationStatus === "catalog_only") return { ...base, keyContext: [...base.keyContext, "Protocol is listed in the Women's Health Atlas, but management snapshot is not yet verified.", noVerifiedMessage], safetyChecks: ["Add a guideline source and verify protocol before using AI management options."] };
  if (protocol.implementationStatus === "draft") return { ...base, keyContext: [...base.keyContext, "Draft protocol exists but is not approved for management snapshot.", noVerifiedMessage], safetyChecks: ["Needs verification before management options are shown."] };
  if (protocol.implementationStatus !== "verified") return { ...base, keyContext: [...base.keyContext, noVerifiedMessage] };
  const content = validateProtocolContentForStatus("verified", protocol.contentJson);
  const options = content.options.filter((item) => detectUnsafeClinicalPhrases(item).length === 0).slice(0, 5);
  const safetyChecks = content.safetyChecks.filter((item) => detectUnsafeClinicalPhrases(item).length === 0).slice(0, 8);
  return {
    ...base,
    title: protocol.title,
    guidelineBasedOptions: options,
    safetyChecks: safetyChecks.length ? safetyChecks : ["Doctor review required"]
  };
}

function context(dto: CreateManagementSnapshotDto) {
  return [
    `Diagnosis/problem entered by doctor: ${dto.diagnosisText}`,
    dto.clinicalGoal ? `Patient goal/context: ${dto.clinicalGoal}` : null,
    dto.pregnancyStatus ? `Pregnancy status: ${dto.pregnancyStatus}` : null,
    dto.tryingToConceive ? "Trying to conceive: yes" : null,
    dto.lactating ? "Lactating: yes" : null,
    dto.redFlags ? "Red flags entered: doctor review required" : null
  ].filter(Boolean) as string[];
}

function scrubInput(dto: CreateManagementSnapshotDto) {
  return { ...dto, diagnosisText: dto.diagnosisText.trim(), externalAiAccess: false, deterministicTemplate: true };
}

const snapshotInclude = {
  patient: true,
  encounter: true,
  protocol: true,
  reviewedByUser: true,
  createdByUser: true
} satisfies Prisma.AIManagementSnapshotInclude;
