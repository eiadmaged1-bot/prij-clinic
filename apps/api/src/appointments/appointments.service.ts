import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type AppointmentStatus } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient, assertCanReferenceUserInBranch } from "../auth/reference-scope";
import { branchScope, doctorScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from "./dto";

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreateAppointmentDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const branchId = patient.branchId ?? (await this.resolveBranchId(user));
    await assertCanReferenceUserInBranch(this.prisma, dto.doctorId, user, branchId);
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException("Appointment dates are invalid.");
    }

    if (endAt <= startAt) {
      throw new BadRequestException("Appointment end must be after start.");
    }

    try {
      const appointment = await this.prisma.appointment.create({
        data: {
          branchId,
          patientId: dto.patientId,
          doctorId: dto.doctorId ?? null,
          startAt,
          endAt,
          appointmentType: dto.appointmentType?.trim() || null,
          source: dto.source?.trim() || null,
          notes: dto.notes?.trim() || null,
          createdByUserId: user.id
        },
        include: { patient: true }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "appointment.created",
        resourceType: "appointment",
        resourceId: appointment.id,
        branchId,
        severity: "medium",
        metadataJson: { patientId: dto.patientId, startAt: appointment.startAt.toISOString() }
      });

      return appointment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestException("Referenced doctor or patient was not found.");
      }

      throw error;
    }
  }

  list(user: AuthUser) {
    return this.prisma.appointment.findMany({
      where: { ...branchScope(user), ...doctorScope(user) },
      orderBy: { startAt: "desc" },
      take: 100,
      include: { patient: true }
    });
  }

  async get(id: string, user: AuthUser) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, ...branchScope(user), ...doctorScope(user) },
      include: { patient: true }
    });

    if (!appointment) {
      throw new NotFoundException("Appointment not found.");
    }

    return appointment;
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, user: AuthUser) {
    const existing = await this.get(id, user);
    if ((dto.status === "cancelled" || dto.status === "no_show") && !dto.reason?.trim()) {
      throw new BadRequestException("A reason is required for cancelled or no-show appointments.");
    }
    const data: Prisma.AppointmentUpdateInput = { status: dto.status };
    if (dto.status === "cancelled") data.cancellationReason = dto.reason?.trim();
    if (dto.status === "no_show") data.noShowReason = dto.reason?.trim();
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data,
      include: { patient: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "appointment.status_updated",
      resourceType: "appointment",
      resourceId: appointment.id,
      branchId: appointment.branchId,
      severity: "medium",
        reason: dto.reason?.trim(),
        metadataJson: { from: existing.status, to: appointment.status, reasonCaptured: Boolean(dto.reason?.trim()) }
      });

    return appointment;
  }

  async calendar(date: string, user: AuthUser, doctorId?: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("Calendar date must use YYYY-MM-DD.");
    }

    const start = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException("Calendar date is invalid.");
    }

    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.appointment.findMany({
      where: {
        startAt: { gte: start, lt: end },
        ...branchScope(user),
        ...doctorScope(user),
        ...(doctorId && !doctorScope(user).doctorId ? { doctorId } : {})
      },
      orderBy: { startAt: "asc" },
      include: { patient: true }
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
