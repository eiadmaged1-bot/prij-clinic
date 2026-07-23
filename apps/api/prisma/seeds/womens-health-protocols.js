const verifiedProtocols = [
  {
    code: "ENDOMETRIOSIS_MANAGEMENT_V1",
    title: "Endometriosis management snapshot",
    specialtyGroup: "Pelvic pain/endometriosis",
    condition: "Endometriosis",
    aliases: ["endometriosis", "endometrioma", "deep endometriosis", "pelvic pain with endometriosis"],
    bodySystem: "Gynecology",
    clinicalArea: "Pelvic pain and fertility",
    implementationStatus: "verified",
    riskLevel: "medium",
    sourceName: "ESHRE Endometriosis Guideline 2022; NICE NG73 Endometriosis diagnosis and management",
    sourceYear: 2022,
    sourceVersion: "v1",
    contentJson: {
      summary: "Structured management snapshot for doctor-reviewed endometriosis care planning.",
      verifiedManagementAvailable: true,
      goals: ["pain control", "fertility priority", "both pain and fertility"],
      options: [
        "Analgesia and supportive pain control may be considered.",
        "Hormonal suppression may be considered if pregnancy is not currently desired and no contraindication is present.",
        "Use a fertility-focused pathway when trying to conceive.",
        "Discuss surgery or referral for refractory symptoms, endometrioma, deep disease, uncertain diagnosis, red flags, or fertility planning.",
        "Individualize by age, ovarian reserve, symptoms, prior surgery, and patient goal."
      ],
      safetyChecks: [
        "Pregnancy possibility",
        "Acute abdomen or red flags",
        "Contraindications to hormones",
        "Fertility goal before suppression",
        "Previous ovarian surgery or ovarian reserve if fertility is a priority"
      ],
      contraindicationChecks: ["Hormonal therapy contraindications", "Pregnancy possibility"],
      redFlags: ["Acute abdomen", "Severe or rapidly worsening pain"],
      followUpConsiderations: ["Review symptom response and patient goals."],
      referralConsiderations: ["Refer for refractory symptoms, endometrioma, deep disease, uncertain diagnosis, or fertility planning."],
      limitations: ["Draft support only until reviewed by a doctor.", "No automatic diagnosis.", "No automatic prescribing."]
    },
    safetyJson: { noDoses: true, doctorReviewRequired: true, externalAi: false }
  },
  {
    code: "PCOS_OVULATION_INDUCTION_V1",
    title: "PCOS ovulation induction snapshot",
    specialtyGroup: "Fertility/IVF",
    condition: "PCOS ovulation induction",
    aliases: ["pcos infertility", "pcos ovulation induction", "anovulatory infertility pcos", "letrozole pcos"],
    bodySystem: "Reproductive endocrinology",
    clinicalArea: "Fertility",
    implementationStatus: "verified",
    riskLevel: "medium",
    sourceName: "2023 International Evidence-based Guideline for PCOS",
    sourceYear: 2023,
    sourceVersion: "v1",
    contentJson: {
      summary: "Structured management snapshot for doctor-reviewed PCOS ovulation induction planning.",
      verifiedManagementAvailable: true,
      goals: ["ovulation induction", "fertility planning"],
      options: [
        "If anovulatory infertility with PCOS and no other infertility factor is confirmed, letrozole is a first-line option to consider.",
        "If oral induction fails or is unsuitable, consider second-line options with monitoring.",
        "Gonadotropins require ultrasound monitoring and multiple pregnancy risk discussion.",
        "Consider ART/IVF when other factors, repeated failure, age, ovarian reserve, preference, access, or specialist decision support it."
      ],
      safetyChecks: [
        "Pregnancy test",
        "Tubal factor assessment",
        "Semen analysis",
        "BMI and metabolic risk",
        "Ultrasound monitoring",
        "Multiple pregnancy risk"
      ],
      contraindicationChecks: ["Pregnancy possibility", "Contraindications to induction medication"],
      redFlags: ["Severe pelvic pain during stimulation", "Symptoms concerning for OHSS"],
      followUpConsiderations: ["Follow response with clinician-directed monitoring."],
      referralConsiderations: ["Refer for specialist fertility care when first-line pathways are unsuitable or unsuccessful."],
      limitations: ["Draft support only until reviewed by a doctor.", "No medication dose automation.", "No automatic prescribing."]
    },
    safetyJson: { noDoses: true, doctorReviewRequired: true, externalAi: false, offLabelMayVaryByCountry: true }
  },
  {
    code: "UNEXPLAINED_INFERTILITY_V1",
    title: "Unexplained infertility snapshot",
    specialtyGroup: "Fertility/IVF",
    condition: "Unexplained infertility",
    aliases: ["unexplained infertility", "normal infertility workup", "idiopathic infertility"],
    bodySystem: "Reproductive medicine",
    clinicalArea: "Fertility",
    implementationStatus: "verified",
    riskLevel: "medium",
    sourceName: "ASRM 2020 unexplained infertility guideline; ESHRE unexplained infertility guideline 2023",
    sourceYear: 2023,
    sourceVersion: "v1",
    contentJson: {
      summary: "Structured management snapshot for doctor-reviewed unexplained infertility planning.",
      verifiedManagementAvailable: true,
      goals: ["complete evaluation review", "fertility planning"],
      options: [
        "Confirm the basic infertility evaluation is complete.",
        "OS-IUI may be considered in suitable couples.",
        "IVF can be individualized by age, duration, prior treatment, ovarian reserve, preference, and access.",
        "Avoid over-treatment when a lower-risk pathway is suitable."
      ],
      safetyChecks: [
        "Semen analysis",
        "Ovulation evidence",
        "Tubal patency",
        "Ovarian reserve and age",
        "Multiple pregnancy risk with stimulation"
      ],
      contraindicationChecks: ["Pregnancy possibility", "Contraindications to stimulation pathways"],
      redFlags: ["Severe pain", "Positive pregnancy test with pain or bleeding"],
      followUpConsiderations: ["Review age, duration, ovarian reserve, and prior treatments."],
      referralConsiderations: ["Refer for fertility specialist decision-making when indicated."],
      limitations: ["Draft support only until reviewed by a doctor.", "No automatic diagnosis.", "No automatic prescribing."]
    },
    safetyJson: { noDoses: true, doctorReviewRequired: true, externalAi: false }
  }
];

