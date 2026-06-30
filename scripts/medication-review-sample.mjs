import { parseReviewArgs, prisma, sampleCountryRows } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const rows = await sampleCountryRows({
    countryCode: args.country ? String(args.country).toUpperCase() : undefined,
    take: args.take ?? args.limit ?? 10
  });
  console.table(rows);
} finally {
  await prisma.$disconnect();
}
