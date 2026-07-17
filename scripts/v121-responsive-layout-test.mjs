import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const css = read("apps/web/app/globals.css");
const shell = read("apps/web/app/mvp-page.tsx");
const i18n = read("apps/web/i18n/useI18n.tsx");
const reception = read("apps/web/app/reception/page.tsx");
const newPatient = read("apps/web/app/patients/new/page.tsx");
const patientFile = read("apps/web/app/patients/[id]/page.tsx");
const clinicOps = read("apps/web/app/clinic-operations-page.tsx");
const qr = read("apps/web/app/reception/qr-scan/page.tsx");

for (const token of ["overflow-x: hidden", "@media (max-width: 1199px)", "@media (max-width: 767px)", "@media (max-width: 720px)"]) {
  assert(css.includes(token), `responsive guard exists: ${token}`);
}
assert(css.includes(".reception-status-grid") && css.includes(".reception-home-grid") && css.includes(".visit-type-grid"), "reception and visit type responsive grids exist");
assert(css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") && css.includes("grid-template-columns: 1fr"), "tablet/mobile grid fallbacks exist");
assert(shell.includes("mobile-topbar-brand") && shell.includes("LanguageSwitcher") && shell.includes("account-logout-button"), "topbar keeps brand, language, account/logout");
assert(i18n.includes("document.documentElement.dir = direction") && i18n.includes('language === "ar" ? "rtl" : "ltr"'), "RTL/LTR support preserved");
assert(css.includes(".clinical-chip") && css.includes(".selected-chip") && css.includes("flex-wrap"), "clinical chip wrapping is preserved");
assert(css.includes(".draft-preview") && css.includes("overflow: auto"), "generated note preview remains bounded");
assert(reception.includes("reception-home-actions") && reception.includes("queue-indicator-row-clean") && reception.includes('href="/reception/check-in"'), "reception page has compact mobile actions and queue preview");
assert(newPatient.includes("form-grid") && newPatient.includes("wide") && newPatient.includes("inputMode=\"numeric\""), "new patient form has responsive form structure and mobile numeric input");
assert(patientFile.includes("doctor-queue-preview-mode") && patientFile.includes("searchParams.get(\"preview\")"), "patient file preview mode is responsive shell content");
assert(clinicOps.includes("startDoctorVisit") && clinicOps.includes("/encounter`"), "doctor queue starts the connected encounter workflow");
assert(qr.includes("manual") || qr.includes("Manual") || qr.includes("fallback"), "QR/manual returning patient flow preserved");

console.log(`v1.2.1 responsive layout checks passed (${checks.length})`);
