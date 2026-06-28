import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreateReportDto, UpdateReportDto } from "./dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @Permissions("reports.manage")
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.create(dto, user);
  }

  @Get()
  @Permissions("reports.read")
  async list() {
    return { reports: await this.reports.list() };
  }

  @Get(":id")
  @Permissions("reports.read")
  get(@Param("id") id: string) {
    return this.reports.get(id);
  }

  @Patch(":id")
  @Permissions("reports.manage")
  update(@Param("id") id: string, @Body() dto: UpdateReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.update(id, dto, user);
  }

  @Patch(":id/review")
  @Permissions("reports.manage")
  review(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.reports.review(id, user);
  }
}
