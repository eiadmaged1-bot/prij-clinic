import { createRequire } from "node:module";
import { createPrisma } from "./v121-reference-utils.mjs";

const require = createRequire(import.meta.url);
const { seedInvestigationCatalog } = require("../apps/api/prisma/seeds/investigation-catalog");
const prisma = createPrisma();

const extraItems = [
  ["HEMOGLOBIN", "Hemoglobin", "Laboratory - general", "Laboratory", null, "Blood"],
  ["PLATELET_COUNT", "Platelet Count", "Laboratory - general", "Laboratory", null, "Blood"],
  ["BLOOD_GROUP_RH_SLASH", "Blood Group / Rh", "Laboratory - general", "Laboratory", null, "Blood"],
  ["BETA_HCG_QUANTITATIVE", "Beta-hCG quantitative", "Laboratory - general", "Laboratory", null, "Blood"],
  ["URINE_ANALYSIS", "Urine Analysis", "Laboratory - general", "Laboratory", null, "Urine"],
  ["HCV_AB", "HCV Ab", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["HIV_AG_AB", "HIV Ag/Ab", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["RUBELLA_IGG_IGM", "Rubella IgG/IgM", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["PT_INR", "PT/INR", "Laboratory - general", "Laboratory", null, "Blood"],
  ["APTT", "aPTT", "Laboratory - general", "Laboratory", null, "Blood"],
  ["PAP_SMEAR", "Pap smear", "Pathology/Cytology", "Pathology", null, "Cervical cytology"],
  ["HPV_TEST", "HPV test", "Pathology/Cytology", "Pathology", null, "Cervical swab"],
  ["VAGINAL_SWAB_CULTURE_SLASH", "Vaginal swab/culture", "Infectious / antenatal screening", "Laboratory", null, "Swab"],
  ["OBSTETRIC_ULTRASOUND", "Obstetric ultrasound", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["NT_SCAN", "NT scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["GROWTH_SCAN", "Growth scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["SALINE_INFUSION_SONOGRAPHY", "Saline infusion sonography", "Radiology/imaging", "Radiology", "Ultrasound", null],
  ["CT_ABDOMEN_PELVIS", "CT abdomen/pelvis", "Radiology/imaging", "Radiology", "CT", null],
  ["PAP_SMEAR_CYTOLOGY", "Pap smear cytology", "Pathology/Cytology", "Pathology", null, "Cervical cytology"],
  ["ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY", "Endometrial biopsy histopathology", "Pathology/Cytology", "Pathology", null, "Tissue"],
  ["CERVICAL_BIOPSY_HISTOPATHOLOGY", "Cervical biopsy histopathology", "Pathology/Cytology", "Pathology", null, "Tissue"],
  ["VULVAR_BIOPSY_HISTOPATHOLOGY", "Vulvar biopsy histopathology", "Pathology/Cytology", "Pathology", null, "Tissue"],
  ["PRODUCTS_OF_CONCEPTION_HISTOPATHOLOGY", "Products of conception histopathology", "Pathology/Cytology", "Pathology", null, "Tissue"],
  ["OVARIAN_CYST_HISTOPATHOLOGY", "Ovarian cyst histopathology", "Pathology/Cytology", "Pathology", null, "Tissue"],
  ["MYOMA_HISTOPATHOLOGY", "Myoma histopathology", "Pathology/Cytology", "Pathology", null, "Tissue"]
];

try {
  const base = await seedInvestigationCatalog(prisma);
  let sortOrder = 1000;
  for (const [code, name, category, discipline, modality, sampleType] of extraItems) {
    await prisma.investigationCatalogItem.upsert({
      where: { code },
      update: { name, category, discipline, modality, sampleType, active: true, sortOrder },
      create: { code, name, category, discipline, modality, sampleType, active: true, sortOrder }
    });
    sortOrder += 10;
  }
  const count = await prisma.investigationCatalogItem.count();
  console.log(`V121-SEED-INVESTIGATIONS PASS base=${base.count} extra=${extraItems.length} total=${count}`);
} finally {
  await prisma.$disconnect();
}
