import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("apps/web/app/patients/page.tsx", "utf8");

assert(source.includes('useState("all")') && source.includes('<option value="all">All clinic patients</option>'), "All patients must be the initial directory view");
assert(source.includes('if (search) params.set("q", search)'), "the initial directory request must work without a search query");
assert(!source.includes("if (search.length < 2)"), "the directory must not block its initial all-patient load");
for (const view of ["Today", "Waiting", "Recent", "Favorites"]) assert(source.includes(`>${view}</option>`), `${view} directory view is required`);
assert(source.includes("Clear filters"), "directory filters must be clearable");
assert(source.includes("patient-directory-desktop-table") && source.includes("patient-directory-mobile-list"), "desktop table and mobile cards are required");
assert(source.includes("pageInfo.total") && source.includes("Patient directory pagination"), "truthful totals and server pagination are required");

console.log("Patient directory defaults and filters PASS");
