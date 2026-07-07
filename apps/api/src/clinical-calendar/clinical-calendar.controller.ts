import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ClinicalCalendarService } from "./clinical-calendar.service";

@Controller("clinical-calendar")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicalCalendarController {
  constructor(private readonly calendar: ClinicalCalendarService) {}

  @Get("edd")
  @Permissions("calculator.read")
  async edd(@Query("month") month: string | undefined, @CurrentUser() user: AuthUser) {
    return { entries: await this.calendar.edd(month, user) };
  }
}
