import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import {
  CreateAntenatalVisitDto,
  CreateObUltrasoundDto,
  CreatePreviousPregnancyDto,
  CreatePregnancyDto,
  CreatePregnancyFetusDto,
  UpdateObUltrasoundDto,
  UpdatePregnancyDto
} from "./dto";
import { PregnancyService } from "./pregnancy.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PregnancyController {
  constructor(private readonly pregnancy: PregnancyService) {}

  @Post("pregnancies")
  @Permissions("pregnancy.manage")
  createPregnancy(@Body() dto: CreatePregnancyDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.createPregnancy(dto, user);
  }

  @Get("pregnancies")
  @Permissions("pregnancy.read")
  async listPregnancies(@CurrentUser() user: AuthUser) {
    return { pregnancies: await this.pregnancy.listPregnancies(user) };
  }

  @Get("pregnancies/:id")
  @Permissions("pregnancy.read")
  getPregnancy(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.pregnancy.getPregnancy(id, user);
  }

  @Patch("pregnancies/:id")
  @Permissions("pregnancy.manage")
  updatePregnancy(@Param("id") id: string, @Body() dto: UpdatePregnancyDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.updatePregnancy(id, dto, user);
  }

  @Post("previous-pregnancies")
  @Permissions("pregnancy.manage")
  createPreviousPregnancy(@Body() dto: CreatePreviousPregnancyDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.createPreviousPregnancy(dto, user);
  }

  @Get("previous-pregnancies")
  @Permissions("pregnancy.read")
  async listPreviousPregnancies(@CurrentUser() user: AuthUser) {
    return { previousPregnancies: await this.pregnancy.listPreviousPregnancies(user) };
  }

  @Post("pregnancies/:id/fetuses")
  @Permissions("pregnancy.manage")
  createFetus(@Param("id") id: string, @Body() dto: CreatePregnancyFetusDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.createFetus(id, dto, user);
  }

  @Get("pregnancies/:id/fetuses")
  @Permissions("pregnancy.read")
  async listFetuses(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { fetuses: await this.pregnancy.listFetuses(id, user) };
  }

  @Patch("pregnancies/:pregnancyId/fetuses/:fetusId")
  @Permissions("pregnancy.manage")
  updateFetus(
    @Param("pregnancyId") pregnancyId: string,
    @Param("fetusId") fetusId: string,
    @Body() dto: CreatePregnancyFetusDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.pregnancy.updateFetus(pregnancyId, fetusId, dto, user);
  }

  @Post("pregnancies/:id/antenatal-visits")
  @Permissions("pregnancy.manage")
  createAntenatalVisit(@Param("id") id: string, @Body() dto: CreateAntenatalVisitDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.createAntenatalVisit(id, dto, user);
  }

  @Get("pregnancies/:id/antenatal-visits")
  @Permissions("pregnancy.read")
  async listAntenatalVisits(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return { antenatalVisits: await this.pregnancy.listAntenatalVisits(id, user) };
  }

  @Post("ob-ultrasounds")
  @Permissions("ob_ultrasound.manage")
  createObUltrasound(@Body() dto: CreateObUltrasoundDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.createObUltrasound(dto, user);
  }

  @Get("ob-ultrasounds")
  @Permissions("ob_ultrasound.read")
  async listObUltrasounds(@CurrentUser() user: AuthUser) {
    return { obUltrasounds: await this.pregnancy.listObUltrasounds(user) };
  }

  @Get("ob-ultrasounds/:id")
  @Permissions("ob_ultrasound.read")
  getObUltrasound(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.pregnancy.getObUltrasound(id, user);
  }

  @Patch("ob-ultrasounds/:id")
  @Permissions("ob_ultrasound.manage")
  updateObUltrasound(@Param("id") id: string, @Body() dto: UpdateObUltrasoundDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.updateObUltrasound(id, dto, user);
  }

  @Patch("ob-ultrasounds/:id/review")
  @Permissions("ob_ultrasound.manage")
  reviewObUltrasound(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.pregnancy.reviewObUltrasound(id, user);
  }
}
