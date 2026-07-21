const investigationCatalogItems = [
  item("CBC", "Complete Blood Count (CBC)", "Laboratory", "Hematology", "Blood", "Whole blood", ["CBC", "complete blood picture", "صورة دم كاملة"]),
  item("PLATELET_COUNT", "Platelet Count", "Laboratory", "Hematology", "Blood", "Whole blood", ["platelets", "PLT", "الصفائح الدموية"]),
  item("BLOOD_GROUP_RH", "Blood Group and Rh", "Laboratory", "Hematology", "Blood", "Whole blood", ["ABO", "Rh factor", "فصيلة الدم"]),
  item("ANTIBODY_SCREEN", "Red Cell Antibody Screen", "Laboratory", "Hematology", "Blood", "Serum", ["indirect Coombs", "antibody screen"]),
  item("FERRITIN", "Ferritin", "Laboratory", "Hematology", "Blood", "Serum", ["iron stores", "مخزون الحديد"]),
  item("SERUM_IRON", "Serum Iron", "Laboratory", "Hematology", "Blood", "Serum", ["iron", "حديد بالدم"]),
  item("TIBC", "Total Iron-Binding Capacity (TIBC)", "Laboratory", "Hematology", "Blood", "Serum", ["TIBC", "iron binding capacity"]),
  item("COAGULATION_PROFILE", "Coagulation Profile", "Laboratory", "Hematology", "Blood", "Plasma", ["PT", "INR", "aPTT", "سيولة الدم"]),

  item("FASTING_BLOOD_GLUCOSE", "Fasting Blood Glucose", "Laboratory", "Biochemistry", "Blood", "Serum", ["FBG", "fasting glucose", "سكر صائم"]),
  item("RANDOM_BLOOD_GLUCOSE", "Random Blood Glucose", "Laboratory", "Biochemistry", "Blood", "Serum", ["RBG", "random glucose", "سكر عشوائي"]),
  item("HBA1C", "HbA1c", "Laboratory", "Biochemistry", "Blood", "Whole blood", ["glycated hemoglobin", "السكر التراكمي"]),
  item("LIVER_FUNCTION_TESTS", "Liver Function Tests", "Laboratory", "Biochemistry", "Blood", "Serum", ["LFT", "ALT", "AST", "وظائف كبد"]),
  item("KIDNEY_FUNCTION_TESTS", "Kidney Function Tests", "Laboratory", "Biochemistry", "Blood", "Serum", ["KFT", "creatinine", "urea", "وظائف كلى"]),
  item("ELECTROLYTES", "Serum Electrolytes", "Laboratory", "Biochemistry", "Blood", "Serum", ["sodium", "potassium", "Na", "K"]),
  item("VITAMIN_D", "Vitamin D", "Laboratory", "Biochemistry", "Blood", "Serum", ["25 OH vitamin D", "فيتامين د"]),
  item("VITAMIN_B12", "Vitamin B12", "Laboratory", "Biochemistry", "Blood", "Serum", ["cobalamin", "فيتامين ب12"]),

  item("URINE_PREGNANCY_TEST", "Urine Pregnancy Test", "Laboratory", "Urine Analysis", "Urine", "Urine", ["UPT", "pregnancy test", "اختبار حمل بالبول"]),
  item("URINALYSIS", "Urine Routine Analysis", "Laboratory", "Urine Analysis", "Urine", "Midstream urine", ["urinalysis", "urine analysis", "تحليل بول"]),
  item("URINE_CULTURE", "Urine Culture and Sensitivity", "Laboratory", "Urine Analysis", "Urine", "Midstream urine", ["urine C&S", "مزرعة بول"]),

  item("TSH", "TSH", "Laboratory", "Hormones", "Blood", "Serum", ["thyroid stimulating hormone", "هرمون الغدة الدرقية"]),
  item("FREE_T4", "Free T4", "Laboratory", "Hormones", "Blood", "Serum", ["FT4", "free thyroxine"]),
  item("PROLACTIN", "Prolactin", "Laboratory", "Hormones", "Blood", "Serum", ["PRL", "هرمون الحليب"]),
  item("SERUM_BETA_HCG", "Quantitative Serum Beta-hCG", "Laboratory", "Hormones", "Blood", "Serum", ["beta hCG", "BHCG", "تحليل حمل رقمي"]),
  item("FSH", "FSH", "Laboratory", "Hormones", "Blood", "Serum", ["follicle stimulating hormone"]),
  item("LH", "LH", "Laboratory", "Hormones", "Blood", "Serum", ["luteinizing hormone"]),
  item("ESTRADIOL", "Estradiol (E2)", "Laboratory", "Hormones", "Blood", "Serum", ["E2", "estradiol"]),
  item("PROGESTERONE", "Serum Progesterone", "Laboratory", "Hormones", "Blood", "Serum", ["progesterone", "بروجستيرون"]),
  item("AMH", "Anti-Müllerian Hormone (AMH)", "Laboratory", "Hormones", "Blood", "Serum", ["AMH", "ovarian reserve", "مخزون المبيض"]),
  item("TOTAL_TESTOSTERONE", "Total Testosterone", "Laboratory", "Hormones", "Blood", "Serum", ["testosterone"]),
  item("FREE_TESTOSTERONE", "Free Testosterone", "Laboratory", "Hormones", "Blood", "Serum", ["free testosterone"]),
  item("DHEAS", "DHEA-S", "Laboratory", "Hormones", "Blood", "Serum", ["DHEAS", "dehydroepiandrosterone sulfate"]),
  item("17_OH_PROGESTERONE", "17-OH Progesterone", "Laboratory", "Hormones", "Blood", "Serum", ["17 hydroxyprogesterone"]),

  item("HBSAG", "HBsAg", "Laboratory", "Serology", "Blood", "Serum", ["hepatitis B surface antigen", "التهاب كبدي ب"]),
  item("HCV_ANTIBODY", "HCV Antibody", "Laboratory", "Serology", "Blood", "Serum", ["anti-HCV", "التهاب كبدي ج"]),
  item("HIV_AG_AB", "HIV Ag/Ab", "Laboratory", "Serology", "Blood", "Serum", ["HIV screening"]),
  item("VDRL_RPR", "VDRL / RPR", "Laboratory", "Serology", "Blood", "Serum", ["syphilis screen"]),
  item("RUBELLA_IGG", "Rubella IgG", "Laboratory", "Serology", "Blood", "Serum", ["rubella immunity", "مناعة الحصبة الألمانية"]),
  item("TOXOPLASMA_IGG_IGM", "Toxoplasma IgG/IgM", "Laboratory", "Serology", "Blood", "Serum", ["toxoplasmosis", "توكسوبلازما"]),
  item("CMV_IGG_IGM", "CMV IgG/IgM", "Laboratory", "Serology", "Blood", "Serum", ["cytomegalovirus", "CMV"]),

  item("VAGINAL_SWAB_CULTURE", "Vaginal Swab Culture", "Laboratory", "Microbiology", "Swab", "Vaginal swab", ["high vaginal swab", "HVS", "مسحة مهبلية"]),
  item("CERVICAL_SWAB", "Cervical Swab", "Laboratory", "Microbiology", "Swab", "Cervical swab", ["endocervical swab"]),
  item("CHLAMYDIA_NAAT", "Chlamydia NAAT", "Laboratory", "Microbiology", "Swab", "Swab or urine", ["chlamydia PCR"]),
  item("GONORRHEA_NAAT", "Gonorrhea NAAT", "Laboratory", "Microbiology", "Swab", "Swab or urine", ["gonorrhoea PCR"]),
  item("SEMEN_ANALYSIS", "Semen Analysis", "Laboratory", "Andrology", "Laboratory", "Semen", ["seminal analysis", "تحليل سائل منوي"]),

  item("APS_SCREEN", "Antiphospholipid Antibody Screen", "Laboratory", "Immunology", "Blood", "Plasma/serum", ["APS", "anticardiolipin", "lupus anticoagulant"]),
  item("ANA", "Antinuclear Antibody (ANA)", "Laboratory", "Immunology", "Blood", "Serum", ["ANA", "antinuclear antibodies"]),

  item("CA_125", "CA-125", "Laboratory", "Tumor Markers", "Blood", "Serum", ["CA 125", "ovarian tumor marker"]),
  item("CEA", "CEA", "Laboratory", "Tumor Markers", "Blood", "Serum", ["carcinoembryonic antigen"]),
  item("CA_19_9", "CA 19-9", "Laboratory", "Tumor Markers", "Blood", "Serum", ["CA19-9"]),
  item("AFP", "Alpha-Fetoprotein (AFP)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["AFP", "alpha fetoprotein"]),
  item("LDH", "Lactate Dehydrogenase (LDH)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["LDH"]),
  item("HE4", "Human Epididymis Protein 4 (HE4)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["HE4", "ovarian marker"]),

  item("PELVIC_ULTRASOUND", "Pelvic Ultrasound", "Ultrasound", "Gynecology", "Ultrasound", null, ["pelvic US", "سونار حوض"]),
  item("TRANSVAGINAL_ULTRASOUND", "Transvaginal Ultrasound", "Ultrasound", "Gynecology", "Ultrasound", null, ["TVUS", "TVS", "سونار مهبلي"]),
  item("UTERUS_4D_ULTRASOUND", "4D Uterine Ultrasound", "Ultrasound", "Gynecology", "4D ultrasound", null, ["4D uterus"]),
  item("TRANSVAGINAL_4D_ULTRASOUND", "4D Transvaginal Ultrasound", "Ultrasound", "Gynecology", "4D ultrasound", null, ["4D TVUS"]),
  item("FOLLICULOMETRY", "Follicular Monitoring", "Ultrasound", "Infertility", "Ultrasound", null, ["folliculometry", "follicle tracking", "متابعة تبويض"]),
  item("SONOHYSTEROGRAPHY", "Sonohysterography", "Ultrasound", "Gynecology", "Ultrasound", null, ["saline infusion sonography", "SIS"]),
  item("EARLY_PREGNANCY_SCAN", "Early Pregnancy Ultrasound", "Ultrasound", "Obstetric", "Ultrasound", null, ["viability scan", "سونار حمل مبكر"]),
  item("DATING_SCAN", "Pregnancy Dating Scan", "Ultrasound", "Obstetric", "Ultrasound", null, ["dating ultrasound"]),
  item("NUCHAL_TRANSLUCENCY_SCAN", "Nuchal Translucency Scan", "Ultrasound", "Obstetric", "Ultrasound", null, ["NT scan"]),
  item("ANOMALY_SCAN", "Detailed Anomaly Scan", "Ultrasound", "Obstetric", "Ultrasound", null, ["anatomy scan", "تفصيلي للجنين"]),
  item("FETAL_GROWTH_SCAN", "Fetal Growth Scan", "Ultrasound", "Obstetric", "Ultrasound", null, ["growth scan", "سونار نمو الجنين"]),
  item("DOPPLER_ULTRASOUND", "Obstetric Doppler Ultrasound", "Ultrasound", "Obstetric", "Doppler ultrasound", null, ["fetal Doppler"]),
  item("BIOPHYSICAL_PROFILE", "Biophysical Profile", "Ultrasound", "Obstetric", "Ultrasound", null, ["BPP"]),
  item("CERVICAL_LENGTH_SCAN", "Cervical Length Scan", "Ultrasound", "Obstetric", "Ultrasound", null, ["cervical length", "طول عنق الرحم"]),

  item("MAMMOGRAPHY", "Mammography", "Radiology", "Breast Imaging", "Mammography", null, ["mammogram", "ماموجرام"]),
  item("BREAST_ULTRASOUND", "Breast Ultrasound", "Radiology", "Breast Imaging", "Ultrasound", null, ["breast US", "سونار ثدي"]),
  item("PELVIC_MRI", "Pelvic MRI", "Radiology", "Cross-sectional Imaging", "MRI", null, ["MRI pelvis", "رنين حوض"]),
  item("CT_ABDOMEN_PELVIS", "CT Abdomen and Pelvis", "Radiology", "Cross-sectional Imaging", "CT", null, ["CT abdomen pelvis"]),
  item("XRAY_PELVIS", "Pelvic X-ray", "Radiology", "Plain Radiography", "X-ray", null, ["x ray pelvis"]),
  item("CHEST_XRAY", "Chest X-ray", "Radiology", "Plain Radiography", "X-ray", null, ["CXR", "أشعة صدر"]),
  item("HYSTEROSALPINGOGRAPHY", "Hysterosalpingography", "Radiology", "Fluoroscopy", "Fluoroscopy", null, ["HSG", "أشعة صبغة على الرحم والأنابيب"]),

  item("PAP_SMEAR", "Pap Smear / Cervical Cytology", "Pathology", "Cytology", "Cytology", "Cervical sample", ["Pap test", "cervical smear", "مسحة عنق الرحم"]),
  item("HPV_DNA_TEST", "HPV DNA Test", "Pathology", "Cytology", "Molecular pathology", "Cervical sample", ["HPV test", "human papillomavirus"]),
  item("ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY", "Endometrial Biopsy Histopathology", "Pathology", "Histopathology", "Histopathology", "Endometrial tissue", ["endometrial biopsy", "عينة بطانة الرحم"]),
  item("HISTOPATHOLOGY_REPORT", "Histopathology Review", "Pathology", "Histopathology", "Histopathology", "Tissue/slides", ["pathology review"]),

  item("ECG", "Electrocardiogram (ECG)", "Cardiology", "Cardiac Testing", "ECG", null, ["EKG", "رسم قلب"]),
  item("FETAL_ECHOCARDIOGRAPHY_REFERRAL", "Fetal Echocardiography", "Cardiology", "Fetal Cardiology", "Echocardiography", null, ["fetal echo"]),

  item("ANESTHESIA_ASSESSMENT", "Anesthesia Assessment", "Other", "Preoperative Assessment", "Clinical assessment", null, ["pre-anaesthetic review"]),
  item("CARDIOLOGY_CLEARANCE", "Cardiology Clearance", "Other", "Specialist Review", "Specialist report", null, ["cardiac clearance"]),
  item("GENERAL_SURGERY_OPINION", "General Surgery Opinion", "Other", "Specialist Review", "Specialist report", null, ["surgical opinion"]),
  item("VASCULAR_SURGERY_OPINION", "Vascular Surgery Opinion", "Other", "Specialist Review", "Specialist report", null, ["vascular opinion"]),
  item("VARICOSE_VEINS_VASCULAR_ASSESSMENT", "Varicose Veins Vascular Assessment", "Other", "Specialist Review", "Specialist report", null, ["venous Doppler referral"])
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
      discipline: entry.discipline,
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

  return { skipped: false, count: investigationCatalogItems.length };
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
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

module.exports = {
  investigationCatalogItems,
  seedInvestigationCatalog
};