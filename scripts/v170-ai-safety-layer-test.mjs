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
const service = read("apps/api/src/ai-drafts/ai-drafts.service.ts");
const controller = read("apps/api/src/ai-drafts/ai-drafts.controller.ts");
const dto = read("apps/api/src/ai-drafts/dto.ts");
const panel = read("apps/web/components/ai-assistant/SafeAiAssistantPanel.tsx");
const page = read("apps/web/app/ai-assistant/page.tsx");
const nav = read("apps/web/app/navigation-registry.ts");
const patientPage = read("apps/web/app/patients/[id]/page.tsx") + read("apps/web/app/patients/[id]/workspace-module-renderer.tsx");

assert(packageJson.scripts["test:v170:ai-safety-layer"] === "node scripts/v170-ai-safety-layer-test.mjs", "v0.17 AI safety layer script is registered");
assert(controller.includes('@Controller("ai-drafts")') && controller.includes('Get("safety-status")'), "AI safety status endpoint exists on protected AI draft controller");
assert(controller.includes('Post("patients/:patientId/generate")') && controller.includes('@Permissions("ai_draft.request")'), "patient-scoped draft generation endpoint is permission protected");
assert(controller.includes('Post("patients/:patientId/search")') && controller.includes('@Permissions("ai_draft.read")'), "patient-file search helper is permission protected");
assert(dto.includes("GenerateAssistantDraftDto"), "assistant draft DTO is explicit");
assert(service.includes("externalAiEnabled: false") && service.includes('modelProvider: "disabled_mock"') && service.includes('modelName: "no_external_ai"'), "external AI remains disabled by default");
assert(service.includes("autonomousDiagnosis: false") && service.includes("autonomousPrescribing: false") && service.includes("autonomousDosing: false"), "autonomous diagnosis, prescribing, and dosing are disabled");
assert(service.includes("insertedIntoClinicalRecord: false"), "AI draft audit proves no clinical insertion");
assert(service.includes("No diagnosis, treatment plan, medication choice, dose, or investigation suggestion"), "history summary blocks clinical recommendations");
assert(service.includes("No new diagnosis, medication, dose, treatment ranking"), "visit summary blocks autonomous clinical decisions");
assert(panel.includes("Draft - doctor review required") && panel.includes("External AI is disabled"), "AI assistant UI shows draft and disabled-external-AI labels");
assert(page.includes("Safe AI Assistant") && page.includes("Assistant draft workspace"), "AI assistant route shell exists");
assert(nav.includes('href: "/ai-assistant"') && nav.includes('roles: ["Owner", "Admin", "Doctor"]'), "AI assistant navigation is clinical/admin role gated");
assert(patientPage.includes("<SafeAiAssistantPanel patientId={patient.id} />"), "patient workspace embeds patient-scoped AI assistant panel");

console.log(`v0.17.0 AI safety layer checks passed (${checks.length})`);
