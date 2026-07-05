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
const panel = read("apps/web/components/ai-assistant/SafeAiAssistantPanel.tsx");
const docs = [
  "docs/PROMPT_INJECTION_PROTECTION.md",
  "docs/AI_LIMITATIONS.md",
  "docs/V0_17_0_SAFE_AI_ASSISTANT_LAYER.md"
].map(read).join("\n");

assert(packageJson.scripts["test:v170:prompt-injection-guard"] === "node scripts/v170-prompt-injection-guard-test.mjs", "v0.17 prompt-injection guard script is registered");
assert(service.includes("hasPromptInjectionLikeText") && service.includes("ignore previous instructions"), "prompt-like content detector exists");
assert(service.includes("ai_draft.prompt_injection_warning"), "prompt-injection warnings are audited");
assert(service.includes("instructionIgnored: true"), "prompt-like instructions are ignored and recorded as ignored");
assert(service.includes("[untrusted instruction removed]"), "prompt-like content is sanitized before draft text");
assert(panel.includes("document text, OCR, patient-entered content, and copied text are treated as untrusted content"), "normal UI explains untrusted external content without exposing system prompts");
assert(!panel.includes("system prompt") && panel.includes("provider configuration are not shown"), "normal UI does not expose system instructions or provider config");
assert(docs.includes("External and user-provided content is untrusted") || docs.includes("external/user-provided content as untrusted"), "docs state external content is untrusted");
assert(docs.includes("must not override clinical, security, consent, RBAC, audit, or privacy rules"), "docs state prompt injection cannot override core controls");
assert(docs.includes("External AI calls are disabled by default"), "docs state external AI remains disabled");

console.log(`v0.17.0 prompt-injection guard checks passed (${checks.length})`);
