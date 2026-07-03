import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");

export const allowedApplyEnvs = new Set(["local", "dev", "development", "test", "ci"]);
export const blockedApplyEnvs = new Set(["prod", "production", "staging", "stage"]);
export const reportDir = "storage/local-db-reports";
export const demoPrefixes = ["QA", "Demo", "Test", "BrowserTest", "IMG", "V093", "V094", "V095", "V096", "V097", "V120", "V121", "Local"];

export const operationalModels = [
  ["patients", "patient"],
  ["appointments", "appointment"],
  ["queueTickets", "queueTicket"],
  ["encounters", "encounter"],
  ["prescriptions", "prescription"],
  ["prescriptionItems", "prescriptionItem"],
  ["investigationOrders", "investigationOrder"],
  ["investigationOrderItems", "investigationOrderItem"],
  ["investigationResults", "investigationResult"],
  ["reports", "report"],
  ["patientDocuments", "patientDocument"],
  ["consentRecords", "consentRecord"],
  ["referrals", "referral"],
  ["patientTasks", "patientTask"],
  ["patientInternalNotes", "patientInternalNote"],
  ["pregnancies", "pregnancy"],
  ["previousPregnancies", "previousPregnancy"],
  ["pregnancyFetuses", "pregnancyFetus"],
  ["antenatalVisits", "antenatalVisit"],
  ["gynecologyVisits", "gynecologyVisit"],
  ["obUltrasounds", "obUltrasound"],
  ["invoices", "invoice"],
  ["invoiceItems", "invoiceItem"],
  ["payments", "payment"],
  ["aiDrafts", "aiDraft"],
  ["aiManagementSnapshots", "aIManagementSnapshot"],
  ["patientClinicalMemories", "patientClinicalMemory"],
  ["patientMedications", "patientMedication"],
  ["patientAllergies", "patientAllergy"],
  ["medicationSafetyChecks", "medicationSafetyCheck"],
  ["medicationSafetyAlerts", "medicationSafetyAlert"],
  ["patientCalculations", "patientCalculation"],
  ["pregnancyDatingAssessments", "pregnancyDatingAssessment"]
];

export const referenceModels = [
  ["users", "user"],
  ["roles", "role"],
  ["permissions", "permission"],
  ["rolePermissions", "rolePermission"],
  ["userRoles", "userRole"],
  ["branches", "branch"],
  ["auditLogs", "auditLog"],
  ["clinicalProtocols", "clinicalProtocol"],
  ["guidelineSources", "guidelineSource"],
  ["guidelineDocuments", "guidelineDocument"],
  ["guidelineChunks", "guidelineChunk"],
  ["calculatorFormulas", "calculatorFormula"],
  ["systemSettings", "systemSetting"],
  ["investigationCatalogItems", "investigationCatalogItem"],
  ["serviceItems", "serviceItem"],
  ["operationCatalogItems", "operationCatalogItem"],
  ["drugFamilies", "drugFamily"],
  ["medicationIngredients", "medicationIngredient"],
  ["medicationProducts", "medicationProduct"],
  ["medicationLabelSections", "medicationLabelSection"],
  ["medicationInteractionRules", "medicationInteractionRule"],
  ["medicationDataSources", "medicationDataSource"],
  ["medicationDataImportJobs", "medicationDataImportJob"],
  ["drugMarketCountries", "drugMarketCountry"],
  ["drugMarketSources", "drugMarketSource"],
  ["drugMarketProducts", "drugMarketProduct"],
  ["drugMarketVariants", "drugMarketVariant"],
  ["drugMarketAvailability", "drugMarketAvailability"],
  ["drugMarketImportJobs", "drugMarketImportJob"],
  ["drugMarketImportRuns", "drugMarketImportRun"],
  ["drugMarketManualReviewQueue", "drugMarketManualReviewQueue"],
  ["officialMedicationSourceSnapshots", "officialMedicationSourceSnapshot"]
];

export function loadEnv() {
  loadRootEnv();
}

export function createPrisma() {
  loadEnv();
  return new PrismaClient();
}

export function parseFlags(argv = process.argv.slice(2)) {
  return {
    apply: argv.includes("--apply"),
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    allOperationalLocal: argv.includes("--all-operational-local"),
    json: argv.includes("--json"),
    skipClean: argv.includes("--skip-clean")
  };
}

export function currentAppEnv() {
  return process.env.APP_ENV || process.env.NODE_ENV || "local";
}