const catalogGroups = [
  ["General gynecology and menstrual disorders", "ABNORMAL_UTERINE_BLEEDING HEAVY_MENSTRUAL_BLEEDING INTERMENSTRUAL_BLEEDING POSTCOITAL_BLEEDING POSTMENOPAUSAL_BLEEDING PRIMARY_AMENORRHEA SECONDARY_AMENORRHEA OLIGOMENORRHEA POLYMENORRHEA DYSMENORRHEA_PRIMARY DYSMENORRHEA_SECONDARY PMS PMDD ADOLESCENT_MENSTRUAL_DISORDERS ANOVULATORY_BLEEDING COAGULOPATHY_RELATED_HEAVY_BLEEDING IATROGENIC_ABNORMAL_BLEEDING"],
  ["Pelvic pain/endometriosis", "CHRONIC_PELVIC_PAIN ACUTE_PELVIC_PAIN ENDOMETRIOSIS DEEP_INFILTRATING_ENDOMETRIOSIS OVARIAN_ENDOMETRIOMA ADENOMYOSIS DYSPAREUNIA VAGINISMUS VULVODYNIA PELVIC_FLOOR_MYALGIA PUDENDAL_NEURALGIA BLADDER_PAIN_SYNDROME IBS_OVERLAP_PELVIC_PAIN POSTOPERATIVE_PELVIC_PAIN"],
  ["Benign gynecology", "UTERINE_FIBROIDS SUBMUCOSAL_FIBROID INTRAMURAL_FIBROID SUBSEROSAL_FIBROID OVARIAN_CYST_SIMPLE OVARIAN_CYST_COMPLEX ADNEXAL_MASS DERMOID_CYST HEMORRHAGIC_CYST HYDROSALPINX PARAOVARIAN_CYST ENDOMETRIAL_POLYP CERVICAL_POLYP BARTHOLIN_CYST BARTHOLIN_ABSCESS"],
  ["Infection/STI", "VAGINAL_DISCHARGE BACTERIAL_VAGINOSIS VULVOVAGINAL_CANDIDIASIS TRICHOMONIASIS CERVICITIS PELVIC_INFLAMMATORY_DISEASE CHLAMYDIA_INFECTION GONORRHEA GENITAL_HERPES HPV_INFECTION GENITAL_WARTS SYPHILIS_IN_PREGNANCY_OR_WOMEN HIV_IN_WOMEN RECURRENT_VAGINITIS VULVAR_DERMATITIS LICHEN_SCLEROSUS LICHEN_PLANUS VULVAR_ULCER TOXIC_SHOCK_SYNDROME_GYNECOLOGY_RELEVANT"],
  ["PCOS/endocrine", "PCOS HIRSUTISM HYPERANDROGENISM HYPERPROLACTINEMIA THYROID_RELATED_MENSTRUAL_DISORDER PREMATURE_OVARIAN_INSUFFICIENCY DIMINISHED_OVARIAN_RESERVE OVARIAN_AGING FUNCTIONAL_HYPOTHALAMIC_AMENORRHEA OBESITY_RELATED_REPRODUCTIVE_DYSFUNCTION INSULIN_RESISTANCE_IN_WOMEN METABOLIC_SYNDROME_IN_PCOS"],
  ["Fertility/IVF", "INFERTILITY_INITIAL_EVALUATION ANOVULATORY_INFERTILITY PCOS_OVULATION_INDUCTION UNEXPLAINED_INFERTILITY MALE_FACTOR_INFERTILITY_FEMALE_WORKFLOW TUBAL_FACTOR_INFERTILITY ENDOMETRIOSIS_RELATED_INFERTILITY DIMINISHED_OVARIAN_RESERVE_INFERTILITY RECURRENT_IMPLANTATION_FAILURE RECURRENT_PREGNANCY_LOSS IVF_CYCLE_PLANNING ICSI_WORKFLOW FROZEN_EMBRYO_TRANSFER OVARIAN_STIMULATION_PROTOCOL_SELECTION OHSS_RISK FOLLICULAR_MONITORING TRIGGER_TIMING LUTEAL_PHASE_SUPPORT FERTILITY_PRESERVATION ONCOFERTILITY EGG_FREEZING DONOR_EGG_WORKFLOW SURROGACY_LEGAL_CLINICAL_PLACEHOLDER"],
  ["Contraception/family planning", "CONTRACEPTION_COUNSELING COMBINED_HORMONAL_CONTRACEPTION PROGESTIN_ONLY_PILL INJECTABLE_CONTRACEPTION CONTRACEPTIVE_IMPLANT COPPER_IUD LNG_IUS EMERGENCY_CONTRACEPTION POSTPARTUM_CONTRACEPTION POST_ABORTION_CONTRACEPTION CONTRACEPTION_WITH_MEDICAL_CONDITIONS MISSED_PILLS IUD_INSERTION_COUNSELING IUD_REMOVAL IMPLANT_INSERTION_REMOVAL STERILIZATION_COUNSELING PRECONCEPTION_COUNSELING"],
  ["Early pregnancy", "EARLY_PREGNANCY_ASSESSMENT PREGNANCY_OF_UNKNOWN_LOCATION ECTOPIC_PREGNANCY MISCARRIAGE_THREATENED MISCARRIAGE_INEVITABLE MISCARRIAGE_INCOMPLETE MISSED_MISCARRIAGE SEPTIC_MISCARRIAGE RECURRENT_MISCARRIAGE MOLAR_PREGNANCY HYPEREMESIS_GRAVIDARUM FIRST_TRIMESTER_BLEEDING RH_NEGATIVE_EARLY_PREGNANCY_BLEEDING EARLY_PREGNANCY_PAIN"],
  ["Antenatal care", "ANTENATAL_CARE_ROUTINE PREGNANCY_DATING ANTENATAL_SCREENING ANEMIA_IN_PREGNANCY NAUSEA_VOMITING_PREGNANCY HEARTBURN_PREGNANCY CONSTIPATION_PREGNANCY BACK_PAIN_PREGNANCY VARICOSE_VEINS_PREGNANCY VACCINATION_IN_PREGNANCY NUTRITION_IN_PREGNANCY EXERCISE_IN_PREGNANCY TRAVEL_IN_PREGNANCY MEDICATION_REVIEW_IN_PREGNANCY MATERNAL_MENTAL_HEALTH_SCREENING DOMESTIC_VIOLENCE_SCREENING_PREGNANCY"],
  ["High-risk obstetrics", "GESTATIONAL_DIABETES PREEXISTING_DIABETES_IN_PREGNANCY CHRONIC_HYPERTENSION_IN_PREGNANCY GESTATIONAL_HYPERTENSION PREECLAMPSIA SEVERE_PREECLAMPSIA ECLAMPSIA HELLP_SYNDROME FETAL_GROWTH_RESTRICTION SMALL_FOR_GESTATIONAL_AGE REDUCED_FETAL_MOVEMENT PRETERM_LABOR PPROM CERVICAL_INSUFFICIENCY SHORT_CERVIX PLACENTA_PREVIA PLACENTAL_ABRUPTION PLACENTA_ACCRETA_SPECTRUM VASA_PREVIA POLYHYDRAMNIOS OLIGOHYDRAMNIOS RH_ISOIMMUNIZATION ALLOIMMUNIZATION THROMBOPHILIA_IN_PREGNANCY VTE_IN_PREGNANCY CHOLESTASIS_OF_PREGNANCY ACUTE_FATTY_LIVER_OF_PREGNANCY PYELONEPHRITIS_IN_PREGNANCY UTI_IN_PREGNANCY ASTHMA_IN_PREGNANCY EPILEPSY_IN_PREGNANCY HEART_DISEASE_IN_PREGNANCY RENAL_DISEASE_IN_PREGNANCY AUTOIMMUNE_DISEASE_IN_PREGNANCY SLE_IN_PREGNANCY ANTIPHOSPHOLIPID_SYNDROME_PREGNANCY OBESITY_IN_PREGNANCY ADVANCED_MATERNAL_AGE TEENAGE_PREGNANCY MULTIPLE_PREGNANCY TWIN_PREGNANCY MONOCHORIONIC_TWIN_PREGNANCY TWIN_TO_TWIN_TRANSFUSION_SYNDROME SELECTIVE_FGR_TWINS"],
  ["Fetal medicine/ultrasound", "DATING_SCAN NUCHAL_TRANSLUCENCY FIRST_TRIMESTER_SCREENING NIPT_COUNSELING ANOMALY_SCAN GROWTH_SCAN DOPPLER_ASSESSMENT UMBILICAL_ARTERY_DOPPLER MCA_DOPPLER DUCTUS_VENOSUS_DOPPLER FETAL_ANOMALY_COUNSELING SOFT_MARKERS STRUCTURAL_ANOMALY FETAL_ECHOCARDIOGRAPHY_REFERRAL AMNIOCENTESIS_COUNSELING CVS_COUNSELING FETAL_ANEMIA_SURVEILLANCE INTRAUTERINE_FETAL_DEATH FETAL_HYDROPS MACROSOMIA_SUSPECTED BREECH_PRESENTATION MALPRESENTATION LOW_LYING_PLACENTA_FOLLOWUP"],
  ["Labor/delivery", "LABOR_ASSESSMENT NORMAL_LABOR INDUCTION_OF_LABOR AUGMENTATION_OF_LABOR PROLONGED_LABOR OBSTRUCTED_LABOR FETAL_DISTRESS CTG_INTERPRETATION_WORKFLOW OPERATIVE_VAGINAL_DELIVERY CESAREAN_SECTION_PLANNING VBAC_COUNSELING SHOULDER_DYSTOCIA THIRD_STAGE_MANAGEMENT POSTPARTUM_HEMORRHAGE RETAINED_PLACENTA PERINEAL_TEAR OASIS EPISIOTOMY_CARE MATERNAL_SEPSIS OBSTETRIC_EMERGENCY_TRIAGE"],
  ["Postpartum/lactation", "ROUTINE_POSTNATAL_CARE POSTPARTUM_BLEEDING SECONDARY_PPH PUERPERAL_SEPSIS POSTPARTUM_HYPERTENSION POSTPARTUM_DEPRESSION_SCREENING POSTPARTUM_ANXIETY_SCREENING BREASTFEEDING_SUPPORT MASTITIS BREAST_ABSCESS_LACTATION NIPPLE_PAIN_CRACKS LOW_MILK_SUPPLY_CONCERN POSTPARTUM_CONTRACEPTION POST_CESAREAN_WOUND_REVIEW PERINEAL_WOUND_REVIEW DIASTASIS_RECTI POSTPARTUM_PELVIC_FLOOR_REHAB"],
  ["Menopause/midlife", "PERIMENOPAUSE MENOPAUSE VASOMOTOR_SYMPTOMS GENITOURINARY_SYNDROME_OF_MENOPAUSE PREMATURE_MENOPAUSE HRT_COUNSELING HRT_RISK_REVIEW POSTMENOPAUSAL_BLEEDING BONE_HEALTH_MENOPAUSE OSTEOPENIA_OSTEOPOROSIS_WOMEN SEXUAL_DYSFUNCTION_MENOPAUSE MOOD_SLEEP_MIDLIFE CARDIOMETABOLIC_RISK_MIDLIFE"],
  ["Urogynecology/pelvic floor", "STRESS_URINARY_INCONTINENCE URGE_URINARY_INCONTINENCE MIXED_URINARY_INCONTINENCE OVERACTIVE_BLADDER RECURRENT_UTI_WOMEN PELVIC_ORGAN_PROLAPSE CYSTOCELE RECTOCELE UTERINE_PROLAPSE VAULT_PROLAPSE PESSARY_FITTING_FOLLOWUP FECAL_INCONTINENCE OBSTETRIC_ANAL_SPHINCTER_INJURY_FOLLOWUP PELVIC_FLOOR_DYSFUNCTION CHRONIC_CONSTIPATION_PELVIC_FLOOR"],
  ["Women's health physiotherapy", "ANTENATAL_PHYSIOTHERAPY POSTNATAL_PHYSIOTHERAPY PELVIC_GIRDLE_PAIN LOW_BACK_PAIN_PREGNANCY DIASTASIS_RECTI_REHAB PELVIC_FLOOR_MUSCLE_TRAINING STRESS_INCONTINENCE_PHYSIO URGE_INCONTINENCE_BLADDER_TRAINING PROLAPSE_PHYSIO POST_CESAREAN_REHAB SCAR_MOBILITY_POST_CESAREAN OASIS_REHAB DYSPAREUNIA_PHYSIO VAGINISMUS_PHYSIO VULVODYNIA_PHYSIO ENDOMETRIOSIS_PAIN_PHYSIO_SUPPORT BREAST_CANCER_REHAB_LYMPHEDEMA_PLACEHOLDER"],
  ["Breast health", "BREAST_PAIN BREAST_LUMP NIPPLE_DISCHARGE MASTITIS_NON_LACTATIONAL BREAST_ABSCESS FIBROADENOMA BREAST_CYST BREAST_SCREENING ABNORMAL_MAMMOGRAM HIGH_RISK_BREAST_CANCER_FAMILY_HISTORY BREAST_CANCER_SURVIVOR_GYNECOLOGY_CARE LACTATIONAL_BREAST_PROBLEMS"],
  ["Preventive/oncology", "CERVICAL_SCREENING ABNORMAL_PAP_SMEAR HPV_POSITIVE_SCREEN COLPOSCOPY_REFERRAL CIN_FOLLOWUP ENDOMETRIAL_HYPERPLASIA ENDOMETRIAL_CANCER_SUSPECTED OVARIAN_CANCER_SUSPECTED CERVICAL_CANCER_SUSPECTED VULVAR_CANCER_SUSPECTED GESTATIONAL_TROPHOBLASTIC_DISEASE_FOLLOWUP HEREDITARY_CANCER_RISK_BRCA LYNCH_SYNDROME_GYNECOLOGY"],
  ["Sexual health/sensitive care", "SEXUAL_DYSFUNCTION LOW_LIBIDO ANORGASMIA PAINFUL_SEX CONTRACEPTION_SEXUAL_HEALTH_COUNSELING SEXUAL_ASSAULT_CARE_PATHWAY_PLACEHOLDER FGM_COMPLICATIONS_PLACEHOLDER DOMESTIC_VIOLENCE_SAFETY_SCREENING TRAUMA_INFORMED_GYNECOLOGY_CARE"],
  ["Adolescent gynecology", "PUBERTY_NORMAL_VARIANTS PRECOCIOUS_PUBERTY DELAYED_PUBERTY ADOLESCENT_AUB ADOLESCENT_DYSMENORRHEA ADOLESCENT_PCO_SYMPTOMS CONTRACEPTION_ADOLESCENT_COUNSELING_PLACEHOLDER PRIMARY_AMENORRHEA_ADOLESCENT CONGENITAL_REPRODUCTIVE_TRACT_ANOMALIES"],
  ["Surgical gynecology", "PREOPERATIVE_GYNECOLOGY_ASSESSMENT POSTOPERATIVE_GYNECOLOGY_FOLLOWUP HYSTEROSCOPY_WORKFLOW LAPAROSCOPY_WORKFLOW MYOMECTOMY_FOLLOWUP HYSTERECTOMY_FOLLOWUP OVARIAN_CYSTECTOMY_FOLLOWUP D_AND_C_FOLLOWUP ENDOMETRIAL_BIOPSY_FOLLOWUP SURGICAL_SITE_INFECTION_GYNECOLOGY POSTOPERATIVE_VTE_RISK_WOMEN"],
  ["Medical disease intersection", "DIABETES_PRECONCEPTION HYPERTENSION_PRECONCEPTION THYROID_DISEASE_PRECONCEPTION EPILEPSY_PRECONCEPTION AUTOIMMUNE_DISEASE_PRECONCEPTION ANTICOAGULATION_IN_WOMEN MIGRAINE_AND_HORMONES LIVER_DISEASE_AND_PREGNANCY RENAL_DISEASE_AND_PREGNANCY PSYCHIATRIC_MEDICATIONS_PREGNANCY_PLACEHOLDER TERATOGEN_EXPOSURE_COUNSELING MEDICATION_SAFETY_PREGNANCY_LACTATION"],
  ["Emergency red flags", "ECTOPIC_RED_FLAGS SEPSIS_RED_FLAGS PREECLAMPSIA_RED_FLAGS POSTPARTUM_HEMORRHAGE_RED_FLAGS ACUTE_ABDOMEN_GYNECOLOGY OVARIAN_TORSION_SUSPECTED RUPTURED_ECTOPIC_SUSPECTED REDUCED_FETAL_MOVEMENT_URGENT VAGINAL_BLEEDING_PREGNANCY_URGENT SEVERE_HEADACHE_PREGNANCY_POSTPARTUM CHEST_PAIN_DYSPNEA_PREGNANCY_POSTPARTUM SUICIDE_SELF_HARM_SCREENING_PLACEHOLDER_DO_NOT_RENDER_DETAILS"]
];

