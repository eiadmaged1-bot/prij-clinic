import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ProtocolReasonDto, UpdateProtocolAliasesDto, UpdateProtocolSourceDto, UpdateStructuredProtocolContentDto } from "./dto/editor-protocol.dto";
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

  @Get(":id/editor")
  @Permissions("protocol_atlas.manage")
  editor(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.atlas.getEditor(id, user);
  }

  @Patch(":id/source")
  @Permissions("protocol_atlas.manage")
  updateSource(@Param("id") id: string, @Body() dto: UpdateProtocolSourceDto, @CurrentUser() user: AuthUser) {
    return this.atlas.updateSource(id, dto, user);
  }

  @Patch(":id/aliases")
  @Permissions("protocol_atlas.manage")
  updateAliases(@Param("id") id: string, @Body() dto: UpdateProtocolAliasesDto, @CurrentUser() user: AuthUser) {
    return this.atlas.updateAliases(id, dto, user);
  }

  @Patch(":id/structured-content")
  @Permissions("protocol_atlas.manage")
  updateStructuredContent(@Param("id") id: string, @Body() dto: UpdateStructuredProtocolContentDto, @CurrentUser() user: AuthUser) {
    return this.atlas.updateStructuredContent(id, dto, user);
  }

  @Post(":id/request-verification")
  @Permissions("protocol_atlas.manage")
  requestVerification(@Param("id") id: string, @Body() dto: ProtocolReasonDto, @CurrentUser() user: AuthUser) {
    return this.atlas.requestVerification(id, dto, user);
  }

  @Post(":id/verify")
  @Permissions("protocol_atlas.manage")
  verify(@Param("id") id: string, @Body() dto: ProtocolReasonDto, @CurrentUser() user: AuthUser) {
    return this.atlas.verify(id, dto, user);
  }

  @Post(":id/retire")
  @Permissions("protocol_atlas.manage")
  retire(@Param("id") id: string, @Body() dto: ProtocolReasonDto, @CurrentUser() user: AuthUser) {
    return this.atlas.retire(id, dto, user);
  }
}
