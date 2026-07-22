
const canonicalItems = [
  {
    "code": "SEMEN_ANALYSIS",
    "name": "Semen analysis",
    "category": "Laboratory",
    "subcategory": "Andrology"
  },
  {
    "code": "SPERM_DNA_FRAGMENTATION",
    "name": "Sperm DNA fragmentation",
    "category": "Laboratory",
    "subcategory": "Andrology"
  },
  {
    "code": "SEMEN_CULTURE_AND_SENSITIVITY",
    "name": "Semen culture and sensitivity",
    "category": "Laboratory",
    "subcategory": "Andrology"
  },
  {
    "code": "ANTISPERM_ANTIBODIES",
    "name": "Antisperm antibodies",
    "category": "Laboratory",
    "subcategory": "Andrology"
  },
  {
    "code": "POST_EJACULATORY_URINE_ANALYSIS",
    "name": "Post-ejaculatory urine analysis",
    "category": "Laboratory",
    "subcategory": "Andrology"
  },
  {
    "code": "FASTING_BLOOD_GLUCOSE",
    "name": "Fasting blood glucose",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "RANDOM_BLOOD_GLUCOSE",
    "name": "Random blood glucose",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "2_HOUR_POSTPRANDIAL_BLOOD_GLUCOSE",
    "name": "2-hour postprandial blood glucose",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "50_G_GLUCOSE_CHALLENGE_TEST",
    "name": "50-g glucose challenge test",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "ORAL_GLUCOSE_TOLERANCE_TEST_OGTT",
    "name": "Oral glucose tolerance test (OGTT)",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "HBA1C",
    "name": "HbA1c",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "FASTING_INSULIN",
    "name": "Fasting insulin",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "LIPID_PROFILE",
    "name": "Lipid profile",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "UREA",
    "name": "Urea",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "CREATININE",
    "name": "Creatinine",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "URIC_ACID",
    "name": "Uric acid",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "SODIUM",
    "name": "Sodium",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "POTASSIUM",
    "name": "Potassium",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "TOTAL_CALCIUM",
    "name": "Total calcium",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "IONIZED_CALCIUM",
    "name": "Ionized calcium",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "MAGNESIUM",
    "name": "Magnesium",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "PHOSPHORUS",
    "name": "Phosphorus",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "TOTAL_PROTEIN",
    "name": "Total protein",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "ALBUMIN",
    "name": "Albumin",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "TOTAL_AND_DIRECT_BILIRUBIN",
    "name": "Total and direct bilirubin",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "AST",
    "name": "AST",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "ALT",
    "name": "ALT",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "ALP",
    "name": "ALP",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "GGT",
    "name": "GGT",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "LDH",
    "name": "LDH",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "SERUM_BILE_ACIDS",
    "name": "Serum bile acids",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "FERRITIN",
    "name": "Ferritin",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "SERUM_IRON",
    "name": "Serum iron",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "TIBC",
    "name": "TIBC",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "CRP",
    "name": "CRP",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "ESR",
    "name": "ESR",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "VITAMIN_B12",
    "name": "Vitamin B12",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "FOLATE",
    "name": "Folate",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "VITAMIN_D",
    "name": "Vitamin D",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "AMYLASE",
    "name": "Amylase",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "LIPASE",
    "name": "Lipase",
    "category": "Laboratory",
    "subcategory": "Clinical Chemistry"
  },
  {
    "code": "COAGULATION_PROFILE",
    "name": "Coagulation profile",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "PT",
    "name": "PT",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "INR",
    "name": "INR",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "APTT",
    "name": "aPTT",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "FIBRINOGEN",
    "name": "Fibrinogen",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "D_DIMER",
    "name": "D-dimer",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "LUPUS_ANTICOAGULANT",
    "name": "Lupus anticoagulant",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "ANTICARDIOLIPIN_ANTIBODIES_IGG_IGM",
    "name": "Anticardiolipin antibodies IgG/IgM",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "BETA_2_GLYCOPROTEIN_I_ANTIBODIES_IGG_IGM",
    "name": "Beta-2 glycoprotein I antibodies IgG/IgM",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "PROTEIN_C",
    "name": "Protein C",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "PROTEIN_S",
    "name": "Protein S",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "ANTITHROMBIN_III",
    "name": "Antithrombin III",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "FACTOR_V_LEIDEN_MUTATION",
    "name": "Factor V Leiden mutation",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "PROTHROMBIN_G20210A_MUTATION",
    "name": "Prothrombin G20210A mutation",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "VON_WILLEBRAND_FACTOR_TESTING",
    "name": "von Willebrand factor testing",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "THROMBOPHILIA_SCREEN",
    "name": "Thrombophilia screen",
    "category": "Laboratory",
    "subcategory": "Coagulation and Thrombophilia"
  },
  {
    "code": "FSH",
    "name": "FSH",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "LH",
    "name": "LH",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "PROLACTIN",
    "name": "Prolactin",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "ESTRADIOL_E2",
    "name": "Estradiol (E2)",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "PROGESTERONE",
    "name": "Progesterone",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "TOTAL_TESTOSTERONE",
    "name": "Total testosterone",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "FREE_TESTOSTERONE",
    "name": "Free testosterone",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "DHEA_S",
    "name": "DHEA-S",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "SHBG",
    "name": "SHBG",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "AMH",
    "name": "AMH",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "TSH",
    "name": "TSH",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "FREE_T4",
    "name": "Free T4",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "FREE_T3",
    "name": "Free T3",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "THYROID_PEROXIDASE_ANTIBODIES",
    "name": "Thyroid peroxidase antibodies",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "THYROGLOBULIN_ANTIBODIES",
    "name": "Thyroglobulin antibodies",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "CORTISOL",
    "name": "Cortisol",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "ACTH",
    "name": "ACTH",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "17_OH_PROGESTERONE",
    "name": "17-OH progesterone",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "QUANTITATIVE_SERUM_BETA_HCG",
    "name": "Quantitative serum beta-hCG",
    "category": "Laboratory",
    "subcategory": "Endocrinology and Reproductive Hormones"
  },
  {
    "code": "KARYOTYPE",
    "name": "Karyotype",
    "category": "Laboratory",
    "subcategory": "Genetics and Prenatal Screening"
  },
  {
    "code": "NON_INVASIVE_PRENATAL_TESTING_NIPT",
    "name": "Non-invasive prenatal testing (NIPT)",
    "category": "Laboratory",
    "subcategory": "Genetics and Prenatal Screening"
  },
  {
    "code": "FIRST_TRIMESTER_COMBINED_SCREENING",
    "name": "First-trimester combined screening",
    "category": "Laboratory",
    "subcategory": "Genetics and Prenatal Screening"
  },
  {
    "code": "SECOND_TRIMESTER_MATERNAL_SERUM_SCREENING",
    "name": "Second-trimester maternal serum screening",
    "category": "Laboratory",
    "subcategory": "Genetics and Prenatal Screening"
  },
  {
    "code": "CARRIER_SCREENING_PANEL",
    "name": "Carrier screening panel",
    "category": "Laboratory",
    "subcategory": "Genetics and Prenatal Screening"
  },
  {
    "code": "COMPLETE_BLOOD_COUNT_CBC",
    "name": "Complete blood count (CBC)",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "PERIPHERAL_BLOOD_FILM",
    "name": "Peripheral blood film",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "RETICULOCYTE_COUNT",
    "name": "Reticulocyte count",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "G6PD_ASSAY",
    "name": "G6PD assay",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "HEMOGLOBIN_ELECTROPHORESIS",
    "name": "Hemoglobin electrophoresis",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "ABO_BLOOD_GROUP_AND_RH_TYPING",
    "name": "ABO blood group and Rh typing",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "INDIRECT_ANTIGLOBULIN_TEST_INDIRECT_COOMBS_TEST",
    "name": "Indirect antiglobulin test / Indirect Coombs test",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "DIRECT_ANTIGLOBULIN_TEST_DIRECT_COOMBS_TEST",
    "name": "Direct antiglobulin test / Direct Coombs test",
    "category": "Laboratory",
    "subcategory": "Hematology and Immunohematology"
  },
  {
    "code": "URINE_CULTURE_AND_SENSITIVITY",
    "name": "Urine culture and sensitivity",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "BLOOD_CULTURE",
    "name": "Blood culture",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "VAGINAL_SWAB_CULTURE_AND_SENSITIVITY",
    "name": "Vaginal swab culture and sensitivity",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "HIGH_VAGINAL_SWAB_FOR_MICROSCOPY_CULTURE_AND_SENSITIVITY",
    "name": "High vaginal swab for microscopy, culture and sensitivity",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "ENDOCERVICAL_SWAB",
    "name": "Endocervical swab",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "URETHRAL_SWAB",
    "name": "Urethral swab",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "GROUP_B_STREPTOCOCCUS_SCREEN",
    "name": "Group B streptococcus screen",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "CHLAMYDIA_NAAT",
    "name": "Chlamydia NAAT",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "GONORRHEA_NAAT",
    "name": "Gonorrhea NAAT",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "TRICHOMONAS_TESTING",
    "name": "Trichomonas testing",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "VAGINAL_WET_MOUNT_AND_MICROSCOPY",
    "name": "Vaginal wet mount and microscopy",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "VAGINAL_FUNGAL_CULTURE",
    "name": "Vaginal fungal culture",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "BACTERIAL_VAGINOSIS_TESTING",
    "name": "Bacterial vaginosis testing",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "HSV_LESION_PCR_OR_SWAB",
    "name": "HSV lesion PCR or swab",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "WOUND_SWAB_CULTURE_AND_SENSITIVITY",
    "name": "Wound swab culture and sensitivity",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "STOOL_CULTURE",
    "name": "Stool culture",
    "category": "Laboratory",
    "subcategory": "Microbiology"
  },
  {
    "code": "HIV_1_2_ANTIGEN_AND_ANTIBODY_TEST",
    "name": "HIV-1/2 antigen and antibody test",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "HBSAG",
    "name": "HBsAg",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "HCV_ANTIBODY",
    "name": "HCV antibody",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "VDRL_RPR",
    "name": "VDRL / RPR",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "RUBELLA_IGG",
    "name": "Rubella IgG",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "RUBELLA_IGM",
    "name": "Rubella IgM",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "TOXOPLASMA_IGG",
    "name": "Toxoplasma IgG",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "TOXOPLASMA_IGM",
    "name": "Toxoplasma IgM",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "CMV_IGG",
    "name": "CMV IgG",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "CMV_IGM",
    "name": "CMV IgM",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "PARVOVIRUS_B19_IGG_IGM",
    "name": "Parvovirus B19 IgG/IgM",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "TYPE_SPECIFIC_HSV_1_HSV_2_IGG",
    "name": "Type-specific HSV-1/HSV-2 IgG",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "TORCH_PANEL",
    "name": "TORCH panel",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "ANA",
    "name": "ANA",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "ANTI_DSDNA",
    "name": "Anti-dsDNA",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "RHEUMATOID_FACTOR",
    "name": "Rheumatoid factor",
    "category": "Laboratory",
    "subcategory": "Serology and Immunology"
  },
  {
    "code": "CA_125",
    "name": "CA-125",
    "category": "Laboratory",
    "subcategory": "Tumor Markers"
  },
  {
    "code": "CA_19_9",
    "name": "CA 19-9",
    "category": "Laboratory",
    "subcategory": "Tumor Markers"
  },
  {
    "code": "CEA",
    "name": "CEA",
    "category": "Laboratory",
    "subcategory": "Tumor Markers"
  },
  {
    "code": "AFP",
    "name": "AFP",
    "category": "Laboratory",
    "subcategory": "Tumor Markers"
  },
  {
    "code": "HE4",
    "name": "HE4",
    "category": "Laboratory",
    "subcategory": "Tumor Markers"
  },
  {
    "code": "ROUTINE_URINE_ANALYSIS",
    "name": "Routine urine analysis",
    "category": "Laboratory",
    "subcategory": "Urine and Stool Analysis"
  },
  {
    "code": "URINE_MICROSCOPY",
    "name": "Urine microscopy",
    "category": "Laboratory",
    "subcategory": "Urine and Stool Analysis"
  },
  {
    "code": "URINE_PROTEIN_CREATININE_RATIO",
    "name": "Urine protein/creatinine ratio",
    "category": "Laboratory",
    "subcategory": "Urine and Stool Analysis"
  },
  {
    "code": "24_HOUR_URINARY_PROTEIN",
    "name": "24-hour urinary protein",
    "category": "Laboratory",
    "subcategory": "Urine and Stool Analysis"
  },
  {
    "code": "URINE_KETONES",
    "name": "Urine ketones",
    "category": "Laboratory",
    "subcategory": "Urine and Stool Analysis"
  },
  {
    "code": "STOOL_ANALYSIS",
    "name": "Stool analysis",
    "category": "Laboratory",
    "subcategory": "Urine and Stool Analysis"
  },
  {
    "code": "FECAL_OCCULT_BLOOD_TEST",
    "name": "Fecal occult blood test",
    "category": "Laboratory",
    "subcategory": "Urine and Stool Analysis"
  },
  {
    "code": "PELVIC_ULTRASOUND",
    "name": "Pelvic ultrasound",
    "category": "Imaging",
    "subcategory": "Gynecologic Ultrasound"
  },
  {
    "code": "TRANSABDOMINAL_PELVIC_ULTRASOUND",
    "name": "Transabdominal pelvic ultrasound",
    "category": "Imaging",
    "subcategory": "Gynecologic Ultrasound"
  },
  {
    "code": "TRANSVAGINAL_ULTRASOUND",
    "name": "Transvaginal ultrasound",
    "category": "Imaging",
    "subcategory": "Gynecologic Ultrasound"
  },
  {
    "code": "3D_PELVIC_ULTRASOUND",
    "name": "3D pelvic ultrasound",
    "category": "Imaging",
    "subcategory": "Gynecologic Ultrasound"
  },
  {
    "code": "SALINE_INFUSION_SONOHYSTEROGRAPHY_SIS",
    "name": "Saline infusion sonohysterography (SIS)",
    "category": "Imaging",
    "subcategory": "Gynecologic Ultrasound"
  },
  {
    "code": "FIRST_TRIMESTER_OBSTETRIC_ULTRASOUND",
    "name": "First-trimester obstetric ultrasound",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "EARLY_PREGNANCY_VIABILITY_SCAN",
    "name": "Early pregnancy viability scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "EARLY_FETAL_ANATOMY_SCAN",
    "name": "Early fetal anatomy scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "NUCHAL_TRANSLUCENCY_SCAN",
    "name": "Nuchal translucency scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "SECOND_TRIMESTER_ANOMALY_SCAN",
    "name": "Second-trimester anomaly scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "DETAILED_FETAL_ANOMALY_SCAN",
    "name": "Detailed fetal anomaly scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "THIRD_TRIMESTER_GROWTH_SCAN",
    "name": "Third-trimester growth scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "MULTIPLE_PREGNANCY_GROWTH_SURVEILLANCE",
    "name": "Multiple-pregnancy growth surveillance",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "BIOPHYSICAL_PROFILE",
    "name": "Biophysical profile",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "FETAL_WELL_BEING_SCAN",
    "name": "Fetal well-being scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "ESTIMATED_FETAL_WEIGHT_SCAN",
    "name": "Estimated fetal weight scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "PLACENTAL_LOCALIZATION_SCAN",
    "name": "Placental localization scan",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "CERVICAL_LENGTH_ULTRASOUND",
    "name": "Cervical length ultrasound",
    "category": "Imaging",
    "subcategory": "Obstetric Ultrasound"
  },
  {
    "code": "OBSTETRIC_DOPPLER_ULTRASOUND",
    "name": "Obstetric Doppler ultrasound",
    "category": "Imaging",
    "subcategory": "Obstetric Doppler"
  },
  {
    "code": "UTERINE_ARTERY_DOPPLER",
    "name": "Uterine artery Doppler",
    "category": "Imaging",
    "subcategory": "Obstetric Doppler"
  },
  {
    "code": "UMBILICAL_ARTERY_DOPPLER",
    "name": "Umbilical artery Doppler",
    "category": "Imaging",
    "subcategory": "Obstetric Doppler"
  },
  {
    "code": "MIDDLE_CEREBRAL_ARTERY_DOPPLER",
    "name": "Middle cerebral artery Doppler",
    "category": "Imaging",
    "subcategory": "Obstetric Doppler"
  },
  {
    "code": "DUCTUS_VENOSUS_DOPPLER",
    "name": "Ductus venosus Doppler",
    "category": "Imaging",
    "subcategory": "Obstetric Doppler"
  },
  {
    "code": "MULTIPLE_PREGNANCY_DOPPLER_SURVEILLANCE",
    "name": "Multiple-pregnancy Doppler surveillance",
    "category": "Imaging",
    "subcategory": "Obstetric Doppler"
  },
  {
    "code": "FOLLICULOMETRY_OVULATION_TRACKING",
    "name": "Folliculometry / ovulation tracking",
    "category": "Imaging",
    "subcategory": "Fertility Ultrasound"
  },
  {
    "code": "ANTRAL_FOLLICLE_COUNT",
    "name": "Antral follicle count",
    "category": "Imaging",
    "subcategory": "Fertility Ultrasound"
  },
  {
    "code": "ENDOMETRIAL_MONITORING_ULTRASOUND",
    "name": "Endometrial monitoring ultrasound",
    "category": "Imaging",
    "subcategory": "Fertility Ultrasound"
  },
  {
    "code": "BREAST_ULTRASOUND",
    "name": "Breast ultrasound",
    "category": "Imaging",
    "subcategory": "Breast Imaging"
  },
  {
    "code": "SCREENING_MAMMOGRAPHY",
    "name": "Screening mammography",
    "category": "Imaging",
    "subcategory": "Breast Imaging"
  },
  {
    "code": "DIAGNOSTIC_MAMMOGRAPHY",
    "name": "Diagnostic mammography",
    "category": "Imaging",
    "subcategory": "Breast Imaging"
  },
  {
    "code": "BREAST_MRI",
    "name": "Breast MRI",
    "category": "Imaging",
    "subcategory": "Breast Imaging"
  },
  {
    "code": "ABDOMINAL_ULTRASOUND",
    "name": "Abdominal ultrasound",
    "category": "Imaging",
    "subcategory": "General Ultrasound"
  },
  {
    "code": "RENAL_TRACT_ULTRASOUND",
    "name": "Renal tract ultrasound",
    "category": "Imaging",
    "subcategory": "General Ultrasound"
  },
  {
    "code": "THYROID_ULTRASOUND",
    "name": "Thyroid ultrasound",
    "category": "Imaging",
    "subcategory": "General Ultrasound"
  },
  {
    "code": "SOFT_TISSUE_ULTRASOUND",
    "name": "Soft-tissue ultrasound",
    "category": "Imaging",
    "subcategory": "General Ultrasound"
  },
  {
    "code": "LOWER_LIMB_VENOUS_DUPLEX_DVT_SCAN",
    "name": "Lower-limb venous duplex / DVT scan",
    "category": "Imaging",
    "subcategory": "Duplex and Vascular Doppler"
  },
  {
    "code": "LOWER_LIMB_ARTERIAL_DUPLEX",
    "name": "Lower-limb arterial duplex",
    "category": "Imaging",
    "subcategory": "Duplex and Vascular Doppler"
  },
  {
    "code": "PELVIC_VASCULAR_DOPPLER",
    "name": "Pelvic vascular Doppler",
    "category": "Imaging",
    "subcategory": "Duplex and Vascular Doppler"
  },
  {
    "code": "OVARIAN_DOPPLER",
    "name": "Ovarian Doppler",
    "category": "Imaging",
    "subcategory": "Duplex and Vascular Doppler"
  },
  {
    "code": "CAROTID_DUPLEX",
    "name": "Carotid duplex",
    "category": "Imaging",
    "subcategory": "Duplex and Vascular Doppler"
  },
  {
    "code": "CHEST_X_RAY",
    "name": "Chest X-ray",
    "category": "Imaging",
    "subcategory": "X-ray and Fluoroscopy"
  },
  {
    "code": "ABDOMINAL_X_RAY",
    "name": "Abdominal X-ray",
    "category": "Imaging",
    "subcategory": "X-ray and Fluoroscopy"
  },
  {
    "code": "HYSTEROSALPINGOGRAPHY_HSG",
    "name": "Hysterosalpingography (HSG)",
    "category": "Imaging",
    "subcategory": "X-ray and Fluoroscopy"
  },
  {
    "code": "CT_BRAIN",
    "name": "CT brain",
    "category": "Imaging",
    "subcategory": "CT Imaging"
  },
  {
    "code": "CT_CHEST",
    "name": "CT chest",
    "category": "Imaging",
    "subcategory": "CT Imaging"
  },
  {
    "code": "CT_ABDOMEN_AND_PELVIS",
    "name": "CT abdomen and pelvis",
    "category": "Imaging",
    "subcategory": "CT Imaging"
  },
  {
    "code": "CT_PULMONARY_ANGIOGRAPHY",
    "name": "CT pulmonary angiography",
    "category": "Imaging",
    "subcategory": "CT Imaging"
  },
  {
    "code": "PELVIC_MRI",
    "name": "Pelvic MRI",
    "category": "Imaging",
    "subcategory": "MRI"
  },
  {
    "code": "ABDOMINAL_MRI",
    "name": "Abdominal MRI",
    "category": "Imaging",
    "subcategory": "MRI"
  },
  {
    "code": "MRI_BRAIN",
    "name": "MRI brain",
    "category": "Imaging",
    "subcategory": "MRI"
  },
  {
    "code": "PITUITARY_MRI",
    "name": "Pituitary MRI",
    "category": "Imaging",
    "subcategory": "MRI"
  },
  {
    "code": "MR_VENOGRAPHY",
    "name": "MR venography",
    "category": "Imaging",
    "subcategory": "MRI"
  },
  {
    "code": "BONE_MINERAL_DENSITY_SCAN_DEXA",
    "name": "Bone mineral density scan / DEXA",
    "category": "Imaging",
    "subcategory": "Bone Health Imaging"
  },
  {
    "code": "ELECTROCARDIOGRAM_ECG",
    "name": "Electrocardiogram (ECG)",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Cardiac Testing"
  },
  {
    "code": "ECHOCARDIOGRAPHY",
    "name": "Echocardiography",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Cardiac Testing"
  },
  {
    "code": "FETAL_ECHOCARDIOGRAPHY",
    "name": "Fetal echocardiography",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Cardiac Testing"
  },
  {
    "code": "CARDIOTOCOGRAPHY_NON_STRESS_TEST_CTG_NST",
    "name": "Cardiotocography / Non-stress test (CTG / NST)",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Cardiac Testing"
  },
  {
    "code": "HOLTER_MONITORING",
    "name": "Holter monitoring",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Cardiac Testing"
  },
  {
    "code": "AMBULATORY_BLOOD_PRESSURE_MONITORING",
    "name": "Ambulatory blood pressure monitoring",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Cardiac Testing"
  },
  {
    "code": "SPIROMETRY",
    "name": "Spirometry",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Pulmonary and Functional Testing"
  },
  {
    "code": "FULL_PULMONARY_FUNCTION_TEST",
    "name": "Full pulmonary function test",
    "category": "Cardiac and Functional Testing",
    "subcategory": "Pulmonary and Functional Testing"
  },
  {
    "code": "CERVICAL_CYTOLOGY_PAP_SMEAR",
    "name": "Cervical cytology / Pap smear",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Cytology"
  },
  {
    "code": "ENDOMETRIAL_CYTOLOGY",
    "name": "Endometrial cytology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Cytology"
  },
  {
    "code": "ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY",
    "name": "Endometrial biopsy histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "CERVICAL_BIOPSY_HISTOPATHOLOGY",
    "name": "Cervical biopsy histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "ENDOCERVICAL_CURETTAGE_HISTOPATHOLOGY",
    "name": "Endocervical curettage histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "VULVAR_BIOPSY_HISTOPATHOLOGY",
    "name": "Vulvar biopsy histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "VAGINAL_BIOPSY_HISTOPATHOLOGY",
    "name": "Vaginal biopsy histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "ENDOMETRIAL_POLYP_HISTOPATHOLOGY",
    "name": "Endometrial polyp histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "CERVICAL_POLYP_HISTOPATHOLOGY",
    "name": "Cervical polyp histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "UTERINE_LEIOMYOMA_MYOMA_HISTOPATHOLOGY",
    "name": "Uterine leiomyoma / myoma histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "OVARIAN_CYST_HISTOPATHOLOGY",
    "name": "Ovarian cyst histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "FALLOPIAN_TUBE_HISTOPATHOLOGY",
    "name": "Fallopian tube histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "PRODUCTS_OF_CONCEPTION_HISTOPATHOLOGY",
    "name": "Products of conception histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "PLACENTAL_HISTOPATHOLOGY",
    "name": "Placental histopathology",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "Histopathology"
  },
  {
    "code": "HPV_DNA_TEST",
    "name": "HPV DNA test",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "HPV and Molecular Testing"
  },
  {
    "code": "HPV_TYPING",
    "name": "HPV typing",
    "category": "Pathology and Molecular Diagnostics",
    "subcategory": "HPV and Molecular Testing"
  },
  {
    "code": "COLPOSCOPY",
    "name": "Colposcopy",
    "category": "Diagnostic Procedures",
    "subcategory": "Gynecologic Diagnostic Procedures"
  },
  {
    "code": "DIAGNOSTIC_HYSTEROSCOPY",
    "name": "Diagnostic hysteroscopy",
    "category": "Diagnostic Procedures",
    "subcategory": "Gynecologic Diagnostic Procedures"
  },
  {
    "code": "OFFICE_ENDOMETRIAL_BIOPSY_SAMPLING",
    "name": "Office endometrial biopsy / sampling",
    "category": "Diagnostic Procedures",
    "subcategory": "Gynecologic Diagnostic Procedures"
  },
  {
    "code": "CERVICAL_PUNCH_BIOPSY",
    "name": "Cervical punch biopsy",
    "category": "Diagnostic Procedures",
    "subcategory": "Gynecologic Diagnostic Procedures"
  },
  {
    "code": "VULVAR_PUNCH_BIOPSY",
    "name": "Vulvar punch biopsy",
    "category": "Diagnostic Procedures",
    "subcategory": "Gynecologic Diagnostic Procedures"
  },
  {
    "code": "ULTRASOUND_GUIDED_BIOPSY",
    "name": "Ultrasound-guided biopsy",
    "category": "Diagnostic Procedures",
    "subcategory": "Image-Guided Procedures"
  },
  {
    "code": "MATERNAL_FETAL_MEDICINE_REVIEW",
    "name": "Maternal-fetal medicine review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Obstetric and Fertility Referrals"
  },
  {
    "code": "REPRODUCTIVE_MEDICINE_INFERTILITY_REVIEW",
    "name": "Reproductive medicine / infertility review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Obstetric and Fertility Referrals"
  },
  {
    "code": "FERTILITY_PROCEDURE_REFERRAL",
    "name": "Fertility procedure referral",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Obstetric and Fertility Referrals"
  },
  {
    "code": "IVF_ICSI_REFERRAL",
    "name": "IVF / ICSI referral",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Obstetric and Fertility Referrals"
  },
  {
    "code": "GENETIC_COUNSELING_REFERRAL",
    "name": "Genetic counseling referral",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Obstetric and Fertility Referrals"
  },
  {
    "code": "CARRIER_SCREENING_COUNSELING_OR_REFERRAL",
    "name": "Carrier screening counseling or referral",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Obstetric and Fertility Referrals"
  },
  {
    "code": "NEONATOLOGY_REVIEW",
    "name": "Neonatology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Obstetric and Fertility Referrals"
  },
  {
    "code": "INTERNAL_MEDICINE_REVIEW",
    "name": "Internal medicine review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "ENDOCRINOLOGY_REVIEW",
    "name": "Endocrinology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "HEMATOLOGY_REVIEW",
    "name": "Hematology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "RHEUMATOLOGY_REVIEW",
    "name": "Rheumatology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "NEPHROLOGY_REVIEW",
    "name": "Nephrology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "NEUROLOGY_REVIEW",
    "name": "Neurology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "INFECTIOUS_DISEASE_REVIEW",
    "name": "Infectious disease review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "GASTROENTEROLOGY_HEPATOLOGY_REVIEW",
    "name": "Gastroenterology / hepatology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "CHEST_PHYSICIAN_PULMONOLOGY_REVIEW",
    "name": "Chest physician / pulmonology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "CARDIOLOGY_REVIEW",
    "name": "Cardiology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Medical Specialist Review"
  },
  {
    "code": "ONCOLOGY_REVIEW",
    "name": "Oncology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Surgical and Oncology Review"
  },
  {
    "code": "BREAST_SURGEON_REVIEW",
    "name": "Breast surgeon review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Surgical and Oncology Review"
  },
  {
    "code": "GENERAL_SURGERY_REVIEW",
    "name": "General surgery review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Surgical and Oncology Review"
  },
  {
    "code": "VASCULAR_SURGERY_REVIEW",
    "name": "Vascular surgery review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Surgical and Oncology Review"
  },
  {
    "code": "UROLOGY_REVIEW",
    "name": "Urology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Surgical and Oncology Review"
  },
  {
    "code": "DIETITIAN_REVIEW",
    "name": "Dietitian review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Supportive Care Referrals"
  },
  {
    "code": "PSYCHIATRY_OR_PSYCHOLOGY_REVIEW",
    "name": "Psychiatry or psychology review",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Supportive Care Referrals"
  },
  {
    "code": "PELVIC_FLOOR_PHYSIOTHERAPY_REFERRAL",
    "name": "Pelvic-floor physiotherapy referral",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Supportive Care Referrals"
  },
  {
    "code": "ANESTHESIA_ASSESSMENT",
    "name": "Anesthesia assessment",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Preoperative Assessment and Clearance"
  },
  {
    "code": "CARDIOLOGY_CLEARANCE",
    "name": "Cardiology clearance",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Preoperative Assessment and Clearance"
  },
  {
    "code": "PREOPERATIVE_ASSESSMENT_AND_FITNESS_FOR_SURGERY",
    "name": "Preoperative assessment and fitness for surgery",
    "category": "Specialist Referrals and Clearance",
    "subcategory": "Preoperative Assessment and Clearance"
  }
];

