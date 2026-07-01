import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs, prisma } from "./official-medication-utils.mjs";
import { buildOfficialMedicationSummary, RESTORE_COMPATIBILITY_VERSION } from "./official-medication-data-summary.mjs";

const args = parseArgs();
const includeDemo = args["include-demo"] === "true";
const outputDir = resolve(args.out ?? "storage/official-medication-exports");
mkdirSync(outputDir, { recursive: true });

const exportedAt = new Date().toISOString();
const commitHash = safeGit(["rev-parse", "HEAD"]);
const branch = safeGit(["branch", "--show-current"]);
const appVersion = readPackageVersion();
const tagsAtHead = safeGit(["tag", "--points-at", "HEAD"]).split(/\r?\n/).filter(Boolean);
const fileName = `official-medication-data-${exportedAt.replace(/[:.]/g, "-")}.jsonl`;
const filePath = join(outputDir, fileName);
const lines = [];
const counts = {};

function add(type, data) {
  lines.push(JSON.stringify({ type, data }));
  counts[type] = (counts[type] ?? 0) + 1;
}

const variantWhere = includeDemo ? {} : { isDemo: false };
const variants = await prisma.drugMarketVariant.findMany({ where: variantWhere, orderBy: [{ countryCode: "asc" }, { tradeName: "asc" }, { id: "asc" }] });
const productIds = [...new Set(variants.map((row) => row.productId))];
const sourceIds = [...new Set(variants.map((row) => row.sourceId).filter(Boolean))];
const importRunIds = [...new Set(variants.map((row) => row.importRunId).filter(Boolean))];

const [countries, sources, products, availabilities, importRuns, snapshots, reviewItems, mergeCandidates] = await Promise.all([
  prisma.drugMarketCountry.findMany({ orderBy: { countryCode: "asc" } }),
  prisma.drugMarketSource.findMany({ where: sourceIds.length ? { OR: [{ id: { in: sourceIds } }, { sourceType: "official_upload" }] } : { sourceType: "official_upload" }, orderBy: { code: "asc" } }),
  prisma.drugMarketProduct.findMany({ where: { id: { in: productIds } }, orderBy: { tradeName: "asc" } }),
  prisma.drugMarketAvailability.findMany({ where: { productId: { in: productIds } }, orderBy: [{ countryCode: "asc" }, { productId: "asc" }] }),
  prisma.drugMarketImportRun.findMany({ where: importRunIds.length ? { id: { in: importRunIds } } : { id: "__none__" }, orderBy: { startedAt: "asc" } }),
  prisma.officialMedicationSourceSnapshot.findMany({ where: { OR: [{ importRunId: { in: importRunIds } }, { sourceId: { in: sourceIds } }] }, orderBy: { fetchedAt: "asc" } }),
  prisma.drugMarketManualReviewQueue.findMany({ where: { OR: [{ variantId: { in: variants.map((row) => row.id) } }, { productId: { in: productIds } }] }, orderBy: { createdAt: "asc" } }),
  prisma.drugMarketMergeCandidate.findMany({ where: { OR: [{ primaryProductId: { in: productIds } }, { candidateProductId: { in: productIds } }] }, orderBy: { createdAt: "asc" } })
]);

for (const row of countries) add("DrugMarketCountry", row);
for (const row of sources) add("DrugMarketSource", row);
for (const row of products) add("DrugMarketProduct", row);
for (const row of variants) add("DrugMarketVariant", row);
for (const row of availabilities) add("DrugMarketAvailability", row);
for (const row of importRuns) add("DrugMarketImportRun", row);
for (const row of snapshots) add("OfficialMedicationSourceSnapshot", row);
for (const row of reviewItems) add("DrugMarketManualReviewQueue", row);
for (const row of mergeCandidates) add("DrugMarketMergeCandidate", row);

const dataText = `${lines.join("\n")}\n`;
const sha256 = createHash("sha256").update(dataText).digest("hex");
const summary = await buildOfficialMedicationSummary(prisma, { includeDemo });
summary.sourceCount = counts.DrugMarketSource ?? 0;
summary.importRunCount = counts.DrugMarketImportRun ?? 0;
const manifest = {
  type: "manifest",
  format: "official-medication-jsonl-v1",
  restoreCompatibilityVersion: RESTORE_COMPATIBILITY_VERSION,
  exportedAt,
  commitHash,
  branch,
  appVersion,
  tagsAtHead,
  includeDemo,
  counts,
  summary,
  sha256,
  safety: {
    excludesRawSourceFiles: true,
    excludesPatientData: true,
    excludesSecrets: true,
    marketMetadataOnly: true
  }
};
writeFileSync(filePath, `${JSON.stringify(manifest)}\n${dataText}`);
console.log(JSON.stringify({ file: filePath, manifest }, null, 2));
await prisma.$disconnect();

function safeGit(argv) {
  try {
    return execFileSync("git", argv, { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function readPackageVersion() {
  try {
    return JSON.parse(readFileSync(resolve("package.json"), "utf8")).version ?? "unknown";
  } catch {
    return "unknown";
  }
}
