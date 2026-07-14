import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, registry, flow, footer, more, css] = await Promise.all([
  readFile("apps/web/app/patients/[id]/page.tsx", "utf8"),
  readFile("apps/web/components/patients/patient-workspace-registry.ts", "utf8"),
  readFile("apps/web/app/patients/[id]/visit-flow-components.tsx", "utf8"),
  readFile("apps/web/components/doctor/DoctorMobileVisitFooter.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const label of ["Overview", "Visit", "History", "Timeline", "More"]) assert(registry.includes(`"${label}"`), `primary navigation missing ${label}`);
for (const label of ["Women’s Health", "Documents", "Previous Prescriptions", "Results", "Administrative details"]) assert(more.includes(label), `More menu missing ${label}`);
assert(page.includes('className="patient-context-bar"'), "sticky patient context bar missing");
for (const context of ["MRN", "No active phase", "Allergies: review", "Start / Resume Visit"]) assert(page.includes(context), `patient context missing ${context}`);
assert(!page.includes("patient-simple-hero"), "oversized patient hero must not render");
assert(!page.includes("DoctorMobilePatientHeader"), "duplicate patient identity header must not render");
for (const step of ["History", "Examination", "Assessment", "Plan", "Review"]) assert(flow.includes(`activeStep === "${step}"`), `guided step missing ${step}`);
assert(flow.includes('aria-label="Plan sections"'), "nested Plan navigation missing");
for (const action of ["Back", "Save draft", "Next", "Review"]) assert(footer.includes(`>${action}<`), `mobile action bar missing ${action}`);
assert(css.includes(".patient-context-bar") && css.includes("position: sticky"), "patient context is not sticky");
assert(css.includes(".doctor-mobile-visit-footer { position: fixed"), "mobile action bar is not fixed at the viewport bottom");

console.log("v1.4.5 guided patient workspace contract PASS (26 assertions)");
