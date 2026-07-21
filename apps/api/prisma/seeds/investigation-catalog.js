const investigationCatalogItems = [
  item("CBC", "Complete Blood Count (CBC)", "Laboratory", "Hematology", "Blood", "Whole blood", ["CBC", "complete blood picture", "صورة دم كاملة"]),
  item("HEMOGLOBIN", "Hemoglobin", "Laboratory", "Hematology", "Blood", "Whole blood", ["Hb", "haemoglobin", "هيموجلوبين"]),
  item("PLATELET_COUNT", "Platelet Count", "Laboratory", "Hematology", "Blood", "Whole blood", ["platelets", "PLT", "الصفائح الدموية"]),
  item("BLOOD_FILM", "Peripheral Blood Film", "Laboratory", "Hematology", "Blood", "Whole blood", ["blood smear", "peripheral smear"]),
  item("RETICULOCYTE_COUNT", "Reticulocyte Count", "Laboratory", "Hematology", "Blood", "Whole blood", ["retics"]),
  item("BLOOD_GROUP_RH", "Blood Group and Rh", "Laboratory", "Hematology", "Blood", "Whole blood", ["ABO", "Rh factor", "فصيلة الدم"]),
  item("ANTIBODY_SCREEN", "Red Cell Antibody Screen", "Laboratory", "Hematology", "Blood", "Serum", ["indirect Coombs", "antibody screen"]),
  item("FERRITIN", "Ferritin", "Laboratory", "Hematology", "Blood", "Serum", ["iron stores", "مخزون الحديد"]),
  item("SERUM_IRON", "Serum Iron", "Laboratory", "Hematology", "Blood", "Serum", ["iron", "حديد بالدم"]),
  item("TIBC", "Total Iron-Binding Capacity (TIBC)", "Laboratory", "Hematology", "Blood", "Serum", ["TIBC", "iron binding capacity"]),
  item("TRANSFERRIN_SATURATION", "Transferrin Saturation", "Laboratory", "Hematology", "Blood", "Serum", ["TSAT"]),
  item("ESR", "Erythrocyte Sedimentation Rate (ESR)", "Laboratory", "Hematology", "Blood", "Whole blood", ["ESR"]),

  item("COAGULATION_PROFILE", "Coagulation Profile", "Laboratory", "Coagulation", "Blood", "Plasma", ["PT", "INR", "aPTT", "سيولة الدم"]),
  item("PT_INR", "PT / INR", "Laboratory", "Coagulation", "Blood", "Plasma", ["prothrombin time", "INR"]),
  item("APTT", "aPTT", "Laboratory", "Coagulation", "Blood", "Plasma", ["activated partial thromboplastin time"]),
  item("FIBRINOGEN", "Fibrinogen", "Laboratory", "Coagulation", "Blood", "Plasma", ["fibrinogen level"]),
  item("D_DIMER", "D-dimer", "Laboratory", "Coagulation", "Blood", "Plasma", ["D dimer"]),

  item("FASTING_BLOOD_GLUCOSE", "Fasting Blood Glucose", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["FBG", "fasting glucose", "سكر صائم"]),
  item("RANDOM_BLOOD_GLUCOSE", "Random Blood Glucose", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["RBG", "random glucose", "سكر عشوائي"]),
  item("HBA1C", "HbA1c", "Laboratory", "Clinical Chemistry", "Blood", "Whole blood", ["glycated hemoglobin", "السكر التراكمي"]),
  item("OGTT_75G", "75 g Oral Glucose Tolerance Test", "Laboratory", "Clinical Chemistry", "Blood", "Plasma", ["OGTT", "GTT", "سكر الحمل"]),
  item("LIVER_FUNCTION_TESTS", "Liver Function Tests", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["LFT", "ALT", "AST", "وظائف كبد"]),
  item("ALT", "ALT", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["alanine aminotransferase", "SGPT"]),
  item("AST", "AST", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["aspartate aminotransferase", "SGOT"]),
  item("BILIRUBIN", "Serum Bilirubin", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["total bilirubin", "direct bilirubin"]),
  item("ALBUMIN", "Serum Albumin", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["albumin"]),
  item("KIDNEY_FUNCTION_TESTS", "Kidney Function Tests", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["KFT", "creatinine", "urea", "وظائف كلى"]),
  item("CREATININE", "Serum Creatinine", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["creatinine", "renal function"]),
  item("UREA", "Serum Urea", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["urea", "BUN"]),
  item("ELECTROLYTES", "Serum Electrolytes", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["sodium", "potassium", "Na", "K"]),
  item("SODIUM", "Serum Sodium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["Na", "sodium"]),
  item("POTASSIUM", "Serum Potassium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["K", "potassium"]),
  item("CALCIUM", "Serum Calcium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["calcium", "Ca"]),
  item("MAGNESIUM", "Serum Magnesium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["magnesium", "Mg"]),
  item("CRP", "C-Reactive Protein (CRP)", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["CRP", "inflammation marker"]),
  item("LIPID_PROFILE", "Lipid Profile", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["cholesterol", "triglycerides", "HDL", "LDL"]),
  item("VITAMIN_D", "Vitamin D", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["25 OH vitamin D", "فيتامين د"]),
  item("VITAMIN_B12", "Vitamin B12", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["cobalamin", "فيتامين ب12"]),
  item("FOLATE", "Serum Folate", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["folic acid", "folate"]),

  item("URINE_PREGNANCY_TEST", "Urine Pregnancy Test", "Laboratory", "Urine Analysis", "Urine", "Urine", ["UPT", "pregnancy test", "اختبار حمل بالبول"]),
  item("URINALYSIS", "Urine Routine Analysis", "Laboratory", "Urine Analysis", "Urine", "Midstream urine", ["urinalysis", "urine analysis", "تحليل بول"]),
  item("URINE_CULTURE", "Urine Culture and Sensitivity", "Laboratory", "Urine Analysis", "Urine", "Midstream urine", ["urine C&S", "مزرعة بول"]),
  item("URINE_PROTEIN_CREATININE_RATIO", "Urine Protein/Creatinine Ratio", "Laboratory", "Urine Analysis", "Urine", "Spot urine", ["PCR", "protein creatinine ratio"]),
  item("URINE_ALBUMIN_CREATININE_RATIO", "Urine Albumin/Creatinine Ratio", "Laboratory", "Urine Analysis", "Urine", "Spot urine", ["ACR", "microalbumin"]),
  item("24H_URINE_PROTEIN", "24-Hour Urine Protein", "Laboratory", "Urine Analysis", "Urine", "24-hour urine", ["24 hour protein"]),

  item("TSH", "TSH", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["thyroid stimulating hormone", "هرمون الغدة الدرقية"]),
  item("FREE_T4", "Free T4", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["FT4", "free thyroxine"]),
  item("FREE_T3", "Free T3", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["FT3", "free triiodothyronine"]),
  item("PROLACTIN", "Prolactin", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["PRL", "هرمون الحليب"]),
  item("SERUM_BETA_HCG", "Quantitative Serum Beta-hCG", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["beta hCG", "BHCG", "تحليل حمل رقمي"]),
  item("FSH", "FSH", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["follicle stimulating hormone"]),
  item("LH", "LH", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["luteinizing hormone"]),
  item("ESTRADIOL", "Estradiol (E2)", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["E2", "estradiol"]),
  item("PROGESTERONE", "Serum Progesterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["progesterone", "بروجستيرون"]),
  item("AMH", "Anti-Müllerian Hormone (AMH)", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["AMH", "ovarian reserve", "مخزون المبيض"]),
  item("TOTAL_TESTOSTERONE", "Total Testosterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["testosterone"]),
  item("FREE_TESTOSTERONE", "Free Testosterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["free testosterone"]),
  item("SHBG", "Sex Hormone-Binding Globulin (SHBG)", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["SHBG"]),
  item("DHEAS", "DHEA-S", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["DHEAS", "dehydroepiandrosterone sulfate"]),
  item("17_OH_PROGESTERONE", "17-OH Progesterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["17 hydroxyprogesterone"]),
  item("FASTING_INSULIN", "Fasting Insulin", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["insulin resistance"]),
  item("CORTISOL", "Serum Cortisol", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["cortisol"]),

  item("HBSAG", "HBsAg", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["hepatitis B surface antigen", "التهاب كبدي ب"]),
  item("HCV_ANTIBODY", "HCV Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["anti-HCV", "التهاب كبدي ج"]),
  item("HIV_AG_AB", "HIV Ag/Ab", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["HIV screening"]),
  item("VDRL_RPR", "VDRL / RPR", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["syphilis screen"]),
  item("RUBELLA_IGG", "Rubella IgG", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["rubella immunity", "مناعة الحصبة الألمانية"]),
  item("TOXOPLASMA_IGG_IGM", "Toxoplasma IgG/IgM", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["toxoplasmosis", "توكسوبلازما"]),
  item("CMV_IGG_IGM", "CMV IgG/IgM", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["cytomegalovirus", "CMV"]),
  item("VARICELLA_IGG", "Varicella IgG", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["varicella immunity"]),
  item("ANA", "Antinuclear Antibody (ANA)", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["ANA", "antinuclear antibodies"]),
  item("APS_SCREEN", "Antiphospholipid Antibody Screen", "Laboratory", "Serology and Immunology", "Blood", "Plasma/serum", ["APS", "anticardiolipin", "lupus anticoagulant"]),
  item("LUPUS_ANTICOAGULANT", "Lupus Anticoagulant", "Laboratory", "Serology and Immunology", "Blood", "Plasma", ["LA", "APS testing"]),
  item("ANTICARDIOLIPIN_ANTIBODIES", "Anticardiolipin Antibodies", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["aCL IgG IgM", "APS testing"]),
  item("BETA2_GLYCOPROTEIN_ANTIBODIES", "Beta-2 Glycoprotein I Antibodies", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["anti beta2 glycoprotein", "APS testing"]),
  item("THYROID_PEROXIDASE_ANTIBODY", "Thyroid Peroxidase Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["TPO antibody", "anti TPO"]),

  item("VAGINAL_SWAB_CULTURE", "Vaginal Swab Culture", "Laboratory", "Microbiology", "Swab", "Vaginal swab", ["high vaginal swab", "HVS", "مسحة مهبلية"]),
  item("CERVICAL_SWAB", "Cervical Swab", "Laboratory", "Microbiology", "Swab", "Cervical swab", ["endocervical swab"]),
  item("CHLAMYDIA_NAAT", "Chlamydia NAAT", "Laboratory", "Microbiology", "Swab", "Swab or urine", ["chlamydia PCR"]),
  item("GONORRHEA_NAAT", "Gonorrhea NAAT", "Laboratory", "Microbiology", "Swab", "Swab or urine", ["gonorrhoea PCR"]),
  item("TRICHOMONAS_NAAT", "Trichomonas NAAT", "Laboratory", "Microbiology", "Swab", "Vaginal swab", ["trichomonas PCR"]),
  item("GROUP_B_STREP_CULTURE", "Group B Streptococcus Culture", "Laboratory", "Microbiology", "Swab", "Vaginal/rectal swab", ["GBS screen", "group B strep"]),

  item("SEMEN_ANALYSIS", "Semen Analysis", "Laboratory", "Andrology", "Laboratory", "Semen", ["seminal analysis", "تحليل سائل منوي"]),
  item("SEMEN_CULTURE", "Semen Culture", "Laboratory", "Andrology", "Laboratory", "Semen", ["seminal culture"]),
  item("SPERM_DNA_FRAGMENTATION", "Sperm DNA Fragmentation", "Laboratory", "Andrology", "Laboratory", "Semen", ["DNA fragmentation index", "DFI"]),

  item("CA_125", "CA-125", "Laboratory", "Tumor Markers", "Blood", "Serum", ["CA 125", "ovarian tumor marker"]),
  item("CEA", "CEA", "Laboratory", "Tumor Markers", "Blood", "Serum", ["carcinoembryonic antigen"]),
  item("CA_19_9", "CA 19-9", "Laboratory", "Tumor Markers", "Blood", "Serum", ["CA19-9"]),
  item("AFP", "Alpha-Fetoprotein (AFP)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["AFP", "alpha fetoprotein"]),
  item("LDH", "Lactate Dehydrogenase (LDH)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["LDH"]),
  item("HE4", "Human Epididymis Protein 4 (HE4)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["HE4", "ovarian marker"]),
  item("INHIBIN_B", "Inhibin B", "Laboratory", "Tumor Markers", "Blood", "Serum", ["inhibin B"]),

  item("NIPT", "Non-Invasive Prenatal Testing (NIPT)", "Laboratory", "Genetics and Prenatal Screening", "Blood", "Maternal blood", ["cell free DNA", "cfDNA"]),
  item("COMBINED_FIRST_TRIMESTER_SCREEN", "Combined First-Trimester Screening", "Laboratory", "Genetics and Prenatal Screening", "Blood", "Maternal serum", ["PAPP-A", "free beta hCG", "first trimester screen"]),
  item("QUAD_SCREEN", "Second-Trimester Quadruple Screen", "Laboratory", "Genetics and Prenatal Screening", "Blood", "Maternal serum", ["quad screen", "AFP hCG estriol inhibin"]),
  item("KARYOTYPE", "Karyotype", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or tissue", ["chromosome analysis"]),
  item("THALASSEMIA_SCREEN", "Hemoglobinopathy / Thalassemia Screen", "Laboratory", "Genetics and Prenatal Screening", "Blood", "Whole blood", ["Hb electrophoresis", "thalassemia screen"]),

  item("PELVIC_ULTRASOUND", "Pelvic Ultrasound", "Imaging", "Gynecologic Ultrasound", "Ultrasound", null, ["pelvic US", "سونار حوض"]),
  item("TRANSVAGINAL_ULTRASOUND", "Transvaginal Ultrasound", "Imaging", "Gynecologic Ultrasound", "Ultrasound", null, ["TVUS", "TVS", "سونار مهبلي"]),
  item("UTERUS_4D_ULTRASOUND", "4D Uterine Ultrasound", "Imaging", "Gynecologic Ultrasound", "4D ultrasound", null, ["4D uterus"]),
  item("TRANSVAGINAL_4D_ULTRASOUND", "4D Transvaginal Ultrasound", "Imaging", "Gynecologic Ultrasound", "4D ultrasound", null, ["4D TVUS"]),
  item("SONOHYSTEROGRAPHY", "Sonohysterography", "Imaging", "Gynecologic Ultrasound", "Ultrasound", null, ["saline infusion sonography", "SIS"]),
  item("FOLLICULOMETRY", "Follicular Monitoring", "Imaging", "Fertility Ultrasound", "Ultrasound", null, ["folliculometry", "follicle tracking", "متابعة تبويض"]),
  item("ANTRAL_FOLLICLE_COUNT", "Antral Follicle Count Ultrasound", "Imaging", "Fertility Ultrasound", "Ultrasound", null, ["AFC", "ovarian reserve ultrasound"]),
  item("EARLY_PREGNANCY_SCAN", "Early Pregnancy Ultrasound", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["viability scan", "سونار حمل مبكر"]),
  item("DATING_SCAN", "Pregnancy Dating Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["dating ultrasound"]),
  item("NUCHAL_TRANSLUCENCY_SCAN", "Nuchal Translucency Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["NT scan"]),
  item("ANOMALY_SCAN", "Detailed Anomaly Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["anatomy scan", "تفصيلي للجنين"]),
  item("FETAL_GROWTH_SCAN", "Fetal Growth Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["growth scan", "سونار نمو الجنين"]),
  item("DOPPLER_ULTRASOUND", "Obstetric Doppler Ultrasound", "Imaging", "Obstetric Ultrasound", "Doppler ultrasound", null, ["fetal Doppler"]),
  item("BIOPHYSICAL_PROFILE", "Biophysical Profile", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["BPP"]),
  item("CERVICAL_LENGTH_SCAN", "Cervical Length Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["cervical length", "طول عنق الرحم"]),
  item("FETAL_MEDICINE_ULTRASOUND", "Fetal Medicine Ultrasound Assessment", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["fetal medicine scan"]),
  item("MAMMOGRAPHY", "Mammography", "Imaging", "Breast Imaging", "Mammography", null, ["mammogram", "ماموجرام"]),
  item("BREAST_ULTRASOUND", "Breast Ultrasound", "Imaging", "Breast Imaging", "Ultrasound", null, ["breast US", "سونار ثدي"]),
  item("BREAST_MRI", "Breast MRI", "Imaging", "MRI", "MRI", null, ["MRI breast"]),
  item("PELVIC_MRI", "Pelvic MRI", "Imaging", "MRI", "MRI", null, ["MRI pelvis", "رنين حوض"]),
  item("CT_ABDOMEN_PELVIS", "CT Abdomen and Pelvis", "Imaging", "CT", "CT", null, ["CT abdomen pelvis"]),
  item("XRAY_PELVIS", "Pelvic X-ray", "Imaging", "X-ray and Fluoroscopy", "X-ray", null, ["x ray pelvis"]),
  item("CHEST_XRAY", "Chest X-ray", "Imaging", "X-ray and Fluoroscopy", "X-ray", null, ["CXR", "أشعة صدر"]),
  item("HYSTEROSALPINGOGRAPHY", "Hysterosalpingography", "Imaging", "X-ray and Fluoroscopy", "Fluoroscopy", null, ["HSG", "أشعة صبغة على الرحم والأنابيب"]),

  item("PAP_SMEAR", "Pap Smear / Cervical Cytology", "Pathology", "Cytology", "Cytology", "Cervical sample", ["Pap test", "cervical smear", "مسحة عنق الرحم"]),
  item("ENDOMETRIAL_CYTOLOGY", "Endometrial Cytology", "Pathology", "Cytology", "Cytology", "Endometrial sample", ["endometrial cytology"]),
  item("HPV_DNA_TEST", "HPV DNA Test", "Pathology", "Molecular Pathology", "Molecular pathology", "Cervical sample", ["HPV test", "human papillomavirus"]),
  item("ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY", "Endometrial Biopsy Histopathology", "Pathology", "Histopathology", "Histopathology", "Endometrial tissue", ["endometrial biopsy", "عينة بطانة الرحم"]),
  item("PRODUCTS_OF_CONCEPTION_HISTOPATHOLOGY", "Products of Conception Histopathology", "Pathology", "Histopathology", "Histopathology", "Tissue", ["POC histology"]),
  item("HISTOPATHOLOGY_REPORT", "Histopathology Review", "Pathology", "Histopathology", "Histopathology", "Tissue/slides", ["pathology review"]),

  item("ECG", "Electrocardiogram (ECG)", "Cardiac and Functional Tests", "Cardiac Testing", "ECG", null, ["EKG", "رسم قلب"]),
  item("ECHOCARDIOGRAPHY", "Echocardiography", "Cardiac and Functional Tests", "Echocardiography", "Echocardiography", null, ["echo"]),
  item("FETAL_ECHOCARDIOGRAPHY_REFERRAL", "Fetal Echocardiography", "Cardiac and Functional Tests", "Fetal Cardiology", "Echocardiography", null, ["fetal echo"]),
  item("HOLTER_MONITORING", "Holter Monitoring", "Cardiac and Functional Tests", "Cardiac Testing", "Ambulatory ECG", null, ["Holter ECG"]),

  item("ANESTHESIA_ASSESSMENT", "Anesthesia Assessment", "Procedures and Referrals", "Preoperative Assessment", "Clinical assessment", null, ["pre-anaesthetic review"]),
  item("MEDICAL_FITNESS_ASSESSMENT", "Medical Fitness / Preoperative Assessment", "Procedures and Referrals", "Preoperative Assessment", "Clinical assessment", null, ["medical clearance"]),
  item("FETAL_MEDICINE_REFERRAL", "Fetal Medicine Specialist Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["fetal medicine referral"]),
  item("BREAST_SURGERY_REFERRAL", "Breast Surgery Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["breast surgeon opinion"]),
  item("VASCULAR_SURGERY_OPINION", "Vascular Surgery Opinion", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["vascular opinion"]),
  item("VARICOSE_VEINS_VASCULAR_ASSESSMENT", "Varicose Veins Vascular Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["venous Doppler referral"])
];

async function seedInvestigationCatalog(prisma) {
  if (!prisma.investigationCatalogItem) {
    console.warn("WARN InvestigationCatalogItem model is not available; skipping investigation catalog seed.");
    return { skipped: true, count: 0 };
  }

  let sortOrder = 10;
  for (const entry of investigationCatalogItems) {
    const data = {
      name: entry.name,
      normalizedName: normalizeName(entry.name),
      category: entry.category,
      subcategory: entry.subcategory,
      clinicalGroup: entry.subcategory,
      aliasesJson: entry.aliases,
      keywordsJson: Array.from(new Set([entry.name, entry.code, entry.category, entry.subcategory, ...entry.aliases].filter(Boolean))),
      tagsJson: Array.from(new Set([entry.category, entry.subcategory, entry.discipline, entry.modality].filter(Boolean))),
      discipline: entry.category,
      modality: entry.modality,
      sampleType: entry.sampleType,
      specialty: "Obstetrics and Gynecology",
      active: true,
      sortOrder
    };
    await prisma.investigationCatalogItem.upsert({
      where: { code: entry.code },
      update: data,
      create: { code: entry.code, ...data }
    });
    sortOrder += 10;
  }

  const activeItems = await prisma.investigationCatalogItem.findMany({ where: { active: true } });
  for (const existing of activeItems) {
    const taxonomy = canonicalTaxonomy(existing);
    if (taxonomy.category === existing.category && taxonomy.subcategory === existing.subcategory) continue;
    const tags = Array.isArray(existing.tagsJson) ? existing.tagsJson.filter((value) => typeof value === "string") : [];
    await prisma.investigationCatalogItem.update({
      where: { id: existing.id },
      data: {
        category: taxonomy.category,
        subcategory: taxonomy.subcategory,
        clinicalGroup: taxonomy.subcategory,
        discipline: taxonomy.category,
        tagsJson: Array.from(new Set([...tags, existing.category, existing.subcategory, taxonomy.category, taxonomy.subcategory].filter(Boolean)))
      }
    });
  }

  return { skipped: false, count: investigationCatalogItems.length };
}

function canonicalTaxonomy(entry) {
  const key = normalizeName([entry.category, entry.subcategory, entry.name, entry.modality].filter(Boolean).join(" "));
  if (/cytology|histopath|pathology|pap|hpv/.test(key)) {
    return { category: "Pathology", subcategory: /histopath|biopsy|tissue/.test(key) ? "Histopathology" : /molecular|hpv/.test(key) ? "Molecular Pathology" : "Cytology" };
  }
  if (/ultrasound|sonograph|radiology|imaging|mri|ct |x ray|xray|mammograph|fluoroscop|hsg/.test(key)) {
    if (/obstetric|pregnancy|fetal|nuchal|anomaly|growth|cervical length/.test(key)) return { category: "Imaging", subcategory: "Obstetric Ultrasound" };
    if (/fertility|infertil|follic/.test(key)) return { category: "Imaging", subcategory: "Fertility Ultrasound" };
    if (/gynec|pelvic ultrasound|transvaginal|uterine|sonohyst/.test(key)) return { category: "Imaging", subcategory: "Gynecologic Ultrasound" };
    if (/breast|mammograph/.test(key)) return { category: "Imaging", subcategory: "Breast Imaging" };
    if (/mri/.test(key)) return { category: "Imaging", subcategory: "MRI" };
    if (/ct /.test(`${key} `)) return { category: "Imaging", subcategory: "CT" };
    if (/x ray|xray|fluoroscop|hsg/.test(key)) return { category: "Imaging", subcategory: "X-ray and Fluoroscopy" };
    return { category: "Imaging", subcategory: entry.subcategory || "General Imaging" };
  }
  if (/cardiac|cardio|ecg|echo|holter/.test(key)) return { category: "Cardiac and Functional Tests", subcategory: entry.subcategory || "Cardiac Testing" };
  if (/referral|specialist|assessment|preoperative|anaesth|anesth|medical clearance/.test(key)) return { category: "Procedures and Referrals", subcategory: entry.subcategory || "Specialist Assessment" };
  if (/microbiology|culture|swab|naat|pcr|group b strep/.test(key)) return { category: "Laboratory", subcategory: "Microbiology" };
  if (/prenatal|nipt|karyotype|genetic|quad screen|thalassemia|hemoglobinopathy/.test(key)) return { category: "Laboratory", subcategory: "Genetics and Prenatal Screening" };
  if (/serology|infectious|antenatal screening|immunology|antibody|hiv|hbsag|hcv|rubella|toxoplas|cmv|vdrl|rpr|varicella/.test(key)) return { category: "Laboratory", subcategory: "Serology and Immunology" };
  if (/coag|inr|aptt|fibrin|d dimer/.test(key)) return { category: "Laboratory", subcategory: "Coagulation" };
  if (/hormone|endocr|tsh|prolact|amh|testosterone|estradiol|progesterone|fsh|lh|insulin|cortisol/.test(key)) return { category: "Laboratory", subcategory: "Endocrinology and Reproductive Hormones" };
  if (/urine|urinal/.test(key)) return { category: "Laboratory", subcategory: "Urine Analysis" };
  if (/hemat|blood count|cbc|platelet|ferritin|iron|hemoglobin|reticulocyte|blood film|esr/.test(key)) return { category: "Laboratory", subcategory: "Hematology" };
  if (/tumor|ca 125|ca 19|cea|afp|he4|inhibin/.test(key)) return { category: "Laboratory", subcategory: "Tumor Markers" };
  if (/andrology|semen|sperm/.test(key)) return { category: "Laboratory", subcategory: "Andrology" };
  if (/laboratory| lab |biochem|chemistry|glucose|liver|kidney|electrolyte|vitamin|creatinine|urea|albumin|bilirubin|crp|lipid|folate|calcium|magnesium/.test(` ${key} `)) return { category: "Laboratory", subcategory: "Clinical Chemistry" };
  if (entry.category === "Other") return { category: "Procedures and Referrals", subcategory: entry.subcategory || "Specialist Assessment" };
  return { category: entry.category || "Other", subcategory: entry.subcategory || "Uncategorized" };
}

function item(code, name, category, subcategory, modality, sampleType, aliases = []) {
  return {
    code,
    name,
    category,
    subcategory,
    discipline: category,
    modality,
    sampleType,
    aliases: Array.from(new Set([name, code.replaceAll("_", " "), ...aliases]))
  };
}

function normalizeName(value) {
  return String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

module.exports = {
  investigationCatalogItems,
  seedInvestigationCatalog
};
