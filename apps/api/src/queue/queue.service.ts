import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CheckInDto } from "./dto";

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async checkIn(dto: CheckInDto, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });

    if (!patient) {
      throw new BadRequestException("Patient not found.");
    }

    const branchId = patient.branchId ?? (await this.resolveBranchId(user));

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId } });

      if (!appointment || appointment.patientId !== patient.id || appointment.branchId !== branchId) {
        throw new BadRequestException("Appointment does not match the selected patient and branch.");
      }
    }

    const queueNumber = await this.nextQueueNumber(branchId);
    let ticket;

    try {
      ticket = await this.prisma.queueTicket.create({
        data: {
          branchId,
          patientId: dto.patientId,
          appointmentId: dto.appointmentId ?? null,
          queueNumber,
          priority: dto.priority ?? "routine"
        },
        include: { patient: true, appointment: true }
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
      metadataJson: { patientId: dto.patientId, appointmentId: dto.appointmentId ?? null, queueNumber }
    });

    return ticket;
  }

  today() {
    const { start, end } = todayBounds();

    return this.prisma.queueTicket.findMany({
      where: { checkedInAt: { gte: start, lt: end } },
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

  async complete(id: string, user: AuthUser) {
    return this.transition(id, user, "queue.completed", {
      status: "completed",
      completedAt: new Date()
    });
  }

  async cancel(id: string, user: AuthUser) {
    return this.transition(id, user, "queue.cancelled", {
      status: "cancelled",
      cancelledAt: new Date()
    });
  }

  private async transition(
    id: string,
    user: AuthUser,
    action: string,
    data: { status: "called" | "completed" | "cancelled"; calledAt?: Date; completedAt?: Date; cancelledAt?: Date }
  ) {
    const existing = await this.prisma.queueTicket.findUnique({ where: { id } });

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
      metadataJson: { from: existing.status, to: ticket.status }
    });

    return ticket;
  }

  private async nextQueueNumber(branchId: string) {
    const { start, end } = todayBounds();
    const latest = await this.prisma.queueTicket.findFirst({
      where: { branchId, checkedInAt: { gte: start, lt: end } },
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

function todayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}
