import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreateObUltrasoundDto, CreatePregnancyDto, UpdateObUltrasoundDto, UpdatePregnancyDto } from "./dto";
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
  async listPregnancies() {
    return { pregnancies: await this.pregnancy.listPregnancies() };
  }

  @Get("pregnancies/:id")
  @Permissions("pregnancy.read")
  getPregnancy(@Param("id") id: string) {
    return this.pregnancy.getPregnancy(id);
  }

  @Patch("pregnancies/:id")
  @Permissions("pregnancy.manage")
  updatePregnancy(@Param("id") id: string, @Body() dto: UpdatePregnancyDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.updatePregnancy(id, dto, user);
  }

  @Post("ob-ultrasounds")
  @Permissions("ob_ultrasound.manage")
  createObUltrasound(@Body() dto: CreateObUltrasoundDto, @CurrentUser() user: AuthUser) {
    return this.pregnancy.createObUltrasound(dto, user);
  }

  @Get("ob-ultrasounds")
  @Permissions("ob_ultrasound.read")
  async listObUltrasounds() {
    return { obUltrasounds: await this.pregnancy.listObUltrasounds() };
  }

  @Get("ob-ultrasounds/:id")
  @Permissions("ob_ultrasound.read")
  getObUltrasound(@Param("id") id: string) {
    return this.pregnancy.getObUltrasound(id);
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
