import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreateInvestigationResultDto, ReviewInvestigationResultDto, UpdateInvestigationResultDto, VoidInvestigationResultDto } from "./dto";
import { InvestigationResultsService } from "./investigation-results.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvestigationResultsController {
  constructor(private readonly results: InvestigationResultsService) {}

  @Get("investigation-results")
  @Permissions("investigation.result_read")
  async list(@CurrentUser() user: AuthUser) {
    return { investigationResults: await this.results.list(user) };
  }

  @Post("investigation-results")
  @Permissions("investigation.result_create")
  create(@Body() dto: CreateInvestigationResultDto, @CurrentUser() user: AuthUser) {
    return this.results.create(dto, user);
  }

  @Get("investigation-results/:id")
  @Permissions("investigation.result_read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.results.get(id, user);
  }

  @Patch("investigation-results/:id")
  @Permissions("investigation.result_update")
  update(@Param("id") id: string, @Body() dto: UpdateInvestigationResultDto, @CurrentUser() user: AuthUser) {
    return this.results.update(id, dto, user);
  }

  @Post("investigation-results/:id/review")
  @Permissions("investigation.result_review")
  review(@Param("id") id: string, @Body() dto: ReviewInvestigationResultDto, @CurrentUser() user: AuthUser) {
    return this.results.review(id, dto, user);
  }

  @Post("investigation-results/:id/void")
  @Permissions("investigation.result_void")
  void(@Param("id") id: string, @Body() dto: VoidInvestigationResultDto, @CurrentUser() user: AuthUser) {
    return this.results.void(id, dto, user);
  }

  @Get("patients/:patientId/investigation-results")
  @Permissions("investigation.result_read")
  async listForPatient(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { investigationResults: await this.results.listForPatient(patientId, user) };
  }
}
