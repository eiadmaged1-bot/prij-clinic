import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { AdminOverrideDto, AppearanceSettingsDto, CreateServiceItemDto, UpdateServiceItemDto } from "./admin.dto";

const defaultAppearanceSettings = {
  defaultTheme: "clinic-premium",
  allowUserThemeOverride: true
};

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemRole: role.isSystemRole,
      permissions: role.rolePermissions
        .map((rolePermission) => rolePermission.permission.key)
        .sort()
    }));
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { key: "asc" },
      select: {
        id: true,
        key: true,
        description: true,
        riskLevel: true
      }
    });
  }

  async controlCenterSummary() {
    const [users, roles, permissions, services, auditLogs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.permission.count(),
      this.prisma.serviceItem.count(),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          resourceType: true,
          severity: true,
          reason: true,
          createdAt: true
        }
      })
    ]);

    return {
      summary: {
        users,
        roles,
        permissions,
        services,
        defaultTheme: (await this.getAppearanceSettings()).defaultTheme,
        aiMode: "Disabled local placeholder",
        paymentGateway: "Not connected",
        fileStorage: "Not enabled for real files"
      },
      safety: {
        auditLogsCanBeDeleted: false,
        signedClinicalRecordsHardDelete: false,
        adminOverridesRequireReason: true,
        externalAiEnabled: false
      },
      auditLogs
    };
  }

  listServices() {
    return this.prisma.serviceItem.findMany({ orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }] });
  }

  async getAppearanceSettings() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: "appearance" } });
    const value = setting?.valueJson;
    if (isAppearanceSettings(value)) return value;
    return defaultAppearanceSettings;
  }

  async updateAppearanceSettings(dto: AppearanceSettingsDto, user?: AuthUser) {
    const next = {
      defaultTheme: dto.defaultTheme,
      allowUserThemeOverride: dto.allowUserThemeOverride
    };

    const setting = await this.prisma.systemSetting.upsert({
      where: { key: "appearance" },
      create: {
        key: "appearance",
        valueJson: next,
        updatedByUserId: user?.id
      },
      update: {
        valueJson: next,
        updatedByUserId: user?.id
      }
    });

    await this.audit.record({
      actorUserId: user?.id,
      action: "system_setting.appearance_updated",
      resourceType: "system_setting",
      resourceId: setting.id,
      branchId: user?.branchId,
      severity: "high",
      metadataJson: {
        defaultTheme: next.defaultTheme,
        allowUserThemeOverride: next.allowUserThemeOverride
      }
    });

    return next;
  }

  async createService(dto: CreateServiceItemDto, user?: AuthUser) {
    const service = await this.prisma.serviceItem.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        category: dto.category.trim(),
        price: money(dto.price),
        currency: (dto.currency || "EGP").trim().toUpperCase()
      }
    });

    await this.audit.record({
      actorUserId: user?.id,
      action: "service_item.created",
      resourceType: "service_item",
      resourceId: service.id,
      branchId: user?.branchId,
      severity: "high",
      metadataJson: { code: service.code, price: service.price.toString(), currency: service.currency }
    });

    return service;
  }

  async updateService(id: string, dto: UpdateServiceItemDto, user?: AuthUser) {
    const existing = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Service item not found.");

    const service = await this.prisma.serviceItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
        ...(dto.price !== undefined ? { price: money(dto.price) } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency.trim().toUpperCase() } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {})
      }
    });

    await this.audit.record({
      actorUserId: user?.id,
      action: "service_item.updated",
      resourceType: "service_item",
      resourceId: service.id,
      branchId: user?.branchId,
      severity: "high",
      reason: dto.active === false ? "Service deactivated from admin control center." : undefined,
      metadataJson: {
        changedFields: Object.keys(dto),
        fromPrice: existing.price.toString(),
        toPrice: service.price.toString(),
        active: service.active
      }
    });

    return service;
  }

  async adminVoidInvoice(id: string, dto: AdminOverrideDto, user?: AuthUser) {
    validateOverride(dto);
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException("Invoice not found.");

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: "voided", voidedAt: new Date(), voidedByUserId: user?.id, voidReason: dto.reason.trim() }
    });

    await this.audit.record({
      actorUserId: user?.id,
      action: "admin_override.invoice_voided",
      resourceType: "invoice",
      resourceId: id,
      branchId: invoice.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { previousStatus: invoice.status, newStatus: updated.status }
    });

    return updated;
  }

  async adminCancelAppointment(id: string, dto: AdminOverrideDto, user?: AuthUser) {
    validateOverride(dto);
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException("Appointment not found.");

    const updated = await this.prisma.appointment.update({ where: { id }, data: { status: "cancelled" } });
    await this.audit.record({
      actorUserId: user?.id,
      action: "admin_override.appointment_cancelled",
      resourceType: "appointment",
      resourceId: id,
      branchId: appointment.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { previousStatus: appointment.status, newStatus: updated.status }
    });
    return updated;
  }

  async adminCancelQueueTicket(id: string, dto: AdminOverrideDto, user?: AuthUser) {
    validateOverride(dto);
    const ticket = await this.prisma.queueTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("Queue ticket not found.");

    const updated = await this.prisma.queueTicket.update({ where: { id }, data: { status: "cancelled", cancelledAt: new Date() } });
    await this.audit.record({
      actorUserId: user?.id,
      action: "admin_override.queue_cancelled",
      resourceType: "queue_ticket",
      resourceId: id,
      branchId: ticket.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { previousStatus: ticket.status, newStatus: updated.status }
    });
    return updated;
  }

  async adminArchivePatient(id: string, dto: AdminOverrideDto, user?: AuthUser) {
    validateOverride(dto);
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException("Patient not found.");

    const updated = await this.prisma.patient.update({ where: { id }, data: { status: "archived" } });
    await this.audit.record({
      actorUserId: user?.id,
      action: "admin_override.patient_archived",
      resourceType: "patient",
      resourceId: id,
      branchId: patient.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { previousStatus: patient.status, newStatus: updated.status }
    });
    return updated;
  }
}

function validateOverride(dto: AdminOverrideDto) {
  if (!dto.reason?.trim()) {
    throw new BadRequestException("Admin override reason is required.");
  }
  if (dto.confirmation !== "CONFIRM") {
    throw new BadRequestException("Admin override confirmation is required.");
  }
}

function money(value: number) {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function isAppearanceSettings(value: Prisma.JsonValue | null | undefined): value is typeof defaultAppearanceSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.defaultTheme === "string" && typeof candidate.allowUserThemeOverride === "boolean";
}
