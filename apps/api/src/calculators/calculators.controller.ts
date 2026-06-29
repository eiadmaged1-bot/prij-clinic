import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CalculatorsService } from "./calculators.service";
import { CalculateDto, ReviewCalculationDto } from "./dto/calculate.dto";
import { ObDatingCalculateDto } from "./dto/ob-dating-calculate.dto";
import { ChangeLockedDatingDto, SetBestDatingDto } from "./dto/set-best-dating.dto";
import { VoidCalculationDto } from "./dto/void-calculation.dto";
import { ObDatingService } from "./ob-dating.service";

@Controller("calculators")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CalculatorsController {
  constructor(
    private readonly calculators: CalculatorsService,
    private readonly obDating: ObDatingService
  ) {}

  @Get("formulas")
  @Permissions("calculator.read")
  async listFormulas() {
    return { formulas: await this.calculators.listFormulas() };
  }

  @Get("formulas/:code")
  @Permissions("calculator.read")
  getFormula(@Param("code") code: string) {
    return this.calculators.getFormula(code);
  }

  @Post("calculate")
  @Permissions("calculator.calculate")
  calculate(@Body() dto: CalculateDto, @CurrentUser() user: AuthUser) {
    return this.calculators.calculate(dto, user);
  }

  @Get("history")
  @Permissions("calculator.review")
  async listHistory(@CurrentUser() user: AuthUser) {
    return { calculations: await this.calculators.listHistory(user) };
  }

  @Get("history/patient/:patientId")
  @Permissions("calculator.read")
  async listPatientHistory(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { calculations: await this.calculators.listPatientHistory(patientId, user) };
  }

  @Post("history/:id/review")
  @Permissions("calculator.review")
  reviewCalculation(@Param("id") id: string, @Body() dto: ReviewCalculationDto, @CurrentUser() user: AuthUser) {
    return this.calculators.reviewCalculation(id, dto, user);
  }

  @Post("history/:id/void")
  @Permissions("calculator.review")
  voidCalculation(@Param("id") id: string, @Body() dto: VoidCalculationDto, @CurrentUser() user: AuthUser) {
    return this.calculators.voidCalculation(id, dto, user);
  }

  @Post("ob/dating/calculate")
  @Permissions("calculator.calculate")
  calculateObDating(@Body() dto: ObDatingCalculateDto, @CurrentUser() user: AuthUser) {
    return this.obDating.calculate(dto, user);
  }

  @Get("ob/patient/:patientId/dating")
  @Permissions("calculator.read")
  async listPatientDating(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { datingAssessments: await this.obDating.listPatientDating(patientId, user) };
  }

  @Get("ob/patient/:patientId/current")
  @Permissions("calculator.read")
  async currentPatientDating(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { dating: await this.obDating.currentPatientDating(patientId, user) };
  }

  @Post("ob/dating/:id/set-best")
  @Permissions("calculator.review")
  setBest(@Param("id") id: string, @Body() dto: SetBestDatingDto, @CurrentUser() user: AuthUser) {
    return this.obDating.setBest(id, dto, user);
  }

  @Post("ob/dating/:id/lock")
  @Permissions("calculator.review")
  lock(@Param("id") id: string, @Body() dto: SetBestDatingDto, @CurrentUser() user: AuthUser) {
    return this.obDating.lock(id, dto, user);
  }

  @Post("ob/dating/:id/change-locked")
  @Permissions("calculator.review")
  changeLocked(@Param("id") id: string, @Body() dto: ChangeLockedDatingDto, @CurrentUser() user: AuthUser) {
    return this.obDating.changeLocked(id, dto, user);
  }

  @Post("ob/dating/:id/void")
  @Permissions("calculator.review")
  voidDating(@Param("id") id: string, @Body() dto: VoidCalculationDto, @CurrentUser() user: AuthUser) {
    return this.obDating.void(id, dto, user);
  }
}

@Controller("admin/calculators")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminCalculatorsController {
  constructor(private readonly calculators: CalculatorsService) {}

  @Get()
  @Permissions("calculator.manage")
  async list(@Query("status") status?: string) {
    const formulas = (await this.calculators.listFormulas()) as Array<{ implementationStatus?: string }>;
    return { formulas: status ? formulas.filter((formula) => formula.implementationStatus === status) : formulas };
  }

  @Patch(":code")
  @Permissions("calculator.manage")
  update(@Param("code") code: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.calculators.updateFormulaMetadata(code, dto, user);
  }
}
