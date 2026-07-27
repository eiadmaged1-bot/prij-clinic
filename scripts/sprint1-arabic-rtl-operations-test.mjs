import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const i18n = read("apps/web/i18n/useI18n.tsx");
const layout = read("apps/web/app/layout.tsx");
const copy = read("apps/web/i18n/operations-copy.ts");
const activeVisit = read("apps/web/components/clinic/ActiveVisitWorkspace.tsx");
const operations = read("apps/web/app/clinic-operations-page.tsx");
const offline = read("apps/web/components/system/OfflineSyncHealth.tsx");
const css = read("apps/web/app/globals.css");
const ar = read("apps/web/i18n/ar.ts");
const en = read("apps/web/i18n/en.ts");

const requireAll = (source, label, needles) => {
  for (const needle of needles) if (!source.includes(needle)) throw new Error(label + " missing: " + needle);
};

requireAll(i18n, "i18n provider", ["document.documentElement.lang", "document.documentElement.dir", "rtl-layout", "prij:i18n:changed", "aria-pressed", "ar-EG", "en-US"]);
requireAll(layout, "pre-paint language boot", ["languageBootScript", "prijClinicLanguage", "suppressHydrationWarning", "document.documentElement.dir"]);
requireAll(copy, "bilingual operations copy", ["حالة الحفظ التلقائي", "تعارض في المزامنة", "توقيع وقفل هذه الزيارة", "المريضات في الانتظار", "الروشتة", "السونار"]);
requireAll(activeVisit, "active visit localization", ["operationsUiCopy", "useI18n", "ui.modules[key]", "ui.finishVisit", "ui.retrySync", "ui.signLockTitle", "ui.voidTitle", "ui.lifecycleStatus", "ui.medicationSearch", "ui.followUpDate", "saveStateLabel(saveState, ui)"]);
requireAll(operations, "queue and doctor localization", ["operationsUiCopy", "ui.currentPatientActiveVisit", "ui.waitingPatients", "ui.pickNext", "ui.doctorHandoffRules", "ui.completedVisits"]);
requireAll(offline, "offline health localization", ["operationsUiCopy", "copy.autosaveHealth", "copy.conflictGlobalHelp", "copy.retryPendingSync"]);
requireAll(css, "RTL layout", ["Sprint 1 Arabic RTL operations closure", 'html[dir="rtl"]', "border-inline-start", "inset-inline-end", "unicode-bidi: isolate", "@media (max-width: 720px)"]);
if (!ar.includes('appName: "عيادات د. ماجد عطية"')) throw new Error("Arabic clinic name is missing.");
for (const source of [activeVisit, operations, offline, copy, ar, en]) {
  if (/Ã|Â|â€”|â€“|ï¿½/.test(source)) throw new Error("Mojibake remains in a critical bilingual source.");
}
const keys = (source) => new Set([...source.matchAll(/^s{2}([A-Za-z][A-Za-z0-9]*):/gm)].map((match) => match[1]));
const enKeys = keys(en);
const arKeys = keys(ar);
for (const key of enKeys) if (!arKeys.has(key)) throw new Error("Arabic dictionary missing key: " + key);
for (const key of arKeys) if (!enKeys.has(key)) throw new Error("English dictionary missing key: " + key);
console.log("Sprint 1 Arabic and RTL critical operations closure PASS");
