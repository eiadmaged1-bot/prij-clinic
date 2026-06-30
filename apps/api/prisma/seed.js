const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { loadRootEnv } = require("./env");

loadRootEnv();

const { PrismaClient } = require("@prisma/client");
const { seedCalculatorFormulas } = require("./seeds/calculator-formulas");
const { seedWomensHealthProtocols } = require("./seeds/womens-health-protocols");
const { seedEmergencyObProtocols } = require("./seeds/womens-health-emergency-protocols");
const { seedAubMenstrualProtocols } = require("./seeds/womens-health-aub-menstrual-protocols");
const { seedContraceptionProtocols } = require("./seeds/womens-health-contraception-protocols");
const { seedAntenatalRoutineProtocols } = require("./seeds/womens-health-antenatal-routine-protocols");

const scrypt = promisify(crypto.scrypt);
const prisma = new PrismaClient();
const appEnv = process.env.APP_ENV || (process.env.NODE_ENV === "production" ? "production" : "local");
const isProduction = appEnv === "production";
const seedDemoData = !isProduction && process.env.SEED_DEMO_DATA !== "false";

if (isProduction && (process.env.SEED_DEMO_DATA === "true" || process.env.SEED_DEMO_OWNER === "true")) {
  throw new Error("Production seed refuses demo data. Set SEED_DEMO_DATA=false and SEED_DEMO_OWNER=false.");
}

for (const [name, value] of Object.entries({
  DEMO_OWNER_PASSWORD: process.env.DEMO_OWNER_PASSWORD,
  DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD,
  DEMO_TEST_PASSWORD: process.env.DEMO_TEST_PASSWORD
})) {
  if (isProduction && (value === "eyad" || value === "LocalDev123!")) {
    throw new Error(`${name} uses a local demo password and is forbidden in production.`);
  }
}

const roles = [
  ["Owner", "Demo-only owner role for clinic governance and Sprint 1 setup."],
  ["Admin", "Role for user, role, permission, audit, and branch administration."],
  ["Doctor", "Foundation role for future doctor workflows."],
  ["Nurse", "Foundation role for future nursing workflows."],
  ["Receptionist", "Foundation role for future front-desk workflows."],
  ["Accountant", "Foundation role for future billing workflows."]
];

const permissions = [
  "patient.read",
  "patient.create",
  "patient.update",
  "patients.read",
  "patients.manage",
  "patient.consent_read",
  "patient.consent_manage",
  "patient.consent_override",
  "appointment.read",
  "appointment.manage",
  "appointments.read",
  "appointments.manage",
  "appointment.cancel",
  "appointment.no_show",
  "queue.read",
  "queue.manage",
  "queue.status_update",
  "vitals.create",
  "prep_note.create",
  "prep_note.read",
  "encounter.read",
  "encounter.create",
  "encounter.update_own",
  "encounter.sign",
  "encounter.correct_signed",
  "encounter.export",
  "encounters.read",
  "encounters.manage",
  "prescription.read",
  "prescription.create",
  "prescription.update",
  "prescription.approve",
  "prescription.cancel",
  "prescription.export",
  "prescriptions.read",
  "prescriptions.manage",
  "investigation.read",
  "investigation.create",
  "investigation.update",
  "investigation.cancel",
  "investigation.review",
  "investigations.read",
  "investigations.manage",
  "report.read",
  "report.upload",
  "report.update",
  "report.review",
  "report.export",
  "report.void",
  "report.delete",
  "reports.read",
  "reports.manage",
  "pregnancy.read",
  "pregnancy.manage",
  "ob_ultrasound.read",
  "ob_ultrasound.manage",
  "billing.read",
  "billing.manage",
  "payment.manage",
  "billing.adjust",
  "billing.void",
  "billing.report",
  "dashboard.read",
  "guidelines.read",
  "guidelines.search",
  "guidelines.upload",
  "guidelines.import",
  "guidelines.review",
  "guidelines.manage_sources",
  "guidelines.manage_private",
  "guidelines.delete_or_archive",
  "ai_draft.request",
  "ai_draft.read",
  "ai_draft.review",
  "ai_draft.approve",
  "ai_draft.reject",
  "protocol_atlas.read",
  "protocol_atlas.manage",
  "guideline.read",
  "guideline.manage",
  "guideline.review",
  "ai_management.request",
  "ai_management.read",
  "ai_management.review",
  "ai_management.memory_save",
  "calculator.read",
  "calculator.calculate",
  "calculator.review",
  "calculator.manage",
  "user.read",
  "user.manage",
  "role.read",
  "role.manage",
  "permission.read",
  "clinic_settings.manage",
  "branch.manage",
  "audit.read",
  "audit.export",
  "backup.manage",
  "restore_test.manage",
  "backup.metadata_read",
  "security.review",
  "session.manage",
  "config.read_safe",
  "system_owner.manage",
  "developer_owner.manage"
];

const medicationPermissions = [
  "medications.read",
  "medications.search",
  "medications.manage_catalog",
  "medications.manage_sources",
  "medications.import",
  "medications.verify",
  "medications.safety_check",
  "medications.review_alerts",
  "medications.override_alerts",
  "patient_medications.read",
  "patient_medications.write",
  "patient_allergies.read",
  "patient_allergies.write",
  "drug_market.read",
  "drug_market.search",
  "drug_market.import",
  "drug_market.verify",
  "drug_market.manage_sources",
  "drug_market.manage_countries",
  "drug_market.manage_products",
  "drug_market.review_queue",
  "drug_market.automation"
];

permissions.push(...medicationPermissions);

const reservedSystemOwnerPermissions = ["system_owner.manage", "developer_owner.manage"];

