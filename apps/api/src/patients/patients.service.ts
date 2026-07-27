import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InvoiceStatus, PatientInternalNoteVisibility, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import {
  assertCanReferenceAppointment,
  assertCanReferenceEncounter,
  assertCanReferenceInvestigationOrder,
  assertCanReferenceInvoice,
  assertCanReferencePregnancy,
  assertCanReferenceQueueTicket,
  assertCanReferenceUserInBranch
} from "../auth/reference-scope";
import { branchScope, doctorScope, EMPTY_SCOPE_ID, isOwnerOrAdmin } from "../auth/scope";
import { DoctorVisitService } from "../doctor-visit/doctor-visit.service";
import { ClinicalTagsService } from "../clinical-tags/clinical-tags.service";
import { IdempotencyService } from "../idempotency/idempotency.service";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "node:crypto";
import { mergeComplaintLifecycle } from "../complaints/complaint-lifecycle";
import { toUtcDateOnly } from "../queue/queue-date";
import { PatientLookupService } from "./services/patient-lookup.service";
import {
  CreatePatientDto,
  DuplicatePatientCandidatesDto,
  CreateClinicalPhaseDto,
  CreateEstradiolResultDto,
  CreateFollicularMonitoringVisitDto,
  CreateInfertilityEpisodeDto,
  CreateOvulationInductionCycleDto,
  PatientContextAppointmentDto,
  PatientContextConsentDto,
  PatientContextEncounterDto,
  PatientContextInvestigationDto,
  PatientContextInvoiceDto,
  PatientContextPaymentDto,
  PatientContextPrescriptionDto,
  PatientContextQueueDto,
  PatientContextReportDto,
  PatientContextUltrasoundDto,
  PatientHistorySheetDto,
  PatientInvestigationHistoryDto,
  PatientMedicationHistoryDto,
  PatientOperationHistoryDto,
  UpdateCycleAmhDto,
  UpdateClinicalPhaseDto,
  UpdatePatientDto
} from "./dto";

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly clinicalTags: ClinicalTagsService,
    private readonly idempotency: IdempotencyService,
    private readonly doctorVisit: DoctorVisitService,
    private readonly lookup: PatientLookupService
  ) {}

  async create(dto: CreatePatientDto, user: AuthUser, idempotencyKey?: string) {
    const branchId = await this.resolveBranchId(user);
    if (!idempotencyKey?.trim()) {
      return this.createAfterDuplicateReview(this.prisma, dto, user, branchId);
    }
    const idempotency = await this.idempotency.beginOrReplay({
      userId: user.id,
      branchId,
      operation: "patient.create",
      rawKey: idempotencyKey,
      requestPayload: dto
    });

    if (idempotency.isReplay) {
      if (!idempotency.resourceId) {
        throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Patient creation is still in progress." });
      }
      return this.get(idempotency.resourceId, user);
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const patient = await this.createAfterDuplicateReview(tx, dto, user, branchId);
        await this.idempotency.complete({
          tx,
          recordId: idempotency.recordId,
          responseStatus: 201,
          resourceType: "patient",
          resourceId: patient.id
        });
        return patient;
      });
      return result;
    } catch (error) {
      const safeReason = error instanceof Error ? error.message : "Unknown error";
      await this.idempotency.failOrRelease({
        recordId: idempotency.recordId,
        safeReason,
        releaseLock: true
      });
      throw error;
    }
  }

  async createAndStartVisit(dto: CreatePatientDto, user: AuthUser, idempotencyKey?: string) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException("Idempotency key required to safely combine creation and visit start.");
    }

    const branchId = await this.resolveBranchId(user);
    const idempotency = await this.idempotency.beginOrReplay({
      userId: user.id,
      branchId,
      operation: "patient.create_and_start_visit",
      rawKey: idempotencyKey,
      requestPayload: dto
    });

    if (idempotency.isReplay) {
      if (!idempotency.resourceId) {
        throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Creation and visit start is still in progress." });
      }

      const patientId = idempotency.resourceId;
      if (idempotency.responseStatus === 206) {
         return { id: patientId, patientCreated: true, visitStarted: false };
      }

      // If completed fully, fetch the visit
      const encounter = await this.prisma.encounter.findFirst({ where: { patientId }, orderBy: { createdAt: "desc" } });
      return { id: patientId, visitId: encounter?.id };
    }

    try {
      // For createAndStartVisit, we don't strictly transaction wrap doctorVisit.start because it might not support tx yet.
      // But we can wrap the patient creation at least.
      const patient = await this.createAfterDuplicateReview(this.prisma, dto, user, branchId);

      let visit;
      try {
        visit = await this.doctorVisit.start(patient.id, {}, user);
      } catch (visitError) {
        const message = visitError instanceof Error ? visitError.message : "Unknown error starting visit";
        await this.idempotency.complete({
          recordId: idempotency.recordId,
          responseStatus: 206, // Partial Content indicates patient created but visit failed
          resourceType: "patient",
          resourceId: patient.id
        });
        throw visitError;
      }

      const result = { id: patient.id, visitId: visit.encounter?.id };
      await this.idempotency.complete({
        recordId: idempotency.recordId,
        responseStatus: 201,
        resourceType: "patient_visit",
        resourceId: patient.id
      });
      return result;
    } catch (error) {
      const safeReason = error instanceof Error ? error.message : "Unknown error";
      await this.idempotency.failOrRelease({
        recordId: idempotency.recordId,
        safeReason,
        releaseLock: true // Allow retry for duplicate validation errors
      });
      throw error;
    }
  }

  private async createAfterDuplicateReview(db: Prisma.TransactionClient | PrismaService, dto: CreatePatientDto, user: AuthUser, branchId: string) {
    const duplicateReview = await this.duplicateCandidates({
      name: `${dto.firstName} ${dto.lastName}`,
      phone: dto.phone,
      dob: dto.dateOfBirth,
      mrn: dto.medicalRecordNumber
    }, user);
    const highConfidenceCandidates = duplicateReview.candidates.filter((candidate) => candidate.confidence === "HIGH");
    const overrideReason = dto.duplicateOverrideReason?.trim();
    if (highConfidenceCandidates.length && !overrideReason) {
      throw new ConflictException({
        code: "PATIENT_DUPLICATE_REVIEW_REQUIRED",
        message: "Review the high-confidence duplicate candidates before creating a new patient.",
        candidates: highConfidenceCandidates
      });
    }

    try {
      const patient = await db.patient.create({
        data: {
          branchId,
          medicalRecordNumber: dto.medicalRecordNumber.trim(),
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          yearOfBirth: dto.yearOfBirth ?? (dto.dateOfBirth ? new Date(dto.dateOfBirth).getUTCFullYear() : null),
          sex: dto.sex?.trim() || "female",
          patientType: dto.patientType ?? "GENERAL",
          sexualActivityStatus: dto.sexualActivityStatus ?? "unknown",
          phone: dto.phone?.trim() || null,
          email: dto.email?.trim().toLowerCase() || null,
          notes: dto.notes?.trim() || null,
          createdByUserId: user.id
        }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "patient.created",
        resourceType: "patient",
        resourceId: patient.id,
        branchId,
        severity: "medium",
        metadataJson: { changedFields: Object.keys(dto).filter((key) => key !== "duplicateOverrideReason"), medicalRecordNumber: patient.medicalRecordNumber, duplicateReviewPerformed: true }
      });

      if (highConfidenceCandidates.length && overrideReason) {
        await this.audit.record({
          actorUserId: user.id,
          action: "patient.duplicate_override",
          resourceType: "patient",
          resourceId: patient.id,
          branchId,
          severity: "high",
          metadataJson: { reason: overrideReason, candidatePatientIds: highConfidenceCandidates.map((candidate) => candidate.patientId) }
        });
      }

      return patient;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("Medical record number already exists.");
      }

      throw error;
    }
  }

  async duplicateCandidates(query: DuplicatePatientCandidatesDto, user: AuthUser, recordAudit = true) {
    const input = {
      name: normalizeName(query.name),
      phone: normalizePhone(query.phone),
      dob: query.dob ? new Date(query.dob) : null,
      age: parseApproximateAge(query.age),
      mrn: normalizeText(query.mrn)
    };
    const patients = await this.prisma.patient.findMany({
      where: { ...branchScope(user), status: "active", dataClassification: { notIn: ["TEST", "QUARANTINED"] } } as unknown as Prisma.PatientWhereInput,
      select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true, phone: true, dateOfBirth: true, patientType: true, encounters: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 } }
    });
    const candidates = patients.map((patient) => scoreDuplicateCandidate(patient, input)).filter((candidate) => candidate.score >= 35).sort((a, b) => b.score - a.score).slice(0, 8);
    if (recordAudit) {
      await this.audit.record({
        actorUserId: user.id,
        action: "patient.duplicate_check",
        resourceType: "patient",
        branchId: user.branchId,
        severity: "medium",
        metadataJson: { candidateCount: candidates.length, highConfidenceCount: candidates.filter((candidate) => candidate.confidence === "HIGH").length, fieldsChecked: Object.entries(input).filter(([, value]) => value !== null && value !== "").map(([key]) => key) }
      });
    }
    return { candidates };
  }

  async get(id: string, user: AuthUser) {
    return this.lookup.get(id, user);
  }

  async qrInfo(lookup: string, user: AuthUser) {
    const trimmed = lookup.trim();
    const token = trimmed.startsWith("PRIJ-PATIENT:") ? trimmed.slice("PRIJ-PATIENT:".length) : trimmed;
    const uuidLookup = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [
          ...(uuidLookup ? [{ qrToken: token }, { id: token }] : []),
          { medicalRecordNumber: { equals: trimmed, mode: "insensitive" } },
          { phone: trimmed },
          { firstName: { contains: trimmed, mode: "insensitive" } },
          { lastName: { contains: trimmed, mode: "insensitive" } }
        ]
      }
    });
    if (!patient) throw new NotFoundException("Patient lookup did not match an accessible record.");

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.qr_resolved",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { lookupType: trimmed.startsWith("PRIJ-PATIENT:") ? "opaque_qr_token" : "manual_lookup" }
    });

    return {
      patientId: patient.id,
      displayName: `${patient.firstName} ${patient.lastName}`.trim(),
      medicalRecordNumber: patient.medicalRecordNumber,
      status: patient.status
    };
  }

  async qrTokenInfo(id: string, user: AuthUser) {
    const patient = await this.get(id, user);
    await this.audit.record({
      actorUserId: user.id,
      action: "patient.qr_viewed",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { payloadContainsPhi: false }
    });
    return { token: patient.qrToken, payload: `PRIJ-PATIENT:${patient.qrToken}` };
  }

  async followUpHints(id: string, user: AuthUser) {
    const patient = await this.get(id, user);
    const [intakes, requests, prescriptions, allergies, currentMedications] = await Promise.all([
      this.prisma.patientIntake.findMany({
        where: { patientId: id, status: { in: ["waiting_for_doctor_review", "reviewed_by_doctor"] } },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      this.prisma.investigationOrder.findMany({
        where: { patientId: id, ...doctorScope(user), status: { notIn: ["reviewed", "cancelled", "voided"] } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 25
      }),
      this.prisma.prescription.findMany({
        where: { patientId: id, ...doctorScope(user), status: { in: ["draft", "signed"] } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      this.prisma.patientAllergy.findMany({ where: { patientId: id, status: "active" }, take: 10 }),
      this.prisma.patientMedication.findMany({ where: { patientId: id, status: "active" }, take: 10 })
    ]);

    const hints = [];
    for (const intake of intakes) {
      if (hasJsonValue(intake.redFlagsJson) && intake.status !== "signed_locked") {
        hints.push(hint("intake_red_flag", "high", "Secretary intake has red flag screening that needs doctor review.", intake.id));
      }
      if (intake.status === "waiting_for_doctor_review") {
        hints.push(hint("intake_review", "medium", "Patient-reported intake is waiting for doctor review.", intake.id));
      }
    }
    for (const request of requests) {
      const names = request.items.map((item) => item.testName).filter(Boolean).join(", ") || "clinical request";
      const message = request.status === "result_received"
        ? `Result received for ${names}. Doctor review is still needed.`
        : `Requested investigation or referral pending follow-up: ${names}.`;
      hints.push(hint("clinical_request_follow_up", request.status === "result_received" ? "high" : "medium", message, request.id));
    }
    if (allergies.length > 0) {
      hints.push(hint("prescription_allergy_review", "high", "Active allergy history exists. Review before saving or signing prescriptions.", allergies[0]?.id));
    }
    if (currentMedications.length === 0) {
      hints.push(hint("current_medication_history_missing", "medium", "Current medication history is missing or not recorded for this patient.", patient.id));
    }
    const previousAnemia = prescriptions.some((prescription) =>
      prescription.items.some((item) => /iron|ferritin|anemia/i.test([item.medicationName, item.genericName, prescription.notes].filter(Boolean).join(" ")))
    );
    if (previousAnemia) {
      hints.push(hint("previous_prescription_context", "low", "Previous anemia-related prescription exists. Review latest Hb or ferritin before continuing.", patient.id));
    }

    return { patientId: id, hints };
  }

  async listPhases(id: string, user: AuthUser) {
    await this.get(id, user);
    const phases = await this.prisma.patientClinicalPhase.findMany({
      where: { patientId: id },
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      include: { infertilityEpisodes: { include: { cycles: true } } }
    });
    return { phases, currentPhase: phases.find((phase) => phase.status === "active") ?? null };
  }

  async createPhase(id: string, dto: CreateClinicalPhaseDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const phase = await this.prisma.patientClinicalPhase.create({
      data: {
        patientId: patient.id,
        phaseType: dto.phaseType,
        title: dto.title.trim(),
        status: dto.status ?? "active",
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        outcome: clean(dto.outcome),
        linkedPregnancyId: dto.linkedPregnancyId ?? null,
        linkedInfertilityEpisodeId: dto.linkedInfertilityEpisodeId ?? null,
        summaryJson: jsonInput(dto.summaryJson),
        notes: clean(dto.notes),
        createdByUserId: user.id
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "patient_clinical_phase.created",
      resourceType: "patient_clinical_phase",
      resourceId: phase.id,
      branchId: patient.branchId,
      severity: "high",
      metadataJson: { patientId: id, phaseType: phase.phaseType, status: phase.status }
    });
    return phase;
  }

  async updatePhase(id: string, phaseId: string, dto: UpdateClinicalPhaseDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const existing = await this.prisma.patientClinicalPhase.findFirst({ where: { id: phaseId, patientId: id } });
    if (!existing) throw new NotFoundException("Clinical phase not found.");
    const phase = await this.prisma.patientClinicalPhase.update({
      where: { id: phaseId },
      data: {
        status: dto.status ?? existing.status,
        endDate: dto.endDate ? new Date(dto.endDate) : existing.endDate,
        outcome: dto.outcome !== undefined ? clean(dto.outcome) : existing.outcome,
        summaryJson: dto.summaryJson !== undefined ? jsonInput(dto.summaryJson) : jsonInput(existing.summaryJson),
        notes: dto.notes !== undefined ? clean(dto.notes) : existing.notes
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "patient_clinical_phase.updated",
      resourceType: "patient_clinical_phase",
      resourceId: phase.id,
      branchId: patient.branchId,
      severity: "high",
      metadataJson: { patientId: id, fromStatus: existing.status, toStatus: phase.status }
    });
    return phase;
  }

  async infertilityWorkspace(id: string, user: AuthUser) {
    await this.get(id, user);
    const [phases, episodes, cycles, monitoringVisits, estradiolResults] = await Promise.all([
      this.prisma.patientClinicalPhase.findMany({ where: { patientId: id, phaseType: "infertility" }, orderBy: { startDate: "desc" } }),
      this.prisma.infertilityEpisode.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
      this.prisma.ovulationInductionCycle.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
      this.prisma.follicularMonitoringVisit.findMany({ where: { patientId: id }, orderBy: { monitoringDate: "desc" } }),
      this.prisma.estradiolResult.findMany({ where: { patientId: id }, orderBy: { resultDate: "desc" } })
    ]);
    return { phases, episodes, cycles, monitoringVisits, estradiolResults };
  }

  async createInfertilityEpisode(id: string, dto: CreateInfertilityEpisodeDto, user: AuthUser) {
    const patient = await this.get(id, user);
    if (dto.phaseId) await this.requirePatientPhase(id, dto.phaseId);
    const episode = await this.prisma.infertilityEpisode.create({
      data: {
        patientId: id,
        phaseId: dto.phaseId ?? null,
        infertilityDurationYears: dto.infertilityDurationYears,
        infertilityType: dto.infertilityType ?? "unknown",
        knownFactor: dto.knownFactor ?? "unknown",
        previousInvestigationsJson: jsonInput(dto.previousInvestigationsJson),
        previousTreatmentJson: jsonInput(dto.previousTreatmentJson),
        hadIUI: dto.hadIUI ?? null,
        hadICSI: dto.hadICSI ?? null,
        icsiAttemptsCount: dto.icsiAttemptsCount ?? null,
        notes: clean(dto.notes),
        createdByUserId: user.id
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "infertility_episode.created", resourceType: "infertility_episode", resourceId: episode.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, phaseId: dto.phaseId ?? null } });
    if (episode.hadIUI) await this.clinicalTags.createFromSource({ patientId: id, tagCode: "iui", sourceType: "infertility_episode", sourceId: episode.id, createdByUserId: user.id });
    if (episode.hadICSI) await this.clinicalTags.createFromSource({ patientId: id, tagCode: "icsi", sourceType: "infertility_episode", sourceId: episode.id, createdByUserId: user.id });
    if (episode.knownFactor === "pcos") await this.clinicalTags.createFromSource({ patientId: id, tagCode: "pcos", sourceType: "infertility_episode", sourceId: episode.id, createdByUserId: user.id });
    if (episode.knownFactor === "endometriosis") await this.clinicalTags.createFromSource({ patientId: id, tagCode: "endometriosis", sourceType: "infertility_episode", sourceId: episode.id, createdByUserId: user.id });
    return episode;
  }

  async createOvulationCycle(id: string, dto: CreateOvulationInductionCycleDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const episode = await this.prisma.infertilityEpisode.findFirst({ where: { id: dto.infertilityEpisodeId, patientId: id } });
    if (!episode) throw new NotFoundException("Infertility episode not found.");
    const cycle = await this.prisma.ovulationInductionCycle.create({
      data: {
        patientId: id,
        infertilityEpisodeId: episode.id,
        cycleNumber: dto.cycleNumber,
        lmpDate: dto.lmpDate ? new Date(dto.lmpDate) : null,
        cycleDay: dto.cycleDay ?? null,
        inductionStartDate: dto.inductionStartDate ? new Date(dto.inductionStartDate) : null,
        inductionMethod: dto.inductionMethod ?? "other",
        medicationNotes: clean(dto.medicationNotes),
        outcome: dto.outcome ?? "ongoing",
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        notes: clean(dto.notes),
        createdByUserId: user.id
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "ovulation_induction_cycle.created", resourceType: "ovulation_induction_cycle", resourceId: cycle.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, infertilityEpisodeId: episode.id, manualMedicationOnly: true } });
    await this.clinicalTags.createFromSource({ patientId: id, tagCode: "ovulation_induction", sourceType: "induction_cycle", sourceId: cycle.id, createdByUserId: user.id });
    return cycle;
  }

  async updateCycleAmh(id: string, cycleId: string, dto: UpdateCycleAmhDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const existing = await this.prisma.ovulationInductionCycle.findFirst({ where: { id: cycleId, patientId: id } });
    if (!existing) throw new NotFoundException("Ovulation induction cycle not found.");
    const cycle = await this.prisma.ovulationInductionCycle.update({
      where: { id: cycleId },
      data: {
        amhRequestedStatus: dto.requestedStatus ?? existing.amhRequestedStatus,
        amhRequestDate: dto.requestDate ? new Date(dto.requestDate) : existing.amhRequestDate,
        amhResultValue: dto.resultValue ?? existing.amhResultValue,
        amhUnit: dto.unit ?? existing.amhUnit,
        amhResultDate: dto.resultDate ? new Date(dto.resultDate) : existing.amhResultDate,
        amhNotes: dto.notes !== undefined ? clean(dto.notes) : existing.amhNotes
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "ovulation_cycle.amh_updated", resourceType: "ovulation_induction_cycle", resourceId: cycle.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, requestedStatus: cycle.amhRequestedStatus } });
    return cycle;
  }

  async createMonitoringVisit(id: string, dto: CreateFollicularMonitoringVisitDto, user: AuthUser) {
    const patient = await this.get(id, user);
    await this.requirePatientCycle(id, dto.cycleId);
    const visit = await this.prisma.follicularMonitoringVisit.create({
      data: {
        patientId: id,
        cycleId: dto.cycleId,
        monitoringDate: new Date(dto.monitoringDate),
        cycleDay: dto.cycleDay ?? null,
        endometrialThicknessMm: dto.endometrialThicknessMm ?? null,
        rightOvaryFollicleCount: dto.rightOvaryFollicleCount ?? null,
        rightOvaryMeanSizeMm: dto.rightOvaryMeanSizeMm ?? null,
        rightOvaryLargestSizeMm: dto.rightOvaryLargestSizeMm ?? null,
        rightOvaryNotes: clean(dto.rightOvaryNotes),
        leftOvaryFollicleCount: dto.leftOvaryFollicleCount ?? null,
        leftOvaryMeanSizeMm: dto.leftOvaryMeanSizeMm ?? null,
        leftOvaryLargestSizeMm: dto.leftOvaryLargestSizeMm ?? null,
        leftOvaryNotes: clean(dto.leftOvaryNotes),
        plan: clean(dto.plan),
        nextVisitDate: dto.nextVisitDate ? new Date(dto.nextVisitDate) : null,
        createdByUserId: user.id
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "follicular_monitoring_visit.created", resourceType: "follicular_monitoring_visit", resourceId: visit.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, cycleId: dto.cycleId, wording: "follicles" } });
    return visit;
  }

  async createEstradiolResult(id: string, dto: CreateEstradiolResultDto, user: AuthUser) {
    const patient = await this.get(id, user);
    await this.requirePatientCycle(id, dto.cycleId);
    if (dto.requiredStatus) {
      await this.prisma.ovulationInductionCycle.update({ where: { id: dto.cycleId }, data: { e2RequiredStatus: dto.requiredStatus } });
    }
    const result = await this.prisma.estradiolResult.create({
      data: {
        patientId: id,
        cycleId: dto.cycleId,
        value: dto.value,
        unit: dto.unit?.trim() || "pg/mL",
        resultDate: new Date(dto.resultDate),
        cycleDay: dto.cycleDay ?? null,
        notes: clean(dto.notes),
        createdByUserId: user.id
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "estradiol_result.created", resourceType: "estradiol_result", resourceId: result.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, cycleId: dto.cycleId } });
    return result;
  }


  async timeline(id: string, user: AuthUser, query: { limit?: string; cursor?: string } = {}) {
    const patient = await this.get(id, user);
    const limit = parseTimelineLimit(query.limit);
    const cursor = decodeTimelineCursor(query.cursor);
    const candidateTake = limit + 1;
    const clinicalScope = isReceptionistOnly(user) ? { id: EMPTY_SCOPE_ID } : {};
    const [
      appointments,
      queueTickets,
      encounters,
      prescriptions,
      investigationOrders,
      reports,
      gynecologyVisits,
      pregnancies,
      previousPregnancies,
      pregnancyFetuses,
      antenatalVisits,
      obUltrasounds,
      invoices,
      payments,
      consentRecords,
      investigationResults,
      patientDocuments,
      referrals,
      patientTasks,
      patientInternalNotes,
      careAssistDecisions
      // v0.12.2 history rows are loaded separately through the history sheet workspace.
    ] = await Promise.all([
      this.prisma.appointment.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "appointment", "startAt") }, include: { doctor: true }, orderBy: [{ startAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.queueTicket.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "queue", "checkedInAt") }, orderBy: [{ checkedInAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.encounter.findMany({ where: { patientId: id, ...doctorScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "encounter", "createdAt") }, include: { doctor: true, signedByUser: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.prescription.findMany({ where: { patientId: id, ...doctorScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "prescription", "createdAt") }, include: { doctor: true, items: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.investigationOrder.findMany({ where: { patientId: id, ...doctorScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "investigation", "createdAt") }, include: { items: true, doctor: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.report.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "report", "createdAt") }, include: { uploadedByUser: true, reviewedByUser: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.gynecologyVisit.findMany({ where: { patientId: id, ...branchScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "gynecology", "visitDate") }, include: { createdByUser: true }, orderBy: [{ visitDate: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.pregnancy.findMany({ where: { patientId: id, ...branchScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "pregnancy", "createdAt") }, include: { fetuses: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.previousPregnancy.findMany({ where: { patientId: id, patient: branchScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "previous_pregnancy", "createdAt") }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.pregnancyFetus.findMany({ where: { pregnancy: { patientId: id, ...branchScope(user) }, ...clinicalScope, ...timelineCursorWhere(cursor, "pregnancy_fetus", "createdAt") }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.antenatalVisit.findMany({ where: { patientId: id, ...branchScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "antenatal_visit", "visitDate") }, orderBy: [{ visitDate: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.obUltrasound.findMany({ where: { patientId: id, ...branchScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "ultrasound", "performedAt") }, include: { reviewedByUser: true }, orderBy: [{ performedAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.invoice.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "invoice", "createdAt") }, include: { createdByUser: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.payment.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "payment", "paidAt") }, include: { recordedByUser: true }, orderBy: [{ paidAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.consentRecord.findMany({ where: { patientId: id, ...timelineCursorWhere(cursor, "consent", "capturedAt") }, include: { capturedByUser: true }, orderBy: [{ capturedAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.investigationResult.findMany({ where: { patientId: id, ...branchScope(user), ...clinicalScope, ...timelineCursorWhere(cursor, "investigation_result", "createdAt") }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.patientDocument.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "patient_document", "createdAt") }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.referral.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "referral", "createdAt") }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.patientTask.findMany({ where: { patientId: id, ...branchScope(user), ...timelineCursorWhere(cursor, "patient_task", "createdAt") }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.patientInternalNote.findMany({ where: { patientId: id, ...branchScope(user), ...internalNoteVisibilityWhere(user), ...timelineCursorWhere(cursor, "internal_note", "createdAt") }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake }),
      this.prisma.careAssistDecision.findMany({ where: { finding: { patientId: id, ...clinicalScope }, ...timelineCursorWhere(cursor, "care_assist", "createdAt") }, include: { finding: { select: { id: true, title: true } }, decidedByUser: { select: { displayName: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: candidateTake })
    ]);

    const items = [
      timelineItem(patient.createdAt, "patient", "Patient file created", patient.status, `MRN ${patient.medicalRecordNumber}`, patient.createdByUserId ? "Staff member" : undefined, `/patients/${patient.id}`, undefined, patient.id),
      ...appointments.map((item) => timelineItem(item.startAt, "appointment", "Appointment booked", item.status, item.appointmentType ?? "Clinic appointment", item.doctor?.displayName, "/appointments", undefined, item.id)),
      ...queueTickets.map((item) => timelineItem(
        item.checkedInAt,
        "queue",
        "Checked in to queue",
        item.status,
        `Added by: ${item.receptionistDisplayNameSnapshot ?? "Reception"} · ${visitTypeDisplay(item.visitType)} · ${formatTime(item.checkedInAt)}`,
        item.receptionistDisplayNameSnapshot ?? undefined,
        "/queue", undefined, item.id
      )),
      ...encounters.map((item) => timelineItem(
        item.startedAt ?? item.createdAt,
        "encounter",
        item.status === "signed" ? "Visit note signed" : "Visit note started",
        item.status,
        item.chiefComplaint ?? "Doctor visit note",
        item.doctorDisplayNameSnapshot ?? item.doctor.displayName,
        "/encounters",
        doctorSignature(item), item.id
      )),
      ...prescriptions.map((item) => timelineItem(item.createdAt, "prescription", "Prescription created", item.status, `${item.items.length} medicine item(s)`, item.doctor.displayName, "/prescriptions", undefined, item.id)),
      ...investigationOrders.map((item) => timelineItem(item.createdAt, "investigation", "Investigation ordered", item.status, item.items.map((orderItem) => orderItem.testName).join(", ") || "Investigation order", item.doctor.displayName, "/investigations", undefined, item.id)),
      ...reports.map((item) => timelineItem(item.createdAt, "report", "Report created", item.status, item.title, item.uploadedByUser?.displayName, "/reports", undefined, item.id)),
      ...gynecologyVisits.map((item) => timelineItem(item.visitDate, "gynecology", gynecologyTimelineTitle(item.templateType), "recorded", item.reasonForVisit ?? "Recording-only gynecology visit", item.createdByUser?.displayName, `/patients/${patient.id}`, undefined, item.id)),
      ...pregnancies.map((item) => timelineItem(item.createdAt, "pregnancy", "Pregnancy episode recorded", item.status, `${item.fetuses.length || 1} fetus record(s)`, undefined, "/pregnancies", undefined, item.id)),
      ...previousPregnancies.map((item) => timelineItem(item.createdAt, "previous_pregnancy", "Previous pregnancy history recorded", "recorded", item.outcome, undefined, "/pregnancies", undefined, item.id)),
      ...pregnancyFetuses.map((item) => timelineItem(item.createdAt, "pregnancy_fetus", "Fetus record created", item.status, item.label, undefined, "/pregnancies", undefined, item.id)),
      ...antenatalVisits.map((item) => timelineItem(item.visitDate, "antenatal_visit", "Antenatal visit recorded", "recorded", item.gestationalAgeDisplay ?? "Pregnancy follow-up", undefined, "/pregnancies", undefined, item.id)),
      ...obUltrasounds.map((item) => timelineItem(item.performedAt, "ultrasound", item.status === "draft" ? "Ultrasound draft recorded" : "Ultrasound study recorded", item.status, item.scanType ?? "Recording only; clinician interpretation required", item.reviewedByUser?.displayName, "/ultrasound", undefined, item.id)),
      ...invoices.map((item) => timelineItem(item.createdAt, "invoice", "Invoice created", item.status, `Balance ${item.balanceAmount.toString()}`, item.createdByUser?.displayName, "/billing", undefined, item.id)),
      ...payments.map((item) => timelineItem(item.paidAt, "payment", "Payment recorded", item.status, `${item.method} ${item.amount.toString()}`, item.recordedByUser?.displayName, "/billing", undefined, item.id)),
      ...consentRecords.map((item) => timelineItem(item.capturedAt, "consent", "Consent recorded", item.status, item.consentType.replaceAll("_", " "), item.capturedByUser?.displayName, "/consents", undefined, item.id)),
      ...investigationResults.map((item) => timelineItem(item.createdAt, "investigation_result", item.criticalFlag ? "Critical result metadata recorded" : "Result metadata recorded", item.reviewStatus, item.title, undefined, "/investigations", undefined, item.id)),
      ...patientDocuments.map((item) => timelineItem(item.createdAt, "patient_document", "Document archived", item.status, `${item.title} (${item.storageMode})`, undefined, `/patients/${patient.id}`, undefined, item.id)),
      ...referrals.map((item) => timelineItem(item.createdAt, "referral", "Referral created", item.status, item.reason, undefined, "/referrals", undefined, item.id)),
      ...patientTasks.map((item) => timelineItem(item.createdAt, "patient_task", "Patient task created", item.status, item.title, undefined, "/tasks", undefined, item.id)),
      ...patientInternalNotes.map((item) => timelineItem(item.createdAt, "internal_note", "Internal note recorded", item.archived ? "archived" : "active", item.title ?? "Internal note", undefined, `/patients/${patient.id}`, undefined, item.id)),
      ...careAssistDecisions.map((item) => timelineItem(item.createdAt, "care_assist", "Clinical context decision recorded", item.decision, `${item.finding.title}${item.reason ? ` · ${item.reason}` : ""}`, item.decidedByUser.displayName, `/patients/${patient.id}`, undefined, item.id))
    ].filter((item) => isTimelineItemAfterCursor(item, cursor)).sort(compareTimelineItems);
    const hasMore = items.length > limit;
    const pageItems = items.slice(0, limit);
    const nextCursor = hasMore && pageItems.length ? encodeTimelineCursor(pageItems[pageItems.length - 1]!) : null;

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.timeline_read",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { count: pageItems.length, hasMore }
    });

    return { patientId: patient.id, items: pageItems, nextCursor, hasMore };
  }

  async historySheets(id: string, user: AuthUser) {
    const patient = await this.get(id, user);
    const [historySheets, operationHistory, medicationHistory, investigationHistory] = await Promise.all([
      this.prisma.patientHistorySheet.findMany({
        where: { patientId: id },
        orderBy: { createdAt: "desc" },
        include: { operationHistoryItems: true, medicationHistoryItems: true, investigationHistoryItems: true, createdByUser: true, updatedByUser: true }
      }),
      this.prisma.patientOperationHistoryItem.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
      this.prisma.patientMedicationHistoryItem.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
      this.prisma.patientInvestigationHistoryItem.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } })
    ]);

    await this.audit.record({
      actorUserId: user.id,
      action: "patient_history.read",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { sheetCount: historySheets.length }
    });

    return { historySheets, operationHistory, medicationHistory, investigationHistory };
  }

  async createHistorySheet(id: string, dto: PatientHistorySheetDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const sheet = await this.prisma.patientHistorySheet.create({
      data: {
        patientId: id,
        title: clean(dto.title) ?? "OB/GYN history sheet",
        status: clean(dto.status) ?? "draft",
        chiefComplaint: clean(dto.chiefComplaint),
        historyOfPresentIllness: clean(dto.historyOfPresentIllness),
        menstrualHistory: jsonOrNull(dto.menstrualHistory),
        obstetricHistory: jsonOrNull(dto.obstetricHistory),
        gynecologicalHistory: jsonOrNull(dto.gynecologicalHistory),
        contraceptionHistory: jsonOrNull(dto.contraceptionHistory),
        infertilityHistory: jsonOrNull(dto.infertilityHistory),
        pastMedicalHistory: jsonOrNull(dto.pastMedicalHistory),
        allergyHistory: jsonOrNull(dto.allergyHistory),
        familyHistory: jsonOrNull(dto.familyHistory),
        socialHistory: jsonOrNull(dto.socialHistory),
        notes: clean(dto.notes),
        createdByUserId: user.id
      },
      include: { operationHistoryItems: true, medicationHistoryItems: true, investigationHistoryItems: true }
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_history_sheet.created", resourceType: "patient_history_sheet", resourceId: sheet.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, changedFields: Object.keys(dto) } });
    for (const tagCode of historySheetTagCodes(dto)) {
      await this.clinicalTags.createFromSource({ patientId: id, tagCode, sourceType: "history_sheet", sourceId: sheet.id, createdByUserId: user.id });
    }
    return sheet;
  }

  async updateHistorySheet(id: string, historySheetId: string, dto: PatientHistorySheetDto, user: AuthUser) {
    const patient = await this.get(id, user);
    await this.assertHistorySheet(id, historySheetId);
    const sheet = await this.prisma.patientHistorySheet.update({
      where: { id: historySheetId },
      data: {
        ...(dto.title !== undefined ? { title: clean(dto.title) ?? "OB/GYN history sheet" } : {}),
        ...(dto.status !== undefined ? { status: clean(dto.status) ?? "draft" } : {}),
        ...(dto.chiefComplaint !== undefined ? { chiefComplaint: clean(dto.chiefComplaint) } : {}),
        ...(dto.historyOfPresentIllness !== undefined ? { historyOfPresentIllness: clean(dto.historyOfPresentIllness) } : {}),
        ...(dto.menstrualHistory !== undefined ? { menstrualHistory: jsonOrNull(dto.menstrualHistory) } : {}),
        ...(dto.obstetricHistory !== undefined ? { obstetricHistory: jsonOrNull(dto.obstetricHistory) } : {}),
        ...(dto.gynecologicalHistory !== undefined ? { gynecologicalHistory: jsonOrNull(dto.gynecologicalHistory) } : {}),
        ...(dto.contraceptionHistory !== undefined ? { contraceptionHistory: jsonOrNull(dto.contraceptionHistory) } : {}),
        ...(dto.infertilityHistory !== undefined ? { infertilityHistory: jsonOrNull(dto.infertilityHistory) } : {}),
        ...(dto.pastMedicalHistory !== undefined ? { pastMedicalHistory: jsonOrNull(dto.pastMedicalHistory) } : {}),
        ...(dto.allergyHistory !== undefined ? { allergyHistory: jsonOrNull(dto.allergyHistory) } : {}),
        ...(dto.familyHistory !== undefined ? { familyHistory: jsonOrNull(dto.familyHistory) } : {}),
        ...(dto.socialHistory !== undefined ? { socialHistory: jsonOrNull(dto.socialHistory) } : {}),
        ...(dto.notes !== undefined ? { notes: clean(dto.notes) } : {}),
        updatedByUserId: user.id
      },
      include: { operationHistoryItems: true, medicationHistoryItems: true, investigationHistoryItems: true }
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_history_sheet.updated", resourceType: "patient_history_sheet", resourceId: sheet.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, changedFields: Object.keys(dto) } });
    for (const tagCode of historySheetTagCodes(dto)) {
      await this.clinicalTags.createFromSource({ patientId: id, tagCode, sourceType: "history_sheet", sourceId: sheet.id, createdByUserId: user.id });
    }
    return sheet;
  }

  async createOperationHistory(id: string, dto: PatientOperationHistoryDto, user: AuthUser, idempotencyKey?: string) {
    const patient = await this.get(id, user);
    await this.assertHistorySheet(id, dto.historySheetId);
    const catalog = dto.operationCatalogItemId ? await this.prisma.operationCatalogItem.findFirst({ where: { id: dto.operationCatalogItemId, isActive: true } }) : null;
    if (dto.operationCatalogItemId && !catalog) throw new BadRequestException("Operation catalog item was not found.");
    const request = { patientId: id, ...dto, operationCatalogItemId: catalog?.id ?? dto.operationCatalogItemId };
    const attempt = idempotencyKey ? await this.idempotency.beginOrReplay({ userId: user.id, branchId: patient.branchId, scopeKey: id, operation: "patient.operation_history.create", rawKey: idempotencyKey, requestPayload: request }) : null;
    if (attempt?.isReplay) {
      if (!attempt.resourceId) throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Operation history save is still in progress." });
      const replay = await this.prisma.patientOperationHistoryItem.findFirst({ where: { id: attempt.resourceId, patientId: id } });
      if (!replay) throw new ConflictException({ code: "IDEMPOTENCY_RESOURCE_MISSING", message: "Saved operation history could not be reloaded." });
      return replay;
    }
    let item;
    try {
      item = await this.prisma.$transaction(async (tx) => {
        const created = await tx.patientOperationHistoryItem.create({ data: { patientId: id, historySheetId: dto.historySheetId ?? null, operationCatalogItemId: catalog?.id ?? null, operationNameSnapshot: catalog?.name ?? dto.operationNameSnapshot.trim(), approximateDate: dto.approximateDate ? new Date(dto.approximateDate) : null, year: dto.year ?? null, notes: clean(dto.notes) } });
        if (attempt) await this.idempotency.complete({ tx, recordId: attempt.recordId, responseStatus: 201, resourceType: "patient_operation_history_item", resourceId: created.id });
        return created;
      });
    } catch (error) {
      if (attempt) await this.idempotency.failOrRelease({ recordId: attempt.recordId, safeReason: "Operation history save failed.", releaseLock: true }).catch(() => undefined);
      throw error;
    }
    await this.audit.record({ actorUserId: user.id, action: "patient_operation_history.created", resourceType: "patient_operation_history_item", resourceId: item.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, catalogLinked: Boolean(catalog) } });
    const operationTag = operationTagCode(item.operationNameSnapshot);
    if (operationTag) await this.clinicalTags.createFromSource({ patientId: id, tagCode: operationTag, sourceType: "operation_history", sourceId: item.id, createdByUserId: user.id });
    return item;
  }

  async createMedicationHistory(id: string, dto: PatientMedicationHistoryDto, user: AuthUser, idempotencyKey?: string) {
    const patient = await this.get(id, user);
    await this.assertHistorySheet(id, dto.historySheetId);
    const generic = dto.medicationGenericId ? await this.prisma.medicationGeneric.findFirst({ where: { id: dto.medicationGenericId, isActive: true, isControlled: false } }) : null;
    if (dto.medicationGenericId && !generic) throw new BadRequestException("Generic medication reference was not found or is not available for normal selection.");
    const normalizedStatus = dto.currentOrPast === "previous" ? "past" : clean(dto.currentOrPast) ?? "past";
    const request = { patientId: id, ...dto, currentOrPast: normalizedStatus, medicationGenericId: generic?.id ?? dto.medicationGenericId };
    const attempt = idempotencyKey ? await this.idempotency.beginOrReplay({ userId: user.id, branchId: patient.branchId, scopeKey: id, operation: "patient.medication_history.create", rawKey: idempotencyKey, requestPayload: request }) : null;
    if (attempt?.isReplay) {
      if (!attempt.resourceId) throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Medication history save is still in progress." });
      const replay = await this.prisma.patientMedicationHistoryItem.findFirst({ where: { id: attempt.resourceId, patientId: id } });
      if (!replay) throw new ConflictException({ code: "IDEMPOTENCY_RESOURCE_MISSING", message: "Saved medication history could not be reloaded." });
      return replay;
    }
    let item;
    try {
      item = await this.prisma.$transaction(async (tx) => {
        const created = await tx.patientMedicationHistoryItem.create({ data: { patientId: id, historySheetId: dto.historySheetId ?? null, medicationGenericId: generic?.id ?? null, genericNameSnapshot: generic?.genericName ?? dto.genericNameSnapshot.trim(), familyNameSnapshot: generic?.familyName ?? clean(dto.familyNameSnapshot), currentOrPast: normalizedStatus, clinicalGroupSnapshot: clean(dto.clinicalGroupSnapshot), indication: clean(dto.indication), startDate: dto.startDate ? new Date(dto.startDate) : null, stopDate: dto.stopDate ? new Date(dto.stopDate) : null, notes: clean(dto.notes) } });
        if (attempt) await this.idempotency.complete({ tx, recordId: attempt.recordId, responseStatus: 201, resourceType: "patient_medication_history_item", resourceId: created.id });
        return created;
      });
    } catch (error) {
      if (attempt) await this.idempotency.failOrRelease({ recordId: attempt.recordId, safeReason: "Medication history save failed.", releaseLock: true }).catch(() => undefined);
      throw error;
    }
    await this.audit.record({ actorUserId: user.id, action: "patient_medication_history.created", resourceType: "patient_medication_history_item", resourceId: item.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, catalogLinked: Boolean(generic) } });
    return item;
  }

  async createInvestigationHistory(id: string, dto: PatientInvestigationHistoryDto, user: AuthUser, idempotencyKey?: string) {
    const patient = await this.get(id, user);
    await this.assertHistorySheet(id, dto.historySheetId);
    const catalog = dto.investigationCatalogItemId ? await this.prisma.investigationCatalogItem.findFirst({ where: { id: dto.investigationCatalogItemId, active: true } }) : null;
    if (dto.investigationCatalogItemId && !catalog) throw new BadRequestException("Investigation catalog item was not found.");
    const request = { patientId: id, ...dto, investigationCatalogItemId: catalog?.id ?? dto.investigationCatalogItemId };
    const attempt = idempotencyKey ? await this.idempotency.beginOrReplay({ userId: user.id, branchId: patient.branchId, scopeKey: id, operation: "patient.investigation_history.create", rawKey: idempotencyKey, requestPayload: request }) : null;
    if (attempt?.isReplay) {
      if (!attempt.resourceId) throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Investigation history save is still in progress." });
      const replay = await this.prisma.patientInvestigationHistoryItem.findFirst({ where: { id: attempt.resourceId, patientId: id } });
      if (!replay) throw new ConflictException({ code: "IDEMPOTENCY_RESOURCE_MISSING", message: "Saved investigation history could not be reloaded." });
      return replay;
    }
    let item;
    try {
      item = await this.prisma.$transaction(async (tx) => {
        const created = await tx.patientInvestigationHistoryItem.create({ data: { patientId: id, historySheetId: dto.historySheetId ?? null, investigationCatalogItemId: catalog?.id ?? null, investigationNameSnapshot: catalog?.name ?? dto.investigationNameSnapshot.trim(), context: clean(dto.context) ?? "previous", date: dto.date ? new Date(dto.date) : null, notes: clean(dto.notes) } });
        if (attempt) await this.idempotency.complete({ tx, recordId: attempt.recordId, responseStatus: 201, resourceType: "patient_investigation_history_item", resourceId: created.id });
        return created;
      });
    } catch (error) {
      if (attempt) await this.idempotency.failOrRelease({ recordId: attempt.recordId, safeReason: "Investigation history save failed.", releaseLock: true }).catch(() => undefined);
      throw error;
    }
    await this.audit.record({ actorUserId: user.id, action: "patient_investigation_history.created", resourceType: "patient_investigation_history_item", resourceId: item.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, catalogLinked: Boolean(catalog) } });
    return item;
  }

  async update(id: string, dto: UpdatePatientDto, user: AuthUser) {
    await this.get(id, user);
    const data: Prisma.PatientUpdateInput = {};
    const changedFields = Object.keys(dto);

    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.yearOfBirth !== undefined) data.yearOfBirth = dto.yearOfBirth;
    if (dto.sex !== undefined) data.sex = dto.sex?.trim() || null;
    if (dto.patientType !== undefined) data.patientType = dto.patientType;
    if (dto.sexualActivityStatus !== undefined) data.sexualActivityStatus = dto.sexualActivityStatus;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email?.trim().toLowerCase() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.secondaryPhone !== undefined) data.secondaryPhone = dto.secondaryPhone?.trim() || null;
    if (dto.bloodGroup !== undefined) data.bloodGroup = dto.bloodGroup?.trim() || null;
    if (dto.allergyStatus !== undefined) data.allergyStatus = dto.allergyStatus;
    if (dto.dateOfBirth) data.yearOfBirth = new Date(dto.dateOfBirth).getUTCFullYear();

    const previous = await this.prisma.patient.findUniqueOrThrow({ where: { id }, select: { patientType: true } });
    const contextChanged = dto.patientType !== undefined && dto.patientType !== previous.patientType;

    const patient = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.patient.update({ where: { id }, data });
      if (contextChanged) await tx.patientCareContextTransition.create({ data: { patientId: id, previousContext: previous.patientType, newContext: dto.patientType!, effectiveAt: dto.contextEffectiveAt ? new Date(dto.contextEffectiveAt) : new Date(), reason: dto.contextChangeReason?.trim() || null, actorUserId: user.id } });
      return updated;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.updated",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { changedFields, contextTransition: contextChanged ? { previousContext: previous.patientType, newContext: dto.patientType, effectiveAt: dto.contextEffectiveAt ?? "now", reason: dto.contextChangeReason ?? null } : null }
    });

    return patient;
  }

  async createAppointment(id: string, dto: PatientContextAppointmentDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const branchId = patient.branchId ?? (await this.resolveBranchId(user));
    await assertCanReferenceUserInBranch(this.prisma, dto.doctorId, user, branchId);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      throw new BadRequestException("Appointment time is invalid.");
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        branchId,
        patientId: patient.id,
        doctorId: dto.doctorId ?? null,
        startAt,
        endAt,
        appointmentType: clean(dto.appointmentType) ?? "Clinic visit",
        source: "patient_file",
        notes: clean(dto.notes),
        createdByUserId: user.id
      },
      include: { patient: true }
    });
    await this.audit.record({ actorUserId: user.id, action: "appointment.created", resourceType: "appointment", resourceId: appointment.id, branchId, severity: "medium", metadataJson: { patientId: id, source: "patient_file" } });
    return appointment;
  }

  async checkIn(id: string, dto: PatientContextQueueDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const branchId = patient.branchId ?? (await this.resolveBranchId(user));
    if (dto.appointmentId) {
      const appointment = await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, { patientId: id });
      if (appointment && appointment.branchId !== branchId) throw new BadRequestException("Appointment does not match this patient file.");
    }
    const checkedInAt = new Date();
    const queueDate = toUtcDateOnly(checkedInAt);
    const activeTicket = await this.prisma.queueTicket.findFirst({
      where: { branchId, patientId: id, queueDate, status: { in: ["waiting", "called", "in_room"] } },
      orderBy: { queueNumber: "asc" },
      include: { patient: true, appointment: true }
    });
    if (activeTicket) {
      throw new BadRequestException(activeTicket.status === "in_room" ? "Patient is already with doctor." : `Already in queue · Position ${activeTicket.queueNumber}`);
    }
    const ticket = await this.createQueueTicketWithRetry({
      branchId,
      patientId: id,
      appointmentId: dto.appointmentId ?? null,
      receptionistUserId: user.id,
      receptionistDisplayNameSnapshot: user.displayName || user.loginId || user.email || "Reception",
      checkInMethod: dto.checkInMethod?.trim() || "Manual",
      checkedInAt,
      queueDate
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "queue.checked_in",
      resourceType: "queue_ticket",
      resourceId: ticket.id,
      branchId,
      severity: "medium",
      metadataJson: {
        patientId: id,
        queueNumber: ticket.queueNumber,
        queueDate: ticket.queueDate.toISOString().slice(0, 10),
        source: "patient_file",
        visitType: ticket.visitType,
        checkInMethod: ticket.checkInMethod,
        receptionistUserId: ticket.receptionistUserId,
        receptionistDisplayNameSnapshot: ticket.receptionistDisplayNameSnapshot
      }
    });
    return ticket;
  }

  async createEncounter(id: string, dto: PatientContextEncounterDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const branchId = patient.branchId;
    if (!branchId) {
      throw new BadRequestException("Patient branch is required to create an encounter.");
    }
    await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, { patientId: id, requireDoctorScope: true });
    const encounterId = randomUUID();
    const encounter = await this.prisma.encounter.create({
      data: {
        id: encounterId,
        branchId,
        patientId: id,
        appointmentId: dto.appointmentId ?? null,
        doctorId: user.id,
        chiefComplaint: clean(dto.chiefComplaint),
        ...(dto.complaintStatus ? { followUpJson: mergeComplaintLifecycle(undefined, dto.complaintStatus, { encounterId, recordedAt: new Date() }) } : {}),
        historyText: clean(dto.historyText),
        examText: clean(dto.examText),
        assessmentText: clean(dto.assessmentText),
        planText: clean(dto.planText)
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "encounter.created", resourceType: "encounter", resourceId: encounter.id, branchId, severity: "high", metadataJson: { patientId: id, source: "patient_file" } });
    return encounter;
  }

  async createPrescription(id: string, dto: PatientContextPrescriptionDto, user: AuthUser, idempotencyKey?: string) {
    const patient = await this.get(id, user);
    const encounter = await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: id, requireDoctorScope: true });
    if (!encounter || encounter.status !== "draft") throw new BadRequestException("An active draft visit is required to add a prescription.");
    const resolvedItems = await Promise.all(dto.items.map((item) => resolvePrescriptionItem(this.prisma, item)));
    const attempt = idempotencyKey ? await this.idempotency.beginOrReplay({ userId: user.id, branchId: patient.branchId, scopeKey: dto.encounterId, operation: "visit.prescription.create", rawKey: idempotencyKey, requestPayload: dto }) : null;
    if (attempt?.isReplay) {
      if (!attempt.resourceId) throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Prescription save is still in progress." });
      const replay = await this.prisma.prescription.findFirst({ where: { id: attempt.resourceId, patientId: id, encounterId: dto.encounterId }, include: { items: true, patient: true, encounter: true } });
      if (!replay) throw new ConflictException({ code: "IDEMPOTENCY_RESOURCE_MISSING", message: "Saved prescription could not be reloaded." });
      return replay;
    }
    let prescription;
    try {
      prescription = await this.prisma.$transaction(async (tx) => {
        const created = await tx.prescription.create({ data: { patientId: id, encounterId: dto.encounterId, doctorId: user.id, notes: clean(dto.notes), items: { create: resolvedItems } }, include: { items: true, patient: true, encounter: true } });
        if (attempt) await this.idempotency.complete({ tx, recordId: attempt.recordId, responseStatus: 201, resourceType: "prescription", resourceId: created.id });
        return created;
      });
    } catch (error) {
      if (attempt) await this.idempotency.failOrRelease({ recordId: attempt.recordId, safeReason: "Prescription save failed.", releaseLock: true }).catch(() => undefined);
      throw error;
    }
    await this.audit.record({ actorUserId: user.id, action: "prescription.created", resourceType: "prescription", resourceId: prescription.id, severity: "high", metadataJson: { patientId: id, itemCount: prescription.items.length, source: "patient_file" } });
    return prescription;
  }

  async createInvestigation(id: string, dto: PatientContextInvestigationDto, user: AuthUser, idempotencyKey?: string) {
    const patient = await this.get(id, user);
    const encounter = await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: id, requireDoctorScope: true });
    if (!encounter || encounter.status !== "draft") throw new BadRequestException("An active draft visit is required to request investigations.");
    const attempt = idempotencyKey ? await this.idempotency.beginOrReplay({ userId: user.id, branchId: patient.branchId, scopeKey: dto.encounterId, operation: "visit.investigation.create", rawKey: idempotencyKey, requestPayload: dto }) : null;
    if (attempt?.isReplay) {
      if (!attempt.resourceId) throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Investigation save is still in progress." });
      const replay = await this.prisma.investigationOrder.findFirst({ where: { id: attempt.resourceId, patientId: id, encounterId: dto.encounterId }, include: { items: true, patient: true, encounter: true } });
      if (!replay) throw new ConflictException({ code: "IDEMPOTENCY_RESOURCE_MISSING", message: "Saved investigation request could not be reloaded." });
      return replay;
    }
    let order;
    try {
      order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.investigationOrder.create({ data: { patientId: id, encounterId: dto.encounterId, doctorId: user.id, priority: dto.priority ?? "routine", notes: clean(dto.notes), items: { create: dto.items.map((item) => ({ category: item.category, testName: item.testName.trim(), instructions: clean(item.instructions) })) } }, include: { items: true, patient: true, encounter: true } });
        if (attempt) await this.idempotency.complete({ tx, recordId: attempt.recordId, responseStatus: 201, resourceType: "investigation_order", resourceId: created.id });
        return created;
      });
    } catch (error) {
      if (attempt) await this.idempotency.failOrRelease({ recordId: attempt.recordId, safeReason: "Investigation save failed.", releaseLock: true }).catch(() => undefined);
      throw error;
    }
    await this.audit.record({ actorUserId: user.id, action: "investigation_order.created", resourceType: "investigation_order", resourceId: order.id, severity: "high", metadataJson: { patientId: id, itemCount: order.items.length, source: "patient_file" } });
    return order;
  }

  async createReport(id: string, dto: PatientContextReportDto, user: AuthUser) {
    const patient = await this.get(id, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: id, requireDoctorScope: true });
    await assertCanReferenceInvestigationOrder(this.prisma, dto.investigationOrderId, user, { patientId: id, requireDoctorScope: true });
    const report = await this.prisma.report.create({
      data: { patientId: id, branchId: patient.branchId, encounterId: dto.encounterId ?? null, investigationOrderId: dto.investigationOrderId ?? null, category: dto.category, title: dto.title.trim(), resultSummary: clean(dto.resultSummary), source: "patient_file_placeholder", uploadedByUserId: user.id },
      include: { patient: true, encounter: true, investigationOrder: true }
    });
    await this.audit.record({ actorUserId: user.id, action: "report.created", resourceType: "report", resourceId: report.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, category: report.category, source: "patient_file" } });
    return report;
  }

  async createUltrasound(id: string, dto: PatientContextUltrasoundDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const pregnancy = await assertCanReferencePregnancy(this.prisma, dto.pregnancyId, user, { patientId: id });
    await this.assertCanReferenceFetus(dto.fetusId, pregnancy?.id);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: id, requireDoctorScope: true });
    const ultrasound = await this.prisma.obUltrasound.create({
      data: {
        patientId: id,
        branchId: patient.branchId,
        pregnancyId: dto.pregnancyId ?? null,
        fetusId: dto.fetusId ?? null,
        encounterId: dto.encounterId ?? null,
        performedAt: toDateTime(dto.performedAt) ?? new Date(),
        scanType: clean(dto.scanType),
        indication: clean(dto.indication),
        gestationalAgeDisplay: clean(dto.gestationalAgeDisplay),
        gestationalAgeWeeks: dto.gestationalAgeWeeks,
        gestationalAgeDays: dto.gestationalAgeDays,
        fetalHeartText: clean(dto.fetalHeartText),
        presentation: clean(dto.presentation),
        placenta: clean(dto.placenta),
        amnioticFluid: clean(dto.amnioticFluid),
        bpdMm: decimalOrNull(dto.bpdMm),
        hcMm: decimalOrNull(dto.hcMm),
        acMm: decimalOrNull(dto.acMm),
        flMm: decimalOrNull(dto.flMm),
        efwGrams: dto.efwGrams,
        dopplerNote: clean(dto.dopplerNote),
        impressionText: clean(dto.impressionText),
        createdByUserId: user.id
      },
      include: { patient: true, pregnancy: true, fetus: true, encounter: true }
    });
    await this.audit.record({ actorUserId: user.id, action: "ob_ultrasound.created", resourceType: "ob_ultrasound", resourceId: ultrasound.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, source: "patient_file", fetusId: ultrasound.fetusId, safety: "recording_only_clinician_interpretation_required" } });
    return ultrasound;
  }

  async createInvoice(id: string, dto: PatientContextInvoiceDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const context = await resolvePatientBillingContext(this.prisma, user, {
      patientId: id,
      appointmentId: dto.appointmentId,
      queueTicketId: dto.queueTicketId,
      encounterId: dto.encounterId
    });
    assertDiscountAllowed(dto.discountAmount ?? 0, dto.discountReason, user);
    const items = await resolvePatientInvoiceItems(this.prisma, dto.items);
    const totals = calculateTotals(items, dto.discountAmount ?? 0, 0);
    const invoice = await this.prisma.invoice.create({
      data: {
        patientId: id,
        branchId: patient.branchId,
        appointmentId: context.appointmentId,
        queueTicketId: context.queueTicketId,
        encounterId: context.encounterId,
        invoiceNumber: await this.nextInvoiceNumber(),
        subtotalAmount: totals.subtotal,
        discountAmount: totals.discount,
        totalAmount: totals.total,
        amountPaid: totals.paid,
        balanceAmount: totals.balance,
        notes: clean(dto.notes),
        createdByUserId: user.id,
        items: { create: items.map((item) => invoiceItemCreate(item)) }
      },
      include: { items: true, payments: true, patient: true }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "invoice.created",
      resourceType: "invoice",
      resourceId: invoice.id,
      branchId: patient.branchId,
      severity: "high",
      reason: totals.discount.greaterThan(0) ? dto.discountReason?.trim() : undefined,
      metadataJson: {
        patientId: id,
        totalAmount: invoice.totalAmount.toString(),
        discountAmount: invoice.discountAmount.toString(),
        source: "patient_file",
        context,
        serviceItemIds: items.map((item) => item.serviceItemId).filter(Boolean)
      }
    });
    if (totals.discount.greaterThan(0)) {
      await this.audit.record({
        actorUserId: user.id,
        action: "invoice.discount_applied",
        resourceType: "invoice",
        resourceId: invoice.id,
        branchId: patient.branchId,
        severity: "high",
        reason: dto.discountReason?.trim(),
        metadataJson: { patientId: id, source: "patient_file", discountAmount: invoice.discountAmount.toString() }
      });
    }
    return invoice;
  }

  async createPayment(id: string, dto: PatientContextPaymentDto, user: AuthUser) {
    await this.get(id, user);
    const invoice = await assertCanReferenceInvoice(this.prisma, dto.invoiceId, user);
    if (invoice.patientId !== id) throw new BadRequestException("Invoice does not belong to this patient file.");
    const paymentAmount = money(dto.amount);
    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: { invoiceId: invoice.id, patientId: id, branchId: invoice.branchId, method: dto.method, amount: paymentAmount, referenceNote: clean(dto.referenceNote), note: clean(dto.note), recordedByUserId: user.id },
        include: { invoice: true, patient: true }
      });
      await tx.invoice.update({ where: { id: invoice.id }, data: paymentRollup(invoice.totalAmount, invoice.amountPaid.add(paymentAmount)) });
      return created;
    });
    await this.audit.record({ actorUserId: user.id, action: "payment.recorded", resourceType: "payment", resourceId: payment.id, branchId: payment.branchId, severity: "high", metadataJson: { patientId: id, invoiceId: invoice.id, amount: payment.amount.toString(), source: "patient_file", manualOnly: true } });
    return payment;
  }

  async createConsent(id: string, dto: PatientContextConsentDto, user: AuthUser) {
    const patient = await this.get(id, user);
    const consent = await this.prisma.consentRecord.create({
      data: { patientId: id, consentType: dto.consentType, status: dto.status, notes: clean(dto.notes), capturedByUserId: user.id }
    });
    await this.audit.record({ actorUserId: user.id, action: "consent.created", resourceType: "consent_record", resourceId: consent.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId: id, consentType: consent.consentType, status: consent.status, source: "patient_file" } });
    return consent;
  }

  private async requirePatientPhase(patientId: string, phaseId: string) {
    const phase = await this.prisma.patientClinicalPhase.findFirst({ where: { id: phaseId, patientId } });
    if (!phase) throw new NotFoundException("Clinical phase not found.");
    return phase;
  }

  private async requirePatientCycle(patientId: string, cycleId: string) {
    const cycle = await this.prisma.ovulationInductionCycle.findFirst({ where: { id: cycleId, patientId } });
    if (!cycle) throw new NotFoundException("Ovulation induction cycle not found.");
    return cycle;
  }

  private async resolveBranchId(user: AuthUser) {
    if (user.branchId) {
      return user.branchId;
    }

    const branch = await this.prisma.branch.findFirst({ orderBy: { createdAt: "asc" } });

    if (!branch) {
      throw new BadRequestException("Branch is not configured.");
    }

    return branch.id;
  }

  private async createQueueTicketWithRetry(input: {
    branchId: string;
    patientId: string;
    appointmentId: string | null;
    receptionistUserId: string;
    receptionistDisplayNameSnapshot: string;
    checkInMethod: string;
    checkedInAt: Date;
    queueDate: Date;
  }) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const queueNumber = await this.nextQueueNumber(tx, input.branchId, input.queueDate);

          return tx.queueTicket.create({
            data: {
              branchId: input.branchId,
              patientId: input.patientId,
              appointmentId: input.appointmentId,
              queueNumber,
              queueDate: input.queueDate,
              checkedInAt: input.checkedInAt,
              visitType: "kashf",
              receptionistUserId: input.receptionistUserId,
              receptionistDisplayNameSnapshot: input.receptionistDisplayNameSnapshot,
              checkInMethod: input.checkInMethod
            },
            include: { patient: true, appointment: true }
          });
        });
      } catch (error) {
        if (isUniqueViolation(error) && attempt < 2) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException("Could not allocate a queue number. Please try again.");
  }

  private async nextQueueNumber(tx: Prisma.TransactionClient, branchId: string, queueDate: Date) {
    const latest = await tx.queueTicket.findFirst({
      where: { branchId, queueDate },
      orderBy: { queueNumber: "desc" }
    });
    return (latest?.queueNumber ?? 0) + 1;
  }

  private async nextInvoiceNumber() {
    const count = await this.prisma.invoice.count();
    return `DEMO-INV-${String(count + 1).padStart(4, "0")}`;
  }

  private async assertCanReferenceFetus(fetusId: string | undefined, pregnancyId: string | null | undefined) {
    if (!fetusId) return null;
    if (!pregnancyId) {
      throw new BadRequestException("A fetus record must be linked to a pregnancy episode.");
    }

    const fetus = await this.prisma.pregnancyFetus.findFirst({ where: { id: fetusId, pregnancyId } });
    if (!fetus) {
      throw new NotFoundException("Fetus record not found.");
    }
    return fetus;
  }

  private async assertHistorySheet(patientId: string, historySheetId?: string) {
    if (!historySheetId) return null;
    const sheet = await this.prisma.patientHistorySheet.findFirst({ where: { id: historySheetId, patientId } });
    if (!sheet) throw new NotFoundException("History sheet not found.");
    return sheet;
  }
}

type TimelineCursor = { timestamp: string; type: string; id: string };
type TimelineItemRow = { id: string; sourceId: string; dateTime: string; type: string; title: string; status: string; description: string; actor?: string; href?: string; doctorSignature?: Record<string, unknown> };

function parseTimelineLimit(raw?: string) {
  if (raw === undefined || raw === "") return 25;
  if (!/^\d+$/.test(raw)) throw timelineCursorError("Timeline limit must be an integer between 1 and 50.");
  const limit = Number(raw);
  if (limit < 1 || limit > 50) throw timelineCursorError("Timeline limit must be between 1 and 50.");
  return limit;
}

function decodeTimelineCursor(raw?: string): TimelineCursor | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<TimelineCursor> & { v?: number };
    if (value.v !== 1 || typeof value.timestamp !== "string" || Number.isNaN(Date.parse(value.timestamp)) || typeof value.type !== "string" || !/^[a-z_]{1,40}$/.test(value.type) || typeof value.id !== "string" || !/^[0-9a-f-]{36}$/i.test(value.id)) throw new Error("invalid");
    return { timestamp: new Date(value.timestamp).toISOString(), type: value.type, id: value.id };
  } catch {
    throw timelineCursorError("Timeline cursor is invalid.");
  }
}

