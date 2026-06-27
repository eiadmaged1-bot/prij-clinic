import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { RequestWithUser } from "../auth/auth.types";
import { UsersService } from "../users/users.service";
import { PermissionsGuard } from "./permissions.guard";
import { Permissions } from "./require-permissions.decorator";
import { RbacService } from "./rbac.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly rbac: RbacService,
    private readonly audit: AuditService
  ) {}

  @Get("users")
  @Permissions("user.read")
  async usersList(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.users.read", "user");

    return { users: await this.users.listAdminUsers() };
  }

  @Get("roles")
  @Permissions("role.read")
  async rolesList(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.roles.read", "role");

    return { roles: await this.rbac.listRoles() };
  }

  @Get("permissions")
  @Permissions("permission.read")
  async permissionsList(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.permissions.read", "permission");

    return { permissions: await this.rbac.listPermissions() };
  }

  private auditAdminRead(request: RequestWithUser, action: string, resourceType: string) {
    return this.audit.record({
      actorUserId: request.user?.id,
      action,
      resourceType,
      branchId: request.user?.branchId,
      severity: "medium",
      metadataJson: { endpoint: `${request.method} ${request.path}` },
      ipAddress: request.ip,
      userAgent: request.get("user-agent") ?? null
    });
  }
}
