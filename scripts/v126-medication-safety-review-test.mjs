import { readFile } from "node:fs/promises";
import { createPrisma } from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const checks = [];
const failures = [];

try {
  await checkBackend();
  await checkUi();
  await checkScripts();
  await checkDatabaseGate();
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`V126-MED-SAFETY-REVIEW PASS ${JSON.stringify({ checks })}`);
} finally {
  await prisma.$disconnect();
}

async function checkBackend() {
  const service = await read("apps/api/src/care-assist/medication-pregnancy-lactation-safety.service.ts");
  const controller = await read("apps/api/src/care-assist/care-assist.controller.ts");
  const schema = await read("apps/api/prisma/schema.prisma");
  assertIncludes(controller, "import-preview", "import preview endpoint exists");
  assertIncludes(controller, "import-commit", "import commit endpoint exists");
  assertIncludes(controller, "review-queue", "review queue endpoint exists");
  assertIncludes(controller, "review-decision", "review decision endpoint exists");
  assertIncludes(controller, '@Permissions("medication_safety_profile.manage")', "Owner/Admin permission protects import and review");
  assertIncludes(service, 'reviewStatus: "needs_review"', "imports are review gated");
  assertIncludes(service, 'categoryInput === "E" ? "REVIEW_REQUIRED"', "category E maps to REVIEW_REQUIRED");
  assertIncludes(service, "Forbidden medication safety profile field", "dosing and retail fields are rejected");
  assertIncludes(service, "Approval requires source metadata.", "approval requires source metadata");
  assertIncludes(service, "Review decision requires a reason.", "review decision requires reason");
  assertIncludes(service, "medication_safety_profile.import_committed", "import commit is audited");
  assertIncludes(service, "medication_safety_profile.${decision}", "review decisions are audited");
  assert(!/enum\s+LegacyPregnancyCategory\s*{[^}]*\bE\b/s.test(schema), "category E is a valid pregnancy category");
  checks.push("backend import and review workflow is guarded and audited");
}

async function checkUi() {
  const admin = await read("apps/web/components/care-assist/MedicationSafetyProfileSearch.tsx");
  const terminal = await read("apps/web/components/medications/MedicationSafetyTerminal.tsx");
  for (const phrase of ["Import Source File", "Preview import", "Commit accepted rows", "Approve", "Reject", "Retire", "Review required"]) {
    assertIncludes(admin, phrase, `admin UI includes ${phrase}`);
  }
  for (const phrase of ["Source year", "Source link", "Reviewed by", "Reviewed at", "Review required"]) {
    assertIncludes(terminal, phrase, `terminal includes ${phrase}`);
  }
  const combined = `${admin}\n${terminal}`.toLowerCase();
  for (const forbidden of ["safe in pregnancy", "recommended drug", "best drug", "use this", "dose suggestion", "raw json", "<pre><code>"]) {
    assert(!combined.includes(forbidden), `forbidden UI wording found: ${forbidden}`);
  }
  checks.push("admin UI and prescription terminal show review metadata without forbidden wording");
}

async function checkScripts() {
  const pkg = JSON.parse(await read("package.json"));
  const script = await read("scripts/v126-import-medication-safety-profiles.mjs");
  assert(pkg.scripts["db:v126:import-med-safety"] === "node scripts/v126-import-medication-safety-profiles.mjs", "missing db:v126 import script");
  assert(pkg.scripts["test:v126:med-safety-review"] === "node scripts/v126-medication-safety-review-test.mjs", "missing v126 test script");
  assertIncludes(script, "forbiddenFields", "import script rejects forbidden fields");
  assertIncludes(script, 'reviewStatus: "needs_review"', "import script writes needs_review");
  checks.push("v126 package scripts and importer are present");
}

async function checkDatabaseGate() {
  const [placeholders, reviewedWithoutSource] = await Promise.all([
    prisma.medicationSafetyProfile.count({ where: { reviewStatus: "needs_review" } }),
    prisma.medicationSafetyProfile.count({
      where: {
        reviewStatus: "reviewed",
        OR: [{ sourceName: "" }, { sourceName: "Not reviewed" }, { sourceType: "not_reviewed" }]
      }
    })
  ]);
  assert(placeholders >= 35, "expected at least 35 review-gated placeholder profiles");
  assert(reviewedWithoutSource === 0, "reviewed profile exists without source metadata");
  checks.push("placeholder profiles remain review-gated and reviewed profiles require source metadata");
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needle, message) {
  assert(source.includes(needle), `${message}: missing ${needle}`);
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
