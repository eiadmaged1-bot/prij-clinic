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
  @Permissions("prescriptions.manage")
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.create(dto, user);
  }

  @Get()
  @Permissions("prescriptions.read")
  async list() {
    return { prescriptions: await this.prescriptions.list() };
  }

  @Get(":id")
  @Permissions("prescriptions.read")
  get(@Param("id") id: string) {
    return this.prescriptions.get(id);
  }

  @Patch(":id")
  @Permissions("prescriptions.manage")
  update(@Param("id") id: string, @Body() dto: UpdatePrescriptionDto, @CurrentUser() user: AuthUser) {
    return this.prescriptions.update(id, dto, user);
  }

  @Patch(":id/sign")
  @Permissions("prescriptions.manage")
  sign(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptions.sign(id, user);
  }
}
