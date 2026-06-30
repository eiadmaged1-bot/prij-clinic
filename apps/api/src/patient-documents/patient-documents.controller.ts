import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ArchivePatientDocumentDto, CreatePatientDocumentDto, ReviewPatientDocumentDto, UpdatePatientDocumentDto, VoidPatientDocumentDto } from "./dto";
import { PatientDocumentsService } from "./patient-documents.service";

@Controller("patients/:patientId/documents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatientDocumentsController {
  constructor(private readonly documents: PatientDocumentsService) {}

  @Get()
  @Permissions("patient_document.read")
  async list(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return { patientDocuments: await this.documents.list(patientId, user) };
  }

  @Post()
  @Permissions("patient_document.create")
  create(@Param("patientId") patientId: string, @Body() dto: CreatePatientDocumentDto, @CurrentUser() user: AuthUser) {
    return this.documents.create(patientId, dto, user);
  }

  @Get(":documentId")
  @Permissions("patient_document.read")
  get(@Param("patientId") patientId: string, @Param("documentId") documentId: string, @CurrentUser() user: AuthUser) {
    return this.documents.get(patientId, documentId, user);
  }

  @Patch(":documentId")
  @Permissions("patient_document.create")
  update(@Param("patientId") patientId: string, @Param("documentId") documentId: string, @Body() dto: UpdatePatientDocumentDto, @CurrentUser() user: AuthUser) {
    return this.documents.update(patientId, documentId, dto, user);
  }

  @Post(":documentId/review")
  @Permissions("patient_document.review")
  review(@Param("patientId") patientId: string, @Param("documentId") documentId: string, @Body() _dto: ReviewPatientDocumentDto, @CurrentUser() user: AuthUser) {
    return this.documents.review(patientId, documentId, user);
  }

  @Post(":documentId/archive")
  @Permissions("patient_document.archive")
  archive(@Param("patientId") patientId: string, @Param("documentId") documentId: string, @Body() dto: ArchivePatientDocumentDto, @CurrentUser() user: AuthUser) {
    return this.documents.archive(patientId, documentId, dto, user);
  }

  @Post(":documentId/void")
  @Permissions("patient_document.void")
  void(@Param("patientId") patientId: string, @Param("documentId") documentId: string, @Body() dto: VoidPatientDocumentDto, @CurrentUser() user: AuthUser) {
    return this.documents.void(patientId, documentId, dto, user);
  }
}
