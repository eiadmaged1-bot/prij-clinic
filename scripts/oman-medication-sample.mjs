import { parseReviewArgs, prisma, sampleCountryRows } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  console.table(await sampleCountryRows({ countryCode: "OMN", take: args.take ?? args.limit ?? 10 }));
} finally {
  await prisma.$disconnect();
}
