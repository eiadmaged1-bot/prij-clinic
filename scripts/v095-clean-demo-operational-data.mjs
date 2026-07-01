import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const confirmIndex = args.indexOf("--confirm");
const confirmation = confirmIndex >= 0 ? args[confirmIndex + 1] : "";
const allowedEnvs = new Set(["local", "dev", "test", "ci"]);
const demoPrefixes = ["QA", "Demo", "Test", "BrowserTest", "V093", "V094", "Local"];

try {
  const appEnv = process.env.APP_ENV || (process.env.NODE_ENV === "test" ? "test" : "local");
  if (apply) validateApplySafety(appEnv);

  const demoPatients = await findDemoPatients();
  const patientIds = demoPatients.map((patient) => patient.id);

  console.log(`V095 CLEAN DEMO OPERATIONAL DATA ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`APP_ENV=${appEnv}`);
  console.log(`demo patients targeted: ${patientIds.length}`);
  for (const patient of demoPatients.slice(0, 20)) {
    console.log(`target patient ${patient.medicalRecordNumber}: ${patient.firstName} ${patient.lastName}`);
  }
  if (demoPatients.length > 20) console.log(`target patient list truncated: ${demoPatients.length - 20} more`);

  const plan = await buildDeletePlan(patientIds);
  for (const item of plan) {
    console.log(`${apply ? "delete" : "would delete"} ${item.label}: ${item.count}`);
  }
  console.log("preserved reference data: users/roles/permissions, eyad, audit logs, medication reference data, drug-market official data, investigation catalog, service catalog");

  if (!apply) {
    console.log("DRY-RUN only. Add --apply --confirm CLEAN_DEMO_OPERATIONAL_DATA in a safe local/dev/test/ci environment to delete targeted demo operational rows.");
  } else {
    await prisma.$transaction(async (tx) => {
      for (const item of plan) {
        if (item.count === 0) continue;
        const delegate = tx[item.model];
        if (!delegate?.deleteMany) continue;
        await delegate.deleteMany({ where: item.where });
      }
    });

    console.log("V095 CLEAN DEMO OPERATIONAL DATA PASS apply completed");
  }
} finally {
  await prisma.$disconnect();
}

function validateApplySafety(appEnv) {
  if (confirmation !== "CLEAN_DEMO_OPERATIONAL_DATA") {
    throw new Error("Apply mode requires --confirm CLEAN_DEMO_OPERATIONAL_DATA.");
  }
  if (!allowedEnvs.has(appEnv)) {
    throw new Error(`Apply mode refused for APP_ENV=${appEnv}. Allowed: local, dev, test, ci.`);
  }
  if (appEnv === "production" || process.env.NODE_ENV === "production" || process.env.PRODUCTION === "true") {
    throw new Error("Apply mode refused for production environment.");
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  if (/(prod|production|primary|live|real|patient|phi)/i.test(databaseUrl)) {
    throw new Error("Apply mode refused because DATABASE_URL looks production-like.");
  }
}

async function findDemoPatients() {
  if (!prisma.patient?.findMany) return [];
  const prefixOr = [];
  for (const prefix of demoPrefixes) {
    prefixOr.push({ medicalRecordNumber: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ firstName: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ lastName: { startsWith: prefix, mode: "insensitive" } });
  }

  return prisma.patient.findMany({
    where: {
      OR: [
        ...prefixOr,
        { notes: { contains: "Local demo", mode: "insensitive" } },
        { notes: { contains: "demo patient", mode: "insensitive" } },
        {
          createdByUser: {
            OR: [
              { loginId: { startsWith: "demo", mode: "insensitive" } },
              { email: { startsWith: "demo.", mode: "insensitive" } }
            ]
          }
        }
      ]
    },
    select: {
      id: true,
      medicalRecordNumber: true,
      firstName: true,
      lastName: true
    },
    orderBy: { createdAt: "asc" }
  });
}

async function buildDeletePlan(patientIds) {
  if (patientIds.length === 0) return [];

  const invoiceIds = await idsFor("invoice", { patientId: { in: patientIds } });
  const prescriptionIds = await idsFor("prescription", { patientId: { in: patientIds } });
  const investigationOrderIds = await idsFor("investigationOrder", { patientId: { in: patientIds } });
  const pregnancyIds = await idsFor("pregnancy", { patientId: { in: patientIds } });
  const fetusIds = await idsFor("pregnancyFetus", { pregnancyId: { in: pregnancyIds } });
  const aiManagementSnapshotIds = await idsFor("aIManagementSnapshot", { patientId: { in: patientIds } });
  const medicationSafetyCheckIds = await idsFor("medicationSafetyCheck", { patientId: { in: patientIds } });

  const plan = [
    item("medication safety alerts", "medicationSafetyAlert", { safetyCheckId: { in: medicationSafetyCheckIds } }),
    item("medication safety checks", "medicationSafetyCheck", { patientId: { in: patientIds } }),
    item("patient medications", "patientMedication", { patientId: { in: patientIds } }),
    item("patient allergies", "patientAllergy", { patientId: { in: patientIds } }),
    item("prescription items", "prescriptionItem", { prescriptionId: { in: prescriptionIds } }),
    item("prescriptions", "prescription", { patientId: { in: patientIds } }),
    item("investigation order items", "investigationOrderItem", { orderId: { in: investigationOrderIds } }),
    item("investigation results", "investigationResult", { patientId: { in: patientIds } }),
    item("reports", "report", { patientId: { in: patientIds } }),
    item("investigation orders", "investigationOrder", { patientId: { in: patientIds } }),
    item("consent records", "consentRecord", { patientId: { in: patientIds } }),
    item("patient documents", "patientDocument", { patientId: { in: patientIds } }),
    item("referrals", "referral", { patientId: { in: patientIds } }),
    item("patient tasks", "patientTask", { patientId: { in: patientIds } }),
    item("patient internal notes", "patientInternalNote", { patientId: { in: patientIds } }),
    item("AI drafts", "aiDraft", { patientId: { in: patientIds } }),
    item("patient clinical memories", "patientClinicalMemory", { patientId: { in: patientIds } }),
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
    const delegate = prisma[entry.model];
    if (!delegate?.count) {
      withCounts.push({ ...entry, count: 0, missing: true });
      console.log(`WARN ${entry.label}: model not present, skipped`);
      continue;
    }
    withCounts.push({ ...entry, count: await delegate.count({ where: entry.where }) });
  }
  return withCounts;
}

async function idsFor(model, where) {
  const delegate = prisma[model];
  if (!delegate?.findMany) return [];
  const rows = await delegate.findMany({ where, select: { id: true } });
  return rows.map((row) => row.id);
}

function item(label, model, where) {
  return { label, model, where };
}
