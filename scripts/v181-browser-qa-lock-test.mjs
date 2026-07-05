import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

const routes = [
  "/login",
  "/dashboard",
  "/clinic-day/walkthrough",
  "/patients",
  "/patients/new",
  "/reception",
  "/reception/check-in",
  "/reception/today",
  "/calendar",
  "/queue",
  "/doctor/waiting",
  "/doctor/visit",
  "/prescriptions",
  "/investigations",
  "/billing",
  "/reports",
  "/ai-assistant",
  "/ai-drafts",
  "/admin",
  "/admin/services",
  "/admin/security-readiness",
  "/admin/medication-safety-profiles"
];

const routeFiles = routes.map((route) => {
  const relativePath = `apps/web/app${route}/page.tsx`;
  return { route, relativePath };
});

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

function routeLabel(route) {
  return route === "/" ? "root" : route;
}

for (const routeFile of routeFiles) {
  assert(existsSync(join(root, routeFile.relativePath)), `${routeLabel(routeFile.route)} page exists`);
}

const scannedSources = routeFiles
  .map(({ route, relativePath }) => `\n/* ${route} */\n${read(relativePath)}`)
  .join("\n");

const forbiddenPatterns = [
  { pattern: /safe\s+in\s+pregnancy/i, label: "no safe-in-pregnancy wording" },
  { pattern: /external\s+AI\s+(?:is\s+)?enabled/i, label: "no external AI enabled wording" },
  { pattern: /autonomous\s+(?:diagnosis|diagnosing|prescribing|dosing|treatment\s+ranking)/i, label: "no autonomous clinical action wording" },
  { pattern: /\b(?:Prisma|JWT|stack trace)\b/i, label: "no raw developer platform wording" },
  { pattern: /\b(?:schema|RBAC)\b/i, label: "no raw schema/RBAC wording in checked route pages" },
  { pattern: /\b(?:TypeError|ReferenceError|Unhandled Runtime Error|UnhandledPromiseRejection)\b/i, label: "no stack-error wording" },
  { pattern: /real\s+patient\s+data\s+seed\s+warning\s+failure/i, label: "no real patient seed warning failure text" }
];

for (const { pattern, label } of forbiddenPatterns) {
  assert(!pattern.test(scannedSources), label);
}

const automaticClinicalClaim = scannedSources
  .split(/\r?\n/)
  .find((line) =>
    /automatic\s+(?:diagnosis|diagnosing|prescribing|dosing|treatment\s+ranking)/i.test(line) &&
    !/\b(?:no|not|without|disabled|does\s+not|do\s+not)\b/i.test(line)
  );
assert(!automaticClinicalClaim, "no positive automatic clinical action wording");
assert(!/<pre\b[^>]*>[\s\S]*JSON\.stringify/i.test(scannedSources), "no raw JSON object text in route pages");

const aiAssistant = read("apps/web/app/ai-assistant/page.tsx");
const aiDrafts = read("apps/web/app/ai-drafts/page.tsx");
assert(/Draft.+doctor review required/i.test(aiAssistant), "AI assistant remains draft and doctor-review oriented");
assert(/External AI disabled/i.test(aiAssistant), "AI assistant states external AI is disabled");
assert(/No external AI request/i.test(aiDrafts), "AI drafts state no external AI request is made");

const adminSecurity = read("apps/web/app/admin/security-readiness/page.tsx");
assert(/Owner\/Admin access is required/i.test(adminSecurity), "security readiness remains Owner/Admin protected in UI");
assert(/not a production or legal readiness claim/i.test(adminSecurity), "security readiness avoids production-readiness claims");

console.log(`v0.18.1 browser QA lock checks passed (${checks.length})`);
