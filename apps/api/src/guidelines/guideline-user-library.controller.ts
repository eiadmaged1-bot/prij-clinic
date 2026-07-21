import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { GuidelineUserLibraryService } from "./guideline-user-library.service";

class ArchiveGuidelineDto {
  @IsString()
  @MinLength(4)
  @MaxLength(500)
  reason!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(240)
  confirmation!: string;
}

@Controller("guidelines/user-library")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GuidelineUserLibraryController {
  constructor(private readonly library: GuidelineUserLibraryService) {}

  @Get("state")
  @Permissions("guidelines.read")
  state(@CurrentUser() user: AuthUser) {
    return this.library.state(user);
  }

  @Post("documents/:id/favorite")
  @Permissions("guidelines.read")
  favorite(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.library.favorite(id, user);
  }

  @Delete("documents/:id/favorite")
  @Permissions("guidelines.read")
  unfavorite(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.library.unfavorite(id, user);
  }

  @Post("documents/:id/opened")
  @Permissions("guidelines.read")
  opened(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.library.recordOpened(id, user);
  }

  @Post("documents/:id/archive")
  @Permissions("guidelines.delete_or_archive")
  archive(
    @Param("id") id: string,
    @Body() dto: ArchiveGuidelineDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.library.archive(id, dto, user);
  }

  @Post("documents/:id/restore")
  @Permissions("guidelines.delete_or_archive")
  restore(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.library.restore(id, user);
  }
}
