import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../../audit/audit.service";
import type { AuthUser } from "../../auth/auth.types";
import { PrismaService } from "../../prisma/prisma.service";
import { longitudinalComplaintsFromEncounters } from "../../complaints/complaint-lifecycle";

@Injectable()
export class PatientLookupService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async get(id: string, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException("Patient not found.");
    await this.audit.record({ actorUserId: user.id, action: "patient.read", resourceType: "patient", resourceId: patient.id, branchId: patient.branchId, severity: "medium" });
    return patient;
  }

  async workspaceSummary(id: string, user: AuthUser) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    const patient = await this.prisma.patient.findUnique({ where: { id }, select: {
      id: true, medicalRecordNumber: true, firstName: true, lastName: true, dateOfBirth: true, yearOfBirth: true, phone: true, patientType: true, branchId: true,
      clinicalPhases: { where: { status: "active" }, orderBy: { startDate: "desc" }, take: 1, select: { phaseType: true, title: true } },
      appointments: { where: { startAt: { gte: todayStart }, status: { in: ["booked", "rescheduled"] } }, orderBy: { startAt: "asc" }, take: 2, select: { id: true, startAt: true, status: true, appointmentType: true } },
      queueTickets: { where: { queueDate: { gte: todayStart, lt: todayEnd }, status: { in: ["waiting", "called", "in_room"] } }, orderBy: { checkedInAt: "desc" }, take: 1, select: { id: true, queueNumber: true, status: true, priority: true, visitType: true } },
      encounters: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, status: true, startedAt: true, createdAt: true, chiefComplaint: true, followUpJson: true } },
      pregnancies: { where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, estimatedDueDate: true, datingMethod: true, datingStatus: true, datingConfirmedAt: true, gravida: true, para: true, abortions: true, living: true, fetusCount: true } },
      patientAllergies: { where: { status: "active" }, take: 1, select: { id: true, updatedAt: true } },
      patientMedications: { where: { status: "active" }, take: 1, select: { id: true, updatedAt: true } },
      investigationResults: { where: { reviewStatus: "pending_review" }, take: 100, select: { id: true } },
      patientTasks: { where: { taskType: "schedule_follow_up", status: { in: ["open", "in_progress"] } }, orderBy: { dueAt: "asc" }, take: 1, select: { id: true, status: true, dueAt: true } },
      invoices: { where: { status: { in: ["draft", "issued", "partially_paid"] } }, orderBy: { createdAt: "desc" }, take: 1, select: { status: true, balanceAmount: true } }
    }});
    if (!patient) throw new NotFoundException("Patient not found.");
    const receptionistOnly = user.roles.some(role => ["Reception", "Receptionist"].includes(role)) && !user.roles.some(role => ["Owner", "Admin", "Doctor"].includes(role));
    const canReadFinance = user.permissions.some(permission => ["billing.read", "billing.manage", "billing.report"].includes(permission));
    const availableActions = [user.permissions.includes("patient.update") && "update-patient", user.permissions.includes("encounter.create") && "start-visit", user.permissions.includes("prescription.create") && "create-prescription", user.permissions.includes("investigation.create") && "create-request", user.permissions.includes("appointment.manage") && "book-follow-up", user.permissions.includes("billing.manage") && "create-invoice"].filter((action): action is string => Boolean(action));
    await this.audit.record({ actorUserId: user.id, action: "patient.workspace_summary_read", resourceType: "patient", resourceId: patient.id, branchId: patient.branchId, severity: "medium", metadataJson: { financeIncluded: canReadFinance, availableActionCount: availableActions.length } });
    const todayAppointment = patient.appointments.find(appointment => appointment.startAt < todayEnd) ?? null;
    const nextAppointment = patient.appointments.find(appointment => appointment.startAt >= todayEnd) ?? null;
    return {
      patient: { id: patient.id, displayName: `${patient.firstName} ${patient.lastName}`, medicalRecordNumber: patient.medicalRecordNumber, dateOfBirth: patient.dateOfBirth, yearOfBirth: patient.yearOfBirth, ageSummary: ageSummary(patient.dateOfBirth, patient.yearOfBirth, now), contactSummary: patient.phone ? `••••${patient.phone.replace(/\D/g, "").slice(-4)}` : null, patientType: patient.patientType },
      activeClinicalPhase: patient.clinicalPhases[0] ?? null, activePregnancy: patient.pregnancies[0] ?? null, todayAppointment, currentQueueTicket: patient.queueTickets[0] ?? null, activeVisit: patient.encounters[0] ?? null,
      allergyReviewState: receptionistOnly ? undefined : patient.patientAllergies.length ? "recorded" : "review_required",
      medicationReconciliationState: receptionistOnly ? undefined : patient.patientMedications.length ? "recorded" : "review_required",
      pendingResultCount: receptionistOnly ? undefined : patient.investigationResults.length, pendingFollowUp: patient.patientTasks[0] ?? null,
      balanceState: canReadFinance ? (patient.invoices[0] ? { status: patient.invoices[0].status, hasBalance: Number(patient.invoices[0].balanceAmount) > 0 } : { status: "clear", hasBalance: false }) : undefined,
      lastClinicalEvent: receptionistOnly ? undefined : patient.encounters[0] ? { type: "encounter", occurredAt: patient.encounters[0].startedAt ?? patient.encounters[0].createdAt, status: patient.encounters[0].status } : null,
      nextAppointment,
      availableActions,
      complaints: receptionistOnly ? undefined : longitudinalComplaintsFromEncounters(patient.encounters)
    };
  }
}

function ageSummary(date: Date | null, yearOfBirth: number | null, now: Date) {
  if (date) {
    let age = now.getUTCFullYear() - date.getUTCFullYear();
    if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age -= 1;
    return `${Math.max(age, 0)}y`;
  }
  if (!yearOfBirth || yearOfBirth < 1900 || yearOfBirth > now.getUTCFullYear()) return null;
  return `${Math.max(now.getUTCFullYear() - yearOfBirth, 0)}y`;
}
