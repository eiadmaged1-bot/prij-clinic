import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ConsentTemplatesService } from "./consent-templates.service";
import { CreateConsentTemplateDto, ReviewConsentRecordDto, SignConsentDemoDto, UpdateConsentTemplateDto } from "./dto";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConsentTemplatesController {
  constructor(private readonly consentTemplates: ConsentTemplatesService) {}

  @Get("consent-templates")
  @Permissions("consent_template.read")
  async list() {
    return { consentTemplates: await this.consentTemplates.list() };
  }

  @Post("consent-templates")
  @Permissions("consent_template.manage")
  create(@Body() dto: CreateConsentTemplateDto, @CurrentUser() user: AuthUser) {
    return this.consentTemplates.create(dto, user);
  }

  @Patch("consent-templates/:id")
  @Permissions("consent_template.manage")
  update(@Param("id") id: string, @Body() dto: UpdateConsentTemplateDto, @CurrentUser() user: AuthUser) {
    return this.consentTemplates.update(id, dto, user);
  }

  @Post("consents/:id/sign-demo")
  @Permissions("consent_record.sign_demo")
  signDemo(@Param("id") id: string, @Body() dto: SignConsentDemoDto, @CurrentUser() user: AuthUser) {
    return this.consentTemplates.signDemo(id, dto, user);
  }

  @Post("consents/:id/review")
  @Permissions("consent_record.review")
  review(@Param("id") id: string, @Body() dto: ReviewConsentRecordDto, @CurrentUser() user: AuthUser) {
    return this.consentTemplates.review(id, dto, user);
  }
}
