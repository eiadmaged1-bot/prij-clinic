import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CaseLibraryService } from "./case-library.service";

@Controller("doctor/case-library")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CaseLibraryController {
  constructor(private readonly cases: CaseLibraryService) {}

  @Get()
  @Permissions("clinical_case_library.view_own")
  list(@Query() query: Record<string, string | undefined>, @CurrentUser() user: AuthUser) {
    return this.cases.list(query, user);
  }

  @Get("doctors")
  @Permissions("clinical_case_library.view_own")
  doctors(@CurrentUser() user: AuthUser) {
    return this.cases.doctors(user);
  }

  @Get("filters")
  @Permissions("clinical_case_library.view_own")
  filters(@CurrentUser() user: AuthUser) {
    return this.cases.filters(user);
  }
}
