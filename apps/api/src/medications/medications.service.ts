import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { assertCanReferencePatient } from "../auth/reference-scope";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeMedicationSearch } from "./normalize-medication-search";
import { Prisma } from "@prisma/client";
import { CreatePharmacologySummaryDto } from "./pharmacology-profile.dto";
import { CreateDermatologyFindingDto } from "./dermatology.dto";

@Injectable()
export class MedicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async searchDermatology(query: string) {
    const normalized = normalizeMedicationSearch(query).trim();
    if (normalized.length < 2) return { query, results: [], doctorReviewRequired: true };
    const concepts = dermatologyConcepts(normalized);
    const conditions = await this.prisma.dermatologyCondition.findMany({ where: { OR: concepts.flatMap((term) => [{ stableCode: { contains: term, mode: "insensitive" as const } }, { nameEn: { contains: term, mode: "insensitive" as const } }, { nameAr: { contains: term, mode: "insensitive" as const } }, { aliasesJson: { string_contains: term } }]) }, include: { genericOptions: { where: { reviewStatus: "approved" }, include: { medication: true, source: true } } }, take: 30 });
    return { query, expandedConcepts: concepts, results: conditions.map((condition) => ({ ...condition, assessmentFirst: true, noAutomaticDiagnosisOrTreatment: true })), doctorReviewRequired: true };
  }

  async dermatologyCondition(id: string) {
    const condition = await this.prisma.dermatologyCondition.findUnique({ where: { id }, include: { source: true, genericOptions: { where: { reviewStatus: "approved" }, include: { medication: true, source: true } } } });
    if (!condition) throw new NotFoundException("Dermatology condition not found.");
    return { ...condition, assessmentFirst: true, doctorReviewRequired: true, noAutomaticDiagnosisOrTreatment: true };
  }

  async createClinicalFinding(patientId: string, dto: CreateDermatologyFindingDto, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const encounter = await this.prisma.encounter.findFirst({ where: { id: dto.encounterId, patientId } });
    if (!encounter) throw new BadRequestException("The source encounter does not belong to this patient.");
    if (dto.conditionId && !await this.prisma.dermatologyCondition.findUnique({ where: { id: dto.conditionId } })) throw new BadRequestException("Dermatology condition not found.");
    const finding = await this.prisma.patientClinicalFinding.create({ data: { patientId, encounterId: dto.encounterId, conditionId: dto.conditionId, stableTag: dto.stableTag.trim(), detailsJson: dto.details as never, bodyArea: dto.bodyArea?.trim() || null, status: dto.status ?? "active", confirmation: "doctor_confirmed", nextAction: dto.nextAction?.trim() || null, followUpText: dto.followUp?.trim() || null, createdByUserId: user.id } });
    await this.audit.record({ actorUserId: user.id, action: "PATIENT_CLINICAL_FINDING_CREATED", resourceType: "patient_clinical_finding", resourceId: finding.id, branchId: patient.branchId, severity: "high", metadataJson: { patientId, encounterId: dto.encounterId, stableTag: finding.stableTag, status: finding.status, bodyAreaPresent: Boolean(finding.bodyArea), doctorConfirmed: true } });
    return finding;
  }

  async listClinicalFindings(patientId: string, user: AuthUser) {
    const patient = await assertCanReferencePatient(this.prisma, patientId, user);
    const findings = await this.prisma.patientClinicalFinding.findMany({ where: { patientId }, include: { condition: true, encounter: { select: { id: true, startedAt: true, status: true } }, createdBy: { select: { id: true, displayName: true } } }, orderBy: { createdAt: "desc" } });
    await this.audit.record({ actorUserId: user.id, action: "PATIENT_CLINICAL_FINDINGS_READ", resourceType: "patient", resourceId: patientId, branchId: patient.branchId, severity: "medium", metadataJson: { count: findings.length } });
    return { findings, doctorReviewRequired: true };
  }

  listFamilies() {
    return this.prisma.drugFamily.findMany({ where: { genericMemberships: { some: {} } }, include: { genericMemberships: { include: { medication: true } } }, orderBy: { displayName: "asc" } });
  }

  getFamily(id: string) {
    return this.prisma.drugFamily.findUniqueOrThrow({ where: { id }, include: { genericMemberships: { include: { medication: true } } } });
  }

  async searchPharmacology(query: string) {
    const normalized = normalizeMedicationSearch(query);
    if (normalized.length < 2) return { query, results: [] };
    const concepts = expandPharmacologyConcepts(query);
    const medications = await this.prisma.medicationGeneric.findMany({
      where: { isActive: true },
      include: pharmacologyInclude,
      orderBy: { genericName: "asc" },
      take: 500
    });
    const results = medications.flatMap((medication) => {
      const evidence = pharmacologyEvidence(medication);
      const matchFields = [
        ["generic name", medication.genericName], ["family", medication.familyMemberships.map((item) => item.family.displayName).join(" ")], ["class", `${medication.className ?? ""} ${medication.pharmacologicClass ?? ""}`],
        ["alias", medication.aliasesScoped.map((item) => item.alias).join(" ")], ["mechanism", evidence.mechanism.join(" ")], ["pharmacodynamics", evidence.pharmacodynamics.join(" ")],
        ["adverse effect", evidence.adverseEffects.map((item) => item.name).join(" ")], ["contraindication", evidence.contraindications.map((item) => item.name).join(" ")],
        ["monitoring", evidence.monitoring.map((item) => item.parameter).join(" ")], ["renal/hepatic", `${evidence.renal.map((item) => item.adjustmentStatus).join(" ")} ${evidence.hepatic.map((item) => item.adjustmentStatus).join(" ")}`],
        ["antimicrobial spectrum", spectrumSearchText(evidence.spectrum)]
      ] as const;
      const matches = matchFields.filter(([, value]) => concepts.some((concept) => normalizeMedicationSearch(value).includes(concept)));
      if (!matches.length) return [];
      return [{ id: medication.id, genericName: medication.genericName, family: medication.familyMemberships.map((item) => item.family.displayName).join(", ") || medication.familyName, pharmacologicClass: medication.pharmacologicClass, reviewStatus: medication.reviewStatus, mainUse: "No reviewed indication summary available.", keyCaution: evidence.adverseEffects.slice(0, 3).map((item) => item.name).join(" · ") || "No reviewed caution summary available.", clearance: evidence.renal[0]?.primaryElimination || evidence.hepatic[0]?.primaryMetabolism || "No reviewed clearance summary available.", matchReason: `Matched ${matches.map(([field]) => field).join(", ")} via ${concepts.join(" / ")}`, spectrumMatches: spectrumMatches(evidence.spectrum, concepts), profileCompleteness: evidence.profileCompleteness }];
    });
    const groupedResults = Object.entries(results.reduce<Record<string, typeof results>>((groups, result) => { (groups[result.family || "Other generics"] ??= []).push(result); return groups; }, {})).map(([family, generics]) => ({ family, generics }));
    return { query, expandedConcepts: concepts, results: results.slice(0, 50), groupedResults, genericFirst: true, tradeNamesAreAliasesOnly: true, susceptibilityReviewRequired: true };
  }

  async pharmacologyAtlas() {
    const [families, generics] = await Promise.all([
      this.prisma.drugFamily.findMany({ include: { genericMemberships: { include: { medication: true } } }, orderBy: { displayName: "asc" } }),
      this.prisma.medicationGeneric.findMany({ where: { isActive: true }, include: { familyMemberships: { include: { family: true } } }, orderBy: { genericName: "asc" } })
    ]);
    const rooms = pharmacologyRooms.map((room) => {
      const roomFamilies = families.filter((family) => family.genericMemberships.length > 0 && roomForFamily(family.code, family.displayName) === room.name);
      const roomGenerics = roomFamilies.flatMap((family) => family.genericMemberships.map((membership) => membership.medication));
      return {
        ...room,
        familyCount: roomFamilies.length,
        genericCount: new Set(roomGenerics.map((medication) => medication.id)).size,
        exampleFamilies: roomFamilies.slice(0, 3).map((family) => family.displayName),
        families: roomFamilies.map((family) => ({ id: family.id, code: family.code, name: family.displayName, coverageState: family.genericMemberships.length ? "identity-linked-clinical-sections-may-be-incomplete" : "incomplete", generics: family.genericMemberships.map(({ medication }) => atlasGeneric(medication, family.displayName)) })),
        incompleteFamilies: families.filter((family) => family.genericMemberships.length === 0 && roomForFamily(family.code, family.displayName) === room.name).map((family) => ({ id: family.id, code: family.code, name: family.displayName, coverageState: "incomplete" }))
      };
    });
    const unlinked = generics.filter((generic) => generic.familyMemberships.length === 0);
    const other = rooms.find((room) => room.name === "Other");
    if (other && unlinked.length) other.families.push({ id: "unlinked", code: "UNLINKED", name: "Unlinked / other generics", coverageState: "unlinked", generics: unlinked.map((generic) => atlasGeneric(generic, generic.familyName || "Family not linked")) });
    return {
      rooms,
      familyDirectory: families.map((family) => ({ id: family.id, code: family.code, name: family.displayName, genericCount: family.genericMemberships.length, coverage: family.genericMemberships.length ? "Linked generics available" : "Content being completed" })),
      allGenerics: generics.map((generic) => atlasGeneric(generic, generic.familyMemberships.map((item) => item.family.displayName).join(", ") || generic.familyName || "Family not linked")),
      unlinkedGenerics: unlinked.map((generic) => atlasGeneric(generic, generic.familyName || "Family not linked")),
      recentlyReviewed: generics.filter((generic) => generic.reviewStatus === "reviewed").sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()).slice(0, 10).map((generic) => atlasGeneric(generic, generic.familyMemberships.map((item) => item.family.displayName).join(", ") || generic.familyName || "Family not linked")),
      totals: { families: families.length, generics: generics.length, linkedGenerics: generics.length - unlinked.length, unlinkedGenerics: unlinked.length, familiesBeingCompleted: families.filter((family) => !family.genericMemberships.length).length },
      browseViews: pharmacologyBrowseViews,
      completeDatasetClaimed: false
    };
  }

  async pharmacologyProfile(id: string) {
    const medication = await this.prisma.medicationGeneric.findUnique({ where: { id }, include: pharmacologyInclude });
    if (!medication || !medication.isActive) throw new NotFoundException("Generic medication profile not found.");
    return { id: medication.id, genericName: medication.genericName, family: medication.familyMemberships.map((item) => item.family.displayName).join(", ") || medication.familyName, className: medication.className, pharmacologicClass: medication.pharmacologicClass, reviewStatus: medication.reviewStatus, aliases: medication.aliasesScoped.map((alias) => ({ alias: alias.alias, scopeType: alias.scopeType })), ...pharmacologyEvidence(medication), doctorReviewRequired: true };
  }

  async createPharmacologySummary(id: string, dto: CreatePharmacologySummaryDto, user: AuthUser) {
    const [medication, source] = await Promise.all([this.prisma.medicationGeneric.findUnique({ where: { id } }), this.prisma.pharmacologySource.findUnique({ where: { id: dto.sourceId } })]);
    if (!medication) throw new NotFoundException("Generic medication profile not found.");
    if (!source) throw new BadRequestException("A valid pharmacology source is required.");
    if (!dto.mechanismBullets?.length && !dto.pharmacodynamicBullets?.length && !dto.pharmacokinetics) throw new BadRequestException("Add at least one structured summary section.");
    const created = await this.prisma.$transaction(async (tx) => {
      const mechanism = dto.mechanismBullets ? await tx.mechanismSummary.create({ data: { medicationGenericId: id, sourceId: source.id, bulletsJson: cleanBullets(dto.mechanismBullets), reviewStatus: "needs_review" } }) : null;
      const pharmacodynamics = dto.pharmacodynamicBullets ? await tx.pharmacodynamicSummary.create({ data: { medicationGenericId: id, sourceId: source.id, bulletsJson: cleanBullets(dto.pharmacodynamicBullets), reviewStatus: "needs_review" } }) : null;
      const pk = dto.pharmacokinetics ? await tx.pharmacokineticSummary.create({ data: { medicationGenericId: id, sourceId: source.id, absorptionJson: cleanBullets(dto.pharmacokinetics.absorption ?? []), metabolismJson: cleanBullets(dto.pharmacokinetics.metabolism ?? []), halfLifeJson: cleanBullets(dto.pharmacokinetics.halfLife ?? []), eliminationJson: cleanBullets(dto.pharmacokinetics.elimination ?? []), clinicalNotesJson: cleanBullets(dto.pharmacokinetics.clinicalNotes ?? []), reviewStatus: "needs_review" } }) : null;
      return { mechanism, pharmacodynamics, pharmacokinetics: pk };
    });
    await this.audit.record({ actorUserId: user.id, action: "pharmacology.summary_draft_created", resourceType: "medication_generic", resourceId: id, severity: "high", metadataJson: { sourceId: source.id, sections: Object.entries(created).filter(([, value]) => value).map(([key]) => key), reviewStatus: "needs_review", authorNotePresent: Boolean(dto.authorNote?.trim()), autoApproved: false } });
    return { ...created, reviewStatus: "needs_review", doctorReviewRequired: true };
  }

  async pharmacologyCoverage() {
    const [generics, mechanism, pharmacodynamics, pharmacokinetics, renal, hepatic, pregnancyLactation, spectrum, approvedFormulaVersions] = await Promise.all([
      this.prisma.medicationGeneric.count({ where: { isActive: true } }), this.prisma.mechanismSummary.groupBy({ by: ["medicationGenericId"] }), this.prisma.pharmacodynamicSummary.groupBy({ by: ["medicationGenericId"] }), this.prisma.pharmacokineticSummary.groupBy({ by: ["medicationGenericId"] }), this.prisma.renalGuidance.groupBy({ by: ["medicationGenericId"] }), this.prisma.hepaticGuidance.groupBy({ by: ["medicationGenericId"] }), this.prisma.pregnancyLactationProfile.groupBy({ by: ["medicationGenericId"] }), this.prisma.antimicrobialSpectrum.groupBy({ by: ["medicationGenericId"] }), this.prisma.formulaVersion.count({ where: { approvalStatus: "approved" } })
    ]);
    return { generics, profiles: { mechanism: mechanism.length, pharmacodynamics: pharmacodynamics.length, pharmacokinetics: pharmacokinetics.length, renal: renal.length, hepatic: hepatic.length, pregnancyLactation: pregnancyLactation.length, antimicrobialSpectrum: spectrum.length }, approvedFormulaVersions, completeDatasetClaimed: false, clinicalVerificationClaimed: false };
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

const pharmacologyRooms = [
  ["Respiratory", "🫁"], ["Cardiovascular", "♥"], ["Anti-infectives", "◉"], ["Obstetrics & Gynecology", "♀"], ["Endocrine", "◇"],
  ["Neurology & Psychiatry", "⌁"], ["Pain & Inflammation", "+"], ["Gastrointestinal", "◌"], ["Renal & Urology", "≈"], ["Hematology", "●"],
  ["Dermatology", "◐"], ["Allergy & Immunology", "✦"], ["Emergency medicines", "!"], ["Oncology", "◎"], ["Supplements", "✚"], ["Other", "…"]
].map(([name, icon]) => ({ name, icon }));

const pharmacologyBrowseViews = ["body system", "therapeutic function", "mechanism", "indication", "antimicrobial spectrum", "pregnancy/lactation", "renal handling", "hepatic handling", "monitoring requirement", "route"];

function roomForFamily(code: string, name: string) {
  const value = `${code} ${name}`.toUpperCase();
  if (/SABA|LABA|LAMA|INHALED_CORTICOSTEROID/.test(value)) return "Respiratory";
  if (/ACEI|ARB|BETA_BLOCKER|CCB|DIURETIC|THIAZIDE|STATIN/.test(value)) return "Cardiovascular";
  if (/AMINOGLYCOSIDE|CEPHALOSPORIN|FLUOROQUINOLONE|MACROLIDE|PENICILLIN|TETRACYCLINE|ANTIFUNGAL|ANTIVIRAL/.test(value)) return "Anti-infectives";
  if (/COC|CONTRACEPT|FERTILITY|MAGNESIUM_SULFATE|PROGESTIN|TOCOLYTIC|UTEROTONIC/.test(value)) return "Obstetrics & Gynecology";
  if (/DPP4|GLP1|SGLT2|INSULIN|METFORMIN|ANTITHYROID|THYROID_HORMONE/.test(value)) return "Endocrine";
  if (/SNRI|SSRI|TCA|ANTIEPILEPTIC|ANTIPSYCHOTIC|BENZODIAZEPINE|MOOD_STABILIZER/.test(value)) return "Neurology & Psychiatry";
  if (/NSAID/.test(value)) return "Pain & Inflammation";
  if (/H2_BLOCKER|PPI|ANTIEMETIC/.test(value)) return "Gastrointestinal";
  if (/ANTICOAGULANT|ANTIPLATELET/.test(value)) return "Hematology";
  if (/ANTIHISTAMINE/.test(value)) return "Allergy & Immunology";
  if (/FOLIC_ACID|HERBAL_SUPPLEMENT|IRON_SUPPLEMENT|VITAMIN_SUPPLEMENT/.test(value)) return "Supplements";
  return "Other";
}

function atlasGeneric(medication: { id: string; genericName: string; familyName: string | null; className: string | null; pharmacologicClass: string | null; reviewStatus: string }, family: string) {
  return { id: medication.id, genericName: medication.genericName, family, pharmacologicClass: medication.pharmacologicClass || medication.className, reviewStatus: medication.reviewStatus, mainUse: "Profile sections being completed", keyCaution: "", clearance: "", matchReason: "Browse hierarchy", profileCompleteness: 0 };
}

const pharmacologyInclude = {
  familyMemberships: { include: { family: true } },
  aliasesScoped: { where: { status: "active" } },
  mechanismSummaries: { include: { source: true }, orderBy: { createdAt: "desc" } },
  pharmacodynamicSummaries: { include: { source: true }, orderBy: { createdAt: "desc" } },
  pharmacokineticSummaries: { include: { source: true }, orderBy: { createdAt: "desc" } },
  adverseEffects: { include: { source: true }, orderBy: [{ severity: "asc" }, { name: "asc" }] },
  contraindications: { include: { source: true }, orderBy: { name: "asc" } },
  cautions: { include: { source: true }, orderBy: { riskGroup: "asc" } },
  interactionsPrimary: { include: { source: true, secondaryGeneric: true }, orderBy: { severity: "asc" } },
  monitoringRequirements: { include: { source: true }, orderBy: { parameter: "asc" } },
  pregnancyLactationProfiles: { include: { source: true }, orderBy: { createdAt: "desc" } },
  renalGuidance: { include: { source: true }, orderBy: { createdAt: "desc" } },
  hepaticGuidance: { include: { source: true }, orderBy: { createdAt: "desc" } },
  antimicrobialSpectra: { include: { source: true }, orderBy: { createdAt: "desc" } },
  doseFormulas: { where: { active: true }, include: { versions: { where: { approvalStatus: "approved" }, include: { source: true }, orderBy: { version: "desc" } } } }
} satisfies Prisma.MedicationGenericInclude;

type PharmacologyMedication = Prisma.MedicationGenericGetPayload<{ include: typeof pharmacologyInclude }>;

function pharmacologyEvidence(medication: PharmacologyMedication) {
  const mechanism = medication.mechanismSummaries.flatMap((row) => jsonStrings(row.bulletsJson));
  const pharmacodynamics = medication.pharmacodynamicSummaries.flatMap((row) => jsonStrings(row.bulletsJson));
  const pharmacokinetics = medication.pharmacokineticSummaries.map((row) => ({ absorption: jsonStrings(row.absorptionJson), metabolism: jsonStrings(row.metabolismJson), halfLife: jsonStrings(row.halfLifeJson), elimination: jsonStrings(row.eliminationJson), clinicalNotes: jsonStrings(row.clinicalNotesJson), reviewStatus: row.reviewStatus, source: row.source }));
  const evidenceGroups = [mechanism, pharmacodynamics, pharmacokinetics, medication.adverseEffects, medication.contraindications, medication.cautions, medication.interactionsPrimary, medication.monitoringRequirements, medication.pregnancyLactationProfiles, medication.renalGuidance, medication.hepaticGuidance, medication.antimicrobialSpectra, medication.doseFormulas.flatMap((formula) => formula.versions)];
  return { mechanism, pharmacodynamics, pharmacokinetics, adverseEffects: medication.adverseEffects, contraindications: medication.contraindications, cautions: medication.cautions, interactions: medication.interactionsPrimary, monitoring: medication.monitoringRequirements, pregnancyLactation: medication.pregnancyLactationProfiles, renal: medication.renalGuidance, hepatic: medication.hepaticGuidance, spectrum: medication.antimicrobialSpectra, calculators: medication.doseFormulas.filter((formula) => formula.versions.length), sources: [...new Map(evidenceGroups.flatMap((group) => group.flatMap((row) => typeof row === "object" && row && "source" in row ? [[(row as { source: { id: string } }).source.id, (row as { source: unknown }).source] as const] : [])).map(([key, value]) => [key, value])).values()], profileCompleteness: evidenceGroups.filter((group) => group.length > 0).length };
}

function jsonStrings(value: Prisma.JsonValue) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" ? [value] : [];
}

