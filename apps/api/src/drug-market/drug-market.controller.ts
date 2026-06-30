import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { DrugMarketImportService } from "./drug-market-import.service";
import { DrugMarketSearchService } from "./drug-market-search.service";
import { DrugMarketService } from "./drug-market.service";

@Controller("drug-market")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DrugMarketController {
  constructor(
    private readonly market: DrugMarketService,
    private readonly searchService: DrugMarketSearchService,
    private readonly importService: DrugMarketImportService
  ) {}

  @Get("countries")
  @Permissions("drug_market.read")
  countries() { return this.market.countries(); }

  @Patch("countries/:id")
  @Permissions("drug_market.manage_countries")
  updateCountry(@Param("id") id: string, @Body() dto: Record<string, string | boolean>, @CurrentUser() user: AuthUser) { return this.market.updateCountry(id, dto, user); }

  @Get("sources")
  @Permissions("drug_market.read")
  sources() { return this.market.sources(); }

  @Post("sources")
  @Permissions("drug_market.manage_sources")
  createSource(@Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.createSource(dto, user); }

  @Patch("sources/:id")
  @Permissions("drug_market.manage_sources")
  updateSource(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.updateSource(id, dto, user); }

  @Get("search")
  @Permissions("drug_market.search")
  searchGet(@Query("q") query: string | undefined, @Query("countryCode") countryCode: string | undefined, @CurrentUser() user: AuthUser) { return this.searchService.search({ query, countryCode }, user); }

  @Post("search")
  @Permissions("drug_market.search")
  searchPost(@Body() dto: { query?: string; countryCode?: string }, @CurrentUser() user: AuthUser) { return this.searchService.search(dto, user); }

  @Get("products")
  @Permissions("drug_market.read")
  products() { return this.market.products(); }

  @Get("products/:id")
  @Permissions("drug_market.read")
  product(@Param("id") id: string) { return this.market.product(id); }

  @Get("products/:id/variants")
  @Permissions("drug_market.read")
  productVariants(@Param("id") id: string) { return this.market.variants(id); }

  @Get("products/:id/availability")
  @Permissions("drug_market.read")
  availability(@Param("id") id: string) { return this.market.availability(id); }

  @Get("variants")
  @Permissions("drug_market.read")
  variants() { return this.market.variants(); }

  @Get("variants/:id")
  @Permissions("drug_market.read")
  variant(@Param("id") id: string) { return this.market.variant(id); }

  @Patch("variants/:id")
  @Permissions("drug_market.manage_products")
  updateVariant(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.updateVariant(id, dto, user); }

  @Post("variants/:id/verify")
  @Permissions("drug_market.verify")
  verifyVariant(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.verifyVariant(id, dto, user); }

  @Post("variants/:id/reject")
  @Permissions("drug_market.verify")
  rejectVariant(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.rejectVariant(id, dto, user); }

  @Post("variants/:id/retire")
  @Permissions("drug_market.verify")
  retireVariant(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.retireVariant(id, dto, user); }

  @Post("variants/verify-batch")
  @Permissions("drug_market.verify")
  verifyBatch(@Body() dto: { countryCode?: string; sourceCode?: string; limit?: number; reason?: string; confirmation?: string }, @CurrentUser() user: AuthUser) { return this.market.verifyBatch(dto, user); }

  @Post("import/upload")
  @Permissions("drug_market.import")
  upload(@Body() dto: { sourceCode?: string; rows?: Array<Record<string, string>>; fileName?: string }, @CurrentUser() user: AuthUser) { return this.importService.importRows(dto, user); }

  @Post("import/sfda")
  @Permissions("drug_market.import")
  sfda(@Body() dto: { rows?: Array<Record<string, string>> }, @CurrentUser() user: AuthUser) { return this.importService.importRows({ ...dto, sourceCode: "SFDA_DRUGS_LIST", fileName: "SFDA official rows" }, user); }

  @Post("import/recompute-availability")
  @Permissions("drug_market.verify")
  recomputeAvailability() { return this.market.recomputeAvailability(); }

  @Get("import/jobs")
  @Permissions("drug_market.import")
  importJobs() { return this.market.importJobs(); }

  @Get("import/jobs/:id")
  @Permissions("drug_market.import")
  importJob(@Param("id") id: string) { return this.market.importJob(id); }

  @Get("import/jobs/:id/errors")
  @Permissions("drug_market.import")
  importJobErrors(@Param("id") id: string) { return this.market.importJobErrors(id); }

  @Post("automation/connectors/:id/run")
  @Permissions("drug_market.automation")
  runConnector(@Param("id") id: string, @CurrentUser() user: AuthUser) { return this.importService.runConnector(id, false, user); }

  @Post("automation/connectors/:id/dry-run")
  @Permissions("drug_market.automation")
  dryRunConnector(@Param("id") id: string, @CurrentUser() user: AuthUser) { return this.importService.runConnector(id, true, user); }

  @Get("automation/runs")
  @Permissions("drug_market.automation")
  runs() { return this.market.runs(); }

  @Get("automation/coverage")
  @Permissions("drug_market.read")
  coverage() { return this.market.coverage(); }

  @Get("automation/connectors")
  @Permissions("drug_market.manage_sources")
  connectors() { return this.market.connectors(); }

  @Get("review-queue")
  @Permissions("drug_market.review_queue")
  reviewQueue(
    @Query("countryCode") countryCode?: string,
    @Query("sourceCode") sourceCode?: string,
    @Query("status") status?: string,
    @Query("confidence") confidence?: string,
    @Query("missing") missing?: string,
    @Query("highConfidence") highConfidence?: string
  ) { return this.market.reviewQueue({ countryCode, sourceCode, status, confidence, missing, highConfidence }); }

  @Post("review-queue/:id/resolve")
  @Permissions("drug_market.review_queue")
  resolveReview(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.resolveReviewQueue(id, dto, user); }

  @Post("review-queue/:id/dismiss")
  @Permissions("drug_market.review_queue")
  dismissReview(@Param("id") id: string, @Body() dto: Record<string, string>, @CurrentUser() user: AuthUser) { return this.market.dismissReviewQueue(id, dto, user); }

  @Get("merge-candidates")
  @Permissions("drug_market.review_queue")
  mergeCandidates() { return this.market.mergeCandidates(); }

  @Post("merge-candidates/:id/merge")
  @Permissions("drug_market.review_queue")
  mergeCandidate(@Param("id") id: string, @CurrentUser() user: AuthUser) { return this.market.dismissMergeCandidate(id, user); }

  @Post("merge-candidates/:id/dismiss")
  @Permissions("drug_market.review_queue")
  dismissMergeCandidate(@Param("id") id: string, @CurrentUser() user: AuthUser) { return this.market.dismissMergeCandidate(id, user); }
}
