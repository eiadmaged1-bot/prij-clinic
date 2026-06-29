import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { SearchProtocolsDto } from "./dto/search-protocols.dto";
import { UpdateProtocolStatusDto } from "./dto/update-protocol-status.dto";
import { ProtocolAtlasService } from "./protocol-atlas.service";

@Controller("protocol-atlas")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProtocolAtlasController {
  constructor(private readonly atlas: ProtocolAtlasService) {}

  @Get()
  @Permissions("protocol_atlas.read")
  async list(@CurrentUser() user: AuthUser) {
    return { protocols: await this.atlas.list(user) };
  }

  @Get("groups")
  @Permissions("protocol_atlas.read")
  async groups() {
    return { groups: await this.atlas.groups() };
  }

  @Get("by-code/:code")
  @Permissions("protocol_atlas.read")
  byCode(@Param("code") code: string, @CurrentUser() user: AuthUser) {
    return this.atlas.getByCode(code, user);
  }

  @Get(":id")
  @Permissions("protocol_atlas.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.atlas.get(id, user);
  }

  @Post("search")
  @Permissions("protocol_atlas.read")
  async search(@Body() dto: SearchProtocolsDto, @CurrentUser() user: AuthUser) {
    return { protocols: await this.atlas.search(dto, user) };
  }

  @Patch(":id/status")
  @Permissions("protocol_atlas.manage")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateProtocolStatusDto, @CurrentUser() user: AuthUser) {
    return this.atlas.updateStatus(id, dto, user);
  }
}
