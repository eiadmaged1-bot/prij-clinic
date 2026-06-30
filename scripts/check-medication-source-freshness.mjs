import { prisma } from "./official-medication-utils.mjs";

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
const sources = await prisma.drugMarketSource.findMany({ where: { active: true }, orderBy: [{ countryCode: "asc" }, { code: "asc" }] });
for (const source of sources) {
  let status = source.sourceFreshnessStatus;
  if (source.coverageStatus === "failed") status = "failed";
  else if (source.sourceAccessMode === "approved_api_required") status = "gated";
  else if (["official_upload", "gated_manual_required"].includes(source.sourceAccessMode) && !source.lastSuccessfulImportAt) status = "manual_required";
  else if (source.lastCheckedAt && now - source.lastCheckedAt.getTime() <= dayMs) status = "current_checked_today";
  else if (source.lastCheckedAt && now - source.lastCheckedAt.getTime() <= 30 * dayMs) status = "current_recent";
  else if (source.lastCheckedAt) status = "stale";
  await prisma.drugMarketSource.update({ where: { id: source.id }, data: { sourceFreshnessStatus: status } });
  console.log(`${source.countryCode ?? "ALL"} ${source.code}: ${status}`);
}
await prisma.$disconnect();
