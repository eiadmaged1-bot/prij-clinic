import { prisma, reviewSummary } from "./medication-review-utils.mjs";

try {
  console.log(JSON.stringify(await reviewSummary({ countryCode: "BHR" }), null, 2));
} finally {
  await prisma.$disconnect();
}
