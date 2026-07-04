import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { SearchService } from "./search.service";

@Controller("search")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get("live")
  @Permissions("search.global")
  live(@Query("q") q = "", @Query("scope") scope: string | undefined, @CurrentUser() user: AuthUser) {
    return this.search.live(q, user, scope);
  }
}
