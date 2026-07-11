import { Injectable } from "@nestjs/common";
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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userProfileInclude
    });
  }

  findByIdentifierForAuth(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { loginId: normalized }]
      },
      include: userProfileInclude
    });
  }

  findByIdForAuth(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userProfileInclude
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: preferenceSelect
    });
  }

  async updatePreferences(userId: string, preferences: UserPreferencePatch) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...preferences },
      update: preferences,
      select: preferenceSelect
    });
  }

  async listAdminUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: userProfileInclude
    });

    return users.map((user) => this.toSafeUser(user));
  }

  toSafeUser(user: Awaited<ReturnType<UsersService["findByIdForAuth"]>>): AuthUser {
    if (!user) {
      throw new Error("Cannot map empty user.");
    }

    const roleNames = new Set<string>();
    const rolePermissionKeys = new Set<string>();

    for (const userRole of user.userRoles) {
      roleNames.add(userRole.role.name);

      for (const rolePermission of userRole.role.rolePermissions) {
        rolePermissionKeys.add(rolePermission.permission.key);
      }
    }

    const permissionKeys = applyPermissionPreset(rolePermissionKeys, user.permissionPreset);

    for (const override of user.permissionOverrides) {
      const key = override.permission.key;
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
      loginId: user.loginId,
      displayName: user.displayName,
      status: user.status,
      branchId: user.branchId,
      permissionPreset: user.permissionPreset,
      protectedAccount: user.protectedAccount,
      isSystemOwner:
        user.loginId === "eyad" &&
        user.protectedAccount &&
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
  updatedAt: true
} as const;

export type UserPreferencePatch = {
  interfaceMode?: "OPTIMIZED" | "MINIMALISTIC";
  densityMode?: "COMPACT" | "COMFORTABLE" | "LARGE";
  mobileNavigationMode?: "AUTO" | "BOTTOM_NAV" | "DRAWER";
};

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
