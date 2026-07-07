import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ClinicalTagsService } from "./clinical-tags.service";
import { ManualClinicalTagDto } from "./dto";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicalTagsController {
  constructor(private readonly clinicalTags: ClinicalTagsService) {}

  @Get("clinical-tags/definitions")
  @Permissions("clinical_tags.read")
  async definitions(@CurrentUser() user: AuthUser) {
    return { definitions: await this.clinicalTags.definitions(user) };
  }

  @Get("clinical-tags/search")
  @Permissions("clinical_tags.search")
  async search(@Query("q") q: string | undefined, @CurrentUser() user: AuthUser) {
    return { definitions: await this.clinicalTags.search(q, user) };
  }

  @Get("clinical-tags/patients")
  @Permissions("clinical_tags.search")
  async patients(@Query("tag") tag: string | undefined, @CurrentUser() user: AuthUser) {
    return { patients: await this.clinicalTags.patientsByTag(tag, user) };
  }

  @Post("patients/:id/clinical-tags")
  @Permissions("clinical_tags.manage")
  addManual(@Param("id") id: string, @Body() dto: ManualClinicalTagDto, @CurrentUser() user: AuthUser) {
    return this.clinicalTags.manualAdd(id, dto, user);
  }
}