function spectrumSearchText(rows: PharmacologyMedication["antimicrobialSpectra"]) {
  return rows.map((row) => `gram positive ${row.gramPositive} gram +ve g+ve جرام موجب gram negative ${row.gramNegative} anaerobic ${row.anaerobic} atypical ${row.atypical} pseudomonas antipseudomonal ${row.pseudomonas} mrsa ${row.mrsa} enterococcus ${row.enterococcus} esbl ${row.esblRelevance} intracellular ${row.intracellular} ${row.resistanceLimitations}`).join(" ");
}

function cleanBullets(values: string[]) { return values.map((value) => value.trim()).filter(Boolean); }

const allowedCoverage = new Set(["strong", "variable", "limited", "usually inactive", "resistance-dependent", "unknown/unverified"]);

function spectrumMatches(rows: PharmacologyMedication["antimicrobialSpectra"], concepts: string[]) {
  const labels = [["Gram-positive", "gram positive", "gram +ve", "g+ve", "جرام موجب", "gramPositive"], ["Gram-negative", "gram negative", "جرام سالب", "gramNegative"], ["Anaerobic", "anaerobic", "لاهوائي", "anaerobic"], ["Atypical", "atypical", "atypical"], ["Pseudomonas", "pseudomonas", "antipseudomonal", "pseudomonas"], ["MRSA", "mrsa", "mrsa"], ["Enterococcus", "enterococcus", "enterococcus"], ["ESBL relevance", "esbl", "esblRelevance"], ["Intracellular", "intracellular", "intracellular"]] as const;
  return rows.flatMap((row) => labels.flatMap(([label, ...aliases]) => concepts.some((concept) => aliases.slice(0, -1).some((alias) => normalizeMedicationSearch(alias).includes(concept) || concept.includes(normalizeMedicationSearch(alias)))) ? [{ label, coverage: safeCoverage(String(row[aliases.at(-1) as keyof typeof row] ?? "unknown/unverified")) }] : []));
}

