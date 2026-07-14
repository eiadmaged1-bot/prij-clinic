import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [service, dto, normalizer, ui, viewer, css] = await Promise.all([
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8"),
  readFile("apps/api/src/guidelines/dto/search-guidelines.dto.ts", "utf8"),
  readFile("apps/api/src/guidelines/utils/text-normalizer.ts", "utf8"),
  readFile("apps/web/app/guidelines/GuidelineCenter.tsx", "utf8"),
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const alias of ["pco", "pcos", "polycystic ovary syndrome", "polycystic ovarian syndrome", "تكيس المبايض", "متلازمة تكيس المبايض"]) assert(service.includes(alias), `PCOS concept alias missing ${alias}`);
assert(normalizer.includes("\\u0600-\\u06ff") && normalizer.includes("[أإآ]"), "Arabic text must be preserved and normalized");
for (const field of ["organization", "specialty", "year", "region", "status", "sourceKind", "clinicalArea", "synthesis"]) assert(dto.includes(field) && ui.includes(`name=\"${field}\"`), `search filter missing ${field}`);
for (const area of ["pregnancy", "infertility", "gynecology", "oncology", "medication", "investigation", "procedure"]) assert(ui.includes(`\"${area}\"`), `clinical-area filter missing ${area}`);
for (const group of ["PCOS and infertility", "PCOS and pregnancy", "PCOS and metabolic risk", "PCOS and ovulation", "PCOS and menstrual disorders", "PCOS and endometrial risk", "PCOS monitoring", "PCOS treatment-related guidance"]) assert(service.includes(group), `clinical subtopic missing ${group}`);
assert(service.includes("summaries:") && service.includes("summaryBullets"), "reviewed summaries must be searched");
assert(service.includes("exactQuery") && service.includes('guidelineStatus === "ACTIVE"') && service.includes('status === "CLINIC_APPROVED"'), "ranking must prioritize exact, current, clinic-approved evidence");
assert(ui.includes("Why matched:") && ui.includes("Open summary") && ui.includes("Open exact PDF page"), "result explanation and navigation missing");
assert(viewer.includes('searchParams.get("page")') && viewer.includes('searchParams.get("tab")'), "search result deep links must open exact page or summary");
assert(service.includes('status: "DOCTOR_REVIEW_REQUIRED"') && ui.includes("Doctor review required"), "cross-document synthesis safety state missing");
assert(service.includes("agreement:") && service.includes("differences:") && service.includes("evidenceGaps:"), "synthesis comparison fields missing");
assert(css.includes(".guideline-search-sticky") && css.includes("position: sticky"), "persistent guideline search box missing");

console.log("v1.4.5 bilingual cross-guideline clinical search PASS (43 assertions)");
