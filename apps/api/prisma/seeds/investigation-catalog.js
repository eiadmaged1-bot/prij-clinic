const investigationCatalogItems = [
  // Laboratory — Hematology
  item("CBC", "Complete Blood Count (CBC)", "Laboratory", "Hematology", "Blood", "Whole blood", ["CBC", "complete blood picture", "صورة دم كاملة"]),
  item("CBC_DIFFERENTIAL", "CBC with Differential Count", "Laboratory", "Hematology", "Blood", "Whole blood", ["CBC diff", "differential leukocyte count"]),
  item("HEMOGLOBIN", "Hemoglobin", "Laboratory", "Hematology", "Blood", "Whole blood", ["Hb", "haemoglobin", "هيموجلوبين"]),
  item("HEMATOCRIT", "Hematocrit", "Laboratory", "Hematology", "Blood", "Whole blood", ["Hct", "PCV", "packed cell volume"]),
  item("RBC_INDICES", "Red Cell Indices", "Laboratory", "Hematology", "Blood", "Whole blood", ["MCV", "MCH", "MCHC", "RDW"]),
  item("WBC_COUNT", "White Blood Cell Count", "Laboratory", "Hematology", "Blood", "Whole blood", ["WBC", "TLC", "white cell count"]),
  item("PLATELET_COUNT", "Platelet Count", "Laboratory", "Hematology", "Blood", "Whole blood", ["platelets", "PLT", "الصفائح الدموية"]),
  item("BLOOD_FILM", "Peripheral Blood Film", "Laboratory", "Hematology", "Blood", "Whole blood", ["blood smear", "peripheral smear"]),
  item("RETICULOCYTE_COUNT", "Reticulocyte Count", "Laboratory", "Hematology", "Blood", "Whole blood", ["retics"]),
  item("BLOOD_GROUP_RH", "Blood Group and Rh", "Laboratory", "Hematology", "Blood", "Whole blood", ["ABO", "Rh factor", "فصيلة الدم"]),
  item("TYPE_AND_SCREEN", "Blood Type and Antibody Screen", "Laboratory", "Hematology", "Blood", "Whole blood / serum", ["type and screen", "group and screen"]),
  item("CROSSMATCH", "Blood Crossmatch", "Laboratory", "Hematology", "Blood", "Whole blood / serum", ["cross match", "blood compatibility"]),
  item("ANTIBODY_SCREEN", "Red Cell Antibody Screen", "Laboratory", "Hematology", "Blood", "Serum", ["indirect Coombs", "antibody screen"]),
  item("DIRECT_COOMBS", "Direct Antiglobulin Test", "Laboratory", "Hematology", "Blood", "Whole blood", ["direct Coombs", "DAT"]),
  item("FERRITIN", "Ferritin", "Laboratory", "Hematology", "Blood", "Serum", ["iron stores", "مخزون الحديد"]),
  item("SERUM_IRON", "Serum Iron", "Laboratory", "Hematology", "Blood", "Serum", ["iron", "حديد بالدم"]),
  item("TIBC", "Total Iron-Binding Capacity (TIBC)", "Laboratory", "Hematology", "Blood", "Serum", ["TIBC", "iron binding capacity"]),
  item("TRANSFERRIN", "Transferrin", "Laboratory", "Hematology", "Blood", "Serum", ["serum transferrin"]),
  item("TRANSFERRIN_SATURATION", "Transferrin Saturation", "Laboratory", "Hematology", "Blood", "Serum", ["TSAT"]),
  item("HEMOGLOBIN_ELECTROPHORESIS", "Hemoglobin Electrophoresis", "Laboratory", "Hematology", "Blood", "Whole blood", ["Hb electrophoresis", "hemoglobinopathy testing"]),
  item("SICKLING_TEST", "Sickling Test", "Laboratory", "Hematology", "Blood", "Whole blood", ["sickle screen"]),
  item("G6PD_ASSAY", "G6PD Assay", "Laboratory", "Hematology", "Blood", "Whole blood", ["G6PD level", "glucose-6-phosphate dehydrogenase"]),
  item("ESR", "Erythrocyte Sedimentation Rate (ESR)", "Laboratory", "Hematology", "Blood", "Whole blood", ["ESR"]),

  // Laboratory — Coagulation and thrombosis
  item("COAGULATION_PROFILE", "Coagulation Profile", "Laboratory", "Coagulation", "Blood", "Plasma", ["PT", "INR", "aPTT", "سيولة الدم"]),
  item("PT_INR", "PT / INR", "Laboratory", "Coagulation", "Blood", "Plasma", ["prothrombin time", "INR"]),
  item("APTT", "aPTT", "Laboratory", "Coagulation", "Blood", "Plasma", ["activated partial thromboplastin time"]),
  item("THROMBIN_TIME", "Thrombin Time", "Laboratory", "Coagulation", "Blood", "Plasma", ["TT", "thrombin clotting time"]),
  item("FIBRINOGEN", "Fibrinogen", "Laboratory", "Coagulation", "Blood", "Plasma", ["fibrinogen level"]),
  item("D_DIMER", "D-dimer", "Laboratory", "Coagulation", "Blood", "Plasma", ["D dimer"]),
  item("COAGULATION_MIXING_STUDY", "Coagulation Mixing Study", "Laboratory", "Coagulation", "Blood", "Plasma", ["mixing test", "factor inhibitor screen"]),
  item("ANTI_XA_LEVEL", "Anti-Xa Level", "Laboratory", "Coagulation", "Blood", "Plasma", ["anti factor Xa", "heparin monitoring"]),
  item("VON_WILLEBRAND_PANEL", "von Willebrand Disease Panel", "Laboratory", "Coagulation", "Blood", "Plasma", ["vWF antigen", "vWF activity", "ristocetin cofactor"]),
  item("FACTOR_VIII_ASSAY", "Factor VIII Assay", "Laboratory", "Coagulation", "Blood", "Plasma", ["factor 8 activity"]),
  item("FACTOR_IX_ASSAY", "Factor IX Assay", "Laboratory", "Coagulation", "Blood", "Plasma", ["factor 9 activity"]),
  item("FACTOR_XI_ASSAY", "Factor XI Assay", "Laboratory", "Coagulation", "Blood", "Plasma", ["factor 11 activity"]),
  item("PROTEIN_C_ACTIVITY", "Protein C Activity", "Laboratory", "Coagulation", "Blood", "Plasma", ["protein C"]),
  item("PROTEIN_S_ACTIVITY", "Protein S Activity", "Laboratory", "Coagulation", "Blood", "Plasma", ["free protein S", "protein S"]),
  item("ANTITHROMBIN_III", "Antithrombin Activity", "Laboratory", "Coagulation", "Blood", "Plasma", ["antithrombin III", "ATIII"]),
  item("THROMBOPHILIA_SCREEN", "Thrombophilia Screen", "Laboratory", "Coagulation", "Blood", "Plasma / whole blood", ["thrombophilia panel", "VTE screen"]),

  // Laboratory — Clinical chemistry
  item("FASTING_BLOOD_GLUCOSE", "Fasting Blood Glucose", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["FBG", "fasting glucose", "سكر صائم"]),
  item("RANDOM_BLOOD_GLUCOSE", "Random Blood Glucose", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["RBG", "random glucose", "سكر عشوائي"]),
  item("HBA1C", "HbA1c", "Laboratory", "Clinical Chemistry", "Blood", "Whole blood", ["glycated hemoglobin", "السكر التراكمي"]),
  item("OGTT_75G", "75 g Oral Glucose Tolerance Test", "Laboratory", "Clinical Chemistry", "Blood", "Plasma", ["OGTT", "GTT", "سكر الحمل"]),
  item("OGTT_FASTING", "OGTT Fasting Glucose", "Laboratory", "Clinical Chemistry", "Blood", "Plasma", ["GTT fasting"]),
  item("OGTT_1_HOUR", "OGTT 1-Hour Glucose", "Laboratory", "Clinical Chemistry", "Blood", "Plasma", ["GTT one hour"]),
  item("OGTT_2_HOUR", "OGTT 2-Hour Glucose", "Laboratory", "Clinical Chemistry", "Blood", "Plasma", ["GTT two hour"]),
  item("LIVER_FUNCTION_TESTS", "Liver Function Tests", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["LFT", "ALT", "AST", "وظائف كبد"]),
  item("ALT", "ALT", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["alanine aminotransferase", "SGPT"]),
  item("AST", "AST", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["aspartate aminotransferase", "SGOT"]),
  item("ALKALINE_PHOSPHATASE", "Alkaline Phosphatase", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["ALP"]),
  item("GGT", "Gamma-Glutamyl Transferase", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["GGT", "gamma GT"]),
  item("BILIRUBIN", "Serum Bilirubin", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["total bilirubin", "direct bilirubin"]),
  item("ALBUMIN", "Serum Albumin", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["albumin"]),
  item("TOTAL_PROTEIN", "Total Serum Protein", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["total protein"]),
  item("KIDNEY_FUNCTION_TESTS", "Kidney Function Tests", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["KFT", "creatinine", "urea", "وظائف كلى"]),
  item("CREATININE", "Serum Creatinine", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["creatinine", "renal function"]),
  item("UREA", "Serum Urea", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["urea", "BUN"]),
  item("URIC_ACID", "Serum Uric Acid", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["uric acid", "urate"]),
  item("ELECTROLYTES", "Serum Electrolytes", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["sodium", "potassium", "Na", "K"]),
  item("SODIUM", "Serum Sodium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["Na", "sodium"]),
  item("POTASSIUM", "Serum Potassium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["K", "potassium"]),
  item("CHLORIDE", "Serum Chloride", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["Cl", "chloride"]),
  item("BICARBONATE", "Serum Bicarbonate", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["HCO3", "total CO2"]),
  item("CALCIUM", "Serum Calcium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["calcium", "Ca"]),
  item("IONIZED_CALCIUM", "Ionized Calcium", "Laboratory", "Clinical Chemistry", "Blood", "Whole blood", ["free calcium"]),
  item("MAGNESIUM", "Serum Magnesium", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["magnesium", "Mg"]),
  item("PHOSPHATE", "Serum Phosphate", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["phosphorus", "PO4"]),
  item("CRP", "C-Reactive Protein (CRP)", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["CRP", "inflammation marker"]),
  item("LIPID_PROFILE", "Lipid Profile", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["cholesterol", "triglycerides", "HDL", "LDL"]),
  item("VITAMIN_D", "Vitamin D", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["25 OH vitamin D", "فيتامين د"]),
  item("VITAMIN_B12", "Vitamin B12", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["cobalamin", "فيتامين ب12"]),
  item("FOLATE", "Serum Folate", "Laboratory", "Clinical Chemistry", "Blood", "Serum", ["folic acid", "folate"]),

  // Laboratory — Urine analysis
  item("URINALYSIS", "Urine Routine Analysis", "Laboratory", "Urine Analysis", "Urine", "Midstream urine", ["urinalysis", "urine analysis", "تحليل بول"]),
  item("URINE_MICROSCOPY", "Urine Microscopy", "Laboratory", "Urine Analysis", "Urine", "Midstream urine", ["urine sediment", "pus cells", "RBCs in urine"]),
  item("URINE_PREGNANCY_TEST", "Urine Pregnancy Test", "Laboratory", "Urine Analysis", "Urine", "Urine", ["UPT", "pregnancy test", "اختبار حمل بالبول"]),
  item("URINE_PROTEIN_CREATININE_RATIO", "Urine Protein/Creatinine Ratio", "Laboratory", "Urine Analysis", "Urine", "Spot urine", ["PCR", "protein creatinine ratio"]),
  item("URINE_ALBUMIN_CREATININE_RATIO", "Urine Albumin/Creatinine Ratio", "Laboratory", "Urine Analysis", "Urine", "Spot urine", ["ACR", "microalbumin"]),
  item("24H_URINE_PROTEIN", "24-Hour Urine Protein", "Laboratory", "Urine Analysis", "Urine", "24-hour urine", ["24 hour protein"]),
  item("CREATININE_CLEARANCE", "Creatinine Clearance", "Laboratory", "Urine Analysis", "Urine / blood", "Timed urine and serum", ["CrCl", "creatinine clearance test"]),
  item("URINE_KETONES", "Urine Ketones", "Laboratory", "Urine Analysis", "Urine", "Fresh urine", ["ketonuria"]),

  // Laboratory — Endocrinology and reproductive hormones
  item("TSH", "TSH", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["thyroid stimulating hormone", "هرمون الغدة الدرقية"]),
  item("FREE_T4", "Free T4", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["FT4", "free thyroxine"]),
  item("FREE_T3", "Free T3", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["FT3", "free triiodothyronine"]),
  item("PROLACTIN", "Prolactin", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["PRL", "هرمون الحليب"]),
  item("SERUM_BETA_HCG", "Quantitative Serum Beta-hCG", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["beta hCG", "BHCG", "تحليل حمل رقمي"]),
  item("QUALITATIVE_SERUM_HCG", "Qualitative Serum hCG", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["serum pregnancy test"]),
  item("FSH", "FSH", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["follicle stimulating hormone"]),
  item("LH", "LH", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["luteinizing hormone"]),
  item("ESTRADIOL", "Estradiol (E2)", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["E2", "estradiol"]),
  item("PROGESTERONE", "Serum Progesterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["progesterone", "بروجستيرون"]),
  item("AMH", "Anti-Müllerian Hormone (AMH)", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["AMH", "ovarian reserve", "مخزون المبيض"]),
  item("TOTAL_TESTOSTERONE", "Total Testosterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["testosterone"]),
  item("FREE_TESTOSTERONE", "Free Testosterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["free testosterone"]),
  item("SHBG", "Sex Hormone-Binding Globulin (SHBG)", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["SHBG"]),
  item("DHEAS", "DHEA-S", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["DHEAS", "dehydroepiandrosterone sulfate"]),
  item("ANDROSTENEDIONE", "Androstenedione", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["androstenedione level"]),
  item("17_OH_PROGESTERONE", "17-OH Progesterone", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["17 hydroxyprogesterone"]),
  item("FASTING_INSULIN", "Fasting Insulin", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["insulin resistance"]),
  item("CORTISOL", "Serum Cortisol", "Laboratory", "Endocrinology and Reproductive Hormones", "Blood", "Serum", ["cortisol"]),

  // Laboratory — Serology and immunology
  item("HBSAG", "HBsAg", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["hepatitis B surface antigen", "التهاب كبدي ب"]),
  item("HEPATITIS_B_SURFACE_ANTIBODY", "Hepatitis B Surface Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["anti-HBs", "HBsAb"]),
  item("HEPATITIS_B_CORE_ANTIBODY", "Hepatitis B Core Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["anti-HBc", "HBcAb"]),
  item("HCV_ANTIBODY", "HCV Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["anti-HCV", "التهاب كبدي ج"]),
  item("HCV_PCR", "HCV RNA PCR", "Laboratory", "Serology and Immunology", "Blood", "Plasma", ["HCV viral load"]),
  item("HIV_AG_AB", "HIV Ag/Ab", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["HIV screening"]),
  item("VDRL_RPR", "VDRL / RPR", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["syphilis screen"]),
  item("TPHA", "Treponema pallidum Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["TPHA", "TPPA", "treponemal antibody"]),
  item("RUBELLA_IGG", "Rubella IgG", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["rubella immunity", "مناعة الحصبة الألمانية"]),
  item("RUBELLA_IGM", "Rubella IgM", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["acute rubella serology"]),
  item("TOXOPLASMA_IGG_IGM", "Toxoplasma IgG/IgM", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["toxoplasmosis", "توكسوبلازما"]),
  item("CMV_IGG_IGM", "CMV IgG/IgM", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["cytomegalovirus", "CMV"]),
  item("VARICELLA_IGG", "Varicella IgG", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["varicella immunity"]),
  item("PARVOVIRUS_B19_IGG_IGM", "Parvovirus B19 IgG/IgM", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["parvovirus serology"]),
  item("ANA", "Antinuclear Antibody (ANA)", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["ANA", "antinuclear antibodies"]),
  item("ANTI_DSDNA", "Anti-dsDNA Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["double stranded DNA antibody"]),
  item("ENA_PANEL", "Extractable Nuclear Antigen Panel", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["ENA screen", "SSA", "SSB", "Ro", "La"]),
  item("COMPLEMENT_C3_C4", "Complement C3 and C4", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["C3", "C4", "complement levels"]),
  item("APS_SCREEN", "Antiphospholipid Antibody Screen", "Laboratory", "Serology and Immunology", "Blood", "Plasma/serum", ["APS", "anticardiolipin", "lupus anticoagulant"]),
  item("LUPUS_ANTICOAGULANT", "Lupus Anticoagulant", "Laboratory", "Serology and Immunology", "Blood", "Plasma", ["LA", "APS testing"]),
  item("ANTICARDIOLIPIN_ANTIBODIES", "Anticardiolipin Antibodies", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["aCL IgG IgM", "APS testing"]),
  item("BETA2_GLYCOPROTEIN_ANTIBODIES", "Beta-2 Glycoprotein I Antibodies", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["anti beta2 glycoprotein", "APS testing"]),
  item("THYROID_PEROXIDASE_ANTIBODY", "Thyroid Peroxidase Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["TPO antibody", "anti TPO"]),
  item("THYROGLOBULIN_ANTIBODY", "Thyroglobulin Antibody", "Laboratory", "Serology and Immunology", "Blood", "Serum", ["TgAb", "anti thyroglobulin"]),

  // Laboratory — Microbiology
  item("URINE_CULTURE", "Urine Culture and Sensitivity", "Laboratory", "Microbiology", "Culture", "Midstream urine", ["urine C&S", "مزرعة بول"]),
  item("BLOOD_CULTURE", "Blood Culture and Sensitivity", "Laboratory", "Microbiology", "Culture", "Blood culture bottles", ["blood C&S"]),
  item("VAGINAL_SWAB_CULTURE", "Vaginal Swab Culture", "Laboratory", "Microbiology", "Culture", "Vaginal swab", ["high vaginal swab", "HVS", "مسحة مهبلية"]),
  item("HIGH_VAGINAL_SWAB_MICROSCOPY", "High Vaginal Swab Microscopy", "Laboratory", "Microbiology", "Microscopy", "High vaginal swab", ["HVS microscopy", "vaginal microscopy"]),
  item("VAGINAL_WET_MOUNT", "Vaginal Wet Mount", "Laboratory", "Microbiology", "Microscopy", "Vaginal swab", ["wet preparation", "clue cells", "trichomonas microscopy"]),
  item("VAGINAL_GRAM_STAIN", "Vaginal Gram Stain", "Laboratory", "Microbiology", "Microscopy", "Vaginal swab", ["Nugent score", "gram stain vaginal swab"]),
  item("CERVICAL_SWAB", "Cervical Swab Culture", "Laboratory", "Microbiology", "Culture", "Cervical swab", ["endocervical swab"]),
  item("CHLAMYDIA_NAAT", "Chlamydia NAAT", "Laboratory", "Microbiology", "Molecular test", "Swab or urine", ["chlamydia PCR"]),
  item("GONORRHEA_NAAT", "Gonorrhea NAAT", "Laboratory", "Microbiology", "Molecular test", "Swab or urine", ["gonorrhoea PCR"]),
  item("TRICHOMONAS_NAAT", "Trichomonas NAAT", "Laboratory", "Microbiology", "Molecular test", "Vaginal swab", ["trichomonas PCR"]),
  item("GROUP_B_STREP_CULTURE", "Group B Streptococcus Culture", "Laboratory", "Microbiology", "Culture", "Vaginal/rectal swab", ["GBS screen", "group B strep"]),
  item("GENITAL_FUNGAL_CULTURE", "Genital Fungal Culture", "Laboratory", "Microbiology", "Culture", "Vaginal or vulval swab", ["Candida culture", "yeast culture"]),
  item("WOUND_CULTURE", "Wound Culture and Sensitivity", "Laboratory", "Microbiology", "Culture", "Wound swab", ["postoperative wound culture"]),
  item("PLACENTAL_TISSUE_CULTURE", "Placental Tissue Culture", "Laboratory", "Microbiology", "Culture", "Placental tissue", ["placental culture"]),

  // Laboratory — Andrology
  item("SEMEN_ANALYSIS", "Semen Analysis", "Laboratory", "Andrology", "Laboratory", "Semen", ["seminal analysis", "تحليل سائل منوي"]),
  item("SEMEN_MORPHOLOGY", "Strict Sperm Morphology", "Laboratory", "Andrology", "Laboratory", "Semen", ["Kruger morphology", "sperm morphology"]),
  item("SPERM_VITALITY", "Sperm Vitality", "Laboratory", "Andrology", "Laboratory", "Semen", ["sperm viability"]),
  item("SEMEN_CULTURE", "Semen Culture", "Laboratory", "Andrology", "Culture", "Semen", ["seminal culture"]),
  item("SPERM_DNA_FRAGMENTATION", "Sperm DNA Fragmentation", "Laboratory", "Andrology", "Laboratory", "Semen", ["DNA fragmentation index", "DFI"]),
  item("ANTISPERM_ANTIBODIES", "Antisperm Antibodies", "Laboratory", "Andrology", "Laboratory", "Semen / serum", ["ASA", "sperm antibodies"]),
  item("MAR_TEST", "Mixed Antiglobulin Reaction Test", "Laboratory", "Andrology", "Laboratory", "Semen", ["MAR test", "immunobead test"]),
  item("POST_EJACULATORY_URINE", "Post-Ejaculatory Urine Analysis", "Laboratory", "Andrology", "Laboratory", "Urine", ["retrograde ejaculation assessment"]),

  // Laboratory — Tumor markers
  item("CA_125", "CA-125", "Laboratory", "Tumor Markers", "Blood", "Serum", ["CA 125", "ovarian tumor marker"]),
  item("HE4", "Human Epididymis Protein 4 (HE4)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["HE4", "ovarian marker"]),
  item("ROMA_PANEL", "ROMA Marker Panel", "Laboratory", "Tumor Markers", "Blood", "Serum", ["CA125 HE4 panel", "risk of ovarian malignancy algorithm"]),
  item("CEA", "CEA", "Laboratory", "Tumor Markers", "Blood", "Serum", ["carcinoembryonic antigen"]),
  item("CA_19_9", "CA 19-9", "Laboratory", "Tumor Markers", "Blood", "Serum", ["CA19-9"]),
  item("CA_15_3", "CA 15-3", "Laboratory", "Tumor Markers", "Blood", "Serum", ["breast tumor marker"]),
  item("AFP", "Alpha-Fetoprotein (AFP)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["AFP", "alpha fetoprotein"]),
  item("LDH", "Lactate Dehydrogenase (LDH)", "Laboratory", "Tumor Markers", "Blood", "Serum", ["LDH", "germ cell marker"]),
  item("BETA_HCG_TUMOR_MARKER", "Beta-hCG Tumor Marker", "Laboratory", "Tumor Markers", "Blood", "Serum", ["tumor beta hCG", "germ cell marker"]),
  item("INHIBIN_A", "Inhibin A", "Laboratory", "Tumor Markers", "Blood", "Serum", ["inhibin A"]),
  item("INHIBIN_B", "Inhibin B", "Laboratory", "Tumor Markers", "Blood", "Serum", ["inhibin B"]),

  // Laboratory — Genetics and prenatal screening
  item("NIPT", "Non-Invasive Prenatal Testing (NIPT)", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Maternal blood", ["cell free DNA", "cfDNA"]),
  item("COMBINED_FIRST_TRIMESTER_SCREEN", "Combined First-Trimester Screening", "Laboratory", "Genetics and Prenatal Screening", "Prenatal screening", "Maternal serum", ["PAPP-A", "free beta hCG", "first trimester screen"]),
  item("QUAD_SCREEN", "Second-Trimester Quadruple Screen", "Laboratory", "Genetics and Prenatal Screening", "Prenatal screening", "Maternal serum", ["quad screen", "AFP hCG estriol inhibin"]),
  item("KARYOTYPE", "Constitutional Karyotype", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or tissue", ["chromosome analysis"]),
  item("PRODUCTS_OF_CONCEPTION_KARYOTYPE", "Products of Conception Karyotype", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Pregnancy tissue", ["POC karyotype", "miscarriage karyotype"]),
  item("CHROMOSOMAL_MICROARRAY", "Chromosomal Microarray", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or tissue", ["CMA", "array CGH", "SNP array"]),
  item("THALASSEMIA_SCREEN", "Hemoglobinopathy / Thalassemia Screen", "Laboratory", "Genetics and Prenatal Screening", "Carrier screening", "Whole blood", ["thalassemia carrier screen", "hemoglobinopathy screen"]),
  item("CARRIER_SCREENING_PANEL", "Expanded Carrier Screening Panel", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or saliva", ["carrier panel", "preconception genetics"]),
  item("CYSTIC_FIBROSIS_CARRIER_SCREEN", "Cystic Fibrosis Carrier Screen", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or saliva", ["CFTR carrier test"]),
  item("SMA_CARRIER_SCREEN", "Spinal Muscular Atrophy Carrier Screen", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or saliva", ["SMN1 carrier screen", "SMA carrier test"]),
  item("FRAGILE_X_CARRIER_SCREEN", "Fragile X Carrier Screen", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood", ["FMR1 premutation test"]),
  item("BRCA1_BRCA2_TEST", "BRCA1/BRCA2 Genetic Test", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or saliva", ["hereditary breast ovarian cancer panel", "BRCA"]),
  item("LYNCH_SYNDROME_PANEL", "Lynch Syndrome Genetic Panel", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Blood or tissue", ["MMR genes", "hereditary colorectal endometrial cancer"]),
  item("THROMBOPHILIA_GENETIC_PANEL", "Hereditary Thrombophilia Genetic Panel", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Whole blood", ["factor V Leiden", "prothrombin gene mutation"]),
  item("PGT_A", "Preimplantation Genetic Testing for Aneuploidy", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Embryo biopsy", ["PGT-A", "PGS"]),
  item("PGT_M", "Preimplantation Genetic Testing for Monogenic Disease", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Embryo biopsy", ["PGT-M", "PGD"]),
  item("PGT_SR", "Preimplantation Genetic Testing for Structural Rearrangements", "Laboratory", "Genetics and Prenatal Screening", "Genetic testing", "Embryo biopsy", ["PGT-SR"]),

  // Imaging — Gynecology and fertility
  item("PELVIC_ULTRASOUND", "Pelvic Ultrasound", "Imaging", "Gynecologic Ultrasound", "Ultrasound", null, ["pelvic US", "سونار حوض"]),
  item("TRANSVAGINAL_ULTRASOUND", "Transvaginal Ultrasound", "Imaging", "Gynecologic Ultrasound", "Ultrasound", null, ["TVUS", "TVS", "سونار مهبلي"]),
  item("TRANSABDOMINAL_GYNE_ULTRASOUND", "Transabdominal Gynecologic Ultrasound", "Imaging", "Gynecologic Ultrasound", "Ultrasound", null, ["TA pelvic ultrasound"]),
  item("UTERUS_3D_ULTRASOUND", "3D Uterine Ultrasound", "Imaging", "Gynecologic Ultrasound", "3D ultrasound", null, ["3D uterus", "coronal uterine view"]),
  item("UTERUS_4D_ULTRASOUND", "4D Uterine Ultrasound", "Imaging", "Gynecologic Ultrasound", "4D ultrasound", null, ["4D uterus"]),
  item("TRANSVAGINAL_4D_ULTRASOUND", "4D Transvaginal Ultrasound", "Imaging", "Gynecologic Ultrasound", "4D ultrasound", null, ["4D TVUS"]),
  item("PELVIC_COLOR_DOPPLER", "Pelvic Color Doppler Ultrasound", "Imaging", "Gynecologic Ultrasound", "Doppler ultrasound", null, ["ovarian Doppler", "uterine Doppler", "pelvic blood flow"]),
  item("SONOHYSTEROGRAPHY", "Sonohysterography", "Imaging", "Gynecologic Ultrasound", "Ultrasound", null, ["saline infusion sonography", "SIS"]),
  item("HYCO_SY", "Hysterosalpingo-Contrast Sonography", "Imaging", "Fertility Ultrasound", "Contrast ultrasound", null, ["HyCoSy", "tubal patency ultrasound"]),
  item("FOLLICULOMETRY", "Follicular Monitoring", "Imaging", "Fertility Ultrasound", "Ultrasound", null, ["folliculometry", "follicle tracking", "متابعة تبويض"]),
  item("ANTRAL_FOLLICLE_COUNT", "Antral Follicle Count Ultrasound", "Imaging", "Fertility Ultrasound", "Ultrasound", null, ["AFC", "ovarian reserve ultrasound"]),

  // Imaging — Obstetrics and fetal medicine
  item("EARLY_PREGNANCY_SCAN", "Early Pregnancy Ultrasound", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["viability scan", "سونار حمل مبكر"]),
  item("DATING_SCAN", "Pregnancy Dating Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["dating ultrasound"]),
  item("NUCHAL_TRANSLUCENCY_SCAN", "Nuchal Translucency Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["NT scan"]),
  item("ANOMALY_SCAN", "Detailed Anomaly Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["anatomy scan", "تفصيلي للجنين"]),
  item("FETAL_GROWTH_SCAN", "Fetal Growth Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["growth scan", "سونار نمو الجنين"]),
  item("OBSTETRIC_DOPPLER", "Obstetric Doppler Study", "Imaging", "Obstetric Doppler", "Doppler ultrasound", null, ["fetal Doppler", "pregnancy Doppler"]),
  item("UTERINE_ARTERY_DOPPLER", "Uterine Artery Doppler", "Imaging", "Obstetric Doppler", "Doppler ultrasound", null, ["uterine artery PI", "preeclampsia Doppler"]),
  item("UMBILICAL_ARTERY_DOPPLER", "Umbilical Artery Doppler", "Imaging", "Obstetric Doppler", "Doppler ultrasound", null, ["UA Doppler", "umbilical PI"]),
  item("MCA_DOPPLER", "Middle Cerebral Artery Doppler", "Imaging", "Obstetric Doppler", "Doppler ultrasound", null, ["MCA PSV", "fetal anemia Doppler"]),
  item("DUCTUS_VENOSUS_DOPPLER", "Ductus Venosus Doppler", "Imaging", "Obstetric Doppler", "Doppler ultrasound", null, ["DV Doppler"]),
  item("BIOPHYSICAL_PROFILE", "Biophysical Profile", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["BPP"]),
  item("CERVICAL_LENGTH_SCAN", "Cervical Length Scan", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["cervical length", "طول عنق الرحم"]),
  item("PLACENTA_LOCALIZATION_SCAN", "Placenta Localization Ultrasound", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["low lying placenta follow-up", "placenta position"]),
  item("PLACENTA_ACCRETA_ASSESSMENT", "Placenta Accreta Spectrum Ultrasound Assessment", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["PAS scan", "accreta Doppler"]),
  item("FETAL_MEDICINE_ULTRASOUND", "Fetal Medicine Ultrasound Assessment", "Imaging", "Obstetric Ultrasound", "Ultrasound", null, ["fetal medicine scan"]),
  item("FETAL_MRI", "Fetal MRI", "Imaging", "MRI", "MRI", null, ["MRI fetus", "prenatal MRI"]),

  // Imaging — Breast, general and vascular
  item("MAMMOGRAPHY", "Mammography", "Imaging", "Breast Imaging", "Mammography", null, ["mammogram", "ماموجرام"]),
  item("BREAST_ULTRASOUND", "Breast Ultrasound", "Imaging", "Breast Imaging", "Ultrasound", null, ["breast US", "سونار ثدي"]),
  item("BREAST_MRI", "Breast MRI", "Imaging", "MRI", "MRI", null, ["MRI breast"]),
  item("PELVIC_MRI", "Pelvic MRI", "Imaging", "MRI", "MRI", null, ["MRI pelvis", "رنين حوض"]),
  item("ABDOMINAL_ULTRASOUND", "Abdominal Ultrasound", "Imaging", "General Ultrasound", "Ultrasound", null, ["abdominal US", "سونار بطن"]),
  item("RENAL_URINARY_ULTRASOUND", "Renal and Urinary Tract Ultrasound", "Imaging", "General Ultrasound", "Ultrasound", null, ["renal US", "KUB ultrasound"]),
  item("THYROID_ULTRASOUND", "Thyroid Ultrasound", "Imaging", "General Ultrasound", "Ultrasound", null, ["thyroid scan ultrasound"]),
  item("LOWER_LIMB_VENOUS_DUPLEX_BILATERAL", "Bilateral Lower-Limb Venous Duplex Ultrasound", "Imaging", "Vascular Ultrasound", "Duplex ultrasound", null, ["bilateral venous Doppler", "lower limb duplex", "DVT scan", "دوبلر أوردة الطرفين السفليين"]),
  item("LOWER_LIMB_VENOUS_DUPLEX_RIGHT", "Right Lower-Limb Venous Duplex Ultrasound", "Imaging", "Vascular Ultrasound", "Duplex ultrasound", null, ["right venous Doppler", "right DVT scan"]),
  item("LOWER_LIMB_VENOUS_DUPLEX_LEFT", "Left Lower-Limb Venous Duplex Ultrasound", "Imaging", "Vascular Ultrasound", "Duplex ultrasound", null, ["left venous Doppler", "left DVT scan"]),
  item("LOWER_LIMB_ARTERIAL_DUPLEX", "Lower-Limb Arterial Duplex Ultrasound", "Imaging", "Vascular Ultrasound", "Duplex ultrasound", null, ["arterial Doppler lower limb", "arterial duplex"]),
  item("PELVIC_VENOUS_DUPLEX", "Pelvic Venous Duplex Ultrasound", "Imaging", "Vascular Ultrasound", "Duplex ultrasound", null, ["pelvic congestion Doppler", "pelvic venous Doppler"]),
  item("CAROTID_DUPLEX", "Carotid Duplex Ultrasound", "Imaging", "Vascular Ultrasound", "Duplex ultrasound", null, ["carotid Doppler"]),
  item("RENAL_ARTERY_DOPPLER", "Renal Artery Doppler Ultrasound", "Imaging", "Vascular Ultrasound", "Doppler ultrasound", null, ["renal artery duplex"]),
  item("CT_ABDOMEN_PELVIS", "CT Abdomen and Pelvis", "Imaging", "CT", "CT", null, ["CT abdomen pelvis"]),
  item("CT_PULMONARY_ANGIOGRAPHY", "CT Pulmonary Angiography", "Imaging", "CT", "CT angiography", null, ["CTPA", "pulmonary embolism CT"]),
  item("XRAY_PELVIS", "Pelvic X-ray", "Imaging", "X-ray and Fluoroscopy", "X-ray", null, ["x ray pelvis"]),
  item("CHEST_XRAY", "Chest X-ray", "Imaging", "X-ray and Fluoroscopy", "X-ray", null, ["CXR", "أشعة صدر"]),
  item("HYSTEROSALPINGOGRAPHY", "Hysterosalpingography", "Imaging", "X-ray and Fluoroscopy", "Fluoroscopy", null, ["HSG", "أشعة صبغة على الرحم والأنابيب"]),
  item("DEXA_SCAN", "Bone Mineral Density Scan", "Imaging", "Bone Densitometry", "DEXA", null, ["DXA", "bone density", "osteoporosis scan"]),

  // Pathology and cytology
  item("PAP_SMEAR", "Pap Smear / Cervical Cytology", "Pathology", "Cytology", "Cytology", "Cervical sample", ["Pap test", "cervical smear", "مسحة عنق الرحم"]),
  item("LIQUID_BASED_CYTOLOGY", "Liquid-Based Cervical Cytology", "Pathology", "Cytology", "Cytology", "Cervical sample", ["LBC", "ThinPrep"]),
  item("ENDOMETRIAL_CYTOLOGY", "Endometrial Cytology", "Pathology", "Cytology", "Cytology", "Endometrial sample", ["endometrial cytology"]),
  item("ASCITIC_FLUID_CYTOLOGY", "Ascitic Fluid Cytology", "Pathology", "Cytology", "Cytology", "Ascitic fluid", ["peritoneal fluid cytology"]),
  item("HPV_DNA_TEST", "HPV DNA Test", "Pathology", "Molecular Pathology", "Molecular pathology", "Cervical sample", ["HPV test", "human papillomavirus"]),
  item("ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY", "Endometrial Biopsy Histopathology", "Pathology", "Histopathology", "Histopathology", "Endometrial tissue", ["endometrial biopsy", "عينة بطانة الرحم"]),
  item("CERVICAL_BIOPSY_HISTOPATHOLOGY", "Cervical Biopsy Histopathology", "Pathology", "Histopathology", "Histopathology", "Cervical tissue", ["cervical biopsy", "cone biopsy pathology"]),
  item("VULVAR_BIOPSY_HISTOPATHOLOGY", "Vulvar Biopsy Histopathology", "Pathology", "Histopathology", "Histopathology", "Vulvar tissue", ["vulval biopsy"]),
  item("PRODUCTS_OF_CONCEPTION_HISTOPATHOLOGY", "Products of Conception Histopathology", "Pathology", "Histopathology", "Histopathology", "Pregnancy tissue", ["POC histology"]),
  item("PLACENTA_HISTOPATHOLOGY", "Placental Histopathology", "Pathology", "Histopathology", "Histopathology", "Placenta", ["placental pathology"]),
  item("OVARIAN_MASS_HISTOPATHOLOGY", "Ovarian Mass Histopathology", "Pathology", "Histopathology", "Histopathology", "Ovarian tissue", ["ovarian cyst pathology", "adnexal mass pathology"]),
  item("BREAST_BIOPSY_HISTOPATHOLOGY", "Breast Biopsy Histopathology", "Pathology", "Histopathology", "Histopathology", "Breast tissue", ["core biopsy pathology"]),
  item("FROZEN_SECTION", "Intraoperative Frozen Section", "Pathology", "Histopathology", "Frozen section", "Fresh tissue", ["frozen section pathology"]),
  item("IMMUNOHISTOCHEMISTRY_PANEL", "Immunohistochemistry Panel", "Pathology", "Molecular Pathology", "Immunohistochemistry", "Tissue block", ["IHC panel"]),
  item("HISTOPATHOLOGY_REPORT", "Histopathology Review", "Pathology", "Histopathology", "Histopathology", "Tissue/slides", ["pathology review", "second pathology opinion"]),

  // Cardiac and functional tests
  item("ECG", "Electrocardiogram (ECG)", "Cardiac and Functional Tests", "Cardiac Testing", "ECG", null, ["EKG", "رسم قلب"]),
  item("ECHOCARDIOGRAPHY", "Echocardiography", "Cardiac and Functional Tests", "Echocardiography", "Echocardiography", null, ["echo"]),
  item("FETAL_ECHOCARDIOGRAPHY_REFERRAL", "Fetal Echocardiography", "Cardiac and Functional Tests", "Fetal Cardiology", "Echocardiography", null, ["fetal echo"]),
  item("HOLTER_MONITORING", "Holter Monitoring", "Cardiac and Functional Tests", "Cardiac Testing", "Ambulatory ECG", null, ["Holter ECG"]),
  item("AMBULATORY_BP_MONITORING", "Ambulatory Blood Pressure Monitoring", "Cardiac and Functional Tests", "Cardiac Testing", "ABPM", null, ["24 hour blood pressure", "ABPM"]),
  item("CTG", "Cardiotocography", "Cardiac and Functional Tests", "Fetal Surveillance", "CTG", null, ["fetal monitoring", "cardiotocogram"]),
  item("NON_STRESS_TEST", "Non-Stress Test", "Cardiac and Functional Tests", "Fetal Surveillance", "CTG", null, ["NST", "nonstress test"]),
  item("SPIROMETRY", "Spirometry", "Cardiac and Functional Tests", "Pulmonary Function", "Spirometry", null, ["lung function test"]),
  item("PULMONARY_FUNCTION_TESTS", "Pulmonary Function Tests", "Cardiac and Functional Tests", "Pulmonary Function", "PFT", null, ["PFT", "lung function"]),
  item("URODYNAMIC_STUDY", "Urodynamic Study", "Cardiac and Functional Tests", "Urogynecology", "Urodynamics", null, ["urodynamics", "bladder function test"]),

  // Procedures and referrals
  item("ANESTHESIA_ASSESSMENT", "Anesthesia Assessment", "Procedures and Referrals", "Preoperative Assessment", "Clinical assessment", null, ["pre-anaesthetic review"]),
  item("MEDICAL_FITNESS_ASSESSMENT", "Medical Fitness / Preoperative Assessment", "Procedures and Referrals", "Preoperative Assessment", "Clinical assessment", null, ["medical clearance"]),
  item("CARDIOLOGY_ASSESSMENT", "Cardiology Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["cardiology opinion"]),
  item("HEMATOLOGY_ASSESSMENT", "Hematology Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["hematology opinion", "coagulation specialist"]),
  item("ENDOCRINOLOGY_ASSESSMENT", "Endocrinology Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["endocrinology opinion"]),
  item("FETAL_MEDICINE_REFERRAL", "Fetal Medicine Specialist Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["fetal medicine referral"]),
  item("BREAST_SURGERY_REFERRAL", "Breast Surgery Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["breast surgeon opinion"]),
  item("GYNE_ONCOLOGY_REFERRAL", "Gynecologic Oncology Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["gyn oncology referral", "oncology opinion"]),
  item("VASCULAR_SURGERY_OPINION", "Vascular Surgery Assessment", "Procedures and Referrals", "Specialist Assessment", "Specialist report", null, ["vascular opinion"]),
  item("COLPOSCOPY", "Colposcopy", "Procedures and Referrals", "Gynecology Procedure", "Colposcopy", null, ["cervical colposcopy"]),
  item("DIAGNOSTIC_HYSTEROSCOPY", "Diagnostic Hysteroscopy", "Procedures and Referrals", "Gynecology Procedure", "Hysteroscopy", null, ["office hysteroscopy"]),
  item("ENDOMETRIAL_SAMPLING", "Endometrial Sampling", "Procedures and Referrals", "Gynecology Procedure", "Biopsy procedure", null, ["Pipelle biopsy", "endometrial biopsy procedure"]),
  item("PELVIC_FLOOR_PHYSIOTHERAPY", "Pelvic Floor Physiotherapy Assessment", "Procedures and Referrals", "Allied Health Referral", "Physiotherapy assessment", null, ["pelvic floor rehab", "women health physiotherapy"]),
  item("CLINICAL_NUTRITION_ASSESSMENT", "Clinical Nutrition Assessment", "Procedures and Referrals", "Allied Health Referral", "Dietitian assessment", null, ["dietitian referral", "pregnancy nutrition"])
];

const REQUIRED_CATALOG_CODES = [
  "CBC",
  "COAGULATION_PROFILE",
  "PT_INR",
  "APTT",
  "FIBRINOGEN",
  "D_DIMER",
  "URINALYSIS",
  "URINE_CULTURE",
  "SEMEN_ANALYSIS",
  "SPERM_DNA_FRAGMENTATION",
  "NIPT",
  "BRCA1_BRCA2_TEST",
  "OBSTETRIC_DOPPLER",
  "UMBILICAL_ARTERY_DOPPLER",
  "MCA_DOPPLER",
  "LOWER_LIMB_VENOUS_DUPLEX_BILATERAL",
  "PELVIC_MRI",
  "PAP_SMEAR",
  "ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY",
  "CTG",
  "ANESTHESIA_ASSESSMENT"
];

async function seedInvestigationCatalog(prisma) {
  if (!prisma.investigationCatalogItem) {
    console.warn("WARN InvestigationCatalogItem model is not available; skipping investigation catalog seed.");
    return { skipped: true, count: 0 };
  }

  validateSeedCatalogue();

  let sortOrder = 10;
  for (const entry of investigationCatalogItems) {
    const sharedData = {
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
      sortOrder
    };
    await prisma.investigationCatalogItem.upsert({
      where: { code: entry.code },
      update: sharedData,
      create: { code: entry.code, ...sharedData, active: true }
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

function validateSeedCatalogue() {
  const allowedCategories = new Set(["Laboratory", "Imaging", "Pathology", "Cardiac and Functional Tests", "Procedures and Referrals", "Other"]);
  const codes = new Set();
  const names = new Set();

  for (const entry of investigationCatalogItems) {
    if (!allowedCategories.has(entry.category)) throw new Error(`Invalid investigation category for ${entry.code}: ${entry.category}`);
    if (!entry.subcategory) throw new Error(`Investigation ${entry.code} is missing a subcategory.`);
    if (codes.has(entry.code)) throw new Error(`Duplicate investigation code: ${entry.code}`);
    const normalized = normalizeName(entry.name);
    if (names.has(normalized)) throw new Error(`Duplicate investigation name: ${entry.name}`);
    codes.add(entry.code);
    names.add(normalized);
  }

  const missing = REQUIRED_CATALOG_CODES.filter((code) => !codes.has(code));
  if (missing.length) throw new Error(`Missing required investigation codes: ${missing.join(", ")}`);
}

function canonicalTaxonomy(entry) {
  const key = normalizeName([entry.category, entry.subcategory, entry.name, entry.modality].filter(Boolean).join(" "));

  if (/cytology|histopath|pathology|pap|hpv|immunohist|frozen section/.test(key)) {
    return { category: "Pathology", subcategory: /histopath|biopsy|tissue|frozen section/.test(key) ? "Histopathology" : /molecular|hpv|immunohist/.test(key) ? "Molecular Pathology" : "Cytology" };
  }

  if (/doppler|duplex/.test(key)) {
    if (/obstetric|pregnancy|fetal|umbilical|middle cerebral|mca|ductus venosus|uterine artery|placenta/.test(key)) return { category: "Imaging", subcategory: "Obstetric Doppler" };
    if (/lower limb|venous|arterial|carotid|renal artery|vascular/.test(key)) return { category: "Imaging", subcategory: "Vascular Ultrasound" };
    if (/pelvic|ovarian|uterine/.test(key)) return { category: "Imaging", subcategory: "Gynecologic Ultrasound" };
  }

  if (/ultrasound|sonograph|radiology|imaging|mri|ct |x ray|xray|mammograph|fluoroscop|hsg|dexa|bone density/.test(key)) {
    if (/obstetric|pregnancy|fetal|nuchal|anomaly|growth|cervical length|placenta/.test(key)) return { category: "Imaging", subcategory: "Obstetric Ultrasound" };
    if (/fertility|infertil|follic|hycosy/.test(key)) return { category: "Imaging", subcategory: "Fertility Ultrasound" };
    if (/gynec|pelvic ultrasound|transvaginal|uterine|sonohyst/.test(key)) return { category: "Imaging", subcategory: "Gynecologic Ultrasound" };
    if (/breast|mammograph/.test(key)) return { category: "Imaging", subcategory: "Breast Imaging" };
    if (/mri/.test(key)) return { category: "Imaging", subcategory: "MRI" };
    if (/ct /.test(`${key} `)) return { category: "Imaging", subcategory: "CT" };
    if (/x ray|xray|fluoroscop|hsg/.test(key)) return { category: "Imaging", subcategory: "X-ray and Fluoroscopy" };
    if (/dexa|bone density/.test(key)) return { category: "Imaging", subcategory: "Bone Densitometry" };
    return { category: "Imaging", subcategory: entry.subcategory || "General Imaging" };
  }

  if (/cardiac|cardio|ecg|echo|holter|blood pressure monitoring|ctg|non stress|spirometry|pulmonary function|urodynamic/.test(key)) return { category: "Cardiac and Functional Tests", subcategory: entry.subcategory || "Functional Testing" };
  if (/referral|specialist|assessment|preoperative|anaesth|anesth|medical clearance|colposcopy|hysteroscopy|sampling|physiotherapy|nutrition/.test(key)) return { category: "Procedures and Referrals", subcategory: entry.subcategory || "Specialist Assessment" };
  if (/microbiology|culture|swab|naat|pcr|group b strep|wet mount|gram stain/.test(key)) return { category: "Laboratory", subcategory: "Microbiology" };
  if (/prenatal|nipt|karyotype|genetic|quad screen|carrier screen|microarray|pgt|brca|lynch|thalassemia|hemoglobinopathy/.test(key)) return { category: "Laboratory", subcategory: "Genetics and Prenatal Screening" };
  if (/serology|infectious|antenatal screening|immunology|antibody|hiv|hbsag|hcv|rubella|toxoplas|cmv|vdrl|rpr|varicella|parvovirus|complement|dsdna|ena/.test(key)) return { category: "Laboratory", subcategory: "Serology and Immunology" };
  if (/coag|inr|aptt|thrombin|fibrin|d dimer|anti xa|von willebrand|factor viii|factor ix|factor xi|protein c|protein s|antithrombin|thrombophilia/.test(key)) return { category: "Laboratory", subcategory: "Coagulation" };
  if (/hormone|endocr|tsh|prolact|amh|testosterone|estradiol|progesterone|fsh|lh|insulin|cortisol|dheas|androstenedione/.test(key)) return { category: "Laboratory", subcategory: "Endocrinology and Reproductive Hormones" };
  if (/urine|urinal|creatinine clearance/.test(key)) return { category: "Laboratory", subcategory: "Urine Analysis" };
  if (/hemat|blood count|cbc|platelet|ferritin|iron|hemoglobin|reticulocyte|blood film|esr|crossmatch|coombs|g6pd|sickling/.test(key)) return { category: "Laboratory", subcategory: "Hematology" };
  if (/tumor|ca 125|ca 19|ca 15|cea|afp|he4|inhibin|roma|germ cell marker/.test(key)) return { category: "Laboratory", subcategory: "Tumor Markers" };
  if (/andrology|semen|sperm|antisperm|mar test|post ejaculatory/.test(key)) return { category: "Laboratory", subcategory: "Andrology" };
  if (/laboratory| lab |biochem|chemistry|glucose|liver|kidney|electrolyte|vitamin|creatinine|urea|albumin|bilirubin|crp|lipid|folate|calcium|magnesium|phosphate|uric acid/.test(` ${key} `)) return { category: "Laboratory", subcategory: "Clinical Chemistry" };
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
