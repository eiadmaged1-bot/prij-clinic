import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeMedicationSearch } from "./normalize-medication-search";

@Injectable()
export class MedicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  listFamilies() {
    return this.prisma.drugFamily.findMany({ orderBy: { displayName: "asc" } });
  }

  getFamily(id: string) {
    return this.prisma.drugFamily.findUniqueOrThrow({ where: { id } });
  }

  async createFamily(dto: Record<string, string>, user: AuthUser) {
    const displayName = clean(dto.displayName || dto.name);
    if (!displayName) throw new BadRequestException("Family name is required.");
    const family = await this.prisma.drugFamily.create({
      data: {
        code: clean(dto.code)?.toUpperCase() || displayName.toUpperCase().replace(/\s+/g, "_"),
        displayName,
        aliases: dto.aliases ? String(dto.aliases).split(",").map((item) => item.trim()).filter(Boolean) : [],
        normalizedSearchText: normalizeMedicationSearch(`${dto.code ?? ""} ${displayName} ${dto.aliases ?? ""}`),
        verificationStatus: dto.verificationStatus ?? "draft"
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "medication_catalog.family_created", resourceType: "drug_family", resourceId: family.id, severity: "high" });
    return family;
  }

  updateFamily(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.drugFamily
      .update({
        where: { id },
        data: {
          ...(dto.displayName ? { displayName: dto.displayName.trim() } : {}),
          ...(dto.aliases ? { aliases: dto.aliases.split(",").map((item) => item.trim()).filter(Boolean) } : {}),
          ...(dto.verificationStatus ? { verificationStatus: dto.verificationStatus } : {})
        }
      })
      .then(async (family) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.family_updated", resourceType: "drug_family", resourceId: family.id, severity: "high" });
        return family;
      });
  }

  listIngredients() {
    return this.prisma.medicationIngredient.findMany({ include: { familyMemberships: { include: { family: true } } }, orderBy: { genericName: "asc" }, take: 100 });
  }

  getIngredient(id: string) {
    return this.prisma.medicationIngredient.findUniqueOrThrow({ where: { id }, include: { familyMemberships: { include: { family: true } }, labelSections: true } });
  }

  async createIngredient(dto: Record<string, string>, user: AuthUser) {
    const genericName = clean(dto.genericName || dto.name);
    if (!genericName) throw new BadRequestException("Generic name is required.");
    const ingredient = await this.prisma.medicationIngredient.create({
      data: {
        genericName,
        scientificName: clean(dto.scientificName),
        normalizedSearchText: normalizeMedicationSearch(`${genericName} ${dto.scientificName ?? ""} ${dto.atcCode ?? ""}`),
        atcCode: clean(dto.atcCode),
        verificationStatus: dto.verificationStatus ?? "draft"
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "medication_catalog.ingredient_created", resourceType: "medication_ingredient", resourceId: ingredient.id, severity: "high" });
    return ingredient;
  }

  updateIngredient(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.medicationIngredient
      .update({
        where: { id },
        data: {
          ...(dto.genericName ? { genericName: dto.genericName.trim() } : {}),
          ...(dto.scientificName !== undefined ? { scientificName: clean(dto.scientificName) } : {}),
          ...(dto.verificationStatus ? { verificationStatus: dto.verificationStatus } : {})
        }
      })
      .then(async (ingredient) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.ingredient_updated", resourceType: "medication_ingredient", resourceId: ingredient.id, severity: "high" });
        return ingredient;
      });
  }

  listProducts() {
    return this.prisma.medicationProduct.findMany({ include: { ingredient: true }, orderBy: { genericName: "asc" }, take: 100 });
  }

  getProduct(id: string) {
    return this.prisma.medicationProduct.findUniqueOrThrow({ where: { id }, include: { ingredient: { include: { familyMemberships: { include: { family: true } } } }, labelSections: true } });
  }

  async createProduct(dto: Record<string, string>, user: AuthUser) {
    const genericName = clean(dto.genericName);
    if (!genericName) throw new BadRequestException("Generic name is required.");
    const product = await this.prisma.medicationProduct.create({
      data: {
        genericName,
        brandName: clean(dto.brandName),
        dosageForm: clean(dto.dosageForm),
        route: clean(dto.route),
        strengthText: clean(dto.strengthText),
        normalizedSearchText: normalizeMedicationSearch(`${genericName} ${dto.brandName ?? ""} ${dto.strengthText ?? ""} ${dto.dosageForm ?? ""}`),
        verificationStatus: dto.verificationStatus ?? "draft"
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "medication_catalog.product_created", resourceType: "medication_product", resourceId: product.id, severity: "high" });
    return product;
  }

  updateProduct(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.medicationProduct
      .update({
        where: { id },
        data: {
          ...(dto.brandName !== undefined ? { brandName: clean(dto.brandName) } : {}),
          ...(dto.dosageForm !== undefined ? { dosageForm: clean(dto.dosageForm) } : {}),
          ...(dto.route !== undefined ? { route: clean(dto.route) } : {}),
          ...(dto.strengthText !== undefined ? { strengthText: clean(dto.strengthText) } : {}),
          ...(dto.verificationStatus ? { verificationStatus: dto.verificationStatus } : {})
        }
      })
      .then(async (product) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.product_updated", resourceType: "medication_product", resourceId: product.id, severity: "high" });
        return product;
      });
  }

  labelSectionsForIngredient(id: string) {
    return this.prisma.medicationLabelSection.findMany({ where: { ingredientId: id }, orderBy: { createdAt: "desc" } });
  }

  labelSectionsForProduct(id: string) {
    return this.prisma.medicationLabelSection.findMany({ where: { productId: id }, orderBy: { createdAt: "desc" } });
  }

  addLabelSection(target: { ingredientId?: string; productId?: string }, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.medicationLabelSection
      .create({
        data: {
          ...target,
          sectionType: dto.sectionType ?? "warnings",
          title: dto.title ?? "Review section",
          summaryText: dto.summaryText ?? "Doctor review required.",
          verificationStatus: dto.verificationStatus ?? "needs_review"
        }
      })
      .then(async (section) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.label_section_created", resourceType: "medication_label_section", resourceId: section.id, severity: "high" });
        return section;
      });
  }

  listInteractions() {
    return this.prisma.medicationInteractionRule.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  }

  createInteraction(dto: Record<string, string>, user: AuthUser) {
    return this.prisma.medicationInteractionRule
      .create({
        data: {
          ruleType: dto.ruleType ?? "drug_drug",
          severity: dto.severity ?? "moderate",
          alertTitle: dto.alertTitle ?? dto.title ?? "Medication interaction review",
          alertSummary: dto.alertSummary ?? dto.summary ?? "Doctor review required.",
          verificationStatus: dto.verificationStatus ?? "needs_review"
        }
      })
      .then(async (rule) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.interaction_created", resourceType: "medication_interaction_rule", resourceId: rule.id, severity: "high" });
        return rule;
      });
  }

  updateInteraction(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.medicationInteractionRule
      .update({ where: { id }, data: { ...(dto.severity ? { severity: dto.severity } : {}), ...(dto.verificationStatus ? { verificationStatus: dto.verificationStatus } : {}) } })
      .then(async (rule) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.interaction_updated", resourceType: "medication_interaction_rule", resourceId: rule.id, severity: "high" });
        return rule;
      });
  }

  listHerbals() {
    return this.prisma.herbalProduct.findMany({ orderBy: { commonName: "asc" }, take: 100 });
  }

  getHerbal(id: string) {
    return this.prisma.herbalProduct.findUniqueOrThrow({ where: { id } });
  }

  createHerbal(dto: Record<string, string>, user: AuthUser) {
    const commonName = clean(dto.commonName || dto.name);
    if (!commonName) throw new BadRequestException("Herbal name is required.");
    return this.prisma.herbalProduct
      .create({
        data: {
          commonName,
          botanicalName: clean(dto.botanicalName),
          normalizedSearchText: normalizeMedicationSearch(`${commonName} ${dto.botanicalName ?? ""} ${dto.aliases ?? ""}`),
          cautionSummary: clean(dto.cautionSummary) ?? "Doctor review required.",
          verificationStatus: dto.verificationStatus ?? "needs_review"
        }
      })
      .then(async (herbal) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.herbal_created", resourceType: "herbal_product", resourceId: herbal.id, severity: "high" });
        return herbal;
      });
  }

  updateHerbal(id: string, dto: Record<string, string>, user: AuthUser) {
    return this.prisma.herbalProduct
      .update({ where: { id }, data: { ...(dto.commonName ? { commonName: dto.commonName.trim() } : {}), ...(dto.verificationStatus ? { verificationStatus: dto.verificationStatus } : {}) } })
      .then(async (herbal) => {
        await this.audit.record({ actorUserId: user.id, action: "medication_catalog.herbal_updated", resourceType: "herbal_product", resourceId: herbal.id, severity: "high" });
        return herbal;
      });
  }

  async listPatientMedications(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.patientMedication.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } });
  }

  async addPatientMedication(patientId: string, dto: Record<string, string>, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const displayName = clean(dto.displayName || dto.medicationName || dto.tradeName || dto.genericName);
    if (!displayName) throw new BadRequestException("Medication name is required.");
    const medication = await this.prisma.patientMedication.create({
      data: {
        patientId,
        medicationType: dto.medicationType ?? "prescription",
        displayName,
        genericName: clean(dto.genericName),
        tradeName: clean(dto.tradeName),
        strengthText: clean(dto.strengthText),
        dosageForm: clean(dto.dosageForm),
        route: clean(dto.route),
        sourceText: clean(dto.sourceText),
        recordedByUserId: user.id
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_medication.added", resourceType: "patient_medication", resourceId: medication.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId } });
    return medication;
  }

  async updatePatientMedication(patientId: string, medicationId: string, dto: Record<string, string>, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const medication = await this.prisma.patientMedication.update({
      where: { id: medicationId },
      data: {
        ...(dto.displayName ? { displayName: dto.displayName.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.sourceText !== undefined ? { sourceText: clean(dto.sourceText) } : {})
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_medication.updated", resourceType: "patient_medication", resourceId: medication.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId } });
    return medication;
  }

  async stopPatientMedication(patientId: string, medicationId: string, dto: Record<string, string>, user: AuthUser) {
    if (!dto.reason?.trim()) throw new BadRequestException("Stop reason is required.");
    const reason = dto.reason.trim();
    return this.updatePatientMedication(patientId, medicationId, { status: "stopped", sourceText: reason }, user).then(async (medication) => {
      const stopped = await this.prisma.patientMedication.update({ where: { id: medication.id }, data: { stoppedAt: new Date(), stoppedByUserId: user.id, stopReason: reason } });
      await this.audit.record({ actorUserId: user.id, action: "patient_medication.stopped", resourceType: "patient_medication", resourceId: stopped.id, severity: "high", reason, metadataJson: { patientId } });
      return stopped;
    });
  }

  async listPatientAllergies(patientId: string, user: AuthUser) {
    await assertCanReferencePatient(this.prisma, patientId, user);
    return this.prisma.patientAllergy.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } });
  }

  async addPatientAllergy(patientId: string, dto: Record<string, string>, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const displayName = clean(dto.displayName || dto.allergyName);
    if (!displayName) throw new BadRequestException("Allergy name is required.");
    const allergy = await this.prisma.patientAllergy.create({
      data: {
        patientId,
        allergyType: dto.allergyType ?? "medication",
        displayName,
        reactionText: clean(dto.reactionText),
        severity: dto.severity ?? "unknown",
        recordedByUserId: user.id
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_allergy.added", resourceType: "patient_allergy", resourceId: allergy.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId } });
    return allergy;
  }

  async updatePatientAllergy(patientId: string, allergyId: string, dto: Record<string, string>, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const allergy = await this.prisma.patientAllergy.update({
      where: { id: allergyId },
      data: {
        ...(dto.displayName ? { displayName: dto.displayName.trim() } : {}),
        ...(dto.reactionText !== undefined ? { reactionText: clean(dto.reactionText) } : {}),
        ...(dto.severity ? { severity: dto.severity } : {}),
        ...(dto.status ? { status: dto.status } : {})
      }
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_allergy.updated", resourceType: "patient_allergy", resourceId: allergy.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId } });
    return allergy;
  }
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}