function encodeTimelineCursor(item: TimelineItemRow) {
  return Buffer.from(JSON.stringify({ v: 1, timestamp: item.dateTime, type: item.type, id: item.sourceId }), "utf8").toString("base64url");
}

function timelineCursorError(message: string) {
  return new BadRequestException({ code: "PATIENT_TIMELINE_CURSOR_INVALID", message });
}

function timelineCursorWhere(cursor: TimelineCursor | null, sourceType: string, dateField: string): Record<string, unknown> {
  if (!cursor) return {};
  const timestamp = new Date(cursor.timestamp);
  if (sourceType < cursor.type) return { [dateField]: { lt: timestamp } };
  if (sourceType > cursor.type) return { [dateField]: { lte: timestamp } };
  return { OR: [{ [dateField]: { lt: timestamp } }, { [dateField]: timestamp, id: { gt: cursor.id } }] };
}

function compareTimelineItems(left: TimelineItemRow, right: TimelineItemRow) {
  const timestampDifference = Date.parse(right.dateTime) - Date.parse(left.dateTime);
  if (timestampDifference) return timestampDifference;
  const typeDifference = left.type.localeCompare(right.type);
  return typeDifference || left.sourceId.localeCompare(right.sourceId);
}

function isTimelineItemAfterCursor(item: TimelineItemRow, cursor: TimelineCursor | null) {
  if (!cursor) return true;
  return compareTimelineItems(item, { ...item, dateTime: cursor.timestamp, type: cursor.type, sourceId: cursor.id }) > 0;
}

