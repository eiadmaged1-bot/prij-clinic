import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "./official-medication-utils.mjs";

const args = parseArgs();
const file = resolve(args.file ?? latestExportFile());
if (!existsSync(file)) throw new Error(`Export file not found: ${file}`);

const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
const manifest = JSON.parse(lines[0]);
if (manifest.type !== "manifest") throw new Error("First JSONL line must be the manifest.");
const dataText = `${lines.slice(1).join("\n")}\n`;
const sha256 = createHash("sha256").update(dataText).digest("hex");
if (sha256 !== manifest.sha256) throw new Error(`Export sha256 mismatch: ${sha256} !== ${manifest.sha256}`);

const counts = {};
let patientLikeRecords = 0;
for (const line of lines.slice(1)) {
  const record = JSON.parse(line);
  counts[record.type] = (counts[record.type] ?? 0) + 1;
  if (/patient|encounter|prescription|invoice|payment/i.test(record.type)) patientLikeRecords += 1;
}
for (const [type, count] of Object.entries(manifest.counts ?? {})) {
  if (counts[type] !== count) throw new Error(`Manifest count mismatch for ${type}: ${counts[type] ?? 0} !== ${count}`);
}
if (patientLikeRecords) throw new Error("Export contains patient/clinical/billing record types.");
if (!manifest.includeDemo && (manifest.counts.DrugMarketVariant ?? 0) !== 8269) throw new Error("Default export must preserve exactly 8,269 real official variants.");
console.log(JSON.stringify({ file, status: "verified", counts, sha256 }, null, 2));

function latestExportFile() {
  const dir = resolve("storage/official-medication-exports");
  const files = existsSync(dir)
    ? readdirSync(dir).filter((name) => name.endsWith(".jsonl")).sort()
    : [];
  if (!files.length) throw new Error("No official medication export file found. Run medication:official-data:export first.");
  return `${dir}/${files.at(-1)}`;
}
