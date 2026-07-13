import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { Prisma, PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");

export const launchReportDir = "storage/production-launch-reports";
export const backupRootDefault = path.resolve(process.cwd(), "..", "prij-production-launch-backups");

export const verifiedReferenceModels = new Set([
  "Role",
  "Permission",
  "RolePermission",
  "GuidelineSource",
  "GuidelineDocument",
  "GuidelineVersion",
  "GuidelineSection",
  "GuidelineChunk",
  "ClinicalProtocol",
  "CalculatorFormula",
  "InvestigationCatalogItem",
  "OperationCatalogItem",
  "ServiceItem",
  "MedicationGeneric",
  "MedicationSearchTag",
  "MedicationGenericTag",
  "MedicationClass",
  "MedicationIngredient",
  "MedicationFamilyMembership",
  "MedicationProduct",
  "MedicationLabelSection",
  "MedicationInteractionRule",
  "MedicationSafetyProfile",
  "MedicationDataSource",
  "MedicationDataImportJob",
  "DrugMarketCountry",
  "DrugMarketSource",
  "DrugMarketProduct",
  "DrugMarketVariant",
  "DrugMarketAvailability",
  "DrugMarketSourceConnector",
  "DrugMarketImportJob",
  "DrugMarketImportRun",
  "DrugMarketManualReviewQueue",
  "OfficialMedicationSourceSnapshot",
  "ClinicalTagDefinition",
  "ConsentTemplate"
]);

export const clinicConfigurationModels = new Set([
  "Branch",
  "ClinicDepartment",
  "SystemSetting",
  "VisitPriceAuditSetting",
  "ExternalProvider"
]);

export const userAccessModels = new Set([
  "User",
  "UserRole",
  "UserPermissionOverride",
  "AuditLog"
]);

export const operationalPatientModels = new Set([
  "Patient",
  "Appointment",
  "QueueTicket",
  "Encounter",
  "Prescription",
  "PrescriptionItem",
  "InvestigationOrder",
  "InvestigationOrderItem",
  "InvestigationResult",
  "Report",
  "PatientDocument",
  "PatientIntake",
  "ExternalPatientSubmission",
  "ConsentRecord",
  "Referral",
  "PatientTask",
  "PatientInternalNote",
  "Pregnancy",
  "PreviousPregnancy",
  "PregnancyFetus",
  "AntenatalVisit",
  "GynecologyVisit",
  "ObUltrasound",
  "InfertilityEpisode",
  "OvulationInductionCycle",
  "FollicularMonitoringVisit",
  "EstradiolResult",
  "Invoice",
  "InvoiceItem",
  "Payment",
  "AiDraft",
  "AIManagementSnapshot",
  "PatientClinicalMemory",
  "PatientHistorySheet",
  "PatientOperationHistoryItem",
  "PatientMedicationHistoryItem",
  "PatientInvestigationHistoryItem",
  "PatientMedication",
  "PatientAllergy",
  "PatientClinicalTag",
  "MedicationSafetyCheck",
  "MedicationSafetyAlert",
  "PatientCalculation",
  "PregnancyDatingAssessment",
  "CareAssistFinding",
  "CareAssistDecision",
  "StaffConversation",
  "StaffConversationParticipant",
  "StaffMessage",
  "StaffMessageReceipt"
]);

export const demoOrPlaceholderModels = new Set([
  "PrescriptionTemplate",
  "DoctorMedicationShortcut"
]);

export const deleteOrder = [
  "StaffMessageReceipt",
  "StaffMessage",
  "StaffConversationParticipant",
  "StaffConversation",
  "CareAssistDecision",
  "CareAssistFinding",
  "MedicationSafetyAlert",
  "MedicationSafetyCheck",
  "PatientMedication",
  "PatientAllergy",
  "PatientClinicalTag",
  "PrescriptionItem",
  "PatientTask",
  "PatientDocument",
  "ConsentRecord",
  "PatientOperationHistoryItem",
  "PatientMedicationHistoryItem",
  "PatientInvestigationHistoryItem",
  "PatientHistorySheet",
  "InvestigationOrderItem",
  "InvestigationResult",
  "Report",
  "InvestigationOrder",
  "Prescription",
  "Referral",
  "PatientInternalNote",
  "AiDraft",
  "PatientClinicalMemory",
  "AIManagementSnapshot",
  "PatientCalculation",
  "PregnancyDatingAssessment",
  "FollicularMonitoringVisit",
  "EstradiolResult",
  "OvulationInductionCycle",
  "InfertilityEpisode",
  "ObUltrasound",
  "AntenatalVisit",
  "PregnancyFetus",
  "PreviousPregnancy",
  "GynecologyVisit",
  "Pregnancy",
  "InvoiceItem",
  "Payment",
  "Invoice",
  "Encounter",
  "QueueTicket",
  "Appointment",
  "ExternalPatientSubmission",
  "PatientIntake",
  "Patient",
  "DoctorMedicationShortcut",
  "PrescriptionTemplate"
];

export function createPrisma() {
  loadRootEnv();
  return new PrismaClient();
}

export function modelNameToDelegate(modelName) {
  return modelName.slice(0, 1).toLowerCase() + modelName.slice(1);
}

export function prismaModels() {
  return Prisma.dmmf.datamodel.models.map((model) => ({
    name: model.name,
    delegate: modelNameToDelegate(model.name),
    fields: model.fields
  }));
}

export function classifyModel(modelName) {
  if (operationalPatientModels.has(modelName)) return "operational patient data";
  if (verifiedReferenceModels.has(modelName)) return "verified reference data";
  if (clinicConfigurationModels.has(modelName)) return "clinic configuration";
  if (userAccessModels.has(modelName)) return "user/access configuration";
  if (demoOrPlaceholderModels.has(modelName)) return "demo/test/placeholder";
  return "uncertain and requiring manual review";
}

export function categoryReason(category) {
  return {
    "operational patient data": "Patient-linked clinical, queue, finance, intake, document, or workflow records are reset before real clinic launch.",
    "verified reference data": "Reference catalogs and reviewed clinical/library data must be preserved unless manually reclassified.",
    "clinic configuration": "Clinic branches, settings, departments, and production configuration must be preserved.",
    "user/access configuration": "Approved users, roles, permissions, and audit history are preserved; demo users require explicit classification.",
    "demo/test/placeholder": "Known template/shortcut fixture surfaces are removed only when they are not verified production configuration.",
    "uncertain and requiring manual review": "No destructive action is allowed until this model is manually classified."
  }[category];
}

export async function countModel(prisma, delegate) {
  if (!prisma[delegate]?.count) return null;
  return prisma[delegate].count();
}

export async function collectInventory(prisma) {
  const models = [];
  for (const model of prismaModels()) {
    const count = await countModel(prisma, model.delegate);
    const category = classifyModel(model.name);
    models.push({
      model: model.name,
      delegate: model.delegate,
      count,
      category,
      reason: categoryReason(category)
    });
  }
  return models;
}

export async function databaseFingerprint(prisma, inventory) {
  const payload = {
    generatedAt: new Date().toISOString(),
    databaseProvider: "postgresql",
    schemaModelCount: inventory.length,
    counts: inventory.map(({ model, count, category }) => ({ model, count, category })).sort((a, b) => a.model.localeCompare(b.model))
  };
  const hash = sha256(stableJson(payload));
  return { hash, payload };
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function writeLaunchReport(baseName, json, markdown) {
  await fs.mkdir(launchReportDir, { recursive: true });
  const stamp = timestamp();
  const jsonPath = `${launchReportDir}/${baseName}-${stamp}.json`;
  const mdPath = `${launchReportDir}/${baseName}-${stamp}.md`;
  await fs.writeFile(jsonPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, markdown, "utf8");
  return { jsonPath, mdPath };
}

export function renderInventoryMarkdown(report) {
  return [
    "# Production Launch Inventory",
    "",
    `Generated: ${report.generatedAt}`,
    `Database fingerprint: ${report.databaseFingerprint.hash}`,
    "",
    "| Model | Count | Category | Reason |",
    "| --- | ---: | --- | --- |",
    ...report.models.map((item) => `| ${item.model} | ${item.count ?? "missing"} | ${item.category} | ${item.reason} |`)
  ].join("\n");
}

export function renderPlanMarkdown(plan) {
  return [
    "# Production Launch Reset Plan",
    "",
    `Generated: ${plan.generatedAt}`,
    `Database fingerprint: ${plan.databaseFingerprint.hash}`,
    `Plan hash: ${plan.planHash}`,
    `Confirm value: ${plan.confirmValue}`,
    "",
    "## Delete Plan",
    "",
    "| Order | Model | Category | Count | Reason |",
    "| ---: | --- | --- | ---: | --- |",
    ...plan.deletePlan.map((item, index) => `| ${index + 1} | ${item.model} | ${item.category} | ${item.count} | ${item.reason} |`),
    "",
    "## Preserved Models",
    "",
    "| Model | Category | Count | Reason |",
    "| --- | --- | ---: | --- |",
    ...plan.preserved.map((item) => `| ${item.model} | ${item.category} | ${item.count} | ${item.reason} |`),
    "",
    "## Manual Review",
    "",
    plan.uncertain.length
      ? plan.uncertain.map((item) => `- ${item.model}: ${item.count} rows`).join("\n")
      : "No uncertain models with rows were found.",
    "",
    "## Apply Command",
    "",
    "Do not run until backups have completed and the operator has reviewed the plan.",
    "",
    "```powershell",
    `npm run db:production-launch:apply -- --plan "${plan.planPath || "<plan-json-path>"}" --backup-manifest "<backup-manifest-json>" --confirm ${plan.confirmValue} --apply`,
    "```"
  ].join("\n");
}

export function parseArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) return fallback;
  return process.argv[index + 1];
}

export function hasFlag(name) {
  return process.argv.includes(name);
}
