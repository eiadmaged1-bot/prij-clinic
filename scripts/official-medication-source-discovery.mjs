import { getSource, parseArgs, prisma, recordBlockedRun } from "./official-medication-utils.mjs";

const args = parseArgs();
const country = args.country ? String(args.country).toUpperCase() : null;

const sources = country
  ? [await getSource(country, args.source)]
  : await prisma.drugMarketSource.findMany({ where: { active: true, sourceType: { in: ["official_registry", "official_api", "official_upload"] } }, orderBy: [{ countryCode: "asc" }, { code: "asc" }] });

for (const source of sources) {
  const checkedAt = new Date();
  let freshness = "unknown";
  let coverageStatus = source.coverageStatus;
  let message = "Source discovery recorded.";
  if (source.sourceAccessMode === "approved_api_required") {
    freshness = "gated";
    coverageStatus = "blocked_requires_api_approval";
    message = "Approved official API access is required. No bypass attempted.";
  } else if (["official_upload", "gated_manual_required"].includes(source.sourceAccessMode)) {
    freshness = "manual_required";
    coverageStatus = "blocked_requires_official_file";
    message = "Official owner-provided file is required for import.";
  } else {
    freshness = "current_checked_today";
  }
  await prisma.drugMarketSource.update({
    where: { id: source.id },
    data: { lastCheckedAt: checkedAt, sourceFreshnessStatus: freshness, coverageStatus }
  });
  if (freshness === "gated" || freshness === "manual_required") await recordBlockedRun(source, "needs_review", message);
  console.log(`${source.countryCode ?? "ALL"} ${source.code}: ${coverageStatus} (${message})`);
}

await prisma.$disconnect();
