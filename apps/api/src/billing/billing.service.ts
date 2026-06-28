import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { branchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto, CreatePaymentDto, ReversePaymentDto, UpdateInvoiceDto } from "./dto";

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async createInvoice(dto: CreateInvoiceDto, user: AuthUser) {
    if (!dto.items.length) {
      throw new BadRequestException("At least one invoice item is required.");
    }

    const patient = await this.ensurePatient(dto.patientId);
    const totals = calculateTotals(dto.items, dto.discountAmount ?? 0, 0);

    try {
      const invoice = await this.prisma.invoice.create({
        data: {
          patientId: dto.patientId,
          branchId: patient.branchId,
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
          items: {
            create: dto.items.map((item) => {
              const quantity = item.quantity ?? 1;
              const unitAmount = money(item.unitAmount);

              return {
                description: item.description.trim(),
                quantity,
                unitAmount,
                lineAmount: unitAmount.mul(quantity),
                notes: clean(item.notes)
              };
            })
          }
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
        metadataJson: { patientId: invoice.patientId, status: invoice.status, totalAmount: invoice.totalAmount.toString() }
      });

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

    const totals = calculateTotals(
      existing.items.map((item) => ({
        quantity: item.quantity,
        unitAmount: Number(item.unitAmount),
        description: item.description
      })),
      dto.discountAmount ?? Number(existing.discountAmount),
      Number(existing.amountPaid)
    );

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

  async createPayment(dto: CreatePaymentDto, user: AuthUser) {
    const invoice = await this.getInvoice(dto.invoiceId, user);
    if (["cancelled", "voided"].includes(invoice.status)) {
      throw new BadRequestException("Payments cannot be recorded for cancelled or voided invoices.");
    }

    const paymentAmount = money(dto.amount);
    const paidAt = toDateTime(dto.paidAt) ?? new Date();

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          branchId: invoice.branchId,
          method: dto.method,
          amount: paymentAmount,
          paidAt,
          referenceNote: clean(dto.referenceNote),
          recordedByUserId: user.id
        },
        include: paymentIncludes
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: paymentRollup(invoice.totalAmount, invoice.amountPaid.add(paymentAmount))
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
      metadataJson: { invoiceId: payment.invoiceId, method: payment.method, amount: payment.amount.toString() }
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
    const existing = await this.prisma.payment.findFirst({ where: { id, ...branchScope(user) }, include: paymentIncludes });
    if (!existing) {
      throw new NotFoundException("Payment not found.");
    }
    if (existing.status !== "recorded") {
      throw new BadRequestException("Only recorded payments can be reversed.");
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
      action: "payment.reversed",
      resourceType: "payment",
      resourceId: payment.id,
      branchId: payment.branchId,
      severity: "high",
      reason: dto.reason.trim(),
      metadataJson: { invoiceId: payment.invoiceId, amount: payment.amount.toString() }
    });

    return payment;
  }

  private async ensurePatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new BadRequestException("Patient not found.");
    return patient;
  }

  private async nextInvoiceNumber() {
    const count = await this.prisma.invoice.count();
    return `DEMO-INV-${String(count + 1).padStart(4, "0")}`;
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
  items: true,
  payments: true
} satisfies Prisma.InvoiceInclude;

export const paymentIncludes = {
  patient: true,
  invoice: true
} satisfies Prisma.PaymentInclude;

function calculateTotals(items: Array<{ quantity?: number; unitAmount: number; description: string }>, discountAmount: number, paidAmount: number) {
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
