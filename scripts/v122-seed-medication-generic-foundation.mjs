import { createPrisma, normalizeName, writeReports } from "./v121-reference-utils.mjs";

const prisma = createPrisma();

const tags = [
  ["Analgesic", "FUNCTION", ["pain killer", "painkiller", "pain relief"]],
  ["NSAID", "CLASS", ["non steroidal anti inflammatory", "anti inflammatory"]],
  ["Controlled analgesic category", "SAFETY_FLAG", ["controlled pain medicine", "opioid category", "locked analgesic"]],
  ["Antibiotic", "FAMILY", ["antibacterial", "antibiotics"]],
  ["Beta-lactam antibiotic", "CLASS", ["beta lactam"]],
  ["Penicillin family", "FAMILY", ["penicillin"]],
  ["Cephalosporin family", "FAMILY", ["cephalosporin"]],
  ["Macrolide family", "FAMILY", ["macrolide"]],
  ["Tetracycline family", "FAMILY", ["tetracycline"]],
  ["Nitroimidazole family", "FAMILY", ["nitroimidazole"]],
  ["Aminoglycoside family", "FAMILY", ["aminoglycoside"]],
  ["Fluoroquinolone family", "FAMILY", ["quinolone"]],
  ["Gram positive antibiotics", "SPECTRUM", ["gram positive", "gram-positive antibiotics"]],
  ["Antifungal", "FAMILY", ["antifungal medicine"]],
  ["Antiviral", "FAMILY", ["antiviral medicine"]],
  ["Antiemetic", "FUNCTION", ["nausea", "vomiting medicine"]],
  ["Antacid/PPI", "FUNCTION", ["acid reflux", "ppi", "antacid"]],
  ["Antihistamine", "CLASS", ["allergy medicine"]],
  ["Corticosteroid", "CLASS", ["steroid"]],
  ["Anticoagulant", "CLASS", ["blood thinner"]],
  ["Antihypertensive", "CLASS", ["blood pressure medicine"]],
  ["Antidiabetic", "CLASS", ["diabetes medicine"]],
  ["Hormonal therapy", "SPECIALTY", ["hormone therapy"]],
  ["Contraceptive", "SPECIALTY", ["contraception"]],
  ["Iron preparation", "FUNCTION", ["iron"]],
  ["Vitamins/minerals", "FUNCTION", ["vitamin", "mineral"]]
];

