
const RETRIEVED_AT = new Date("2026-07-17T00:00:00.000Z");

const templates = [
  {
    name: "First-Trimester Booking Panel",
    sourceIdentifier: "CLINIC-TMPL-1",
    patientTypes: ["OBSTETRIC"],
    items: [
      { code: "COMPLETE_BLOOD_COUNT_CBC", required: true },
      { code: "ABO_BLOOD_GROUP_AND_RH_TYPING", required: true },
      { code: "ROUTINE_URINE_ANALYSIS", required: true },
      { code: "HBSAG", required: true },
      { code: "HCV_ANTIBODY", required: true },
      { code: "HIV_1_2_ANTIGEN_AND_ANTIBODY_TEST", required: true },
      { code: "VDRL_RPR", required: true },
      { code: "RUBELLA_IGG", required: true },
      { code: "RANDOM_BLOOD_GLUCOSE", required: false, responsibilityJson: { alternativeGroup: "Glucose Assessment" } },
      { code: "FASTING_BLOOD_GLUCOSE", required: false, responsibilityJson: { alternativeGroup: "Glucose Assessment" } },
      { code: "FIRST_TRIMESTER_OBSTETRIC_ULTRASOUND", required: false, responsibilityJson: { alternativeGroup: "Viability Assessment" } },
      { code: "EARLY_PREGNANCY_SCAN", required: false, responsibilityJson: { alternativeGroup: "Viability Assessment" } }
    ]
  },
  {
    name: "PIH / Pre-Eclampsia Workup",
    sourceIdentifier: "CLINIC-TMPL-2",
    patientTypes: ["HIGH_RISK_OBSTETRIC"],
    items: [
      { code: "COMPLETE_BLOOD_COUNT_CBC", required: true },
      { code: "UREA", required: true },
      { code: "CREATININE", required: true },
      { code: "URIC_ACID", required: true },
      { code: "AST", required: true },
      { code: "ALT", required: true },
      { code: "LDH", required: true },
      { code: "URINE_PROTEIN_CREATININE_RATIO", required: false, responsibilityJson: { alternativeGroup: "Protein Assessment" } },
      { code: "24_HOUR_URINARY_PROTEIN", required: false, responsibilityJson: { alternativeGroup: "Protein Assessment" } },
      { code: "BIOPHYSICAL_PROFILE", required: false, rationale: "Fetal assessment subgroup" },
      { code: "UMBILICAL_ARTERY_DOPPLER", required: false, rationale: "Fetal assessment subgroup" },
      { code: "MIDDLE_CEREBRAL_ARTERY_DOPPLER", required: false, rationale: "Fetal assessment subgroup" },
      { code: "CARDIOTOCOGRAPHY", required: false, rationale: "Fetal assessment subgroup" }
    ]
  },
  {
    name: "Basic Infertility Workup (Female)",
    sourceIdentifier: "CLINIC-TMPL-3",
    patientTypes: ["INFERTILITY"],
    items: [
      { code: "AMH", required: true },
      { code: "FSH", required: true },
      { code: "LH", required: true },
      { code: "ESTRADIOL", required: true },
      { code: "PROLACTIN", required: true },
      { code: "TSH", required: true },
      { code: "RUBELLA_IGG", required: true },
      { code: "TRANSVAGINAL_ULTRASOUND", required: true },
      { code: "ANTRAL_FOLLICLE_COUNT", required: true },
      { code: "HYSTEROSALPINGOGRAPHY", required: true }
    ]
  },
  {
    name: "PCOS / Hyperandrogenism Panel",
    sourceIdentifier: "CLINIC-TMPL-4",
    patientTypes: ["INFERTILITY", "GYNECOLOGY"],
    items: [
      { code: "TOTAL_TESTOSTERONE", required: true },
      { code: "FREE_TESTOSTERONE", required: true },
      { code: "SHBG", required: true },
      { code: "FSH", required: true },
      { code: "LH", required: true },
      { code: "FASTING_INSULIN", required: true },
      { code: "LIPID_PROFILE", required: true },
      { code: "TRANSVAGINAL_ULTRASOUND", required: true },
      { code: "FASTING_BLOOD_GLUCOSE", required: false, responsibilityJson: { alternativeGroup: "Glucose Assessment" } },
      { code: "ORAL_GLUCOSE_TOLERANCE_TEST_OGTT", required: false, responsibilityJson: { alternativeGroup: "Glucose Assessment" } }
    ]
  },
  {
    name: "Recurrent Pregnancy Loss (RPL) Screen",
    sourceIdentifier: "CLINIC-TMPL-5",
    patientTypes: ["INFERTILITY", "OBSTETRIC"],
    items: [
      { code: "LUPUS_ANTICOAGULANT", required: true },
      { code: "ANTICARDIOLIPIN_ANTIBODIES", required: true },
      { code: "BETA2_GLYCOPROTEIN_ANTIBODIES", required: true },
      { code: "TSH", required: true },
      { code: "THYROID_PEROXIDASE_ANTIBODY", required: true },
      { code: "PROLACTIN", required: true },
      { code: "HBA1C", required: true },
      { code: "KARYOTYPE", required: true },
      { code: "UTERUS_3D_ULTRASOUND", required: true }
    ]
  },
  {
    name: "Abnormal Uterine Bleeding (AUB) Workup",
    sourceIdentifier: "CLINIC-TMPL-6",
    patientTypes: ["GYNECOLOGY"],
    items: [
      { code: "COMPLETE_BLOOD_COUNT_CBC", required: true },
      { code: "TSH", required: true },
      { code: "TRANSVAGINAL_ULTRASOUND", required: true },
      { code: "QUANTITATIVE_SERUM_BETA_HCG", required: false, rationale: "reproductive age or pregnancy possibility" },
      { code: "COAGULATION_PROFILE", required: false, rationale: "particularly adolescents or suspected bleeding disorder" },
      { code: "OFFICE_ENDOMETRIAL_BIOPSY_SAMPLING", required: false, rationale: "age above 45 or appropriate risk factors" },
      { code: "ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY", required: false, rationale: "Related pathology, shown but not selected automatically" }
    ]
  },
  {
    name: "Pre-Operative Assessment (Major Surgery)",
    sourceIdentifier: "CLINIC-TMPL-7",
    patientTypes: ["GYNECOLOGY", "OBSTETRIC"],
    items: [
      { code: "COMPLETE_BLOOD_COUNT_CBC", required: true },
      { code: "ABO_BLOOD_GROUP_AND_RH_TYPING", required: true },
      { code: "FASTING_BLOOD_GLUCOSE", required: true },
      { code: "PT", required: true },
      { code: "INR", required: true },
      { code: "APTT", required: true },
      { code: "ECG", required: true },
      { code: "ANESTHESIA_ASSESSMENT", required: true }
    ]
  },
  {
    name: "Vaginitis / Pelvic Infection Panel",
    sourceIdentifier: "CLINIC-TMPL-8",
    patientTypes: ["GYNECOLOGY"],
    items: [
      { code: "ROUTINE_URINE_ANALYSIS", required: true },
      { code: "VAGINAL_SWAB_CULTURE", required: true },
      { code: "CERVICAL_SWAB", required: true },
      { code: "CHLAMYDIA_NAAT", required: true },
      { code: "GONORRHEA_NAAT", required: true },
      { code: "TRANSVAGINAL_ULTRASOUND", required: false, rationale: "suspected PID, pelvic mass, or tubo-ovarian abscess" }
    ]
  }
];