const rolePermissionKeys = {
  Owner: permissions,
  Admin: [
    "user.read",
    "user.manage",
    "role.read",
    "role.manage",
    "permission.read",
    "clinic_settings.manage",
    "branch.manage",
    "audit.read",
    "calculator.read",
    "calculator.manage",
    "guidelines.read",
    "guidelines.search",
    "protocol_atlas.read",
    "protocol_atlas.manage",
    "guideline.read",
    "guideline.manage",
    "guideline.review",
    "ai_management.read",
    "medications.read",
    "medications.search",
    "medications.manage_catalog",
    "medications.manage_sources",
    "medications.import",
    "medications.verify",
    "medications.safety_check",
    "medications.review_alerts",
    "medications.override_alerts",
    "patient_medications.read",
    "patient_medications.write",
    "patient_allergies.read",
    "patient_allergies.write",
    "drug_market.read",
    "drug_market.search",
    "drug_market.import",
    "drug_market.verify",
    "drug_market.manage_sources",
    "drug_market.manage_countries",
    "drug_market.manage_products",
    "drug_market.review_queue",
    "drug_market.automation"
  ],
  Doctor: [
    "patient.read",
    "patients.read",
    "patients.manage",
    "patient.consent_read",
    "appointment.read",
    "appointments.read",
    "queue.read",
    "prep_note.read",
    "encounter.read",
    "encounter.create",
    "encounter.update_own",
    "encounter.sign",
    "encounter.correct_signed",
    "encounters.read",
    "encounters.manage",
    "prescription.read",
    "prescription.create",
    "prescription.update",
    "prescription.approve",
    "prescription.cancel",
    "prescriptions.read",
    "prescriptions.manage",
    "investigation.read",
    "investigation.create",
    "investigation.update",
    "investigation.review",
    "investigations.read",
    "investigations.manage",
    "report.read",
    "report.upload",
    "report.review",
    "reports.read",
    "reports.manage",
    "pregnancy.read",
    "pregnancy.manage",
    "ob_ultrasound.read",
    "ob_ultrasound.manage",
    "calculator.read",
    "calculator.calculate",
    "calculator.review",
    "guidelines.read",
    "guidelines.search",
    "guidelines.upload",
    "ai_draft.request",
    "ai_draft.read",
    "ai_draft.review",
    "ai_draft.approve",
    "ai_draft.reject",
    "protocol_atlas.read",
    "guideline.read",
    "guideline.review",
    "ai_management.request",
    "ai_management.read",
    "ai_management.review",
    "ai_management.memory_save",
    "medications.read",
    "medications.search",
    "medications.safety_check",
    "medications.review_alerts",
    "medications.override_alerts",
    "patient_medications.read",
    "patient_medications.write",
    "patient_allergies.read",
    "patient_allergies.write",
    "drug_market.read",
    "drug_market.search"
  ],
  Nurse: [
    "patient.read",
    "patients.read",
    "appointment.read",
    "appointments.read",
    "queue.read",
    "queue.status_update",
    "vitals.create",
    "prep_note.create",
    "prep_note.read",
    "encounter.read",
    "encounters.read",
    "report.read",
    "reports.read",
    "pregnancy.read",
    "ob_ultrasound.read",
    "patient_medications.read",
    "patient_medications.write",
    "patient_allergies.read",
    "patient_allergies.write",
    "medications.read",
    "medications.search",
    "drug_market.read",
    "drug_market.search"
  ],
  Receptionist: [
    "patient.read",
    "patient.create",
    "patient.update",
    "patients.read",
    "patients.manage",
    "patient.consent_read",
    "patient.consent_manage",
    "appointment.read",
    "appointment.manage",
    "appointments.read",
    "appointments.manage",
    "appointment.cancel",
    "appointment.no_show",
    "queue.read",
    "queue.manage",
    "queue.status_update",
    "payment.manage"
  ],
  Accountant: [
    "billing.read",
    "billing.manage",
    "payment.manage",
    "billing.adjust",
    "billing.void",
    "billing.report",
    "dashboard.read",
    "patient.read"
  ]
};

const guidelineSources = [
  ["WHO Guideline Registry", "WHO", "https://www.who.int/publications/guidelines", "OPEN_PUBLIC", "Global", ["obstetrics", "gynecology", "general medicine"], "Registry only. Import only direct public documents when license and access allow."],
  ["NICE Guidance", "NICE", "https://www.nice.org.uk/guidance", "PUBLIC_RESTRICTED", "United Kingdom", ["obstetrics", "gynecology", "general medicine"], "Public guidance registry. Check reuse terms before importing content."],
  ["RCOG Guidance", "RCOG", "https://www.rcog.org.uk/guidance/", "PUBLIC_RESTRICTED", "United Kingdom", ["obstetrics", "gynecology"], "Registry only. Some content or reuse may require review."],
  ["ACOG Clinical Guidance", "ACOG", "https://www.acog.org/clinical", "PUBLIC_RESTRICTED", "United States", ["obstetrics", "gynecology"], "Registry only. Do not bypass member, login, or subscription access."],
  ["FIGO Guidance", "FIGO", "https://www.figo.org/resources", "OPEN_PUBLIC", "Global", ["obstetrics", "gynecology"], "Registry only. Import direct public resources only after access review."],
  ["ESHRE Guidelines", "ESHRE", "https://www.eshre.eu/Guidelines-and-Legal/Guidelines", "PUBLIC_RESTRICTED", "Europe", ["fertility", "gynecology"], "Registry only. Check guideline license and reuse terms before import."],
  ["ASRM Practice Guidance", "ASRM", "https://www.asrm.org/practice-guidance/", "PUBLIC_RESTRICTED", "United States", ["fertility", "gynecology"], "Registry only. Some materials may be restricted."],
  ["SMFM Publications and Guidelines", "SMFM", "https://www.smfm.org/publications", "PUBLIC_RESTRICTED", "United States", ["obstetrics"], "Registry only. Check public access and reuse before import."],
  ["CDC Guidelines", "CDC", "https://www.cdc.gov/guidelines/", "OPEN_PUBLIC", "United States", ["obstetrics", "gynecology", "general medicine"], "Registry only. Import direct public documents only."],
  ["SOGC Guidelines", "SOGC", "https://www.sogc.org/en/content/featured-news/Clinical-Practice-Guidelines.aspx", "PUBLIC_RESTRICTED", "Canada", ["obstetrics", "gynecology"], "Registry only. Check access and reuse terms before import."],
  ["WSES Guidelines", "WSES", "https://www.wses.org.uk/scientific-resources/guidelines", "OPEN_PUBLIC", "Global", ["surgery", "general medicine"], "Registry only. Surgical guideline source for cross-specialty context."],
  ["SAGES Guidelines", "SAGES", "https://www.sages.org/publications/guidelines/", "PUBLIC_RESTRICTED", "United States", ["surgery", "gynecology"], "Registry only. Check public access and reuse before import."]
];

function describePermission(key) {
  const [area, action] = key.split(".");

  return `Foundation permission for ${area} ${action} access.`;
}

function riskLevelFor(key) {
  if (reservedSystemOwnerPermissions.includes(key)) {
    return "critical";
  }

  if (key === "audit.read" || key.endsWith(".manage") || key.includes(".import") || key.includes(".override")) {
    return "high";
  }

  return "medium";
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}%/.\s-]+/gu, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function seedGuidelineSourceRegistry(prisma) {
  for (const [name, abbreviation, websiteUrl, sourceType, countryOrRegion, specialties, notes] of guidelineSources) {
    const existing = await prisma.guidelineSource.findFirst({
      where: {
        OR: [
          { name },
          { organization: name },
          { websiteUrl }
        ]
      }
    });
    const data = {
      name,
      organization: name,
      sourceType,
      websiteUrl,
      countryOrRegion,
      specialties,
      defaultAccessLevel: "OWNER_DOCTOR",
      notes,
      active: true
    };

    if (existing) {
      await prisma.guidelineSource.update({ where: { id: existing.id }, data });
    } else {
      await prisma.guidelineSource.create({ data });
    }
  }
}