const generics = [
  ["Paracetamol", "Analgesic", "Non-opioid analgesic", "Analgesic", null, ["Analgesic"], ["acetaminophen"]],
  ["Ibuprofen", "Analgesic", "NSAID", "Nonsteroidal anti-inflammatory drug", null, ["Analgesic", "NSAID"], []],
  ["Diclofenac", "Analgesic", "NSAID", "Nonsteroidal anti-inflammatory drug", null, ["Analgesic", "NSAID"], []],
  ["Naproxen", "Analgesic", "NSAID", "Nonsteroidal anti-inflammatory drug", null, ["Analgesic", "NSAID"], []],
  ["Amoxicillin", "Antibiotic", "Penicillin family", "Beta-lactam antibiotic", "Beta-lactam antibiotic", ["Antibiotic", "Beta-lactam antibiotic", "Penicillin family", "Gram positive antibiotics"], []],
  ["Amoxicillin clavulanate", "Antibiotic", "Penicillin family", "Beta-lactam antibiotic", "Beta-lactam antibiotic", ["Antibiotic", "Beta-lactam antibiotic", "Penicillin family", "Gram positive antibiotics"], ["co-amoxiclav"]],
  ["Cephalexin", "Antibiotic", "Cephalosporin family", "Beta-lactam antibiotic", "Beta-lactam antibiotic", ["Antibiotic", "Beta-lactam antibiotic", "Cephalosporin family", "Gram positive antibiotics"], []],
  ["Ceftriaxone", "Antibiotic", "Cephalosporin family", "Beta-lactam antibiotic", "Beta-lactam antibiotic", ["Antibiotic", "Beta-lactam antibiotic", "Cephalosporin family"], []],
  ["Azithromycin", "Antibiotic", "Macrolide family", "Macrolide antibiotic", null, ["Antibiotic", "Macrolide family"], []],
  ["Doxycycline", "Antibiotic", "Tetracycline family", "Tetracycline antibiotic", null, ["Antibiotic", "Tetracycline family"], []],
  ["Metronidazole", "Antibiotic", "Nitroimidazole family", "Nitroimidazole", null, ["Antibiotic", "Nitroimidazole family"], []],
  ["Gentamicin", "Antibiotic", "Aminoglycoside family", "Aminoglycoside antibiotic", null, ["Antibiotic", "Aminoglycoside family"], []],
  ["Ciprofloxacin", "Antibiotic", "Fluoroquinolone family", "Fluoroquinolone antibiotic", null, ["Antibiotic", "Fluoroquinolone family"], []],
  ["Fluconazole", "Antifungal", "Triazole antifungal", "Antifungal", null, ["Antifungal"], []],
  ["Clotrimazole", "Antifungal", "Azole antifungal", "Antifungal", null, ["Antifungal"], []],
  ["Acyclovir", "Antiviral", "Nucleoside analogue", "Antiviral", null, ["Antiviral"], ["aciclovir"]],
  ["Ondansetron", "Antiemetic", "5-HT3 antagonist", "Antiemetic", null, ["Antiemetic"], []],
  ["Metoclopramide", "Antiemetic", "Dopamine antagonist", "Antiemetic", null, ["Antiemetic"], []],
  ["Omeprazole", "Antacid/PPI", "Proton pump inhibitor", "PPI", null, ["Antacid/PPI"], []],
  ["Famotidine", "Antacid/PPI", "H2 receptor antagonist", "H2 blocker", null, ["Antacid/PPI"], []],
  ["Cetirizine", "Antihistamine", "Second-generation antihistamine", "Antihistamine", null, ["Antihistamine"], []],
  ["Loratadine", "Antihistamine", "Second-generation antihistamine", "Antihistamine", null, ["Antihistamine"], []],
  ["Hydrocortisone", "Corticosteroid", "Corticosteroid", "Corticosteroid", null, ["Corticosteroid"], []],
  ["Prednisolone", "Corticosteroid", "Corticosteroid", "Corticosteroid", null, ["Corticosteroid"], []],
  ["Enoxaparin", "Anticoagulant", "Low molecular weight heparin", "Anticoagulant", null, ["Anticoagulant"], []],
  ["Warfarin", "Anticoagulant", "Vitamin K antagonist", "Anticoagulant", null, ["Anticoagulant"], []],
  ["Amlodipine", "Antihypertensive", "Calcium channel blocker", "Antihypertensive", null, ["Antihypertensive"], []],
  ["Metformin", "Antidiabetic", "Biguanide", "Antidiabetic", null, ["Antidiabetic"], []],
  ["Progesterone", "Hormonal therapy", "Progestogen", "Hormonal therapy", null, ["Hormonal therapy"], []],
  ["Levonorgestrel", "Contraceptive", "Progestogen", "Hormonal contraceptive", null, ["Contraceptive", "Hormonal therapy"], []],
  ["Ethinylestradiol", "Contraceptive", "Estrogen", "Hormonal contraceptive", null, ["Contraceptive", "Hormonal therapy"], []],
  ["Ferrous sulfate", "Iron preparation", "Iron salt", "Iron preparation", null, ["Iron preparation"], ["ferrous sulphate"]],
  ["Folic acid", "Vitamins/minerals", "Vitamin", "Vitamin B9", null, ["Vitamins/minerals"], []],
  ["Calcium carbonate", "Vitamins/minerals", "Mineral", "Calcium salt", null, ["Vitamins/minerals", "Antacid/PPI"], []],
  ["Colecalciferol", "Vitamins/minerals", "Vitamin", "Vitamin D", null, ["Vitamins/minerals"], ["cholecalciferol", "vitamin d3"]]
];

