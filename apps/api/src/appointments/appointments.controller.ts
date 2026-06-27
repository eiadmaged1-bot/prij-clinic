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
  @Permissions("appointments.manage")
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.appointments.create(dto, user);
  }

  @Get()
  @Permissions("appointments.read")
  async list() {
    return { appointments: await this.appointments.list() };
  }

  @Get("calendar")
  @Permissions("appointments.read")
  async calendar(@Query("date") date: string, @Query("doctorId") doctorId?: string) {
    return { appointments: await this.appointments.calendar(date, doctorId) };
  }

  @Get(":id")
  @Permissions("appointments.read")
  get(@Param("id") id: string) {
    return this.appointments.get(id);
  }

  @Patch(":id/status")
  @Permissions("appointments.manage")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.appointments.updateStatus(id, dto.status, user);
  }
}
