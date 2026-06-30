import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ClinicDirectoryService } from "./clinic-directory.service";
import { CreateClinicDepartmentDto, CreateExternalProviderDto, UpdateClinicDepartmentDto, UpdateExternalProviderDto } from "./dto";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicDirectoryController {
  constructor(private readonly directory: ClinicDirectoryService) {}

  @Get("external-providers")
  @Permissions("investigation.routing_manage")
  async listProviders() {
    return { externalProviders: await this.directory.listProviders() };
  }

  @Post("external-providers")
  @Permissions("investigation.routing_manage")
  createProvider(@Body() dto: CreateExternalProviderDto, @CurrentUser() user: AuthUser) {
    return this.directory.createProvider(dto, user);
  }

  @Patch("external-providers/:id")
  @Permissions("investigation.routing_manage")
  updateProvider(@Param("id") id: string, @Body() dto: UpdateExternalProviderDto, @CurrentUser() user: AuthUser) {
    return this.directory.updateProvider(id, dto, user);
  }

  @Get("clinic-departments")
  @Permissions("investigation.routing_manage")
  async listDepartments() {
    return { clinicDepartments: await this.directory.listDepartments() };
  }

  @Post("clinic-departments")
  @Permissions("investigation.routing_manage")
  createDepartment(@Body() dto: CreateClinicDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.directory.createDepartment(dto, user);
  }

  @Patch("clinic-departments/:id")
  @Permissions("investigation.routing_manage")
  updateDepartment(@Param("id") id: string, @Body() dto: UpdateClinicDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.directory.updateDepartment(id, dto, user);
  }
}
