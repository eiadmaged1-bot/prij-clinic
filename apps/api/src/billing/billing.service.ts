import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import {
  assertCanReferenceAppointment,
  assertCanReferenceEncounter,
  assertCanReferenceInvoice,
  assertCanReferencePatient,
  assertCanReferencePayment,
  assertCanReferenceQueueTicket
} from "../auth/reference-scope";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyService } from "../idempotency/idempotency.service";
import { CreateInvoiceDto, CreatePaymentDto, ReversePaymentDto, UpdateInvoiceDto, VisitPriceAuditReportQueryDto, VisitPriceAuditSettingsDto, VoidInvoiceDto } from "./dto";

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService
  ) {}

  async createInvoice(dto: CreateInvoiceDto, user: AuthUser) {
    if (!dto.items.length) {
      throw new BadRequestException("At least one invoice item is required.");
    }

    const patient = await assertCanReferencePatient(this.prisma, dto.patientId, user);
    const context = await resolveBillingContext(this.prisma, user, {
      patientId: dto.patientId,
      appointmentId: dto.appointmentId,
      queueTicketId: dto.queueTicketId,
      encounterId: dto.encounterId
    });
    assertDiscountAllowed(dto.discountAmount ?? 0, dto.discountReason, user);
    const items = await resolveInvoiceItems(this.prisma, dto.items);
    const totals = calculateTotals(items, dto.discountAmount ?? 0, 0);

    try {
      const invoice = await this.prisma.invoice.create({
        data: {
          patientId: dto.patientId,
          branchId: patient.branchId,
          appointmentId: context.appointmentId,
          queueTicketId: context.queueTicketId,
          encounterId: context.encounterId,
          invoiceNumber: dto.invoiceNumber?.trim() || (await this.nextInvoiceNumber()),
          issueDate: toDate(dto.issueDate),
          dueDate: toDate(dto.dueDate),
          subtotalAmount: totals.subtotal,
          discountAmount: totals.discount,
          totalAmount: totals.total,
          amountPaid: totals.paid,
          balanceAmount: totals.balance,
          notes: clean(dto.notes),
          createdByUserId: user.id,
          items: { create: items.map((item) => invoiceItemCreate(item)) }
        },
        include: invoiceIncludes
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "invoice.created",
        resourceType: "invoice",
        resourceId: invoice.id,
        branchId: invoice.branchId,
        severity: "high",
        reason: totals.discount.greaterThan(0) ? dto.discountReason?.trim() : undefined,
        metadataJson: {
          patientId: invoice.patientId,
          status: invoice.status,
          totalAmount: invoice.totalAmount.toString(),
          discountAmount: invoice.discountAmount.toString(),
          serviceItemIds: items.map((item) => item.serviceItemId).filter(Boolean),
          context
        }
      });

      if (totals.discount.greaterThan(0)) {
        await this.audit.record({
          actorUserId: user.id,
          action: "invoice.discount_applied",
          resourceType: "invoice",
          resourceId: invoice.id,
          branchId: invoice.branchId,
          severity: "high",
          reason: dto.discountReason?.trim(),
          metadataJson: { discountAmount: invoice.discountAmount.toString(), totalAmount: invoice.totalAmount.toString() }
        });
      }

      return invoice;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException("Invoice number already exists.");
      }
      this.handlePrismaReferenceError(error);
    }
  }

  async listInvoices(user: AuthUser) {
    const invoices = await this.prisma.invoice.findMany({
      where: branchScope(user),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: invoiceIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "invoice.list_read",
      resourceType: "invoice",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: invoices.length }
    });

    return invoices;
  }

  async listActiveServices(user: AuthUser) {
    const services = await this.prisma.serviceItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "service_item.active_list_read",
      resourceType: "service_item",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: services.length }
    });

    return services;
  }

  async getInvoice(id: string, user: AuthUser) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, ...branchScope(user) },
      include: invoiceIncludes
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "invoice.read",
      resourceType: "invoice",
      resourceId: invoice.id,
      branchId: invoice.branchId,
      severity: "medium",
      metadataJson: { status: invoice.status }
    });

    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, user: AuthUser) {
    const existing = await this.getInvoice(id, user);
    if (existing.status === "voided") {
      throw new BadRequestException("Voided invoices cannot be edited.");
    }

    assertDiscountAllowed(dto.discountAmount ?? 0, dto.discountReason, user);
    const totals = calculateTotals(toInvoiceInputItems(existing.items), dto.discountAmount ?? Number(existing.discountAmount), Number(existing.amountPaid));

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.issueDate !== undefined) data.issueDate = toDate(dto.issueDate);
    if (dto.dueDate !== undefined) data.dueDate = toDate(dto.dueDate);
    if (dto.discountAmount !== undefined) {
      data.discountAmount = totals.discount;
      data.totalAmount = totals.total;
      data.balanceAmount = totals.balance;
    }
    if (dto.notes !== undefined) data.notes = clean(dto.notes);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data,
      include: invoiceIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "invoice.updated",
      resourceType: "invoice",
      resourceId: invoice.id,
      branchId: invoice.branchId,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), fromStatus: existing.status, toStatus: invoice.status }
    });

    if (dto.discountAmount !== undefined && totals.discount.greaterThan(0)) {
      await this.audit.record({
        actorUserId: user.id,
        action: "invoice.discount_updated",
        resourceType: "invoice",
        resourceId: invoice.id,
        branchId: invoice.branchId,
        severity: "high",
        reason: dto.discountReason?.trim(),
        metadataJson: { discountAmount: invoice.discountAmount.toString(), totalAmount: invoice.totalAmount.toString() }
      });
    }

    return invoice;
  }

  async issueInvoice(id: string, user: AuthUser) {
    const existing = await this.getInvoice(id, user);
    if (existing.status !== "draft") {
      throw new BadRequestException("Only draft invoices can be issued.");
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: "issued", issuedAt: new Date(), issuedByUserId: user.id },
      include: invoiceIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "invoice.issued",
      resourceType: "invoice",
      resourceId: invoice.id,
      branchId: invoice.branchId,
      severity: "high",
      metadataJson: { patientId: invoice.patientId, fromStatus: existing.status }
    });

    return invoice;
  }

  async voidInvoice(id: string, dto: VoidInvoiceDto, user: AuthUser) {
    const existing = await this.getInvoice(id, user);
    if (existing.status === "voided") {
      throw new BadRequestException("Invoice is already voided.");
    }
    if (!dto.reason.trim()) {
      throw new BadRequestException("Void reason is required.");
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: "voided", voidedAt: new Date(), voidedByUserId: user.id, voidReason: dto.reason.trim() },
      include: invoiceIncludes
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "invoice.voided",
      resourceType: "invoice",
      resourceId: invoice.id,
      branchId: invoice.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { previousStatus: existing.status, amountPaid: invoice.amountPaid.toString(), balanceAmount: invoice.balanceAmount.toString() }
    });

    return invoice;
  }

  async createPayment(dto: CreatePaymentDto, user: AuthUser, idempotencyKey?: string) {
    if (!idempotencyKey?.trim()) {
      return this.createPaymentWithoutIdempotency(dto, user);
    }

    const invoice = await assertCanReferenceInvoice(this.prisma, dto.invoiceId, user);
    const branchId = invoice.branchId;

    const idempotency = await this.idempotency.beginOrReplay({
      userId: user.id,
      branchId,
      operation: "payment.create",
      rawKey: idempotencyKey,
      requestPayload: dto
    });

    if (idempotency.isReplay) {
      if (!idempotency.resourceId) {
        throw new BadRequestException("Payment creation is still in progress.");
      }
      return this.prisma.payment.findUnique({ where: { id: idempotency.resourceId }, include: paymentIncludes });
    }

    try {
      const payment = await this.createPaymentWithoutIdempotency(dto, user, invoice);
      await this.idempotency.complete({
        recordId: idempotency.recordId,
        responseStatus: 201,
        resourceType: "payment",
        resourceId: payment.id
      });
      return payment;
    } catch (error) {
      const safeReason = error instanceof Error ? error.message : "Unknown error";
      await this.idempotency.failOrRelease({
        recordId: idempotency.recordId,
        safeReason,
        releaseLock: true
      });
      throw error;
    }
  }

  private async createPaymentWithoutIdempotency(dto: CreatePaymentDto, user: AuthUser, preloadedInvoice?: any) {
    const invoice = preloadedInvoice || await assertCanReferenceInvoice(this.prisma, dto.invoiceId, user);
    if (["cancelled", "voided"].includes(invoice.status)) {
      throw new BadRequestException("Payments cannot be recorded for cancelled or voided invoices.");
    }

    const paymentAmount = money(dto.amount);
    const paidAt = toDateTime(dto.paidAt) ?? new Date();

    const payment = await this.prisma.$transaction(async (tx) => {
      // 1. Lock the invoice row to prevent payment concurrency bugs
      const lockedInvoices = await tx.$queryRaw<any[]>`SELECT id, status, "totalAmount", "amountPaid" FROM "Invoice" WHERE id = ${invoice.id}::uuid FOR UPDATE`;
      if (!lockedInvoices.length) {
        throw new NotFoundException("Invoice not found.");
      }
      const lockedInvoice = lockedInvoices[0];

      if (["cancelled", "voided"].includes(lockedInvoice.status)) {
        throw new BadRequestException("Payments cannot be recorded for cancelled or voided invoices.");
      }

      const created = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          branchId: invoice.branchId,
          method: dto.method,
          amount: paymentAmount,
          paidAt,
          referenceNote: clean(dto.referenceNote),
          note: clean(dto.note),
          recordedByUserId: user.id
        },
        include: paymentIncludes
      });

      const currentTotal = money(lockedInvoice.totalAmount);
      const currentAmountPaid = money(lockedInvoice.amountPaid);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: paymentRollup(currentTotal, currentAmountPaid.add(paymentAmount))
      });

      return created;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "payment.recorded",
      resourceType: "payment",
      resourceId: payment.id,
      branchId: payment.branchId,
      severity: "high",
      metadataJson: { invoiceId: payment.invoiceId, method: payment.method, amount: payment.amount.toString(), manualOnly: true }
    });

    return payment;
  }

  listPayments(user: AuthUser) {
    return this.prisma.payment.findMany({
      where: branchScope(user),
      orderBy: { paidAt: "desc" },
      take: 100,
      include: paymentIncludes
    });
  }

  async reversePayment(id: string, dto: ReversePaymentDto, user: AuthUser) {
    return this.reverseOrRefundPayment(id, dto, user, "payment.reversed");
  }

  async refundPayment(id: string, dto: ReversePaymentDto, user: AuthUser) {
    return this.reverseOrRefundPayment(id, dto, user, "payment.refunded");
  }

  async patientStatement(patientId: string, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { patientId, ...branchScope(user) },
        orderBy: { createdAt: "desc" },
        include: invoiceIncludes
      }),
      this.prisma.payment.findMany({
        where: { patientId, ...branchScope(user) },
        orderBy: { paidAt: "desc" },
        include: paymentIncludes
      })
    ]);

    const totals = statementTotals(invoices, payments);
    await this.audit.record({
      actorUserId: user.id,
      action: "billing.patient_statement_read",
      resourceType: "patient_statement",
      resourceId: patientId,
      branchId: patient.branchId,
      severity: "medium",
      metadataJson: { invoiceCount: invoices.length, paymentCount: payments.length, balanceAmount: totals.balanceAmount.toString() }
    });

    return {
      patient,
      invoices,
      payments,
      totals,
      print: { available: true, exportPlaceholder: "Export requires a future audited export workflow." }
    };
  }

  async dailyClosing(user: AuthUser) {
    const start = startOfToday();
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const where = { ...branchScope(user), paidAt: { gte: start, lt: end } };
    const [payments, voids] = await Promise.all([
      this.prisma.payment.findMany({ where, include: paymentIncludes, orderBy: { paidAt: "asc" } }),
      this.prisma.invoice.findMany({
        where: { ...branchScope(user), status: "voided", voidedAt: { gte: start, lt: end } },
        include: invoiceIncludes,
        orderBy: { voidedAt: "asc" }
      })
    ]);

    const summary = closingSummary(payments, voids);
    await this.audit.record({
      actorUserId: user.id,
      action: "billing.daily_closing_read",
      resourceType: "daily_cash_closing",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { date: start.toISOString().slice(0, 10), netTotal: summary.netTotal.toString() }
    });

    return {
      date: start.toISOString().slice(0, 10),
      summary,
      payments,
      voids,
      print: { available: true, exportPlaceholder: "Export placeholder only. No accounting ledger is generated." }
    };
  }

  async financeReports(user: AuthUser) {
    const [invoices, payments, serviceItems] = await Promise.all([
      this.prisma.invoice.findMany({ where: branchScope(user), include: invoiceIncludes, orderBy: { createdAt: "desc" }, take: 500 }),
      this.prisma.payment.findMany({ where: branchScope(user), include: paymentIncludes, orderBy: { paidAt: "desc" }, take: 500 }),
      this.prisma.serviceItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] })
    ]);

    const reports = financeSummary(invoices, payments, serviceItems);
    await this.audit.record({
      actorUserId: user.id,
      action: "billing.finance_reports_read",
      resourceType: "finance_report",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { invoiceCount: invoices.length, paymentCount: payments.length }
    });

    return {
      ...reports,
      print: { available: true, exportPlaceholder: "Export is a placeholder until audited export controls are implemented." }
    };
  }

  async ownerVisitPriceSettings(user: AuthUser) {
    assertOwnerOnly(user);
    const setting = await this.activeVisitPriceSetting();
    await this.audit.record({
      actorUserId: user.id,
      action: "billing.owner_visit_price_settings_read",
      resourceType: "visit_price_audit_setting",
      resourceId: setting?.id,
      branchId: user.branchId,
      severity: "high"
    });
    return { setting };
  }

  async updateOwnerVisitPriceSettings(dto: VisitPriceAuditSettingsDto, user: AuthUser) {
    assertOwnerOnly(user);
    await this.prisma.visitPriceAuditSetting.updateMany({ where: { active: true }, data: { active: false } });
    const setting = await this.prisma.visitPriceAuditSetting.create({
      data: {
        baseVisitPriceX: dto.baseVisitPriceX,
        kashfMultiplier: dto.kashfMultiplier ?? 1,
        recheckMultiplier: dto.recheckMultiplier ?? 0.5,
        consultationMultiplier: dto.consultationMultiplier ?? 0.75,
        urgentMultiplier: dto.urgentMultiplier ?? 2,
        updatedByUserId: user.id
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "billing.owner_visit_price_settings_updated",
      resourceType: "visit_price_audit_setting",
      resourceId: setting.id,
      branchId: user.branchId,
      severity: "high",
      metadataJson: { changedFormula: true }
    });
    return { setting };
  }

  async ownerVisitPriceReport(query: VisitPriceAuditReportQueryDto, user: AuthUser) {
    assertOwnerOnly(user);
    const setting = await this.activeVisitPriceSetting();
    if (!setting) throw new BadRequestException("Owner visit price audit settings are not configured.");
    const from = query.from ? new Date(`${query.from.slice(0, 10)}T00:00:00.000Z`) : startOfTodayUtc();
    const to = query.to ? new Date(`${query.to.slice(0, 10)}T23:59:59.999Z`) : endOfTodayUtc();
    const [tickets, payments] = await Promise.all([
      this.prisma.queueTicket.findMany({ where: { ...branchScope(user), checkedInAt: { gte: from, lte: to }, status: { not: "cancelled" } } }),
      this.prisma.payment.findMany({ where: { ...branchScope(user), paidAt: { gte: from, lte: to }, status: "recorded" } })
    ]);
    const counts = visitTypeCounts(tickets);
    const expectedTotal = new Prisma.Decimal(counts.kashf).mul(setting.baseVisitPriceX).mul(setting.kashfMultiplier)
      .add(new Prisma.Decimal(counts.recheck).mul(setting.baseVisitPriceX).mul(setting.recheckMultiplier))
      .add(new Prisma.Decimal(counts.consultation).mul(setting.baseVisitPriceX).mul(setting.consultationMultiplier))
      .add(new Prisma.Decimal(counts.urgent_kashf).mul(setting.baseVisitPriceX).mul(setting.urgentMultiplier));
    const actualCollectedTotal = payments.reduce((sum, payment) => sum.add(payment.amount), new Prisma.Decimal(0));
    await this.audit.record({
      actorUserId: user.id,
      action: "billing.owner_visit_price_audit_report_read",
      resourceType: "visit_price_audit_report",
      branchId: user.branchId,
      severity: "high",
      metadataJson: { from: from.toISOString(), to: to.toISOString(), visitCount: tickets.length }
    });
    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      counts,
      expectedTotal: expectedTotal.toFixed(2),
      actualCollectedTotal: actualCollectedTotal.toFixed(2),
      variance: actualCollectedTotal.sub(expectedTotal).toFixed(2)
    };
  }

  private async reverseOrRefundPayment(id: string, dto: ReversePaymentDto, user: AuthUser, action: "payment.reversed" | "payment.refunded") {
    const existing = await assertCanReferencePayment(this.prisma, id, user);
    if (existing.status !== "recorded") {
      throw new BadRequestException("Only recorded payments can be refunded or reversed.");
    }
    if (!dto.reason.trim()) {
      throw new BadRequestException("Refund or reversal reason is required.");
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: "reversed",
          reversedAt: new Date(),
          reversedByUserId: user.id,
          reverseReason: dto.reason.trim()
        },
        include: paymentIncludes
      });

      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: existing.invoiceId } });
      const nextPaid = Prisma.Decimal.max(invoice.amountPaid.sub(existing.amount), 0);
      await tx.invoice.update({
        where: { id: invoice.id },
        data: paymentRollup(invoice.totalAmount, nextPaid)
      });

      return updated;
    });

    await this.audit.record({
      actorUserId: user.id,
      action,
      resourceType: "payment",
      resourceId: payment.id,
      branchId: payment.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { invoiceId: payment.invoiceId, amount: payment.amount.toString() }
    });

    return payment;
  }

  private async nextInvoiceNumber() {
    const count = await this.prisma.invoice.count();
    return `DEMO-INV-${String(count + 1).padStart(4, "0")}`;
  }

  private activeVisitPriceSetting() {
    return this.prisma.visitPriceAuditSetting.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced invoice, patient, branch, or user was not found.");
    }
    throw error;
  }
}

