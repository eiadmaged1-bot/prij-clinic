import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { AiDraftsService } from "./ai-drafts.service";
import { CreateAiDraftDto, ReviewAiDraftDto } from "./dto";

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
