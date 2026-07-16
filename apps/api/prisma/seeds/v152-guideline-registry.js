const RETRIEVED_AT = new Date("2026-07-17T00:00:00.000Z");

const sources = {
  WHO: { name: "WHO Guideline Registry", organization: "World Health Organization", abbreviation: "WHO", websiteUrl: "https://www.who.int/publications/guidelines", sourceType: "OPEN_PUBLIC", countryOrRegion: "Global" },
  NICE: { name: "NICE Guidance", organization: "National Institute for Health and Care Excellence", abbreviation: "NICE", websiteUrl: "https://www.nice.org.uk/guidance", sourceType: "PUBLIC_RESTRICTED", countryOrRegion: "United Kingdom" },
  RCOG: { name: "RCOG Guidance", organization: "Royal College of Obstetricians and Gynaecologists", abbreviation: "RCOG", websiteUrl: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/", sourceType: "PUBLIC_RESTRICTED", countryOrRegion: "United Kingdom" },
  ESHRE: { name: "ESHRE Guidelines", organization: "European Society of Human Reproduction and Embryology", abbreviation: "ESHRE", websiteUrl: "https://www.eshre.eu/Guidelines%20and%20Legal.aspx", sourceType: "PUBLIC_RESTRICTED", countryOrRegion: "Europe" }
};

const documents = [
  row("WHO", "WHO recommendations on maternal health: guidelines approved by the WHO Guidelines Review Committee, 2nd ed", "obstetrics", "maternal health", "2025", "https://www.who.int/publications/i/item/9789240080591", "ACTIVE", "2025-03-21"),
  row("WHO", "WHO recommendations on antenatal care for a positive pregnancy experience", "obstetrics", "antenatal care", "2016 with updates", "https://www.who.int/publications/i/item/9789241549912", "ACTIVE", "2016-11-28"),

  ...nice("NG201", "Antenatal care", "obstetrics", "antenatal care"),
  ...nice("NG235", "Intrapartum care", "labor_delivery", "intrapartum care"),
  ...nice("NG194", "Postnatal care", "obstetrics", "postnatal care"),
  ...nice("NG192", "Caesarean birth", "labor_delivery", "caesarean birth"),
  ...nice("NG25", "Preterm labour and birth", "obstetrics", "preterm birth"),
  ...nice("NG207", "Inducing labour", "labor_delivery", "induction of labour"),
  ...nice("NG133", "Hypertension in pregnancy: diagnosis and management", "high_risk_obstetrics", "hypertension in pregnancy"),
  ...nice("NG126", "Ectopic pregnancy and miscarriage: diagnosis and initial management", "gynecology", "early pregnancy"),
  ...nice("NG88", "Heavy menstrual bleeding: assessment and management", "gynecology", "abnormal uterine bleeding"),
  ...nice("NG73", "Endometriosis: diagnosis and management", "gynecology", "endometriosis"),
  ...nice("NG23", "Menopause: identification and management", "menopause", "menopause"),
  ...nice("NG257", "Fertility problems: assessment and treatment", "fertility", "fertility assessment", "2026-03-31"),
  ...nice("NG140", "Abortion care", "gynecology", "abortion care"),
  ...nice("NG3", "Diabetes in pregnancy: management from preconception to the postnatal period", "high_risk_obstetrics", "diabetes in pregnancy"),
  ...nice("NG137", "Twin and triplet pregnancy", "high_risk_obstetrics", "multiple pregnancy"),
  ...nice("NG121", "Intrapartum care for women with existing medical conditions or obstetric complications and their babies", "labor_delivery", "complex intrapartum care"),
  ...nice("NG229", "Fetal monitoring in labour", "labor_delivery", "fetal monitoring"),
  ...nice("NG12", "Suspected cancer: recognition and referral", "preventive_oncology", "oncology concern"),

  ...rcog("76", "Management of Thyroid Disorders in Pregnancy", "high_risk_obstetrics", "thyroid disorders in pregnancy"),
  ...rcog("73", "Care of Women Presenting with Suspected Preterm Prelabour Rupture of Membranes from 24+0 Weeks of Gestation", "obstetrics", "PPROM"),
  ...rcog("72", "Care of Women with Obesity in Pregnancy", "high_risk_obstetrics", "obesity in pregnancy"),
  ...rcog("75", "Cervical cerclage", "obstetrics", "cervical cerclage"),
  ...rcog("74", "Antenatal corticosteroids to reduce neonatal morbidity and mortality", "obstetrics", "antenatal corticosteroids"),
  ...rcog("69", "The Management of Nausea and Vomiting of Pregnancy and Hyperemesis Gravidarum", "obstetrics", "hyperemesis"),
  ...rcog("64", "Identification and management of maternal sepsis during and following pregnancy", "emergency", "maternal sepsis"),
  ...rcog("57", "Reduced Fetal Movements", "obstetrics", "reduced fetal movement"),
  ...rcog("52", "Prevention and Management of Postpartum Haemorrhage", "emergency", "postpartum haemorrhage"),
  ...rcog("37a", "Reducing the Risk of Thrombosis and Embolism during Pregnancy and the Puerperium", "high_risk_obstetrics", "VTE prevention"),
  ...rcog("37b", "Thrombosis and Embolism during Pregnancy and the Puerperium: Acute Management", "emergency", "VTE acute management"),
  ...rcog("31", "Small-for-Gestational-Age Fetus and a Growth Restricted Fetus, Investigation and Care", "high_risk_obstetrics", "fetal growth restriction"),
  ...rcog("27a", "Placenta Praevia and Placenta Accreta: Diagnosis and Management", "high_risk_obstetrics", "placenta praevia and accreta"),
  ...rcog("21", "Diagnosis and Management of Ectopic Pregnancy", "gynecology", "ectopic pregnancy"),
  ...rcog("17", "Recurrent Miscarriage", "fertility", "recurrent pregnancy loss"),
  ...rcog("5", "The Management of Ovarian Hyperstimulation Syndrome", "fertility", "OHSS"),
  ...rcog("41", "The Initial Management of Chronic Pelvic Pain", "gynecology", "pelvic pain"),
  ...rcog("62", "Management of Suspected Ovarian Masses in Premenopausal Women", "gynecology", "ovarian mass"),
  ...rcog("34", "Ovarian Cysts in Postmenopausal Women", "menopause", "ovarian cyst"),
  ...rcog("67", "Management of Endometrial Hyperplasia", "gynecology", "endometrial hyperplasia"),
  ...rcog("58", "Vulval Skin Disorders, Management", "dermatology", "vulvar dermatoses", null, "ARCHIVED"),

  ...eshre("Ovarian Stimulation", "fertility", "ovarian stimulation", "2025"),
  ...eshre("Female Fertility Preservation", "fertility", "fertility preservation", "2020"),
  ...eshre("Premature Ovarian Insufficiency", "fertility", "premature ovarian insufficiency", "2024"),
  ...eshre("Embryo Transfer", "fertility", "embryo transfer", "2023"),
  ...eshre("Unexplained Infertility", "fertility", "unexplained infertility", "2023"),
  ...eshre("Recurrent Pregnancy Loss", "fertility", "recurrent pregnancy loss", "2023"),
  ...eshre("Polycystic Ovary Syndrome", "fertility", "PCOS", "2023"),
  ...eshre("Endometriosis", "gynecology", "endometriosis", "2022"),
  ...eshre("Number of embryos to transfer during IVF/ICSI", "fertility", "embryo transfer", "2023"),
  ...eshre("Female Genital Anomalies", "gynecology", "genital anomalies", "2016"),
  ...eshre("Routine psychosocial care in infertility and medically assisted reproduction", "fertility", "psychosocial care", "2015"),
  ...eshre("Good practice recommendations for ultrasound in assisted reproduction", "ultrasound", "ART ultrasound", "current registry"),
  ...eshre("Oocyte Retrieval", "fertility", "oocyte retrieval", "2019"),
  ...eshre("Ectopic Pregnancy", "gynecology", "ectopic pregnancy", "2020"),
  ...eshre("Recurrent Implantation Failure", "fertility", "implantation failure", "2023")
];

async function seedV152GuidelineRegistry(prisma) {
  const sourceRows = {};
  for (const [key, data] of Object.entries(sources)) {
    sourceRows[key] = await prisma.guidelineSource.upsert({
      where: { name: data.name },
      update: { ...data, specialties: ["women_health", "obstetrics", "gynecology", "fertility"], defaultAccessLevel: "OWNER_DOCTOR", status: "active", active: true, notes: "Official registry metadata. Store full text only when licence permits; otherwise retain link-only metadata." },
      create: { ...data, specialties: ["women_health", "obstetrics", "gynecology", "fertility"], defaultAccessLevel: "OWNER_DOCTOR", status: "active", active: true, notes: "Official registry metadata. Store full text only when licence permits; otherwise retain link-only metadata." }
    });
  }
  let created = 0; let updated = 0;
  for (const item of documents) {
    const source = sourceRows[item.sourceKey];
    const existing = await prisma.guidelineDocument.findFirst({ where: { sourceId: source.id, title: { equals: item.title, mode: "insensitive" }, versionLabel: item.versionLabel } });
    const data = { sourceId: source.id, title: item.title, specialty: item.specialty, topic: item.topic, organization: source.organization, publicationDate: item.publicationDate, versionLabel: item.versionLabel, guidelineStatus: item.guidelineStatus, documentType: "official_metadata_link", licenseStatus: "LINK_ONLY", originalUrl: item.originalUrl, downloadsAllowed: false, reviewStatus: item.reviewStatus, citationLabel: `${source.abbreviation} · ${item.versionLabel}`, accessLevel: "CLINICAL_TEAM" };
    if (existing) { await prisma.guidelineDocument.update({ where: { id: existing.id }, data: preserveAssetFields(data) }); updated += 1; }
    else { await prisma.guidelineDocument.create({ data }); created += 1; }
  }
  return { targetDocuments: documents.length, created, updated, retrievedAt: RETRIEVED_AT.toISOString() };
}

function preserveAssetFields(data) { return data; }
function row(sourceKey, title, specialty, topic, versionLabel, originalUrl, guidelineStatus = "NEEDS_REVIEW", publicationDate = null) { return { sourceKey, title, specialty, topic, versionLabel, originalUrl, guidelineStatus, publicationDate: publicationDate ? new Date(`${publicationDate}T00:00:00.000Z`) : null, reviewStatus: guidelineStatus === "ARCHIVED" ? "SOURCE_VERIFIED_ARCHIVED_METADATA" : guidelineStatus === "ACTIVE" ? "SOURCE_VERIFIED_METADATA" : "SOURCE_METADATA_NEEDS_DOCUMENT_LINK_REVIEW" }; }
function nice(code, title, specialty, topic, publicationDate = null) { return [row("NICE", title, specialty, topic, code, `https://www.nice.org.uk/guidance/${code.toLowerCase()}`, "ACTIVE", publicationDate)]; }
function rcog(code, title, specialty, topic, publicationDate = null, status = "NEEDS_REVIEW") { return [row("RCOG", `${title} (Green-top Guideline No. ${code})`, specialty, topic, `Green-top ${code}`, "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/", status, publicationDate)]; }
function eshre(title, specialty, topic, version) { return [row("ESHRE", title, specialty, topic, version, "https://www.eshre.eu/Guidelines%20and%20Legal.aspx", "ACTIVE")]; }

module.exports = { seedV152GuidelineRegistry, v152GuidelineRegistryDocuments: documents, v152GuidelineRegistrySources: sources };