function isReceptionistOnly(user: AuthUser) {
  return user.roles.some((role) => ["Reception", "Receptionist"].includes(role)) && !user.roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
}

function timelineItem(dateTime: Date, type: string, title: string, status: string, description: string, actor: string | undefined, href: string | undefined, doctorSignature: Record<string, unknown> | undefined, sourceId: string): TimelineItemRow {
  return { id: `${type}:${sourceId}`, sourceId, dateTime: dateTime.toISOString(), type, title, status, description, actor, href, doctorSignature };
}

function doctorSignature(item: {
  doctorId: string;
  startedByUserId: string | null;
  doctorDisplayNameSnapshot: string | null;
  doctorColorSnapshot: string | null;
  startedAt: Date | null;
  createdAt: Date;
  doctor: { displayName: string; doctorColor: string | null; doctorShortLabel: string | null };
}) {
  const color = normalizeDoctorColor(item.doctorColorSnapshot ?? item.doctor.doctorColor, item.doctorId);
  return {
    doctorId: item.doctorId,
    startedByUserId: item.startedByUserId,
    doctorName: item.doctorDisplayNameSnapshot ?? item.doctor.displayName,
    doctorShortLabel: item.doctor.doctorShortLabel,
    doctorColor: color,
    startedAt: (item.startedAt ?? item.createdAt).toISOString()
  };
}

