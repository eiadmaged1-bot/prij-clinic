import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { CancelClinicalRequestDto, CreateClinicalRequestDto, CreateInvestigationOrderDto, UpdateInvestigationOrderStatusDto } from "./dto";
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
  async listCatalog(@Query("q") q?: string) {
    return { investigationCatalog: q ? await this.investigations.searchCatalog(q) : await this.investigations.listCatalog() };
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
