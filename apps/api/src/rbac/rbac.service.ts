import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PasswordService } from "../auth/password.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  AccountStatusChangeDto,
  AdminOverrideDto,
  AppearanceSettingsDto,
  CreateAccountDto,
  CreateServiceItemDto,
  ResetAccountPasswordDto,
  UpdateAccountDto,
  UpdateAccountPermissionsDto,
  UpdateServiceItemDto
} from "./admin.dto";

const defaultAppearanceSettings = {
  defaultTheme: "clinic-premium",
  allowUserThemeOverride: true
};

const allowedAppearanceThemes = new Set(["clinic-premium", "medicolize-portal", "incision-portal", "minimal-clean", "compact-operations"]);
const accountInclude = {
  branch: true,
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  },
  permissionOverrides: {
    include: {
      permission: true
    }
  }
} as const;
type AccountWithRelations = Prisma.UserGetPayload<{ include: typeof accountInclude }>;
const reservedSystemOwnerPermissions = new Set(["system_owner.manage", "developer_owner.manage"]);
const allowedPermissionPresets = new Set(["minimum", "standard", "advanced", "custom"]);

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly passwords: PasswordService
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

  async listAccounts() {
    const [accounts, roles, permissions] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: [{ protectedAccount: "desc" }, { createdAt: "asc" }],
        include: accountInclude
      }),
      this.listRoles(),
      this.listPermissions()
    ]);

    return {
      accounts: accounts.map((account) => toAccountSummary(account)),
      roles,
      permissions,
      presets: permissionPresets()
    };
  }

  async createAccount(dto: CreateAccountDto, actor?: AuthUser) {
    assertCanManageAccounts(actor);
    assertReasonForSensitiveChange(dto.reason);
    assertNotReservedAccountInput(dto.loginId, dto.role, dto.permissionPreset);
    assertProductionPasswordAllowed(dto.temporaryPassword);

    const loginId = normalizeLoginId(dto.loginId);
    const email = normalizeAccountEmail(dto.email, loginId);
    const role = await this.requireRole(dto.role);
    const passwordHash = await this.passwords.hash(dto.temporaryPassword);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          loginId,
          displayName: dto.displayName.trim(),
          status: "active",
          branchId: actor?.branchId ?? null,
          permissionPreset: dto.permissionPreset,
          protectedAccount: false,
          passwordHash,
          createdByUserId: actor?.id
        }
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          branchId: actor?.branchId ?? null,
          createdByUserId: actor?.id
        }
      });

      return tx.user.findUniqueOrThrow({ where: { id: user.id }, include: accountInclude });
    });

    await this.audit.record({
      actorUserId: actor?.id,
      action: "account.created",
      resourceType: "user",
      resourceId: created.id,
      branchId: created.branchId,
      severity: "high",
      reason: dto.reason?.trim(),
      metadataJson: { loginId: created.loginId, role: dto.role, permissionPreset: created.permissionPreset }
    });

    return { account: toAccountSummary(created) };
  }

  async updateAccount(id: string, dto: UpdateAccountDto, actor?: AuthUser) {
    assertCanManageAccounts(actor);
    const existing = await this.requireAccount(id);
    assertCanEditAccount(existing, actor);
    if ((dto.role || dto.permissionPreset) && !dto.reason?.trim()) {
      throw new BadRequestException("A reason is required for role or permission preset changes.");
    }
    if (dto.role || dto.permissionPreset) {
      assertNotReservedAccountInput(existing.loginId, dto.role ?? existing.userRoles[0]?.role.name, dto.permissionPreset ?? existing.permissionPreset);
    }

    const role = dto.role ? await this.requireRole(dto.role) : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ...(dto.displayName !== undefined ? { displayName: dto.displayName.trim() } : {}),
          ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
          ...(dto.permissionPreset !== undefined ? { permissionPreset: dto.permissionPreset } : {})
        }
      });

      if (role) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.create({
          data: {
            userId: id,
            roleId: role.id,
            branchId: existing.branchId,
            createdByUserId: actor?.id
          }
        });
      }

      return tx.user.findUniqueOrThrow({ where: { id }, include: accountInclude });
    });

    await this.audit.record({
      actorUserId: actor?.id,
      action: "account.updated",
      resourceType: "user",
      resourceId: id,
      branchId: updated.branchId,
      severity: role || dto.permissionPreset ? "high" : "medium",
      reason: dto.reason?.trim(),
      metadataJson: { changedFields: Object.keys(dto).filter((key) => key !== "reason"), role: dto.role, permissionPreset: updated.permissionPreset }
    });

    return { account: toAccountSummary(updated) };
  }

  async resetAccountPassword(id: string, dto: ResetAccountPasswordDto, actor?: AuthUser) {
    assertCanManageAccounts(actor);
    assertReasonForSensitiveChange(dto.reason);
    assertProductionPasswordAllowed(dto.temporaryPassword);
    const existing = await this.requireAccount(id);
    assertCanEditAccount(existing, actor);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await this.passwords.hash(dto.temporaryPassword),
        failedLoginCount: 0,
        lockedUntil: null
      },
      include: accountInclude
    });

    await this.audit.record({
      actorUserId: actor?.id,
      action: "account.password_reset",
      resourceType: "user",
      resourceId: id,
      branchId: updated.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { loginId: updated.loginId }
    });

    return { account: toAccountSummary(updated), temporaryPassword: dto.temporaryPassword };
  }

  async deactivateAccount(id: string, dto: AccountStatusChangeDto, actor?: AuthUser) {
    return this.changeAccountStatus(id, "disabled", "account.deactivated", dto.reason, actor);
  }

  async activateAccount(id: string, dto: AccountStatusChangeDto, actor?: AuthUser) {
    return this.changeAccountStatus(id, "active", "account.activated", dto.reason, actor);
  }

  async updateAccountPermissions(id: string, dto: UpdateAccountPermissionsDto, actor?: AuthUser) {
    assertCanManageAccounts(actor);
    assertReasonForSensitiveChange(dto.reason);
    if (!allowedPermissionPresets.has(dto.permissionPreset)) {
      throw new BadRequestException("Permission preset is not valid.");
    }

    const existing = await this.requireAccount(id);
    assertCanEditAccount(existing, actor);
    assertNotReservedAccountInput(existing.loginId, existing.userRoles[0]?.role.name, dto.permissionPreset);

    const roleBoundary = new Set<string>();
    for (const userRole of existing.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const key = rolePermission.permission.key;
        if (!reservedSystemOwnerPermissions.has(key)) roleBoundary.add(key);
      }
    }

    const requested = [...new Set(dto.allowedPermissions.map((permission) => permission.trim()).filter(Boolean))];
    for (const permission of requested) {
      if (reservedSystemOwnerPermissions.has(permission)) {
        throw new ForbiddenException("System Owner permissions are reserved for Eyad System Owner.");
      }
      if (!roleBoundary.has(permission)) {
        throw new BadRequestException("Permission is outside this role boundary.");
      }
    }

    const permissionRows = await this.prisma.permission.findMany({ where: { key: { in: requested } } });
    if (permissionRows.length !== requested.length) {
      throw new BadRequestException("One or more permissions are not available.");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { permissionPreset: dto.permissionPreset } });
      await tx.userPermissionOverride.deleteMany({
        where: {
          userId: id,
          permission: {
            key: {
              notIn: [...reservedSystemOwnerPermissions]
            }
          }
        }
      });

      if (dto.permissionPreset === "custom") {
        for (const permission of permissionRows) {
          await tx.userPermissionOverride.create({
            data: {
              userId: id,
              permissionId: permission.id,
              effect: "allow",
              grantedByUserId: actor?.id
            }
          });
        }
      }

      return tx.user.findUniqueOrThrow({ where: { id }, include: accountInclude });
    });

    await this.audit.record({
      actorUserId: actor?.id,
      action: "account.permissions_updated",
      resourceType: "user",
      resourceId: id,
      branchId: updated.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { permissionPreset: dto.permissionPreset, allowedPermissions: requested }
    });

    return { account: toAccountSummary(updated) };
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
        currency: (dto.currency || "EGP").trim().toUpperCase(),
        active: dto.active ?? true,
        costAmount: dto.costAmount === undefined ? null : money(dto.costAmount),
        doctorShareAmount: dto.doctorShareAmount === undefined ? null : money(dto.doctorShareAmount)
      }
    });

    await this.audit.record({
      actorUserId: user?.id,
      action: "service_item.created",
      resourceType: "service_item",
      resourceId: service.id,
      branchId: user?.branchId,
      severity: "high",
      metadataJson: {
        code: service.code,
        price: service.price.toString(),
        currency: service.currency,
        active: service.active,
        hasCostPlaceholder: service.costAmount !== null,
        hasDoctorSharePlaceholder: service.doctorShareAmount !== null
      }
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
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.costAmount !== undefined ? { costAmount: money(dto.costAmount) } : {}),
        ...(dto.doctorShareAmount !== undefined ? { doctorShareAmount: money(dto.doctorShareAmount) } : {})
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
        active: service.active,
        hasCostPlaceholder: service.costAmount !== null,
        hasDoctorSharePlaceholder: service.doctorShareAmount !== null
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

  private async changeAccountStatus(id: string, status: "active" | "disabled", action: string, reason: string, actor?: AuthUser) {
    assertCanManageAccounts(actor);
    assertReasonForSensitiveChange(reason);
    const existing = await this.requireAccount(id);
    assertCanEditAccount(existing, actor);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: accountInclude
    });

    await this.audit.record({
      actorUserId: actor?.id,
      action,
      resourceType: "user",
      resourceId: id,
      branchId: updated.branchId,
      severity: "high",
      reason: reason.trim(),
      metadataJson: { previousStatus: existing.status, newStatus: status, loginId: updated.loginId }
    });

    return { account: toAccountSummary(updated) };
  }

  private async requireAccount(id: string) {
    const account = await this.prisma.user.findUnique({ where: { id }, include: accountInclude });
    if (!account) throw new NotFoundException("Account not found.");
    return account;
  }

  private async requireRole(name: string) {
    const role = await this.prisma.role.findUnique({ where: { name } });
    if (!role) throw new BadRequestException("Role is not available.");
    return role;
  }
}

