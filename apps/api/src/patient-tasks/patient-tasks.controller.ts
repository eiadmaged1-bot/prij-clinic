import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CancelPatientTaskDto, CreatePatientTaskDto, UpdatePatientTaskDto } from "./dto";
import { PatientTasksService } from "./patient-tasks.service";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientTasksController {
  constructor(private readonly tasks: PatientTasksService) {}

  @Get("patient-tasks")
  @Permissions("patient_task.read")
  async list(@CurrentUser() user: AuthUser) {
    return { patientTasks: await this.tasks.list(user) };
  }

  @Post("patient-tasks")
  @Permissions("patient_task.create")
  create(@Body() dto: CreatePatientTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasks.create(dto, user);
  }

  @Patch("patient-tasks/:id")
  @Permissions("patient_task.update")
  update(@Param("id") id: string, @Body() dto: UpdatePatientTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasks.update(id, dto, user);
  }

  @Post("patient-tasks/:id/complete")
  @Permissions("patient_task.update")
  complete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.tasks.complete(id, user);
  }

  @Post("patient-tasks/:id/cancel")
  @Permissions("patient_task.update")
  cancel(@Param("id") id: string, @Body() dto: CancelPatientTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasks.cancel(id, dto, user);
  }

  @Get("patients/:patientId/tasks")
  @Permissions("patient_task.read")
  async listForPatient(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { patientTasks: await this.tasks.listForPatient(patientId, user) };
  }
}
