import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { prisma } from "./official-medication-utils.mjs";

const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
  console.log(`PRESERVATION PASS ${message}`);
}

const output = execFileSync("node", ["scripts/export-official-medication-data.mjs"], { encoding: "utf8" });
const parsed = JSON.parse(output);
const file = parsed.file;
assert(existsSync(file), "export creates local JSONL file");
assert(parsed.manifest.counts.DrugMarketVariant === 8269, "export includes 8,269 real variants by default");
assert(parsed.manifest.includeDemo === false, "export excludes demo rows by default");
assert(parsed.manifest.counts.DrugMarketManualReviewQueue >= 8069, "export includes review history/items");

const verifyOutput = execFileSync("node", ["scripts/verify-official-medication-export.mjs", "--file", file], { encoding: "utf8" });
const verified = JSON.parse(verifyOutput);
assert(verified.status === "verified", "export verifier validates manifest and sha256");

const importOutput = execFileSync("node", ["scripts/import-official-medication-data.mjs", "--file", file], { encoding: "utf8" });
const dryRun = JSON.parse(importOutput);
assert(dryRun.dryRun === true && dryRun.counts.DrugMarketVariant === 8269, "restore dry-run reports counts without writing");

const ignore = readFileSync(".gitignore", "utf8");
assert(ignore.includes("storage/*"), "storage export files are gitignored");
assert(!readFileSync(file, "utf8").includes("\"Patient\""), "export does not include patient records");

const [realRows, verifiedRows, demoRows] = await Promise.all([
  prisma.drugMarketVariant.count({ where: { isDemo: false } }),
  prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "verified" } }),
  prisma.drugMarketVariant.count({ where: { isDemo: true } })
]);
assert(realRows === 8269, "Bahrain/Oman rows survive seed");
assert(verifiedRows >= 200, "verified rows survive seed");
assert(demoRows === 23, "demo row count remains 23");

console.log(`PRESERVATION SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
await prisma.$disconnect();