function normalizeDoctorColor(color: string | null | undefined, userId: string) {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) return color.toUpperCase();
  const palette = ["#0F766E", "#2563EB", "#7C3AED", "#C2410C", "#BE123C", "#047857", "#4338CA", "#A16207"];
  const code = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[code % palette.length];
}

function internalNoteVisibilityWhere(user: AuthUser): Prisma.PatientInternalNoteWhereInput {
  if (isOwnerOrAdmin(user)) return {};
  const allowed: PatientInternalNoteVisibility[] = ["internal_all"];
  if (user.permissions.includes("patient_internal_note.clinical_read")) allowed.push("clinical_only");
  if (user.permissions.includes("patient_internal_note.admin_read")) allowed.push("admin_only");
  if (user.permissions.includes("patient_internal_note.finance_read")) allowed.push("finance_only");
  return { visibility: { in: allowed } };
}

function gynecologyTimelineTitle(templateType: string) {
  if (templateType === "abnormal_uterine_bleeding") return "AUB template recorded";
  if (templateType === "pelvic_pain") return "Pelvic pain template recorded";
  if (templateType === "pcos") return "PCOS template recorded";
  if (templateType === "fibroid_ovarian_cyst") return "Fibroid or ovarian cyst template recorded";
  if (templateType === "contraception") return "Contraception counseling template recorded";
  return "Gynecology visit recorded";
}