function assertCanManageAccounts(actor?: AuthUser) {
  if (!actor || !(actor.roles.includes("Owner") || actor.roles.includes("Admin") || actor.permissions.includes("user.manage"))) {
    throw new ForbiddenException("Admin access is required.");
  }
}

function assertCanEditAccount(account: AccountWithRelations, actor?: AuthUser) {
  if (account.protectedAccount || account.loginId === "eyad") {
    throw new ForbiddenException("Eyad System Owner is protected.");
  }
  if (actor?.id === account.id) {
    throw new BadRequestException("Use a separate account for self-management changes.");
  }
}

function assertReasonForSensitiveChange(reason?: string | null) {
  if (!reason?.trim()) {
    throw new BadRequestException("A reason is required.");
  }
}

function assertNotReservedAccountInput(loginId?: string | null, role?: string, permissionPreset?: string) {
  if (normalizeLoginId(loginId ?? "") === "eyad") {
    throw new ForbiddenException("Eyad System Owner already exists and is protected.");
  }
  if (role === "Developer Owner" || role === "System Owner") {
    throw new ForbiddenException("System Owner permissions are reserved for Eyad System Owner.");
  }
  if (permissionPreset && !allowedPermissionPresets.has(permissionPreset)) {
    throw new BadRequestException("Permission preset is not valid.");
  }
}

