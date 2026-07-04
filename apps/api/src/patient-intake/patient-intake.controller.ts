import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ListPatientIntakeQueryDto, PatientIntakeDto, ReviewPatientIntakeDto, UpdatePatientIntakeDto } from "./dto";
import { PatientIntakeService } from "./patient-intake.service";

@Controller("patient-intake")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientIntakeController {
  constructor(private readonly intake: PatientIntakeService) {}

  @Post()
  @Permissions("patient_intake.write")
  create(@Body() dto: PatientIntakeDto, @CurrentUser() user: AuthUser) {
    return this.intake.create(dto, user);
  }

  @Get()
  @Permissions("patient_intake.read")
  async list(@Query() query: ListPatientIntakeQueryDto, @CurrentUser() user: AuthUser) {
    return { patientIntakes: await this.intake.list(user, query.patientId, query.status) };
  }

  @Get(":id")
  @Permissions("patient_intake.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.intake.get(id, user);
  }

  @Patch(":id")
  @Permissions("patient_intake.write")
  update(@Param("id") id: string, @Body() dto: UpdatePatientIntakeDto, @CurrentUser() user: AuthUser) {
    return this.intake.update(id, dto, user);
  }

  @Post(":id/submit")
  @Permissions("patient_intake.submit")
  submit(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.intake.submit(id, user);
  }

  @Post(":id/review")
  @Permissions("patient_intake.review")
  review(@Param("id") id: string, @Body() dto: ReviewPatientIntakeDto, @CurrentUser() user: AuthUser) {
    return this.intake.review(id, dto, user);
  }

  @Post(":id/sign")
  @Permissions("patient_intake.sign")
  sign(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.intake.sign(id, user);
  }
}
