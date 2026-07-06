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
const { seedInvestigationCatalog } = require("./seeds/investigation-catalog");

const scrypt = promisify(crypto.scrypt);
const prisma = new PrismaClient();
const appEnv = process.env.APP_ENV || (process.env.NODE_ENV === "production" ? "production" : "local");
const isProduction = appEnv === "production";
const seedDemoData = !isProduction && process.env.SEED_DEMO_DATA === "true" && process.env.ALLOW_DEMO_DATA_SEED === "true";

function toUtcDateOnly(input = new Date()) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

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
  ["Owner", "Owner role for clinic governance and setup."],
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
  "encounter.assign_doctor_signature",
  "encounter.sign",
  "encounter.void",
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
  "clinical_case_library.view_own",
  "clinical_case_library.view_all",
  "staff_chat.read",
  "staff_chat.write",
  "staff_chat.patient_link",
  "staff_chat.oversight",
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

const careAssistPermissions = [
  "care_assist.read",
  "care_assist.evaluate",
  "care_assist.decide",
  "care_assist.manage",
  "medication_safety_profile.manage"
];

permissions.push(...careAssistPermissions);

const clinicWorkflowPermissions = [
  "patient_intake.read",
  "patient_intake.write",
  "patient_intake.submit",
  "patient_intake.review",
  "patient_intake.sign",
  "doctor_queue.read",
  "doctor_queue.select_patient",
  "prescription_templates.read",
  "prescription_templates.manage",
  "doctor_medication_shortcuts.read",
  "doctor_medication_shortcuts.manage",
  "prescriptions.print",
  "prescriptions.attach_patient",
  "prescriptions.sign",
  "investigations.request",
  "investigations.review_results",
  "investigations.manage_catalog",
  "clinical_requests.read",
  "clinical_requests.write",
  "clinical_requests.review",
  "clinical_requests.cancel",
  "search.global",
  "search.clinical",
  "follow_up_hints.read",
  "follow_up_hints.decide"
];

permissions.push(...clinicWorkflowPermissions);

const workflowSpinePermissions = [
  "investigation.result_read",
  "investigation.result_create",
  "investigation.result_update",
  "investigation.result_review",
  "investigation.result_void",
  "investigation.routing_manage",
  "patient_document.read",
  "patient_document.create",
  "patient_document.review",
  "patient_document.archive",
  "patient_document.void",
  "patient_document.restricted_read",
  "consent_template.read",
  "consent_template.manage",
  "consent_record.sign_demo",
  "consent_record.review",
  "referral.read",
  "referral.create",
  "referral.update",
  "referral.close",
  "referral.print",
  "patient_task.read",
  "patient_task.create",
  "patient_task.update",
  "patient_task.assign",
  "patient_internal_note.read",
  "patient_internal_note.create",
  "patient_internal_note.archive",
  "patient_internal_note.admin_read",
  "patient_internal_note.clinical_read",
  "patient_internal_note.finance_read"
];

permissions.push(...workflowSpinePermissions);