function assertProductionPasswordAllowed(password: string) {
  if (process.env.APP_ENV === "production" && (password === "eyad" || password === "LocalDev123!")) {
    throw new BadRequestException("Demo passwords are not allowed in production.");
  }
}

function normalizeLoginId(loginId: string) {
  const normalized = loginId.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,80}$/.test(normalized)) {
    throw new BadRequestException("Login ID must use letters, numbers, dots, dashes, or underscores.");
  }
  return normalized;
}

function normalizeAccountEmail(email: string | undefined, loginId: string) {
  return (email?.trim().toLowerCase() || `${loginId}@accounts.prij.local`).toLowerCase();
}

function toAccountSummary(account: AccountWithRelations) {
  const roleNames = account.userRoles.map((userRole) => userRole.role.name).sort();
  const rolePermissions = new Set<string>();

  for (const userRole of account.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      if (!reservedSystemOwnerPermissions.has(rolePermission.permission.key)) {
        rolePermissions.add(rolePermission.permission.key);
      }
    }
  }

  const customAllowedPermissions = account.permissionOverrides
    .filter((override) => override.effect === "allow" && !reservedSystemOwnerPermissions.has(override.permission.key))
    .map((override) => override.permission.key)
    .sort();
  const reservedPermissions = account.permissionOverrides
    .filter((override) => override.effect === "allow" && reservedSystemOwnerPermissions.has(override.permission.key))
    .map((override) => override.permission.key)
    .sort();

  return {
    id: account.id,
    email: account.email,
    loginId: account.loginId,
    displayName: account.displayName,
    status: account.status,
    branchId: account.branchId,
    branchName: account.branch?.name ?? null,
    roles: roleNames,
    role: roleNames[0] ?? "No role",
    permissionPreset: account.permissionPreset,
    protectedAccount: account.protectedAccount,
    isSystemOwner: account.loginId === "eyad" && account.protectedAccount && reservedPermissions.includes("system_owner.manage"),
    roleBoundaryPermissions: [...rolePermissions].sort(),
    customAllowedPermissions,
    reservedPermissions,
    lastLoginAt: account.lastLoginAt,
    createdAt: account.createdAt
  };
}

function permissionPresets() {
  return [
    { id: "minimum", name: "Minimum", description: "Can only do basic work for role." },
    { id: "standard", name: "Standard", description: "Normal daily work." },
    { id: "advanced", name: "Advanced", description: "More control but not system owner." },
    { id: "custom", name: "Custom", description: "Manual toggles inside role boundaries." }
  ];
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
  return (
    typeof candidate.defaultTheme === "string" &&
    allowedAppearanceThemes.has(candidate.defaultTheme) &&
    typeof candidate.allowUserThemeOverride === "boolean"
  );
}
