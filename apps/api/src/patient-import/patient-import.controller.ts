import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CommitPatientImportDto, PreviewPatientImportDto, UpdatePatientImportReviewDto } from "./dto";
import { PatientImportService } from "./patient-import.service";

@Controller("patient-import")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientImportController {
  constructor(private readonly imports: PatientImportService) {}
  @Post("preview") @Permissions("patient.create") preview(@Body() dto: PreviewPatientImportDto, @CurrentUser() user: AuthUser) { return this.imports.preview(dto, user); }
  @Get(":id") @Permissions("patient.create") get(@Param("id") id: string, @CurrentUser() user: AuthUser) { return this.imports.get(id, user); }
  @Post(":id/rows/:rowId/review") @Permissions("patient.create") review(@Param("id") id: string, @Param("rowId") rowId: string, @Body() dto: UpdatePatientImportReviewDto, @CurrentUser() user: AuthUser) { return this.imports.updateReview(id, rowId, dto, user); }
  @Post(":id/commit") @Permissions("patient.create") commit(@Param("id") id: string, @Body() dto: CommitPatientImportDto, @CurrentUser() user: AuthUser) { return this.imports.commit(id, dto, user); }
}
