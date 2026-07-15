import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
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
import { CreateGuidelineSummaryDto, ReviewGuidelineSummaryDto } from "./dto/guideline-summary.dto";
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
  documents(@CurrentUser() user: AuthUser, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string) {
    return this.guidelines.listDocuments(user, { page, limit, status });
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
  async viewDocument(@Param("id") id: string, @CurrentUser() user: AuthUser, @Req() request: Request, @Res() response: Response) {
    const file = await this.guidelines.viewDocumentFile(id, user);
    response.setHeader("content-type", file.mimeType);
    response.setHeader("content-disposition", `${file.disposition}; filename="${file.fileName}"`);
    response.setHeader("x-guideline-vault", "application-streamed");
    response.setHeader("accept-ranges", "bytes");
    response.setHeader("cache-control", "private, no-store");
    const range = parseByteRange(request.headers.range, file.buffer.length);
    if (range === "invalid") {
      response.setHeader("content-range", `bytes */${file.buffer.length}`);
      response.status(416).end();
      return;
    }
    if (range) {
      const chunk = file.buffer.subarray(range.start, range.end + 1);
      response.setHeader("content-range", `bytes ${range.start}-${range.end}/${file.buffer.length}`);
      response.setHeader("content-length", String(chunk.length));
      response.status(206).send(chunk);
      return;
    }
    response.setHeader("content-length", String(file.buffer.length));
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

  @Post("documents/:id/summaries")
  @Permissions("guidelines.import")
  createSummary(@Param("id") id: string, @Body() dto: CreateGuidelineSummaryDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.createSummary(id, dto, user);
  }

  @Post("documents/:documentId/summaries/:summaryId/review")
  @Permissions("guidelines.review")
  reviewSummary(@Param("documentId") documentId: string, @Param("summaryId") summaryId: string, @Body() dto: ReviewGuidelineSummaryDto, @CurrentUser() user: AuthUser) {
    return this.guidelines.reviewSummary(documentId, summaryId, dto, user);
  }

  @Post("documents/:id/archive")
  @Permissions("guidelines.delete_or_archive")
  archiveDocument(@Param("id") id: string, @Body() dto: Partial<ReviewGuidelineDto>, @CurrentUser() user: AuthUser) {
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

  @Post("upload-demo-text")
  @Permissions("guidelines.import")
  uploadDemoText(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return this.guidelines.uploadDemoText(body, user);
  }

  @Post("documents/:id/reindex")
  @Permissions("guidelines.import")
  reindex(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.guidelines.reindex(id, user);
  }

  @Post("reindex")
  @Permissions("guidelines.import")
  reindexAll(@CurrentUser() user: AuthUser) {
    return this.guidelines.reindexAll(user);
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

function parseByteRange(value: string | undefined, size: number): { start: number; end: number } | "invalid" | null {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size <= 0) return "invalid";
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[2] && match[1] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) return "invalid";
  return { start, end: Math.min(end, size - 1) };
}
