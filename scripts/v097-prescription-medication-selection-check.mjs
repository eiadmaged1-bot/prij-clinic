import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const prisma = new PrismaClient();
const runId = createHash("sha1").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 8);
const passes = [];
const warnings = [];
const failures = [];

try {
  await waitForApi();
  const reference = await findMedicationReference();
  if (!reference) {
    warnings.push("no verified/needs_review official medication row exists; prescription reference selection check skipped");
  } else {
    const owner = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: process.env.DEMO_ADMIN_PASSWORD || "eyad" });
    const patient = await apiJson("POST", "/patients", owner.token, {
      medicalRecordNumber: `QA-V097-RX-${runId}`,
      firstName: "QA",
      lastName: "Prescription",
      sex: "female",
      notes: "Local demo prescription reference selection test only."
    });
    const prescription = await apiJson("POST", "/prescriptions", owner.token, {
      patientId: patient.id,
      notes: "Local demo draft only. Doctor remains responsible for final directions.",
      items: [
        {
          medicationName: reference.tradeName,
          drugMarketVariantId: reference.id
        }
      ]
    });
    const item = prescription.items?.[0];
    assert(item?.drugMarketVariantId === reference.id, "prescription item stores medication reference id");
    assert(item.tradeName || item.genericName || item.strengthText || item.dosageForm, "prescription item stores reference display metadata");
    assert(!item.dose && !item.frequency && !item.duration && !item.instructions, "patient dose/frequency/duration/instructions remain blank");
    assert(prescription.status === "draft", "prescription remains a doctor-controlled draft");
    const auditCount = await prisma.auditLog.count({ where: { action: "prescription.created", resourceId: prescription.id } });
    assert(auditCount >= 1, "prescription creation is audited");
    passes.push(`prescription draft references medication row ${reference.id} without dosing automation`);
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}

for (const item of passes) console.log(`V097-RX-READY PASS ${item}`);
for (const item of warnings) console.log(`V097-RX-READY WARN ${item}`);
for (const item of failures) console.log(`V097-RX-READY FAIL ${item}`);
console.log(`V097-RX-READY SUMMARY PASS ${passes.length} WARN ${warnings.length} FAIL ${failures.length}`);
if (failures.length) process.exitCode = 1;

async function findMedicationReference() {
  return prisma.drugMarketVariant.findFirst({
    where: { isDemo: false, verificationStatus: { in: ["verified", "needs_review"] } },
    orderBy: [{ verificationStatus: "asc" }, { tradeName: "asc" }]
  });
}

async function waitForApi() {
  const response = await fetch(`${API_URL}/health`).catch(() => null);
  if (!response?.ok) throw new Error(`API unavailable at ${API_URL}/health`);
}

async function apiJson(method, path, token, body) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${method} ${path} returned ${response.status}: ${text}`);
  return parsed;
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