const ALIAS_MAP = {
  "HPV_DNA_TEST": [
    "HPV test"
  ],
  "CARDIOLOGY_REVIEW": [
    "Cardiology Assessment",
    "cardiology opinion"
  ],
  "COMPLETE_BLOOD_COUNT_CBC": [
    "CBC",
    "Complete Blood Picture",
    "CBP",
    "FBC",
    "Full Blood Count",
    "Complete Blood Count",
    "صورة دم كاملة"
  ],
  "CERVICAL_CYTOLOGY_PAP_SMEAR": [
    "Pap smear",
    "Pap test",
    "Cervical cytology",
    "cervical smear",
    "Pap smear cytology",
    "مسحة عنق الرحم"
  ],
  "ANTICARDIOLIPIN_ANTIBODIES_IGG_IGM": [
    "Anticardiolipin Antibodies"
  ],
  "HCV_ANTIBODY": [
    "HCV Ab"
  ],
  "HIV_1_2_ANTIGEN_AND_ANTIBODY_TEST": [
    "HIV 1/2 Ag/Ab"
  ],
  "PELVIC_MRI": [
    "MRI pelvis",
    "pelvis MRI",
    "pelvic magnetic resonance imaging",
    "رنين حوض"
  ],
  "SALINE_INFUSION_SONOHYSTEROGRAPHY_SIS": [
    "saline infusion sonography",
    "SIS",
    "sonohysterography",
    "hysterosonography"
  ],
  "UTERINE_ARTERY_DOPPLER": [
    "uterine Doppler",
    "uterine artery PI",
    "preeclampsia Doppler"
  ],
  "OFFICE_ENDOMETRIAL_BIOPSY_SAMPLING": [
    "office endometrial sampling",
    "endometrial biopsy procedure",
    "Pipelle biopsy",
    "Pipelle sampling"
  ],
  "QUANTITATIVE_SERUM_BETA_HCG": [
    "beta hCG",
    "BHCG",
    "تحليل حمل رقمي",
    "beta-hCG tumor-marker",
    "Beta-hCG Tumor Marker"
  ]
};