export const invoiceIncludes = {
  patient: true,
  appointment: true,
  queueTicket: true,
  encounter: true,
  items: { include: { serviceItem: true } },
  payments: true
} satisfies Prisma.InvoiceInclude;

export const paymentIncludes = {
  patient: true,
  invoice: true
} satisfies Prisma.PaymentInclude;

type InvoiceInputItem = {
  serviceItemId?: string | null;
  description: string;
  quantity: number;
  unitAmount: number;
  notes?: string | null;
};

type InvoiceWithIncludes = Prisma.InvoiceGetPayload<{ include: typeof invoiceIncludes }>;
type PaymentWithIncludes = Prisma.PaymentGetPayload<{ include: typeof paymentIncludes }>;

async function resolveInvoiceItems(
  prisma: PrismaService,
  items: Array<{ serviceItemId?: string; description?: string; quantity?: number; unitAmount?: number; notes?: string }>
): Promise<InvoiceInputItem[]> {
  if (!items.length) {
    throw new BadRequestException("At least one invoice item is required.");
  }

  const resolved: InvoiceInputItem[] = [];
  for (const item of items) {
    const quantity = item.quantity ?? 1;
    if (item.serviceItemId) {
      const service = await prisma.serviceItem.findFirst({ where: { id: item.serviceItemId, active: true } });
      if (!service) throw new BadRequestException("Selected service is not active or was not found.");
      if (service.price === null) throw new BadRequestException("Selected service is not priced yet and requires finance review before invoicing.");
      resolved.push({
        serviceItemId: service.id,
        description: item.description?.trim() || service.name,
        quantity,
        unitAmount: Number(service.price),
        notes: clean(item.notes)
      });
      continue;
    }

    if (!item.description?.trim() || item.unitAmount === undefined) {
      throw new BadRequestException("Manual invoice items require a service name and price.");
    }
    resolved.push({
      description: item.description.trim(),
      quantity,
      unitAmount: item.unitAmount,
      notes: clean(item.notes)
    });
  }

  return resolved;
}

