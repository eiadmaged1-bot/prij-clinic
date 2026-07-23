const RETRIEVED_AT = new Date("2026-07-17T00:00:00.000Z");
const NICE = "National Institute for Health and Care Excellence";
const RCOG = "Royal College of Obstetricians and Gynaecologists";
const ESHRE = "European Society of Human Reproduction and Embryology";
const WHO = "World Health Organization";

const sources = {
  NG201: source("NICE-NG201", NICE, "NG201", "https://www.nice.org.uk/guidance/ng201"),
  NG235: source("NICE-NG235", NICE, "NG235", "https://www.nice.org.uk/guidance/ng235"),
  NG194: source("NICE-NG194", NICE, "NG194", "https://www.nice.org.uk/guidance/ng194"),
  NG133: source("NICE-NG133", NICE, "NG133", "https://www.nice.org.uk/guidance/ng133"),
  NG25: source("NICE-NG25", NICE, "NG25", "https://www.nice.org.uk/guidance/ng25"),
  NG126: source("NICE-NG126", NICE, "NG126", "https://www.nice.org.uk/guidance/ng126"),
  NG88: source("NICE-NG88", NICE, "NG88", "https://www.nice.org.uk/guidance/ng88"),
  NG73: source("NICE-NG73", NICE, "NG73", "https://www.nice.org.uk/guidance/ng73"),
  NG23: source("NICE-NG23", NICE, "NG23", "https://www.nice.org.uk/guidance/ng23"),
  NG257: source("NICE-NG257", NICE, "NG257 (31 March 2026)", "https://www.nice.org.uk/guidance/ng257"),
  NG140: source("NICE-NG140", NICE, "NG140", "https://www.nice.org.uk/guidance/ng140"),
  NG3: source("NICE-NG3", NICE, "NG3", "https://www.nice.org.uk/guidance/ng3"),
  NG137: source("NICE-NG137", NICE, "NG137", "https://www.nice.org.uk/guidance/ng137"),
  NG207: source("NICE-NG207", NICE, "NG207", "https://www.nice.org.uk/guidance/ng207"),
  NG12: source("NICE-NG12", NICE, "NG12", "https://www.nice.org.uk/guidance/ng12"),
  NG192: source("NICE-NG192", NICE, "NG192", "https://www.nice.org.uk/guidance/ng192"),
  RCOG: source("RCOG-GREEN-TOP-REGISTRY", RCOG, "current Green-top registry", "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/"),
  ESHRE: source("ESHRE-GUIDELINE-REGISTRY", ESHRE, "current guideline registry", "https://www.eshre.eu/Guidelines%20and%20Legal.aspx"),
  WHO_ANC: source("WHO-9789241549912", WHO, "2016 with listed updates", "https://www.who.int/publications/i/item/9789241549912"),
  WHO_MATERNAL: source("WHO-9789240080591", WHO, "2nd edition, 21 March 2025", "https://www.who.int/publications/i/item/9789240080591")
};

