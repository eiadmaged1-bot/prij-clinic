import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { Permissions } from "../rbac/require-permissions.decorator";
import { BillingService } from "./billing.service";
import { CreateInvoiceDto, CreatePaymentDto, ReversePaymentDto, UpdateInvoiceDto } from "./dto";

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

  @Post("payments")
  @Permissions("payment.manage")
  createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.billing.createPayment(dto, user);
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
}