function invoiceItemCreate(item: InvoiceInputItem) {
  if (item.unitAmount === undefined) {
    throw new BadRequestException("Selected service is not priced yet and requires finance review before invoicing.");
  }
  const unitAmount = money(item.unitAmount);
  return {
    serviceItemId: item.serviceItemId ?? null,
    description: item.description,
    quantity: item.quantity,
    unitAmount,
    lineAmount: unitAmount.mul(item.quantity),
    notes: item.notes
  };
}

function toInvoiceInputItems(items: InvoiceWithIncludes["items"]): InvoiceInputItem[] {
  return items.map((item) => ({
    serviceItemId: item.serviceItemId,
    description: item.description,
    quantity: item.quantity,
    unitAmount: Number(item.unitAmount),
    notes: item.notes
  }));
}

async function resolveBillingContext(
  prisma: PrismaService,
  user: AuthUser,
  input: { patientId: string; appointmentId?: string; queueTicketId?: string; encounterId?: string }
) {
  const appointment = await assertCanReferenceAppointment(prisma, input.appointmentId, user, { patientId: input.patientId });
  const encounter = await assertCanReferenceEncounter(prisma, input.encounterId, user, { patientId: input.patientId });
  const queueTicket = input.queueTicketId ? await assertCanReferenceQueueTicket(prisma, input.queueTicketId, user) : null;
  if (queueTicket && queueTicket.patientId !== input.patientId) {
    throw new BadRequestException("Referenced check-in does not belong to this patient.");
  }

  return {
    appointmentId: appointment?.id ?? null,
    queueTicketId: queueTicket?.id ?? null,
    encounterId: encounter?.id ?? null
  };
}