function calculateTotals(items: Array<{ quantity?: number; unitAmount: number }>, discountAmount: number, paidAmount: number) {
  const subtotal = items.reduce((sum, item) => sum.add(money(item.unitAmount).mul(item.quantity ?? 1)), money(0));
  const discount = money(discountAmount);
  if (discount.greaterThan(subtotal)) throw new BadRequestException("Discount cannot exceed subtotal.");
  const total = subtotal.sub(discount);
  const paid = money(paidAmount);
  return { subtotal, discount, total, paid, balance: Prisma.Decimal.max(total.sub(paid), 0) };
}

type PatientInvoiceInputItem = {
  serviceItemId?: string | null;
  description: string;
  quantity: number;
  unitAmount: number;
};

async function resolvePatientInvoiceItems(
  prisma: PrismaService,
  items: Array<{ serviceItemId?: string; description?: string; quantity?: number; unitAmount?: number }>
): Promise<PatientInvoiceInputItem[]> {
  const resolved: PatientInvoiceInputItem[] = [];
  for (const item of items) {
    const quantity = item.quantity ?? 1;
    if (item.serviceItemId) {
      const service = await prisma.serviceItem.findFirst({ where: { id: item.serviceItemId, active: true } });
      if (!service) throw new BadRequestException("Selected service is not active or was not found.");
      if (service.price === null) throw new BadRequestException("Selected service is not priced yet and requires finance review before invoicing.");
      resolved.push({
        serviceItemId: service.id,
        description: item.description?.trim() || service.name,
        quantity,
        unitAmount: Number(service.price)
      });
      continue;
    }

    if (!item.description?.trim() || item.unitAmount === undefined) {
      throw new BadRequestException("Manual invoice items require a service name and price.");
    }
    resolved.push({ description: item.description.trim(), quantity, unitAmount: item.unitAmount });
  }

  return resolved;
}

