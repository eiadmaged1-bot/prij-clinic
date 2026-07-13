import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceAppointment, assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CheckInDto, QueueCancelDto } from "./dto";
import { ClinicTimeService } from "../clinic-time/clinic-time.service";

import { IdempotencyService } from "../idempotency/idempotency.service";

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
    private readonly clinicTime: ClinicTimeService
  ) {}

  async checkIn(dto: CheckInDto, user: AuthUser, idempotencyKey?: string) {
    if (!idempotencyKey?.trim()) {
      return this.prisma.$transaction(tx => this.checkInWithoutIdempotency(tx, dto, user));
    }

    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const branchId = patient.branchId ?? (await this.resolveBranchId(user));

    const idempotency = await this.idempotency.beginOrReplay({
      userId: user.id,
      branchId,
      operation: "queue.checkIn",
      rawKey: idempotencyKey,
      requestPayload: dto
    });

    if (idempotency.isReplay) {
      if (!idempotency.resourceId) {
        throw new BadRequestException("Queue check-in is still in progress.");
      }
      return this.prisma.queueTicket.findUnique({ where: { id: idempotency.resourceId }, include: { patient: true, appointment: true } });
    }

    try {
      const ticket = await this.prisma.$transaction(async (tx) => {
        const t = await this.checkInWithoutIdempotency(tx, dto, user, patient, branchId);
        await this.idempotency.complete({
          tx,
          recordId: idempotency.recordId,
          responseStatus: 201,
          resourceType: "queueTicket",
          resourceId: t.id
        });
        return t;
      });
      return ticket;
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

  private async checkInWithoutIdempotency(tx: Prisma.TransactionClient, dto: CheckInDto, user: AuthUser, preloadedPatient?: any, preloadedBranchId?: string) {
    const visitType = dto.visitType ?? "kashf";

    const patient = preloadedPatient || await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const branchId = preloadedBranchId ?? patient.branchId ?? (await this.resolveBranchId(user));

    if (dto.appointmentId) {
      const appointment = await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, {
        patientId: patient.id
      });

      if (!appointment || appointment.branchId !== branchId) {
        throw new BadRequestException("Appointment does not match the selected patient and branch.");
      }
    }

    const checkedInAt = new Date();
    const dateString = this.clinicTime.getClinicDate(checkedInAt);
    const { start: queueDate } = this.clinicTime.getClinicDayBounds(dateString);

    const activeTicket = await tx.queueTicket.findFirst({
      where: {
        branchId,
        patientId: dto.patientId,
        queueDate,
        status: { in: ["waiting", "called"] }
      },
      orderBy: { queueNumber: "asc" },
      include: { patient: true, appointment: true }
    });

    if (activeTicket) {
      if (dto.appointmentId && activeTicket.appointmentId === dto.appointmentId) {
        return activeTicket;
      }
      throw new BadRequestException(activeTicket.status === "called" ? "Patient is already with doctor." : "Already in queue - Position $");
    }

    let ticket;
    try {
      const counter = await tx.queueDayCounter.upsert({
        where: { branchId_queueDate: { branchId, queueDate } },
        create: { branchId, queueDate, nextNumber: 2 },
        update: { nextNumber: { increment: 1 } }
      });
      // the upsert returns the value AFTER increment, so we subtract 1 for this ticket
      // if it was created as 2, then we are number 1
      const queueNumber = counter.nextNumber - 1;

      ticket = await tx.queueTicket.create({
        data: {
          branchId,
          patientId: dto.patientId,
          appointmentId: dto.appointmentId ?? null,
          queueNumber,
          queueDate,
          checkedInAt,
          priority: dto.priority ?? "routine",
          visitType,
          checkInMethod: dto.checkInMethod?.trim() || "Returning Patient",
          receptionistUserId: user.id,
          receptionistDisplayNameSnapshot: user.displayName || user.loginId || user.email || "Reception"
        },
        include: { patient: true, appointment: true }
      });

      // Create ActiveQueueTicketLock
      await tx.activeQueueTicketLock.create({
        data: {
          branchId,
          patientId: dto.patientId,
          queueDate,
          queueTicketId: ticket.id
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestException("Referenced patient or appointment was not found.");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException({ code: "QUEUE_ACTIVE_TICKET_EXISTS", message: "Patient already has an active ticket today." });
      }

      throw error;
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "queue.checked_in",
      resourceType: "queue_ticket",
      resourceId: ticket.id,
      branchId,
      severity: "medium",
      metadataJson: {
        patientId: dto.patientId,
        appointmentId: dto.appointmentId ?? null,
        queueNumber: ticket.queueNumber,
        queueDate: dateString,
        visitType,
        checkInMethod: ticket.checkInMethod,
        receptionistUserId: ticket.receptionistUserId,
        receptionistDisplayNameSnapshot: ticket.receptionistDisplayNameSnapshot
      }
    });

    if (visitType === "urgent_kashf") {
      await this.audit.record({
        actorUserId: user.id,
        action: "queue.urgent_priority_assigned",
        resourceType: "queue_ticket",
        resourceId: ticket.id,
        branchId,
        severity: "medium",
        metadataJson: { patientId: dto.patientId, queueNumber: ticket.queueNumber, visitType }
      });
    }

    return ticket;
  }

  async today(user: AuthUser) {
    const dateString = this.clinicTime.getClinicDate();
    const { start: queueDate } = this.clinicTime.getClinicDayBounds(dateString);

    const tickets = await this.prisma.queueTicket.findMany({
      where: { queueDate, ...branchScope(user), patient: { NOT: demoPatientWhere() } },
      orderBy: { queueNumber: "asc" },
      include: { patient: true, appointment: true }
    });

    return tickets.sort((left, right) => queueSortRank(left) - queueSortRank(right) || left.queueNumber - right.queueNumber);
  }

  async call(id: string, user: AuthUser) {
    return this.transition(id, user, "queue.called", { status: "called", calledAt: new Date() }, "waiting");
  }

  async selectForDoctor(id: string, user: AuthUser) {
    return this.transition(id, user, "doctor_queue.patient_selected", { status: "called", calledAt: new Date() }, "waiting");
  }

  async complete(id: string, user: AuthUser) {
    return this.transition(id, user, "queue.completed", { status: "completed", completedAt: new Date() }, "called");
  }

  async cancel(id: string, dto: QueueCancelDto, user: AuthUser) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException("Queue cancellation reason is required.");
    }
    return this.transition(id, user, "queue.cancelled", { status: "cancelled", cancelledAt: new Date(), cancellationReason: dto.reason.trim() }, undefined, dto.reason.trim());
  }

  private async transition(
    id: string,
    user: AuthUser,
    action: string,
    data: { status: "called" | "completed" | "cancelled"; calledAt?: Date; completedAt?: Date; cancelledAt?: Date; cancellationReason?: string },
    expectedPreviousStatus?: "waiting" | "called",
    reason?: string
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.queueTicket.findFirst({ where: { id, ...branchScope(user) } });

      if (!existing) {
        throw new NotFoundException("Queue ticket not found.");
      }

      const whereClause: Prisma.QueueTicketWhereInput = { id, ...branchScope(user) };
      if (expectedPreviousStatus) {
        whereClause.status = expectedPreviousStatus;
      }

      const result = await tx.queueTicket.updateMany({
        where: whereClause,
        data
      });

      if (result.count === 0) {
        throw new BadRequestException({ code: "QUEUE_INVALID_TRANSITION", message: `Cannot transition ticket. It may have already been transitioned by another user.` });
      }

      const ticket = await tx.queueTicket.findUniqueOrThrow({
        where: { id },
        include: { patient: true, appointment: true }
      });

      // If completed or cancelled, delete lock
      if (data.status === "completed" || data.status === "cancelled") {
        await tx.activeQueueTicketLock.deleteMany({ where: { queueTicketId: id } });
      }

      await this.audit.record({
        actorUserId: user.id,
        action,
        resourceType: "queue_ticket",
        resourceId: ticket.id,
        branchId: ticket.branchId,
        severity: "medium",
        reason,
        metadataJson: { from: existing.status, to: ticket.status, reasonCaptured: Boolean(reason) }
      });

      return ticket;
    });
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
}

function queueSortRank(ticket: { status: string; visitType: string }) {
  if (ticket.status === "called") return 0;
  if (ticket.status === "waiting" && ticket.visitType === "urgent_kashf") return 1;
  if (ticket.status === "waiting") return 2;
  if (ticket.status === "completed") return 3;
  if (ticket.status === "cancelled") return 4;
  return 5;
}

function demoPatientWhere(): Prisma.PatientWhereInput[] {
  return [
    { firstName: { startsWith: "Demo", mode: "insensitive" } },
    { lastName: { startsWith: "Demo", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "DEMO-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "TEST-", mode: "insensitive" } },
    { medicalRecordNumber: { startsWith: "QA-", mode: "insensitive" } },
    { notes: { contains: "training", mode: "insensitive" } },
    { notes: { contains: "local demo", mode: "insensitive" } }
  ];
}
