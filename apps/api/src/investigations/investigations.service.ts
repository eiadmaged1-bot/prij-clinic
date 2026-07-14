import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InvestigationCategory, InvestigationOrderStatus, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateClinicalRequestDto,
  CreateInvestigationOrderDto,
  InvestigationCatalogItemDto,
  InvestigationFavoriteSetDto,
  InvestigationOrderItemDto
} from "./dto";

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
          requestedFollowUpDate: dto.requestedFollowUpDate ? new Date(dto.requestedFollowUpDate) : null,
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
    const [items, favorites, favoriteSets, highPriority] = await Promise.all([
      this.searchCatalog(q, category),
      this.prisma.investigationFavorite.findMany({
        where: { userId: user.id },
        include: { investigationCatalogItem: true },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      this.listFavoriteSets(user),
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
      favoriteSets,
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

  listFavoriteSets(user: AuthUser, includeArchived = false) {
    return this.prisma.investigationFavoriteSet.findMany({
      where: {
        OR: [{ userId: user.id }, ...(user.branchId ? [{ scope: "branch", branchId: user.branchId }] : []), { scope: "clinic" }],
        ...(includeArchived ? {} : { active: true })
      },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { investigationCatalogItem: true }
        }
      },
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }]
    });
  }

  async createFavoriteSet(dto: InvestigationFavoriteSetDto, user: AuthUser) {
    const ids = await this.validateFavoriteSetItems(dto.investigationCatalogItemIds);
    const scope = this.favoriteSetScope(dto.scope, user);
    const favoriteSet = await this.prisma.investigationFavoriteSet.create({
      data: {
        userId: user.id,
        name: dto.name.trim(),
        nameAr: clean(dto.nameAr),
        icon: clean(dto.icon),
        scope,
        branchId: scope === "branch" ? user.branchId : null,
        defaultVisitType: clean(dto.defaultVisitType),
        active: dto.active ?? true,
        items: { create: ids.map((investigationCatalogItemId, position) => ({ investigationCatalogItemId, position })) }
      },
      include: { items: { orderBy: { position: "asc" }, include: { investigationCatalogItem: true } } }
    });
    await this.auditFavoriteSet("investigation_favorite_set.created", favoriteSet.id, user, ids.length);
    return favoriteSet;
  }

  async updateFavoriteSet(id: string, dto: InvestigationFavoriteSetDto, user: AuthUser) {
    await this.getOwnedFavoriteSet(id, user);
    const ids = await this.validateFavoriteSetItems(dto.investigationCatalogItemIds);
    const scope = this.favoriteSetScope(dto.scope, user);
    const favoriteSet = await this.prisma.$transaction(async (tx) => {
      await tx.investigationFavoriteSetItem.deleteMany({ where: { favoriteSetId: id } });
      return tx.investigationFavoriteSet.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          nameAr: clean(dto.nameAr),
          icon: clean(dto.icon),
          scope,
          branchId: scope === "branch" ? user.branchId : null,
          defaultVisitType: clean(dto.defaultVisitType),
          active: dto.active ?? true,
          items: { create: ids.map((investigationCatalogItemId, position) => ({ investigationCatalogItemId, position })) }
        },
        include: { items: { orderBy: { position: "asc" }, include: { investigationCatalogItem: true } } }
      });
    });
    await this.auditFavoriteSet("investigation_favorite_set.updated", id, user, ids.length);
    return favoriteSet;
  }

  async duplicateFavoriteSet(id: string, user: AuthUser) {
    const source = await this.getOwnedFavoriteSet(id, user);
    const duplicate = await this.createFavoriteSet(
      {
        name: `${source.name} copy`,
        nameAr: source.nameAr ?? undefined,
        icon: source.icon ?? undefined,
        scope: "personal",
        defaultVisitType: source.defaultVisitType ?? undefined,
        investigationCatalogItemIds: source.items.map((item) => item.investigationCatalogItemId)
      },
      user
    );
    await this.auditFavoriteSet("investigation_favorite_set.duplicated", duplicate.id, user, source.items.length, { sourceId: id });
    return duplicate;
  }

  async archiveFavoriteSet(id: string, user: AuthUser) {
    await this.getOwnedFavoriteSet(id, user);
    const favoriteSet = await this.prisma.investigationFavoriteSet.update({ where: { id }, data: { active: false } });
    await this.auditFavoriteSet("investigation_favorite_set.archived", id, user, 0);
    return favoriteSet;
  }

  listAdminCatalog(q = "") {
    const query = q.trim();
    return this.prisma.investigationCatalogItem.findMany({
      where: query
        ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { code: { contains: query, mode: "insensitive" } }, { category: { contains: query, mode: "insensitive" } }] }
        : {},
      orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
      take: 300
    });
  }

  async createCatalogItem(dto: InvestigationCatalogItemDto, user: AuthUser) {
    const code = dto.code?.trim() || `CUSTOM-${Date.now().toString(36).toUpperCase()}`;
    const item = await this.prisma.investigationCatalogItem.create({
      data: {
        code,
        name: dto.name.trim(),
        normalizedName: normalize(dto.name),
        category: dto.category.trim(),
        subcategory: clean(dto.subcategory),
        clinicalGroup: clean(dto.clinicalGroup),
        modality: clean(dto.modality),
        aliasesJson: dto.aliases?.map((alias) => alias.trim()).filter(Boolean) ?? [],
        discipline: dto.category.trim(),
        active: dto.active ?? true
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "investigation_catalog.created", resourceType: "investigation_catalog_item", resourceId: item.id, severity: "high", metadataJson: { code: item.code } });
    return item;
  }

  async updateCatalogItem(id: string, dto: InvestigationCatalogItemDto, user: AuthUser) {
    const existing = await this.prisma.investigationCatalogItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Investigation catalog item not found.");
    const item = await this.prisma.investigationCatalogItem.update({
      where: { id },
      data: {
        code: dto.code?.trim() || existing.code,
        name: dto.name.trim(),
        normalizedName: normalize(dto.name),
        category: dto.category.trim(),
        subcategory: clean(dto.subcategory),
        clinicalGroup: clean(dto.clinicalGroup),
        modality: clean(dto.modality),
        aliasesJson: dto.aliases?.map((alias) => alias.trim()).filter(Boolean) ?? [],
        discipline: dto.category.trim(),
        active: dto.active ?? existing.active
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "investigation_catalog.updated", resourceType: "investigation_catalog_item", resourceId: item.id, severity: "high", metadataJson: { activeFrom: existing.active, activeTo: item.active } });
    return item;
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
      include: { items: true, patient: true, encounter: true, doctor: { select: { displayName: true } } }
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
        requestedFollowUpDate: dto.requestedFollowUpDate,
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
      include: { items: true, patient: true, encounter: true, doctor: { select: { displayName: true } } }
    });
    return orders.map(toClinicalRequest);
  }

  async getClinicalRequest(id: string, user: AuthUser) {
    return toClinicalRequest(await this.getOrder(id, user));
  }

  async getClinicalRequestPrint(id: string, user: AuthUser) {
    const request = toClinicalRequest(await this.getOrder(id, user));
    await this.audit.record({
      actorUserId: user.id,
      action: "clinical_request.print_viewed",
      resourceType: "clinical_request",
      resourceId: id,
      severity: "high",
      metadataJson: { patientId: request.patientId, itemCount: request.items.length }
    });
    return request;
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

  private async validateFavoriteSetItems(inputIds: string[]) {
    const ids = [...new Set(inputIds)];
    const count = await this.prisma.investigationCatalogItem.count({ where: { id: { in: ids }, active: true } });
    if (count !== ids.length) throw new BadRequestException("One or more selected investigations are unavailable.");
    return ids;
  }

  private async getOwnedFavoriteSet(id: string, user: AuthUser) {
    const favoriteSet = await this.prisma.investigationFavoriteSet.findFirst({
      where: { id, userId: user.id },
      include: { items: { orderBy: { position: "asc" } } }
    });
    if (!favoriteSet) throw new NotFoundException("Investigation favorite set not found.");
    return favoriteSet;
  }

  private auditFavoriteSet(action: string, resourceId: string, user: AuthUser, itemCount: number, metadataJson: Record<string, unknown> = {}) {
    return this.audit.record({
      actorUserId: user.id,
      action,
      resourceType: "investigation_favorite_set",
      resourceId,
      severity: "high",
      metadataJson: { itemCount, ...metadataJson }
    });
  }

  private favoriteSetScope(requested: string | undefined, user: AuthUser) {
    const scope = requested?.trim().toLowerCase() || "personal";
    if (!new Set(["personal", "branch", "clinic"]).has(scope)) throw new BadRequestException("Invalid investigation set scope.");
    if (scope === "branch" && !user.branchId) throw new BadRequestException("A branch is required for branch-scoped sets.");
    if (scope !== "personal" && !user.isSystemOwner && !user.permissions.includes("investigations.manage_catalog")) {
      throw new ForbiddenException("Shared investigation sets require catalog management permission.");
    }
    return scope;
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
    requestedFollowUpDate: order.requestedFollowUpDate ?? null,
    status: clinicalStatus(order.status),
    resultDocumentId: order.resultDocumentId ?? null,
    reviewedByUserId: order.reviewedByUserId ?? null,
    reviewedAt: order.reviewedAt ?? null,
    followUpHintActive: order.followUpHintActive !== false && !["reviewed", "cancelled", "voided"].includes(order.status),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    patient: order.patient,
    encounter: order.encounter,
    doctor: order.doctor ?? null,
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
