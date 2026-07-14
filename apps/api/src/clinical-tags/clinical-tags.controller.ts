import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ClinicalTagsService } from "./clinical-tags.service";
import { ManualClinicalTagDto, UpdateClinicalTagDto } from "./dto";

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
  async patients(@Query("tag") tag: string | undefined, @Query("operator") operator: string | undefined, @Query("status") status: string | undefined, @CurrentUser() user: AuthUser) {
    return { patients: await this.clinicalTags.patientsByTag(tag, user, operator, status) };
  }

  @Get("patients/:id/clinical-tags")
  @Permissions("clinical_tags.read")
  async patientTags(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { tags: await this.clinicalTags.forPatient(id, user) };
  }

  @Post("patients/:id/clinical-tags")
  @Permissions("clinical_tags.manage")
  addManual(@Param("id") id: string, @Body() dto: ManualClinicalTagDto, @CurrentUser() user: AuthUser) {
    return this.clinicalTags.manualAdd(id, dto, user);
  }

  @Patch("patients/:patientId/clinical-tags/:tagId")
  @Permissions("clinical_tags.manage")
  update(@Param("patientId") patientId: string, @Param("tagId") tagId: string, @Body() dto: UpdateClinicalTagDto, @CurrentUser() user: AuthUser) {
    return this.clinicalTags.update(patientId, tagId, dto, user);
  }

  @Delete("patients/:patientId/clinical-tags/:tagId")
  @Permissions("clinical_tags.manage")
  remove(@Param("patientId") patientId: string, @Param("tagId") tagId: string, @CurrentUser() user: AuthUser) {
    return this.clinicalTags.remove(patientId, tagId, user);
  }
}