function assertDiscountAllowed(discountAmount: number, reason: string | undefined, user: AuthUser) {
  if (discountAmount <= 0) return;
  if (!user.permissions.includes("billing.adjust")) {
    throw new ForbiddenException("Discounts require billing adjustment permission.");
  }
  if (!reason?.trim()) {
    throw new BadRequestException("Discount reason is required.");
  }
}

function calculateTotals(items: Array<{ quantity?: number; unitAmount: number }>, discountAmount: number, paidAmount: number) {
  const subtotal = items.reduce((sum, item) => sum.add(money(item.unitAmount).mul(item.quantity ?? 1)), money(0));
  const discount = money(discountAmount);
  if (discount.greaterThan(subtotal)) {
    throw new BadRequestException("Discount cannot exceed subtotal.");
  }

  const total = subtotal.sub(discount);
  const paid = money(paidAmount);
  return {
    subtotal,
    discount,
    total,
    paid,
    balance: Prisma.Decimal.max(total.sub(paid), 0)
  };
}

function paymentRollup(totalAmount: Prisma.Decimal, amountPaid: Prisma.Decimal) {
  const balanceAmount = Prisma.Decimal.max(totalAmount.sub(amountPaid), 0);
  const status: InvoiceStatus = amountPaid.greaterThanOrEqualTo(totalAmount) ? "paid" : amountPaid.greaterThan(0) ? "partially_paid" : "issued";

  return { amountPaid, balanceAmount, status };
}

