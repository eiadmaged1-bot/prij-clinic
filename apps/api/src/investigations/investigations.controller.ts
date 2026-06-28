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
  @Permissions("investigations.manage")
  createOrder(@Body() dto: CreateInvestigationOrderDto, @CurrentUser() user: AuthUser) {
    return this.investigations.createOrder(dto, user);
  }

  @Get("orders")
  @Permissions("investigations.read")
  async listOrders() {
    return { investigationOrders: await this.investigations.listOrders() };
  }

  @Get("orders/:id")
  @Permissions("investigations.read")
  getOrder(@Param("id") id: string) {
    return this.investigations.getOrder(id);
  }

  @Patch("orders/:id/status")
  @Permissions("investigations.manage")
  updateOrderStatus(
    @Param("id") id: string,
    @Body() dto: UpdateInvestigationOrderStatusDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.investigations.updateOrderStatus(id, dto.status, user);
  }
}
