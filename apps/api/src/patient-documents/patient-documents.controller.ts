import { Body, Controller, Get, Param, Patch, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { ArchivePatientDocumentDto, CreatePatientDocumentDto, ReviewPatientDocumentDto, UpdatePatientDocumentDto, UploadPatientDocumentDto, VoidPatientDocumentDto } from "./dto";
import { PatientDocumentsService } from "./patient-documents.service";

type UploadedPatientDocumentFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

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

  @Post("upload")
  @Permissions("patient_document.create")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024 } }))
  upload(
    @Param("patientId") patientId: string,
    @UploadedFile() file: UploadedPatientDocumentFile,
    @Body() dto: UploadPatientDocumentDto,
    @CurrentUser() user: AuthUser,
    @Req() request: { requestId?: string }
  ) {
    return this.documents.createFromUpload(patientId, file, dto, user, request.requestId);
  }

  @Get(":documentId/download")
  @Permissions("patient_document.read")
  async download(@Param("patientId") patientId: string, @Param("documentId") documentId: string, @CurrentUser() user: AuthUser, @Res() response: any) {
    const download = await this.documents.download(patientId, documentId, user);
    response.setHeader("Content-Type", download.mimeType);
    response.setHeader("Content-Disposition", `attachment; filename="${download.filename}"`);
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "private, no-store");
    response.status(200).send(download.buffer);
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
