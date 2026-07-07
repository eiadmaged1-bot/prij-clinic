import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();

const rules = [
  rule("MISSING_CHIEF_COMPLAINT", "Missing chief complaint", "DOCUMENTATION_COMPLETENESS", "HISTORY_SHEET", "LOW", ["chiefComplaint"], "Chief complaint is not documented.", "Review chief complaint"),
  rule("MISSING_HPI", "Missing HPI", "DOCUMENTATION_COMPLETENESS", "HISTORY_SHEET", "LOW", ["historyOfPresentIllness"], "History of present illness is not documented.", "Review HPI"),
  rule("MISSING_MENSTRUAL_HISTORY", "Missing menstrual history", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "MODERATE", ["menstrualHistory"], "Menstrual history is not documented.", "Review menstrual history"),
  rule("MISSING_OB_HISTORY", "Missing OB history", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "MODERATE", ["obstetricHistory"], "OB history is not documented.", "Review OB history"),
  rule("MISSING_CONTRACEPTION_HISTORY", "Missing contraception history", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "LOW", ["contraceptionHistory"], "Contraception history is not documented.", "Review contraception history"),
  rule("MISSING_PREVIOUS_INVESTIGATIONS", "Missing previous investigations", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "LOW", ["previousInvestigations"], "Previous investigations are not documented.", "Review previous investigations"),
  rule("MISSING_ALLERGY_HISTORY", "Missing allergy history", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "MODERATE", ["allergyHistory"], "Allergy history is not documented. Add the status or note that it was reviewed.", "Review allergy history"),
  rule("MISSING_MEDICATION_HISTORY", "Missing medication history", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "MODERATE", ["medicationHistory"], "Medication history is not documented. Add current/past medication entries or note that it was reviewed.", "Review medication history"),
  rule("MISSING_PREGNANCY_STATUS_BEFORE_PRESCRIPTION", "Missing pregnancy status before prescription safety review", "PREGNANCY_SAFETY", "PRESCRIPTION", "HIGH", ["pregnancyStatus"], "Pregnancy status is not visible for this prescription safety review. Doctor review required.", "Review pregnancy status"),
  rule("MISSING_LACTATION_STATUS_BEFORE_PRESCRIPTION", "Missing lactation status before prescription safety review", "LACTATION_SAFETY", "PRESCRIPTION", "HIGH", ["lactationStatus"], "Lactation status is not visible for this prescription safety review. Doctor review required.", "Review lactation status"),
  rule("MISSING_LMP_OBGYN_HISTORY", "Missing LMP in OB/GYN history", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "MODERATE", ["lmp"], "Last menstrual period is not documented in the history sheet.", "Add or review LMP"),
  rule("MISSING_GRAVIDA_PARA_FIELDS", "Missing gravida/para fields", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "MODERATE", ["gravida", "para"], "Gravida/para fields are incomplete. Add values or document why unavailable.", "Review OB history"),
  rule("MISSING_PREVIOUS_CS_COUNT", "Missing previous CS count", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "LOW", ["previousCsCount"], "Previous cesarean section count is not documented when OB history is reviewed.", "Review previous CS count"),
  rule("MISSING_PAST_SURGICAL_HISTORY", "Missing past surgical history", "HISTORY_COMPLETENESS", "HISTORY_SHEET", "LOW", ["pastSurgicalHistory"], "Past surgical history has not been documented.", "Review surgical history"),
  rule("MISSING_INVESTIGATION_RESULT", "Missing investigation result for ordered investigation", "INVESTIGATION_FOLLOW_UP", "INVESTIGATION_ORDER", "MODERATE", ["investigationResult"], "An investigation order has no linked result yet. Follow-up review may be required.", "Check result status"),
  rule("INVESTIGATION_ORDER_NO_FOLLOW_UP_NOTE", "Investigation order has no follow-up note", "INVESTIGATION_FOLLOW_UP", "INVESTIGATION_ORDER", "LOW", ["followUpNote"], "Investigation follow-up note is not documented.", "Add follow-up note"),
  rule("PRESCRIPTION_DRAFT_NOT_DOCTOR_APPROVED", "Prescription draft has not been doctor-approved", "CLINICAL_SAFETY_REVIEW", "PRESCRIPTION", "HIGH", ["doctorApproval"], "Prescription is still draft. Doctor approval is required before final use.", "Review prescription status"),
  rule("MEDICATION_PROFILE_REVIEW_REQUIRED", "Medication safety profile requires review", "MEDICATION_SAFETY", "PRESCRIPTION", "HIGH", ["medicationSafetyProfile"], "A selected generic medication has a pregnancy/lactation profile marked review required. Doctor review required.", "Review safety profile"),
  rule("MEDICATION_LEGACY_DX_CRITICAL_REVIEW", "Legacy pregnancy category D/X review flag", "PREGNANCY_SAFETY", "PRESCRIPTION", "CRITICAL_REVIEW", ["legacyPregnancyCategory"], "A selected generic medication has a legacy pregnancy category D or X flag. Critical doctor review required.", "Review legacy category"),
  rule("MEDICATION_LACTATION_AVOID_CRITICAL_REVIEW", "Lactation avoid review flag", "LACTATION_SAFETY", "PRESCRIPTION", "CRITICAL_REVIEW", ["lactationRiskLevel"], "A selected generic medication has a lactation avoid flag. Critical doctor review required.", "Review lactation profile"),
  rule("MEDICATION_PROFILE_UNKNOWN_REVIEW_REQUIRED", "Medication safety profile unknown", "MEDICATION_SAFETY", "PRESCRIPTION", "MODERATE", ["medicationSafetyProfile"], "A selected generic medication has unknown pregnancy/lactation profile data. Doctor review required.", "Review source status"),
  rule("NO_NEXT_FOLLOW_UP_DATE_AFTER_ENCOUNTER", "No next follow-up date after encounter", "FOLLOW_UP", "ENCOUNTER", "LOW", ["nextFollowUpDate"], "No next follow-up date is documented after the encounter.", "Review follow-up plan")
];

