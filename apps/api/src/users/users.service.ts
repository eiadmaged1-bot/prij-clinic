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
  }
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userProfileInclude
    });
  }

  findByIdForAuth(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userProfileInclude
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
    const permissionKeys = new Set<string>();

    for (const userRole of user.userRoles) {
      roleNames.add(userRole.role.name);

      for (const rolePermission of userRole.role.rolePermissions) {
        permissionKeys.add(rolePermission.permission.key);
      }
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      branchId: user.branchId,
      roles: [...roleNames].sort(),
      permissions: [...permissionKeys].sort()
    };
  }
}
