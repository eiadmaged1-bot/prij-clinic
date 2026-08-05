import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/auth.types";

const userProfileInclude = {
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

const reservedSystemOwnerPermissions = new Set(["system_owner.manage", "developer_owner.manage"]);

type CompatibilityUserRow = {
  id?: unknown;
  email?: unknown;
  loginId?: unknown;
  displayName?: unknown;
  status?: unknown;
  passwordHash?: unknown;
  branchId?: unknown;
  permissionPreset?: unknown;
  protectedAccount?: unknown;
  failedLoginCount?: unknown;
  lockedUntil?: unknown;
  lastLoginAt?: unknown;
  [key: string]: unknown;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private compatibilityWarningEmitted = false;

  constructor(private readonly prisma: PrismaService) {}

  private isSchemaCompatibilityError(error: unknown): boolean {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    const message = error instanceof Error ? error.message : String(error);

    return (
      code === "P2021" ||
      code === "P2022" ||
      /(?:table|relation|column).*?(?:does not exist|not found)/i.test(message) ||
      /Unknown (?:argument|field).*?(?:loginId|permissionOverrides|failedLoginCount|lockedUntil|lastLoginAt)/i.test(message)
    );
  }

  private canUseLocalCompatibility(error: unknown): boolean {
    return process.env.NODE_ENV !== "production" && this.isSchemaCompatibilityError(error);
  }

  private announceCompatibility(error: unknown): void {
    if (this.compatibilityWarningEmitted) return;
    this.compatibilityWarningEmitted = true;
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      "The local database schema is older than the selected code version. " +
        "Using a limited local authentication lookup until pending migrations are applied. " +
        `Original database error: ${message}`
    );
  }

  private normalizeCompatibilityRow(raw: CompatibilityUserRow) {
    if (typeof raw.id !== "string" || typeof raw.email !== "string") {
      return null;
    }

    const parseDate = (value: unknown): Date | null => {
      if (value instanceof Date) return value;
      if (typeof value !== "string" || !value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    return {
      ...raw,
      id: raw.id,
      email: raw.email,
      loginId: typeof raw.loginId === "string" ? raw.loginId : null,
      displayName: typeof raw.displayName === "string" ? raw.displayName : raw.email,
      status: typeof raw.status === "string" ? raw.status : "active",
      passwordHash: typeof raw.passwordHash === "string" ? raw.passwordHash : null,
      branchId: typeof raw.branchId === "string" ? raw.branchId : null,
      permissionPreset:
        typeof raw.permissionPreset === "string" ? raw.permissionPreset : "advanced",
      protectedAccount: raw.protectedAccount === true,
      failedLoginCount:
        typeof raw.failedLoginCount === "number" ? raw.failedLoginCount : 0,
      lockedUntil: parseDate(raw.lockedUntil),
      lastLoginAt: parseDate(raw.lastLoginAt),
      branch: null as { name: string } | null,
      userRoles: [] as any[],
      permissionOverrides: [] as any[]
    };
  }

  private async enrichCompatibilityProfile(user: any) {
    const prisma = this.prisma as unknown as {
      branch?: any;
      userRole?: any;
      userPermissionOverride?: any;
    };

    if (user.branchId && prisma.branch) {
      try {
        user.branch = await prisma.branch.findUnique({
          where: { id: user.branchId },
          select: { name: true }
        });
      } catch (error) {
        if (!this.canUseLocalCompatibility(error)) throw error;
      }
    }

    if (prisma.userRole) {
      try {
        user.userRoles = await prisma.userRole.findMany({
          where: { userId: user.id },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        });
      } catch (error) {
        if (!this.canUseLocalCompatibility(error)) throw error;
        user.userRoles = [];
      }
    }

    if (prisma.userPermissionOverride) {
      try {
        user.permissionOverrides = await prisma.userPermissionOverride.findMany({
          where: { userId: user.id },
          include: { permission: true }
        });
      } catch (error) {
        if (!this.canUseLocalCompatibility(error)) throw error;
        user.permissionOverrides = [];
      }
    }

    return user;
  }

  private async compatibilityLookup(
    mode: "identifier" | "email" | "id",
    value: string
  ) {
    const normalized = value.trim().toLowerCase();
    const predicate =
      mode === "id"
        ? `to_jsonb(u)->>'id' = $1`
        : mode === "email"
          ? `lower(COALESCE(to_jsonb(u)->>'email', '')) = $1`
          : `(lower(COALESCE(to_jsonb(u)->>'email', '')) = $1 OR lower(COALESCE(to_jsonb(u)->>'loginId', '')) = $1)`;

    const rows = await this.prisma.$queryRawUnsafe<Array<{ user: CompatibilityUserRow }>>(
      `SELECT to_jsonb(u) AS "user" FROM "User" u WHERE ${predicate} LIMIT 1`,
      mode === "id" ? value : normalized
    );
    const user = rows[0]?.user ? this.normalizeCompatibilityRow(rows[0].user) : null;
    return user ? this.enrichCompatibilityProfile(user) : null;
  }

  async findByEmailForAuth(email: string): Promise<any> {
    try {
      return await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: userProfileInclude
      });
    } catch (error) {
      if (!this.canUseLocalCompatibility(error)) throw error;
      this.announceCompatibility(error);
      return this.compatibilityLookup("email", email);
    }
  }

  async findByIdentifierForAuth(identifier: string): Promise<any> {
    const normalized = identifier.trim().toLowerCase();
    try {
      return await this.prisma.user.findFirst({
        where: {
          OR: [{ email: normalized }, { loginId: normalized }]
        },
        include: userProfileInclude
      });
    } catch (error) {
      if (!this.canUseLocalCompatibility(error)) throw error;
      this.announceCompatibility(error);
      return this.compatibilityLookup("identifier", normalized);
    }
  }

  async findByIdForAuth(id: string): Promise<any> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: userProfileInclude
      });
    } catch (error) {
      if (!this.canUseLocalCompatibility(error)) throw error;
      this.announceCompatibility(error);
      return this.compatibilityLookup("id", id);
    }
  }

  async getPreferences(userId: string) {
    const userPreference = (this.prisma as unknown as { userPreference: any }).userPreference;
    const existing = await userPreference.findUnique({
      where: { userId },
      select: preferenceSelect
    });
    if (existing) return existing;

    try {
      return await userPreference.create({
        data: { userId },
        select: preferenceSelect
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const concurrent = await userPreference.findUnique({
        where: { userId },
        select: preferenceSelect
      });
      if (!concurrent) throw error;
      return concurrent;
    }
  }

  async updatePreferences(userId: string, preferences: UserPreferencePatch) {
    const userPreference = (this.prisma as unknown as { userPreference: any }).userPreference;
    try {
      return await userPreference.upsert({
        where: { userId },
        create: { userId, ...preferences },
        update: preferences,
        select: preferenceSelect
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      return userPreference.update({
        where: { userId },
        data: preferences,
        select: preferenceSelect
      });
    }
  }

  async resolveAppearance(user: AuthUser) {
    const preferences = await this.getPreferences(user.id) as { appearanceJson?: Record<string, unknown> | null };
    if (preferences.appearanceJson?.themeId) return { source: "ACCOUNT", appearance: preferences.appearanceJson };
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: "appearance" }, select: { valueJson: true } });
    const value = setting?.valueJson && typeof setting.valueJson === "object" && !Array.isArray(setting.valueJson) ? setting.valueJson as Record<string, unknown> : {};
    const roleDefaults = value.roleDefaults && typeof value.roleDefaults === "object" && !Array.isArray(value.roleDefaults) ? value.roleDefaults as Record<string, unknown> : {};
    for (const role of user.roles) { const roleAppearance = roleDefaults[role]; if (roleAppearance && typeof roleAppearance === "object" && !Array.isArray(roleAppearance)) { const record = roleAppearance as Record<string, unknown>; return { source: "ROLE", appearance: { themeId: record.themeId, ...(record.configuration && typeof record.configuration === "object" ? record.configuration as object : {}) } }; } }
    return { source: "CLINIC", appearance: { themeId: value.defaultTheme ?? "clinic-premium", ...(value.appearanceConfig && typeof value.appearanceConfig === "object" ? value.appearanceConfig as object : {}) } };
  }

  async listAdminUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: userProfileInclude
    });

    return users.map((user) => this.toSafeUser(user));
  }

  toSafeUser(user: any): AuthUser {
    if (!user) {
      throw new Error("Cannot map empty user.");
    }

    const roleNames = new Set<string>();
    const rolePermissionKeys = new Set<string>();

    for (const userRole of user.userRoles ?? []) {
      if (!userRole?.role?.name) continue;
      roleNames.add(userRole.role.name);

      for (const rolePermission of userRole.role.rolePermissions ?? []) {
        if (rolePermission?.permission?.key) {
          rolePermissionKeys.add(rolePermission.permission.key);
        }
      }
    }

    const permissionKeys = applyPermissionPreset(
      rolePermissionKeys,
      typeof user.permissionPreset === "string" ? user.permissionPreset : "advanced"
    );

    for (const override of user.permissionOverrides ?? []) {
      const key = override?.permission?.key;
      if (!key) continue;
      const isReserved = reservedSystemOwnerPermissions.has(key);
      const canUseReserved = user.loginId === "eyad" && user.protectedAccount;

      if (isReserved && !canUseReserved) {
        continue;
      }

      if (override.effect === "allow") {
        permissionKeys.add(key);
      }

      if (override.effect === "deny") {
        permissionKeys.delete(key);
      }
    }

    const permissions = [...permissionKeys].sort();

    return {
      id: user.id,
      email: user.email,
      loginId: user.loginId ?? null,
      displayName: user.displayName,
      status: user.status,
      branchId: user.branchId ?? null,
      branchName: user.branch?.name ?? null,
      permissionPreset: user.permissionPreset ?? "advanced",
      protectedAccount: Boolean(user.protectedAccount),
      isSystemOwner:
        user.loginId === "eyad" &&
        Boolean(user.protectedAccount) &&
        reservedSystemOwnerPermissions.has("system_owner.manage") &&
        permissions.includes("system_owner.manage"),
      roles: [...roleNames].sort(),
      permissions
    };
  }
}

