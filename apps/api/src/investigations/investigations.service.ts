import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InvestigationCategory, InvestigationOrderStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClinicalRequestDto, CreateInvestigationOrderDto, InvestigationOrderItemDto } from "./dto";

@Injectable()
export class InvestigationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async createOrder(dto: CreateInvestigationOrderDto, user: AuthUser) {
    if (!dto.patientId || !dto.encounterId) {
      throw new BadRequestException("Patient and active visit context are required before saving an investigation request.");
    }
    await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });

    try {
      const order = await this.prisma.investigationOrder.create({
        data: {
          patientId: dto.patientId,
          encounterId: dto.encounterId ?? null,
          doctorId: user.id,
          priority: dto.priority ?? "routine",
          notes: clean(dto.notes),
          items: { create: dto.items.map(toItemCreate) }
        },
        include: { items: true, patient: true, encounter: true }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "investigation_order.created",
        resourceType: "investigation_order",
        resourceId: order.id,
        severity: "high",
        metadataJson: { patientId: order.patientId, priority: order.priority, itemCount: order.items.length }
      });

      return order;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async catalogWorkspace(user: AuthUser, q = "", category = "") {
    const [items, favorites, highPriority] = await Promise.all([
      this.searchCatalog(q, category),
      this.prisma.investigationFavorite.findMany({
        where: { userId: user.id },
        include: { investigationCatalogItem: true },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      this.prisma.investigationCatalogItem.findMany({
        where: { active: true, OR: [{ isHighPriority: true }, { priorityLevel: { lte: 2 } }] },
        orderBy: [{ priorityLevel: "asc" }, { category: "asc" }, { name: "asc" }],
        take: 50
      })
    ]);
    const favoriteIds = new Set(favorites.map((favorite) => favorite.investigationCatalogItemId));
    return {
      investigationCatalog: items.map((item) => ({ ...item, favorite: favoriteIds.has(item.id) })),
      categories: investigationCategories,
      favorites: favorites.map((favorite) => ({ ...favorite.investigationCatalogItem, favorite: true })),
      highPriority,
      templates: investigationTemplates
    };
  }

  searchCatalog(q = "", category = "") {
    const query = q.trim();
    return this.prisma.investigationCatalogItem.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { code: { contains: query, mode: "insensitive" } },
                { normalizedName: { contains: normalize(query), mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
                { subcategory: { contains: query, mode: "insensitive" } },
                { clinicalGroup: { contains: query, mode: "insensitive" } },
                { specialty: { contains: query, mode: "insensitive" } },
                { modality: { contains: query, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: query || category ? 75 : 150
    });
  }

  async favoriteCatalogItem(id: string, user: AuthUser) {
    const item = await this.prisma.investigationCatalogItem.findFirst({ where: { id, active: true } });
    if (!item) throw new NotFoundException("Investigation catalog item not found.");
    const favorite = await this.prisma.investigationFavorite.upsert({
      where: { userId_investigationCatalogItemId: { userId: user.id, investigationCatalogItemId: id } },
      update: {},
      create: { userId: user.id, investigationCatalogItemId: id }
    });
    return { favorite, item };
  }

  async unfavoriteCatalogItem(id: string, user: AuthUser) {
    await this.prisma.investigationFavorite.deleteMany({ where: { userId: user.id, investigationCatalogItemId: id } });
    return { ok: true };
  }

  listOrders(user: AuthUser) {
    return this.prisma.investigationOrder.findMany({
      where: { ...patientBranchScope(user), ...doctorScope(user) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, patient: true, encounter: true }
    });
  }

  async getOrder(id: string, user: AuthUser) {
    const order = await this.prisma.investigationOrder.findFirst({
      where: { id, ...patientBranchScope(user), ...doctorScope(user) },
      include: { items: true, patient: true, encounter: true }
    });

    if (!order) {
      throw new NotFoundException("Investigation order not found.");
    }

    return order;
  }

  async updateOrderStatus(id: string, status: InvestigationOrderStatus, user: AuthUser, reason?: string) {
    const existing = await this.getOrder(id, user);
    const trimmedReason = reason?.trim();

    if ((status === "cancelled" || status === "voided") && !trimmedReason) {
      throw new BadRequestException("A reason is required to cancel or void an investigation order.");
    }

    const order = await this.prisma.investigationOrder.update({
      where: { id },
      data: {
        status,
        ...(status === "cancelled" ? { cancellationReason: trimmedReason } : {}),
        ...(status === "voided" ? { voidReason: trimmedReason } : {}),
        items: { updateMany: { where: {}, data: { status } } }
      },
      include: { items: true, patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "investigation_order.status_updated",
      resourceType: "investigation_order",
      resourceId: order.id,
      severity: "high",
      reason: trimmedReason,
      metadataJson: { from: existing.status, to: order.status, reasonCaptured: Boolean(trimmedReason) }
    });

    return order;
  }

  async createClinicalRequest(dto: CreateClinicalRequestDto, user: AuthUser) {
    const order = await this.createOrder(
      {
        patientId: dto.patientId,
        encounterId: dto.encounterId,
        priority: dto.priority,
        notes: dto.requestNote,
        items: dto.items.map((item) => ({
          category: mapRequestType(item.requestType),
          testName: item.title,
          instructions: item.requestNote
        }))
      },
      user
    );

    await this.audit.record({
      actorUserId: user.id,
      action: "clinical_request.created",
      resourceType: "clinical_request",
      resourceId: order.id,
      severity: "high",
      metadataJson: { patientId: order.patientId, itemCount: order.items.length }
    });

    return toClinicalRequest(order);
  }

  async listClinicalRequests(user: AuthUser, patientId?: string) {
    const orders = await this.prisma.investigationOrder.findMany({
      where: { ...(patientId ? { patientId } : {}), ...patientBranchScope(user), ...doctorScope(user) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, patient: true, encounter: true }
    });
    return orders.map(toClinicalRequest);
  }

  async getClinicalRequest(id: string, user: AuthUser) {
    return toClinicalRequest(await this.getOrder(id, user));
  }

  async markResultReceived(id: string, user: AuthUser) {
    const order = await this.updateOrderStatus(id, "result_received", user);
    return toClinicalRequest(order);
  }

  async reviewClinicalRequest(id: string, user: AuthUser) {
    const existing = await this.getOrder(id, user);
    const order = await this.prisma.investigationOrder.update({
      where: { id },
      data: {
        status: "reviewed",
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
        followUpHintActive: false,
        items: { updateMany: { where: {}, data: { status: "reviewed" } } }
      },
      include: { items: true, patient: true, encounter: true }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "clinical_request.reviewed",
      resourceType: "clinical_request",
      resourceId: order.id,
      severity: "high",
      metadataJson: { from: existing.status, to: order.status, patientId: order.patientId }
    });
    return toClinicalRequest(order);
  }

  async cancelClinicalRequest(id: string, reason: string, user: AuthUser) {
    const order = await this.updateOrderStatus(id, "cancelled", user, reason);
    return toClinicalRequest(order);
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, encounter, or doctor was not found.");
    }
    throw error;
  }
}

function toItemCreate(item: InvestigationOrderItemDto) {
  return {
    category: item.category,
    testName: item.testName.trim(),
    instructions: clean(item.instructions)
  };
}

function clean(value?: string) {
  return value?.trim() || null;
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

function mapRequestType(value?: string): InvestigationCategory {
  const key = normalize(value ?? "laboratory");
  if (key.includes("ultrasound")) return "ultrasound";
  if (key.includes("cytology") || key.includes("histopathology") || key.includes("pathology")) return "pathology";
  if (key.includes("procedure") || key.includes("referral") || key.includes("specialist")) return "procedure";
  if (key.includes("radiology") || key.includes("xray") || key.includes("x ray") || key.includes("ct") || key.includes("mri")) return "radiology";
  return "laboratory";
}

function toClinicalRequest(order: Record<string, any>) {
  return {
    id: order.id,
    patientId: order.patientId,
    encounterId: order.encounterId,
    requestType: order.orderType,
    title: (order.items ?? []).map((item: Record<string, any>) => item.testName).filter(Boolean).join(", ") || "Clinical request",
    requestedByUserId: order.doctorId,
    requestNote: order.notes ?? order.clinicalQuestion ?? null,
    status: clinicalStatus(order.status),
    resultDocumentId: order.resultDocumentId ?? null,
    reviewedByUserId: order.reviewedByUserId ?? null,
    reviewedAt: order.reviewedAt ?? null,
    followUpHintActive: order.followUpHintActive !== false && !["reviewed", "cancelled", "voided"].includes(order.status),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    patient: order.patient,
    encounter: order.encounter,
    items: order.items ?? []
  };
}

function clinicalStatus(status: string) {
  if (status === "result_ready") return "result_received";
  if (status === "voided") return "cancelled";
  return status;
}

const investigationCategories = [
  "Routine Labs",
  "Obstetric Investigations",
  "Gynecology Investigations",
  "Infertility Investigations",
  "Recurrent Abortion / RPL",
  "Tumor Markers / Gyn Oncology",
  "Cervix / Pap / HPV / Colposcopy",
  "Endometrial pathology",
  "Ovarian tumors",
  "Imaging / Radiology",
  "Ultrasound-related requests",
  "Pathology / Cytology / Histopathology"
];

const investigationTemplates = [
  { name: "RPL Basic Workup", category: "Recurrent Abortion / RPL", items: ["CBC", "TSH", "HbA1c", "Antiphospholipid antibodies", "Pelvic ultrasound"] },
  { name: "Infertility Initial Workup", category: "Infertility Investigations", items: ["AMH", "TSH", "Prolactin", "Day 2 FSH", "Day 2 LH", "Estradiol"] },
  { name: "PCOS Workup", category: "Gynecology Investigations", items: ["TSH", "Prolactin", "Total testosterone", "HbA1c", "Pelvic ultrasound"] },
  { name: "AUB Workup", category: "Gynecology Investigations", items: ["CBC", "TSH", "Pregnancy test", "Pelvic ultrasound"] },
  { name: "Ovarian Tumor Marker Workup", category: "Tumor Markers / Gyn Oncology", subcategory: "Ovarian tumors", items: ["CA-125", "CEA", "CA 19-9", "AFP", "Beta-hCG", "LDH"] },
  { name: "Antenatal Routine Labs", category: "Obstetric Investigations", items: ["CBC", "Blood group and Rh", "Urine analysis", "Fasting blood glucose", "HBsAg", "HCV antibody"] }
];