function invoiceItemCreate(item: PatientInvoiceInputItem) {
  if (item.unitAmount === undefined) {
    throw new BadRequestException("Selected service is not priced yet and requires finance review before invoicing.");
  }
  const unitAmount = money(item.unitAmount);
  return {
    serviceItemId: item.serviceItemId ?? null,
    description: item.description,
    quantity: item.quantity,
    unitAmount,
    lineAmount: unitAmount.mul(item.quantity)
  };
}

async function resolvePatientBillingContext(
  prisma: PrismaService,
  user: AuthUser,
  input: { patientId: string; appointmentId?: string; queueTicketId?: string; encounterId?: string }
) {
  const appointment = await assertCanReferenceAppointment(prisma, input.appointmentId, user, { patientId: input.patientId });
  const encounter = await assertCanReferenceEncounter(prisma, input.encounterId, user, { patientId: input.patientId });
  const queueTicket = input.queueTicketId ? await assertCanReferenceQueueTicket(prisma, input.queueTicketId, user) : null;
  if (queueTicket && queueTicket.patientId !== input.patientId) {
    throw new BadRequestException("Referenced check-in does not belong to this patient.");
  }

  return {
    appointmentId: appointment?.id ?? null,
    queueTicketId: queueTicket?.id ?? null,
    encounterId: encounter?.id ?? null
  };
}

