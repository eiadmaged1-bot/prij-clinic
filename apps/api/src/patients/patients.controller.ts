import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreatePatientDto, UpdatePatientDto } from "./dto";
import { PatientsService } from "./patients.service";

@Controller("patients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post()
  @Permissions("patient.create")
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: AuthUser) {
    return this.patients.create(dto, user);
  }

  @Get()
  @Permissions("patient.read")
  async list(@CurrentUser() user: AuthUser) {
    return { patients: await this.patients.list(user) };
  }

  @Get(":id")
  @Permissions("patient.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.get(id, user);
  }

  @Patch(":id")
  @Permissions("patient.update")
  update(@Param("id") id: string, @Body() dto: UpdatePatientDto, @CurrentUser() user: AuthUser) {
    return this.patients.update(id, dto, user);
  }
}
