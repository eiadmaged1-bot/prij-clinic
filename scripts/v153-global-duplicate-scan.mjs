import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Global Duplicate Governance Scan (Dry Run)\n");
  
  const tables = [
    "Patient",
    "Encounter",
    "QueueTicket",
    "Prescription",
    "PrescriptionItem",
    "InvestigationOrder",
    "InvestigationResult",
    "ObUltrasound",
    "GuidelineDocument",
    "GuidelineVersion",
    "GuidelineChunk",
    "ClinicalProtocol",
    "MedicationGeneric",
    "MedicationClass",
    "MedicationOfficialProfile",
    "MedicationInteractionRule",
    "DermatologyCondition",
    "DermatologyGenericOption"
  ];

  for (const table of tables) {
    console.log(`\n============================================================`);
    console.log(`Scanning table: ${table}`);
    console.log(`============================================================`);
    
    // Count total records
    const result = await prisma.$queryRawUnsafe(`SELECT count(*)::int as total FROM "${table}"`);
    const total = result[0]?.total ?? 0;
    console.log(`Total Records: ${total}`);

    // If there is any specific duplicate checking for particular tables, we do it here.
    if (table === "Patient") {
      const dupPhones = await prisma.$queryRaw`SELECT phone, count(*)::int as c FROM "Patient" WHERE phone IS NOT NULL GROUP BY phone HAVING count(*) > 1`;
      console.log(`Duplicate phone groups: ${dupPhones.length}`);
      
      const dupMrns = await prisma.$queryRaw`SELECT "medicalRecordNumber", count(*)::int as c FROM "Patient" GROUP BY "medicalRecordNumber" HAVING count(*) > 1`;
      console.log(`Duplicate MRN groups: ${dupMrns.length}`);
    }

    if (table === "MedicationGeneric") {
      const dupGenerics = await prisma.$queryRaw`SELECT "genericName", count(*)::int as c FROM "MedicationGeneric" GROUP BY "genericName" HAVING count(*) > 1`;
      console.log(`Duplicate Generic Names: ${dupGenerics.length}`);
    }

    if (table === "MedicationClass") {
      const dupFamilies = await prisma.$queryRaw`SELECT name, count(*)::int as c FROM "MedicationClass" GROUP BY name HAVING count(*) > 1`;
      console.log(`Duplicate Class Names: ${dupFamilies.length}`);
    }

    if (table === "GuidelineDocument") {
      const dupTitles = await prisma.$queryRaw`SELECT title, count(*)::int as c FROM "GuidelineDocument" GROUP BY title HAVING count(*) > 1`;
      console.log(`Duplicate Document Titles: ${dupTitles.length}`);
    }

    if (table === "ClinicalProtocol") {
      const dupProts = await prisma.$queryRaw`SELECT "code", count(*)::int as c FROM "ClinicalProtocol" GROUP BY "code" HAVING count(*) > 1`;
      console.log(`Duplicate Protocol codes: ${dupProts.length}`);
    }

    if (table === "DermatologyCondition") {
      const dupConds = await prisma.$queryRaw`SELECT "stableCode", count(*)::int as c FROM "DermatologyCondition" GROUP BY "stableCode" HAVING count(*) > 1`;
      console.log(`Duplicate Dermatology stableCodes: ${dupConds.length}`);
    }
  }

  console.log(`\nGlobal scan complete.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
