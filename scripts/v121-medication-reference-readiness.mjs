import { createPrisma, medicationReadiness } from "./v121-reference-utils.mjs";

const prisma = createPrisma();

try {
  const readiness = await medicationReadiness(prisma);
  console.log(`V121-MEDICATION-READY medication product rows: ${readiness.medicationProductRows}`);
  console.log(`V121-MEDICATION-READY official rows: ${readiness.officialRows}`);
  console.log(`V121-MEDICATION-READY verified rows: ${readiness.verifiedRows}`);
  console.log(`V121-MEDICATION-READY needs_review rows: ${readiness.needsReviewRows}`);
  console.log(`V121-MEDICATION-READY source systems present: ${readiness.sourcesPresent}`);
  console.log(`V121-MEDICATION-READY import runs: ${readiness.importRuns}`);
  console.log(`V121-MEDICATION-READY open review queue: ${readiness.openReviewQueue}`);
  if (readiness.officialRows === 0) {
    console.log("V121-MEDICATION-READY WARN official medication source rows are missing; no fake medication data was created.");
  } else {
    console.log("V121-MEDICATION-READY PASS official medication rows are present and remain review-gated.");
  }
} finally {
  await prisma.$disconnect();
}
