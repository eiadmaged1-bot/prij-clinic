export const BATCH_ID = "Batch-01";

export const BATCH_DOCUMENTS = [
  ["01_NICE_NG133_Hypertension_in_Pregnancy.pdf", "NICE NG133 Hypertension in pregnancy", "NICE", "NG133", "obstetrics", "hypertension in pregnancy", "NEEDS_SUMMARY"],
  ["02_NICE_NG3_Diabetes_in_Pregnancy.pdf", "NICE NG3 Diabetes in pregnancy", "NICE", "NG3", "obstetrics", "diabetes in pregnancy", "NEEDS_SUMMARY"],
  ["03_NICE_NG126_Ectopic_Pregnancy_and_Miscarriage.pdf", "NICE NG126 Ectopic pregnancy and miscarriage", "NICE", "NG126", "obstetrics", "early pregnancy", "NEEDS_SUMMARY"],
  ["04_NICE_NG88_Heavy_Menstrual_Bleeding.pdf", "NICE NG88 Heavy menstrual bleeding", "NICE", "NG88", "gynecology", "heavy menstrual bleeding", "NEEDS_SUMMARY"],
  ["05_NICE_NG23_Menopause.pdf", "NICE NG23 Menopause", "NICE", "NG23", "gynecology", "menopause", "NEEDS_SUMMARY"],
  ["06_RCOG_GTG52_Postpartum_Haemorrhage.pdf", "RCOG Green-top Guideline 52 Postpartum haemorrhage", "RCOG", "GTG 52", "obstetrics", "postpartum haemorrhage", "NEEDS_SUMMARY"],
  ["07_RCOG_GTG37a_VTE_Risk_Reduction.pdf", "RCOG Green-top Guideline 37a VTE risk reduction", "RCOG", "GTG 37a", "obstetrics", "venous thromboembolism prevention", "NEEDS_SUMMARY"],
  ["08_RCOG_GTG37b_Acute_VTE_Management.pdf", "RCOG Green-top Guideline 37b Acute VTE management", "RCOG", "GTG 37b", "obstetrics", "venous thromboembolism treatment", "NEEDS_SUMMARY"],
  ["09_RCOG_GTG57_Reduced_Fetal_Movements_2026_OFFICIAL_PDF.pdf", "RCOG Green-top Guideline 57 Reduced fetal movements", "RCOG", "GTG 57", "obstetrics", "reduced fetal movements", "PENDING_SOURCE_PDF"],
  ["10_RCOG_GTG31_SGA_and_FGR.pdf", "RCOG Green-top Guideline 31 SGA and fetal growth restriction", "RCOG", "GTG 31", "obstetrics", "fetal growth restriction", "NEEDS_CORRECTION_REVIEW"],
  ["11_RCOG_GTG64_Maternal_Sepsis.pdf", "RCOG Green-top Guideline 64 Maternal sepsis", "RCOG", "GTG 64", "obstetrics", "maternal sepsis", "NEEDS_CORRECTION_REVIEW"],
  ["12_ESHRE_International_PMOS_PCOS_Guideline_2026.pdf", "International evidence-based PCOS guideline", "ESHRE", "2026", "gynecology", "polycystic ovary syndrome", "NEEDS_SUMMARY"]
].map(([fileName, title, organization, versionLabel, specialty, topic, ingestStatus]) => ({ fileName, title, organization, versionLabel, specialty, topic, ingestStatus }));
