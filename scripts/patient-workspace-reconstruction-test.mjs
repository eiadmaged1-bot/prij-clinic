import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [registry, renderer, css] = await Promise.all([
  readFile("apps/web/components/patients/patient-workspace-registry.ts", "utf8"),
  readFile("apps/web/app/patients/[id]/workspace-module-renderer.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const tab of ["Overview", "History", "Current Visit", "Prescriptions", "Investigations & Results", "Women’s Health", "Documents", "Timeline"]) {
  assert(registry.includes(`"${tab}"`), `patient workspace tab missing: ${tab}`);
}
for (const key of ["overview", "history", "doctor-visit", "prescriptions", "investigations", "pregnancy", "documents", "timeline"]) {
  assert(registry.includes(`item("${key}"`), `central registry missing ${key}`);
}
assert(renderer.includes("pregnancy:") && renderer.includes("GynecologyWorkspace") && renderer.includes("InfertilityWorkspacePanel"), "women’s health must reuse existing clinical workspaces");
assert(!renderer.includes('active.key !== "overview" && active.key !=='), "specialized tabs must not render a duplicate generic panel");
assert(css.includes("min-height: 132px") && css.includes("repeat(8, minmax(0, 1fr))"), "patient identity and desktop tabs must stay compact and symmetrical");

console.log("Compact patient file workspace on centralized registry PASS");