const REQUIRED_CATALOG_CODES = [
  "COMPLETE_BLOOD_COUNT_CBC",
  "COAGULATION_PROFILE",
  "PT",
  "INR",
  "APTT",
  "URINE_CULTURE_AND_SENSITIVITY",
  "SEMEN_ANALYSIS",
  "SPERM_DNA_FRAGMENTATION",
  "NON_INVASIVE_PRENATAL_TESTING_NIPT",
  "BRCA1_BRCA2_GENETIC_TEST",
  "OBSTETRIC_DOPPLER_ULTRASOUND",
  "UMBILICAL_ARTERY_DOPPLER",
  "MIDDLE_CEREBRAL_ARTERY_DOPPLER",
  "LOWER_LIMB_VENOUS_DUPLEX_DVT_SCAN",
  "PELVIC_MRI",
  "CERVICAL_CYTOLOGY_PAP_SMEAR",
  "ENDOMETRIAL_BIOPSY_HISTOPATHOLOGY",
  "CARDIOTOCOGRAPHY_NON_STRESS_TEST_CTG_NST",
  "ANESTHESIA_ASSESSMENT"
];

function normalizeName(value) {
  return String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

async function seedInvestigationCatalog(prisma) {
  if (!prisma.investigationCatalogItem) {
    console.warn("WARN InvestigationCatalogItem model is not available; skipping investigation catalog seed.");
    return { skipped: true, count: 0 };
  }

  // 1. Upsert canonical items
  let sortOrder = 10;
  const canonicalIdsByCode = new Map();
  for (const entry of canonicalItems) {
    const aliases = ALIAS_MAP[entry.code] || [];
    const sharedData = {
      name: entry.name,
      normalizedName: normalizeName(entry.name),
      category: entry.category,
      subcategory: entry.subcategory,
      clinicalGroup: entry.subcategory,
      aliasesJson: aliases,
      keywordsJson: Array.from(new Set([entry.name, entry.code, entry.category, entry.subcategory, ...aliases].filter(Boolean))),
      tagsJson: Array.from(new Set([entry.category, entry.subcategory].filter(Boolean))),
      discipline: entry.category,
      modality: entry.category === "Imaging" ? entry.subcategory : null,
      specialty: "Obstetrics and Gynecology",
      sortOrder
    };
    
    const upserted = await prisma.investigationCatalogItem.upsert({
      where: { code: entry.code },
      update: sharedData,
      create: { code: entry.code, ...sharedData, active: true }
    });
    canonicalIdsByCode.set(entry.code, upserted.id);
    sortOrder += 10;
  }

  // 2. Identify Legacy items to archive and map
  const existingItems = await prisma.investigationCatalogItem.findMany();
  
  // Create reverse mapping for legacy resolution
  const legacyToCanonicalCodeMap = new Map();
  
  for (const legacy of existingItems) {
    if (canonicalIdsByCode.has(legacy.code)) continue; // It's canonical
    
    // Check if it matches any alias or should be mapped
    let mappedCode = null;
    
    // Explicit deduplication mapping based on spec
    const legacyNorm = normalizeName(legacy.name);
    
    for (const [canonicalCode, aliases] of Object.entries(ALIAS_MAP)) {
      if (aliases.some(a => normalizeName(a) === legacyNorm)) {
        mappedCode = canonicalCode;
        break;
      }
    }
    
    if (!mappedCode) {
        // Broad mapping rules from prompt
        if (legacyNorm.includes('complete blood picture') || legacyNorm.includes('cbc diff')) mappedCode = 'COMPLETE_BLOOD_COUNT_CBC';
        else if (legacyNorm.includes('pap smear') || legacyNorm.includes('pap test')) mappedCode = 'CERVICAL_CYTOLOGY_PAP_SMEAR';
        else if (legacyNorm.includes('mri pelvis') || legacyNorm.includes('pelvis mri')) mappedCode = 'PELVIC_MRI';
        else if (legacyNorm.includes('saline infusion') || legacyNorm.includes('sis') || legacyNorm.includes('sonohysterography')) mappedCode = 'SALINE_INFUSION_SONOHYSTEROGRAPHY_SIS';
        else if (legacyNorm.includes('uterine doppler')) mappedCode = 'UTERINE_ARTERY_DOPPLER';
        else if (legacyNorm.includes('endometrial sampling') || legacyNorm.includes('pipelle')) mappedCode = 'OFFICE_ENDOMETRIAL_BIOPSY_SAMPLING';
        else if (legacyNorm.includes('tumor marker') && legacyNorm.includes('hcg')) mappedCode = 'QUANTITATIVE_SERUM_BETA_HCG';
        else if (legacyNorm.includes('pt inr') || legacyNorm.includes('prothrombin time inr')) mappedCode = 'PT'; // Note: PT, INR, APTT are split
    }
    
    if (mappedCode && canonicalIdsByCode.has(mappedCode)) {
       legacyToCanonicalCodeMap.set(legacy.id, canonicalIdsByCode.get(mappedCode));
    }
    
    // Archive it
    if (legacy.active) {
      await prisma.investigationCatalogItem.update({
        where: { id: legacy.id },
        data: { active: false } // NEVER silently reactivate
      });
    }
  }
  
  // 3. Remap Favorites
  const favorites = await prisma.investigationFavorite.findMany();
  for (const fav of favorites) {
     if (legacyToCanonicalCodeMap.has(fav.investigationCatalogItemId)) {
        const canonicalId = legacyToCanonicalCodeMap.get(fav.investigationCatalogItemId);
        // Ensure no unique constraint violation
        const existingFav = await prisma.investigationFavorite.findUnique({
           where: { userId_investigationCatalogItemId: { userId: fav.userId, investigationCatalogItemId: canonicalId } }
        });
        if (existingFav) {
           await prisma.investigationFavorite.delete({ where: { id: fav.id } });
        } else {
           await prisma.investigationFavorite.update({
              where: { id: fav.id },
              data: { investigationCatalogItemId: canonicalId }
           });
        }
     }
  }
  
  // 4. Remap reusable lists/templates (InvestigationFavoriteSetItem)
  const listItems = await prisma.investigationFavoriteSetItem.findMany();
  for (const li of listItems) {
     if (legacyToCanonicalCodeMap.has(li.investigationCatalogItemId)) {
        const canonicalId = legacyToCanonicalCodeMap.get(li.investigationCatalogItemId);
        
        // Find existing to avoid unique constraint
        const existing = await prisma.investigationFavoriteSetItem.findUnique({
           where: {
              favoriteSetId_investigationCatalogItemId: {
                 favoriteSetId: li.favoriteSetId,
                 investigationCatalogItemId: canonicalId
              }
           }
        });
        
        if (existing) {
           await prisma.investigationFavoriteSetItem.delete({ where: { id: li.id } });
        } else {
           await prisma.investigationFavoriteSetItem.update({
              where: { id: li.id },
              data: { investigationCatalogItemId: canonicalId }
           });
        }
     }
  }

  return { skipped: false, count: canonicalItems.length, remapped: legacyToCanonicalCodeMap.size };
}

module.exports = {
  seedInvestigationCatalog
};