async function seedV152InvestigationSets(prisma) {
  const owner = await prisma.user.findFirst({ where: { status: "active", userRoles: { some: { role: { name: "Owner" } } } }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!owner) throw new Error("An active Owner is required to attribute governed clinic investigation sets.");
  
  // Clean up any old templates seeded previously to avoid duplicates or name collisions
  await prisma.investigationFavoriteSet.deleteMany({
    where: { scope: "clinic" }
  });

  const allCodes = [...new Set(templates.flatMap(t => t.items.map(i => i.code)))];
  const catalog = await prisma.investigationCatalogItem.findMany({ where: { code: { in: allCodes }, active: true }, select: { id: true, code: true } });
  const byCode = new Map(catalog.map((item) => [item.code, item.id]));
  
  // Note missing codes if any, but continue seeding the ones we have
  const missing = allCodes.filter((code) => !byCode.has(code));
  if (missing.length) console.warn("WARN: Missing active investigation catalog codes:", missing.join(", "));

  let created = 0;
  for (const item of templates) {
    const data = { 
      userId: owner.id, 
      name: item.name, 
      icon: "investigations", 
      scope: "clinic", 
      active: true, 
      publicationState: "SOURCE_VERIFIED_REFERENCE", 
      sourceIdentifier: item.sourceIdentifier, 
      sourceRetrievedAt: RETRIEVED_AT, 
      version: 1, 
      patientTypesJson: item.patientTypes, 
      guidanceText: "Applying this template replaces the basket contents upon confirmation.", 
      actionable: true 
    };
    
    const target = await prisma.investigationFavoriteSet.create({ data });
    created += 1;
    
    const itemsToCreate = [];
    for (let i = 0; i < item.items.length; i++) {
        const itemDef = item.items[i];
        if (!byCode.has(itemDef.code)) continue;
        itemsToCreate.push({
            favoriteSetId: target.id, 
            investigationCatalogItemId: byCode.get(itemDef.code), 
            position: i, 
            required: itemDef.required, 
            rationale: itemDef.rationale || null, 
            responsibilityJson: itemDef.responsibilityJson || null
        });
    }
    
    if (itemsToCreate.length) {
        await prisma.investigationFavoriteSetItem.createMany({ data: itemsToCreate });
    }
  }
  return { target: templates.length, created, missingCatalogCodes: missing.length };
}

module.exports = { seedV152InvestigationSets, v152InvestigationSets: templates };
