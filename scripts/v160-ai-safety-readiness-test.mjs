import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const env = read("apps/api/src/config/env.ts");
const aiDrafts = read("apps/api/src/ai-drafts/ai-drafts.service.ts");
const aiManagement = read("apps/api/src/ai-management/ai-management.service.ts");
const doctorVisit = read("apps/web/app/doctor/visit/page.tsx") + read("apps/web/app/patients/[id]/visit-flow-components.tsx");
const prescriptions = read("apps/web/app/prescriptions/page.tsx");
const medicationSafety = read("apps/api/src/care-assist/medication-pregnancy-lactation-safety.service.ts");
const adminMedicationPage = read("apps/web/app/admin/medication-safety-profiles/page.tsx");
const existingRegression = read("scripts/ai-safety-regression-test.mjs");
const isolatedRunner = read("scripts/run-isolated-ai-test.mjs");
const docs = read("docs/AI_SAFETY_READINESS.md");

assert(packageJson.scripts["test:v160:ai-safety-readiness"] === "node scripts/v160-ai-safety-readiness-test.mjs", "AI safety readiness test script is registered");
assert(packageJson.scripts["test:ai:regression"] === "node scripts/run-isolated-ai-test.mjs regression" && isolatedRunner.includes("scripts/ai-safety-regression-test.mjs"), "existing AI regression remains registered through the isolated test database guard");
assert(env.includes("AI_FEATURES_ENABLED must stay false") && env.includes("AI_PROVIDER must be disabled"), "external AI runtime calls are disabled by default");
assert(aiDrafts.includes("externalAiAccess: false") && aiDrafts.includes("insertedIntoClinicalRecord: false"), "AI drafts remain assistive and not inserted into clinical records");
assert(aiManagement.includes("doctorDecisionRequired: true") && aiManagement.includes("externalAiAccess: false"), "AI management snapshots require doctor decision and no external AI access");
assert(doctorVisit.includes("No automated diagnosis is generated") && doctorVisit.includes("Doctor review required"), "doctor visit UI blocks autonomous diagnosis and requires doctor review");
assert(prescriptions.includes("Doctor manual review required") && prescriptions.includes("No auto-prescribing or automatic dosing"), "prescriptions remain manual and explicitly block automatic dosing/prescribing");
assert(medicationSafety.includes("reviewStatus: \"needs_review\"") && medicationSafety.includes("Approval requires source metadata"), "medication safety remains review-gated");
assert(adminMedicationPage.includes("Owner/Admin") && !/secret|api key|token|password/i.test(adminMedicationPage), "AI/medication admin surface does not expose secrets");
assert(docs.includes("Prompt-injection") && docs.includes("must not override clinical, security, consent, RBAC, or privacy rules"), "prompt-injection protection guidance exists");
assert(existingRegression.includes("externalAiAccess !== false") && existingRegression.includes("insertedIntoClinicalRecord !== false"), "existing AI regression checks external access and record insertion");

console.log(`v0.16.0 AI safety readiness checks passed (${checks.length})`);