const protocolReferences = [
  p("FIRST_ANTENATAL_VISIT_REF", "First antenatal visit", "Routine obstetrics", "antenatal booking", "NG201", "Antenatal care: booking appointment", ["OBSTETRIC"]),
  p("ROUTINE_ANC_FOLLOW_UP_REF", "Routine antenatal follow-up", "Routine obstetrics", "antenatal follow-up", "NG201", "Antenatal care: schedule of appointments", ["OBSTETRIC"]),
  p("DATING_EDD_REF", "Pregnancy dating and EDD reference", "Routine obstetrics", "pregnancy dating", "NG201", "Antenatal care: gestational age assessment", ["OBSTETRIC"]),
  p("ANTENATAL_SCREENING_REF", "Antenatal screening schedule reference", "Routine obstetrics", "antenatal screening", "NG201", "Antenatal care: screening programmes", ["OBSTETRIC"]),
  p("ANAEMIA_PREGNANCY_REF", "Anaemia in pregnancy reference", "Routine obstetrics", "anaemia", "WHO_ANC", "Maternal assessment and nutrition sections", ["OBSTETRIC", "HIGH_RISK_OBSTETRIC"]),
  p("GDM_SCREENING_REF", "Gestational diabetes screening reference", "Routine obstetrics", "gestational diabetes screening", "NG3", "Diabetes in pregnancy: gestational diabetes", ["OBSTETRIC", "HIGH_RISK_OBSTETRIC"]),
  p("REDUCED_FETAL_MOVEMENT_REF", "Reduced fetal movement reference", "Routine obstetrics", "reduced fetal movement", "RCOG", "Green-top Guideline No. 57 registry entry", ["OBSTETRIC", "HIGH_RISK_OBSTETRIC"], "high"),
  p("RH_NEGATIVE_REF", "Rh-negative pregnancy reference", "Routine obstetrics", "rhesus prophylaxis", "NG201", "Antenatal care: rhesus D status", ["OBSTETRIC"]),
  p("POST_TERM_REF", "Post-term pregnancy reference", "Routine obstetrics", "post-term pregnancy", "NG207", "Inducing labour: pregnancy lasting longer than 41 weeks", ["OBSTETRIC"]),

  p("HYPERTENSION_PREECLAMPSIA_REF", "Hypertension and pre-eclampsia assessment reference", "High-risk obstetrics", "hypertension in pregnancy", "NG133", "Hypertension in pregnancy: assessment and management sections", ["HIGH_RISK_OBSTETRIC"], "high"),
  p("GDM_MONITORING_REF", "Gestational diabetes monitoring reference", "High-risk obstetrics", "gestational diabetes monitoring", "NG3", "Diabetes in pregnancy: antenatal care", ["HIGH_RISK_OBSTETRIC"], "high"),
  p("FGR_REF", "Fetal growth restriction reference", "High-risk obstetrics", "fetal growth restriction", "RCOG", "Green-top Guideline No. 31 registry entry", ["HIGH_RISK_OBSTETRIC"], "high"),
  p("MULTIPLE_PREGNANCY_REF", "Multiple pregnancy reference", "High-risk obstetrics", "multiple pregnancy", "NG137", "Twin and triplet pregnancy", ["HIGH_RISK_OBSTETRIC"], "high"),
  p("PLACENTA_PRAEVIA_ACCRETA_REF", "Placenta praevia and accreta referral reference", "High-risk obstetrics", "placenta praevia and accreta", "RCOG", "Green-top Guideline No. 27a registry entry", ["HIGH_RISK_OBSTETRIC"], "high"),
  p("PRETERM_LABOUR_REF", "Preterm-labour assessment reference", "High-risk obstetrics", "preterm labour", "NG25", "Preterm labour and birth: diagnosis and care", ["HIGH_RISK_OBSTETRIC"], "high"),
  p("PPROM_REF", "PPROM reference", "High-risk obstetrics", "PPROM", "RCOG", "Green-top Guideline No. 73 registry entry", ["HIGH_RISK_OBSTETRIC"], "high"),
  p("MATERNAL_SEPSIS_REF", "Maternal sepsis reference", "High-risk obstetrics", "maternal sepsis", "RCOG", "Green-top Guideline No. 64 registry entry", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM"], "emergency"),
  p("PPH_REF", "Postpartum haemorrhage prevention and response reference", "High-risk obstetrics", "postpartum haemorrhage", "WHO_MATERNAL", "Maternal complications: postpartum haemorrhage", ["HIGH_RISK_OBSTETRIC", "POSTPARTUM"], "emergency"),
  p("POSTPARTUM_FOLLOW_UP_REF", "Postpartum follow-up reference", "High-risk obstetrics", "postpartum follow-up", "NG194", "Postnatal care: maternal health", ["POSTPARTUM"]),

  p("PUL_REF", "Pregnancy of unknown location reference", "Early pregnancy", "pregnancy of unknown location", "NG126", "Ectopic pregnancy and miscarriage: pregnancy of unknown location", ["OBSTETRIC"], "high"),
  p("ECTOPIC_ASSESSMENT_REF", "Ectopic-pregnancy assessment reference", "Early pregnancy", "ectopic pregnancy", "NG126", "Ectopic pregnancy: assessment and diagnosis", ["OBSTETRIC"], "emergency"),
  p("EARLY_PREGNANCY_LOSS_REF", "Early pregnancy loss reference", "Early pregnancy", "miscarriage", "NG126", "Miscarriage: diagnosis and management", ["OBSTETRIC"]),
  p("RPL_REF", "Recurrent pregnancy loss reference", "Early pregnancy", "recurrent pregnancy loss", "ESHRE", "Recurrent Pregnancy Loss guideline 2023", ["INFERTILITY", "OBSTETRIC"]),
  p("HYPEREMESIS_REF", "Hyperemesis reference", "Early pregnancy", "hyperemesis", "RCOG", "Green-top Guideline No. 69 registry entry", ["OBSTETRIC"], "high"),

  p("AUB_REF", "Abnormal uterine bleeding reference", "Gynecology", "abnormal uterine bleeding", "NG88", "Heavy menstrual bleeding: assessment and management", ["GYNECOLOGY"]),
  p("POSTMENOPAUSAL_BLEEDING_REF", "Postmenopausal bleeding reference", "Gynecology", "postmenopausal bleeding", "NG12", "Suspected cancer: gynaecological cancers", ["GYNECOLOGY", "PREVENTIVE_WELL_WOMAN"], "high"),
  p("PELVIC_PAIN_REF", "Pelvic pain reference", "Gynecology", "pelvic pain", "RCOG", "Green-top Guideline No. 41 registry entry", ["GYNECOLOGY"]),
  p("ENDOMETRIOSIS_REF", "Endometriosis reference", "Gynecology", "endometriosis", "NG73", "Endometriosis: diagnosis and management", ["GYNECOLOGY", "INFERTILITY"]),
  p("FIBROID_ASSESSMENT_REF", "Fibroid assessment reference", "Gynecology", "fibroids", "NG88", "Heavy menstrual bleeding: fibroids", ["GYNECOLOGY"]),
  p("ADNEXAL_MASS_REF", "Adnexal mass reference", "Gynecology", "adnexal mass", "RCOG", "Green-top Guideline No. 62 registry entry", ["GYNECOLOGY"], "high"),
  p("OVARIAN_CYST_FOLLOW_UP_REF", "Ovarian cyst follow-up reference", "Gynecology", "ovarian cyst", "RCOG", "Green-top Guideline No. 34 and No. 62 registry entries", ["GYNECOLOGY", "POSTPARTUM"]),
  p("ENDOMETRIAL_HYPERPLASIA_REF", "Endometrial hyperplasia reference", "Gynecology", "endometrial hyperplasia", "RCOG", "Green-top Guideline No. 67 registry entry", ["GYNECOLOGY"], "high"),
  p("MENOPAUSE_REF", "Menopause reference", "Gynecology", "menopause", "NG23", "Menopause: identification and management", ["GYNECOLOGY", "PREVENTIVE_WELL_WOMAN"]),
  p("ABORTION_CARE_REF", "Abortion care reference", "Gynecology", "abortion care", "NG140", "Abortion care", ["GYNECOLOGY", "OBSTETRIC"]),

  p("INITIAL_INFERTILITY_WORKUP_REF", "Initial infertility workup reference", "Fertility", "initial infertility assessment", "NG257", "Fertility problems: initial assessment", ["INFERTILITY"]),
  p("OVULATION_ASSESSMENT_REF", "Ovulation assessment reference", "Fertility", "ovulation assessment", "NG257", "Fertility problems: ovulation disorders", ["INFERTILITY"]),
  p("OVARIAN_RESERVE_REF", "Ovarian reserve reference", "Fertility", "ovarian reserve", "NG257", "Fertility problems: investigation", ["INFERTILITY"]),
  p("SEMEN_ANALYSIS_REF", "Semen-analysis workflow reference", "Fertility", "semen analysis", "NG257", "Fertility problems: male factor assessment", ["INFERTILITY"]),
  p("TUBAL_ASSESSMENT_REF", "Tubal assessment reference", "Fertility", "tubal assessment", "NG257", "Fertility problems: tubal investigation", ["INFERTILITY"]),
  p("PCOS_FERTILITY_REF", "PCOS fertility pathway reference", "Fertility", "PCOS fertility", "ESHRE", "International evidence-based PCOS guideline 2023", ["INFERTILITY"]),
  p("OVULATION_INDUCTION_MONITORING_REF", "Ovulation induction monitoring reference", "Fertility", "ovulation induction monitoring", "NG257", "Fertility problems: ovulation disorders", ["INFERTILITY"]),
  p("IUI_MONITORING_REF", "IUI monitoring reference", "Fertility", "IUI monitoring", "NG257", "Fertility problems: intrauterine insemination", ["INFERTILITY"]),
  p("IVF_ICSI_MONITORING_REF", "IVF and ICSI monitoring reference", "Fertility", "IVF ICSI monitoring", "ESHRE", "Ovarian Stimulation guideline 2025", ["INFERTILITY"]),
  p("OHSS_ASSESSMENT_REF", "OHSS assessment reference", "Fertility", "OHSS", "RCOG", "Green-top Guideline No. 5 registry entry", ["INFERTILITY"], "emergency"),
  p("FERTILITY_PRESERVATION_REF", "Fertility preservation reference", "Fertility", "fertility preservation", "ESHRE", "Female Fertility Preservation guideline 2020", ["INFERTILITY"]),

  p("CONTRACEPTION_CONSULT_REF", "Contraception consultation reference", "Other women's health", "contraception", "WHO_MATERNAL", "Sexual and reproductive health recommendations index", ["GYNECOLOGY", "PREVENTIVE_WELL_WOMAN"]),
  p("VULVAR_DERM_ESCALATION_REF", "Vulvar dermatology escalation reference", "Other women's health", "vulvar dermatoses", "RCOG", "Green-top Guideline No. 58 archived registry entry", ["GYNECOLOGY"], "high", "ARCHIVED"),
  p("PREOPERATIVE_ASSESSMENT_REF", "Caesarean birth preoperative reference", "Other women's health", "caesarean preoperative assessment", "NG192", "Caesarean birth: preoperative preparation", ["OBSTETRIC"]),
  p("POSTOPERATIVE_REVIEW_REF", "Caesarean birth postoperative review reference", "Other women's health", "caesarean postoperative review", "NG192", "Caesarean birth: recovery and postnatal care", ["POSTPARTUM", "OBSTETRIC"]),
  p("ONCOLOGY_CONCERN_REF", "Oncology concern and referral reference", "Other women's health", "oncology concern", "NG12", "Suspected cancer: gynaecological cancers", ["GYNECOLOGY", "PREVENTIVE_WELL_WOMAN"], "high"),
  p("MEDICATION_SAFETY_REVIEW_REF", "Medication-safety review reference", "Other women's health", "medication safety", "WHO_MATERNAL", "Maternal health recommendations: medicine-related sections", ["OTHER"])
];

async function seedV152ProtocolReferences(prisma) {
  let created = 0; let updated = 0;
  for (const item of protocolReferences) {
    const sourceRow = sources[item.sourceKey];
    const contentJson = content(item, sourceRow);
    const questionnaire = questionnaireFor(item, sourceRow);
    const safePublicationState = item.publicationState === "ARCHIVED" ? "ARCHIVED" : "LOCAL_DRAFT";
    const data = {
      title: item.title, specialtyGroup: item.group, condition: item.condition,
      aliases: [item.title, item.condition], bodySystem: "Women's health", clinicalArea: item.group,
      protocolType: "source_verified_reference", implementationStatus: item.publicationState === "ARCHIVED" ? "retired" : "catalog_only",
      publicationState: safePublicationState, riskLevel: item.riskLevel,
      sourceName: sourceRow.organization, sourceYear: yearFrom(sourceRow.version), sourceUrl: sourceRow.url,
      sourceVersion: sourceRow.version, sourceIdentifier: sourceRow.identifier, sourceRetrievedAt: RETRIEVED_AT,
      sourceCitationsJson: [{ sourceIdentifier: sourceRow.identifier, sourceTitle: sourceRow.organization, version: sourceRow.version, sourceUrl: sourceRow.url, section: item.section, page: null, pageUnavailableReason: "Official web/registry section citation; no local page is claimed." }],
      patientTypesJson: item.patientTypes, locallyCustomized: false, contentJson,
      safetyJson: { referenceOnly: true, noAutomaticDiagnosis: true, noAutomaticOrdering: true, noAutomaticPrescribing: true, noDoseSelection: true, patientConfirmationRequired: true, doctorReviewRequired: true },
      completionQuestionnaireJson: questionnaire, connectionsJson: { patientTypes: item.patientTypes, investigationPreviewOnly: true, medicationReferenceOnly: true, ultrasoundTemplatePreviewOnly: true }, completionPercentage: 100,
      sourceDocumentId: null, exactPageCitationsJson: null, publicationApprovedByUserId: null, publicationApprovedAt: null
    };
    const existing = await prisma.clinicalProtocol.findUnique({ where: { code: item.code } });
    const protocol = existing ? await prisma.clinicalProtocol.update({ where: { code: item.code }, data }) : await prisma.clinicalProtocol.create({ data: { code: item.code, ...data } });
    existing ? updated += 1 : created += 1;
    await prisma.clinicalProtocolVersion.upsert({
      where: { protocolId_versionLabel_sourceIdentifier: { protocolId: protocol.id, versionLabel: sourceRow.version, sourceIdentifier: sourceRow.identifier } },
      update: { publicationState: safePublicationState, sourceName: sourceRow.organization, sourceUrl: sourceRow.url, sourceRetrievedAt: RETRIEVED_AT, contentJson, sourceCitationsJson: data.sourceCitationsJson },
      create: { protocolId: protocol.id, versionLabel: sourceRow.version, publicationState: safePublicationState, sourceIdentifier: sourceRow.identifier, sourceName: sourceRow.organization, sourceUrl: sourceRow.url, sourceRetrievedAt: RETRIEVED_AT, contentJson, sourceCitationsJson: data.sourceCitationsJson }
    });
  }
  return { target: protocolReferences.length, created, updated };
}

function source(identifier, organization, version, url) { return { identifier, organization, version, url }; }
function p(code, title, group, condition, sourceKey, section, patientTypes, riskLevel = "medium", publicationState = "SOURCE_VERIFIED_REFERENCE") { return { code, title, group, condition, sourceKey, section, patientTypes, riskLevel, publicationState }; }
function yearFrom(version) { const match = String(version).match(/20\d{2}/); return match ? Number(match[0]) : null; }
function content(item, sourceRow) { return {
  purpose: `Provide a governed source-navigation reference for ${item.condition}.`,
  scope: [`Doctor-reviewed women’s-health reference; patient-specific decisions remain in the encounter.`],
  entryCriteria: [`Open when an authorized clinician needs the official ${item.condition} source during assessment or review.`],
  exclusions: ["Not a diagnosis, order set, prescription, dose, signed plan, or substitute for the current source."],
  requiredInformation: ["Confirm patient identity, active encounter, relevant clinical context, consent, and source currency before use."],
  redFlags: [`Review the source section “${item.section}” for its current escalation criteria; this card does not restate or infer them.`],
  assessmentSteps: ["Open the official source.", `Navigate to “${item.section}”.`, "Confirm version and population, then document independent clinical judgment in the encounter."],
  investigations: ["No investigation is selected or ordered. Open linked investigation tools only after Doctor confirmation."],
  medicationClasses: ["No medicine or dose is selected. Open the Drug Atlas for official label reference and patient-context review."],
  ultrasoundLinks: ["No scan is ordered. A relevant ultrasound template may be previewed only after Doctor selection."],
  referralEscalation: ["Use the current source and clinic governance to record any referral or escalation decision."],
  followUp: ["Record responsible clinician, follow-up task, and patient communication in the encounter when applicable."],
  patientInformation: ["Use source-approved patient information where available and document clinician review."],
  sourceCitations: [{ sourceIdentifier: sourceRow.identifier, source: sourceRow.organization, version: sourceRow.version, section: item.section, page: null }],
  version: sourceRow.version, updateDate: RETRIEVED_AT.toISOString().slice(0, 10), relatedProtocols: [],
  summary: `Source-verified reference navigation for ${item.condition}. Doctor review required.`, verifiedManagementAvailable: false,
  goals: ["Open and verify the official source before patient-specific use."], options: [], safetyChecks: ["Doctor review required before any patient-specific action."], contraindicationChecks: [], followUpConsiderations: ["Document follow-up only in the patient encounter."], referralConsiderations: ["Clinician confirms referral criteria against the current source."], limitations: ["Reference only; no autonomous clinical action."]
}; }
function questionnaireFor(item, sourceRow) { return Object.fromEntries(["scope", "inclusion", "exclusion", "requiredHistory", "examination", "investigations", "redFlags", "management", "medicationConsiderations", "followUp", "escalationReferral", "counselling", "sourceVersion", "clinicWorkflow", "reviewer", "approval"].map((key) => [key, key === "sourceVersion" ? [`${sourceRow.identifier} · ${sourceRow.version} · ${item.section}`] : ["Source reference structure present; patient-specific or local workflow decisions require separate authorized approval."]])); }

module.exports = { seedV152ProtocolReferences, v152ProtocolReferences: protocolReferences, v152ProtocolSources: sources };