const skipped = [
  "Controlled generic analgesics are intentionally not seeded by default.",
  "Combination products and unclear classification rows are left for manual review."
];

try {
  const tagRows = new Map();
  for (const [name, type, aliases] of tags) {
    const row = await prisma.medicationSearchTag.upsert({
      where: { normalizedName: normalizeName(name) },
      update: { name, type, aliases, isActive: true },
      create: { name, normalizedName: normalizeName(name), type, aliases, isActive: true }
    });
    tagRows.set(name, row);
  }

  const classNames = new Set(tags.map(([name]) => name));
  for (const name of classNames) {
    const tag = tagRows.get(name);
    await prisma.medicationClass.upsert({
      where: { normalizedName: normalizeName(name) },
      update: { name, type: tag?.type ?? "CLASS", aliases: tag?.aliases ?? [], isActive: true },
      create: { name, normalizedName: normalizeName(name), type: tag?.type ?? "CLASS", aliases: tag?.aliases ?? [], isActive: true }
    });
  }

  for (const [genericName, familyName, className, pharmacologicClass, parentClass, tagNames, aliases] of generics) {
    const medication = await prisma.medicationGeneric.upsert({
      where: { normalizedName: normalizeName(genericName) },
      update: {
        genericName,
        familyName,
        className,
        pharmacologicClass,
        parentClass,
        aliases,
        isControlled: false,
        isAntibiotic: tagNames.includes("Antibiotic"),
        isActive: true,
        sourceType: "curated_reference",
        reviewStatus: "reviewed",
        notes: "Generic-name reference lookup only. Doctor-authored prescription directions remain manual."
      },
      create: {
        genericName,
        normalizedName: normalizeName(genericName),
        familyName,
        className,
        pharmacologicClass,
        parentClass,
        aliases,
        isControlled: false,
        isAntibiotic: tagNames.includes("Antibiotic"),
        isActive: true,
        sourceType: "curated_reference",
        reviewStatus: "reviewed",
        notes: "Generic-name reference lookup only. Doctor-authored prescription directions remain manual."
      }
    });

    for (const tagName of tagNames) {
      const tag = tagRows.get(tagName);
      if (!tag) continue;
      await prisma.medicationGenericTag.upsert({
        where: { medicationGenericId_medicationSearchTagId: { medicationGenericId: medication.id, medicationSearchTagId: tag.id } },
        update: {},
        create: { medicationGenericId: medication.id, medicationSearchTagId: tag.id }
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    medicationGenericCount: await prisma.medicationGeneric.count(),
    medicationSearchTagCount: await prisma.medicationSearchTag.count(),
    medicationClassCount: await prisma.medicationClass.count(),
    controlledGenericRows: await prisma.medicationGeneric.count({ where: { isControlled: true } }),
    seededGenericRows: generics.length,
    skipped
  };
  const markdown = `# v0.12.2 Medication Generic Seed Report

- Generated: ${report.generatedAt}
- Generic medication rows: ${report.medicationGenericCount}
- Search tags: ${report.medicationSearchTagCount}
- Classes/families: ${report.medicationClassCount}
- Controlled generic rows: ${report.controlledGenericRows}

## Skipped

${skipped.map((item) => `- ${item}`).join("\n")}
`;
  await writeReports("v122-medication-generic-seed-report", report, markdown);
  console.log(`V122-SEED-MEDICATION-GENERIC PASS generics=${report.medicationGenericCount} tags=${report.medicationSearchTagCount} classes=${report.medicationClassCount} controlled=${report.controlledGenericRows}`);
} finally {
  await prisma.$disconnect();
}