function assertDiscountAllowed(discountAmount: number, reason: string | undefined, user: AuthUser) {
  if (discountAmount <= 0) return;
  if (!user.permissions.includes("billing.adjust")) {
    throw new ForbiddenException("Discounts require billing adjustment permission.");
  }
  if (!reason?.trim()) {
    throw new BadRequestException("Discount reason is required.");
  }
}

function paymentRollup(totalAmount: Prisma.Decimal, amountPaid: Prisma.Decimal) {
  const balanceAmount = Prisma.Decimal.max(totalAmount.sub(amountPaid), 0);
  const status: InvoiceStatus = amountPaid.greaterThanOrEqualTo(totalAmount) ? "paid" : amountPaid.greaterThan(0) ? "partially_paid" : "issued";
  return { amountPaid, balanceAmount, status };
}

function money(value: number) {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function decimalOrNull(value: number | undefined) {
  return value === undefined ? null : new Prisma.Decimal(value).toDecimalPlaces(2);
}

function clean(value?: string) {
  return value?.trim() || null;
}

function jsonOrNull(value?: Record<string, unknown>): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!value || !Object.keys(value).length) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function resolvePrescriptionItem(
  prisma: PrismaService,
  item: { medicationName: string; medicationProductId?: string; drugMarketVariantId?: string; medicationGenericId?: string; dose?: string; frequency?: string; instructions?: string }
) {
  const base = {
    medicationName: item.medicationName.trim(),
    dose: clean(item.dose),
    frequency: clean(item.frequency),
    instructions: clean(item.instructions)
  };

  if (item.medicationGenericId) {
    const generic = await prisma.medicationGeneric.findFirst({ where: { id: item.medicationGenericId, isActive: true, isControlled: false } });
    if (!generic) throw new BadRequestException("Generic medication reference was not found or is not available for normal selection.");
    return {
      ...base,
      medicationGenericId: generic.id,
      medicationProductId: null,
      drugMarketVariantId: null,
      medicationName: generic.genericName,
      genericName: generic.genericName,
      brandName: null,
      tradeName: null,
      strengthText: null,
      dosageForm: null
    };
  }

  if (item.drugMarketVariantId) {
    const variant = await prisma.drugMarketVariant.findFirst({
      where: { id: item.drugMarketVariantId, isDemo: false, verificationStatus: { in: ["verified", "needs_review"] } },
      include: { product: true }
    });
    if (!variant) throw new BadRequestException("Medication market reference was not found or is not review-ready.");
    return {
      ...base,
      medicationProductId: null,
      drugMarketVariantId: variant.id,
      medicationName: item.medicationName?.trim() || variant.tradeName,
      genericName: variant.genericName ?? variant.product.genericName,
      brandName: variant.product.tradeName,
      tradeName: variant.tradeName,
      strengthText: variant.strengthText,
      dosageForm: variant.dosageForm
    };
  }

  if (item.medicationProductId) {
    const product = await prisma.medicationProduct.findFirst({
      where: { id: item.medicationProductId, verificationStatus: { in: ["verified", "needs_review"] } }
    });
    if (!product) throw new BadRequestException("Medication product reference was not found or is not review-ready.");
    return {
      ...base,
      medicationProductId: product.id,
      drugMarketVariantId: null,
      medicationName: item.medicationName?.trim() || product.brandName || product.genericName,
      genericName: product.genericName,
      brandName: product.brandName,
      tradeName: product.brandName,
      strengthText: product.strengthText,
      dosageForm: product.dosageForm
    };
  }

  return base;
}