async function seedDemoGuidelineDocuments(prisma) {
  const demoDocuments = [
    {
      title: "Demo Antenatal Care Reference",
      sourceName: "WHO Guideline Registry",
      specialty: "obstetrics",
      topic: "antenatal care",
      organization: "WHO",
      licenseStatus: "OPEN",
      guidelineStatus: "ACTIVE",
      citationLabel: "WHO-DEMO-ANC",
      text: "Demo indexed reference only for antenatal care source discovery. This placeholder does not include clinical treatment instructions."
    },
    {
      title: "Demo PCOS Guideline Index",
      sourceName: "ESHRE Guidelines",
      specialty: "gynecology/endocrine",
      topic: "PCOS",
      organization: "ESHRE",
      licenseStatus: "CHECK_REQUIRED",
      guidelineStatus: "NEEDS_REVIEW",
      citationLabel: "ESHRE-DEMO-PCOS",
      text: "Demo indexed reference only for PCOS guideline discovery. Doctor review is required before any clinical use."
    },
    {
      title: "Demo Endometriosis Guideline Index",
      sourceName: "NICE Guidance",
      specialty: "gynecology",
      topic: "endometriosis",
      organization: "NICE",
      licenseStatus: "CHECK_REQUIRED",
      guidelineStatus: "NEEDS_REVIEW",
      citationLabel: "NICE-DEMO-ENDO",
      text: "Demo indexed reference only for endometriosis guideline discovery. This is not treatment advice."
    }
  ];

  for (const item of demoDocuments) {
    const source = await prisma.guidelineSource.findFirst({ where: { name: item.sourceName } });
    if (!source) continue;
    const existing = await prisma.guidelineDocument.findFirst({ where: { title: item.title } });
    const data = {
      sourceId: source.id,
      title: item.title,
      specialty: item.specialty,
      topic: item.topic,
      organization: item.organization,
      versionLabel: "demo-index",
      guidelineStatus: item.guidelineStatus,
      licenseStatus: item.licenseStatus,
      accessLevel: "OWNER_DOCTOR",
      downloadsAllowed: false
    };
    const document = existing
      ? await prisma.guidelineDocument.update({ where: { id: existing.id }, data })
      : await prisma.guidelineDocument.create({ data });

    await prisma.guidelineChunk.deleteMany({ where: { documentId: document.id } });
    await prisma.guidelineSection.deleteMany({ where: { documentId: document.id } });
    const section = await prisma.guidelineSection.create({
      data: {
        documentId: document.id,
        heading: "Demo indexed reference",
        sectionPath: "demo",
        orderIndex: 1,
        text: item.text
      }
    });
    await prisma.guidelineChunk.create({
      data: {
        documentId: document.id,
        sectionId: section.id,
        chunkIndex: 0,
        text: item.text,
        normalizedText: normalizeSearchText(`${item.title} ${item.topic} ${item.text}`),
        tokenEstimate: 24,
        citationLabel: item.citationLabel,
        searchVectorText: normalizeSearchText(`${item.title} ${item.topic} ${item.organization} ${item.text}`)
      }
    });
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, 64);

  return `scrypt:16384:8:1:${salt}:${key.toString("base64url")}`;
}

