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
  @Permissions("report.upload")
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.create(dto, user);
  }

  @Get()
  @Permissions("report.read")
  async list(@CurrentUser() user: AuthUser) {
    return { reports: await this.reports.list(user) };
  }

  @Get(":id")
  @Permissions("report.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.reports.get(id, user);
  }

  @Patch(":id")
  @Permissions("report.update")
  update(@Param("id") id: string, @Body() dto: UpdateReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.update(id, dto, user);
  }

  @Patch(":id/review")
  @Permissions("report.review")
  review(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.reports.review(id, user);
  }
}
