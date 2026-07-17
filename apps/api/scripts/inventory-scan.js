const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const models = [
    "patient", "encounter", "queueTicket", "prescription", "prescriptionItem",
    "investigationOrder", "investigationResult", "obUltrasound",
    "guidelineDocument", "guidelineVersion", "guidelineChunk", "clinicalProtocol",
    "medicationGeneric", "medicationFamily", "medicationMembership",
    "medicationOfficialProfile", "medicationInteraction", "dermatologyTopic",
    "user", "auditLog"
  ];
  
  console.log("=== Protected Inventory ===");
  for (const m of models) {
    try {
      if (prisma[m]) {
        const count = await prisma[m].count();
        console.log(`${m.padEnd(25)}: ${count}`);
      } else {
        console.log(`${m.padEnd(25)}: N/A (Model not found)`);
      }
    } catch (e) {
      console.log(`${m.padEnd(25)}: Error (${e.message.split('\n')[0]})`);
    }
  }

  console.log("\n=== Guideline States ===");
  const total = await prisma.guidelineDocument.count();
  const withAsset = await prisma.guidelineDocument.count({ where: { localFilePath: { not: null } } });
  const noAsset = await prisma.guidelineDocument.count({ where: { localFilePath: null } });
  
  console.log(`Total Guidelines: ${total}`);
  console.log(`With Asset (Working PDFs): ${withAsset}`);
  console.log(`No Asset (Metadata Only / Missing): ${noAsset}`);
  console.log(`Indexed Documents: ${await prisma.guidelineDocument.count({ where: { chunks: { some: {} } } })}`);
  console.log(`Needs Clinical Review: ${await prisma.guidelineSummary.count({ where: { status: "DRAFT" } })}`);
  console.log(`Approved Summaries: ${await prisma.guidelineSummary.count({ where: { status: "APPROVED" } })}`);

  await prisma.$disconnect();
}

run().catch(console.error);
