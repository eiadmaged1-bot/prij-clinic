import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InvestigationOrderStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvestigationOrderDto, InvestigationOrderItemDto } from "./dto";

@Injectable()
export class InvestigationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async createOrder(dto: CreateInvestigationOrderDto, user: AuthUser) {
    await this.ensurePatient(dto.patientId);
    await this.ensureEncounterMatches(dto.patientId, dto.encounterId);

    try {
      const order = await this.prisma.investigationOrder.create({
        data: {
          patientId: dto.patientId,
          encounterId: dto.encounterId ?? null,
          doctorId: user.id,
          priority: dto.priority ?? "routine",
          notes: clean(dto.notes),
          items: { create: dto.items.map(toItemCreate) }
        },
        include: { items: true, patient: true, encounter: true }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "investigation_order.created",
        resourceType: "investigation_order",
        resourceId: order.id,
        severity: "high",
        metadataJson: { patientId: order.patientId, priority: order.priority, itemCount: order.items.length }
      });

      return order;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  listOrders(user: AuthUser) {
    return this.prisma.investigationOrder.findMany({
      where: { ...patientBranchScope(user), ...doctorScope(user) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, patient: true, encounter: true }
    });
  }

  async getOrder(id: string, user: AuthUser) {
    const order = await this.prisma.investigationOrder.findFirst({
      where: { id, ...patientBranchScope(user), ...doctorScope(user) },
      include: { items: true, patient: true, encounter: true }
    });

    if (!order) {
      throw new NotFoundException("Investigation order not found.");
    }

    return order;
  }

  async updateOrderStatus(id: string, status: InvestigationOrderStatus, user: AuthUser) {
    const existing = await this.getOrder(id, user);
    const order = await this.prisma.investigationOrder.update({
      where: { id },
      data: {
        status,
        items: { updateMany: { where: {}, data: { status } } }
      },
      include: { items: true, patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_order.status_updated",
      resourceType: "investigation_order",
      resourceId: order.id,
      severity: "high",
      metadataJson: { from: existing.status, to: order.status }
    });

    return order;
  }

  private async ensurePatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new BadRequestException("Patient not found.");
  }

  private async ensureEncounterMatches(patientId: string, encounterId?: string) {
    if (!encounterId) return;
    const encounter = await this.prisma.encounter.findUnique({ where: { id: encounterId } });
    if (!encounter || encounter.patientId !== patientId) {
      throw new BadRequestException("Encounter does not match the selected patient.");
    }
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, encounter, or doctor was not found.");
    }
    throw error;
  }
}

function toItemCreate(item: InvestigationOrderItemDto) {
  return {
    category: item.category,
    testName: item.testName.trim(),
    instructions: clean(item.instructions)
  };
}

function clean(value?: string) {
  return value?.trim() || null;
}
