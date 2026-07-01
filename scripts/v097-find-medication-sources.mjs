import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(".");
const searchDirs = [
  "storage/official-medication-exports",
  "storage/official-medication-restore-drills",
  "storage/drug-market",
  "storage/medications",
  "apps/api/storage",
  "uploads",
  "docs/medication-data",
  "scripts",
  "apps/api/prisma/seeds"
];
const supportedExt = new Set([".json", ".jsonl", ".csv", ".xlsx", ".xls", ".zip"]);
const candidates = [];

for (const dir of searchDirs) scanDir(resolve(root, dir));

candidates.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
console.log("V097 MEDICATION SOURCE DISCOVERY");
if (!candidates.length) console.log("WARN no candidate medication source/export files found in known local ignored/project locations");
for (const item of candidates) {
  console.log(JSON.stringify(item));
}
console.log(`V097-FIND SUMMARY candidates=${candidates.length} officialLike=${candidates.filter((item) => item.officialLike).length} withStatus=${candidates.filter((item) => item.containsVerificationStatus).length}`);

function scanDir(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (/node_modules|\.git|playwright-report|test-results|screenshots|backups|logs/i.test(path)) continue;
      scanDir(path);
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = extname(entry.name).toLowerCase();
    if (!supportedExt.has(extension)) continue;
    candidates.push(inspectFile(path, extension));
  }
}

function inspectFile(path, extension) {
  const stat = statSync(path);
  const sample = readSample(path, extension);
  const combined = `${path}\n${sample}`.toLowerCase();
  const likelySource = detectSource(combined);
  const officialLike = /official-medication-data|drugmarketvariant|registered medicine|registered pharmaceutical|nhra|moh|sfda|eda|mohap|official medication|drug market/i.test(combined);
  const containsVerificationStatus = /verificationstatus|verification_status|verified|needs_review|manualreview|review status/i.test(sample);
  return {
    path,
    type: extension.slice(1),
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    sha256Prefix: hashPrefix(path),
    likelySource,
    officialLike,
    containsVerificationStatus
  };
}

function readSample(path, extension) {
  if (extension === ".xlsx" || extension === ".xls" || extension === ".zip") return "";
  const buffer = readFileSync(path);
  return buffer.subarray(0, Math.min(buffer.length, 64 * 1024)).toString("utf8");
}

function hashPrefix(path) {
  return createHash("sha256").update(readFileSync(path).subarray(0, 1024 * 1024)).digest("hex").slice(0, 16);
}

function detectSource(text) {
  const matches = [];
  for (const [label, pattern] of [
    ["Bahrain/NHRA", /bahrain|nhra|bhr/],
    ["Oman/MOH", /oman|moh_registered|omn/],
    ["Saudi/SFDA", /sfda|saudi|ksa/],
    ["UAE/MOHAP", /uae|mohap|united arab emirates/],
    ["Egypt/EDA", /egypt|eda|eddb/],
    ["Qatar/MOPH", /qatar|moph|qat/],
    ["Kuwait/MOH", /kuwait|kwt/]
  ]) {
    if (pattern.test(text)) matches.push(label);
  }
  return matches.join(", ") || "unknown";
}