function hasJsonValue(value: unknown) {
  if (!value || value === Prisma.JsonNull) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function jsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null || value === Prisma.JsonNull) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function hint(type: string, severity: "low" | "medium" | "high", message: string, sourceId?: string) {
  return {
    id: `${type}:${sourceId ?? "patient"}`,
    type,
    severity,
    message,
    doctorFacingOnly: true,
    status: "active",
    sourceId
  };
}

function toDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function visitTypeDisplay(value: string) {
  const labels: Record<string, string> = {
    kashf: "كشف",
    recheck: "إعادة",
    consultation: "استشارة",
    urgent_kashf: "مستعجل"
  };
  return labels[value] ?? value;
}

function formatTime(value: Date) {
  return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

type DuplicatePatientRow = {
  id: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: Date | null;
  patientType: string;
  encounters: { createdAt: Date }[];
};

type DuplicateInput = { name: string; phone: string; dob: Date | null; age: number | null; mrn: string };

function scoreDuplicateCandidate(patient: DuplicatePatientRow, input: DuplicateInput) {
  const reasons: string[] = [];
  let score = 0;
  const patientName = normalizeName(`${patient.firstName} ${patient.lastName}`);
  const patientPhone = normalizePhone(patient.phone);
  const patientMrn = normalizeText(patient.medicalRecordNumber);
  const exactDob = Boolean(input.dob && patient.dateOfBirth && sameDate(input.dob, patient.dateOfBirth));
  const nameSimilarity = input.name && patientName ? similarity(input.name, patientName) : 0;

  if (input.phone && patientPhone && input.phone === patientPhone) { score += 100; reasons.push("PHONE_EXACT"); }
  if (input.mrn && patientMrn && input.mrn === patientMrn) { score += 110; reasons.push("MRN_EXACT"); }
  if (input.name && patientName && input.name === patientName) { score += 55; reasons.push("FULL_NAME_EXACT"); }
  else if ((input.name.length >= 3 && patientName.split(" ").some((part) => part.startsWith(input.name))) || (input.name.length >= 5 && patientName.includes(input.name))) { score += 40; reasons.push("NAME_PARTIAL"); }
  else if (nameSimilarity >= 0.78) { score += Math.round(45 * nameSimilarity); reasons.push("NAME_SIMILAR"); }
  if (exactDob) { score += 45; reasons.push("DOB_EXACT"); }
  const patientAge = ageAt(patient.dateOfBirth);
  if (!exactDob && input.age !== null && patientAge !== null && Math.abs(input.age - patientAge) <= 1) { score += 20; reasons.push("AGE_APPROXIMATE"); }

  const confidence = score >= 90 ? "HIGH" : score >= 55 ? "MEDIUM" : "LOW";
  return {
    patientId: patient.id,
    displayName: `${patient.firstName} ${patient.lastName}`.trim(),
    mrn: patient.medicalRecordNumber,
    phoneSuffix: patientPhone ? patientPhone.slice(-4) : null,
    ageSummary: patientAge === null ? null : `${patientAge} years`,
    patientType: patient.patientType,
    lastVisitDate: patient.encounters[0]?.createdAt.toISOString().slice(0, 10) ?? null,
    matchReasons: reasons,
    confidence,
    score
  };
}

function normalizeText(value?: string | null) {
  return String(value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function normalizeName(value?: string | null) {
  return normalizeText(value).normalize("NFKD").replace(/[^\p{L}\p{N} ]/gu, "");
}

function normalizePhone(value?: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function parseApproximateAge(value?: string) {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  const age = Number(value);
  return age >= 0 && age <= 120 ? age : null;
}

function ageAt(date: Date | null) {
  if (!date) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age -= 1;
  return age;
}

function sameDate(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function similarity(left: string, right: string) {
  const longest = Math.max(left.length, right.length);
  if (!longest) return 1;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0]!;
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex]!;
      previous[rightIndex] = Math.min(previous[rightIndex]! + 1, previous[rightIndex - 1]! + 1, diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return 1 - previous[right.length]! / longest;
}

function historySheetTagCodes(dto: PatientHistorySheetDto) {
  const text = [
    dto.pastMedicalHistory,
    dto.obstetricHistory,
    dto.gynecologicalHistory,
    dto.infertilityHistory,
    dto.notes
  ].map((value) => typeof value === "string" ? value : JSON.stringify(value ?? {})).join(" ").toLowerCase();
  return [
    ["diabetes", /diabetes|\bdm\b/],
    ["hypertension", /hypertension|\bhtn\b/],
    ["thyroid_disease", /thyroid/],
    ["asthma", /asthma/],
    ["anemia", /anemia|anaemia/],
    ["pcos", /\bpcos\b|polycystic/],
    ["endometriosis", /endometriosis/],
    ["recurrent_abortion", /recurrent abortion|recurrent miscarriage/],
    ["dilation_and_curettage", /dilation and curettage|dilatation and curettage|\bd&c\b|\bdnc\b/],
    ["mastectomy", /mastectomy/],
    ["previous_cesarean_section", /previous cs|previous cesarean|previous caesarean/]
  ].filter(([, pattern]) => (pattern as RegExp).test(text)).map(([code]) => code as string);
}

function operationTagCode(value: string) {
  const text = value.toLowerCase();
  if (/mastectomy/.test(text)) return "mastectomy";
  if (/dilation and curettage|dilatation and curettage|\bd&c\b|\bdnc\b/.test(text)) return "dilation_and_curettage";
  if (/cesarean|caesarean|\bcs\b|c-section/.test(text)) return "cesarean_section";
  if (/myomectomy/.test(text)) return "myomectomy";
  if (/hysteroscopy/.test(text)) return "hysteroscopy";
  if (/laparoscopy/.test(text)) return "laparoscopy";
  if (/ovarian cystectomy/.test(text)) return "ovarian_cystectomy";
  if (/hysterectomy/.test(text)) return "hysterectomy";
  if (/cerclage/.test(text)) return "cervical_cerclage";
  if (/appendectomy|appendicectomy/.test(text)) return "appendectomy";
  if (/cholecystectomy/.test(text)) return "cholecystectomy";
  if (/bariatric/.test(text)) return "bariatric_surgery";
  return null;
}