async function seedMedicationIntelligence(prisma) {
  const families = [
    ["BETA_BLOCKER", "beta blocker", ["beta-blocker", "beta blockers"]],
    ["ACEI", "ACE inhibitor", ["ACEI", "ACE inhibitors"]],
    ["ARB", "angiotensin receptor blocker", ["ARB", "sartans"]],
    ["CCB", "calcium channel blocker", ["CCB"]],
    ["THIAZIDE", "thiazide", []],
    ["LOOP_DIURETIC", "loop diuretic", []],
    ["POTASSIUM_SPARING_DIURETIC", "potassium sparing diuretic", []],
    ["STATIN", "statin", []],
    ["ANTIPLATELET", "antiplatelet", []],
    ["ANTICOAGULANT", "anticoagulant", []],
    ["NSAID", "NSAID", ["non-steroidal anti-inflammatory drug"]],
    ["PENICILLIN", "penicillin", []],
    ["CEPHALOSPORIN", "cephalosporin", []],
    ["MACROLIDE", "macrolide", []],
    ["FLUOROQUINOLONE", "fluoroquinolone", []],
    ["TETRACYCLINE", "tetracycline", []],
    ["AMINOGLYCOSIDE", "aminoglycoside", []],
    ["ANTIFUNGAL", "antifungal", []],
    ["ANTIVIRAL", "antiviral", []],
    ["SSRI", "SSRI", ["selective serotonin reuptake inhibitor"]],
    ["SNRI", "SNRI", []],
    ["TCA", "TCA", []],
    ["ANTIPSYCHOTIC", "antipsychotic", []],
    ["BENZODIAZEPINE", "benzodiazepine placeholder", ["benzodiazepines"]],
    ["MOOD_STABILIZER", "mood stabilizer", []],
    ["ANTIEPILEPTIC", "antiepileptic", []],
    ["PPI", "PPI", ["proton pump inhibitor"]],
    ["H2_BLOCKER", "H2 blocker", []],
    ["ANTIEMETIC", "antiemetic", []],
    ["ANTIHISTAMINE", "antihistamine", []],
    ["CORTICOSTEROID", "corticosteroid", []],
    ["INHALED_CORTICOSTEROID", "inhaled corticosteroid", []],
    ["SABA", "SABA", []],
    ["LABA", "LABA", []],
    ["LAMA", "LAMA", []],
    ["INSULIN", "insulin", []],
    ["METFORMIN_CLASS", "metformin class placeholder", []],
    ["GLP1", "GLP1", []],
    ["SGLT2", "SGLT2", []],
    ["DPP4", "DPP4", []],
    ["THYROID_HORMONE", "thyroid hormone", []],
    ["ANTITHYROID", "antithyroid", []],
    ["COC", "combined oral contraceptive", []],
    ["PROGESTIN_ONLY_CONTRACEPTIVE", "progestin-only contraceptive", []],
    ["EMERGENCY_CONTRACEPTION", "emergency contraception class placeholder", []],
    ["FERTILITY_MEDICATION", "fertility medication class placeholder", []],
    ["UTEROTONIC", "uterotonic class placeholder", []],
    ["TOCOLYTIC", "tocolytic class placeholder", []],
    ["MAGNESIUM_SULFATE", "magnesium sulfate class placeholder", []],
    ["IRON_SUPPLEMENT", "iron supplement", []],
    ["FOLIC_ACID_SUPPLEMENT", "folic acid supplement class placeholder", []],
    ["VITAMIN_SUPPLEMENT", "vitamin supplement", []],
    ["HERBAL_SUPPLEMENT", "herbal/supplement", []]
  ];

  const familyByCode = new Map();
  for (const [code, displayName, aliases] of families) {
    const family = await prisma.drugFamily.upsert({
      where: { code },
      update: {
        displayName,
        aliases,
        normalizedSearchText: normalizeSearchText([code, displayName, ...aliases].join(" ")),
        restrictedFlag: code === "BENZODIAZEPINE",
        verificationStatus: "catalog_only"
      },
      create: {
        code,
        displayName,
        aliases,
        normalizedSearchText: normalizeSearchText([code, displayName, ...aliases].join(" ")),
        restrictedFlag: code === "BENZODIAZEPINE",
        verificationStatus: "catalog_only"
      }
    });
    familyByCode.set(code, family);
  }

  const countries = [
    ["EG", "Egypt", null, false],
    ["KSA", "Saudi Arabia", "KSA", true],
    ["UAE", "United Arab Emirates", "UAE", true],
    ["YEM", "Yemen", "YEM", true]
  ];

  for (const [countryCode, displayName, compactBadgeLabel, showCompactBadgeByDefault] of countries) {
    await prisma.drugMarketCountry.upsert({
      where: { countryCode },
      update: { displayName, compactBadgeLabel, showCompactBadgeByDefault, active: true },
      create: { countryCode, displayName, compactBadgeLabel, showCompactBadgeByDefault, active: true }
    });
  }

  const marketSources = [
    ["EDA_EDDB", "Egyptian Drug Database", "EG", "official_registry", 10],
    ["SFDA_DRUG_LIST", "SFDA Drug List", "KSA", "official_registry", 10],
    ["UAE_EDE_DIRECTORY", "UAE EDE Directory", "UAE", "official_registry", 10],
    ["UAE_MOHAP_SHARIK", "UAE MOHAP Sharik", "UAE", "official_registry", 20],
    ["YEMEN_OFFICIAL_UPLOAD", "Yemen official owner-provided upload", "YEM", "official_upload", 10],
    ["YEMEN_WHO_NEML_REFERENCE", "Yemen WHO/NEML reference", "YEM", "reference_only", 80],
    ["LOCAL_MANUAL", "Local manual catalog entry", null, "manual", 90],
    ["LICENSED_PROVIDER", "Licensed provider placeholder", null, "licensed_provider", 30]
  ];
  const marketSourceByCode = new Map();
  for (const [code, name, countryCode, sourceType, priorityRank] of marketSources) {
    const source = await prisma.drugMarketSource.upsert({
      where: { code },
      update: { name, countryCode, sourceType, priorityRank, policyStatus: "approved", verificationStatus: "catalog_only", active: true },
      create: { code, name, countryCode, sourceType, priorityRank, policyStatus: "approved", verificationStatus: "catalog_only", active: true }
    });
    marketSourceByCode.set(code, source);
  }

  const medicationSources = [
    ["RXNORM", "RxNorm", "official_reference"],
    ["DAILYMED", "DailyMed", "official_labels"],
    ["OPENFDA_DRUG_LABELS", "openFDA drug labels", "official_labels"],
    ["WHO_ATC_DDD", "WHO ATC/DDD", "official_reference"],
    ["NCCIH_HERBS", "NCCIH Herbs at a Glance", "official_reference"],
    ["LICENSED_COMMERCIAL_DRUG_DB", "Licensed commercial drug database placeholder", "licensed_provider"],
    ["LOCAL_EGYPT_GULF_BRAND_MAPPING", "Local Egyptian/Gulf brand mapping placeholder", "manual_mapping"]
  ];
  for (const [code, name, sourceType] of medicationSources) {
    await prisma.medicationDataSource.upsert({
      where: { code },
      update: { name, sourceType, verificationStatus: "catalog_only", active: true },
      create: { code, name, sourceType, verificationStatus: "catalog_only", active: true }
    });
  }

  const connectors = [
    ["SFDA_OFFICIAL_DRUG_LIST_CONNECTOR", "SFDA official drug list connector", "SFDA_DRUG_LIST", "official_registry", "KSA", false, true],
    ["EDA_EDDB_CONNECTOR", "EDA EDDB connector", "EDA_EDDB", "official_registry", "EG", false, true],
    ["UAE_EDE_DIRECTORY_CONNECTOR", "UAE EDE directory connector", "UAE_EDE_DIRECTORY", "official_registry", "UAE", false, true],
    ["UAE_MOHAP_DIRECTORY_CONNECTOR", "UAE MOHAP directory connector", "UAE_MOHAP_SHARIK", "official_registry", "UAE", false, true],
    ["YEMEN_OFFICIAL_UPLOAD_CONNECTOR", "Yemen official upload connector", "YEMEN_OFFICIAL_UPLOAD", "official_upload", "YEM", false, true],
    ["RETAIL_PUBLIC_METADATA_CONNECTOR_TEMPLATE", "Retail public metadata connector template", "LOCAL_MANUAL", "retail_metadata", null, true, false]
  ];
  for (const [code, displayName, sourceCode, connectorType, countryCode, isRetailMetadata, enabled] of connectors) {
    await prisma.drugMarketSourceConnector.upsert({
      where: { code },
      update: {
        displayName,
        sourceId: marketSourceByCode.get(sourceCode)?.id,
        connectorType,
        countryCode,
        isRetailMetadata,
        enabled: isRetailMetadata ? false : enabled,
        policyStatus: "approved",
        notes: isRetailMetadata ? "Disabled by default. Product metadata only if explicitly approved later." : "Official-source-first connector placeholder."
      },
      create: {
        code,
        displayName,
        sourceId: marketSourceByCode.get(sourceCode)?.id,
        connectorType,
        countryCode,
        isRetailMetadata,
        enabled: isRetailMetadata ? false : enabled,
        policyStatus: "approved",
        notes: isRetailMetadata ? "Disabled by default. Product metadata only if explicitly approved later." : "Official-source-first connector placeholder."
      }
    });
  }

  const ingredient = await prisma.medicationIngredient.upsert({
    where: { id: "00000000-0000-0000-0000-00000000ace1" },
    update: {
      genericName: "Demo ACE ingredient",
      normalizedSearchText: normalizeSearchText("Demo ACE ingredient ACEI ACE inhibitor"),
      verificationStatus: "catalog_only"
    },
    create: {
      id: "00000000-0000-0000-0000-00000000ace1",
      genericName: "Demo ACE ingredient",
      normalizedSearchText: normalizeSearchText("Demo ACE ingredient ACEI ACE inhibitor"),
      verificationStatus: "catalog_only"
    }
  });
  await prisma.medicationFamilyMembership.upsert({
    where: { ingredientId_familyId: { ingredientId: ingredient.id, familyId: familyByCode.get("ACEI").id } },
    update: {},
    create: { ingredientId: ingredient.id, familyId: familyByCode.get("ACEI").id, sourceStatus: "catalog_only" }
  });
  await prisma.medicationProduct.upsert({
    where: { id: "00000000-0000-0000-0000-00000000b001" },
    update: {
      ingredientId: ingredient.id,
      genericName: "Demo ACE ingredient",
      brandName: "Demoace",
      normalizedSearchText: normalizeSearchText("Demoace Demo ACE ingredient ACEI tablet"),
      dosageForm: "tablet",
      strengthText: "10 mg tablet",
      verificationStatus: "catalog_only"
    },
    create: {
      id: "00000000-0000-0000-0000-00000000b001",
      ingredientId: ingredient.id,
      genericName: "Demo ACE ingredient",
      brandName: "Demoace",
      normalizedSearchText: normalizeSearchText("Demoace Demo ACE ingredient ACEI tablet"),
      dosageForm: "tablet",
      strengthText: "10 mg tablet",
      verificationStatus: "catalog_only"
    }
  });

  const demoIngredients = [
    ["lisinopril", "ACEI", "ACE inhibitor", "catalog_only"],
    ["metoprolol", "BETA_BLOCKER", "beta blocker", "catalog_only"],
    ["ibuprofen", "NSAID", "NSAID", "catalog_only"],
    ["sertraline", "SSRI", "SSRI", "catalog_only"],
    ["omeprazole", "PPI", "PPI", "catalog_only"],
    ["folic acid", "FOLIC_ACID_SUPPLEMENT", "folic acid supplement", "verified_reference_demo"],
    ["ferrous sulfate", "IRON_SUPPLEMENT", "iron supplement", "catalog_only"]
  ];
  const ingredientByName = new Map([[ingredient.genericName, ingredient]]);
  for (const [genericName, familyCode, familyText, verificationStatus] of demoIngredients) {
    let demoIngredient = await prisma.medicationIngredient.findFirst({ where: { genericName } });
    const ingredientData = {
      genericName,
      normalizedSearchText: normalizeSearchText(`${genericName} ${familyCode} ${familyText}`),
      therapeuticClass: familyText,
      pharmacologicClass: familyText,
      verificationStatus
    };
    demoIngredient = demoIngredient
      ? await prisma.medicationIngredient.update({ where: { id: demoIngredient.id }, data: ingredientData })
      : await prisma.medicationIngredient.create({ data: ingredientData });
    ingredientByName.set(genericName, demoIngredient);
    const family = familyByCode.get(familyCode);
    if (family) {
      await prisma.medicationFamilyMembership.upsert({
        where: { ingredientId_familyId: { ingredientId: demoIngredient.id, familyId: family.id } },
        update: { sourceStatus: verificationStatus },
        create: { ingredientId: demoIngredient.id, familyId: family.id, sourceStatus: verificationStatus }
      });
    }
  }

  const demoMedicationProducts = [
    ["lisinopril", "DemoLisinopril", "10 mg tablet", "tablet", "oral", "ACEI", "catalog_only"],
    ["metoprolol", "DemoMetoprolol", "50 mg tablet", "tablet", "oral", "BETA_BLOCKER", "catalog_only"],
    ["ibuprofen", "DemoIbuprofen", "200 mg tablet", "tablet", "oral", "NSAID", "catalog_only"],
    ["sertraline", "DemoSertraline", "50 mg tablet", "tablet", "oral", "SSRI", "catalog_only"],
    ["omeprazole", "DemoOmeprazole", "20 mg capsule", "capsule", "oral", "PPI", "catalog_only"],
    ["folic acid", "DemoFolicAcid", "5 mg tablet", "tablet", "oral", "FOLIC_ACID_SUPPLEMENT", "verified_reference_demo"],
    ["ferrous sulfate", "DemoFerrousSulfate", "tablet", "tablet", "oral", "IRON_SUPPLEMENT", "catalog_only"]
  ];
  for (const [genericName, brandName, strengthText, dosageForm, route, familyCode, verificationStatus] of demoMedicationProducts) {
    const existing = await prisma.medicationProduct.findFirst({ where: { brandName, genericName } });
    const productData = {
      ingredientId: ingredientByName.get(genericName)?.id,
      genericName,
      brandName,
      normalizedSearchText: normalizeSearchText(`${brandName} ${genericName} ${strengthText} ${dosageForm} ${familyCode}`),
      dosageForm,
      route,
      strengthText,
      verificationStatus
    };
    if (existing) await prisma.medicationProduct.update({ where: { id: existing.id }, data: productData });
    else await prisma.medicationProduct.create({ data: productData });
  }

  await prisma.herbalProduct.upsert({
    where: { id: "00000000-0000-0000-0000-00000000f001" },
    update: {
      commonName: "Demo herbal supplement",
      botanicalName: "Demo botanica",
      normalizedSearchText: normalizeSearchText("Demo herbal supplement Demo botanica"),
      cautionSummary: "Demo catalog caution only. Doctor review is required.",
      verificationStatus: "catalog_only"
    },
    create: {
      id: "00000000-0000-0000-0000-00000000f001",
      commonName: "Demo herbal supplement",
      botanicalName: "Demo botanica",
      normalizedSearchText: normalizeSearchText("Demo herbal supplement Demo botanica"),
      cautionSummary: "Demo catalog caution only. Doctor review is required.",
      verificationStatus: "catalog_only"
    }
  });

  for (const [commonName, botanicalName] of [
    ["ginger", "Zingiber officinale"],
    ["peppermint", "Mentha piperita"],
    ["chamomile", "Matricaria chamomilla"]
  ]) {
    const existing = await prisma.herbalProduct.findFirst({ where: { commonName } });
    const herbalData = {
      commonName,
      botanicalName,
      aliases: [],
      normalizedSearchText: normalizeSearchText(`${commonName} ${botanicalName} herbal supplement reference only`),
      cautionSummary: "Demo reference only. No self-use instructions. Doctor review is required.",
      verificationStatus: "catalog_only"
    };
    if (existing) await prisma.herbalProduct.update({ where: { id: existing.id }, data: herbalData });
    else await prisma.herbalProduct.create({ data: herbalData });
  }

  const demoProducts = [
    ["DemoEG", "Demo generic EG", [["EG", "1 g tablet", "tablet"], ["EG", "457 mg/5 mL oral suspension", "oral suspension"]]],
    ["DemoKSA", "Demo generic KSA", [["KSA", "625 mg tablet", "tablet"]]],
    ["DemoUAE", "Demo generic UAE", [["UAE", "vial", "vial"]]],
    ["DemoYEM", "Demo generic YEM", [["YEM", "drops", "drops"]]],
    ["DemoGulf", "Demo generic Gulf", [["KSA", "suppository", "suppository"], ["UAE", "cream", "cream"]]]
  ];

  for (const [tradeName, genericName, variants] of demoProducts) {
    let product = await prisma.drugMarketProduct.findFirst({ where: { tradeName, genericName } });
    const productData = {
      tradeName,
      genericName,
      normalizedSearchText: normalizeSearchText(`${tradeName} ${genericName} demo market product ACEI beta blocker NSAID`),
      familyText: tradeName === "DemoEG" ? "ACE inhibitor" : null,
      manufacturer: "Demo manufacturer",
      marketingCompany: "Demo marketing company",
      verificationStatus: "catalog_only"
    };
    product = product
      ? await prisma.drugMarketProduct.update({ where: { id: product.id }, data: productData })
      : await prisma.drugMarketProduct.create({ data: productData });

    for (const [countryCode, strengthText, dosageForm] of variants) {
      const source = marketSourceByCode.get(countryCode === "EG" ? "EDA_EDDB" : countryCode === "KSA" ? "SFDA_DRUG_LIST" : countryCode === "UAE" ? "UAE_EDE_DIRECTORY" : "YEMEN_OFFICIAL_UPLOAD");
      const sourceRowHash = crypto.createHash("sha256").update(`${tradeName}|${countryCode}|${strengthText}`).digest("hex");
      await prisma.drugMarketVariant.upsert({
        where: { countryCode_sourceRowHash: { countryCode, sourceRowHash } },
        update: {
          productId: product.id,
          sourceId: source?.id,
          tradeName,
          genericName,
          strengthText,
          dosageForm,
          route: dosageForm === "tablet" ? "oral" : null,
          packageText: "Demo pack variant only; not patient directions.",
          manufacturer: "Demo manufacturer",
          marketingCompany: "Demo marketing company",
          registrationNumber: `DEMO-${countryCode}-${tradeName}`,
          sourceRowHash,
          verificationStatus: "catalog_only"
        },
        create: {
          productId: product.id,
          countryCode,
          sourceId: source?.id,
          tradeName,
          genericName,
          strengthText,
          dosageForm,
          route: dosageForm === "tablet" ? "oral" : null,
          packageText: "Demo pack variant only; not patient directions.",
          manufacturer: "Demo manufacturer",
          marketingCompany: "Demo marketing company",
          registrationNumber: `DEMO-${countryCode}-${tradeName}`,
          sourceRowHash,
          verificationStatus: "catalog_only"
        }
      });
    }
    await recomputeDemoAvailability(prisma, product.id);
  }

  const requestedMarketProducts = [
    ["DemoCillin EG", "amoxicillin", "penicillin", [["EG", "500 mg capsule", "capsule"]]],
    ["CardioBeta KSA", "bisoprolol", "beta blocker", [["KSA", "5 mg tablet", "tablet"]]],
    ["GastroPPI UAE", "omeprazole", "PPI", [["UAE", "20 mg capsule", "capsule"]]],
    ["IronCare YEM", "ferrous sulfate", "iron supplement", [["YEM", "tablet", "tablet"]]],
    ["FolicPlus Gulf", "folic acid", "folic acid supplement", [["KSA", "5 mg tablet", "tablet"], ["UAE", "5 mg tablet", "tablet"]]],
    ["DemoSuspension", "amoxicillin/clavulanate placeholder", "penicillin", [["EG", "625 mg tablet", "tablet"], ["EG", "457 mg/5 mL oral suspension", "oral suspension"]]]
  ];

  for (const [tradeName, genericName, familyText, variants] of requestedMarketProducts) {
    let product = await prisma.drugMarketProduct.findFirst({ where: { tradeName, genericName } });
    const productData = {
      tradeName,
      genericName,
      normalizedSearchText: normalizeSearchText(`${tradeName} ${genericName} ${familyText} ${variants.map((variant) => variant.join(" ")).join(" ")}`),
      familyText,
      manufacturer: "Demo manufacturer",
      marketingCompany: "Demo marketing company",
      verificationStatus: "catalog_only"
    };
    product = product
      ? await prisma.drugMarketProduct.update({ where: { id: product.id }, data: productData })
      : await prisma.drugMarketProduct.create({ data: productData });

    for (const [countryCode, strengthText, dosageForm] of variants) {
      const source = marketSourceByCode.get(countryCode === "EG" ? "EDA_EDDB" : countryCode === "KSA" ? "SFDA_DRUG_LIST" : countryCode === "UAE" ? "UAE_EDE_DIRECTORY" : "YEMEN_OFFICIAL_UPLOAD");
      const sourceRowHash = crypto.createHash("sha256").update(`v06|${tradeName}|${countryCode}|${strengthText}|${dosageForm}`).digest("hex");
      await prisma.drugMarketVariant.upsert({
        where: { countryCode_sourceRowHash: { countryCode, sourceRowHash } },
        update: {
          productId: product.id,
          sourceId: source?.id,
          tradeName,
          genericName,
          strengthText,
          dosageForm,
          route: ["tablet", "capsule", "oral suspension"].includes(dosageForm) ? "oral" : null,
          packageText: "Demo market metadata only; not patient directions.",
          manufacturer: "Demo manufacturer",
          marketingCompany: "Demo marketing company",
          registrationNumber: `DEMO-${countryCode}-${tradeName.replace(/\s+/g, "-").toUpperCase()}`,
          sourceRowHash,
          verificationStatus: "catalog_only"
        },
        create: {
          productId: product.id,
          countryCode,
          sourceId: source?.id,
          tradeName,
          genericName,
          strengthText,
          dosageForm,
          route: ["tablet", "capsule", "oral suspension"].includes(dosageForm) ? "oral" : null,
          packageText: "Demo market metadata only; not patient directions.",
          manufacturer: "Demo manufacturer",
          marketingCompany: "Demo marketing company",
          registrationNumber: `DEMO-${countryCode}-${tradeName.replace(/\s+/g, "-").toUpperCase()}`,
          sourceRowHash,
          verificationStatus: "catalog_only"
        }
      });
    }
    await recomputeDemoAvailability(prisma, product.id);
  }
}

