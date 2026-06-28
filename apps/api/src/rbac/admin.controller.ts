import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { RequestWithUser } from "../auth/auth.types";
import { UsersService } from "../users/users.service";
import { PermissionsGuard } from "./permissions.guard";
import { Permissions } from "./require-permissions.decorator";
import { AdminOverrideDto, CreateServiceItemDto, UpdateServiceItemDto } from "./admin.dto";
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

  @Get("control-center")
  @Permissions("clinic_settings.manage")
  async controlCenter(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.control_center.read", "admin_control");

    return this.rbac.controlCenterSummary();
  }

  @Get("services")
  @Permissions("clinic_settings.manage")
  async servicesList(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.services.read", "service_item");

    return { services: await this.rbac.listServices() };
  }

  @Post("services")
  @Permissions("clinic_settings.manage")
  createService(@Body() dto: CreateServiceItemDto, @Req() request: RequestWithUser) {
    return this.rbac.createService(dto, request.user);
  }

  @Patch("services/:id")
  @Permissions("clinic_settings.manage")
  updateService(@Param("id") id: string, @Body() dto: UpdateServiceItemDto, @Req() request: RequestWithUser) {
    return this.rbac.updateService(id, dto, request.user);
  }

  @Post("overrides/invoices/:id/void")
  @Permissions("clinic_settings.manage")
  voidInvoice(@Param("id") id: string, @Body() dto: AdminOverrideDto, @Req() request: RequestWithUser) {
    return this.rbac.adminVoidInvoice(id, dto, request.user);
  }

  @Post("overrides/appointments/:id/cancel")
  @Permissions("clinic_settings.manage")
  cancelAppointment(@Param("id") id: string, @Body() dto: AdminOverrideDto, @Req() request: RequestWithUser) {
    return this.rbac.adminCancelAppointment(id, dto, request.user);
  }

  @Post("overrides/queue/:id/cancel")
  @Permissions("clinic_settings.manage")
  cancelQueueTicket(@Param("id") id: string, @Body() dto: AdminOverrideDto, @Req() request: RequestWithUser) {
    return this.rbac.adminCancelQueueTicket(id, dto, request.user);
  }

  @Post("overrides/patients/:id/archive")
  @Permissions("clinic_settings.manage")
  archivePatient(@Param("id") id: string, @Body() dto: AdminOverrideDto, @Req() request: RequestWithUser) {
    return this.rbac.adminArchivePatient(id, dto, request.user);
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
