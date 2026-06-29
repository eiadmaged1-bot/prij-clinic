import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { AiManagementService } from "./ai-management.service";
import { CreateManagementSnapshotDto } from "./dto/create-management-snapshot.dto";
import { ReviewManagementSnapshotDto } from "./dto/review-management-snapshot.dto";
import { SaveMemoryDto } from "./dto/save-memory.dto";

@Controller("ai-management")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiManagementController {
  constructor(private readonly aiManagement: AiManagementService) {}

  @Post("snapshots")
  @Permissions("ai_management.request")
  create(@Body() dto: CreateManagementSnapshotDto, @CurrentUser() user: AuthUser) {
    return this.aiManagement.create(dto, user);
  }

  @Get("snapshots")
  @Permissions("ai_management.read")
  async list(@Query("patientId") patientId: string | undefined, @CurrentUser() user: AuthUser) {
    return { snapshots: await this.aiManagement.list(patientId, user) };
  }

  @Get("snapshots/:id")
  @Permissions("ai_management.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.aiManagement.get(id, user);
  }

  @Post("snapshots/:id/review")
  @Permissions("ai_management.review")
  review(@Param("id") id: string, @Body() dto: ReviewManagementSnapshotDto, @CurrentUser() user: AuthUser) {
    return this.aiManagement.review(id, dto, user);
  }

  @Post("snapshots/:id/save-memory")
  @Permissions("ai_management.memory_save")
  saveMemory(@Param("id") id: string, @Body() dto: SaveMemoryDto, @CurrentUser() user: AuthUser) {
    return this.aiManagement.saveMemory(id, dto, user);
  }
}
