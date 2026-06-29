import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { GuidelinesService } from "./guidelines.service";

@Controller("guidelines")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GuidelinesController {
  constructor(private readonly guidelines: GuidelinesService) {}

  @Get("sources")
  @Permissions("guideline.read")
  sources(@CurrentUser() user: AuthUser) {
    return this.guidelines.listSources(user);
  }

  @Post("sources")
  @Permissions("guideline.manage")
  createSource(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.guidelines.createSource(body, user);
  }

  @Patch("sources/:id")
  @Permissions("guideline.manage")
  updateSource(@Param("id") id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.guidelines.updateSource(id, body, user);
  }

  @Get("documents")
  @Permissions("guideline.read")
  documents(@CurrentUser() user: AuthUser) {
    return this.guidelines.listDocuments(user);
  }

  @Get("documents/:id")
  @Permissions("guideline.read")
  document(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.guidelines.getDocument(id, user);
  }

  @Post("documents/:id/review")
  @Permissions("guideline.review")
  review(@Param("id") id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.guidelines.reviewDocument(id, body, user);
  }

  @Post("documents/:id/archive")
  @Permissions("guideline.manage")
  archive(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.guidelines.archiveDocument(id, user);
  }

  @Post("upload-demo-text")
  @Permissions("guideline.manage")
  uploadDemoText(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.guidelines.uploadDemoText(body, user);
  }

  @Post("reindex")
  @Permissions("guideline.manage")
  reindex(@CurrentUser() user: AuthUser) {
    return this.guidelines.reindex(user);
  }

  @Get("search")
  @Permissions("guideline.read")
  search(@Query("q") query: string | undefined, @CurrentUser() user: AuthUser) {
    return this.guidelines.search(query, user);
  }

  @Post("ask")
  @Permissions("guideline.read")
  ask(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.guidelines.ask(body, user);
  }

  @Get("query-logs")
  @Permissions("guideline.manage")
  queryLogs(@CurrentUser() user: AuthUser) {
    return this.guidelines.queryLogs(user);
  }
}
