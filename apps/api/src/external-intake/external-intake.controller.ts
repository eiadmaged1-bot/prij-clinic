import { Body, Controller, Get, Headers, Param, Post, Query, RawBodyRequest, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { AttachSubmissionDto, CreatePatientFromSubmissionDto, GoogleFormIntakeDto, GoogleSheetBatchDto, RejectSubmissionDto, RequestCorrectionDto } from "./dto";
import { ExternalIntakeService } from "./external-intake.service";

@Controller()
export class ExternalIntakeController {
  constructor(private readonly intake: ExternalIntakeService) {}

  @Post("external-intake/google-form")
  async receiveGoogleForm(
    @Body() dto: GoogleFormIntakeDto,
    @Headers("x-prij-timestamp") timestamp: string | undefined,
    @Headers("x-prij-signature") signature: string | undefined,
    @Headers("x-prij-dry-run") dryRunHeader: string | undefined,
    @Req() request: RawBodyRequest<Request>,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.intake.receiveGoogleForm(dto, {
      timestamp,
      signature,
      rawBody: request.rawBody,
      dryRun: dryRunHeader?.toLowerCase() === "true",
      remoteAddress: request.ip
    });
    response.status(result.httpStatus);
    return result.body;
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

  @Post("external-intake/google-sheet")
  receiveGoogleSheet(@Body() dto: GoogleSheetBatchDto, @Headers("x-prij-integration-key") integrationKey: string | undefined, @Headers("idempotency-key") idempotencyKey: string | undefined, @Req() request: Request) {
    return this.intake.receiveGoogleSheet(dto, { integrationKey, idempotencyKey, remoteAddress: request.ip, secure: request.secure || request.headers["x-forwarded-proto"] === "https" });
  }

  @Post("external-intake/:id/request-correction")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("external_intake.review")
  requestCorrection(@Param("id") id: string, @Body() dto: RequestCorrectionDto, @CurrentUser() user: AuthUser) {
    return this.intake.requestCorrection(id, dto, user);
  }
}
