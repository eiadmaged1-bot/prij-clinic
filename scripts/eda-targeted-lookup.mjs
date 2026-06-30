import { parseArgs, prisma } from "./official-medication-utils.mjs";

const args = parseArgs();
const query = String(args.query ?? "").trim();
const type = String(args.type ?? "tradeName").trim();

try {
  if (query.length < 3) {
    throw new Error("Egypt EDA targeted lookup requires one explicit query of at least 3 characters.");
  }
  if (args.batch || args.file || args.enumerate || query.includes("*")) {
    throw new Error("Egypt EDA targeted lookup does not support bulk enumeration, wildcard search, or file batches.");
  }
  const source = await prisma.drugMarketSource.findUnique({ where: { code: "EDA_EDDB_SEARCH" } });
  if (!source) throw new Error("EDA_EDDB_SEARCH source is not configured.");
  await prisma.drugMarketImportRun.create({
    data: {
      sourceId: source.id,
      status: "needs_review",
      dryRun: true,
      message: "Targeted EDA lookup requires manual public-session verification. No bypass attempted.",
      rowCount: 0,
      totalRowsSeen: 0,
      rowsImported: 0,
      rowsSkipped: 0,
      rowsFailed: 0,
      parserName: "egypt-eda-targeted-lookup",
      parserVersion: "v0.8.1",
      coverageJson: { countryCode: "EG", queryType: type, query, status: "targeted_lookup_gated" },
      finishedAt: new Date()
    }
  });
  await prisma.drugMarketSource.update({
    where: { id: source.id },
    data: {
      lastCheckedAt: new Date(),
      sourceFreshnessStatus: "manual_required",
      coverageStatus: "partial"
    }
  });
  console.log(JSON.stringify({ source: "EDA_EDDB_SEARCH", status: "targeted_lookup_gated", rowsImported: 0, queryType: type, query }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "failed", rowsImported: 0, reason: error instanceof Error ? error.message : "EDA targeted lookup failed." }, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
