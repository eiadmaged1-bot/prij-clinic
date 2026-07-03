import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createPrisma, normalizeName } from "./v121-reference-utils.mjs";

await run("clinical reference seed", "scripts/v122-seed-clinical-reference-catalogs.mjs");

const prisma = createPrisma();
const testPrefix = `V122-${Date.now()}`;
let patientId = null;
let userId = null;
let branchId = null;

try {
  const schema = await readFile("apps/api/prisma/schema.prisma", "utf8");
  const medicationGenericModel = modelBlock(schema, "MedicationGeneric");
  const investigationCatalogModel = modelBlock(schema, "InvestigationCatalogItem");
  const operationCatalogModel = modelBlock(schema, "OperationCatalogItem");
  assert(!/\b(tradeName|brandName)\b/.test(medicationGenericModel), "MedicationGeneric must not include trade or brand fields.");
  assert(!/\b(price|stock|availability|supplier|cart|checkout)\b/i.test(medicationGenericModel), "MedicationGeneric must not include pharmacy commerce fields.");
  assert(!/\bprice\b/i.test(investigationCatalogModel), "Investigation catalog must not include price.");
  assert(!/\bprice\b/i.test(operationCatalogModel), "Operation catalog must not include price.");

  const counts = {
    medicationGenerics: await prisma.medicationGeneric.count(),
    medicationTags: await prisma.medicationSearchTag.count(),
    medicationClasses: await prisma.medicationClass.count(),
    controlledGenerics: await prisma.medicationGeneric.count({ where: { isControlled: true } }),
    investigations: await prisma.investigationCatalogItem.count({ where: { active: true } }),
    operations: await prisma.operationCatalogItem.count({ where: { isActive: true } })
  };
  assert(counts.medicationGenerics >= 20, "Expected generic medication foundation rows.");
  assert(counts.medicationTags >= 20, "Expected medication tag rows.");
  assert(counts.medicationClasses >= 20, "Expected medication class rows.");
  assert(counts.controlledGenerics === 0, "Controlled generic medication rows should not be seeded by default.");
  assert(counts.investigations >= 88, "Expected v0.12.1 investigation baseline plus expansion.");
  assert(counts.operations >= 53, "Expected v0.12.1 operation baseline plus expansion.");

  await assertMedicationSearch("pain killer", ["Analgesic"]);
  await assertMedicationSearch("NSAID", ["NSAID"]);
  await assertMedicationSearch("gram positive antibiotics", ["Gram positive antibiotics", "Antibiotic"]);
  await assertMedicationSearch("antibiotics", ["Antibiotic"]);
  await assertMedicationSearch("antiemetic", ["Antiemetic"]);
  await assertMedicationSearch("anticoagulant", ["Anticoagulant"]);

  const medicationPayload = await medicationSearchPayload("NSAID");
  const forbiddenKeys = ["dose", "frequency", "duration", "price", "stock", "availability", "recommended", "bestDrug"];
  const payloadText = JSON.stringify(medicationPayload).toLowerCase();
  for (const key of forbiddenKeys) {
    assert(!payloadText.includes(key.toLowerCase()), `Medication search payload must not include ${key}.`);
  }

  const investigationCategories = new Set((await prisma.investigationCatalogItem.findMany({ where: { active: true }, select: { category: true } })).map((row) => row.category));
  for (const expected of ["Laboratory", "Radiology", "Ultrasound", "Pathology"]) {
    assert([...investigationCategories].some((category) => category.includes(expected)), `Missing investigation category ${expected}.`);
  }
  assert(await prisma.operationCatalogItem.count({ where: { isActive: true, isObGyn: true } }) > 0, "Expected OB/GYN operation rows.");
  assert(await prisma.operationCatalogItem.count({ where: { isActive: true, category: "General surgical history" } }) > 0, "Expected general surgical history operation rows.");

  const branch = await prisma.branch.upsert({
    where: { code: "V122_TEST_BRANCH" },
    update: { name: "V122 local test branch", status: "active" },
    create: { code: "V122_TEST_BRANCH", name: "V122 local test branch", status: "active" }
  });
  branchId = branch.id;
  const user = await prisma.user.create({
    data: { email: `${testPrefix.toLowerCase()}@example.invalid`, displayName: "V122 Local Test User", status: "active", branchId }
  });
  userId = user.id;
  const patient = await prisma.patient.create({
    data: { branchId, medicalRecordNumber: testPrefix, firstName: "V122", lastName: "Cleanup", sex: "female", createdByUserId: userId }
  });
  patientId = patient.id;

  const sheet = await prisma.patientHistorySheet.create({
    data: {
      patientId,
      title: "OB/GYN history sheet",
      chiefComplaint: null,
      obstetricHistory: { gravida: "", para: "" },
      createdByUserId: userId
    }
  });
  assert(sheet.id, "Patient history sheet should be created without clinical fake data.");

  const generic = await prisma.medicationGeneric.findFirstOrThrow({ where: { normalizedName: normalizeName("Paracetamol"), isControlled: false } });
  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      doctorId: userId,
      items: { create: [{ medicationName: generic.genericName, medicationGenericId: generic.id, genericName: generic.genericName }] }
    },
    include: { items: true }
  });
  assert(prescription.items[0]?.genericName === "Paracetamol", "Prescription print/source data should expose generic medication name.");

  const investigation = await prisma.investigationCatalogItem.findFirstOrThrow({ where: { active: true } });
  const order = await prisma.investigationOrder.create({
    data: {
      patientId,
      doctorId: userId,
      items: { create: [{ category: "laboratory", testName: investigation.name, itemCode: investigation.code, itemName: investigation.name }] }
    },
    include: { items: true }
  });
  assert(order.items[0]?.testName === investigation.name, "Requested investigations should retain printable item names.");

  await cleanup();
  assert((await prisma.patient.count({ where: { medicalRecordNumber: testPrefix } })) === 0, "No fake/test patients should remain after cleanup.");

  console.log(`V122-CLINICAL-REFERENCE-TEST PASS ${JSON.stringify(counts)}`);
} finally {
  await cleanup().catch(() => undefined);
  await prisma.$disconnect();
}

