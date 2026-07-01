import { existsSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

export const inboxRelativePath = "storage/official-medication-sources/";
export const acceptedFileTypes = ["CSV", "XLSX", "XLS", "JSON", "JSONL", "ZIP"];

const inboxPath = resolve(inboxRelativePath);
const supportedExtensions = new Set([".csv", ".xlsx", ".xls", ".json", ".jsonl", ".zip"]);
const parseableExtensions = new Set([".csv", ".xlsx", ".xls", ".json", ".jsonl"]);

export type ImportStatus = {
  officialRows: number | null;
  verifiedRows: number | null;
  needsReviewRows: number | null;
  supportedCandidates: number;
  parseableCandidates: number;
  unsupportedFiles: number;
  ready: boolean;
  dbStatus: string;
};

export async function loadOfficialMedicationImportStatus(): Promise<ImportStatus> {
  const fileStatus = readInboxStatus();
  const prisma = new PrismaClient();
  try {
    const [officialRows, verifiedRows, needsReviewRows] = await Promise.all([
      prisma.drugMarketVariant.count({ where: { isDemo: false } }),
      prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "verified" } }),
      prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "needs_review" } })
    ]);
    return {
      ...fileStatus,
      officialRows,
      verifiedRows,
      needsReviewRows,
      ready: fileStatus.parseableCandidates > 0,
      dbStatus: "Connected"
    };
  } catch {
    return {
      ...fileStatus,
      officialRows: null,
      verifiedRows: null,
      needsReviewRows: null,
      ready: false,
      dbStatus: "Unavailable"
    };
  } finally {
    await prisma.$disconnect();
  }
}

function readInboxStatus() {
  if (!existsSync(inboxPath)) return { supportedCandidates: 0, parseableCandidates: 0, unsupportedFiles: 0 };
  const files = readdirSync(inboxPath)
    .map((name) => join(inboxPath, name))
    .filter((path) => statSync(path).isFile());
  return {
    supportedCandidates: files.filter((path) => supportedExtensions.has(extname(path).toLowerCase())).length,
    parseableCandidates: files.filter((path) => parseableExtensions.has(extname(path).toLowerCase())).length,
    unsupportedFiles: files.filter((path) => !supportedExtensions.has(extname(path).toLowerCase()) && !path.endsWith("source-manifest.json")).length
  };
}