function safeCoverage(value: string) { const normalized = value.toLowerCase().trim(); return allowedCoverage.has(normalized) ? normalized : "unknown/unverified"; }

function expandPharmacologyConcepts(query: string) {
  const normalized = normalizeMedicationSearch(query);
  const groups = [
    ["bronchodilator", "bronchodilation", "saba", "laba", "lama", "beta2 agonist", "موسع قصبي", "موسعات الشعب الهوائية"],
    ["gram positive", "gram +ve", "g+ve", "جرام موجب"],
    ["gram negative", "gram -ve", "g-ve", "جرام سالب"],
    ["anaerobic", "anaerobe", "لاهوائي"], ["atypical", "atypicals"], ["mrsa"], ["enterococcus", "enterococcal"],
    ["pseudomonas", "antipseudomonal"], ["renal", "kidney", "كلوي", "الكلى"], ["hepatic", "liver", "كبدي", "الكبد"],
    ["pregnancy", "pregnant", "الحمل", "حامل"], ["lactation", "breastfeeding", "الرضاعة"]
  ].map((group) => group.map(normalizeMedicationSearch));
  const expanded = groups.find((group) => group.some((alias) => alias === normalized || alias.includes(normalized) || normalized.includes(alias)));
  return [...new Set([normalized, ...(expanded ?? [])])].filter(Boolean);
}

function dermatologyConcepts(query: string) {
  const normalized = normalizeMedicationSearch(query);
  const groups = [
    ["hyperpigmentation", "pigmentation", "تصبغات", "فرط التصبغ"],
    ["sensitive area", "sensitive-area", "منطقة حساسة", "المناطق الحساسة"],
    ["acne", "حب الشباب"], ["melasma", "كلف"], ["dermatitis", "eczema", "التهاب الجلد", "اكزيما"],
    ["psoriasis", "صدفية"], ["rosacea", "وردية"], ["urticaria", "شرى"], ["alopecia", "تساقط الشعر"],
    ["hirsutism", "شعرانية"], ["intertrigo", "التهاب الثنيات"], ["vulvar dermatology", "جلد الفرج"]
  ].map((group) => group.map(normalizeMedicationSearch));
  const expanded = groups.find((group) => group.some((alias) => alias === normalized || alias.includes(normalized) || normalized.includes(alias)));
  return [...new Set([normalized, ...(expanded ?? [])])].filter(Boolean);
}
