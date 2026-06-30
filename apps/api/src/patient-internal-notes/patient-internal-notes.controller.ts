import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ArchivePatientInternalNoteDto, CreatePatientInternalNoteDto, UpdatePatientInternalNoteDto } from "./dto";
import { PatientInternalNotesService } from "./patient-internal-notes.service";

@Controller("patients/:patientId/internal-notes")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientInternalNotesController {
  constructor(private readonly notes: PatientInternalNotesService) {}

  @Get()
  @Permissions("patient_internal_note.read")
  async list(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { patientInternalNotes: await this.notes.list(patientId, user) };
  }

  @Post()
  @Permissions("patient_internal_note.create")
  create(@Param("patientId") patientId: string, @Body() dto: CreatePatientInternalNoteDto, @CurrentUser() user: AuthUser) {
    return this.notes.create(patientId, dto, user);
  }

  @Patch(":noteId")
  @Permissions("patient_internal_note.create")
  update(@Param("patientId") patientId: string, @Param("noteId") noteId: string, @Body() dto: UpdatePatientInternalNoteDto, @CurrentUser() user: AuthUser) {
    return this.notes.update(patientId, noteId, dto, user);
  }

  @Post(":noteId/archive")
  @Permissions("patient_internal_note.archive")
  archive(@Param("patientId") patientId: string, @Param("noteId") noteId: string, @Body() dto: ArchivePatientInternalNoteDto, @CurrentUser() user: AuthUser) {
    return this.notes.archive(patientId, noteId, dto, user);
  }
}
