import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { GuidelineKnowledgeSearchService } from "./guideline-knowledge-search.service";

@Controller("guidelines/knowledge-search")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GuidelineKnowledgeSearchController {
  constructor(private readonly searchService: GuidelineKnowledgeSearchService) {}

  @Get()
  @Permissions("guidelines.search")
  search(
    @Query("q") q: string | undefined,
    @Query("limit") limit: string | undefined,
    @CurrentUser() user: AuthUser
  ) {
    return this.searchService.search({ q, limit }, user);
  }
}
