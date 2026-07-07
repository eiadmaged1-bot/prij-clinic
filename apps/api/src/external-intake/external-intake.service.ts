import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PatientType, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { PrismaService } from "../prisma/prisma.service";
import { AttachSubmissionDto, CreatePatientFromSubmissionDto, GoogleFormIntakeDto, RejectSubmissionDto } from "./dto";

@Injectable()
export class ExternalIntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async receiveGoogleForm(dto: GoogleFormIntakeDto, token: string | undefined) {
    const expected = process.env.PRIJ_EXTERNAL_INTAKE_TOKEN;
    if (!expected || token !== expected) throw new UnauthorizedException("Invalid external intake token.");
    const rawAnswers = dto.rawAnswers && typeof dto.rawAnswers === "object" ? dto.rawAnswers : {};
    const mappedPatient = mapPatient(dto.patient ?? rawAnswers);
    const mappedCaseType = mapCaseType(String(dto.mappedCaseType?.patientType ? dto.mappedCaseType.patientType : mappedPatient.caseType ?? ""));
    const duplicateCandidates = await this.duplicates(mappedPatient);
    const submission = await this.prisma.externalPatientSubmission.create({
      data: {
        source: "google_form",
        language: dto.language === "en" ? "en" : "ar",
        externalSubmissionId: clean(dto.externalSubmissionId),
        submittedAt: parseOptionalDateTime(dto.submittedAt),
        rawAnswersJson: rawAnswers as Prisma.InputJsonValue,
        mappedPatientJson: mappedPatient as Prisma.InputJsonValue,
        mappedCaseTypeJson: mappedCaseType as Prisma.InputJsonValue,
        duplicateCandidatesJson: duplicateCandidates as Prisma.InputJsonValue,
        status: "pending_review"
      }
    });
    await this.audit.record({
      action: "external_intake.received",
      resourceType: "external_patient_submission",
      resourceId: submission.id,
      severity: "medium",
      metadataJson: { source: "google_form", pendingReview: true, duplicateCandidateCount: duplicateCandidates.length }
    });
    return { id: submission.id, status: submission.status, pendingReview: true };
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
