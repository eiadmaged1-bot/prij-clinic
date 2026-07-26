import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreateEncounterDto, SignEncounterDto, UpdateEncounterDto, VoidEncounterDto } from "./dto";
import { EncountersService } from "./encounters.service";

@Controller("encounters")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EncountersController {
  constructor(private readonly encounters: EncountersService) {}

  @Post()
  @Permissions("encounter.create")
  create(@Body() dto: CreateEncounterDto, @CurrentUser() user: AuthUser) {
    return this.encounters.create(dto, user);
  }

  @Get()
  @Permissions("encounter.read")
  async list(@CurrentUser() user: AuthUser) {
    return { encounters: await this.encounters.list(user) };
  }

  @Get(":id")
  @Permissions("encounter.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.encounters.get(id, user);
  }

  @Patch(":id")
  @Permissions("encounter.update_own")
  update(@Param("id") id: string, @Body() dto: UpdateEncounterDto, @CurrentUser() user: AuthUser) {
    return this.encounters.update(id, dto, user);
  }

  @Patch(":id/sign")
  @Permissions("encounter.sign")
  sign(@Param("id") id: string, @Body() dto: SignEncounterDto, @CurrentUser() user: AuthUser) {
    return this.encounters.sign(id, dto.patientId, user);
  }

  @Patch(":id/void")
  @Permissions("encounter.void")
  void(@Param("id") id: string, @Body() dto: VoidEncounterDto, @CurrentUser() user: AuthUser) {
    return this.encounters.voidEncounter(id, user.id, dto.reason, user);
  }
}
