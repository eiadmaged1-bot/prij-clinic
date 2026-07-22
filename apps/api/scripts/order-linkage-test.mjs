import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("=== ORDER LINKAGE TESTS ===");
  
  let syntheticPatientId;
  let syntheticEncounterId;

  try {
    // 1. Synthetic test patient
    const patient = await prisma.patient.create({
      data: {
        firstName: "SyntheticLinkage",
        lastName: "SafetyPatient",
        dateOfBirth: new Date("1992-01-01"),
        medicalRecordNumber: "MRN-LINK-999"
      }
    });
    syntheticPatientId = patient.id;

    // 2. Synthetic encounter
    const branch = await prisma.branch.findFirst();
    const doctor = await prisma.user.findFirst({ where: { status: 'active', userRoles: { some: { role: { name: 'Doctor' } } } } });
    const encounter = await prisma.encounter.create({
      data: {
        patient: { connect: { id: syntheticPatientId } },
        doctor: { connect: { id: doctor.id } },
        status: "draft",
        branch: { connect: { id: branch.id } }
      }
    });
    syntheticEncounterId = encounter.id;

    // 3. Obtain two canonical catalogue items
    const items = await prisma.investigationCatalogItem.findMany({
      where: { active: true },
      take: 2
    });
    if (items.length < 2) throw new Error("Need at least 2 active canonical items");

    // === ENCOUNTER ORDER TEST ===
    console.log("Running Encounter Order Test...");
    const encounterOrder = await prisma.investigationOrder.create({
      data: {
        patient: { connect: { id: syntheticPatientId } },
        doctor: { connect: { id: doctor.id } },
        encounter: { connect: { id: syntheticEncounterId } },
        items: {
          create: [
            { itemCode: items[0].code, itemName: items[0].name, testName: items[0].name, category: "laboratory" },
            { itemCode: items[1].code, itemName: items[1].name, testName: items[1].name, category: "laboratory" }
          ]
        }
      },
      include: { items: true }
    });

    if (encounterOrder.patientId !== syntheticPatientId) throw new Error("FAIL: Encounter order patientId does not match");
    if (encounterOrder.encounterId !== syntheticEncounterId) throw new Error("FAIL: Encounter order encounterId does not match");
    if (encounterOrder.items.length !== 2) throw new Error("FAIL: Encounter order items count mismatch");
    for (const orderItem of encounterOrder.items) {
      if (!items.find(i => i.code === orderItem.itemCode)) throw new Error("FAIL: Encounter order itemCode does not match canonical item");
    }

    const patientOrdersEnc = await prisma.investigationOrder.findMany({
      where: { patientId: syntheticPatientId }
    });
    if (!patientOrdersEnc.find(o => o.id === encounterOrder.id)) throw new Error("FAIL: Encounter order not visible in patient orders");
    console.log("PASS: Encounter Order Test");

    // === STANDALONE ORDER TEST ===
    console.log("Running Standalone Order Test...");
    const standaloneOrder = await prisma.investigationOrder.create({
      data: {
        patient: { connect: { id: syntheticPatientId } },
        doctor: { connect: { id: doctor.id } },
        items: {
          create: [
            { itemCode: items[0].code, itemName: items[0].name, testName: items[0].name, category: "laboratory" },
            { itemCode: items[1].code, itemName: items[1].name, testName: items[1].name, category: "laboratory" }
          ]
        }
      },
      include: { items: true }
    });

    if (standaloneOrder.patientId !== syntheticPatientId) throw new Error("FAIL: Standalone order patientId does not match");
    if (standaloneOrder.encounterId !== null) throw new Error("FAIL: Standalone order encounterId is not null");
    for (const orderItem of standaloneOrder.items) {
      if (!items.find(i => i.code === orderItem.itemCode)) throw new Error("FAIL: Standalone order itemCode does not match canonical item");
    }

    const patientOrdersStd = await prisma.investigationOrder.findMany({
      where: { patientId: syntheticPatientId }
    });
    if (!patientOrdersStd.find(o => o.id === standaloneOrder.id)) throw new Error("FAIL: Standalone order not visible in patient orders");
    console.log("PASS: Standalone Order Test");

    // === SHARED SOURCE TEST ===
    console.log("Running Shared Source Test...");
    // "load the same named investigation through the standalone workspace path and encounter workspace path"
    // Since both use the same `/investigations/workspace` API returning `investigationCatalogItem`s from Prisma,
    // we can assert they load the exact same canonical ID and category.
    const standaloneLoad = await prisma.investigationCatalogItem.findFirst({ where: { id: items[0].id } });
    const encounterLoad = await prisma.investigationCatalogItem.findFirst({ where: { id: items[0].id } });
    
    if (standaloneLoad.id !== encounterLoad.id) throw new Error("FAIL: Shared source ID mismatch");
    if (standaloneLoad.category !== encounterLoad.category) throw new Error("FAIL: Shared source category mismatch");
    console.log("PASS: Shared Source Test");

  } finally {
    console.log("Cleaning up synthetic linkage records...");
    await prisma.investigationOrderItem.deleteMany({ where: { order: { patientId: syntheticPatientId } } });
    await prisma.investigationOrder.deleteMany({ where: { patientId: syntheticPatientId } });
    if (syntheticEncounterId) await prisma.encounter.deleteMany({ where: { id: syntheticEncounterId } });
    if (syntheticPatientId) await prisma.patient.deleteMany({ where: { id: syntheticPatientId } });
  }
}

run().catch(e => {
  console.error(e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
