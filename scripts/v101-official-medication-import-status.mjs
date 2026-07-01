import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const inboxPath = resolve("storage/official-medication-sources");
const manifestPath = join(inboxPath, "source-manifest.json");
const supportedExtensions = new Set([".csv", ".xlsx", ".xls", ".json", ".jsonl", ".zip"]);
const parseableExtensions = new Set([".csv", ".xlsx", ".xls", ".json", ".jsonl"]);
const prisma = new PrismaClient();

const status = {
  generatedAt: new Date().toISOString(),
  officialRowCount: 0,
  verifiedRowCount: 0,
  needsReviewRowCount: 0,
  importStatus: "blocked",
  inboxPath,
  inboxExists: existsSync(inboxPath),
  inboxFileCount: 0,
  supportedCandidateCount: 0,
  parseableCandidateCount: 0,
  unsupportedFileCount: 0,
  supportedCandidates: [],
  unsupportedFiles: [],
  lastManifest: null,
  prescriptionMedicationSelectionTestable: false,
  notes: []
};

try {
  await readCounts();
  readInbox();
  readManifest();
  status.importStatus = status.parseableCandidateCount > 0 ? "ready_for_dry_run" : "blocked";
  if (status.officialRowCount === 0) status.notes.push("Official rows remain 0 until authorized official files are imported.");
  if (!status.inboxExists) status.notes.push("Inbox does not exist yet. Run source-list or create storage/official-medication-sources/.");
  if (status.supportedCandidateCount > status.parseableCandidateCount) status.notes.push("ZIP files must be reviewed/extracted before v100 reimport can parse them.");
} catch (error) {
  status.importStatus = "blocked";
  status.notes.push(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  console.log(JSON.stringify(status, null, 2));
  await prisma.$disconnect();
}

async function readCounts() {
  status.officialRowCount = await prisma.drugMarketVariant.count({ where: { isDemo: false } });
  status.verifiedRowCount = await prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "verified" } });
  status.needsReviewRowCount = await prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "needs_review" } });
  status.prescriptionMedicationSelectionTestable = await prisma.drugMarketVariant.count({
    where: { isDemo: false, verificationStatus: { in: ["verified", "needs_review"] } }
  }) > 0;
}

function readInbox() {
  if (!status.inboxExists) return;
  const files = readdirSync(inboxPath)
    .filter((name) => name !== "source-manifest.json")
    .map((name) => {
      const path = join(inboxPath, name);
      const stat = statSync(path);
      const extension = extname(name).toLowerCase();
      return { fileName: name, path, extension, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() };
    })
    .filter((file) => statSync(file.path).isFile());

  status.inboxFileCount = files.length;
  status.supportedCandidates = files.filter((file) => supportedExtensions.has(file.extension));
  status.unsupportedFiles = files.filter((file) => !supportedExtensions.has(file.extension));
  status.supportedCandidateCount = status.supportedCandidates.length;
  status.parseableCandidateCount = status.supportedCandidates.filter((file) => parseableExtensions.has(file.extension)).length;
  status.unsupportedFileCount = status.unsupportedFiles.length;
}

function readManifest() {
  if (!existsSync(manifestPath)) return;
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  status.lastManifest = {
    path: manifestPath,
    updatedAt: parsed.updatedAt ?? null,
    entryCount: entries.length,
    lastEntry: entries.at(-1) ?? null
  };
}