async function seedWomensHealthProtocols(prisma) {
  const verifiedBaseCodes = new Set(["ENDOMETRIOSIS", "PCOS_OVULATION_INDUCTION", "UNEXPLAINED_INFERTILITY"]);
  for (const protocol of verifiedProtocols) {
    const unpublishedProtocol = {
      ...protocol,
      implementationStatus: "catalog_only",
      publicationState: "LOCAL_DRAFT",
      sourceDocumentId: null,
      exactPageCitationsJson: null,
      publicationApprovedByUserId: null,
      publicationApprovedAt: null
    };
    await prisma.clinicalProtocol.upsert({
      where: { code: protocol.code },
      update: unpublishedProtocol,
      create: unpublishedProtocol
    });
  }

  for (const [group, list] of catalogGroups) {
    for (const baseCode of list.split(/\s+/).filter(Boolean)) {
      if (verifiedBaseCodes.has(baseCode)) continue;
      const code = `${baseCode}_CATALOG_V1`;
      const title = toTitle(baseCode);
      const contentJson = baseCode === "SUICIDE_SELF_HARM_SCREENING_PLACEHOLDER_DO_NOT_RENDER_DETAILS"
        ? {
            summary: "Catalog entry only. Management snapshot not verified yet.",
            verifiedManagementAvailable: false,
            message: "Urgent safety concern. Immediate human clinician review required."
          }
        : catalogOnlyContent();

      await prisma.clinicalProtocol.upsert({
        where: { code },
        update: {
          title,
          specialtyGroup: group,
          condition: title,
          aliases: aliasesFor(baseCode),
          bodySystem: bodySystemFor(group),
          clinicalArea: group,
          implementationStatus: "catalog_only",
          riskLevel: riskLevelFor(baseCode),
          sourceName: "Women's Health Protocol Atlas catalog placeholder",
          sourceVersion: "catalog_v1",
          contentJson,
          safetyJson: { noManagementAdvice: true, doctorReviewRequired: true, externalAi: false }
        },
        create: {
          code,
          title,
          specialtyGroup: group,
          condition: title,
          aliases: aliasesFor(baseCode),
          bodySystem: bodySystemFor(group),
          clinicalArea: group,
          implementationStatus: "catalog_only",
          riskLevel: riskLevelFor(baseCode),
          sourceName: "Women's Health Protocol Atlas catalog placeholder",
          sourceVersion: "catalog_v1",
          contentJson,
          safetyJson: { noManagementAdvice: true, doctorReviewRequired: true, externalAi: false }
        }
      });
    }
  }
}

