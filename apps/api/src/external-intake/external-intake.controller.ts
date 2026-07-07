import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { AttachSubmissionDto, CreatePatientFromSubmissionDto, GoogleFormIntakeDto, RejectSubmissionDto } from "./dto";
import { ExternalIntakeService } from "./external-intake.service";

@Controller()
export class ExternalIntakeController {
  constructor(private readonly intake: ExternalIntakeService) {}

  @Post("external-intake/google-form")
  receiveGoogleForm(@Body() dto: GoogleFormIntakeDto, @Headers("x-prij-intake-token") token?: string) {
    return this.intake.receiveGoogleForm(dto, token);
  }

  @Get("external-intake")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("external_intake.read")
  async list(@Query("status") status: string | undefined, @CurrentUser() user: AuthUser) {
    return { submissions: await this.intake.list(user, status) };
  }

  @Get("external-intake/:id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("external_intake.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.intake.get(id, user);
  }

  @Post("external-intake/:id/create-patient")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("external_intake.review")
  createPatient(@Param("id") id: string, @Body() dto: CreatePatientFromSubmissionDto, @CurrentUser() user: AuthUser) {
    return this.intake.createPatient(id, dto, user);
  }

  @Post("external-intake/:id/attach")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("external_intake.review")
  attach(@Param("id") id: string, @Body() dto: AttachSubmissionDto, @CurrentUser() user: AuthUser) {
    return this.intake.attach(id, dto, user);
  }

  @Post("external-intake/:id/reject")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("external_intake.review")
  reject(@Param("id") id: string, @Body() dto: RejectSubmissionDto, @CurrentUser() user: AuthUser) {
    return this.intake.reject(id, dto, user);
  }
}
