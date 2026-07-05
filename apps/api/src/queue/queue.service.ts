import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceAppointment, assertCanReferencePatient } from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CheckInDto, QueueCancelDto } from "./dto";
import { toUtcDateOnly } from "./queue-date";

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async checkIn(dto: CheckInDto, user: AuthUser) {
    if (!dto.visitType) {
      throw new BadRequestException("Visit type is required before check-in.");
    }

    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const branchId = patient.branchId ?? (await this.resolveBranchId(user));

    if (dto.appointmentId) {
      const appointment = await assertCanReferenceAppointment(this.prisma, dto.appointmentId, user, {
        patientId: patient.id
      });

      if (!appointment || appointment.branchId !== branchId) {
        throw new BadRequestException("Appointment does not match the selected patient and branch.");
      }
    }

    const checkedInAt = new Date();
    const queueDate = toUtcDateOnly(checkedInAt);
    let ticket;

    try {
      ticket = await this.createTicketWithRetry({
        branchId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId ?? null,
        priority: dto.priority ?? "routine",
        visitType: dto.visitType,
        checkedInAt,
        queueDate
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestException("Referenced patient or appointment was not found.");
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
      metadataJson: { patientId: dto.patientId, appointmentId: dto.appointmentId ?? null, queueNumber: ticket.queueNumber, queueDate: ticket.queueDate.toISOString().slice(0, 10), visitType: dto.visitType }
    });

    return ticket;
  }

  today(user: AuthUser) {
    const queueDate = toUtcDateOnly();

    return this.prisma.queueTicket.findMany({
      where: { queueDate, ...branchScope(user) },
      orderBy: { queueNumber: "asc" },
      include: { patient: true, appointment: true }
    });
  }

  async call(id: string, user: AuthUser) {
    return this.transition(id, user, "queue.called", {
      status: "called",
      calledAt: new Date()
    });
  }

  async selectForDoctor(id: string, user: AuthUser) {
    return this.transition(id, user, "doctor_queue.patient_selected", {
      status: "called",
      calledAt: new Date()
    });
  }

  async complete(id: string, user: AuthUser) {
    return this.transition(id, user, "queue.completed", {
      status: "completed",
      completedAt: new Date()
    });
  }

  async cancel(id: string, dto: QueueCancelDto, user: AuthUser) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException("Queue cancellation reason is required.");
    }
    return this.transition(id, user, "queue.cancelled", {
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: dto.reason.trim()
    }, dto.reason.trim());
  }

  private async transition(
    id: string,
    user: AuthUser,
    action: string,
    data: { status: "called" | "completed" | "cancelled"; calledAt?: Date; completedAt?: Date; cancelledAt?: Date; cancellationReason?: string },
    reason?: string
  ) {
    const existing = await this.prisma.queueTicket.findFirst({ where: { id, ...branchScope(user) } });

    if (!existing) {
      throw new NotFoundException("Queue ticket not found.");
    }

    const ticket = await this.prisma.queueTicket.update({
      where: { id },
      data,
      include: { patient: true, appointment: true }
    });

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
  }

  private async createTicketWithRetry(input: {
    branchId: string;
    patientId: string;
    appointmentId: string | null;
    priority: "routine" | "priority";
    visitType: "kashf" | "recheck" | "consultation" | "urgent_kashf";
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
              priority: input.priority,
              visitType: input.visitType
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

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
