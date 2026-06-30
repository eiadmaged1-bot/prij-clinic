import { parseReviewArgs, prisma, sampleCountryRows } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const rows = await sampleCountryRows({ countryCode: "BHR", take: args.take ?? 10 });
  console.table(rows);
} finally {
  await prisma.$disconnect();
}
