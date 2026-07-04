import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import {
  CreatePatientDto,
  PatientContextAppointmentDto,
  PatientContextConsentDto,
  PatientContextEncounterDto,
  PatientContextInvestigationDto,
  PatientContextInvoiceDto,
  PatientContextPaymentDto,
  PatientContextPrescriptionDto,
  PatientContextQueueDto,
  PatientContextReportDto,
  PatientContextUltrasoundDto,
  PatientHistorySheetDto,
  PatientInvestigationHistoryDto,
  PatientMedicationHistoryDto,
  PatientOperationHistoryDto,
  UpdatePatientDto
} from "./dto";
import { PatientsService } from "./patients.service";

@Controller("patients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post()
  @Permissions("patient.create")
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: AuthUser) {
    return this.patients.create(dto, user);
  }

  @Get()
  @Permissions("patient.read")
  async list(@CurrentUser() user: AuthUser) {
    return { patients: await this.patients.list(user) };
  }

  @Get(":id")
  @Permissions("patient.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.get(id, user);
  }

  @Get(":id/timeline")
  @Permissions("patient.read")
  timeline(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.timeline(id, user);
  }

  @Get(":id/follow-up-hints")
  @Permissions("follow_up_hints.read")
  followUpHints(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.followUpHints(id, user);
  }

  @Get(":id/history-sheets")
  @Permissions("patient.read")
  historySheets(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.historySheets(id, user);
  }

  @Post(":id/history-sheets")
  @Permissions("encounter.create")
  createHistorySheet(@Param("id") id: string, @Body() dto: PatientHistorySheetDto, @CurrentUser() user: AuthUser) {
    return this.patients.createHistorySheet(id, dto, user);
  }

  @Patch(":id/history-sheets/:historySheetId")
  @Permissions("encounter.create")
  updateHistorySheet(@Param("id") id: string, @Param("historySheetId") historySheetId: string, @Body() dto: PatientHistorySheetDto, @CurrentUser() user: AuthUser) {
    return this.patients.updateHistorySheet(id, historySheetId, dto, user);
  }

  @Post(":id/operation-history")
  @Permissions("encounter.create")
  createOperationHistory(@Param("id") id: string, @Body() dto: PatientOperationHistoryDto, @CurrentUser() user: AuthUser) {
    return this.patients.createOperationHistory(id, dto, user);
  }

  @Post(":id/medication-history")
  @Permissions("encounter.create")
  createMedicationHistory(@Param("id") id: string, @Body() dto: PatientMedicationHistoryDto, @CurrentUser() user: AuthUser) {
    return this.patients.createMedicationHistory(id, dto, user);
  }

  @Post(":id/investigation-history")
  @Permissions("encounter.create")
  createInvestigationHistory(@Param("id") id: string, @Body() dto: PatientInvestigationHistoryDto, @CurrentUser() user: AuthUser) {
    return this.patients.createInvestigationHistory(id, dto, user);
  }

  @Post(":id/appointments")
  @Permissions("appointment.manage")
  createAppointment(@Param("id") id: string, @Body() dto: PatientContextAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.patients.createAppointment(id, dto, user);
  }

  @Post(":id/queue-check-in")
  @Permissions("queue.manage")
  checkIn(@Param("id") id: string, @Body() dto: PatientContextQueueDto, @CurrentUser() user: AuthUser) {
    return this.patients.checkIn(id, dto, user);
  }

  @Post(":id/encounters")
  @Permissions("encounter.create")
  createEncounter(@Param("id") id: string, @Body() dto: PatientContextEncounterDto, @CurrentUser() user: AuthUser) {
    return this.patients.createEncounter(id, dto, user);
  }

  @Post(":id/prescriptions")
  @Permissions("prescription.create")
  createPrescription(@Param("id") id: string, @Body() dto: PatientContextPrescriptionDto, @CurrentUser() user: AuthUser) {
    return this.patients.createPrescription(id, dto, user);
  }

  @Post(":id/investigations")
  @Permissions("investigation.create")
  createInvestigation(@Param("id") id: string, @Body() dto: PatientContextInvestigationDto, @CurrentUser() user: AuthUser) {
    return this.patients.createInvestigation(id, dto, user);
  }

  @Post(":id/reports")
  @Permissions("report.upload")
  createReport(@Param("id") id: string, @Body() dto: PatientContextReportDto, @CurrentUser() user: AuthUser) {
    return this.patients.createReport(id, dto, user);
  }

  @Post(":id/ultrasounds")
  @Permissions("ob_ultrasound.manage")
  createUltrasound(@Param("id") id: string, @Body() dto: PatientContextUltrasoundDto, @CurrentUser() user: AuthUser) {
    return this.patients.createUltrasound(id, dto, user);
  }

  @Post(":id/invoices")
  @Permissions("billing.manage")
  createInvoice(@Param("id") id: string, @Body() dto: PatientContextInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.patients.createInvoice(id, dto, user);
  }

  @Post(":id/payments")
  @Permissions("payment.manage")
  createPayment(@Param("id") id: string, @Body() dto: PatientContextPaymentDto, @CurrentUser() user: AuthUser) {
    return this.patients.createPayment(id, dto, user);
  }

  @Post(":id/consents")
  @Permissions("patient.consent_manage")
  createConsent(@Param("id") id: string, @Body() dto: PatientContextConsentDto, @CurrentUser() user: AuthUser) {
    return this.patients.createConsent(id, dto, user);
  }

  @Patch(":id")
  @Permissions("patient.update")
  update(@Param("id") id: string, @Body() dto: UpdatePatientDto, @CurrentUser() user: AuthUser) {
    return this.patients.update(id, dto, user);
  }
}
