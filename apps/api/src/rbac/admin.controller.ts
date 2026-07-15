import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthUser, RequestWithUser } from "../auth/auth.types";
import { UsersService } from "../users/users.service";
import { PermissionsGuard } from "./permissions.guard";
import { Permissions } from "./require-permissions.decorator";
import {
  AccountStatusChangeDto,
  AccountSecurityActionDto,
  AdminOverrideDto,
  AppearanceSettingsDto,
  ClinicProfileSettingsDto,
  CreateAccountDto,
  CreateServiceItemDto,
  ChangeOwnPasswordDto,
  ResetAccountPasswordDto,
  UpdateAccountDto,
  UpdateDoctorProfileDto,
  UpdateAccountPermissionsDto,
  UpdateServiceItemDto
} from "./admin.dto";
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

  @Get("accounts")
  @Permissions("user.read")
  async accountsList(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.accounts.read", "user");

    return this.rbac.listAccounts();
  }

  @Post("accounts")
  @Permissions("user.manage")
  createAccount(@Body() dto: CreateAccountDto, @CurrentUser() user: AuthUser) {
    return this.rbac.createAccount(dto, user);
  }

  @Patch("accounts/:id")
  @Permissions("user.manage")
  updateAccount(@Param("id") id: string, @Body() dto: UpdateAccountDto, @CurrentUser() user: AuthUser) {
    return this.rbac.updateAccount(id, dto, user);
  }

  @Patch("accounts/:id/doctor-profile")
  @Permissions("user.manage")
  updateDoctorProfile(@Param("id") id: string, @Body() dto: UpdateDoctorProfileDto, @CurrentUser() user: AuthUser) {
    return this.rbac.updateDoctorProfile(id, dto, user);
  }

  @Post("accounts/:id/reset-password")
  @Permissions("user.manage")
  resetAccountPassword(@Param("id") id: string, @Body() dto: ResetAccountPasswordDto, @CurrentUser() user: AuthUser) {
    return this.rbac.resetAccountPassword(id, dto, user);
  }

  @Post("accounts/:id/deactivate")
  @Permissions("user.manage")
  deactivateAccount(@Param("id") id: string, @Body() dto: AccountStatusChangeDto, @CurrentUser() user: AuthUser) {
    return this.rbac.deactivateAccount(id, dto, user);
  }

  @Post("accounts/:id/activate")
  @Permissions("user.manage")
  activateAccount(@Param("id") id: string, @Body() dto: AccountStatusChangeDto, @CurrentUser() user: AuthUser) {
    return this.rbac.activateAccount(id, dto, user);
  }

  @Post("accounts/:id/reactivate")
  @Permissions("user.manage")
  reactivateAccount(@Param("id") id: string, @Body() dto: AccountStatusChangeDto, @CurrentUser() user: AuthUser) {
    return this.rbac.activateAccount(id, dto, user);
  }

  @Patch("accounts/:id/permissions")
  @Permissions("user.manage")
  updateAccountPermissions(@Param("id") id: string, @Body() dto: UpdateAccountPermissionsDto, @CurrentUser() user: AuthUser) {
    return this.rbac.updateAccountPermissions(id, dto, user);
  }

  @Get("control-center")
  @Permissions("clinic_settings.manage")
  async controlCenter(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.control_center.read", "admin_control");

    return this.rbac.controlCenterSummary(request.user);
  }

  @Post("accounts/:id/revoke-sessions")
  @Permissions("user.manage")
  revokeAccountSessions(@Param("id") id: string, @Body() dto: AccountSecurityActionDto, @CurrentUser() user: AuthUser) { return this.rbac.revokeAccountSessions(id, dto, user); }

  @Post("accounts/:id/lock")
  @Permissions("user.manage")
  lockAccount(@Param("id") id: string, @Body() dto: AccountSecurityActionDto, @CurrentUser() user: AuthUser) { return this.rbac.setAccountLock(id, true, dto, user); }

  @Post("accounts/:id/unlock")
  @Permissions("user.manage")
  unlockAccount(@Param("id") id: string, @Body() dto: AccountSecurityActionDto, @CurrentUser() user: AuthUser) { return this.rbac.setAccountLock(id, false, dto, user); }

  @Post("accounts/:id/2fa-reset/prepare")
  @Permissions("user.manage")
  prepareTwoFactorReset(@Param("id") id: string, @Body() dto: AccountSecurityActionDto, @CurrentUser() user: AuthUser) { return this.rbac.prepareTwoFactorReset(id, dto, user); }

  @Post("accounts/:id/2fa-reset/confirm")
  @Permissions("user.manage")
  performTwoFactorReset(@Param("id") id: string, @Body() dto: AccountSecurityActionDto, @CurrentUser() user: AuthUser) { return this.rbac.performTwoFactorReset(id, dto, user); }

  @Get("accounts/:id/audit-history")
  @Permissions("user.manage")
  accountAuditHistory(@Param("id") id: string, @CurrentUser() user: AuthUser) { return this.rbac.accountAuditHistory(id, user); }

  @Post("accounts/me/change-password")
  @Permissions("user.read")
  changeOwnPassword(@Body() dto: ChangeOwnPasswordDto, @CurrentUser() user: AuthUser) { return this.rbac.changeOwnPassword(dto, user); }

  @Get("security-readiness")
  @Permissions("clinic_settings.manage")
  async securityReadiness(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.security_readiness.read", "security_readiness");

    return {
      generatedAt: new Date().toISOString(),
      status: "readiness_review_required",
      sections: [
        { label: "Authentication readiness", status: "Configured", detail: "JWT authentication and session checks are active for protected app surfaces." },
        { label: "RBAC readiness", status: "Configured", detail: "Owner/Admin settings use backend permission guards; role boundaries remain checked by regression tests." },
        { label: "Audit readiness", status: "Configured", detail: "Clinical, billing, queue, account, and admin actions keep audit records with redacted metadata." },
        { label: "Document upload safety", status: "Configured", detail: "Patient document uploads are scoped, allowlisted, and image metadata is sanitized before storage." },
        { label: "Backup readiness", status: "Local workflow", detail: "Local backup and verification scripts write only to ignored backup folders." },
        { label: "Consent readiness", status: "Limited", detail: "Consent records are tracked, but deployment-specific legal review is still required." },
        { label: "Production environment readiness", status: "Guarded", detail: "Production validation blocks demo mode, local demo file storage, non-HTTPS app URLs, and weak JWT settings." },
        { label: "Seed/data safety", status: "Guarded", detail: "No real patient data or fake clinical patient data is seeded by v0.16 readiness checks." },
        { label: "PHI/PII protection", status: "Guarded", detail: "UI and source checks avoid raw storage paths, stack traces, secrets, and internal identifiers where possible." },
        { label: "AI safety status", status: "Draft-only", detail: "AI remains assistive, disabled by default, and cannot diagnose, prescribe, dose, or change records autonomously." }
      ],
      blockers: [
        "Complete deployment-specific legal, privacy, and consent review.",
        "Configure monitored production backups and restore drills outside local readiness scripts.",
        "Complete security stabilization and deployment preparation before real patient data entry."
      ]
    };
  }

  @Get("services")
  @Permissions("clinic_settings.manage")
  async servicesList(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.services.read", "service_item");

    return { services: await this.rbac.listServices(request.user) };
  }

  @Get("settings/appearance")
  @Permissions("clinic_settings.manage")
  async appearanceSettings(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.appearance.read", "system_setting");

    return this.rbac.getAppearanceSettings(request.user);
  }

  @Patch("settings/appearance")
  @Permissions("clinic_settings.manage")
  updateAppearanceSettings(@Body() dto: AppearanceSettingsDto, @Req() request: RequestWithUser) {
    return this.rbac.updateAppearanceSettings(dto, request.user);
  }

  @Get("settings/clinic-profile")
  @Permissions("clinic_settings.manage")
  async clinicProfileSettings(@Req() request: RequestWithUser) {
    await this.auditAdminRead(request, "admin.clinic_profile.read", "system_setting");

    return this.rbac.getClinicProfileSettings(request.user);
  }

  @Patch("settings/clinic-profile")
  @Permissions("clinic_settings.manage")
  updateClinicProfileSettings(@Body() dto: ClinicProfileSettingsDto, @Req() request: RequestWithUser) {
    return this.rbac.updateClinicProfileSettings(dto, request.user);
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

  @Post("services/:id/deactivate")
  @Permissions("clinic_settings.manage")
  deactivateService(@Param("id") id: string, @Body() dto: AdminOverrideDto, @Req() request: RequestWithUser) {
    return this.rbac.deactivateService(id, dto, request.user);
  }

  @Post("services/:id/reactivate")
  @Permissions("clinic_settings.manage")
  reactivateService(@Param("id") id: string, @Body() dto: AdminOverrideDto, @Req() request: RequestWithUser) {
    return this.rbac.reactivateService(id, dto, request.user);
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
