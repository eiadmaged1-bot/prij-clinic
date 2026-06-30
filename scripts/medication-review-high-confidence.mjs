import { highConfidenceRows, parseReviewArgs, prisma } from "./medication-review-utils.mjs";

const args = parseReviewArgs();
try {
  const rows = await highConfidenceRows({
    countryCode: args.country ? String(args.country).toUpperCase() : undefined,
    sourceCode: args.source,
    limit: args.limit ?? 100
  });
  console.log(JSON.stringify({
    countryCode: args.country ? String(args.country).toUpperCase() : "ALL",
    sourceCode: args.source ?? "ALL",
    highConfidenceCandidates: rows.length,
    rows: rows.map(({ variant, classification }) => ({
      id: variant.id,
      countryCode: variant.countryCode,
      tradeName: variant.tradeName,
      genericName: variant.genericName,
      registrationNumber: variant.registrationNumber,
      parserConfidence: variant.parserConfidence,
      verificationStatus: variant.verificationStatus,
      sourceCode: classification.sourceCode
    }))
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
