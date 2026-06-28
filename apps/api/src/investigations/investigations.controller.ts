import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CreateInvestigationOrderDto, UpdateInvestigationOrderStatusDto } from "./dto";
import { InvestigationsService } from "./investigations.service";

@Controller("investigations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvestigationsController {
  constructor(private readonly investigations: InvestigationsService) {}

  @Post("orders")
  @Permissions("investigation.create")
  createOrder(@Body() dto: CreateInvestigationOrderDto, @CurrentUser() user: AuthUser) {
    return this.investigations.createOrder(dto, user);
  }

  @Get("orders")
  @Permissions("investigation.read")
  async listOrders(@CurrentUser() user: AuthUser) {
    return { investigationOrders: await this.investigations.listOrders(user) };
  }

  @Get("orders/:id")
  @Permissions("investigation.read")
  getOrder(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.getOrder(id, user);
  }

  @Patch("orders/:id/status")
  @Permissions("investigation.update")
  updateOrderStatus(
    @Param("id") id: string,
    @Body() dto: UpdateInvestigationOrderStatusDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.investigations.updateOrderStatus(id, dto.status, user);
  }
}
