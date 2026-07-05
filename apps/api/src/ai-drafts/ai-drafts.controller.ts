import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { AiDraftsService } from "./ai-drafts.service";
import { CreateAiDraftDto, GenerateAssistantDraftDto, ReviewAiDraftDto } from "./dto";

@Controller("ai-drafts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiDraftsController {
  constructor(private readonly aiDrafts: AiDraftsService) {}

  @Post()
  @Permissions("ai_draft.request")
  create(@Body() dto: CreateAiDraftDto, @CurrentUser() user: AuthUser) {
    return this.aiDrafts.create(dto, user);
  }

  @Get()
  @Permissions("ai_draft.read")
  async list(@CurrentUser() user: AuthUser) {
    return { aiDrafts: await this.aiDrafts.list(user) };
  }

  @Get("safety-status")
  @Permissions("ai_draft.read")
  safetyStatus() {
    return this.aiDrafts.safetyStatus();
  }

  @Get("patients/:patientId/assistant")
  @Permissions("ai_draft.read")
  patientAssistant(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return this.aiDrafts.patientAssistant(patientId, user);
  }

  @Get("patients/:patientId/search")
  @Permissions("ai_draft.read")
  patientSearch(@Param("patientId") patientId: string, @Query("query") query: string | undefined, @CurrentUser() user: AuthUser) {
    return this.aiDrafts.searchPatientFile(patientId, query ?? "", user);
  }

  @Post("patients/:patientId/search")
  @Permissions("ai_draft.read")
  patientSearchPost(@Param("patientId") patientId: string, @Body() body: { query?: string }, @CurrentUser() user: AuthUser) {
    return this.aiDrafts.searchPatientFile(patientId, body.query ?? "", user);
  }

  @Post("patients/:patientId/generate")
  @Permissions("ai_draft.request")
  generatePatientDraft(@Param("patientId") patientId: string, @Body() dto: GenerateAssistantDraftDto, @CurrentUser() user: AuthUser) {
    return this.aiDrafts.generateAssistantDraft(patientId, dto, user);
  }

  @Get(":id")
  @Permissions("ai_draft.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.aiDrafts.get(id, user);
  }

  @Patch(":id/review")
  @Permissions("ai_draft.review")
  review(@Param("id") id: string, @Body() dto: ReviewAiDraftDto, @CurrentUser() user: AuthUser) {
    return this.aiDrafts.review(id, dto, user);
  }
}
