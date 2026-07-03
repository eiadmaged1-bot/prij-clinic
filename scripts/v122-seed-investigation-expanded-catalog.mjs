import { createRequire } from "node:module";
import { codeFromName, createPrisma } from "./v121-reference-utils.mjs";

const require = createRequire(import.meta.url);
const { seedInvestigationCatalog } = require("../apps/api/prisma/seeds/investigation-catalog");
const prisma = createPrisma();

const items = [
  ["Complete blood count", "Laboratory", "Laboratory", null, "Blood"],
  ["Blood group and Rh", "Prenatal/OB tests", "Laboratory", null, "Blood"],
  ["Indirect Coombs test", "Prenatal/OB tests", "Laboratory", null, "Blood"],
  ["Fasting blood glucose", "Laboratory", "Laboratory", null, "Blood"],
  ["Oral glucose tolerance test", "Prenatal/OB tests", "Laboratory", null, "Blood"],
  ["HbA1c", "Laboratory", "Laboratory", null, "Blood"],
  ["TSH", "Hormonal tests", "Laboratory", null, "Blood"],
  ["Free T4", "Hormonal tests", "Laboratory", null, "Blood"],
  ["Prolactin", "Hormonal tests", "Laboratory", null, "Blood"],
  ["FSH", "Fertility tests", "Laboratory", null, "Blood"],
  ["LH", "Fertility tests", "Laboratory", null, "Blood"],
  ["Estradiol", "Fertility tests", "Laboratory", null, "Blood"],
  ["Progesterone", "Fertility tests", "Laboratory", null, "Blood"],
  ["AMH", "Fertility tests", "Laboratory", null, "Blood"],
  ["Semen analysis", "Fertility tests", "Laboratory", null, "Semen"],
  ["Urine analysis", "Microbiology", "Laboratory", null, "Urine"],
  ["Urine culture", "Microbiology", "Laboratory", null, "Urine"],
  ["High vaginal swab culture", "Microbiology", "Laboratory", null, "Swab"],
  ["Cervical swab culture", "Microbiology", "Laboratory", null, "Swab"],
  ["Pap smear", "Cytology", "Pathology", null, "Cervical cytology"],
  ["HPV test", "Cytology", "Pathology", null, "Cervical swab"],
  ["Endometrial biopsy histopathology", "Pathology", "Pathology", null, "Tissue"],
  ["Cervical biopsy histopathology", "Pathology", "Pathology", null, "Tissue"],
  ["Obstetric ultrasound", "Ultrasound", "Ultrasound", "Ultrasound", null],
  ["Early pregnancy ultrasound", "Prenatal/OB tests", "Ultrasound", "Ultrasound", null],
  ["Anomaly scan", "Prenatal/OB tests", "Ultrasound", "Ultrasound", null],
  ["Growth scan", "Prenatal/OB tests", "Ultrasound", "Ultrasound", null],
  ["Pelvic ultrasound", "Gynecology-related investigations", "Ultrasound", "Ultrasound", null],
  ["Transvaginal ultrasound", "Gynecology-related investigations", "Ultrasound", "Ultrasound", null],
  ["Saline infusion sonography", "Radiology", "Radiology", "Ultrasound", null],
  ["Hysterosalpingography", "Radiology", "Radiology", "X-ray", null],
  ["MRI pelvis", "Radiology", "Radiology", "MRI", null]
];

try {
  await seedInvestigationCatalog(prisma);
  let sortOrder = 2000;
  for (const [name, category, discipline, modality, sampleType] of items) {
    const existing = await prisma.investigationCatalogItem.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    });
    if (existing) {
      await prisma.investigationCatalogItem.update({
        where: { id: existing.id },
        data: { name, category, discipline, modality, sampleType, active: true, sortOrder }
      });
    } else {
      await prisma.investigationCatalogItem.upsert({
        where: { code: codeFromName("INV", name) },
        update: { name, category, discipline, modality, sampleType, active: true, sortOrder },
        create: { code: codeFromName("INV", name), name, category, discipline, modality, sampleType, active: true, sortOrder }
      });
    }
    sortOrder += 10;
  }
  await deactivateDuplicateActiveNames();
  const count = await prisma.investigationCatalogItem.count();
  console.log(`V122-SEED-INVESTIGATIONS PASS upserted=${items.length} total=${count}`);
} finally {
  await prisma.$disconnect();
}

async function deactivateDuplicateActiveNames() {
  const rows = await prisma.investigationCatalogItem.findMany({
    where: { active: true },
    orderBy: [{ name: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  });
  const seen = new Set();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      continue;
    }
    await prisma.investigationCatalogItem.update({
      where: { id: row.id },
      data: { active: false }
    });
  }
}
