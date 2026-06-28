import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ConsentsService } from "./consents.service";
import { CreateConsentDto } from "./dto";

@Controller("consents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConsentsController {
  constructor(private readonly consents: ConsentsService) {}

  @Post()
  @Permissions("patient.consent_manage")
  create(@Body() dto: CreateConsentDto, @CurrentUser() user: AuthUser) {
    return this.consents.create(dto, user);
  }

  @Get()
  @Permissions("patient.consent_read")
  async list(@Query("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { consentRecords: await this.consents.list(patientId, user) };
  }
}