async function medicationSearchPayload(query) {
  const normalized = normalizeName(query);
  const tags = await prisma.medicationSearchTag.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true, aliases: true } });
  const medications = await prisma.medicationGeneric.findMany({
    where: { isActive: true, isControlled: false },
    include: { tags: { include: { tag: true } } }
  });
  return [
    ...tags
      .filter((tag) => includesNormalized([tag.name, ...(Array.isArray(tag.aliases) ? tag.aliases : [])], normalized))
      .map((tag) => ({ type: "medication_tag", id: tag.id, label: tag.name, tagType: tag.type })),
    ...medications
      .filter((medication) => includesNormalized([medication.genericName, medication.familyName, medication.className, medication.pharmacologicClass, ...(Array.isArray(medication.aliases) ? medication.aliases : []), ...medication.tags.map(({ tag }) => tag.name), ...medication.tags.flatMap(({ tag }) => Array.isArray(tag.aliases) ? tag.aliases : [])], normalized))
      .map((medication) => ({ type: "generic_medication", id: medication.id, label: medication.genericName, genericName: medication.genericName, familyName: medication.familyName, className: medication.className, pharmacologicClass: medication.pharmacologicClass, isControlled: medication.isControlled, isAntibiotic: medication.isAntibiotic }))
  ];
}

async function assertMedicationSearch(query, expectedLabels) {
  const payload = await medicationSearchPayload(query);
  const labels = payload.map((item) => item.label);
  assert(expectedLabels.some((label) => labels.includes(label)), `Search "${query}" did not return expected labels. Got: ${labels.join(", ")}`);
}

function includesNormalized(values, normalizedNeedle) {
  return values.some((value) => {
    const normalized = normalizeName(value);
    return normalized.includes(normalizedNeedle) || normalizedNeedle.includes(normalized);
  });
}

async function cleanup() {
  if (!patientId && !userId && !branchId) return;
  const prescriptionIds = patientId ? (await prisma.prescription.findMany({ where: { patientId }, select: { id: true } })).map((row) => row.id) : [];
  const orderIds = patientId ? (await prisma.investigationOrder.findMany({ where: { patientId }, select: { id: true } })).map((row) => row.id) : [];
  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: { in: prescriptionIds } } });
  await prisma.investigationOrderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  if (patientId) {
    await prisma.patientInvestigationHistoryItem.deleteMany({ where: { patientId } });
    await prisma.patientMedicationHistoryItem.deleteMany({ where: { patientId } });
    await prisma.patientOperationHistoryItem.deleteMany({ where: { patientId } });
    await prisma.patientHistorySheet.deleteMany({ where: { patientId } });
    await prisma.investigationOrder.deleteMany({ where: { patientId } });
    await prisma.prescription.deleteMany({ where: { patientId } });
    await prisma.patient.deleteMany({ where: { id: patientId } });
    patientId = null;
  }
  if (userId) {
    await prisma.user.deleteMany({ where: { id: userId } });
    userId = null;
  }
  if (branchId) {
    await prisma.branch.deleteMany({ where: { id: branchId } });
    branchId = null;
  }
}

function run(label, script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { stdio: "inherit", shell: false });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${label} failed with exit code ${code}`)));
    child.on("error", reject);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function modelBlock(schema, modelName) {
  const lines = schema.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `model ${modelName} {`);
  if (start === -1) throw new Error(`Model ${modelName} not found in schema.`);
  const end = lines.findIndex((line, index) => index > start && line.trim() === "}");
  if (end === -1) throw new Error(`Model ${modelName} is not closed in schema.`);
  return lines.slice(start + 1, end).join("\n");
}
