import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";
import { doctorScope, patientBranchScope } from "../auth/scope";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePrescriptionDto, DoctorMedicationShortcutDto, PrescriptionItemDto, PrescriptionTemplateDto, UpdatePrescriptionDto } from "./dto";

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(dto: CreatePrescriptionDto, user: AuthUser) {
    if (!dto.patientId || !dto.encounterId) {
      throw new BadRequestException("Patient and active visit context are required before saving a prescription draft.");
    }
    await assertCanReferencePatient(this.prisma, dto.patientId, user);
    await assertCanReferenceEncounter(this.prisma, dto.encounterId, user, {
      patientId: dto.patientId,
      requireDoctorScope: true
    });

    try {
      const prescription = await this.prisma.prescription.create({
        data: {
          patientId: dto.patientId,
          encounterId: dto.encounterId ?? null,
          doctorId: user.id,
          sourceType: dto.sourceType ?? "manual",
          printSnapshotJson: jsonOrNull(dto.printSnapshotJson),
          notes: clean(dto.notes),
          items: { create: await this.resolveItems(dto.items) }
        },
        include: { items: true, patient: true, encounter: true }
      });

      await this.audit.record({
        actorUserId: user.id,
        action: "prescription.created",
        resourceType: "prescription",
        resourceId: prescription.id,
        severity: "high",
        metadataJson: { patientId: prescription.patientId, itemCount: dto.items.length, sourceType: prescription.sourceType }
      });

      return prescription;
    } catch (error) {
      this.handlePrismaReferenceError(error);
    }
  }

  async list(user: AuthUser) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: prescriptionScope(user),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.list_read",
      resourceType: "prescription",
      branchId: user.branchId,
      severity: "medium",
      metadataJson: { count: prescriptions.length }
    });

    return prescriptions;
  }

  async get(id: string, user: AuthUser) {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, ...patientBranchScope(user), ...doctorScope(user) },
      include: { items: true, patient: true, encounter: true }
    });

    if (!prescription) {
      throw new NotFoundException("Prescription not found.");
    }

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.read",
      resourceType: "prescription",
      resourceId: prescription.id,
      branchId: prescription.patient?.branchId ?? user.branchId,
      severity: "medium"
    });

    return prescription;
  }

  async update(id: string, dto: UpdatePrescriptionDto, user: AuthUser) {
    const existing = await this.get(id, user);

    if (existing.status === "signed") {
      throw new BadRequestException("Signed prescriptions cannot be edited.");
    }

    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined ? { notes: clean(dto.notes) } : {}),
        ...(dto.items
          ? {
              items: {
                deleteMany: {},
                create: await this.resolveItems(dto.items)
              }
            }
          : {})
      },
      include: { items: true, patient: true, encounter: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.updated",
      resourceType: "prescription",
      resourceId: prescription.id,
      severity: "high",
      metadataJson: { changedFields: Object.keys(dto), itemCount: prescription.items.length }
    });

    return prescription;
  }

  async sign(id: string, user: AuthUser) {
    const existing = await this.get(id, user);

    if (existing.status === "signed") {
      throw new BadRequestException("Prescription is already signed.");
    }

    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: { status: "signed", signedAt: new Date() },
      include: { items: true }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "prescription.signed",
      resourceType: "prescription",
      resourceId: prescription.id,
      severity: "high",
      metadataJson: { patientId: prescription.patientId, itemCount: prescription.items.length }
    });

    return prescription;
  }

  async listTemplates(user: AuthUser) {
    return this.prisma.prescriptionTemplate.findMany({
      where: {
        active: true,
        OR: [{ ownerUserId: null }, { ownerUserId: user.id }]
      },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  async createTemplate(dto: PrescriptionTemplateDto, user: AuthUser) {
    const template = await this.prisma.prescriptionTemplate.create({
      data: {
        ownerUserId: user.roles.includes("Doctor") ? user.id : null,
        title: dto.title.trim(),
        category: clean(dto.category),
        diagnosisOrUseCase: clean(dto.diagnosisOrUseCase),
        active: dto.active ?? true,
        itemsJson: dto.items as unknown as Prisma.InputJsonValue,
        notes: clean(dto.notes),
        createdByUserId: user.id,
        updatedByUserId: user.id
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "prescription_template.created",
      resourceType: "prescription_template",
      resourceId: template.id,
      severity: "medium",
      metadataJson: { itemCount: dto.items.length }
    });
    return template;
  }

  async updateTemplate(id: string, dto: PrescriptionTemplateDto, user: AuthUser) {
    const existing = await this.prisma.prescriptionTemplate.findFirst({
      where: { id, OR: [{ ownerUserId: null }, { ownerUserId: user.id }] }
    });
    if (!existing) throw new NotFoundException("Prescription template not found.");
    const template = await this.prisma.prescriptionTemplate.update({
      where: { id },
      data: {
        title: dto.title.trim(),
        category: clean(dto.category),
        diagnosisOrUseCase: clean(dto.diagnosisOrUseCase),
        active: dto.active ?? existing.active,
        itemsJson: dto.items as unknown as Prisma.InputJsonValue,
        notes: clean(dto.notes),
        updatedByUserId: user.id
      }
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "prescription_template.updated",
      resourceType: "prescription_template",
      resourceId: template.id,
      severity: "medium"
    });
    return template;
  }

  async listShortcuts(user: AuthUser) {
    return this.prisma.doctorMedicationShortcut.findMany({
      where: { doctorUserId: user.id, active: true },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  async createShortcut(dto: DoctorMedicationShortcutDto, user: AuthUser) {
    const shortcut = await this.prisma.doctorMedicationShortcut.create({
      data: shortcutData(dto, user.id)
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_medication_shortcut.created",
      resourceType: "doctor_medication_shortcut",
      resourceId: shortcut.id,
      severity: "medium"
    });
    return shortcut;
  }

  async updateShortcut(id: string, dto: DoctorMedicationShortcutDto, user: AuthUser) {
    const existing = await this.prisma.doctorMedicationShortcut.findFirst({ where: { id, doctorUserId: user.id } });
    if (!existing) throw new NotFoundException("Medication shortcut not found.");
    const shortcut = await this.prisma.doctorMedicationShortcut.update({
      where: { id },
      data: shortcutData(dto, user.id)
    });
    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_medication_shortcut.updated",
      resourceType: "doctor_medication_shortcut",
      resourceId: shortcut.id,
      severity: "medium"
    });
    return shortcut;
  }

  private handlePrismaReferenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new BadRequestException("Referenced patient, encounter, or doctor was not found.");
    }
    throw error;
  }

  private async resolveItems(items: PrescriptionItemDto[]) {
    return Promise.all(items.map((item) => resolvePrescriptionItem(this.prisma, item)));
  }
}

async function resolvePrescriptionItem(prisma: PrismaService, item: PrescriptionItemDto) {
  const base = toItemCreate(item);
  if (item.medicationGenericId) {
    const generic = await prisma.medicationGeneric.findFirst({
      where: { id: item.medicationGenericId, isActive: true, isControlled: false }
    });
    if (!generic) throw new BadRequestException("Generic medication reference was not found or is not available for normal selection.");
    return {
      ...base,
      medicationGenericId: generic.id,
      medicationProductId: null,
      drugMarketVariantId: null,
      medicationName: generic.genericName,
      genericName: generic.genericName,
      brandName: null,
      tradeName: null,
      strengthText: null,
      dosageForm: null
    };
  }

  if (item.drugMarketVariantId) {
    const variant = await prisma.drugMarketVariant.findFirst({
      where: {
        id: item.drugMarketVariantId,
        isDemo: false,
        verificationStatus: { in: ["verified", "needs_review"] }
      },
      include: { product: true }
    });
    if (!variant) throw new BadRequestException("Medication market reference was not found or is not review-ready.");
    return {
      ...base,
      medicationProductId: null,
      drugMarketVariantId: variant.id,
      medicationName: item.medicationName?.trim() || variant.tradeName,
      genericName: variant.genericName ?? variant.product.genericName,
      brandName: variant.product.tradeName,
      tradeName: variant.tradeName,
      strengthText: variant.strengthText,
      dosageForm: variant.dosageForm
    };
  }

  if (item.medicationProductId) {
    const product = await prisma.medicationProduct.findFirst({
      where: { id: item.medicationProductId, verificationStatus: { in: ["verified", "needs_review"] } }
    });
    if (!product) throw new BadRequestException("Medication product reference was not found or is not review-ready.");
    return {
      ...base,
      medicationProductId: product.id,
      drugMarketVariantId: null,
      medicationName: item.medicationName?.trim() || product.brandName || product.genericName,
      genericName: product.genericName,
      brandName: product.brandName,
      tradeName: product.brandName,
      strengthText: product.strengthText,
      dosageForm: product.dosageForm
    };
  }

  return base;
}

function toItemCreate(item: PrescriptionItemDto) {
  return {
    medicationName: item.medicationName.trim(),
    dose: clean(item.dose),
    route: clean(item.route),
    frequency: clean(item.frequency),
    duration: clean(item.duration),
    instructions: clean(item.instructions)
  };
}

function clean(value?: string) {
  return value?.trim() || null;
}

function jsonOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function prescriptionScope(user: AuthUser) {
  if (user.roles.includes("Owner") || user.roles.includes("Admin")) return {};
  if (user.roles.includes("Doctor")) {
    return {
      doctorId: user.id,
      OR: [{ patientId: null }, { patient: { branchId: user.branchId ?? "00000000-0000-0000-0000-000000000000" } }]
    };
  }
  return patientBranchScope(user);
}

function shortcutData(dto: DoctorMedicationShortcutDto, doctorUserId: string) {
  return {
    doctorUserId,
    displayName: dto.displayName.trim(),
    genericName: dto.genericName.trim(),
    optionalBrandOrTradeName: clean(dto.optionalBrandOrTradeName),
    medicationCatalogId: dto.medicationCatalogId ?? null,
    defaultInstructions: clean(dto.defaultInstructions),
    defaultDoseText: clean(dto.defaultDoseText),
    defaultTimingText: clean(dto.defaultTimingText),
    defaultDurationText: clean(dto.defaultDurationText),
    defaultNotes: clean(dto.defaultNotes),
    active: dto.active ?? true
  };
}
