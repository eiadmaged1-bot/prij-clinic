import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { DoctorVisitService } from "./doctor-visit.service";
import { CreateFollowUpDto, StartDoctorVisitDto, UpdateDoctorVisitDto } from "./dto";

@Controller("patients/:patientId/doctor-visit")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DoctorVisitController {
  constructor(private readonly visits: DoctorVisitService) {}

  @Post("start")
  @Permissions("encounter.create")
  start(@Param("patientId") patientId: string, @Body() dto: StartDoctorVisitDto, @CurrentUser() user: AuthUser) {
    return this.visits.start(patientId, dto, user);
  }

  @Get("current")
  @Permissions("encounter.read")
  current(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return this.visits.current(patientId, user);
  }

  @Patch(":encounterId")
  @Permissions("encounter.update_own")
  update(@Param("patientId") patientId: string, @Param("encounterId") encounterId: string, @Body() dto: UpdateDoctorVisitDto, @CurrentUser() user: AuthUser) {
    return this.visits.update(patientId, encounterId, dto, user);
  }

  @Post(":encounterId/follow-up")
  @Permissions("patient_task.create")
  followUp(@Param("patientId") patientId: string, @Param("encounterId") encounterId: string, @Body() dto: CreateFollowUpDto, @CurrentUser() user: AuthUser) {
    return this.visits.createFollowUp(patientId, encounterId, dto, user);
  }

  @Get(":encounterId/packet")
  @Permissions("patient.read", "encounter.read")
  packet(@Param("patientId") patientId: string, @Param("encounterId") encounterId: string, @CurrentUser() user: AuthUser) {
    return this.visits.packet(patientId, encounterId, user);
  }
}
