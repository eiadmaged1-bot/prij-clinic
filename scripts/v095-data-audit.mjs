import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();

const operationalModels = [
  ["patients", "patient"],
  ["appointments", "appointment"],
  ["queue tickets", "queueTicket"],
  ["encounters", "encounter"],
  ["prescriptions", "prescription"],
  ["prescription items", "prescriptionItem"],
  ["investigation orders", "investigationOrder"],
  ["investigation order items", "investigationOrderItem"],
  ["investigation results", "investigationResult"],
  ["reports", "report"],
  ["pregnancies", "pregnancy"],
  ["previous pregnancies", "previousPregnancy"],
  ["pregnancy fetuses", "pregnancyFetus"],
  ["antenatal visits", "antenatalVisit"],
  ["ob ultrasounds", "obUltrasound"],
  ["invoices", "invoice"],
  ["invoice items", "invoiceItem"],
  ["payments", "payment"],
  ["patient documents", "patientDocument"],
  ["patient internal notes", "patientInternalNote"],
  ["patient tasks", "patientTask"],
  ["referrals", "referral"],
  ["AI drafts", "aiDraft"],
  ["AI management snapshots", "aIManagementSnapshot"],
  ["patient clinical memories", "patientClinicalMemory"],
  ["consent instances", "consentRecord"],
  ["patient medications", "patientMedication"],
  ["patient allergies", "patientAllergy"],
  ["patient calculations", "patientCalculation"],
  ["pregnancy dating assessments", "pregnancyDatingAssessment"]
];

const referenceModels = [
  ["users", "user"],
  ["roles", "role"],
  ["permissions", "permission"],
  ["branches", "branch"],
  ["clinic departments", "clinicDepartment"],
  ["external providers", "externalProvider"],
  ["service catalog", "serviceItem"],
  ["consent templates", "consentTemplate"],
  ["investigation catalog", "investigationCatalogItem"],
  ["medication families", "drugFamily"],
  ["medication ingredients", "medicationIngredient"],
  ["medication products", "medicationProduct"],
  ["medication data sources", "medicationDataSource"],
  ["medication import jobs", "medicationDataImportJob"],
  ["drug-market countries", "drugMarketCountry"],
  ["drug-market sources", "drugMarketSource"],
  ["drug-market products", "drugMarketProduct"],
  ["drug-market variants", "drugMarketVariant"],
  ["drug-market availability", "drugMarketAvailability"],
  ["drug-market import jobs", "drugMarketImportJob"],
  ["drug-market import runs", "drugMarketImportRun"],
  ["drug-market source snapshots", "officialMedicationSourceSnapshot"],
  ["drug-market source connectors", "drugMarketSourceConnector"],
  ["clinical protocols", "clinicalProtocol"],
  ["calculator formulas", "calculatorFormula"],
  ["guideline sources", "guidelineSource"],
  ["guideline documents", "guidelineDocument"]
];

try {
  console.log("V095 DATA AUDIT");
  console.log(`APP_ENV=${process.env.APP_ENV || "not set"}`);
  console.log("");
  console.log("Operational/demo data counts");
  await printCounts(operationalModels);

  console.log("");
  console.log("Reference/setup data counts");
  await printCounts(referenceModels);

  console.log("");
  await verifyEyad();
  await verifyMedicationReference();
  await verifyInvestigationCatalog();
  await printOfficialMedicationBreakdown();
} finally {
  await prisma.$disconnect();
}

async function printCounts(entries) {
  for (const [label, model] of entries) {
    const delegate = prisma[model];
    if (!delegate?.count) {
      console.log(`WARN ${label}: model not present in this Prisma client`);
      continue;
    }
    console.log(`${label}: ${await delegate.count()}`);
  }
}

async function verifyEyad() {
  const eyad = await prisma.user?.findFirst({
    where: { OR: [{ loginId: "eyad" }, { email: "eyad.admin@prij.local" }] },
    include: {
      userRoles: { include: { role: true } },
      permissionOverrides: { include: { permission: true } }
    }
  });

  if (!eyad) {
    console.log("FAIL eyad: not present in this DB");
    return;
  }

  const roles = eyad.userRoles.map((item) => item.role.name).sort();
  const reserved = eyad.permissionOverrides
    .filter((item) => item.effect === "allow" && ["system_owner.manage", "developer_owner.manage"].includes(item.permission.key))
    .map((item) => item.permission.key)
    .sort();

  console.log(`PASS eyad exists: loginId=${eyad.loginId} protected=${eyad.protectedAccount} status=${eyad.status}`);
  console.log(`PASS eyad roles: ${roles.join(", ") || "none"}`);
  console.log(`PASS eyad reserved permissions: ${reserved.join(", ") || "none"}`);
}

async function verifyMedicationReference() {
  const models = ["drugFamily", "medicationIngredient", "medicationProduct", "drugMarketVariant"];
  const counts = [];
  for (const model of models) {
    if (!prisma[model]?.count) {
      counts.push(`${model}=model missing`);
    } else {
      counts.push(`${model}=${await prisma[model].count()}`);
    }
  }
  console.log(`Medication reference verification: ${counts.join(" ")}`);
}

async function verifyInvestigationCatalog() {
  if (!prisma.investigationCatalogItem?.count) {
    console.log("WARN investigation catalog: model missing");
    return;
  }
  const count = await prisma.investigationCatalogItem.count();
  console.log(count > 0 ? `PASS investigation catalog rows: ${count}` : "WARN investigation catalog: not present in this DB");
}

async function printOfficialMedicationBreakdown() {
  if (!prisma.drugMarketVariant?.count) {
    console.log("WARN official medication rows: drugMarketVariant model missing");
    return;
  }

  const realRows = await prisma.drugMarketVariant.count({ where: { isDemo: false } });
  if (realRows === 0) {
    console.log("Official medication rows: not present in this DB");
    return;
  }

  console.log(`Official medication rows: ${realRows}`);
  const byCountryStatus = await prisma.drugMarketVariant.groupBy({
    by: ["countryCode", "verificationStatus"],
    where: { isDemo: false },
    _count: { _all: true },
    orderBy: [{ countryCode: "asc" }, { verificationStatus: "asc" }]
  });
  for (const row of byCountryStatus) {
    console.log(`official medication ${row.countryCode} ${row.verificationStatus}: ${row._count._all}`);
  }

  const bySource = await prisma.drugMarketVariant.groupBy({
    by: ["sourceId"],
    where: { isDemo: false },
    _count: { _all: true }
  });
  const sources = await prisma.drugMarketSource.findMany({
    where: { id: { in: bySource.map((row) => row.sourceId).filter(Boolean) } },
    select: { id: true, code: true }
  });
  const sourceById = new Map(sources.map((source) => [source.id, source.code]));
  for (const row of bySource) {
    console.log(`official medication source ${sourceById.get(row.sourceId) || "unknown"}: ${row._count._all}`);
  }
}