try {
  await seedPermissions();

  for (const item of rules) {
    await prisma.careAssistRule.upsert({
      where: { code: item.code },
      update: item,
      create: item
    });
  }

  const generics = await prisma.medicationGeneric.findMany({
    where: { isActive: true },
    select: { id: true }
  });

  let createdProfiles = 0;
  for (const generic of generics) {
    const existing = await prisma.medicationSafetyProfile.findUnique({
      where: { medicationGenericId: generic.id },
      select: { id: true }
    });
    if (existing) continue;
    await prisma.medicationSafetyProfile.create({
      data: {
        medicationGenericId: generic.id,
        legacyPregnancyCategory: "REVIEW_REQUIRED",
        lactationRiskLevel: "REVIEW_REQUIRED",
        reviewStatus: "needs_review",
        sourceName: "Not reviewed",
        sourceType: "not_reviewed",
        confidenceLevel: "unknown"
      }
    });
    createdProfiles += 1;
  }

  const counts = {
    rules: await prisma.careAssistRule.count(),
    activeRules: await prisma.careAssistRule.count({ where: { isActive: true } }),
    genericMedications: generics.length,
    medicationSafetyProfiles: await prisma.medicationSafetyProfile.count(),
    createdProfiles
  };
  console.log(`V123-SEED-CARE-ASSIST PASS ${JSON.stringify(counts)}`);
} finally {
  await prisma.$disconnect();
}

function rule(code, title, category, appliesTo, severity, missingFields, messageTemplate, actionLabel) {
  return {
    code,
    title,
    category,
    appliesTo,
    severity,
    triggerJson: { type: "missing_or_review_required", missingFields },
    messageTemplate,
    actionLabel,
    evidenceRequired: category.includes("SAFETY") || severity === "CRITICAL_REVIEW",
    sourceType: "local_rule",
    sourceName: "Dr Maged Attia Clinics v0.12.3 local safety boundary",
    isActive: true
  };
}

async function seedPermissions() {
  const permissionKeys = [
    "care_assist.read",
    "care_assist.evaluate",
    "care_assist.decide",
    "care_assist.manage",
    "medication_safety_profile.manage"
  ];
  const grants = {
    Owner: permissionKeys,
    Admin: permissionKeys,
    Doctor: ["care_assist.read", "care_assist.evaluate", "care_assist.decide"]
  };
  const permissionByKey = new Map();
  for (const key of permissionKeys) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description: `Foundation permission for ${key} access.`, riskLevel: key.includes("manage") ? "high" : "medium" },
      create: { key, description: `Foundation permission for ${key} access.`, riskLevel: key.includes("manage") ? "high" : "medium" }
    });
    permissionByKey.set(key, permission);
  }
  for (const [roleName, keys] of Object.entries(grants)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    for (const key of keys) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permissionByKey.get(key).id } },
        update: {},
        create: { roleId: role.id, permissionId: permissionByKey.get(key).id }
      });
    }
  }
}
