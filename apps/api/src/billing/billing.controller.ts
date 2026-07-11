import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { BillingService } from "./billing.service";
import { CreateInvoiceDto, CreatePaymentDto, ReversePaymentDto, UpdateInvoiceDto, VisitPriceAuditReportQueryDto, VisitPriceAuditSettingsDto, VoidInvoiceDto } from "./dto";

@Controller("billing")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post("invoices")
  @Permissions("billing.manage")
  createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.billing.createInvoice(dto, user);
  }

  @Get("invoices")
  @Permissions("billing.read")
  async listInvoices(@CurrentUser() user: AuthUser) {
    return { invoices: await this.billing.listInvoices(user) };
  }

  @Get("services")
  @Permissions("billing.read")
  async listActiveServices(@CurrentUser() user: AuthUser) {
    return { services: await this.billing.listActiveServices(user) };
  }

  @Get("daily-closing")
  @Permissions("billing.report")
  dailyClosing(@CurrentUser() user: AuthUser) {
    return this.billing.dailyClosing(user);
  }

  @Get("reports/finance")
  @Permissions("billing.report")
  financeReports(@CurrentUser() user: AuthUser) {
    return this.billing.financeReports(user);
  }

  @Get("owner/visit-price-audit/settings")
  @Permissions("billing.report")
  ownerVisitPriceSettings(@CurrentUser() user: AuthUser) {
    return this.billing.ownerVisitPriceSettings(user);
  }

  @Post("owner/visit-price-audit/settings")
  @Permissions("billing.report")
  updateOwnerVisitPriceSettings(@Body() dto: VisitPriceAuditSettingsDto, @CurrentUser() user: AuthUser) {
    return this.billing.updateOwnerVisitPriceSettings(dto, user);
  }

  @Get("owner/visit-price-audit/report")
  @Permissions("billing.report")
  ownerVisitPriceReport(@Query() query: VisitPriceAuditReportQueryDto, @CurrentUser() user: AuthUser) {
    return this.billing.ownerVisitPriceReport(query, user);
  }

  @Get("invoices/:id")
  @Permissions("billing.read")
  getInvoice(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.billing.getInvoice(id, user);
  }

  @Patch("invoices/:id")
  @Permissions("billing.manage")
  updateInvoice(@Param("id") id: string, @Body() dto: UpdateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.billing.updateInvoice(id, dto, user);
  }

  @Post("invoices/:id/issue")
  @Permissions("billing.manage")
  issueInvoice(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.billing.issueInvoice(id, user);
  }

  @Post("invoices/:id/void")
  @Permissions("billing.void")
  voidInvoice(@Param("id") id: string, @Body() dto: VoidInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.billing.voidInvoice(id, dto, user);
  }

  @Get("patients/:patientId/statement")
  @Permissions("billing.read")
  patientStatement(@Param("patientId") patientId: string, @CurrentUser() user: AuthUser) {
    return this.billing.patientStatement(patientId, user);
  }

  @Post("payments")
  @Permissions("payment.manage")
  createPayment(@Body() dto: CreatePaymentDto, @Headers("idempotency-key") idempotencyKey: string | undefined, @CurrentUser() user: AuthUser) {
    return this.billing.createPayment(dto, user, idempotencyKey);
  }

  @Get("payments")
  @Permissions("billing.read")
  async listPayments(@CurrentUser() user: AuthUser) {
    return { payments: await this.billing.listPayments(user) };
  }

  @Post("payments/:id/reverse")
  @Permissions("billing.void")
  reversePayment(@Param("id") id: string, @Body() dto: ReversePaymentDto, @CurrentUser() user: AuthUser) {
    return this.billing.reversePayment(id, dto, user);
  }

  @Post("payments/:id/refund")
  @Permissions("billing.void")
  refundPayment(@Param("id") id: string, @Body() dto: ReversePaymentDto, @CurrentUser() user: AuthUser) {
    return this.billing.refundPayment(id, dto, user);
  }
}