async function recomputeDemoAvailability(prisma, productId) {
  const variants = await prisma.drugMarketVariant.groupBy({
    by: ["countryCode"],
    where: { productId, verificationStatus: { not: "retired" } },
    _count: { _all: true }
  });
  const hasEgypt = variants.some((item) => item.countryCode === "EG");
  for (const item of variants) {
    const country = await prisma.drugMarketCountry.findUnique({ where: { countryCode: item.countryCode } });
    const showCompactBadge = !hasEgypt && country?.showCompactBadgeByDefault === true;
    await prisma.drugMarketAvailability.upsert({
      where: { productId_countryCode: { productId, countryCode: item.countryCode } },
      update: {
        variantCount: item._count._all,
        compactBadgeLabel: showCompactBadge ? country?.compactBadgeLabel : null,
        showCompactBadge
      },
      create: {
        productId,
        countryCode: item.countryCode,
        variantCount: item._count._all,
        compactBadgeLabel: showCompactBadge ? country?.compactBadgeLabel : null,
        showCompactBadge
      }
    });
  }
}

async function main() {
  const mainBranch = await prisma.branch.upsert({
    where: { code: "main" },
    update: {
      name: "Demo Branch A",
      status: "active"
    },
    create: {
      name: "Demo Branch A",
      code: "main",
      status: "active"
    }
  });

  const branchB = await prisma.branch.upsert({
    where: { code: "demo-b" },
    update: {
      name: "Demo Branch B",
      status: "active"
    },
    create: {
      name: "Demo Branch B",
      code: "demo-b",
      status: "active"
    }
  });

  const roleByName = new Map();

  for (const [name, description] of roles) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {
        description,
        isSystemRole: true
      },
      create: {
        name,
        description,
        isSystemRole: true
      }
    });

    roleByName.set(name, role);
  }

  const permissionByKey = new Map();

  for (const key of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {
        description: describePermission(key),
        riskLevel: riskLevelFor(key)
      },
      create: {
        key,
        description: describePermission(key),
        riskLevel: riskLevelFor(key)
      }
    });

    permissionByKey.set(key, permission);
  }

  for (const [roleName, keys] of Object.entries(rolePermissionKeys)) {
    const role = roleByName.get(roleName);

    for (const key of keys.filter((key) => !reservedSystemOwnerPermissions.includes(key))) {
      const permission = permissionByKey.get(key);

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  await seedGuidelineSourceRegistry(prisma);

  await seedMedicationIntelligence(prisma);

  let demoOwner = null;

  if (seedDemoData && process.env.SEED_DEMO_OWNER !== "false") {
    const email = process.env.DEMO_OWNER_EMAIL || "owner@prij.local";
    const password = process.env.DEMO_OWNER_PASSWORD || "LocalDev123!";

    if (!password) {
      throw new Error("DEMO_OWNER_PASSWORD is required when SEED_DEMO_OWNER=true.");
    }

    const owner = await prisma.user.upsert({
      where: { email },
      update: {
        displayName: "Demo Owner",
        status: "active",
        branchId: mainBranch.id,
        permissionPreset: "advanced",
        protectedAccount: false,
        passwordHash: await hashPassword(password)
      },
      create: {
        email,
        displayName: "Demo Owner",
        status: "active",
        branchId: mainBranch.id,
        permissionPreset: "advanced",
        protectedAccount: false,
        passwordHash: await hashPassword(password)
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_branchId: {
          userId: owner.id,
          roleId: roleByName.get("Owner").id,
          branchId: mainBranch.id
        }
      },
      update: {},
      create: {
        userId: owner.id,
        roleId: roleByName.get("Owner").id,
        branchId: mainBranch.id
      }
    });

    demoOwner = owner;
  }

  if (seedDemoData) {
    const localAdminPassword = process.env.DEMO_ADMIN_PASSWORD || "eyad";
    const localAdmin = await prisma.user.upsert({
      where: { email: "eyad.admin@prij.local" },
      update: {
        loginId: "eyad",
        displayName: "Eyad Admin",
        status: "active",
        branchId: mainBranch.id,
        permissionPreset: "advanced",
        protectedAccount: true,
        passwordHash: await hashPassword(localAdminPassword),
        failedLoginCount: 0,
        lockedUntil: null
      },
      create: {
        email: "eyad.admin@prij.local",
        loginId: "eyad",
        displayName: "Eyad Admin",
        status: "active",
        branchId: mainBranch.id,
        permissionPreset: "advanced",
        protectedAccount: true,
        createdByUserId: demoOwner?.id,
        passwordHash: await hashPassword(localAdminPassword)
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_branchId: {
          userId: localAdmin.id,
          roleId: roleByName.get("Owner").id,
          branchId: mainBranch.id
        }
      },
      update: {},
      create: {
        userId: localAdmin.id,
        roleId: roleByName.get("Owner").id,
        branchId: mainBranch.id,
        createdByUserId: demoOwner?.id
      }
    });

    if (!demoOwner) {
      demoOwner = localAdmin;
    }

    for (const key of reservedSystemOwnerPermissions) {
      const permission = permissionByKey.get(key);

      await prisma.userPermissionOverride.upsert({
        where: {
          userId_permissionId: {
            userId: localAdmin.id,
            permissionId: permission.id
          }
        },
        update: {
          effect: "allow",
          grantedByUserId: localAdmin.id
        },
        create: {
          userId: localAdmin.id,
          permissionId: permission.id,
          effect: "allow",
          grantedByUserId: localAdmin.id
        }
      });
    }

    const demoPassword = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
    const demoUsers = [
      ["demo.owner@prij.local", "Demo Owner User", "Owner", mainBranch.id],
      ["demo.doctor@prij.local", "Demo Doctor User", "Doctor", mainBranch.id],
      ["demo.reception@prij.local", "Demo Reception User", "Receptionist", mainBranch.id],
      ["demo.accountant@prij.local", "Demo Accountant User", "Accountant", mainBranch.id],
      ["demo.nurse@prij.local", "Demo Nurse User", "Nurse", branchB.id]
    ];

    for (const [email, displayName, roleName, branchId] of demoUsers) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          displayName,
          status: "active",
          branchId,
          permissionPreset: "advanced",
          protectedAccount: false,
          passwordHash: await hashPassword(demoPassword),
          failedLoginCount: 0,
          lockedUntil: null
        },
        create: {
          email,
          displayName,
          status: "active",
          branchId,
          permissionPreset: "advanced",
          protectedAccount: false,
          createdByUserId: demoOwner?.id,
          passwordHash: await hashPassword(demoPassword)
        }
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId_branchId: {
            userId: user.id,
            roleId: roleByName.get(roleName).id,
            branchId
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roleByName.get(roleName).id,
          branchId,
          createdByUserId: demoOwner?.id
        }
      });
    }
  }

  await prisma.systemSetting.upsert({
    where: { key: "appearance" },
    update: {
      valueJson: {
        defaultTheme: "clinic-premium",
        allowUserThemeOverride: true
      }
    },
    create: {
      key: "appearance",
      valueJson: {
        defaultTheme: "clinic-premium",
        allowUserThemeOverride: true
      },
      updatedByUserId: demoOwner?.id
    }
  });

  await seedCalculatorFormulas(prisma);
  await seedWomensHealthProtocols(prisma);
  await seedEmergencyObProtocols(prisma);
  await seedAubMenstrualProtocols(prisma);
  await seedContraceptionProtocols(prisma);
  await seedAntenatalRoutineProtocols(prisma);
  await seedGuidelineSourceRegistry(prisma);
  await seedDemoGuidelineDocuments(prisma);

  if (!seedDemoData) {
    return;
  }

  const serviceItems = [
    ["CONSULT-GYN", "Gynecology consultation", "Consultation", "500.00", "EGP"],
    ["US-OB-BASIC", "OB ultrasound basic", "Ultrasound", "750.00", "EGP"],
    ["LAB-PANEL-DEMO", "Demo lab panel", "Investigations", "350.00", "EGP"],
    ["FOLLOW-UP", "Follow-up visit", "Consultation", "300.00", "EGP"]
  ];

  for (const [code, name, category, price, currency] of serviceItems) {
    await prisma.serviceItem.upsert({
      where: { code },
      update: { name, category, price, currency, active: true },
      create: { code, name, category, price, currency, active: true }
    });
  }

  const demoPatientA = await prisma.patient.upsert({
    where: { medicalRecordNumber: "DEMO-MRN-001" },
    update: {
      firstName: "Demo",
      lastName: "Patient A",
      status: "active",
      branchId: mainBranch.id,
      notes: "Local demo registration record only."
    },
    create: {
      medicalRecordNumber: "DEMO-MRN-001",
      firstName: "Demo",
      lastName: "Patient A",
      status: "active",
      branchId: mainBranch.id,
      notes: "Local demo registration record only.",
      createdByUserId: demoOwner?.id
    }
  });

  await prisma.patient.upsert({
    where: { medicalRecordNumber: "DEMO-MRN-002" },
    update: {
      firstName: "Demo",
      lastName: "Patient B",
      status: "active",
      branchId: branchB.id,
      notes: "Local demo registration record only."
    },
    create: {
      medicalRecordNumber: "DEMO-MRN-002",
      firstName: "Demo",
      lastName: "Patient B",
      status: "active",
      branchId: branchB.id,
      notes: "Local demo registration record only.",
      createdByUserId: demoOwner?.id
    }
  });

  const todayStart = new Date();
  todayStart.setHours(10, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 30 * 60 * 1000);

  let demoAppointment = await prisma.appointment.findFirst({
    where: {
      branchId: mainBranch.id,
      patientId: demoPatientA.id,
      startAt: todayStart
    }
  });

  if (!demoAppointment) {
    demoAppointment = await prisma.appointment.create({
      data: {
        branchId: mainBranch.id,
        patientId: demoPatientA.id,
        doctorId: demoOwner?.id,
        startAt: todayStart,
        endAt: todayEnd,
        status: "booked",
        appointmentType: "Demo visit",
        source: "local_seed",
        notes: "Local demo appointment only.",
        createdByUserId: demoOwner?.id
      }
    });
  }

  const existingTicket = await prisma.queueTicket.findFirst({
    where: {
      branchId: mainBranch.id,
      patientId: demoPatientA.id,
      appointmentId: demoAppointment.id,
      status: "waiting"
    }
  });

  if (!existingTicket) {
    await prisma.queueTicket.create({
      data: {
        branchId: mainBranch.id,
        patientId: demoPatientA.id,
        appointmentId: demoAppointment.id,
        queueNumber: 1,
        status: "waiting",
        priority: "routine"
      }
    });
  }

  const demoReport = await prisma.report.findFirst({
    where: {
      patientId: demoPatientA.id,
      title: "Demo ultrasound report placeholder"
    }
  });

  if (!demoReport) {
    await prisma.report.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        category: "ultrasound",
        status: "review_pending",
        title: "Demo ultrasound report placeholder",
        source: "local_seed",
        resultSummary: "Local demo report summary only. Doctor review required.",
        uploadedByUserId: demoOwner?.id
      }
    });
  }

  let demoPregnancy = await prisma.pregnancy.findFirst({
    where: {
      patientId: demoPatientA.id,
      status: "active"
    }
  });

  if (!demoPregnancy) {
    demoPregnancy = await prisma.pregnancy.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        status: "active",
        gravida: 1,
        para: 0,
        riskLevel: "routine",
        notes: "Local demo pregnancy overview only.",
        createdByUserId: demoOwner?.id
      }
    });
  }

  const demoUltrasound = await prisma.obUltrasound.findFirst({
    where: {
      patientId: demoPatientA.id,
      pregnancyId: demoPregnancy.id
    }
  });

  if (!demoUltrasound) {
    await prisma.obUltrasound.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        pregnancyId: demoPregnancy.id,
        status: "draft",
        gestationalAgeWeeks: 12,
        gestationalAgeDays: 2,
        fetalHeartRateBpm: 150,
        presentation: "Demo placeholder",
        placenta: "Demo placeholder",
        amnioticFluid: "Demo placeholder",
        impressionText: "Draft local demo OB ultrasound note. Doctor review required.",
        createdByUserId: demoOwner?.id
      }
    });
  }

  let demoInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: "DEMO-INV-0001" }
  });

  if (!demoInvoice) {
    demoInvoice = await prisma.invoice.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        invoiceNumber: "DEMO-INV-0001",
        status: "issued",
        issueDate: new Date(),
        subtotalAmount: "500.00",
        discountAmount: "0.00",
        totalAmount: "500.00",
        amountPaid: "200.00",
        balanceAmount: "300.00",
        notes: "Local demo billing record only. No card or payment secrets stored.",
        createdByUserId: demoOwner?.id,
        issuedByUserId: demoOwner?.id,
        issuedAt: new Date(),
        items: {
          create: [
            {
              description: "Demo consultation service",
              quantity: 1,
              unitAmount: "500.00",
              lineAmount: "500.00",
              notes: "Local demo invoice item only."
            }
          ]
        }
      }
    });
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      invoiceId: demoInvoice.id,
      amount: "200.00",
      method: "cash",
      status: "recorded"
    }
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: demoInvoice.id,
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        method: "cash",
        amount: "200.00",
        referenceNote: "Local demo cash payment only.",
        recordedByUserId: demoOwner?.id
      }
    });
  }

  const existingAiDraft = await prisma.aiDraft.findFirst({
    where: {
      patientId: demoPatientA.id,
      draftType: "encounter_summary",
      modelProvider: "disabled_mock"
    }
  });

  if (!existingAiDraft) {
    await prisma.aiDraft.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        draftType: "encounter_summary",
        status: "pending_doctor_review",
        inputSourceSummary: "Local demo placeholder only. No external AI request was made.",
        generatedText: "AI draft placeholder only. External AI access is disabled. Doctor review is required before any future AI-assisted text could be used.",
        modelProvider: "disabled_mock",
        modelName: "no_external_ai",
        promptVersion: "placeholder_v1",
        requestedByUserId: demoOwner?.id
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
