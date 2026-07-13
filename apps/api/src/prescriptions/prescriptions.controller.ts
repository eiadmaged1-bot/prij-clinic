import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreatePrescriptionDto, DoctorMedicationShortcutDto, PrescriptionTemplateDto, UpdatePrescriptionDto } from "./dto";
import { PrescriptionsService } from "./prescriptions.service";

@Controller("prescriptions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Post()
  @Permissions("prescription.create")
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.create(dto, user);
  }

  @Get()
  @Permissions("prescription.read")
  async list(@CurrentUser() user: AuthUser) {
    return { prescriptions: await this.prescriptions.list(user) };
  }

  @Get("templates")
  @Permissions("prescription_templates.read")
  async listTemplates(@CurrentUser() user: AuthUser) {
    return { prescriptionTemplates: await this.prescriptions.listTemplates(user) };
  }

  @Post("templates")
  @Permissions("prescription_templates.manage")
  createTemplate(@Body() dto: PrescriptionTemplateDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.createTemplate(dto, user);
  }

  @Patch("templates/:id")
  @Permissions("prescription_templates.manage")
  updateTemplate(@Param("id") id: string, @Body() dto: PrescriptionTemplateDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.updateTemplate(id, dto, user);
  }

  @Post("templates/:id/duplicate")
  @Permissions("prescription_templates.manage")
  duplicateTemplate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.duplicateTemplate(id, user);
  }

  @Delete("templates/:id")
  @Permissions("prescription_templates.manage")
  archiveTemplate(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.archiveTemplate(id, user);
  }

  @Get("shortcuts")
  @Permissions("doctor_medication_shortcuts.read")
  async listShortcuts(@CurrentUser() user: AuthUser) {
    return { doctorMedicationShortcuts: await this.prescriptions.listShortcuts(user) };
  }

  @Post("shortcuts")
  @Permissions("doctor_medication_shortcuts.manage")
  createShortcut(@Body() dto: DoctorMedicationShortcutDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.createShortcut(dto, user);
  }

  @Patch("shortcuts/:id")
  @Permissions("doctor_medication_shortcuts.manage")
  updateShortcut(@Param("id") id: string, @Body() dto: DoctorMedicationShortcutDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.updateShortcut(id, dto, user);
  }

  @Delete("shortcuts/:id")
  @Permissions("doctor_medication_shortcuts.manage")
  archiveShortcut(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.archiveShortcut(id, user);
  }

  @Get(":id/print")
  @Permissions("prescription.read")
  getPrintView(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.getPrintView(id, user);
  }

  @Get(":id")
  @Permissions("prescription.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.get(id, user);
  }

  @Patch(":id")
  @Permissions("prescription.update")
  update(@Param("id") id: string, @Body() dto: UpdatePrescriptionDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.update(id, dto, user);
  }

  @Patch(":id/sign")
  @Permissions("prescription.approve")
  sign(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.sign(id, user);
  }
}
