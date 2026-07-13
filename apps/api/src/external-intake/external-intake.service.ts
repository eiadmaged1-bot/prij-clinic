import { BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { PatientType, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { PrismaService } from "../prisma/prisma.service";
import { AttachSubmissionDto, CreatePatientFromSubmissionDto, GoogleFormIntakeDto, RejectSubmissionDto, RequestCorrectionDto } from "./dto";

@Injectable()
export class ExternalIntakeService {
  private readonly rateWindows = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async receiveGoogleForm(dto: GoogleFormIntakeDto, request: ExternalIntakeRequest) {
    this.enforceRateLimit(request.remoteAddress);
    await this.verifySignature(request);
    const validation = validateGoogleFormPayload(dto);
    if (Object.keys(validation.fieldErrors).length) {
      await this.audit.record({ action: "external_intake.validation_rejected", resourceType: "external_patient_submission", severity: "medium", metadataJson: { errorFields: Object.keys(validation.fieldErrors) } });
      throw new BadRequestException({ message: "The intake submission contains invalid fields.", fieldErrors: validation.fieldErrors });
    }
    const payloadHash = createHash("sha256").update(request.rawBody!).digest("hex");
    const existing = await this.prisma.externalPatientSubmission.findUnique({ where: { externalSubmissionId: dto.submissionId.trim() } });
    if (existing) {
      if (existing.payloadHash === payloadHash) {
        await this.audit.record({ action: "external_intake.duplicate_received", resourceType: "external_patient_submission", resourceId: existing.id, severity: "medium", metadataJson: { idempotent: true } });
        return { httpStatus: 200, body: { intakeId: existing.id, status: existing.status, duplicate: true } };
      }
      await this.audit.record({ action: "external_intake.conflicting_duplicate_rejected", resourceType: "external_patient_submission", resourceId: existing.id, severity: "high", metadataJson: { idempotent: false } });
      throw new ConflictException({ message: "This submission ID was already received with different content." });
    }
    if (request.dryRun) {
      await this.audit.record({ action: "external_intake.dry_run_validated", resourceType: "external_patient_submission", severity: "medium", metadataJson: { valid: true } });
      return { httpStatus: 200, body: { status: "validated", duplicate: false, dryRun: true } };
    }
    const mappedPatient = {
      fullName: dto.fullName.trim(),
      phone: validation.primaryPhone,
      secondaryPhone: validation.secondaryPhone,
      address: clean(dto.addressText),
      husbandName: clean(dto.spouseName),
      dateOfBirth: clean(dto.birthValue),
      caseType: validation.followUpType
    };
    const mappedCaseType = mapCaseType(validation.followUpType);
    const duplicateCandidates = await this.duplicates(mappedPatient);
    let submission;
    try {
      submission = await this.prisma.externalPatientSubmission.create({
        data: {
          source: "google_form",
          language: /[\u0600-\u06ff]/.test(dto.fullName) ? "ar" : "en",
          externalSubmissionId: dto.submissionId.trim(),
          payloadHash,
          submittedAt: new Date(dto.submittedAt),
          rawAnswersJson: dto as unknown as Prisma.InputJsonValue,
          mappedPatientJson: mappedPatient as Prisma.InputJsonValue,
          mappedCaseTypeJson: mappedCaseType as Prisma.InputJsonValue,
          duplicateCandidatesJson: duplicateCandidates as Prisma.InputJsonValue,
          status: "pending_review"
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException({ message: "This submission ID is already being processed." });
      }
      throw error;
    }
    await this.audit.record({
      action: "external_intake.received",
      resourceType: "external_patient_submission",
      resourceId: submission.id,
      severity: "medium",
      metadataJson: { source: "google_form", pendingReview: true, duplicateCandidateCount: duplicateCandidates.length }
    });
    return { httpStatus: 201, body: { intakeId: submission.id, status: submission.status, duplicate: false } };
  }

  private async verifySignature(request: ExternalIntakeRequest) {
    const secret = process.env.PRIJ_EXTERNAL_INTAKE_SECRET;
    if (!secret) throw new ForbiddenException("External intake is not configured.");
    if (!request.timestamp || !request.signature || !request.rawBody) {
      await this.audit.record({ action: "external_intake.authentication_rejected", resourceType: "external_patient_submission", severity: "high", metadataJson: { reason: "missing_headers" } });
      throw new UnauthorizedException("Valid intake authentication headers are required.");
    }
    const seconds = Number(request.timestamp);
    const maxSkew = Number(process.env.PRIJ_EXTERNAL_INTAKE_MAX_SKEW_SECONDS ?? 300);
    if (!Number.isInteger(seconds) || Math.abs(Math.floor(Date.now() / 1000) - seconds) > maxSkew) {
      await this.audit.record({ action: "external_intake.expired_timestamp_rejected", resourceType: "external_patient_submission", severity: "high" });
      throw new UnauthorizedException("The intake request timestamp is invalid or expired.");
    }
    const canonical = `${request.timestamp}.${request.rawBody.toString("utf8")}`;
    const expected = createHmac("sha256", secret).update(canonical).digest("hex");
    const supplied = request.signature.startsWith("sha256=") ? request.signature.slice(7) : request.signature;
    const expectedBuffer = Buffer.from(expected, "hex");
    const suppliedBuffer = /^[a-f0-9]{64}$/i.test(supplied) ? Buffer.from(supplied, "hex") : Buffer.alloc(0);
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      await this.audit.record({ action: "external_intake.signature_rejected", resourceType: "external_patient_submission", severity: "high" });
      throw new ForbiddenException("The intake request signature is invalid.");
    }
    const nonceHash = createHash("sha256").update(`${request.timestamp}.${supplied}`).digest("hex");
    await this.prisma.externalIntakeReplayNonce.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    try {
      await this.prisma.externalIntakeReplayNonce.create({ data: { nonceHash, expiresAt: new Date((seconds + maxSkew * 2) * 1000) } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        await this.audit.record({ action: "external_intake.replay_rejected", resourceType: "external_patient_submission", severity: "high" });
        throw new ForbiddenException("This intake request was already received.");
      }
      throw error;
    }
  }

  private enforceRateLimit(remoteAddress?: string) {
    const key = createHash("sha256").update(remoteAddress || "unknown").digest("hex");
    const now = Date.now();
    const limit = Number(process.env.PRIJ_EXTERNAL_INTAKE_RATE_LIMIT_PER_MINUTE ?? 60);
    const current = this.rateWindows.get(key);
    if (!current || current.resetAt <= now) { this.rateWindows.set(key, { count: 1, resetAt: now + 60_000 }); return; }
    current.count += 1;
    if (current.count > limit) throw new HttpException("Too many intake requests. Retry later.", 429);
  }

  async list(user: AuthUser, status = "pending_review") {
    this.assertReviewer(user);
    return this.prisma.externalPatientSubmission.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { receivedAt: "desc" },
      take: 100
    });
  }

  async get(id: string, user: AuthUser) {
    this.assertReviewer(user);
    const submission = await this.prisma.externalPatientSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException("External intake submission not found.");
    return submission;
  }

  async createPatient(id: string, dto: CreatePatientFromSubmissionDto, user: AuthUser) {
    this.assertReviewer(user);
    const submission = await this.getPending(id, user);
    const mapped = objectValue(submission.mappedPatientJson);
    const caseType = objectValue(submission.mappedCaseTypeJson);
    const fullName = clean(String(mapped.fullName ?? ""));
    if (!fullName) throw new BadRequestException("Full name is required before creating a patient.");
    const [firstName = "External", ...rest] = fullName.split(/\s+/);
    const patient = await this.prisma.patient.create({
      data: {
        branchId: user.branchId,
        medicalRecordNumber: await this.nextExternalMrn(),
        firstName,
        lastName: rest.join(" ") || "External",
        dateOfBirth: parseDateOrNull(String(mapped.dateOfBirth ?? "")),
        sex: "female",
        patientType: safePatientType(String(caseType.patientType ?? "WOMEN_HEALTH")),
        phone: clean(String(mapped.phone ?? "")),
        notes: clean(`External intake reviewed. ${String(mapped.notes ?? "")}`),
        createdByUserId: user.id
      }
    });
    if (dto.createInitialPhase && caseType.suggestedPhase) {
      await this.prisma.patientClinicalPhase.create({
        data: {
          patientId: patient.id,
          phaseType: safePhase(String(caseType.suggestedPhase)),
          title: phaseTitle(String(caseType.suggestedPhase)),
          startDate: new Date(),
          summaryJson: { sourceSubmissionId: id, draftOnly: true },
          notes: clean(String(mapped.mainComplaint ?? "")),
          createdByUserId: user.id
        }
      });
    }
    const updated = await this.prisma.externalPatientSubmission.update({
      where: { id },
      data: { status: "approved", reviewedByUserId: user.id, reviewedAt: new Date(), reviewDecision: "created_patient", reviewReason: clean(dto.reviewReason), createdPatientId: patient.id }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "external_intake.patient_created_after_review",
      resourceType: "external_patient_submission",
      resourceId: id,
      branchId: patient.branchId,
      severity: "high",
      reason: dto.reviewReason,
      metadataJson: { patientId: patient.id, pendingReviewResolved: true }
    });
    return { submission: updated, patient };
  }

  async attach(id: string, dto: AttachSubmissionDto, user: AuthUser) {
    this.assertReviewer(user);
    const submission = await this.getPending(id, user);
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const updated = await this.prisma.externalPatientSubmission.update({
      where: { id },
      data: { status: "attached_to_existing_patient", reviewedByUserId: user.id, reviewedAt: new Date(), reviewDecision: "attached_to_existing_patient", reviewReason: clean(dto.reviewReason), attachedPatientId: patient.id }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "external_intake.attached_after_review",
      resourceType: "external_patient_submission",
      resourceId: id,
      branchId: patient.branchId,
      severity: "high",
      reason: dto.reviewReason,
      metadataJson: { patientId: patient.id, noBlindOverwrite: true, selectedFields: dto.selectedFields ?? {} }
    });
    return { submission: updated, patient };
  }

  async reject(id: string, dto: RejectSubmissionDto, user: AuthUser) {
    this.assertReviewer(user);
    if (!dto.reason?.trim()) throw new BadRequestException("Reject/archive reason is required.");
    await this.get(id, user);
    const updated = await this.prisma.externalPatientSubmission.update({
      where: { id },
      data: { status: "rejected", reviewedByUserId: user.id, reviewedAt: new Date(), reviewDecision: "rejected", reviewReason: dto.reason.trim() }
    });
    await this.audit.record({ actorUserId: user.id, action: "external_intake.rejected", resourceType: "external_patient_submission", resourceId: id, branchId: user.branchId, severity: "high", reason: dto.reason.trim() });
    return updated;
  }

  async requestCorrection(id: string, dto: RequestCorrectionDto, user: AuthUser) {
    this.assertReviewer(user);
    if (!dto.reason?.trim()) throw new BadRequestException("A correction request reason is required.");
    await this.getPending(id, user);
    const updated = await this.prisma.externalPatientSubmission.update({ where: { id }, data: { status: "correction_requested", reviewedByUserId: user.id, reviewedAt: new Date(), reviewDecision: "request_correction", reviewReason: dto.reason.trim() } });
    await this.audit.record({ actorUserId: user.id, action: "external_intake.correction_requested", resourceType: "external_patient_submission", resourceId: id, branchId: user.branchId, severity: "high", reason: dto.reason.trim() });
    return updated;
  }

  private async getPending(id: string, user: AuthUser) {
    const submission = await this.get(id, user);
    if (submission.status !== "pending_review") throw new BadRequestException("Only pending submissions can be reviewed.");
    return submission;
  }

  private assertReviewer(user: AuthUser) {
    if (!user.roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role))) {
      throw new ForbiddenException("External intake review is restricted to Owner, Admin, and Doctor roles.");
    }
  }

  private async duplicates(mapped: Record<string, unknown>) {
    const phone = clean(String(mapped.phone ?? ""));
    const fullName = clean(String(mapped.fullName ?? ""));
    const birth = parseDateOrNull(String(mapped.dateOfBirth ?? ""));
    const candidates = await this.prisma.patient.findMany({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          ...(fullName ? [{ firstName: { contains: fullName.split(/\s+/)[0], mode: "insensitive" as const } }] : []),
          ...(birth ? [{ dateOfBirth: birth }] : [])
        ]
      },
      select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true, phone: true, dateOfBirth: true },
      take: 10
    });
    return candidates.map((item) => ({ id: item.id, mrn: item.medicalRecordNumber, name: `${item.firstName} ${item.lastName}`.trim(), phone: item.phone, dateOfBirth: item.dateOfBirth }));
  }

  private async nextExternalMrn() {
    const count = await this.prisma.patient.count();
    return `EXT-${new Date().getUTCFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }
}

function mapPatient(source: Record<string, unknown>) {
  const get = (...keys: string[]) => keys.map((key) => clean(String(source[key] ?? ""))).find(Boolean) ?? null;
  const dateOfBirth = get("dateOfBirth", "تاريخ الميلاد", "سنة الميلاد", "Date of birth");
  return {
    fullName: get("fullName", "الاسم بالكامل", "Full name"),
    phone: get("phone", "رقم الهاتف", "Phone number"),
    address: get("address", "محل الإقامة", "محل الإقامة / العنوان", "العنوان", "Address"),
    husbandName: get("husbandName", "اسم الزوج", "Husband name"),
    dateOfBirth,
    caseType: get("caseType", "نوع المتابعة", "Case type"),
    mainComplaint: get("mainComplaint", "الشكوى الأساسية", "Main complaint"),
    notes: get("notes", "ملاحظات إضافية", "Notes")
  };
}

function mapCaseType(value: string) {
  if (value === "متابعة حمل" || /ob|preg|حمل/i.test(value)) return { patientType: "OB", suggestedPhase: "pregnancy" };
  if (value === "تأخر حمل" || /infertility|fertility|تأخر/i.test(value)) return { patientType: "INFERTILITY", suggestedPhase: "infertility" };
  if (value === "شكوى نساء" || /gyn|gyne|نساء/i.test(value)) return { patientType: "GYN", suggestedPhase: "gynecology" };
  return { patientType: "WOMEN_HEALTH", suggestedPhase: "general_review" };
}

function clean(value?: string | null) {
  return value?.trim() || null;
}

function parseOptionalDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateOrNull(value?: string) {
  if (!value) return null;
  if (/^\d{4}$/.test(value.trim())) return new Date(`${value.trim()}-01-01T00:00:00.000Z`);
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safePatientType(value: string): PatientType {
  return ["OB", "GYN", "INFERTILITY", "WOMEN_HEALTH", "GENERAL"].includes(value) ? value as PatientType : "WOMEN_HEALTH";
}

function safePhase(value: string) {
  if (["pregnancy", "infertility", "gynecology", "general"].includes(value)) return value as never;
  return "general" as never;
}

function phaseTitle(value: string) {
  if (value === "pregnancy") return "External intake pregnancy review";
  if (value === "infertility") return "External intake infertility review";
  if (value === "gynecology") return "External intake gynecology review";
  return "External intake general review";
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

type ExternalIntakeRequest = {
  timestamp?: string;
  signature?: string;
  rawBody?: Buffer;
  dryRun: boolean;
  remoteAddress?: string;
};

function validateGoogleFormPayload(dto: GoogleFormIntakeDto) {
  const fieldErrors: Record<string, string> = {};
  const submissionId = dto.submissionId?.trim();
  if (!submissionId || !/^[A-Za-z0-9._:-]{6,200}$/.test(submissionId)) fieldErrors.submissionId = "A stable submission ID is required.";
  const submittedAt = new Date(dto.submittedAt);
  const submissionSkewSeconds = Number(process.env.PRIJ_EXTERNAL_INTAKE_SUBMISSION_MAX_AGE_SECONDS ?? 900);
  if (!dto.submittedAt || Number.isNaN(submittedAt.getTime()) || Math.abs(Date.now() - submittedAt.getTime()) > submissionSkewSeconds * 1000) fieldErrors.submittedAt = "A valid recent ISO-8601 submission time is required.";
  if (!dto.fullName?.trim() || dto.fullName.trim().length < 2) fieldErrors.fullName = "Full name is required.";
  const primaryPhone = normalizePhone(dto.primaryPhone);
  if (!primaryPhone) fieldErrors.primaryPhone = "Enter a valid phone number without email or text.";
  const secondaryPhone = dto.secondaryPhone?.trim() ? normalizePhone(dto.secondaryPhone) : null;
  if (dto.secondaryPhone?.trim() && !secondaryPhone) fieldErrors.secondaryPhone = "Enter a valid secondary phone number.";
  if (dto.birthValue?.trim() && !parseSupportedBirth(dto.birthValue)) fieldErrors.birthValue = "Use a supported birth year or ISO date.";
  const followUpType = approvedFollowUpType(dto.followUpType);
  if (!followUpType) fieldErrors.followUpType = "Choose an approved follow-up type.";
  return { fieldErrors, primaryPhone, secondaryPhone, followUpType: followUpType ?? "" };
}

function normalizePhone(value?: string) {
  const input = value?.trim() ?? "";
  if (!input || /[@A-Za-z]/.test(input)) return null;
  let normalized = input.replace(/[\s().-]/g, "");
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`;
  if (!/^\+?\d{8,15}$/.test(normalized)) return null;
  return normalized;
}

function parseSupportedBirth(value: string) {
  const input = value.trim();
  const currentYear = new Date().getUTCFullYear();
  if (/^\d{4}$/.test(input)) { const year = Number(input); return year >= 1900 && year <= currentYear; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const date = new Date(`${input}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === input && date.getUTCFullYear() >= 1900 && date <= new Date();
}

function approvedFollowUpType(value?: string) {
  const key = value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
  const mapping: Record<string, string> = {
    pregnancy: "pregnancy",
    obstetric: "pregnancy",
    antenatal: "pregnancy",
    gynecology: "gynecology",
    gynaecology: "gynecology",
    gyn: "gynecology",
    infertility: "infertility",
    fertility: "infertility",
    follow_up: "general_review",
    general: "general_review",
    women_health: "general_review",
    "متابعة_حمل": "pregnancy",
    "شكوى_نساء": "gynecology",
    "تأخر_حمل": "infertility",
    "متابعة_عامة": "general_review"
  };
  return mapping[key] ?? null;
}
