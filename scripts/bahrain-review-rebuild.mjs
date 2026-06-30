import { prisma, rebuildReviewQueue } from "./medication-review-utils.mjs";

try {
  const result = await rebuildReviewQueue({
    countryCode: "BHR",
    sourceCode: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST"
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}