function catalogOnlyContent() {
  return {
    summary: "Catalog entry only. Management snapshot not verified yet.",
    verifiedManagementAvailable: false,
    message: "Protocol is listed but management snapshot is not yet verified. Doctor review required. Add guideline source before using AI management options."
  };
}

function aliasesFor(code) {
  const title = toTitle(code);
  return [title, title.toLowerCase(), code.replaceAll("_", " ").toLowerCase()];
}

function toTitle(code) {
  return code
    .replace(/_CATALOG_V1$/, "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bodySystemFor(group) {
  if (group.includes("Breast")) return "Breast health";
  if (group.includes("Fetal") || group.includes("Antenatal") || group.includes("obstetrics") || group.includes("pregnancy") || group.includes("Labor") || group.includes("Postpartum")) return "Obstetrics";
  if (group.includes("pelvic floor") || group.includes("physiotherapy")) return "Pelvic floor";
  return "Gynecology";
}

function riskLevelFor(code) {
  if (code.includes("RED_FLAGS") || code.includes("EMERGENCY") || code.includes("RUPTURED") || code.includes("SEPSIS") || code.includes("ECLAMPSIA") || code.includes("TORSION") || code.includes("SELF_HARM")) return "emergency";
  if (code.includes("PREECLAMPSIA") || code.includes("ECTOPIC") || code.includes("HEMORRHAGE") || code.includes("CANCER") || code.includes("SEPTIC") || code.includes("HELLP")) return "high";
  return "medium";
}

module.exports = { seedWomensHealthProtocols };
