import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, css] = await Promise.all([
  readFile("apps/web/app/patients/[id]/page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const tab of ["Overview", "History", "Current Visit", "Prescriptions", "Investigations & Results", "Women’s Health", "Documents", "Timeline"]) {
  assert(page.includes(`label: "${tab}"`), `patient workspace tab missing: ${tab}`);
}
assert(page.includes('const patientWorkspaceTabs = new Set(["overview", "history", "doctor-visit", "prescriptions", "investigations", "womens-health", "documents", "timeline"])'), "only eight focused patient tabs may be top-level");
assert(page.includes('active.key === "womens-health"') && page.includes("GynecologyWorkspace") && page.includes("InfertilityWorkspacePanel"), "women’s health must reuse existing clinical workspaces");
assert(!page.includes('active.key !== "overview" && active.key !=='), "specialized tabs must not render a duplicate generic panel");
assert(css.includes("min-height: 132px") && css.includes("repeat(8, minmax(0, 1fr))"), "patient identity and desktop tabs must stay compact and symmetrical");

console.log("Compact patient file workspace PASS");
