import { parseReviewArgs, prisma, reviewSummary } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const result = await reviewSummary({
    countryCode: args.country ? String(args.country).toUpperCase() : undefined
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}
