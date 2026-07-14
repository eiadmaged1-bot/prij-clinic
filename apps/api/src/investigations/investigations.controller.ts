import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import {
  CancelClinicalRequestDto,
  CreateClinicalRequestDto,
  CreateInvestigationOrderDto,
  InvestigationCatalogItemDto,
  InvestigationFavoriteSetDto,
  UpdateInvestigationOrderStatusDto
} from "./dto";
import { InvestigationsService } from "./investigations.service";

@Controller("investigations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvestigationsController {
  constructor(private readonly investigations: InvestigationsService) {}

  @Post("orders")
  @Permissions("investigation.create")
  createOrder(@Body() dto: CreateInvestigationOrderDto, @CurrentUser() user: AuthUser) {
    return this.investigations.createOrder(dto, user);
  }

  @Get("catalog")
  @Permissions("investigation.read")
  async listCatalog(@Query("q") q: string | undefined, @Query("category") category: string | undefined, @CurrentUser() user: AuthUser) {
    return this.investigations.catalogWorkspace(user, q, category);
  }

  @Post("catalog/:id/favorite")
  @Permissions("investigation.read")
  favoriteCatalogItem(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.favoriteCatalogItem(id, user);
  }

  @Post("catalog/:id/unfavorite")
  @Permissions("investigation.read")
  unfavoriteCatalogItem(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.unfavoriteCatalogItem(id, user);
  }

  @Get("favorite-sets")
  @Permissions("investigation.read")
  listFavoriteSets(@CurrentUser() user: AuthUser) {
    return this.investigations.listFavoriteSets(user);
  }

  @Post("favorite-sets")
  @Permissions("investigation.read")
  createFavoriteSet(@Body() dto: InvestigationFavoriteSetDto, @CurrentUser() user: AuthUser) {
    return this.investigations.createFavoriteSet(dto, user);
  }

  @Patch("favorite-sets/:id")
  @Permissions("investigation.read")
  updateFavoriteSet(@Param("id") id: string, @Body() dto: InvestigationFavoriteSetDto, @CurrentUser() user: AuthUser) {
    return this.investigations.updateFavoriteSet(id, dto, user);
  }

  @Post("favorite-sets/:id/duplicate")
  @Permissions("investigation.read")
  duplicateFavoriteSet(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.duplicateFavoriteSet(id, user);
  }

  @Delete("favorite-sets/:id")
  @Permissions("investigation.read")
  archiveFavoriteSet(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.archiveFavoriteSet(id, user);
  }

  @Get("admin/catalog")
  @Permissions("investigations.manage_catalog")
  listAdminCatalog(@Query("q") q: string | undefined) {
    return this.investigations.listAdminCatalog(q);
  }

  @Post("admin/catalog")
  @Permissions("investigations.manage_catalog")
  createCatalogItem(@Body() dto: InvestigationCatalogItemDto, @CurrentUser() user: AuthUser) {
    return this.investigations.createCatalogItem(dto, user);
  }

  @Patch("admin/catalog/:id")
  @Permissions("investigations.manage_catalog")
  updateCatalogItem(@Param("id") id: string, @Body() dto: InvestigationCatalogItemDto, @CurrentUser() user: AuthUser) {
    return this.investigations.updateCatalogItem(id, dto, user);
  }

  @Get("orders")
  @Permissions("investigation.read")
  async listOrders(@CurrentUser() user: AuthUser) {
    return { investigationOrders: await this.investigations.listOrders(user) };
  }

  @Get("orders/:id")
  @Permissions("investigation.read")
  getOrder(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.getOrder(id, user);
  }

  @Patch("orders/:id/status")
  @Permissions("investigation.update")
  updateOrderStatus(
    @Param("id") id: string,
    @Body() dto: UpdateInvestigationOrderStatusDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.investigations.updateOrderStatus(id, dto.status, user, dto.reason);
  }
}

@Controller("clinical-requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClinicalRequestsController {
  constructor(private readonly investigations: InvestigationsService) {}

  @Post()
  @Permissions("clinical_requests.write")
  create(@Body() dto: CreateClinicalRequestDto, @CurrentUser() user: AuthUser) {
    return this.investigations.createClinicalRequest(dto, user);
  }

  @Get()
  @Permissions("clinical_requests.read")
  async list(@Query("patientId") patientId: string | undefined, @CurrentUser() user: AuthUser) {
    return { clinicalRequests: await this.investigations.listClinicalRequests(user, patientId) };
  }

  @Get(":id/print")
  @Permissions("clinical_requests.read")
  print(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.getClinicalRequestPrint(id, user);
  }

  @Get(":id")
  @Permissions("clinical_requests.read")
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.getClinicalRequest(id, user);
  }

  @Post(":id/mark-result-received")
  @Permissions("clinical_requests.review")
  markResultReceived(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.markResultReceived(id, user);
  }

  @Post(":id/review")
  @Permissions("clinical_requests.review")
  review(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.investigations.reviewClinicalRequest(id, user);
  }

  @Post(":id/cancel")
  @Permissions("clinical_requests.cancel")
  cancel(@Param("id") id: string, @Body() dto: CancelClinicalRequestDto, @CurrentUser() user: AuthUser) {
    return this.investigations.cancelClinicalRequest(id, dto.reason, user);
  }
}
