import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, workspace, service, controller, css] = await Promise.all([
  readFile("apps/web/app/medications/page.tsx", "utf8"),
  readFile("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8"),
  readFile("apps/api/src/medications/medications.service.ts", "utf8"),
  readFile("apps/api/src/medications/medications.controller.ts", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

assert(page.includes("Generic-first") && page.includes("PharmacologyWorkspace"), "generic-first pharmacology workspace missing");
assert(workspace.includes("pharmacology-search-sticky") && css.includes("position: sticky"), "persistent pharmacology search missing");
for (const field of ["generic medicine", "family", "mechanism", "target", "spectrum", "indication", "adverse effect", "renal/hepatic property"]) assert(workspace.includes(field), `search scope missing ${field}`);
for (const field of ["Main use", "Key caution", "Clearance", "Open profile"]) assert(workspace.includes(field), `quick result missing ${field}`);
for (const level of ["Quick", "Clinical", "Full source"]) assert(workspace.includes(`"${level}"`), `summary level missing ${level}`);
for (const section of ["Clinical overview", "Mechanism", "Pharmacodynamics", "Pharmacokinetics", "Renal/Hepatic", "Common adverse effects", "Serious warnings", "Interactions", "Pregnancy/Lactation", "Monitoring", "Calculators", "Sources"]) assert(workspace.includes(`"${section}"`), `collapsed profile section missing ${section}`);
assert(workspace.includes("setOpenSection") && workspace.includes("current === section ? null : section"), "only one profile section may open at once");
assert(workspace.includes("scrollY") && workspace.includes("searchRef.current?.focus"), "profile open/close must preserve search and scroll context");
assert(workspace.includes("No source-reviewed") && workspace.includes("Doctor review is required"), "missing evidence must remain explicit and review-gated");
assert(css.includes("justify-content: flex-end") && css.includes("align-items: flex-end"), "desktop side panel and mobile bottom sheet layouts missing");
assert(controller.includes('@Get("pharmacology/search")') && controller.includes('@Get("pharmacology/generics/:id")'), "pharmacology endpoints missing");
assert(service.includes("genericFirst: true") && service.includes("tradeNamesAreAliasesOnly: true"), "search response must guarantee generic-first identity");

console.log("v1.4.5 compact summary-first pharmacology workspace PASS (35 assertions)");
