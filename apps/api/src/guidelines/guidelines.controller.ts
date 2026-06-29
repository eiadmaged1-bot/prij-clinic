import { Body, Controller, Get, Param, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { AskGuidelineDto } from "./dto/ask-guideline.dto";
import { CreateGuidelineSourceDto } from "./dto/create-guideline-source.dto";
import { FileAccessSettingsDto } from "./dto/file-access-settings.dto";
import { ImportUrlDto } from "./dto/import-url.dto";
import { ReviewGuidelineDto } from "./dto/review-guideline.dto";
import { SearchGuidelinesDto } from "./dto/search-guidelines.dto";
import { UpdateCheckDto } from "./dto/update-check.dto";
import { UpdateGuidelineSourceDto } from "./dto/update-guideline-source.dto";
import { UploadGuidelineDto } from "./dto/upload-guideline.dto";
import { GuidelinesService } from "./guidelines.service";

type UploadedGuidelineFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@Controller("guidelines")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GuidelinesController {
  constructor(private readonly guidelines: GuidelinesService) {}

  @Get("sources")
  @Permissions("guidelines.read")
  sources() {
    return this.guidelines.listSources();
  }

  @Post("sources")
  @Permissions("guidelines.manage_sources")
  createSource(@Body() dto: CreateGuidelineSourceDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.createSource(dto, user);
  }

  @Patch("sources/:id")
  @Permissions("guidelines.manage_sources")
  updateSource(@Param("id") id: string, @Body() dto: UpdateGuidelineSourceDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.updateSource(id, dto, user);
  }

  @Post("sources/:id/check-updates")
  @Permissions("guidelines.import")
  checkSourceUpdates(@Param("id") id: string, @Body() dto: UpdateCheckDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.checkUpdates({ sourceId: id, url: dto.url, user });
  }

  @Get("documents")
  @Permissions("guidelines.read")
  documents(@CurrentUser() user: AuthUser) {
    return this.guidelines.listDocuments(user);
  }

  @Get("documents/:id")
  @Permissions("guidelines.read")
  document(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.guidelines.getDocument(id, user);
  }

  @Patch("documents/:id")
  @Permissions("guidelines.review")
  updateDocument(@Param("id") id: string, @Body() dto: Partial<UploadGuidelineDto>, @CurrentUser() user: AuthUser) {
    return this.guidelines.updateDocument(id, dto, user);
  }

  @Get("documents/:id/view")
  async viewDocument(@Param("id") id: string, @CurrentUser() user: AuthUser, @Res() response: Response) {
    const file = await this.guidelines.viewDocumentFile(id, user);
    response.setHeader("content-type", file.mimeType);
    response.setHeader("content-disposition", `${file.disposition}; filename="${file.fileName}"`);
    response.setHeader("x-guideline-vault", "application-streamed");
    response.send(file.buffer);
  }

  @Get("documents/:id/download")
  async downloadDocument(@Param("id") id: string, @CurrentUser() user: AuthUser, @Res() response: Response) {
    const file = await this.guidelines.downloadDocumentFile(id, user);
    response.setHeader("content-type", file.mimeType);
    response.setHeader("content-disposition", `${file.disposition}; filename="${file.fileName}"`);
    response.setHeader("x-guideline-vault", "application-streamed");
    response.send(file.buffer);
  }

  @Patch("documents/:id/file-access-settings")
  updateFileAccessSettings(@Param("id") id: string, @Body() dto: FileAccessSettingsDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.updateFileAccessSettings(id, dto, user);
  }

  @Post("documents/:id/review")
  @Permissions("guidelines.review")
  reviewDocument(@Param("id") id: string, @Body() dto: ReviewGuidelineDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.reviewDocument(id, dto, user);
  }

  @Post("documents/:id/archive")
  @Permissions("guidelines.delete_or_archive")
  archiveDocument(@Param("id") id: string, @Body() dto: ReviewGuidelineDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.archiveDocument(id, dto, user);
  }

  @Post("upload")
  @Permissions("guidelines.upload")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(@UploadedFile() file: UploadedGuidelineFile, @Body() dto: UploadGuidelineDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.upload(file, dto, user);
  }

  @Post("import-url")
  @Permissions("guidelines.import")
  importUrl(@Body() dto: ImportUrlDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.importUrl(dto, user);
  }

  @Post("documents/:id/reindex")
  @Permissions("guidelines.import")
  reindex(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.guidelines.reindex(id, user);
  }

  @Get("search")
  @Permissions("guidelines.search")
  search(@Query() query: SearchGuidelinesDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.search(query, user, "SEARCH_ONLY");
  }

  @Post("ask")
  @Permissions("guidelines.search")
  ask(@Body() dto: AskGuidelineDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.ask(dto, user);
  }

  @Get("import-jobs")
  @Permissions("guidelines.import")
  importJobs() {
    return this.guidelines.importJobs();
  }

  @Get("update-checks")
  @Permissions("guidelines.import")
  updateChecks() {
    return this.guidelines.updateChecks();
  }

  @Get("query-logs")
  @Permissions("guidelines.review")
  queryLogs() {
    return this.guidelines.queryLogs();
  }
}
