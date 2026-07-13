import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("apps/web/app/patients/page.tsx", "utf8");

assert(source.includes('useState("all")') && source.includes('<option value="all">All patients</option>'), "All patients must be the initial category");
assert(source.includes('if (search) params.set("q", search)'), "the initial directory request must work without a search query");
assert(!source.includes("if (search.length < 2)"), "the directory must not block its initial all-patient load");
assert(source.includes('<details className="filter-drawer">') && source.includes("More Filters"), "secondary filters must live in More Filters");
assert(source.includes("Clear filters") && source.includes("localStorage.removeItem"), "filters and explicit preference must be clearable");
assert(source.includes('localStorage.setItem("prijPatientDirectoryCategory"'), "category preference must persist only after explicit selection");

console.log("Patient directory defaults and filters PASS");
