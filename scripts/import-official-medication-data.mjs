import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs, prisma } from "./official-medication-utils.mjs";

const args = parseArgs();
if (!args.file) throw new Error("--file is required.");
const dryRun = args["dry-run"] !== "false";
const file = resolve(args.file);
if (!existsSync(file)) throw new Error(`Export file not found: ${file}`);

const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
const manifest = JSON.parse(lines[0]);
const dataLines = lines.slice(1);
const sha256 = createHash("sha256").update(`${dataLines.join("\n")}\n`).digest("hex");
if (sha256 !== manifest.sha256) throw new Error("Export hash verification failed before import.");

const records = dataLines.map((line) => JSON.parse(line));
const counts = {};
for (const record of records) counts[record.type] = (counts[record.type] ?? 0) + 1;

const conflicts = [];
if (!dryRun) {
  for (const type of ["DrugMarketCountry", "DrugMarketSource", "DrugMarketProduct", "DrugMarketImportRun", "OfficialMedicationSourceSnapshot", "DrugMarketVariant", "DrugMarketAvailability", "DrugMarketManualReviewQueue", "DrugMarketMergeCandidate"]) {
    for (const record of records.filter((item) => item.type === type)) await upsertRecord(type, record.data, conflicts);
  }
}

console.log(JSON.stringify({ file, dryRun, counts, conflicts: conflicts.length, conflictSamples: conflicts.slice(0, 10) }, null, 2));
await prisma.$disconnect();

async function upsertRecord(type, data, conflicts) {
  if (type === "DrugMarketCountry") return prisma.drugMarketCountry.upsert({ where: { id: data.id }, create: data, update: data });
  if (type === "DrugMarketSource") return prisma.drugMarketSource.upsert({ where: { id: data.id }, create: data, update: data });
  if (type === "DrugMarketProduct") return prisma.drugMarketProduct.upsert({ where: { id: data.id }, create: data, update: data });
  if (type === "DrugMarketImportRun") return prisma.drugMarketImportRun.upsert({ where: { id: data.id }, create: data, update: data });
  if (type === "OfficialMedicationSourceSnapshot") return prisma.officialMedicationSourceSnapshot.upsert({ where: { id: data.id }, create: data, update: data });
  if (type === "DrugMarketAvailability") return prisma.drugMarketAvailability.upsert({ where: { id: data.id }, create: data, update: data });
  if (type === "DrugMarketManualReviewQueue") return prisma.drugMarketManualReviewQueue.upsert({ where: { id: data.id }, create: data, update: data });
  if (type === "DrugMarketMergeCandidate") return prisma.drugMarketMergeCandidate.upsert({ where: { id: data.id }, create: data, update: data });
  if (type !== "DrugMarketVariant") return null;

  const existing = await prisma.drugMarketVariant.findUnique({ where: { id: data.id } });
  if (existing?.verificationStatus === "verified" && materiallyDifferent(existing, data)) {
    conflicts.push({ type, id: data.id, sourceRowHash: data.sourceRowHash });
    await prisma.drugMarketManualReviewQueue.create({
      data: {
        queueType: "official_data_restore_conflict",
        productId: existing.productId,
        variantId: existing.id,
        status: "open",
        reason: "Verified official medication row differs from restore payload. Manual review required; verified row was not overwritten."
      }
    });
    return null;
  }
  return prisma.drugMarketVariant.upsert({ where: { id: data.id }, create: data, update: data });
}

function materiallyDifferent(existing, incoming) {
  for (const key of ["sourceRowHash", "tradeName", "genericName", "strengthText", "dosageForm", "officialPriceText", "currency", "registrationNumber"]) {
    if (String(existing[key] ?? "") !== String(incoming[key] ?? "")) return true;
  }
  return false;
}
