import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreatePrescriptionDto, UpdatePrescriptionDto } from "./dto";
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
