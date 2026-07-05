import { readFile } from "node:fs/promises";

const checks = [];

async function main() {
  const en = await read("apps/web/i18n/en.ts");
  const ar = await read("apps/web/i18n/ar.ts");
  const hook = await read("apps/web/i18n/useI18n.tsx");
  const shell = await read("apps/web/app/mvp-page.tsx");
  const reception = await read("apps/web/app/reception/page.tsx");
  const doctor = await read("apps/web/app/doctor/page.tsx");
  const visitTypes = await read("apps/web/lib/visit-types.ts");
  const css = await read("apps/web/app/globals.css");

  assertIncludes(hook, ["LanguageSwitcher", "EN", "عربي", "localStorage", "prijClinicLanguage", "document.documentElement.dir", "rtl", "ltr"], "language switcher persists EN/Arabic and direction");
  assertIncludes(shell, ["I18nProvider", "LanguageSwitcher", "dir={direction}", "t(\"aiDraftSafety\")"], "shared shell uses bilingual provider and translated safety labels");
  assertIncludes(en, ["frontDesk", "waitingList", "returningPatient", "doctorMode", "prescription", "investigation", "billing", "reports", "securityReadiness", "aiDraftOnly"], "English dictionary covers key roles and modules");
  assertIncludes(ar, ["مكتب الاستقبال", "قائمة الانتظار", "وضع الطبيب", "روشتة", "فحوصات", "الحسابات", "جاهزية الأمان", "مسودة ذكاء اصطناعي فقط"], "Arabic dictionary covers key roles and modules");
  for (const label of ["كشف", "إعادة", "استشارة", "مستعجل"]) {
    assertIncludes(en, [label], `${label} remains Arabic in English dictionary`);
    assertIncludes(ar, [label], `${label} remains Arabic in Arabic dictionary`);
    assertIncludes(visitTypes, [label], `${label} remains Arabic in visit type helper`);
  }
  assertIncludes(reception, ["Returning Patient", "Waiting List", "VisitTypeSelector"], "receptionist labels are covered by shell and workflow");
  assertIncludes(doctor, ["Visit type counts", "Doctor Mode", "visitTypeLabel"], "doctor labels are covered by shell and workflow");
  assertIncludes(css, [".language-switcher", ".urgent-visit-type-card", "min-height: 2rem"], "language switcher and smaller urgent card styles exist");
  assertNotIncludes(`${en}${ar}${shell}${reception}${doctor}`, ["i18n.", "translation.", "missing_key"], "no raw translation keys visible in normal UI");

  console.log(`V110-BILINGUAL SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

async function read(path) {
  return readFile(path, "utf8");
}

function assertIncludes(source, needles, label) {
  const missing = needles.filter((needle) => !source.includes(needle));
  if (missing.length) throw new Error(`${label}: missing ${missing.join(", ")}`);
  checks.push(label);
  console.log(`V110-BILINGUAL PASS ${label}`);
}

function assertNotIncludes(source, needles, label) {
  const found = needles.filter((needle) => source.includes(needle));
  if (found.length) throw new Error(`${label}: found ${found.join(", ")}`);
  checks.push(label);
  console.log(`V110-BILINGUAL PASS ${label}`);
}

await main().catch((error) => {
  console.error(`V110-BILINGUAL FAIL ${error.message}`);
  process.exitCode = 1;
});
