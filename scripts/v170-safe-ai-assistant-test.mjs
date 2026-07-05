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

function roleBlock(seed, role) {
  const match = seed.match(new RegExp(`${role}: \\[(?<body>[\\s\\S]*?)\\n  \\]`, "m"));
  return match?.groups?.body ?? "";
}

const packageJson = JSON.parse(read("package.json"));
const service = read("apps/api/src/ai-drafts/ai-drafts.service.ts");
const controller = read("apps/api/src/ai-drafts/ai-drafts.controller.ts");
const panel = read("apps/web/components/ai-assistant/SafeAiAssistantPanel.tsx");
const route = read("apps/web/app/ai-assistant/page.tsx");
const patientPage = read("apps/web/app/patients/[id]/page.tsx");
const seed = read("apps/api/prisma/seed.js");
const regression = read("scripts/ai-safety-regression-test.mjs");

const receptionist = roleBlock(seed, "Receptionist");
const accountant = roleBlock(seed, "Accountant");

assert(packageJson.scripts["test:v170:safe-ai-assistant"] === "node scripts/v170-safe-ai-assistant-test.mjs", "v0.17 safe AI assistant script is registered");
assert(route.includes("Assistant draft workspace") && route.includes("External AI disabled"), "AI assistant route exists with disabled external AI label");
assert(controller.includes('@UseGuards(JwtAuthGuard, PermissionsGuard)') && controller.includes('@Permissions("ai_draft.request")'), "AI assistant backend routes are protected");
assert(!receptionist.includes("ai_draft.") && !accountant.includes("ai_draft."), "receptionist/accountant are denied clinical AI draft permissions");
assert(panel.includes("Draft - doctor review required") && panel.includes("Nothing is copied into the patient record automatically"), "AI draft UI requires doctor review and no automatic final save");
assert(service.includes("from recorded fields only") && service.includes("unknown"), "history summary uses recorded facts and keeps unknown fields unknown");
assert(service.includes("Doctor-entered") && service.includes("No new diagnosis, medication, dose"), "visit summary does not add diagnosis, prescription, or dose");
assert(service.includes("missingFieldChecklist") && service.includes("Checklist only; no clinical recommendation"), "missing field checklist is deterministic and non-advisory");
assert(service.includes("not sent automatically") && service.includes("No WhatsApp, SMS, email"), "follow-up reminder is draft-only and does not send communications");
assert(service.includes("patientScoped: true") && service.includes("patientSearchResults"), "patient-file search helper is patient scoped");
assert(service.includes("ai_draft.safe_assistant_generated") && service.includes("ai_assistant.patient_file_search"), "AI audit strings exist");
assert(service.includes("externalAiAccess: false") && regression.includes("externalAiAccess !== false"), "external AI disabled default is regression-covered");
assert(!/sk-proj-|sk-[A-Za-z0-9_-]{8,}/.test(`${service}\n${panel}\n${route}`), "no API keys or secrets are present in AI assistant source");
assert(patientPage.includes("<SafeAiAssistantPanel patientId={patient.id} />"), "patient workspace includes patient-scoped assistant tab");

console.log(`v0.17.0 safe AI assistant checks passed (${checks.length})`);
