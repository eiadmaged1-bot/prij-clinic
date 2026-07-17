const investigationCatalogItems = [
  ["CBC", "Complete Blood Count", "Laboratory - general", "Laboratory", null, "Blood"],
  ["CBC_SHORT", "CBC", "Laboratory - general", "Laboratory", null, "Blood"],
  ["PLATELET_COUNT", "Platelet Count", "Laboratory - general", "Laboratory", null, "Blood"],
  ["BLOOD_GROUP_RH", "Blood Group and Rh", "Laboratory - general", "Laboratory", null, "Blood"],
  ["ANTIBODY_SCREEN", "Antibody Screen", "Laboratory - general", "Laboratory", null, "Blood"],
  ["FASTING_BLOOD_GLUCOSE", "Fasting Blood Glucose", "Laboratory - general", "Laboratory", null, "Blood"],
  ["RANDOM_BLOOD_GLUCOSE", "Random Blood Glucose", "Laboratory - general", "Laboratory", null, "Blood"],
  ["HBA1C", "HbA1c", "Laboratory - general", "Laboratory", null, "Blood"],
  ["TSH", "TSH", "Laboratory - general", "Laboratory", null, "Blood"],
  ["FREE_T4", "Free T4", "Laboratory - general", "Laboratory", null, "Blood"],
  ["PROLACTIN", "Prolactin", "Laboratory - general", "Laboratory", null, "Blood"],
  ["SERUM_BETA_HCG", "Serum Beta-hCG", "Laboratory - general", "Laboratory", null, "Blood"],
  ["URINE_PREGNANCY_TEST", "Urine Pregnancy Test", "Laboratory - general", "Laboratory", null, "Urine"],
  ["URINALYSIS", "Urinalysis", "Laboratory - general", "Laboratory", null, "Urine"],
  ["URINE_CULTURE", "Urine Culture", "Laboratory - general", "Laboratory", null, "Urine"],
  ["LIVER_FUNCTION_TESTS", "Liver Function Tests", "Laboratory - general", "Laboratory", null, "Blood"],
  ["KIDNEY_FUNCTION_TESTS", "Kidney Function Tests", "Laboratory - general", "Laboratory", null, "Blood"],
  ["COAGULATION_PROFILE", "Coagulation Profile", "Laboratory - general", "Laboratory", null, "Blood"],
  ["FERRITIN", "Ferritin", "Laboratory - general", "Laboratory", null, "Blood"],
  ["SERUM_IRON", "Serum Iron", "Laboratory - general", "Laboratory", null, "Blood"],
  ["TIBC", "TIBC", "Laboratory - general", "Laboratory", null, "Blood"],
  ["VITAMIN_D", "Vitamin D", "Laboratory - general", "Laboratory", null, "Blood"],
  ["VITAMIN_B12", "Vitamin B12", "Laboratory - general", "Laboratory", null, "Blood"],
  ["HBSAG", "HBsAg", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["HCV_ANTIBODY", "HCV Antibody", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["HIV_1_2_AG_AB", "HIV 1/2 Ag/Ab", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["HIV_AG_AB", "HIV Ag/Ab", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["VDRL_RPR", "VDRL/RPR", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["RUBELLA_IGG", "Rubella IgG", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["TOXOPLASMA_IGG_IGM", "Toxoplasma IgG/IgM", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["CMV_IGG_IGM", "CMV IgG/IgM", "Infectious / antenatal screening", "Laboratory", null, "Blood"],
  ["VAGINAL_SWAB_CULTURE", "Vaginal Swab Culture", "Infectious / antenatal screening", "Laboratory", null, "Swab"],
  ["CERVICAL_SWAB", "Cervical Swab", "Infectious / antenatal screening", "Laboratory", null, "Swab"],
  ["CHLAMYDIA_NAAT", "Chlamydia NAAT", "Infectious / antenatal screening", "Laboratory", null, "Swab"],
  ["GONORRHEA_NAAT", "Gonorrhea NAAT", "Infectious / antenatal screening", "Laboratory", null, "Swab"],
  ["HPV_DNA_TEST", "HPV DNA Test", "Infectious / antenatal screening", "Laboratory", null, "Swab"],
  ["HPV_TEST", "HPV test", "Cytology / screening", "Pathology", null, "Cervical sample"],
  ["PAP_SMEAR_CERVICAL_CYTOLOGY", "Pap Smear / Cervical Cytology", "Infectious / antenatal screening", "Pathology", null, "Cervical cytology"],
  ["PAP_SMEAR", "Pap smear", "Cytology / screening", "Pathology", null, "Cervical cytology"],
  ["CERVICAL_CYTOLOGY", "Cervical cytology", "Cytology / screening", "Pathology", null, "Cervical cytology"],
  ["FSH", "FSH", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["LH", "LH", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["ESTRADIOL", "Estradiol", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["PROGESTERONE", "Progesterone", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["AMH", "AMH", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["TOTAL_TESTOSTERONE", "Total Testosterone", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["FREE_TESTOSTERONE", "Free Testosterone", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["DHEAS", "DHEAS", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["17_OH_PROGESTERONE", "17-OH Progesterone", "Hormonal/fertility", "Laboratory", null, "Blood"],
  ["SEMEN_ANALYSIS", "Semen Analysis", "Hormonal/fertility", "Laboratory", null, "Semen"],
  ["CA_125", "CA-125", "Tumor markers", "Laboratory", null, "Blood"],
  ["CEA", "CEA", "Tumor markers", "Laboratory", null, "Blood"],
  ["CA_19_9", "CA 19-9", "Tumor markers", "Laboratory", null, "Blood"],
  ["ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY", "Endometrial biopsy histopathology", "Histopathology", "Pathology", null, "Tissue"],
  ["HISTOPATHOLOGY_REPORT", "Histopathology report", "Histopathology", "Pathology", null, "Tissue"],
  ["PELVIC_ULTRASOUND", "Pelvic Ultrasound", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["TRANSVAGINAL_ULTRASOUND", "Transvaginal Ultrasound", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["UTERUS_4D_ULTRASOUND", "4D uterus ultrasound", "4D ultrasound", "Ultrasound", "4D ultrasound", null],
  ["TRANSVAGINAL_4D_ULTRASOUND", "4D transvaginal ultrasound", "4D ultrasound", "Ultrasound", "4D ultrasound", null],
  ["OBSTETRIC_ULTRASOUND", "Obstetric ultrasound", "Obstetric ultrasound", "Ultrasound", "Ultrasound", null],
  ["FOLLICULOMETRY", "Folliculometry", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["EARLY_PREGNANCY_SCAN", "Early Pregnancy Scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["DATING_SCAN", "Dating Scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["NUCHAL_TRANSLUCENCY_SCAN", "Nuchal Translucency Scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["ANOMALY_SCAN", "Anomaly Scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["FETAL_GROWTH_SCAN", "Fetal Growth Scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["GROWTH_SCAN", "Growth scan", "Obstetric ultrasound", "Ultrasound", "Ultrasound", null],
  ["DOPPLER_ULTRASOUND", "Doppler Ultrasound", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["BIOPHYSICAL_PROFILE", "Biophysical Profile", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["CERVICAL_LENGTH_SCAN", "Cervical Length Scan", "OB/GYN ultrasound", "Ultrasound", "Ultrasound", null],
  ["FETAL_ECHOCARDIOGRAPHY_REFERRAL", "Fetal Echocardiography Referral", "OB/GYN ultrasound", "Referral", "Echocardiography", null],
  ["MAMMOGRAPHY", "Mammography", "Radiology/imaging", "Radiology", "Mammography", null],
  ["BREAST_ULTRASOUND", "Breast Ultrasound", "Radiology/imaging", "Radiology", "Ultrasound", null],
  ["PELVIC_MRI", "Pelvic MRI", "Radiology/imaging", "Radiology", "MRI", null],
  ["MRI_PELVIS", "MRI pelvis", "Radiology/imaging", "Radiology", "MRI", null],
  ["CT_ABDOMEN_PELVIS", "CT abdomen/pelvis", "Radiology/imaging", "Radiology", "CT", null],
  ["XRAY_PELVIS", "X-ray pelvis", "Radiology/imaging", "Radiology", "X-ray", null],
  ["HYSTEROSALPINGOGRAPHY", "Hysterosalpingography", "Radiology/imaging", "Radiology", "Fluoroscopy", null],
  ["SONOHYSTEROGRAPHY", "Sonohysterography", "Radiology/imaging", "Radiology", "Ultrasound", null],
  ["ECG", "ECG", "General", "Cardiology", "ECG", null],
  ["CHEST_XRAY", "Chest X-ray", "General", "Radiology", "X-ray", null],
  ["VASCULAR_SURGERY_OPINION", "Vascular surgery opinion", "External referral", "Referral", "Specialist report", null],
  ["VARICOSE_VEINS_VASCULAR_ASSESSMENT", "Varicose veins vascular assessment", "External referral", "Referral", "Specialist report", null],
  ["GENERAL_SURGERY_OPINION", "General surgery opinion", "External referral", "Referral", "Specialist report", null],
  ["CARDIOLOGY_CLEARANCE", "Cardiology clearance", "External referral", "Referral", "Specialist report", null],
  ["ANESTHESIA_ASSESSMENT", "Anesthesia assessment", "External referral", "Referral", "Specialist report", null]
];

async function seedInvestigationCatalog(prisma) {
  if (!prisma.investigationCatalogItem) {
    console.warn("WARN InvestigationCatalogItem model is not available; skipping investigation catalog seed.");
    return { skipped: true, count: 0 };
  }

  let sortOrder = 10;
  for (const [code, name, category, discipline, modality, sampleType] of investigationCatalogItems) {
    await prisma.investigationCatalogItem.upsert({
      where: { code },
      update: {
        name,
        normalizedName: normalizeName(name),
        category,
        aliasesJson: aliasesFor(code, name),
        tagsJson: tagsFor(category, discipline, modality),
        discipline,
        modality,
        sampleType,
        active: true,
        sortOrder
      },
      create: {
        code,
        name,
        normalizedName: normalizeName(name),
        category,
        aliasesJson: aliasesFor(code, name),
        tagsJson: tagsFor(category, discipline, modality),
        discipline,
        modality,
        sampleType,
        active: true,
        sortOrder
      }
    });
    sortOrder += 10;
  }

  return { skipped: false, count: investigationCatalogItems.length };
}

function normalizeName(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

function aliasesFor(code, name) {
  const aliases = new Set([name, code.replaceAll("_", " ")]);
  if (name.includes("X-ray")) aliases.add(name.replace("X-ray", "X ray"));
  if (name.includes("CA-125")) aliases.add("CA 125");
  if (name.includes("Beta-hCG")) aliases.add("Beta hCG");
  return Array.from(aliases);
}

function tagsFor(category, discipline, modality) {
  return [category, discipline, modality].filter(Boolean);
}

module.exports = {
  investigationCatalogItems,
  seedInvestigationCatalog
};
