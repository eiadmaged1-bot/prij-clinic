import { readFile } from "node:fs/promises";
import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const checks = [];
const failures = [];

try {
  await checkSchema();
  await checkImportScript();
  await checkUiText();
  await checkRulesAndProfiles();
  await checkRbacAndAudit();
  await checkNoExternalAi();

  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
  console.log(`V123-CARE-ASSIST-SAFETY PASS ${JSON.stringify({ checks })}`);
} finally {
  await prisma.$disconnect();
}

async function checkSchema() {
  const schema = await read("apps/api/prisma/schema.prisma");
  assert(!/enum\s+LegacyPregnancyCategory\s*{[^}]*\bE\b/s.test(schema), "category E is present in LegacyPregnancyCategory");
  const profileBlock = block(schema, "model MedicationSafetyProfile");
  for (const forbidden of ["dose", "frequency", "duration", "price", "stock", "tradeName", "brandName", "pharmacy", "inventory"]) {
    assert(!new RegExp(`\\b${forbidden}\\b`, "i").test(profileBlock), `forbidden field in MedicationSafetyProfile: ${forbidden}`);
  }
  checks.push("schema excludes category E and dosing/commercial fields");
}

async function checkImportScript() {
  const source = await read("scripts/v123-import-medication-safety-profiles.mjs");
  assert(source.includes('categoryInput === "E" ? "REVIEW_REQUIRED"'), "category E is not mapped to REVIEW_REQUIRED");
  for (const forbidden of ["dose", "frequency", "duration", "price", "stock", "tradeName", "brandName"]) {
    assert(source.includes(`"${forbidden}"`), `import script does not reject ${forbidden}`);
  }
  checks.push("import script maps category E and rejects dosing/commercial fields");
}

async function checkUiText() {
  const files = [
    "apps/web/components/care-assist/CareAssistPanel.tsx",
    "apps/web/components/care-assist/CareAssistFindingCard.tsx",
    "apps/web/components/medications/PregnancyLactationSafetyProfile.tsx",
    "apps/web/components/medications/MedicationComponents.tsx",
    "apps/web/app/care-assist/page.tsx"
  ];
  const text = (await Promise.all(files.map(read))).join("\n");
  for (const phrase of ["best drug", "recommended drug", "safe in pregnancy", "use this drug", "dose suggestion", "treatment ranking", "AI doctor"]) {
    assert(!new RegExp(escapeRegExp(phrase), "i").test(text), `forbidden UI phrase found: ${phrase}`);
  }
  assert(/Doctor review required/i.test(text), "UI does not show doctor review required language");
  checks.push("UI avoids forbidden recommendation wording");
}

async function checkRulesAndProfiles() {
  const rules = await prisma.careAssistRule.findMany();
  assert(rules.some((rule) => rule.code === "MISSING_ALLERGY_HISTORY"), "missing field rules are not seeded");
  const forbidden = /\b(diagnose|prescribe|best drug|recommended drug|safe in pregnancy|use this drug|dose|frequency|duration|first-line)\b/i;
  for (const rule of rules) {
    assert(!forbidden.test(`${rule.title} ${rule.messageTemplate} ${rule.actionLabel ?? ""}`), `forbidden treatment wording in rule ${rule.code}`);
  }
  const claims = await prisma.medicationSafetyProfile.count({
    where: {
      OR: [
        { pregnancyRiskSummary: { not: null } },
        { lactationRiskSummary: { not: null } },
        { pregnancyClinicalConsiderations: { not: null } },
        { lactationClinicalConsiderations: { not: null } }
      ]
    }
  });
  assert(claims === 0, "seeded medication safety profiles contain clinical claims");
  const reviewRequired = await prisma.medicationSafetyProfile.count({ where: { legacyPregnancyCategory: "REVIEW_REQUIRED", lactationRiskLevel: "REVIEW_REQUIRED", reviewStatus: "needs_review" } });
  assert(reviewRequired > 0, "review-required empty profiles are missing");
  checks.push("rules are completeness/safety-review only and seeded profiles have no fake claims");
}

async function checkRbacAndAudit() {
  const doctor = await rolePermissions("Doctor");
  const nurse = await rolePermissions("Nurse");
  const reception = await rolePermissions("Receptionist");
  const accountant = await rolePermissions("Accountant");
  assert(doctor.has("care_assist.read") && doctor.has("care_assist.evaluate") && doctor.has("care_assist.decide"), "Doctor lacks Care Assist permissions");
  assert(!doctor.has("care_assist.manage") && !doctor.has("medication_safety_profile.manage"), "Doctor has admin-only Care Assist management permission");
  for (const [role, permissions] of [["Nurse", nurse], ["Receptionist", reception], ["Accountant", accountant]]) {
    assert(!permissions.has("care_assist.read") && !permissions.has("care_assist.evaluate") && !permissions.has("medication_safety_profile.manage"), `${role} has advanced Care Assist access`);
  }
  const service = await read("apps/api/src/care-assist/care-assist.service.ts");
  const profileService = await read("apps/api/src/care-assist/medication-pregnancy-lactation-safety.service.ts");
  assert(service.includes("care_assist.evaluated") && service.includes("care_assist.finding_decision"), "Care Assist audit actions missing");
  assert(profileService.includes("medication_safety_profile.updated"), "Medication safety profile audit action missing");
  assert(service.includes("Dismissal reason is required for high or critical review findings"), "critical dismissal reason guard missing");
  checks.push("RBAC denies non-clinical roles and audit hooks are present");
}

async function checkNoExternalAi() {
  const text = await read("apps/api/src/care-assist/care-assist-evaluator.service.ts");
  assert(!/openai|anthropic|fetch\(|axios|http/i.test(text), "Care Assist evaluator appears to call an external AI/network service");
  checks.push("Care Assist evaluator makes no external AI calls");
}

async function rolePermissions(roleName) {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: { rolePermissions: { include: { permission: true } } }
  });
  return new Set(role?.rolePermissions.map((item) => item.permission.key) ?? []);
}

async function read(path) {
  return readFile(path, "utf8");
}

function block(text, header) {
  const start = text.indexOf(header);
  if (start < 0) return "";
  const rest = text.slice(start);
  const end = rest.indexOf("\nmodel ", 1);
  return end > 0 ? rest.slice(0, end) : rest;
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
