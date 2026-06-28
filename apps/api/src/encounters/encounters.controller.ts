import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreateEncounterDto, UpdateEncounterDto } from "./dto";
import { EncountersService } from "./encounters.service";

@Controller("encounters")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EncountersController {
  constructor(private readonly encounters: EncountersService) {}

  @Post()
  @Permissions("encounters.manage")
  create(@Body() dto: CreateEncounterDto, @CurrentUser() user: AuthUser) {
    return this.encounters.create(dto, user);
  }

  @Get()
  @Permissions("encounters.read")
  async list() {
    return { encounters: await this.encounters.list() };
  }

  @Get(":id")
  @Permissions("encounters.read")
  get(@Param("id") id: string) {
    return this.encounters.get(id);
  }

  @Patch(":id")
  @Permissions("encounters.manage")
  update(@Param("id") id: string, @Body() dto: UpdateEncounterDto, @CurrentUser() user: AuthUser) {
    return this.encounters.update(id, dto, user);
  }

  @Patch(":id/sign")
  @Permissions("encounters.manage")
  sign(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.encounters.sign(id, user);
  }
}
