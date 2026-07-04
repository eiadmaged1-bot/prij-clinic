import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from "./dto";

@Controller("appointments")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  @Permissions("appointment.manage")
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.appointments.create(dto, user);
  }

  @Get()
  @Permissions("appointment.read")
  async list(@CurrentUser() user: AuthUser) {
    return { appointments: await this.appointments.list(user) };
  }

  @Get("calendar")
  @Permissions("appointment.read")
  async calendar(@Query("date") date: string, @CurrentUser() user: AuthUser, @Query("doctorId") doctorId?: string) {
    return { appointments: await this.appointments.calendar(date, user, doctorId) };
  }

  @Get(":id")
  @Permissions("appointment.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.appointments.get(id, user);
  }

  @Patch(":id/status")
  @Permissions("appointment.manage")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.appointments.updateStatus(id, dto, user);
  }
}
