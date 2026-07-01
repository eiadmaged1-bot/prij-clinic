import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { findRestoreReadyCandidates, findUsableCandidates, INBOX_DIR, scanInbox } from "./v099-official-medication-inbox-utils.mjs";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const files = scanInbox();
const usable = findUsableCandidates(files);
const restoreReady = findRestoreReadyCandidates(files);
const report = {
  inboxExists: existsSync(INBOX_DIR),
  inbox: INBOX_DIR,
  candidateCount: usable.length,
  restoreReadyCandidateCount: restoreReady.length,
  officialMedicationRowCount: null,
  verifiedMedicationRowCount: null,
  needsReviewMedicationRowCount: null,
  prescriptionSelectionPossible: false,
  nextAction: "Place owner-provided official files or prior approved export in storage/official-medication-inbox/ and run npm run medication:v099:inbox-scan."
};

try {
  report.officialMedicationRowCount = await prisma.drugMarketVariant.count({ where: { isDemo: false } });
  report.verifiedMedicationRowCount = await prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "verified" } });
  report.needsReviewMedicationRowCount = await prisma.drugMarketVariant.count({ where: { isDemo: false, verificationStatus: "needs_review" } });
  report.prescriptionSelectionPossible = report.officialMedicationRowCount > 0 && (report.verifiedMedicationRowCount > 0 || report.needsReviewMedicationRowCount > 0);
  report.nextAction = nextAction(report);
} catch (error) {
  report.databaseWarning = error instanceof Error ? error.message : String(error);
  report.nextAction = "Configure local/dev/test DATABASE_URL, then rerun npm run medication:v099:intake-ready.";
} finally {
  await prisma.$disconnect();
}

console.log("V099 MEDICATION INTAKE READINESS");
console.log(JSON.stringify(report, null, 2));

if (!report.prescriptionSelectionPossible) {
  console.warn("V099-INTAKE-READY WARN prescription medication selection remains blocked until official rows exist");
}

function nextAction(status) {
  if (status.officialMedicationRowCount > 0) return "Run npm run medication:v097:ready-check:strict, then prescription selection QA with the local API running.";
  if (status.restoreReadyCandidateCount === 1) return "Run npm run medication:v099:restore-inbox:dry-run, review output, then apply only in local/dev/test/ci with explicit confirmation.";
  if (status.restoreReadyCandidateCount > 1) return "Choose one RESTORE_READY file with node scripts/v099-restore-from-inbox.mjs --file \"PATH\" before restore.";
  if (status.candidateCount > 0) return "Add a focused mapper/import sprint for the owner-provided official file; do not import or verify rows automatically.";
  return "Owner must provide an official file/export or isolated DB backup before medication restore can proceed.";
}
