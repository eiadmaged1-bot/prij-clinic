import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreateGynecologyVisitDto } from "./dto";
import { GynecologyService } from "./gynecology.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GynecologyController {
  constructor(private readonly gynecology: GynecologyService) {}

  @Post("patients/:id/gynecology-visits")
  @Permissions("encounter.create")
  createForPatient(@Param("id") id: string, @Body() dto: CreateGynecologyVisitDto, @CurrentUser() user: AuthUser) {
    return this.gynecology.createForPatient(id, dto, user);
  }

  @Get("gynecology-visits")
  @Permissions("encounter.read")
  async list(@CurrentUser() user: AuthUser, @Query("patientId") patientId?: string) {
    return { gynecologyVisits: await this.gynecology.list(user, patientId) };
  }

  @Get("patients/:id/gynecology-visits")
  @Permissions("encounter.read")
  async listForPatient(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { gynecologyVisits: await this.gynecology.list(user, id) };
  }

  @Get("gynecology-visits/:id")
  @Permissions("encounter.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.gynecology.get(id, user);
  }
}
