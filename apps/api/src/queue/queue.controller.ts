import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CheckInDto } from "./dto";
import { QueueService } from "./queue.service";

@Controller("queue")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Post("check-in")
  @Permissions("queue.manage")
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: AuthUser) {
    return this.queue.checkIn(dto, user);
  }

  @Get("today")
  @Permissions("queue.read")
  async today() {
    return { queueTickets: await this.queue.today() };
  }

  @Patch(":id/call")
  @Permissions("queue.manage")
  call(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.queue.call(id, user);
  }

  @Patch(":id/complete")
  @Permissions("queue.manage")
  complete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.queue.complete(id, user);
  }

  @Patch(":id/cancel")
  @Permissions("queue.manage")
  cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.queue.cancel(id, user);
  }
}
