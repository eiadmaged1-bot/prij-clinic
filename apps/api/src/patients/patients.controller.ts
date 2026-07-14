import { Body, Controller, Get, Header, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import {
  CreatePatientDto,
  DuplicatePatientCandidatesDto,
  CreateClinicalPhaseDto,
  CreateEstradiolResultDto,
  CreateFollicularMonitoringVisitDto,
  CreateInfertilityEpisodeDto,
  CreateOvulationInductionCycleDto,
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
  UpdateCycleAmhDto,
  UpdateClinicalPhaseDto,
  UpdatePatientDto
} from "./dto";
import { PatientsService } from "./patients.service";
import { PatientSearchService } from "./services/patient-search.service";
import { PatientLookupService } from "./services/patient-lookup.service";

@Controller("patients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService, private readonly search: PatientSearchService, private readonly lookup: PatientLookupService) {}

  @Post()
  @Permissions("patient.create")
  create(@Body() dto: CreatePatientDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.create(dto, user, idempotencyKey);
  }

  @Post("create-and-start-visit")
  @Permissions("patient.create", "encounter.create")
  createAndStartVisit(@Body() dto: CreatePatientDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.createAndStartVisit(dto, user, idempotencyKey);
  }

  @Get("duplicate-candidates")
  @Permissions("patient.read")
  duplicateCandidates(@Query() query: DuplicatePatientCandidatesDto, @CurrentUser() user: AuthUser) {
    return this.patients.duplicateCandidates(query, user);
  }

  @Get()
  @Permissions("patient.read")
  async list(
    @CurrentUser() user: AuthUser,
    @Query("q") query?: string,
    @Query("search") search?: string,
    @Query("mode") mode?: string,
    @Query("includeArchived") includeArchived?: string
  ) {
    return { patients: await this.search.list(user, { query: query ?? search, mode, includeArchived }) };
  }

  @Get(":id")
  @Permissions("patient.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.lookup.get(id, user);
  }

  @Get(":id/workspace-summary")
  @Header("Cache-Control", "private, no-store, max-age=0")
  @Permissions("patient.read")
  workspaceSummary(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.lookup.workspaceSummary(id, user);
  }

  @Get(":id/qr")
  @Permissions("patient.read")
  qr(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.qrInfo(id, user);
  }

  @Get(":id/qr-token")
  @Permissions("patient.read")
  qrToken(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.qrTokenInfo(id, user);
  }

  @Get(":id/timeline")
  @Permissions("patient.read")
  timeline(@Param("id") id: string, @Query("limit") limit: string | undefined, @Query("cursor") cursor: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.timeline(id, user, { limit, cursor });
  }

  @Get(":id/follow-up-hints")
  @Permissions("follow_up_hints.read")
  followUpHints(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.followUpHints(id, user);
  }

  @Get(":id/phases")
  @Permissions("patient.read")
  phases(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.listPhases(id, user);
  }

  @Post(":id/phases")
  @Permissions("encounter.create")
  createPhase(@Param("id") id: string, @Body() dto: CreateClinicalPhaseDto, @CurrentUser() user: AuthUser) {
    return this.patients.createPhase(id, dto, user);
  }

  @Patch(":id/phases/:phaseId")
  @Permissions("encounter.create")
  updatePhase(@Param("id") id: string, @Param("phaseId") phaseId: string, @Body() dto: UpdateClinicalPhaseDto, @CurrentUser() user: AuthUser) {
    return this.patients.updatePhase(id, phaseId, dto, user);
  }

  @Get(":id/infertility")
  @Permissions("encounter.read")
  infertility(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.patients.infertilityWorkspace(id, user);
  }

  @Post(":id/infertility/episodes")
  @Permissions("encounter.create")
  createInfertilityEpisode(@Param("id") id: string, @Body() dto: CreateInfertilityEpisodeDto, @CurrentUser() user: AuthUser) {
    return this.patients.createInfertilityEpisode(id, dto, user);
  }

  @Post(":id/infertility/cycles")
  @Permissions("encounter.create")
  createOvulationCycle(@Param("id") id: string, @Body() dto: CreateOvulationInductionCycleDto, @CurrentUser() user: AuthUser) {
    return this.patients.createOvulationCycle(id, dto, user);
  }

  @Patch(":id/infertility/cycles/:cycleId/amh")
  @Permissions("encounter.create")
  updateCycleAmh(@Param("id") id: string, @Param("cycleId") cycleId: string, @Body() dto: UpdateCycleAmhDto, @CurrentUser() user: AuthUser) {
    return this.patients.updateCycleAmh(id, cycleId, dto, user);
  }

  @Post(":id/infertility/monitoring-visits")
  @Permissions("encounter.create")
  createMonitoringVisit(@Param("id") id: string, @Body() dto: CreateFollicularMonitoringVisitDto, @CurrentUser() user: AuthUser) {
    return this.patients.createMonitoringVisit(id, dto, user);
  }

  @Post(":id/infertility/e2-results")
  @Permissions("encounter.create")
  createEstradiolResult(@Param("id") id: string, @Body() dto: CreateEstradiolResultDto, @CurrentUser() user: AuthUser) {
    return this.patients.createEstradiolResult(id, dto, user);
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
  createOperationHistory(@Param("id") id: string, @Body() dto: PatientOperationHistoryDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.createOperationHistory(id, dto, user, idempotencyKey);
  }

  @Post(":id/medication-history")
  @Permissions("encounter.create")
  createMedicationHistory(@Param("id") id: string, @Body() dto: PatientMedicationHistoryDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.createMedicationHistory(id, dto, user, idempotencyKey);
  }

  @Post(":id/investigation-history")
  @Permissions("encounter.create")
  createInvestigationHistory(@Param("id") id: string, @Body() dto: PatientInvestigationHistoryDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.createInvestigationHistory(id, dto, user, idempotencyKey);
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
  createPrescription(@Param("id") id: string, @Body() dto: PatientContextPrescriptionDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.createPrescription(id, dto, user, idempotencyKey);
  }

  @Post(":id/investigations")
  @Permissions("investigation.create")
  createInvestigation(@Param("id") id: string, @Body() dto: PatientContextInvestigationDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.patients.createInvestigation(id, dto, user, idempotencyKey);
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
