import { parseReviewArgs, prisma, rebuildReviewQueue } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const result = await rebuildReviewQueue({
    countryCode: args.country ? String(args.country).toUpperCase() : undefined,
    sourceCode: args.source
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}