function statementTotals(invoices: InvoiceWithIncludes[], payments: PaymentWithIncludes[]) {
  const activeInvoices = invoices.filter((invoice) => invoice.status !== "voided" && invoice.status !== "cancelled");
  const recordedPayments = payments.filter((payment) => payment.status === "recorded");
  const refundedPayments = payments.filter((payment) => payment.status !== "recorded");
  return {
    invoiceTotal: sumDecimal(activeInvoices.map((invoice) => invoice.totalAmount)),
    paidAmount: sumDecimal(recordedPayments.map((payment) => payment.amount)),
    refundedAmount: sumDecimal(refundedPayments.map((payment) => payment.amount)),
    balanceAmount: sumDecimal(activeInvoices.map((invoice) => invoice.balanceAmount)),
    invoiceCount: activeInvoices.length,
    paymentCount: recordedPayments.length
  };
}

function closingSummary(payments: PaymentWithIncludes[], voids: InvoiceWithIncludes[]) {
  const recorded = payments.filter((payment) => payment.status === "recorded");
  const refunds = payments.filter((payment) => payment.status !== "recorded");
  const cash = sumDecimal(recorded.filter((payment) => payment.method === "cash").map((payment) => payment.amount));
  const manualCard = sumDecimal(recorded.filter((payment) => payment.method !== "cash").map((payment) => payment.amount));
  const totalCollected = cash.add(manualCard);
  const refundTotal = sumDecimal(refunds.map((payment) => payment.amount));
  const voidTotal = sumDecimal(voids.map((invoice) => invoice.totalAmount));
  return {
    cash,
    cardManual: manualCard,
    totalCollected,
    refunds: refundTotal,
    voids: voidTotal,
    netTotal: totalCollected.sub(refundTotal)
  };
}