const reservedSystemOwnerPermissions = ["system_owner.manage", "developer_owner.manage"];
const guidelineSourceRegistry = ["WHO", "NICE", "RCOG", "ACOG", "FIGO", "ESHRE", "ASRM", "SMFM", "CDC", "FSRH", "Local Clinic Protocol"];

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
    "encounter.void",
    "encounter.assign_doctor_signature",
    "clinical_case_library.view_own",
    "clinical_case_library.view_all",
    "staff_chat.read",
    "staff_chat.write",
    "staff_chat.patient_link",
    "staff_chat.oversight",
    "calculator.read",
    "calculator.manage",
    "guidelines.read",
    "guidelines.search",
    "guidelines.manage_sources",
    "guidelines.manage_private",
    "protocol_atlas.read",
    "protocol_atlas.manage",
    "guideline.read",
    "guideline.manage",
    "guideline.review",
    "ai_management.read",
    "investigation.routing_manage",
    "patient_document.read",
    "patient_document.create",
    "patient_document.review",
    "patient_document.archive",
    "patient_document.void",
    "patient_document.restricted_read",
    "consent_template.read",
    "consent_template.manage",
    "consent_record.sign_demo",
    "consent_record.review",
    "referral.read",
    "referral.create",
    "referral.update",
    "referral.close",
    "referral.print",
    "patient_task.read",
    "patient_task.create",
    "patient_task.update",
    "patient_task.assign",
    "patient_internal_note.read",
    "patient_internal_note.create",
    "patient_internal_note.archive",
    "patient_internal_note.admin_read",
    "patient_internal_note.clinical_read",
    "patient_internal_note.finance_read",
    "medications.read",
    "medications.search",
    "medications.manage_catalog",
    "medications.manage_sources",
    "medications.import",
    "medications.verify",
    "medications.safety_check",
    "medications.review_alerts",
    "medications.override_alerts",
    "care_assist.read",
    "care_assist.evaluate",
    "care_assist.decide",
    "care_assist.manage",
    "medication_safety_profile.manage",
    "patient_intake.read",
    "patient_intake.write",
    "patient_intake.submit",
    "patient_intake.review",
    "patient_intake.sign",
    "doctor_queue.read",
    "doctor_queue.select_patient",
    "prescription_templates.read",
    "prescription_templates.manage",
    "doctor_medication_shortcuts.read",
    "doctor_medication_shortcuts.manage",
    "prescriptions.print",
    "prescriptions.attach_patient",
    "prescriptions.sign",
    "investigations.request",
    "investigations.review_results",
    "investigations.manage_catalog",
    "clinical_requests.read",
    "clinical_requests.write",
    "clinical_requests.review",
    "clinical_requests.cancel",
    "search.global",
    "search.clinical",
    "follow_up_hints.read",
    "follow_up_hints.decide",
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
    "clinical_case_library.view_own",
    "clinical_case_library.view_all",
    "staff_chat.read",
    "staff_chat.write",
    "staff_chat.patient_link",
    "encounter.sign",
    "encounter.void",
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
    "investigation.result_read",
    "investigation.result_create",
    "investigation.result_update",
    "investigation.result_review",
    "investigation.result_void",
    "patient_document.read",
    "patient_document.create",
    "patient_document.review",
    "patient_document.archive",
    "consent_template.read",
    "consent_record.sign_demo",
    "consent_record.review",
    "referral.read",
    "referral.create",
    "referral.update",
    "referral.close",
    "referral.print",
    "patient_task.read",
    "patient_task.create",
    "patient_task.update",
    "patient_task.assign",
    "patient_internal_note.read",
    "patient_internal_note.create",
    "patient_internal_note.archive",
    "patient_internal_note.clinical_read",
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
    "care_assist.read",
    "care_assist.evaluate",
    "care_assist.decide",
    "patient_intake.read",
    "patient_intake.review",
    "patient_intake.sign",
    "doctor_queue.read",
    "doctor_queue.select_patient",
    "prescription_templates.read",
    "prescription_templates.manage",
    "doctor_medication_shortcuts.read",
    "doctor_medication_shortcuts.manage",
    "prescriptions.print",
    "prescriptions.attach_patient",
    "prescriptions.sign",
    "investigations.request",
    "investigations.review_results",
    "clinical_requests.read",
    "clinical_requests.write",
    "clinical_requests.review",
    "clinical_requests.cancel",
    "search.global",
    "search.clinical",
    "follow_up_hints.read",
    "follow_up_hints.decide",
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
    "staff_chat.read",
    "staff_chat.write",
    "vitals.create",
    "prep_note.create",
    "prep_note.read",
    "encounter.read",
    "encounters.read",
    "report.read",
    "reports.read",
    "investigation.result_read",
    "investigation.result_create",
    "patient_document.read",
    "patient_document.create",
    "patient_task.read",
    "patient_task.create",
    "patient_task.update",
    "patient_internal_note.read",
    "patient_internal_note.create",
    "patient_internal_note.clinical_read",
    "patient_intake.read",
    "patient_intake.write",
    "patient_intake.submit",
    "search.global",
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
    "patient_intake.read",
    "patient_intake.write",
    "patient_intake.submit",
    "search.global",
    "payment.manage",
    "investigation.routing_manage",
    "patient_document.read",
    "patient_document.create",
    "consent_template.read",
    "consent_record.sign_demo",
    "patient_task.read",
    "patient_task.create",
    "patient_task.update",
    "patient_task.assign",
    "patient_internal_note.read",
    "patient_internal_note.create"
  ],
  Accountant: [
    "billing.read",
    "billing.manage",
    "payment.manage",
    "billing.adjust",
    "billing.void",
    "billing.report",
    "staff_chat.read",
    "staff_chat.write",
    "dashboard.read",
    "patient.read",
    "patient_document.read",
    "patient_task.read",
    "patient_task.create",
    "patient_task.update",
    "patient_internal_note.read",
    "patient_internal_note.create",
    "patient_internal_note.finance_read"
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

async function seedGuidelineCenter(prisma, demoOwner) {
  for (const name of guidelineSourceRegistry) {
    const existing = await prisma.guidelineSource.findFirst({ where: { name } });
    const data = {
      name,
      organization: name,
      sourceType: "LINK_ONLY",
      websiteUrl: null,
      countryOrRegion: null,
      specialties: ["women_health", "obgyn"],
      defaultAccessLevel: "OWNER_DOCTOR",
      active: true,
      notes: "Source registry metadata only. Imported documents require clinical governance review."
    };

    if (existing) {
      await prisma.guidelineSource.update({ where: { id: existing.id }, data });
    } else {
      await prisma.guidelineSource.create({ data });
    }
  }

  if (!seedDemoData) return;

  let localSource = await prisma.guidelineSource.findFirst({ where: { name: "Local Clinic Protocol" } });
  const localSourceData = {
    name: "Local Clinic Protocol",
    organization: "Local Clinic Protocol",
    sourceType: "LINK_ONLY",
    websiteUrl: null,
    countryOrRegion: null,
    specialties: ["women_health", "obgyn"],
    defaultAccessLevel: "OWNER_DOCTOR",
    active: true,
    notes: "Local demo source metadata only."
  };
  localSource = localSource
    ? await prisma.guidelineSource.update({ where: { id: localSource.id }, data: localSourceData })
    : await prisma.guidelineSource.create({ data: localSourceData });

  const existing = await prisma.guidelineDocument.findFirst({
    where: {
      sourceId: localSource.id,
      title: "Demo guideline center safety text"
    }
  });
  if (existing) return;

  const document = await prisma.guidelineDocument.create({
    data: {
      sourceId: localSource.id,
      title: "Demo guideline center safety text",
      specialty: "Women's health",
      topic: "Guideline center safety",
      organization: "Local Clinic Protocol",
      guidelineStatus: "NEEDS_REVIEW",
      licenseStatus: "CHECK_REQUIRED",
      accessLevel: "OWNER_DOCTOR",
      originalUrl: null,
      importedByUserId: demoOwner?.id,
      versions: { create: { versionLabel: "demo_text_v1", status: "NEEDS_REVIEW" } },
      importJobs: {
        create: {
          jobType: "TEXT_EXTRACTION",
          status: "SUCCEEDED",
          message: "Seeded local demo import. No external AI call.",
          requestedByUserId: demoOwner?.id,
          startedAt: new Date(),
          finishedAt: new Date()
        }
      }
    }
  });

  const section = await prisma.guidelineSection.create({
    data: {
      documentId: document.id,
      heading: "Demo evidence library safety",
      sectionPath: "Demo evidence library safety",
      orderIndex: 1,
      text: "Demo evidence library safety text."
    }
  });

  const demoChunks = [
    "The evidence library is a local extractive reference aid for doctors. It does not diagnose, prescribe, or create a final clinical plan.",
    "When no local source is found, the system states that no source was found and requires doctor review.",
    "Demo guideline text is original local test content and is not a substitute for licensed guideline review or clinical governance approval."
  ];
  for (const [index, text] of demoChunks.entries()) {
    await prisma.guidelineChunk.create({
      data: {
        documentId: document.id,
        sectionId: section.id,
        chunkIndex: index,
        citationLabel: "Local Clinic Protocol: Demo guideline center safety text",
        text,
        normalizedText: text.toLowerCase().replace(/\W+/g, " ")
      }
    });
  }

  if (demoOwner?.id) {
    await prisma.guidelineReviewDecision.create({
      data: {
        documentId: document.id,
        decision: "REJECTED",
        reason: "Seeded demo text requires clinical governance review before production.",
        decidedByUserId: demoOwner.id,
        decidedAt: new Date()
      }
    });
  }
}

async function seedWorkflowSpine(prisma, demoPatient, branch, demoOwner) {
  const providers = [
    ["Demo Central Lab", "laboratory"],
    ["Demo Radiology Center", "radiology_center"],
    ["Demo Referral Hospital", "hospital"],
    ["Demo Fetal Medicine Consultant", "referral_doctor"]
  ];
  const providerByName = new Map();
  for (const [name, providerType] of providers) {
    const existing = await prisma.externalProvider.findFirst({ where: { name } });
    const data = { name, providerType, active: true, notes: "Local demo provider directory record only." };
    const provider = existing ? await prisma.externalProvider.update({ where: { id: existing.id }, data }) : await prisma.externalProvider.create({ data });
    providerByName.set(name, provider);
  }

  const departments = [
    ["RECEPTION", "Reception", "reception"],
    ["DOCTOR_ROOM", "Doctor Room", "doctor_room"],
    ["ULTRASOUND_ROOM", "Ultrasound Room", "ultrasound"],
    ["LAB_DESK", "Lab Desk", "laboratory"],
    ["RADIOLOGY_DESK", "Radiology Desk", "radiology"],
    ["FINANCE_DESK", "Finance Desk", "finance"]
  ];
  for (const [code, name, departmentType] of departments) {
    await prisma.clinicDepartment.upsert({
      where: { code },
      update: { name, departmentType, branchId: branch.id, active: true },
      create: { code, name, departmentType, branchId: branch.id, active: true }
    });
  }

  const templates = [
    ["GENERAL_TREATMENT_DEMO_V1", "General treatment consent", "general_treatment", true],
    ["ULTRASOUND_EXAM_DEMO_V1", "Ultrasound examination consent", "ultrasound", true],
    ["PROCEDURE_PLACEHOLDER_DEMO_V1", "Procedure consent placeholder", "procedure", true],
    ["REPORT_STORAGE_DEMO_V1", "Report storage consent", "report_storage", true],
    ["COMMUNICATION_DEMO_V1", "Communication consent", "communication", true],
    ["AI_PROCESSING_PLACEHOLDER_DEMO_V1", "AI processing consent placeholder", "ai_processing", false],
    ["REFERRAL_PLACEHOLDER_DEMO_V1", "Referral consent placeholder", "referral", true]
  ];
  for (const [code, title, category, active] of templates) {
    await prisma.consentTemplate.upsert({
      where: { code },
      update: {
        title,
        category,
        language: "en",
        versionLabel: "demo-v1",
        bodyText: `${title}. Local demo placeholder only. Legal review is required before real use.`,
        active
      },
      create: {
        code,
        title,
        category,
        language: "en",
        versionLabel: "demo-v1",
        bodyText: `${title}. Local demo placeholder only. Legal review is required before real use.`,
        active
      }
    });
  }

  const order = await prisma.investigationOrder.upsert({
    where: { orderNumber: "DEMO-ORD-0001" },
    update: {
      patientId: demoPatient.id,
      doctorId: demoOwner.id,
      orderSource: "patient_file",
      orderType: "laboratory",
      priority: "routine",
      status: "result_ready",
      targetDepartment: "Lab Desk",
      externalProviderId: providerByName.get("Demo Central Lab")?.id,
      billingStatus: "waived_demo",
      clinicalQuestion: "Demo follow-up question only. Doctor-authored text."
    },
    create: {
      orderNumber: "DEMO-ORD-0001",
      patientId: demoPatient.id,
      doctorId: demoOwner.id,
      orderSource: "patient_file",
      orderType: "laboratory",
      priority: "routine",
      status: "result_ready",
      targetDepartment: "Lab Desk",
      externalProviderId: providerByName.get("Demo Central Lab")?.id,
      billingStatus: "waived_demo",
      clinicalQuestion: "Demo follow-up question only. Doctor-authored text.",
      notes: "Local demo investigation order only.",
      items: {
        create: [
          { category: "laboratory", testName: "CBC demo metadata", itemName: "CBC demo metadata", specimenType: "Demo blood sample", status: "result_ready" }
        ]
      }
    }
  });

  const resultSeeds = [
    ["DEMO-RES-CBC-001", "CBC result metadata", "laboratory", false, false],
    ["DEMO-RES-US-001", "Pelvic ultrasound external report metadata", "ultrasound", true, false],
    ["DEMO-RES-BHCG-001", "Beta-hCG follow-up metadata", "laboratory", true, true],
    ["DEMO-RES-UA-001", "Urine analysis metadata", "laboratory", false, false],
    ["DEMO-RES-RAD-001", "Radiology report metadata", "radiology", false, false]
  ];
  for (const [resultNumber, title, category, abnormalFlag, criticalFlag] of resultSeeds) {
    await prisma.investigationResult.upsert({
      where: { resultNumber },
      update: {
        patientId: demoPatient.id,
        branchId: branch.id,
        orderId: order.id,
        category,
        title,
        summaryText: "Demo result metadata only. Doctor review required. No automatic interpretation.",
        abnormalFlag,
        criticalFlag,
        reviewStatus: "pending_review",
        createdByUserId: demoOwner.id
      },
      create: {
        resultNumber,
        patientId: demoPatient.id,
        branchId: branch.id,
        orderId: order.id,
        category,
        title,
        summaryText: "Demo result metadata only. Doctor review required. No automatic interpretation.",
        abnormalFlag,
        criticalFlag,
        reviewStatus: "pending_review",
        createdByUserId: demoOwner.id
      }
    });
  }

  const document = await findOrCreate(prisma.patientDocument, { patientId: demoPatient.id, title: "Demo CBC document metadata" }, {
    patientId: demoPatient.id,
    branchId: branch.id,
    title: "Demo CBC document metadata",
    documentType: "lab_result",
    category: "Laboratory",
    status: "active",
    storageMode: "metadata_only",
    summaryText: "Metadata-only demo archive item. No real PHI file stored.",
    confidentialityLevel: "normal",
    uploadedByUserId: demoOwner.id
  });

  await findOrCreate(prisma.referral, { patientId: demoPatient.id, reason: "Demo fetal medicine referral follow-up" }, {
    patientId: demoPatient.id,
    branchId: branch.id,
    referredByUserId: demoOwner.id,
    referralDirection: "outbound",
    referralType: "fetal_medicine",
    referredToProviderId: providerByName.get("Demo Fetal Medicine Consultant")?.id,
    reason: "Demo fetal medicine referral follow-up",
    clinicalSummary: "Doctor-authored demo clinical summary placeholder only.",
    urgency: "routine",
    status: "draft"
  });

  const tasks = [
    ["Review pending lab result", "review_result", "high"],
    ["Schedule follow-up", "schedule_follow_up", "normal"],
    ["Collect missing consent", "prepare_document", "normal"],
    ["Confirm report pickup", "admin_task", "low"]
  ];
  for (const [title, taskType, priority] of tasks) {
    await findOrCreate(prisma.patientTask, { patientId: demoPatient.id, title }, {
      patientId: demoPatient.id,
      branchId: branch.id,
      createdByUserId: demoOwner.id,
      relatedDocumentId: title === "Confirm report pickup" ? document.id : null,
      taskType,
      title,
      priority,
      status: "open",
      description: "Local demo workflow task only."
    });
  }

  await findOrCreate(prisma.patientInternalNote, { patientId: demoPatient.id, title: "Demo internal workflow note" }, {
    patientId: demoPatient.id,
    branchId: branch.id,
    createdByUserId: demoOwner.id,
    noteType: "safety_note",
    visibility: "clinical_only",
    title: "Demo internal workflow note",
    bodyText: "Internal demo note only. Not for patient portal or external messaging.",
    pinned: true
  });
}

async function findOrCreate(model, where, data) {
  const existing = await model.findFirst({ where });
  if (existing) {
    return model.update({ where: { id: existing.id }, data });
  }
  return model.create({ data });
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
    ["QAT", "Qatar", "QAT", true],
    ["KWT", "Kuwait", "KWT", true],
    ["BHR", "Bahrain", "BHR", true],
    ["OMN", "Oman", "OMN", true],
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
    {
      code: "EDA_EDDB_SEARCH",
      name: "Egyptian Drug Authority EDDB official search",
      countryCode: "EG",
      sourceType: "official_registry",
      priorityRank: 10,
      officialUrl: "https://eddb.edaegypt.gov.eg/",
      sourceAccessMode: "public_discovery",
      importerKey: "egypt-eda-targeted-lookup",
      coverageStatus: "partial",
      sourceFreshnessStatus: "manual_required",
      notes: "Targeted admin verification only where technically allowed. Bulk brute-force enumeration is forbidden."
    },
    {
      code: "EDA_EGYPTIAN_DRUG_REGISTER",
      name: "Egyptian Drug Authority public drug register",
      countryCode: "EG",
      sourceType: "official_registry",
      priorityRank: 11,
      officialUrl: "https://www.edaegypt.gov.eg/",
      sourceAccessMode: "public_discovery",
      importerKey: "eda-drug-register",
      coverageStatus: "partial",
      sourceFreshnessStatus: "manual_required",
      notes: "Import public official files only when safely available. Egypt is partial unless a complete official bulk file is imported."
    },
    {
      code: "EDA_OFFICIAL_FILE_UPLOAD",
      name: "EDA official file upload",
      countryCode: "EG",
      sourceType: "official_upload",
      priorityRank: 12,
      officialUrl: "https://www.edaegypt.gov.eg/",
      sourceAccessMode: "official_upload",
      importerKey: "eda-official-file",
      coverageStatus: "blocked_requires_official_file",
      sourceFreshnessStatus: "manual_required",
      notes: "Owner-provided official EDDB/EDA file import."
    },
    {
      code: "SFDA_DRUGS_LIST",
      name: "Saudi FDA Drugs List",
      countryCode: "KSA",
      sourceType: "official_registry",
      priorityRank: 10,
      officialUrl: "https://www.sfda.gov.sa/",
      sourceAccessMode: "public_discovery",
      importerKey: "sfda-drugs-list",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Primary official Saudi medication/product data source."
    },
    {
      code: "SFDA_OFFICIAL_FILE_UPLOAD",
      name: "SFDA official file upload",
      countryCode: "KSA",
      sourceType: "official_upload",
      priorityRank: 12,
      officialUrl: "https://www.sfda.gov.sa/",
      sourceAccessMode: "official_upload",
      importerKey: "sfda-drugs-list",
      coverageStatus: "blocked_requires_official_file",
      sourceFreshnessStatus: "manual_required",
      notes: "Owner-provided official SFDA export import."
    },
    {
      code: "UAE_MOHAP_REGISTERED_MEDICAL_PRODUCT_DIRECTORY",
      name: "UAE MOHAP registered medical product directory",
      countryCode: "UAE",
      sourceType: "official_registry",
      priorityRank: 10,
      officialUrl: "https://mohap.gov.ae/",
      sourceAccessMode: "approved_api_required",
      importerKey: "uae-mohap-directory",
      requiresApproval: true,
      coverageStatus: "blocked_requires_api_approval",
      sourceFreshnessStatus: "gated",
      notes: "Do not bypass MOHAP access controls. Use approved API credentials or official file upload."
    },
    {
      code: "UAE_MOHAP_OPEN_DATA_API_MARKETPLACE",
      name: "UAE MOHAP open-data/API marketplace",
      countryCode: "UAE",
      sourceType: "official_api",
      priorityRank: 11,
      officialUrl: "https://mohap.gov.ae/",
      sourceAccessMode: "approved_api_required",
      importerKey: "uae-mohap-api",
      requiresApproval: true,
      coverageStatus: "blocked_requires_api_approval",
      sourceFreshnessStatus: "gated",
      notes: "Requires approved API access when not public."
    },
    {
      code: "UAE_OFFICIAL_FILE_UPLOAD",
      name: "UAE official file upload",
      countryCode: "UAE",
      sourceType: "official_upload",
      priorityRank: 12,
      officialUrl: "https://mohap.gov.ae/",
      sourceAccessMode: "official_upload",
      importerKey: "uae-mohap-directory",
      coverageStatus: "blocked_requires_official_file",
      sourceFreshnessStatus: "manual_required",
      notes: "Owner-provided official MOHAP file import."
    },
    {
      code: "QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
      name: "Qatar MOPH registered pharmaceutical products with prices",
      countryCode: "QAT",
      sourceType: "official_registry",
      priorityRank: 10,
      officialUrl: "https://www.moph.gov.qa/",
      sourceAccessMode: "public_discovery",
      importerKey: "qatar-moph-xlsx",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Discover and import the official MOPH XLSX when safely available."
    },
    {
      code: "QATAR_OFFICIAL_FILE_UPLOAD",
      name: "Qatar official file upload",
      countryCode: "QAT",
      sourceType: "official_upload",
      priorityRank: 12,
      officialUrl: "https://www.moph.gov.qa/",
      sourceAccessMode: "official_upload",
      importerKey: "qatar-moph-xlsx",
      coverageStatus: "blocked_requires_official_file",
      sourceFreshnessStatus: "manual_required",
      notes: "Owner-provided official Qatar file import."
    },
    {
      code: "KUWAIT_MOH_DRUG_PRICE_LIST",
      name: "Kuwait MOH drug price list",
      countryCode: "KWT",
      sourceType: "official_registry",
      priorityRank: 10,
      officialUrl: "https://www.moh.gov.kw/",
      sourceAccessMode: "public_discovery",
      importerKey: "kuwait-moh-price-pdf",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "PDF parsing is best effort. Low-confidence rows route to review."
    },
    {
      code: "KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST",
      name: "Kuwait MOH food supplement price list",
      countryCode: "KWT",
      sourceType: "official_registry",
      priorityRank: 11,
      officialUrl: "https://www.moh.gov.kw/",
      sourceAccessMode: "public_discovery",
      importerKey: "kuwait-moh-price-pdf",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Official supplement price-list PDF, separate from medicine rows."
    },
    {
      code: "KUWAIT_OFFICIAL_FILE_UPLOAD",
      name: "Kuwait official file upload",
      countryCode: "KWT",
      sourceType: "official_upload",
      priorityRank: 12,
      officialUrl: "https://www.moh.gov.kw/",
      sourceAccessMode: "official_upload",
      importerKey: "kuwait-moh-price-pdf",
      coverageStatus: "blocked_requires_official_file",
      sourceFreshnessStatus: "manual_required",
      notes: "Owner-provided official Kuwait file import."
    },
    {
      code: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
      name: "Bahrain NHRA registered medicine price list",
      countryCode: "BHR",
      sourceType: "official_registry",
      priorityRank: 10,
      officialUrl: "https://www.nhra.bh/",
      sourceAccessMode: "public_discovery",
      importerKey: "bahrain-nhra-xlsx",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Discover latest NHRA open-data registered medicine price list."
    },
    {
      code: "BAHRAIN_NHRA_LICENSED_MEDICINES_OPEN_DATA",
      name: "Bahrain NHRA licensed medicines open data",
      countryCode: "BHR",
      sourceType: "official_registry",
      priorityRank: 11,
      officialUrl: "https://www.nhra.bh/",
      sourceAccessMode: "public_discovery",
      importerKey: "bahrain-nhra-xlsx",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Official NHRA open data where safely available."
    },
    {
      code: "BAHRAIN_OFFICIAL_FILE_UPLOAD",
      name: "Bahrain official file upload",
      countryCode: "BHR",
      sourceType: "official_upload",
      priorityRank: 12,
      officialUrl: "https://www.nhra.bh/",
      sourceAccessMode: "official_upload",
      importerKey: "bahrain-nhra-xlsx",
      coverageStatus: "blocked_requires_official_file",
      sourceFreshnessStatus: "manual_required",
      notes: "Owner-provided official Bahrain file import."
    },
    {
      code: "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
      name: "Oman MOH registered pharmaceutical products with prices",
      countryCode: "OMN",
      sourceType: "official_registry",
      priorityRank: 10,
      officialUrl: "https://www.moh.gov.om/en/hospitals-directorates/directorates-and-centers-at-hq/drug-safety-center/",
      sourceAccessMode: "public_discovery",
      importerKey: "oman-official-upload",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Official MOH Drug Safety Center public product price list. Rows remain review-gated."
    },
    {
      code: "OMAN_MOH_SUPP_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
      name: "Oman MOH supplement registered pharmaceutical products with prices",
      countryCode: "OMN",
      sourceType: "official_registry",
      priorityRank: 11,
      officialUrl: "https://www.moh.gov.om/en/hospitals-directorates/directorates-and-centers-at-hq/drug-safety-center/",
      sourceAccessMode: "public_discovery",
      importerKey: "oman-official-upload",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Official MOH Drug Safety Center supplement/product price list when published separately. Rows remain review-gated."
    },
    {
      code: "OMAN_MOH_DRUG_SAFETY_CENTER",
      name: "Oman MOH Drug Safety Center",
      countryCode: "OMN",
      sourceType: "official_registry",
      priorityRank: 12,
      officialUrl: "https://www.moh.gov.om/en/hospitals-directorates/directorates-and-centers-at-hq/drug-safety-center/",
      sourceAccessMode: "public_discovery",
      importerKey: "oman-official-upload",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      notes: "Official MOH Drug Safety Center page used for public file discovery. Rows remain review-gated."
    },
    {
      code: "OMAN_OFFICIAL_FILE_UPLOAD",
      name: "Oman official file upload",
      countryCode: "OMN",
      sourceType: "official_upload",
      priorityRank: 12,
      officialUrl: "https://www.moh.gov.om/",
      sourceAccessMode: "official_upload",
      importerKey: "oman-official-upload",
      coverageStatus: "blocked_requires_official_file",
      sourceFreshnessStatus: "manual_required",
      notes: "Owner-provided official Oman file import."
    },
    {
      code: "YEMEN_OFFICIAL_FILE_UPLOAD",
      name: "Yemen official file upload",
      countryCode: "YEM",
      sourceType: "official_upload",
      priorityRank: 90,
      officialUrl: null,
      sourceAccessMode: "official_upload",
      importerKey: "generic-official-file",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "manual_required",
      active: false,
      notes: "Optional Yemen source remains disabled until an official source is provided."
    },
    {
      code: "RETAIL_PUBLIC_METADATA_CONNECTOR_TEMPLATE",
      name: "Retail public metadata connector template",
      countryCode: null,
      sourceType: "retail_metadata",
      priorityRank: 100,
      officialUrl: null,
      sourceAccessMode: "unavailable",
      importerKey: "retail-template-disabled",
      policyStatus: "blocked",
      sourcePolicyStatus: "blocked",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "unknown",
      active: false,
      notes: "Disabled by default. Retail metadata cannot override official registry data and must never use stock/order/cart/checkout paths."
    },
    {
      code: "LOCAL_MANUAL",
      name: "Local manual catalog entry",
      countryCode: null,
      sourceType: "manual",
      priorityRank: 95,
      officialUrl: null,
      sourceAccessMode: "official_upload",
      importerKey: "generic-official-file",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "manual_required",
      notes: "Manual/admin metadata must stay review-gated."
    },
    {
      code: "LICENSED_PROVIDER",
      name: "Licensed provider placeholder",
      countryCode: null,
      sourceType: "licensed_provider",
      priorityRank: 30,
      officialUrl: null,
      sourceAccessMode: "official_upload",
      importerKey: "generic-official-file",
      coverageStatus: "not_imported",
      sourceFreshnessStatus: "manual_required",
      notes: "Licensed provider files uploaded by the owner/admin only."
    }
  ];
  const marketSourceByCode = new Map();
  for (const sourceConfig of marketSources) {
    const {
      code,
      name,
      countryCode,
      sourceType,
      priorityRank,
      officialUrl,
      sourceAccessMode,
      importerKey,
      requiresApproval = false,
      policyStatus = "approved",
      sourcePolicyStatus = policyStatus,
      coverageStatus = "not_imported",
      sourceFreshnessStatus = "unknown",
      notes,
      active = true
    } = sourceConfig;
    const source = await prisma.drugMarketSource.upsert({
      where: { code },
      update: {
        name,
        countryCode,
        sourceType,
        priorityRank,
        policyStatus,
        sourcePolicyStatus,
        verificationStatus: "catalog_only",
        websiteUrl: officialUrl,
        officialUrl,
        sourceAccessMode,
        importerKey,
        requiresApproval,
        notes,
        active
      },
      create: {
        code,
        name,
        countryCode,
        sourceType,
        priorityRank,
        policyStatus,
        sourcePolicyStatus,
        verificationStatus: "catalog_only",
        websiteUrl: officialUrl,
        officialUrl,
        sourceAccessMode,
        importerKey,
        requiresApproval,
        coverageStatus,
        sourceFreshnessStatus,
        notes,
        active
      }
    });
    marketSourceByCode.set(code, source);
  }
  await prisma.drugMarketSource.updateMany({
    where: {
      code: {
        in: [
          "EDA_EDDB",
          "SFDA_DRUG_LIST",
          "UAE_EDE_DIRECTORY",
          "UAE_MOHAP_SHARIK",
          "QATAR_MOPH_DRUG_LIST",
          "BAHRAIN_NHRA_MEDICINES_LIST",
          "OMAN_MOH_OFFICIAL_UPLOAD",
          "YEMEN_OFFICIAL_UPLOAD",
          "YEMEN_WHO_NEML_REFERENCE"
        ]
      }
    },
    data: { active: false, coverageStatus: "not_imported", sourceFreshnessStatus: "unknown", notes: "Legacy v0.7 source alias retained for history; v0.8 registry uses official source-specific records." }
  });
  await prisma.drugMarketSource.updateMany({
    where: { code: "OMAN_MOH_DRUG_SAFETY_CENTER", coverageStatus: "blocked_requires_official_file" },
    data: { coverageStatus: "not_imported", sourceFreshnessStatus: "unknown" }
  });

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
    ["SFDA_OFFICIAL_DRUG_LIST_CONNECTOR", "SFDA official drug list connector", "SFDA_DRUGS_LIST", "official_registry", "KSA", false, true],
    ["EDA_EDDB_CONNECTOR", "EDA EDDB targeted lookup connector", "EDA_EDDB_SEARCH", "official_registry", "EG", false, false],
    ["EDA_OFFICIAL_FILE_UPLOAD_CONNECTOR", "EDA official file upload connector", "EDA_OFFICIAL_FILE_UPLOAD", "official_upload", "EG", false, true],
    ["UAE_MOHAP_DIRECTORY_CONNECTOR", "UAE MOHAP directory connector", "UAE_MOHAP_REGISTERED_MEDICAL_PRODUCT_DIRECTORY", "official_registry", "UAE", false, false],
    ["UAE_OFFICIAL_FILE_UPLOAD_CONNECTOR", "UAE official file upload connector", "UAE_OFFICIAL_FILE_UPLOAD", "official_upload", "UAE", false, true],
    ["QATAR_MOPH_CONNECTOR", "Qatar MOPH connector", "QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES", "official_registry", "QAT", false, true],
    ["KUWAIT_MOH_DRUG_PRICE_CONNECTOR", "Kuwait MOH drug price connector", "KUWAIT_MOH_DRUG_PRICE_LIST", "official_registry", "KWT", false, true],
    ["KUWAIT_MOH_SUPPLEMENT_PRICE_CONNECTOR", "Kuwait MOH supplement price connector", "KUWAIT_MOH_FOOD_SUPPLEMENT_PRICE_LIST", "official_registry", "KWT", false, true],
    ["BAHRAIN_NHRA_CONNECTOR", "Bahrain NHRA connector", "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST", "official_registry", "BHR", false, true],
    ["OMAN_MOH_PRICE_LIST_CONNECTOR", "Oman MOH price list connector", "OMAN_MOH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES", "official_registry", "OMN", false, true],
    ["OMAN_MOH_SUPP_PRICE_LIST_CONNECTOR", "Oman MOH supplement price list connector", "OMAN_MOH_SUPP_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES", "official_registry", "OMN", false, true],
    ["OMAN_OFFICIAL_UPLOAD_CONNECTOR", "Oman official upload connector", "OMAN_OFFICIAL_FILE_UPLOAD", "official_upload", "OMN", false, true],
    ["YEMEN_OFFICIAL_UPLOAD_CONNECTOR", "Yemen official upload connector", "YEMEN_OFFICIAL_FILE_UPLOAD", "official_upload", "YEM", false, false],
    ["RETAIL_PUBLIC_METADATA_CONNECTOR_TEMPLATE", "Retail public metadata connector template", "RETAIL_PUBLIC_METADATA_CONNECTOR_TEMPLATE", "retail_metadata", null, true, false]
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
        policyStatus: isRetailMetadata ? "blocked" : "approved",
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
        policyStatus: isRetailMetadata ? "blocked" : "approved",
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

  const demoProducts = [
    ["DemoEG", "Demo generic EG", [["EG", "1 g tablet", "tablet"], ["EG", "457 mg/5 mL oral suspension", "oral suspension"]]],
    ["DemoKSA", "Demo generic KSA", [["KSA", "625 mg tablet", "tablet"]]],
    ["DemoUAE", "Demo generic UAE", [["UAE", "vial", "vial"]]],
    ["DemoQAT", "Demo generic QAT", [["QAT", "ampoule", "ampoule"]]],
    ["DemoKWT", "Demo generic KWT", [["KWT", "sachet", "sachet"]]],
    ["DemoBHR", "Demo generic BHR", [["BHR", "inhaler", "inhaler"]]],
    ["DemoOMN", "Demo generic OMN", [["OMN", "patch", "patch"]]],
    ["DemoYEM", "Demo generic YEM", [["YEM", "drops", "drops"]]],
    ["DemoGulf", "Demo generic Gulf", [["KSA", "suppository", "suppository"], ["UAE", "cream", "cream"], ["QAT", "cream", "cream"], ["KWT", "cream", "cream"], ["BHR", "cream", "cream"], ["OMN", "cream", "cream"]]]
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
      verificationStatus: "catalog_only",
      isDemo: true
    };
    product = product
      ? await prisma.drugMarketProduct.update({ where: { id: product.id }, data: productData })
      : await prisma.drugMarketProduct.create({ data: productData });

    for (const [countryCode, strengthText, dosageForm] of variants) {
      const sourceCodeByCountry = {
        EG: "EDA_OFFICIAL_FILE_UPLOAD",
        KSA: "SFDA_DRUGS_LIST",
        UAE: "UAE_OFFICIAL_FILE_UPLOAD",
        QAT: "QATAR_MOPH_REGISTERED_PHARMACEUTICAL_PRODUCTS_WITH_PRICES",
        KWT: "KUWAIT_MOH_DRUG_PRICE_LIST",
        BHR: "BAHRAIN_NHRA_REGISTERED_MEDICINE_PRICE_LIST",
        OMN: "OMAN_OFFICIAL_FILE_UPLOAD",
        YEM: "YEMEN_OFFICIAL_UPLOAD"
      };
      const source = marketSourceByCode.get(sourceCodeByCountry[countryCode] ?? "LOCAL_MANUAL");
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
          verificationStatus: "catalog_only",
          isDemo: true
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
          verificationStatus: "catalog_only",
          isDemo: true
        }
      });
    }
    await recomputeDemoAvailability(prisma, product.id);
  }
  await prisma.drugMarketVariant.updateMany({
    where: { registrationNumber: { startsWith: "DEMO-" } },
    data: { isDemo: true, verificationStatus: "catalog_only" }
  });
  await prisma.drugMarketProduct.updateMany({
    where: { tradeName: { startsWith: "Demo" } },
    data: { isDemo: true, verificationStatus: "catalog_only" }
  });
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
      name: "Prij Clinic Main",
      status: "active"
    },
    create: {
      name: "Prij Clinic Main",
      code: "main",
      status: "active"
    }
  });

  const branchB = await prisma.branch.upsert({
    where: { code: "demo-b" },
    update: {
      name: "Prij Clinic Secondary",
      status: "active"
    },
    create: {
      name: "Prij Clinic Secondary",
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

  for (const [name, organization, websiteUrl, sourceType, countryOrRegion, specialties, notes] of guidelineSources) {
    const existing = await prisma.guidelineSource.findFirst({ where: { name } });
    const data = {
      name,
      organization,
      websiteUrl,
      sourceType,
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

  let demoOwner = null;

  const seededDemoEmails = [
    "owner@prij.local",
    "demo.owner@prij.local",
    "demo.doctor@prij.local",
    "demo.reception@prij.local",
    "demo.accountant@prij.local",
    "demo.nurse@prij.local"
  ];

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

  {
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

    const seededDemoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: seededDemoEmails } },
          { displayName: { contains: "Demo" } },
          { displayName: { contains: "Test User" } },
          { displayName: { contains: "Training User" } }
        ],
        NOT: { id: localAdmin.id }
      },
      select: { id: true }
    });

    if (seededDemoUsers.length > 0) {
      const ids = seededDemoUsers.map((user) => user.id);
      await prisma.encounter.updateMany({ where: { doctorId: { in: ids } }, data: { doctorId: localAdmin.id } });
      await prisma.prescription.updateMany({ where: { doctorId: { in: ids } }, data: { doctorId: localAdmin.id } });
      await prisma.investigationOrder.updateMany({ where: { doctorId: { in: ids } }, data: { doctorId: localAdmin.id } });
      await prisma.patientHistorySheet.updateMany({ where: { createdByUserId: { in: ids } }, data: { createdByUserId: localAdmin.id } });
      await prisma.guidelineReviewDecision.updateMany({ where: { decidedByUserId: { in: ids } }, data: { decidedByUserId: localAdmin.id } });
      await prisma.guidelineQueryLog.updateMany({ where: { userId: { in: ids } }, data: { userId: localAdmin.id } });
      await prisma.aIManagementSnapshot.updateMany({ where: { createdByUserId: { in: ids } }, data: { createdByUserId: localAdmin.id } });
      await prisma.patientClinicalMemory.updateMany({ where: { approvedByUserId: { in: ids } }, data: { approvedByUserId: localAdmin.id } });
      await prisma.patientCalculation.updateMany({ where: { calculatedByUserId: { in: ids } }, data: { calculatedByUserId: localAdmin.id } });
      await prisma.pregnancyDatingAssessment.updateMany({ where: { createdByUserId: { in: ids } }, data: { createdByUserId: localAdmin.id } });
      await prisma.careAssistDecision.updateMany({ where: { decidedByUserId: { in: ids } }, data: { decidedByUserId: localAdmin.id } });
      await prisma.userPermissionOverride.deleteMany({ where: { userId: { in: ids } } });
      await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids }, protectedAccount: false } });
    }

  }

  await prisma.systemSetting.upsert({
    where: { key: "appearance" },
    update: {
      valueJson: {
        defaultTheme: "clinic-premium",
        allowUserThemeOverride: true,
        defaultDoctorComfortMode: false
      }
    },
    create: {
      key: "appearance",
      valueJson: {
        defaultTheme: "clinic-premium",
        allowUserThemeOverride: true,
        defaultDoctorComfortMode: false
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
  await seedGuidelineCenter(prisma, demoOwner);
  await seedInvestigationCatalog(prisma);
  await seedMedicationIntelligence(prisma);

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
      appointmentId: demoAppointment.id
    }
  });

  if (!existingTicket) {
    const checkedInAt = new Date();
    const queueDate = toUtcDateOnly(checkedInAt);
    const lastTicketForDate = await prisma.queueTicket.findFirst({
      where: {
        branchId: mainBranch.id,
        queueDate
      },
      orderBy: {
        queueNumber: "desc"
      }
    });

    await prisma.queueTicket.create({
      data: {
        branchId: mainBranch.id,
        patientId: demoPatientA.id,
        appointmentId: demoAppointment.id,
        queueNumber: (lastTicketForDate?.queueNumber ?? 0) + 1,
        queueDate,
        status: "waiting",
        priority: "routine",
        visitType: "kashf",
        checkedInAt
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

  if (demoOwner) {
    await seedWorkflowSpine(prisma, demoPatientA, mainBranch, demoOwner);
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
