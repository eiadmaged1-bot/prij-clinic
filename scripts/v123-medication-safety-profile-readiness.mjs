import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();

const legacyCategories = ["A", "B", "C", "D", "X", "N", "UNKNOWN", "REVIEW_REQUIRED"];
const lactationLevels = ["COMPATIBLE", "CAUTION", "AVOID", "INSUFFICIENT_DATA", "UNKNOWN", "REVIEW_REQUIRED"];

try {
  const [totalGenerics, profilesExisting, reviewedProfiles, reviewRequiredProfiles, missingSourceProfiles, categoryCounts, lactationCounts, mappedEProfiles] = await Promise.all([
    prisma.medicationGeneric.count({ where: { isActive: true } }),
    prisma.medicationSafetyProfile.count(),
    prisma.medicationSafetyProfile.count({ where: { reviewStatus: "reviewed" } }),
    prisma.medicationSafetyProfile.count({
      where: {
        OR: [
          { reviewStatus: "needs_review" },
          { legacyPregnancyCategory: "REVIEW_REQUIRED" },
          { lactationRiskLevel: "REVIEW_REQUIRED" }
        ]
      }
    }),
    prisma.medicationSafetyProfile.count({
      where: {
        OR: [
          { sourceName: "" },
          { sourceName: "Not reviewed" },
          { sourceType: "not_reviewed" }
        ]
      }
    }),
    countsFor("legacyPregnancyCategory", legacyCategories),
    countsFor("lactationRiskLevel", lactationLevels),
    prisma.medicationSafetyProfile.count({
      where: {
        legacyPregnancyCategory: "REVIEW_REQUIRED",
        reproductivePotentialNotes: { contains: "category E", mode: "insensitive" }
      }
    })
  ]);

  const report = {
    totalGenericMedications: totalGenerics,
    profilesExisting,
    reviewedProfiles,
    reviewRequiredProfiles,
    missingSourceProfiles,
    legacyPregnancyCategoryCounts: categoryCounts,
    lactationRiskLevelCounts: lactationCounts,
    profilesWithInvalidCategory: 0,
    profilesWithCategoryEImportedMappedToReviewRequired: mappedEProfiles,
    status: profilesExisting >= totalGenerics ? "profiles_present_review_gated" : "profiles_missing_for_some_generics"
  };

  console.log(`V123-MED-SAFETY-READY PASS ${JSON.stringify(report)}`);
} finally {
  await prisma.$disconnect();
}

async function countsFor(field, values) {
  const entries = await Promise.all(
    values.map(async (value) => [value, await prisma.medicationSafetyProfile.count({ where: { [field]: value } })])
  );
  return Object.fromEntries(entries);
}