export function assertSafeApply() {
  const appEnv = currentAppEnv().toLowerCase();
  const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!allowedApplyEnvs.has(appEnv)) throw new Error(`Apply mode refused for APP_ENV/NODE_ENV=${appEnv}. Allowed: local/dev/development/test/ci.`);
  if (blockedApplyEnvs.has(appEnv) || blockedApplyEnvs.has(nodeEnv)) throw new Error(`Apply mode refused for blocked environment ${appEnv || nodeEnv}.`);
  if (!databaseUrl) throw new Error("Apply mode requires DATABASE_URL.");
  if (/(prod|production|staging|primary|live|real|patient|phi)/i.test(databaseUrl)) {
    throw new Error("Apply mode refused because DATABASE_URL looks production/staging/PHI-like.");
  }
}

export function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function codeFromName(prefix, name) {
  return `${prefix}_${String(name)
    .trim()
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 56)}`;
}

export async function countModel(prisma, model, where) {
  const delegate = prisma[model];
  if (!delegate?.count) return null;
  return delegate.count(where ? { where } : undefined);
}

export async function collectCounts(prisma, entries) {
  const result = {};
  for (const [key, model] of entries) {
    result[key] = await countModel(prisma, model);
  }
  return result;
}

export function demoPatientWhere() {
  const prefixOr = [];
  for (const prefix of demoPrefixes) {
    prefixOr.push({ medicalRecordNumber: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ firstName: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ lastName: { startsWith: prefix, mode: "insensitive" } });
  }
  return {
    OR: [
      ...prefixOr,
      { email: { contains: "example.", mode: "insensitive" } },
      { email: { contains: "@demo", mode: "insensitive" } },
      { phone: { contains: "000000", mode: "insensitive" } },
      { notes: { contains: "Local demo", mode: "insensitive" } },
      { notes: { contains: "demo patient", mode: "insensitive" } },
      { notes: { contains: "synthetic demo", mode: "insensitive" } },
      { notes: { contains: "test patient", mode: "insensitive" } },
      {
        createdByUser: {
          OR: [
            { loginId: { startsWith: "demo", mode: "insensitive" } },
            { email: { startsWith: "demo.", mode: "insensitive" } }
          ]
        }
      }
    ]
  };
}

