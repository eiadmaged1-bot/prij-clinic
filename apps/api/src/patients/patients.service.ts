import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import {
  assertCanReferenceAppointment,
  assertCanReferenceEncounter,
  assertCanReferenceInvestigationOrder,
  assertCanReferenceInvoice,
  assertCanReferencePregnancy,
  assertCanReferenceUserInBranch
} from "../auth/reference-scope";
import { branchScope, doctorScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePatientDto,
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
  UpdatePatientDto
} from "./dto";

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreatePatientDto, user: AuthUser) {
    const branchId = await this.resolveBranchId(user);

    try {
      const patient = await this.prisma.patient.create({
        data: {
          branchId,
          medicalRecordNumber: dto.medicalRecordNumber.trim(),
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          sex: dto.sex?.trim() || null,
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
        metadataJson: { changedFields: Object.keys(dto), medicalRecordNumber: patient.medicalRecordNumber }
      });

      return patient;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("Medical record number already exists.");
      }

      throw error;
    }
  }

  async list(user: AuthUser) {
    const patients = await this.prisma.patient.findMany({
      where: branchScope(user),
      orderBy: [{ createdAt: "desc" }],
      take: 100
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.list_read",
      resourceType: "patient",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: patients.length }
    });

    return patients;
  }

  async get(id: string, user: AuthUser) {
    const patient = await this.prisma.patient.findFirst({ where: { id, ...branchScope(user) } });

    if (!patient) {
      throw new NotFoundException("Patient not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.read",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium"
    });

    return patient;
  }

  async timeline(id: string, user: AuthUser) {
    const patient = await this.get(id, user);
    const [
      appointments,
      queueTickets,
      encounters,
      prescriptions,
      investigationOrders,
      reports,
      pregnancies,
      previousPregnancies,
      pregnancyFetuses,
      antenatalVisits,
      obUltrasounds,
      invoices,
      payments,
      consentRecords
    ] = await Promise.all([
      this.prisma.appointment.findMany({ where: { patientId: id, ...branchScope(user) }, include: { doctor: true } }),
      this.prisma.queueTicket.findMany({ where: { patientId: id, ...branchScope(user) } }),
      this.prisma.encounter.findMany({ where: { patientId: id, ...doctorScope(user) }, include: { doctor: true, signedByUser: true } }),
      this.prisma.prescription.findMany({ where: { patientId: id, ...doctorScope(user) }, include: { doctor: true, items: true } }),
      this.prisma.investigationOrder.findMany({ where: { patientId: id, ...doctorScope(user) }, include: { items: true, doctor: true } }),
      this.prisma.report.findMany({ where: { patientId: id, ...branchScope(user) }, include: { uploadedByUser: true, reviewedByUser: true } }),
      this.prisma.pregnancy.findMany({ where: { patientId: id, ...branchScope(user) }, include: { fetuses: true } }),
      this.prisma.previousPregnancy.findMany({ where: { patientId: id, patient: branchScope(user) } }),
      this.prisma.pregnancyFetus.findMany({ where: { pregnancy: { patientId: id, ...branchScope(user) } } }),
      this.prisma.antenatalVisit.findMany({ where: { patientId: id, ...branchScope(user) } }),
      this.prisma.obUltrasound.findMany({ where: { patientId: id, ...branchScope(user) }, include: { reviewedByUser: true } }),
      this.prisma.invoice.findMany({ where: { patientId: id, ...branchScope(user) }, include: { createdByUser: true } }),
      this.prisma.payment.findMany({ where: { patientId: id, ...branchScope(user) }, include: { recordedByUser: true } }),
      this.prisma.consentRecord.findMany({ where: { patientId: id }, include: { capturedByUser: true } })
    ]);

    const items = [
      timelineItem(patient.createdAt, "patient", "Patient file created", patient.status, `MRN ${patient.medicalRecordNumber}`, patient.createdByUserId ? "Staff member" : undefined, `/patients/${patient.id}`),
      ...appointments.map((item) => timelineItem(item.startAt, "appointment", "Appointment booked", item.status, item.appointmentType ?? "Clinic appointment", item.doctor?.displayName, "/appointments")),
      ...queueTickets.map((item) => timelineItem(item.checkedInAt, "queue", "Checked in to queue", item.status, `Queue ${item.queueNumber}`, undefined, "/queue")),
      ...encounters.map((item) => timelineItem(item.createdAt, "encounter", item.status === "signed" ? "Visit note signed" : "Visit note started", item.status, item.chiefComplaint ?? "Doctor visit note", item.doctor.displayName, "/encounters")),
      ...prescriptions.map((item) => timelineItem(item.createdAt, "prescription", "Prescription created", item.status, `${item.items.length} medicine item(s)`, item.doctor.displayName, "/prescriptions")),
      ...investigationOrders.map((item) => timelineItem(item.createdAt, "investigation", "Investigation ordered", item.status, item.items.map((orderItem) => orderItem.testName).join(", ") || "Investigation order", item.doctor.displayName, "/investigations")),
      ...reports.map((item) => timelineItem(item.createdAt, "report", "Report created", item.status, item.title, item.uploadedByUser?.displayName, "/reports")),
      ...pregnancies.map((item) => timelineItem(item.createdAt, "pregnancy", "Pregnancy episode recorded", item.status, `${item.fetuses.length || 1} fetus record(s)`, undefined, "/pregnancies")),
      ...previousPregnancies.map((item) => timelineItem(item.createdAt, "previous_pregnancy", "Previous pregnancy history recorded", "recorded", item.outcome, undefined, "/pregnancies")),
      ...pregnancyFetuses.map((item) => timelineItem(item.createdAt, "pregnancy_fetus", "Fetus record created", item.status, item.label, undefined, "/pregnancies")),
      ...pregnancyFetuses.map((item) => timelineItem(item.updatedAt, "pregnancy_fetus", "Fetus record updated", item.status, item.label, undefined, "/pregnancies")),
      ...antenatalVisits.map((item) => timelineItem(item.visitDate, "antenatal_visit", "Antenatal visit recorded", "recorded", item.gestationalAgeDisplay ?? "Pregnancy follow-up", undefined, "/pregnancies")),
      ...obUltrasounds.map((item) => timelineItem(item.performedAt, "ultrasound", item.status === "draft" ? "Ultrasound draft recorded" : "Ultrasound study recorded", item.status, item.scanType ?? "Recording only; clinician interpretation required", item.reviewedByUser?.displayName, "/ultrasound")),
      ...invoices.map((item) => timelineItem(item.createdAt, "invoice", "Invoice created", item.status, `Balance ${item.balanceAmount.toString()}`, item.createdByUser?.displayName, "/billing")),
      ...payments.map((item) => timelineItem(item.paidAt, "payment", "Payment recorded", item.status, `${item.method} ${item.amount.toString()}`, item.recordedByUser?.displayName, "/billing")),
      ...consentRecords.map((item) => timelineItem(item.capturedAt, "consent", "Consent recorded", item.status, item.consentType.replaceAll("_", " "), item.capturedByUser?.displayName, "/consents"))
    ].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.timeline_read",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { count: items.length }
    });

    return { patientId: patient.id, items };
  }

  async update(id: string, dto: UpdatePatientDto, user: AuthUser) {
    await this.get(id, user);
    const data: Prisma.PatientUpdateInput = {};
    const changedFields = Object.keys(dto);

    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.sex !== undefined) data.sex = dto.sex?.trim() || null;
    if (dto.phone !== undefined) data.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email?.trim().toLowerCase() || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;

    const patient = await this.prisma.patient.update({ where: { id }, data });

    await this.audit.record({
      actorUserId: user.id,
      action: "patient.updated",
      resourceType: "patient",
      resourceId: patient.id,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { changedFields }
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
    const queueNumber = await this.nextQueueNumber(branchId);
    const ticket = await this.prisma.queueTicket.create({
      data: { branchId, patientId: id, appointmentId: dto.appointmentId ?? null, queueNumber },
      include: { patient: true, appointment: true }
    });
    await this.audit.record({ actorUserId: user.id, action: "queue.checked_in", resourceType: "queue_ticket", resourceId: ticket.id, branchId, severity: "medium", metadataJson: { patientId: id, queueNumber, source: "patient_file" } });
    return ticket;
  }

  async createEncounter(id: string, dto: PatientContextEncounterDto, user: AuthUser) {
    await this.get(id, user);
    await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, { patientId: id, requireDoctorScope: true });
    const encounter = await this.prisma.encounter.create({
      data: {
        patientId: id,
        appointmentId: dto.appointmentId ?? null,
        doctorId: user.id,
        chiefComplaint: clean(dto.chiefComplaint),
        historyText: clean(dto.historyText),
        examText: clean(dto.examText),
        assessmentText: clean(dto.assessmentText),
        planText: clean(dto.planText)
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "encounter.created", resourceType: "encounter", resourceId: encounter.id, severity: "high", metadataJson: { patientId: id, source: "patient_file" } });
    return encounter;
  }

  async createPrescription(id: string, dto: PatientContextPrescriptionDto, user: AuthUser) {
    await this.get(id, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: id, requireDoctorScope: true });
    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: id,
        encounterId: dto.encounterId ?? null,
        doctorId: user.id,
        notes: clean(dto.notes),
        items: { create: dto.items.map((item) => ({ medicationName: item.medicationName.trim(), dose: clean(item.dose), frequency: clean(item.frequency), instructions: clean(item.instructions) })) }
      },
      include: { items: true, patient: true, encounter: true }
    });
    await this.audit.record({ actorUserId: user.id, action: "prescription.created", resourceType: "prescription", resourceId: prescription.id, severity: "high", metadataJson: { patientId: id, itemCount: prescription.items.length, source: "patient_file" } });
    return prescription;
  }

  async createInvestigation(id: string, dto: PatientContextInvestigationDto, user: AuthUser) {
    await this.get(id, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, { patientId: id, requireDoctorScope: true });
    const order = await this.prisma.investigationOrder.create({
      data: {
        patientId: id,
        encounterId: dto.encounterId ?? null,
        doctorId: user.id,
        priority: dto.priority ?? "routine",
        notes: clean(dto.notes),
        items: { create: dto.items.map((item) => ({ category: item.category, testName: item.testName.trim(), instructions: clean(item.instructions) })) }
      },
      include: { items: true, patient: true, encounter: true }
    });
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
    assertDiscountAllowed(dto.discountAmount ?? 0, dto.discountReason, user);
    const items = await resolvePatientInvoiceItems(this.prisma, dto.items);
    const totals = calculateTotals(items, dto.discountAmount ?? 0, 0);
    const invoice = await this.prisma.invoice.create({
      data: {
        patientId: id,
        branchId: patient.branchId,
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
        data: { invoiceId: invoice.id, patientId: id, branchId: invoice.branchId, method: dto.method, amount: paymentAmount, referenceNote: clean(dto.referenceNote), recordedByUserId: user.id },
        include: { invoice: true, patient: true }
      });
      await tx.invoice.update({ where: { id: invoice.id }, data: paymentRollup(invoice.totalAmount, invoice.amountPaid.add(paymentAmount)) });
      return created;
    });
    await this.audit.record({ actorUserId: user.id, action: "payment.recorded", resourceType: "payment", resourceId: payment.id, branchId: payment.branchId, severity: "high", metadataJson: { patientId: id, invoiceId: invoice.id, amount: payment.amount.toString(), source: "patient_file" } });
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

  private async nextQueueNumber(branchId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const latest = await this.prisma.queueTicket.findFirst({
      where: { branchId, checkedInAt: { gte: start, lt: end } },
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
}

function timelineItem(dateTime: Date, type: string, title: string, status: string, description: string, actor?: string, href?: string) {
  return { dateTime: dateTime.toISOString(), type, title, status, description, actor, href };
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
  const unitAmount = money(item.unitAmount);
  return {
    serviceItemId: item.serviceItemId ?? null,
    description: item.description,
    quantity: item.quantity,
    unitAmount,
    lineAmount: unitAmount.mul(item.quantity)
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

function toDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