function financeSummary(invoices: InvoiceWithIncludes[], payments: PaymentWithIncludes[], serviceItems: Array<{ id: string; code: string; name: string; category: string; doctorShareAmount: Prisma.Decimal | null }>) {
  const activeInvoices = invoices.filter((invoice) => invoice.status !== "voided" && invoice.status !== "cancelled");
  const recordedPayments = payments.filter((payment) => payment.status === "recorded");
  const adjustedPayments = payments.filter((payment) => payment.status !== "recorded");
  const paymentsByMethod = Object.fromEntries(
    ["cash", "card", "bank_transfer", "mobile_wallet", "other"].map((method) => [
      method,
      sumDecimal(recordedPayments.filter((payment) => payment.method === method).map((payment) => payment.amount))
    ])
  );

  const serviceRevenue = serviceItems.map((service) => {
    const linkedItems = activeInvoices.flatMap((invoice) => invoice.items).filter((item) => item.serviceItemId === service.id);
    const revenue = sumDecimal(linkedItems.map((item) => item.lineAmount));
    return {
      serviceItemId: service.id,
      code: service.code,
      name: service.name,
      category: service.category,
      revenue,
      quantity: linkedItems.reduce((sum, item) => sum + item.quantity, 0),
      doctorSharePlaceholder: service.doctorShareAmount
    };
  }).filter((row) => row.quantity > 0);

  return {
    revenueSummary: {
      invoiced: sumDecimal(activeInvoices.map((invoice) => invoice.totalAmount)),
      collected: sumDecimal(recordedPayments.map((payment) => payment.amount)),
      outstanding: sumDecimal(activeInvoices.map((invoice) => invoice.balanceAmount))
    },
    paymentsByMethod,
    unpaidInvoices: activeInvoices.filter((invoice) => invoice.balanceAmount.greaterThan(0)),
    discounts: activeInvoices.filter((invoice) => invoice.discountAmount.greaterThan(0)),
    refundsAndVoids: {
      refunds: adjustedPayments,
      voids: invoices.filter((invoice) => invoice.status === "voided")
    },
    dailyClosingSummary: closingSummary(payments, invoices.filter((invoice) => invoice.status === "voided")),
    serviceRevenue,
    doctorSharePlaceholder: serviceRevenue.map((row) => ({
      serviceItemId: row.serviceItemId,
      service: row.name,
      placeholderAmount: row.doctorSharePlaceholder
    }))
  };
}

function sumDecimal(values: Prisma.Decimal[]) {
  return values.reduce((sum, value) => sum.add(value), money(0));
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfTodayUtc() {
  return startOfToday();
}

function endOfTodayUtc() {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function assertOwnerOnly(user: AuthUser) {
  if (!user.roles.includes("Owner")) {
    throw new ForbiddenException("Owner-only visit price audit is not available for this role.");
  }
}

function visitTypeCounts(tickets: Array<{ visitType: string }>) {
  return {
    kashf: tickets.filter((ticket) => ticket.visitType === "kashf").length,
    recheck: tickets.filter((ticket) => ticket.visitType === "recheck").length,
    consultation: tickets.filter((ticket) => ticket.visitType === "consultation").length,
    urgent_kashf: tickets.filter((ticket) => ticket.visitType === "urgent_kashf").length
  };
}

function clean(value?: string) {
  return value?.trim() || null;
}

function money(value: number) {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function toDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
