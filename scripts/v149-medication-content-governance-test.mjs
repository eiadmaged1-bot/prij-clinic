import assert from "node:assert/strict";
import fs from "node:fs";

const seed = fs.readFileSync("apps/api/prisma/seed.js", "utf8");
const service = fs.readFileSync("apps/api/src/medications/medications.service.ts", "utf8");
const web = fs.readFileSync("apps/web/components/medications/PharmacologyWorkspace.tsx", "utf8");
const documentation = fs.readFileSync("docs/MEDICATION_CONTENT_GOVERNANCE.md", "utf8");

let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions += 1; }

check(seed.includes("ATC/DDD Index 2026"), "official classification source is registered");
check(seed.includes("https://atcddd.fhi.no/atc_ddd_index/"), "source URL is attributable");
check(seed.includes('reviewStatus: "needs_review"'), "generic profiles are not auto-approved");
check(seed.includes('reviewStatus: "catalog_only"'), "family memberships remain catalog-only");
check(!seed.includes('mainUse:'), "identity catalog does not seed use claims");
check(!seed.includes('mechanism:'), "identity catalog does not seed mechanism claims");

const catalogMatch = seed.match(/const governedIdentityCatalog = \[([\s\S]*?)\n  \];/);
check(catalogMatch, "governed identity catalog exists");
const catalogEntries = [...catalogMatch[1].matchAll(/\["[^"]+", "[A-Z0-9_]+"\]/g)];
check(catalogEntries.length === 43, `expected 43 governed identities, found ${catalogEntries.length}`);
for (const family of ["SABA", "LABA", "LAMA", "INHALED_CORTICOSTEROID", "ACEI", "ARB", "BETA_BLOCKER", "CCB", "THIAZIDE", "LOOP_DIURETIC", "POTASSIUM_SPARING_DIURETIC", "STATIN"]) {
  check(catalogMatch[1].includes(`\"${family}\"`), `${family} coverage exists`);
}
check(service.includes("incompleteFamilies"), "API groups incomplete families");
check(service.includes("identity-linked-clinical-sections-may-be-incomplete"), "API exposes cautious coverage state");
check(web.includes("Identity linked; clinical sections may be incomplete"), "UI labels identity-only coverage truthfully");
check(web.includes("Incomplete families"), "UI groups incomplete families");
check(documentation.includes("does **not** import uses"), "documentation states unsupported clinical content");
check(documentation.includes("does not automatically select"), "documentation preserves doctor decision boundary");

console.log(`v1.4.9 medication content governance assertions passed: ${assertions}`);
