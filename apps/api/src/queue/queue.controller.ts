import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CheckInDto, QueueCancelDto } from "./dto";
import { QueueService } from "./queue.service";

@Controller("queue")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Post("check-in")
  @Permissions("queue.manage")
  checkIn(@Body() dto: CheckInDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.queue.checkIn(dto, user, idempotencyKey);
  }

  @Get("today")
  @Permissions("queue.read")
  async today(@CurrentUser() user: AuthUser) {
    return { queueTickets: await this.queue.today(user) };
  }

  @Patch(":id/call")
  @Permissions("queue.status_update")
  call(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.queue.call(id, user);
  }

  @Patch(":id/select")
  @Permissions("doctor_queue.select_patient")
  selectForDoctor(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.queue.selectForDoctor(id, user);
  }

  @Patch(":id/complete")
  @Permissions("queue.status_update")
  complete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.queue.complete(id, user);
  }

  @Patch(":id/cancel")
  @Permissions("queue.status_update")
  cancel(@Param("id") id: string, @Body() dto: QueueCancelDto, @CurrentUser() user: AuthUser) {
    return this.queue.cancel(id, dto, user);
  }
}