const preferenceSelect = {
  interfaceMode: true,
  densityMode: true,
  mobileNavigationMode: true,
  doctorWorkspaceMode: true,
  appearanceJson: true,
  updatedAt: true
} as const;

export type UserPreferencePatch = {
  interfaceMode?: "OPTIMIZED" | "MINIMALISTIC";
  densityMode?: "COMPACT" | "COMFORTABLE" | "LARGE";
  mobileNavigationMode?: "AUTO" | "BOTTOM_NAV" | "DRAWER";
  doctorWorkspaceMode?: "CLASSIC" | "COCKPIT";
  appearanceJson?: Record<string, unknown>;
};

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "P2002";
}

function applyPermissionPreset(rolePermissionKeys: Set<string>, preset: string) {
  const permissions = new Set<string>();

  for (const key of rolePermissionKeys) {
    if (reservedSystemOwnerPermissions.has(key)) {
      continue;
    }

    if (preset === "minimum" && !isMinimumPermission(key)) {
      continue;
    }

    if (preset === "standard" && !isStandardPermission(key)) {
      continue;
    }

    permissions.add(key);
  }

  return permissions;
}

function isMinimumPermission(key: string) {
  return key.endsWith(".read") || key.endsWith("s.read") || key === "queue.read" || key === "dashboard.read";
}

function isStandardPermission(key: string) {
  if (reservedSystemOwnerPermissions.has(key)) return false;
  if (key.includes("delete") || key.includes("void") || key.includes("override") || key.includes("export")) return false;
  if (key === "role.manage" || key === "permission.read" || key === "audit.export" || key === "backup.manage") return false;
  return true;
}
