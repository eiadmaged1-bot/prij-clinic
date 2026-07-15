import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { RequireRoles } from "../rbac/require-roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  @Permissions("dashboard.read")
  summary(@CurrentUser() user: AuthUser) {
    return this.dashboard.summary(user);
  }

  @Get("owner-control")
  @UseGuards(RolesGuard)
  @RequireRoles("Owner")
  @Permissions("dashboard.read")
  ownerControl(@CurrentUser() user: AuthUser, @Query("date") date?: string) {
    return this.dashboard.ownerControl(user, date);
  }
}