export async function findTargetPatients(prisma, allOperationalLocal = false) {
  if (!prisma.patient?.findMany) return [];
  return prisma.patient.findMany({
    where: allOperationalLocal ? {} : demoPatientWhere(),
    select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function idsFor(prisma, model, where) {
  const delegate = prisma[model];
  if (!delegate?.findMany) return [];
  const rows = await delegate.findMany({ where, select: { id: true } });
  return rows.map((row) => row.id);
}

export async function buildOperationalDeletePlan(prisma, patientIds) {
  if (!patientIds.length) return [];
  const invoiceIds = await idsFor(prisma, "invoice", { patientId: { in: patientIds } });
  const prescriptionIds = await idsFor(prisma, "prescription", { patientId: { in: patientIds } });
  const investigationOrderIds = await idsFor(prisma, "investigationOrder", { patientId: { in: patientIds } });
  const resultIds = await idsFor(prisma, "investigationResult", { patientId: { in: patientIds } });
  const reportIds = await idsFor(prisma, "report", { patientId: { in: patientIds } });
  const documentIds = await idsFor(prisma, "patientDocument", { patientId: { in: patientIds } });
  const consentIds = await idsFor(prisma, "consentRecord", { patientId: { in: patientIds } });
  const pregnancyIds = await idsFor(prisma, "pregnancy", { patientId: { in: patientIds } });
  const fetusIds = await idsFor(prisma, "pregnancyFetus", { pregnancyId: { in: pregnancyIds } });
  const snapshotIds = await idsFor(prisma, "aIManagementSnapshot", { patientId: { in: patientIds } });
  const safetyCheckIds = await idsFor(prisma, "medicationSafetyCheck", {
    OR: [{ patientId: { in: patientIds } }, { prescriptionId: { in: prescriptionIds } }]
  });

  const plan = [
    item("medication safety alerts", "medicationSafetyAlert", { safetyCheckId: { in: safetyCheckIds } }),
    item("medication safety checks", "medicationSafetyCheck", { OR: [{ patientId: { in: patientIds } }, { prescriptionId: { in: prescriptionIds } }] }),
    item("patient medications", "patientMedication", { patientId: { in: patientIds } }),
    item("patient allergies", "patientAllergy", { patientId: { in: patientIds } }),
    item("prescription items", "prescriptionItem", { prescriptionId: { in: prescriptionIds } }),
    item("patient tasks", "patientTask", { OR: [{ patientId: { in: patientIds } }, { relatedOrderId: { in: investigationOrderIds } }, { relatedResultId: { in: resultIds } }, { relatedDocumentId: { in: documentIds } }, { relatedConsentId: { in: consentIds } }] }),
    item("patient documents", "patientDocument", { patientId: { in: patientIds } }),
    item("consent records", "consentRecord", { patientId: { in: patientIds } }),
    item("investigation order items", "investigationOrderItem", { orderId: { in: investigationOrderIds } }),
    item("investigation results", "investigationResult", { patientId: { in: patientIds } }),
    item("reports", "report", { OR: [{ patientId: { in: patientIds } }, { id: { in: reportIds } }] }),
    item("investigation orders", "investigationOrder", { patientId: { in: patientIds } }),
    item("prescriptions", "prescription", { patientId: { in: patientIds } }),
    item("referrals", "referral", { OR: [{ patientId: { in: patientIds } }, { pregnancyId: { in: pregnancyIds } }] }),
    item("patient internal notes", "patientInternalNote", { patientId: { in: patientIds } }),
    item("AI drafts", "aiDraft", { patientId: { in: patientIds } }),
    item("patient clinical memories", "patientClinicalMemory", { OR: [{ patientId: { in: patientIds } }, { sourceSnapshotId: { in: snapshotIds } }] }),
    item("AI management snapshots", "aIManagementSnapshot", { patientId: { in: patientIds } }),
    item("patient calculations", "patientCalculation", { OR: [{ patientId: { in: patientIds } }, { pregnancyEpisodeId: { in: pregnancyIds } }, { fetusId: { in: fetusIds } }] }),
    item("pregnancy dating assessments", "pregnancyDatingAssessment", { OR: [{ patientId: { in: patientIds } }, { pregnancyEpisodeId: { in: pregnancyIds } }] }),
    item("ob ultrasounds", "obUltrasound", { patientId: { in: patientIds } }),
    item("antenatal visits", "antenatalVisit", { patientId: { in: patientIds } }),
    item("pregnancy fetuses", "pregnancyFetus", { pregnancyId: { in: pregnancyIds } }),
    item("previous pregnancies", "previousPregnancy", { patientId: { in: patientIds } }),
    item("gynecology visits", "gynecologyVisit", { patientId: { in: patientIds } }),
    item("pregnancies", "pregnancy", { patientId: { in: patientIds } }),
    item("invoice items", "invoiceItem", { invoiceId: { in: invoiceIds } }),
    item("payments", "payment", { OR: [{ patientId: { in: patientIds } }, { invoiceId: { in: invoiceIds } }] }),
    item("invoices", "invoice", { patientId: { in: patientIds } }),
    item("encounters", "encounter", { patientId: { in: patientIds } }),
    item("queue tickets", "queueTicket", { patientId: { in: patientIds } }),
    item("appointments", "appointment", { patientId: { in: patientIds } }),
    item("patients", "patient", { id: { in: patientIds } })
  ];

  const withCounts = [];
  for (const entry of plan) {
    withCounts.push({ ...entry, count: (await countModel(prisma, entry.model, entry.where)) ?? 0 });
  }
  return withCounts;
}

export async function applyDeletePlan(prisma, plan) {
  await prisma.$transaction(async (tx) => {
    for (const entry of plan) {
      if (!entry.count) continue;
      const delegate = tx[entry.model];
      if (!delegate?.deleteMany) throw new Error(`Prisma model ${entry.model} is not available for cleanup.`);
      await delegate.deleteMany({ where: entry.where });
    }
  });
}

export async function medicationReadiness(prisma) {
  const officialRows = (await countModel(prisma, "drugMarketVariant", { isDemo: false })) ?? 0;
  const verifiedRows = (await countModel(prisma, "drugMarketVariant", { isDemo: false, verificationStatus: "verified" })) ?? 0;
  const needsReviewRows = (await countModel(prisma, "drugMarketVariant", { isDemo: false, verificationStatus: "needs_review" })) ?? 0;
  const medicationProductRows = (await countModel(prisma, "medicationProduct")) ?? 0;
  const sourcesPresent = (await countModel(prisma, "drugMarketSource")) ?? 0;
  const importRuns = (await countModel(prisma, "drugMarketImportRun")) ?? 0;
  const openReviewQueue = (await countModel(prisma, "drugMarketManualReviewQueue", { status: "open" })) ?? 0;
  return {
    medicationProductRows,
    officialRows,
    verifiedRows,
    needsReviewRows,
    sourcesPresent,
    importRuns,
    openReviewQueue,
    status: officialRows > 0 ? "ready_for_review_gated_selection" : "official_source_missing"
  };
}

export async function writeReports(baseName, data, markdown) {
  await mkdir(reportDir, { recursive: true });
  const jsonPath = `${reportDir}/${baseName}.json`;
  const mdPath = `${reportDir}/${baseName}.md`;
  await writeFile(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await writeFile(mdPath, markdown, "utf8");
  return { jsonPath, mdPath };
}

function item(label, model, where) {
  return { label, model, where };
}
