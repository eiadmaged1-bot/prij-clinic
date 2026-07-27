import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const target = (relativePath) => path.join(root, relativePath);
const read = (relativePath) => fs.readFileSync(target(relativePath), "utf8");
const write = (relativePath, content) => {
  fs.mkdirSync(path.dirname(target(relativePath)), { recursive: true });
  fs.writeFileSync(target(relativePath), content, "utf8");
};

function replaceOnce(relativePath, before, after) {
  const source = read(relativePath);
  if (!source.includes(before)) throw new Error(`Missing Arabic/RTL contract in ${relativePath}: ${before.slice(0, 160)}`);
  write(relativePath, source.replace(before, after));
}

function replaceAll(relativePath, before, after) {
  const source = read(relativePath);
  if (!source.includes(before)) throw new Error(`Missing Arabic/RTL replacement in ${relativePath}: ${before}`);
  write(relativePath, source.split(before).join(after));
}

function appendOnce(relativePath, marker, addition) {
  const source = read(relativePath);
  if (source.includes(marker)) return;
  write(relativePath, source.trimEnd() + "\n\n" + addition.trim() + "\n");
}

write("apps/web/i18n/operations-copy.ts", `export type OperationsLanguage = "en" | "ar";

export const operationsUiCopy = {
  en: {
    languageSwitcher: "Language switcher",
    online: "Online",
    offline: "Offline",
    synced: "Synced",
    syncing: "Syncing",
    pendingSync: "Pending sync",
    syncFailed: "Sync failed",
    syncConflict: "Sync conflict",
    savedLocally: "saved locally",
    reviewRequired: "review required",
    unsavedChanges: "Unsaved changes",
    autosaveHealth: "Autosave health",
    clinicConnectionAvailable: "Clinic connection available.",
    noConnectionSavedDevice: "No connection. Work remains saved on this device.",
    pending: "Pending",
    failed: "Failed",
    conflicts: "Conflicts",
    conflictGlobalHelp: "A newer server copy exists. Open that visit and choose which copy to keep. Nothing is overwritten automatically.",
    retrying: "Retrying...",
    retryPendingSync: "Retry pending sync",
    queuedItems: "queued item(s)",
    options: "Options",
    voidEncounter: "Void encounter",
    activeVisitModules: "Active visit modules",
    visitActions: "Visit actions",
    reviewVisit: "Review visit",
    finishVisit: "Finish visit",
    more: "More",
    saveContinueLater: "Save and continue later",
    finishPrint: "Finish and print",
    workingOffline: "Working offline",
    draftWaitingSync: "Draft waiting to sync",
    conflictVisitHelp: "A newer server copy exists. This device copy is preserved and will not overwrite it automatically.",
    queuedVisitHelp: "Your draft is saved on this device and remains locked to this patient and visit.",
    retrySync: "Retry sync",
    discardReloadServer: "Discard local and reload server",
    signLockAria: "Sign and lock visit confirmation",
    signLockTitle: "Sign and lock this visit?",
    close: "Close",
    patient: "Patient",
    mrn: "MRN",
    visitId: "Visit ID",
    saveState: "Save state",
    clinicalRecordLock: "Clinical record lock",
    clinicalRecordLockHelp: "Signing completes the queue visit and makes this encounter read only. Confirm the patient identity before continuing.",
    cancel: "Cancel",
    signing: "Signing...",
    confirmSignPrint: "Confirm, sign and print",
    confirmSignLock: "Confirm sign and lock",
    voidConfirmation: "Void Encounter Confirmation",
    voidTitle: "Void Encounter",
    impact: "Impact",
    voidImpact: "Voiding this encounter locks it from further edits and marks it as voided in patient history. This action is auditable.",
    warning: "Warning",
    voidWarning: "Are you sure you want to void this encounter?",
    voidReason: "Mandatory reason for voiding",
    voidReasonPlaceholder: "e.g. Created by mistake",
    submitting: "Submitting...",
    confirmVoid: "Confirm Void",
    voidFailed: "Could not void this visit. Check permissions or network.",
    voidNetworkFailed: "A network error occurred while voiding.",
    activeVisit: "Active Visit",
    opening: "Opening...",
    startVisit: "Start Visit",
    missingVisit: "Missing visit.",
    lifecycleStatus: "Lifecycle status",
    chiefComplaint: "Chief complaint",
    history: "History",
    examination: "Examination",
    impression: "Impression",
    plan: "Plan",
    saveDraft: "Save draft",
    signedReadOnly: "Signed visit · read only. Create a governed correction or a new visit instead of changing the signed record.",
    medicationSearch: "Medication search",
    searchMedicationFirst: "Search medication catalog first.",
    noMedicationLines: "No medication lines yet.",
    addCustomMedication: "Add custom medication",
    safetyCheck: "Safety check",
    print: "Print",
    followUpDate: "Follow-up date",
    taskTitle: "Task title",
    note: "Note",
    saveFollowUp: "Save follow-up",
    scanType: "Scan type",
    fetusSelector: "Fetus selector",
    reportNote: "Report note",
    noUltrasoundReports: "No ultrasound reports yet.",
    currentPatientActiveVisit: "Current patient / active visit",
    onePatientRule: "One patient can be called or in room at a time.",
    none: "None",
    followUpHints: "Follow-up hints",
    open: "Open",
    continue: "Continue",
    complete: "Complete",
    noPatientDoctor: "No patient with doctor.",
    waitingPatients: "Waiting patients",
    urgentFirst: "Urgent first, then check-in order.",
    pickNext: "Pick next",
    start: "Start",
    noPatientsWaiting: "No patients waiting.",
    waitingTimeNotRecorded: "Waiting time not recorded",
    doctorHandoffRules: "Doctor handoff rules",
    safeQueue: "Safe queue",
    openNoStatusChange: "Open never changes queue status.",
    startOneCalled: "Start and Pick next create one called patient only.",
    continueLocked: "Continue opens the locked active visit.",
    completeSignedFlow: "Complete opens the signed finish workflow; it does not bypass clinical signing.",
    queueChanged: "The queue changed. Refresh and select the patient again.",
    lockedVisitFailed: "The locked visit could not be opened.",
    appointments: "Appointments",
    waiting: "Waiting",
    completedVisits: "Completed visits",
    followUp: "Follow-up",
    doctorView: "Doctor view",
    reportDate: "Report date",
    modules: {
      encounter: "Encounter", complaint: "Complaint", history: "History", examination: "Examination", impression: "Impression",
      prescription: "Prescription", investigations: "Investigations", ultrasound: "Ultrasound", "follow-up": "Follow-up", finish: "Finish / Print"
    }
  },
  ar: {
    languageSwitcher: "تبديل اللغة",
    online: "متصل",
    offline: "غير متصل",
    synced: "تمت المزامنة",
    syncing: "جارٍ المزامنة",
    pendingSync: "مزامنة معلقة",
    syncFailed: "فشلت المزامنة",
    syncConflict: "تعارض في المزامنة",
    savedLocally: "محفوظ محلياً",
    reviewRequired: "تحتاج مراجعة",
    unsavedChanges: "تغييرات غير محفوظة",
    autosaveHealth: "حالة الحفظ التلقائي",
    clinicConnectionAvailable: "الاتصال بالعيادة متاح.",
    noConnectionSavedDevice: "لا يوجد اتصال. العمل محفوظ على هذا الجهاز.",
    pending: "معلق",
    failed: "فشل",
    conflicts: "تعارضات",
    conflictGlobalHelp: "توجد نسخة أحدث على الخادم. افتح الزيارة واختر النسخة الصحيحة. لن يتم الاستبدال تلقائياً.",
    retrying: "جارٍ إعادة المحاولة...",
    retryPendingSync: "إعادة محاولة المزامنة",
    queuedItems: "عناصر معلقة",
    options: "خيارات",
    voidEncounter: "إلغاء الزيارة",
    activeVisitModules: "أقسام الزيارة النشطة",
    visitActions: "إجراءات الزيارة",
    reviewVisit: "مراجعة الزيارة",
    finishVisit: "إنهاء الزيارة",
    more: "المزيد",
    saveContinueLater: "حفظ والمتابعة لاحقاً",
    finishPrint: "إنهاء وطباعة",
    workingOffline: "العمل دون اتصال",
    draftWaitingSync: "المسودة بانتظار المزامنة",
    conflictVisitHelp: "توجد نسخة أحدث على الخادم. نسخة هذا الجهاز محفوظة ولن تستبدلها تلقائياً.",
    queuedVisitHelp: "المسودة محفوظة على هذا الجهاز ومرتبطة بهذه المريضة وهذه الزيارة.",
    retrySync: "إعادة المزامنة",
    discardReloadServer: "حذف النسخة المحلية وتحميل نسخة الخادم",
    signLockAria: "تأكيد توقيع وقفل الزيارة",
    signLockTitle: "توقيع وقفل هذه الزيارة؟",
    close: "إغلاق",
    patient: "المريضة",
    mrn: "رقم الملف",
    visitId: "رقم الزيارة",
    saveState: "حالة الحفظ",
    clinicalRecordLock: "قفل السجل السريري",
    clinicalRecordLockHelp: "التوقيع ينهي زيارة قائمة الانتظار ويجعل السجل للقراءة فقط. تأكد من هوية المريضة قبل المتابعة.",
    cancel: "إلغاء",
    signing: "جارٍ التوقيع...",
    confirmSignPrint: "تأكيد وتوقيع وطباعة",
    confirmSignLock: "تأكيد التوقيع والقفل",
    voidConfirmation: "تأكيد إلغاء الزيارة",
    voidTitle: "إلغاء الزيارة",
    impact: "التأثير",
    voidImpact: "إلغاء الزيارة يمنع تعديلها ويضع علامة ملغاة في سجل المريضة. هذا الإجراء مسجل في التدقيق.",
    warning: "تحذير",
    voidWarning: "هل أنت متأكد من إلغاء هذه الزيارة؟",
    voidReason: "سبب الإلغاء إلزامي",
    voidReasonPlaceholder: "مثال: أُنشئت بالخطأ",
    submitting: "جارٍ الإرسال...",
    confirmVoid: "تأكيد الإلغاء",
    voidFailed: "تعذر إلغاء الزيارة. راجع الصلاحيات أو الاتصال.",
    voidNetworkFailed: "حدث خطأ في الشبكة أثناء إلغاء الزيارة.",
    activeVisit: "الزيارة النشطة",
    opening: "جارٍ الفتح...",
    startVisit: "بدء الزيارة",
    missingVisit: "الزيارة غير موجودة.",
    lifecycleStatus: "حالة تطور الشكوى",
    chiefComplaint: "الشكوى الرئيسية",
    history: "التاريخ المرضي",
    examination: "الفحص",
    impression: "الانطباع السريري",
    plan: "الخطة",
    saveDraft: "حفظ المسودة",
    signedReadOnly: "زيارة موقعة · للقراءة فقط. أنشئ تصحيحاً منظماً أو زيارة جديدة بدلاً من تعديل السجل الموقع.",
    medicationSearch: "بحث عن دواء",
    searchMedicationFirst: "ابحث في دليل الأدوية أولاً.",
    noMedicationLines: "لا توجد أدوية في الروشتة بعد.",
    addCustomMedication: "إضافة دواء يدوياً",
    safetyCheck: "فحص الأمان",
    print: "طباعة",
    followUpDate: "تاريخ المتابعة",
    taskTitle: "عنوان المهمة",
    note: "ملاحظة",
    saveFollowUp: "حفظ المتابعة",
    scanType: "نوع الفحص",
    fetusSelector: "اختيار الجنين",
    reportNote: "ملاحظة التقرير",
    noUltrasoundReports: "لا توجد تقارير سونار بعد.",
    currentPatientActiveVisit: "المريضة الحالية / الزيارة النشطة",
    onePatientRule: "يمكن استدعاء مريضة واحدة أو وجودها عند الطبيب في الوقت نفسه.",
    none: "لا يوجد",
    followUpHints: "تنبيهات المتابعة",
    open: "فتح",
    continue: "متابعة",
    complete: "إنهاء",
    noPatientDoctor: "لا توجد مريضة عند الطبيب.",
    waitingPatients: "المريضات في الانتظار",
    urgentFirst: "المستعجل أولاً، ثم حسب وقت تسجيل الحضور.",
    pickNext: "اختيار التالية",
    start: "بدء",
    noPatientsWaiting: "لا توجد مريضات في الانتظار.",
    waitingTimeNotRecorded: "مدة الانتظار غير مسجلة",
    doctorHandoffRules: "قواعد تسليم قائمة الطبيب",
    safeQueue: "قائمة آمنة",
    openNoStatusChange: "الفتح لا يغير حالة قائمة الانتظار.",
    startOneCalled: "البدء واختيار التالية ينشئان مريضة مستدعاة واحدة فقط.",
    continueLocked: "المتابعة تفتح الزيارة النشطة المقفلة.",
    completeSignedFlow: "الإنهاء يفتح مسار الإنهاء والتوقيع ولا يتجاوز التوقيع السريري.",
    queueChanged: "تغيرت قائمة الانتظار. حدّث واختر المريضة مرة أخرى.",
    lockedVisitFailed: "تعذر فتح الزيارة المقفلة.",
    appointments: "المواعيد",
    waiting: "الانتظار",
    completedVisits: "الزيارات المكتملة",
    followUp: "المتابعة",
    doctorView: "عرض الطبيب",
    reportDate: "تاريخ التقرير",
    modules: {
      encounter: "الزيارة", complaint: "الشكوى", history: "التاريخ", examination: "الفحص", impression: "الانطباع",
      prescription: "الروشتة", investigations: "الفحوصات", ultrasound: "السونار", "follow-up": "المتابعة", finish: "الإنهاء / الطباعة"
    }
  }
} as const;

export type OperationsUiCopy = (typeof operationsUiCopy)[OperationsLanguage];
`);

write("apps/web/i18n/useI18n.tsx", `"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ar } from "./ar";
import { en } from "./en";

export type Language = "en" | "ar";
type TranslationKey = keyof typeof en;
const dictionaries = { en, ar };
const LANGUAGE_KEY = "prijClinicLanguage";
const LANGUAGE_EVENT = "prij:i18n:changed";

const I18nContext = createContext<{
  language: Language;
  direction: "ltr" | "rtl";
  textDirection: "ltr" | "rtl";
  locale: "en-US" | "ar-EG";
  t(key: TranslationKey): string;
  setLanguage(language: Language): void;
} | null>(null);

function applyDocumentLanguage(language: Language) {
  const direction = language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body?.classList.toggle("rtl-layout", language === "ar");
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    const next = stored === "ar" ? "ar" : "en";
    setLanguageState(next);
    applyDocumentLanguage(next);
    const syncLanguage = () => {
      const current = localStorage.getItem(LANGUAGE_KEY) === "ar" ? "ar" : "en";
      setLanguageState(current);
      applyDocumentLanguage(current);
    };
    window.addEventListener(LANGUAGE_EVENT, syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const direction: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";
  const locale = language === "ar" ? "ar-EG" : "en-US";

  useEffect(() => applyDocumentLanguage(language), [language]);

  const value = useMemo(() => ({
    language,
    direction,
    textDirection: direction,
    locale,
    t: (key: TranslationKey) => dictionaries[language][key] ?? en[key] ?? "",
    setLanguage: (next: Language) => {
      localStorage.setItem(LANGUAGE_KEY, next);
      applyDocumentLanguage(next);
      setLanguageState(next);
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT));
    }
  }), [direction, language, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const label = language === "ar" ? "تبديل اللغة" : "Language switcher";
  return <div className="language-switcher" aria-label={label}><button aria-pressed={language === "ar"} className={language === "ar" ? "active" : ""} lang="ar" type="button" onClick={() => setLanguage("ar")}>عربي</button><button aria-pressed={language === "en"} className={language === "en" ? "active" : ""} lang="en" type="button" onClick={() => setLanguage("en")}>EN</button></div>;
}
`);

write("apps/web/components/system/OfflineSyncHealth.tsx", `"use client";

import { useCallback, useEffect, useState } from "react";
import { updateDoctorVisit } from "@/lib/doctor-visit";
import { flushOfflineSync, getOfflineSyncSummary, subscribeOfflineSync, type OfflineSyncSummary } from "@/lib/offline-sync";
import { useI18n } from "@/i18n/useI18n";
import { operationsUiCopy } from "@/i18n/operations-copy";

const emptySummary: OfflineSyncSummary = { total: 0, pending: 0, syncing: 0, failed: 0, conflicts: 0 };

export function OfflineSyncHealth() {
  const { language } = useI18n();
  const copy = operationsUiCopy[language];
  const [online, setOnline] = useState(true);
  const [summary, setSummary] = useState<OfflineSyncSummary>(emptySummary);
  const [retrying, setRetrying] = useState(false);

  const refresh = useCallback(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    setSummary(getOfflineSyncSummary());
  }, []);

  const retry = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) { refresh(); return; }
    setRetrying(true);
    try {
      await flushOfflineSync((item) => updateDoctorVisit(item.patientId, item.encounterId, item.payload, item.expectedUpdatedAt));
    } finally {
      setRetrying(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeOfflineSync(refresh);
    const onOnline = () => { refresh(); void retry(); };
    const onOffline = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh, retry]);

  const state = !online ? "offline" : summary.conflicts ? "conflict" : summary.failed ? "failed" : summary.total ? "pending" : "synced";
  const label = !online ? copy.offline : summary.conflicts ? copy.syncConflict : summary.failed ? copy.syncFailed : summary.total ? copy.pendingSync : copy.synced;

  return (
    <details className={"offline-sync-health " + state} data-offline-sync-health>
      <summary aria-label={label + ". " + summary.total + " " + copy.queuedItems + "."}>
        <span className="offline-sync-dot" aria-hidden="true" />
        <span>{label}</span>
        {summary.total ? <span className="badge">{summary.total}</span> : null}
      </summary>
      <div className="offline-sync-popover" role="status" aria-live="polite">
        <strong>{copy.autosaveHealth}</strong>
        <p>{online ? copy.clinicConnectionAvailable : copy.noConnectionSavedDevice}</p>
        <div className="offline-sync-counts">
          <span>{copy.pending} {summary.pending + summary.syncing}</span>
          <span>{copy.failed} {summary.failed}</span>
          <span>{copy.conflicts} {summary.conflicts}</span>
        </div>
        {summary.conflicts ? <p className="form-error">{copy.conflictGlobalHelp}</p> : null}
        <button className="button secondary compact" type="button" disabled={!online || retrying || summary.total === 0 || summary.total === summary.conflicts} onClick={() => void retry()}>{retrying ? copy.retrying : copy.retryPendingSync}</button>
      </div>
    </details>
  );
}
`);

write("apps/web/app/layout.tsx", `import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./investigation-embedded.css";
import { SessionProvider } from "./session";
import { ThemeProvider } from "./theme";
import { OFFICIAL_APP_DESCRIPTION, OFFICIAL_CLINIC_NAME } from "@/lib/brand";
import { InterfaceModeProvider } from "@/lib/interface-mode";
import { I18nProvider } from "@/i18n/useI18n";

export const metadata: Metadata = { title: OFFICIAL_CLINIC_NAME, description: OFFICIAL_APP_DESCRIPTION };

const languageBootScript = \`try{var l=localStorage.getItem("prijClinicLanguage")==="ar"?"ar":"en";document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";document.documentElement.classList.toggle("rtl-layout",l==="ar")}catch(e){}\`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: languageBootScript }} /></head>
      <body suppressHydrationWarning>
        <I18nProvider><ThemeProvider>
          <SessionProvider><InterfaceModeProvider>{children}</InterfaceModeProvider></SessionProvider>
        </ThemeProvider></I18nProvider>
      </body>
    </html>
  );
}
`);

replaceOnce(
  "apps/web/i18n/ar.ts",
  '  appName: "Dr Maged Attia Clinics",',
  '  appName: "عيادات د. ماجد عطية",'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'import { useSession } from "@/app/session";\n',
  'import { useSession } from "@/app/session";\nimport { useI18n } from "@/i18n/useI18n";\nimport { operationsUiCopy } from "@/i18n/operations-copy";\n'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '  const { user, status: sessionStatus } = useSession();\n',
  '  const { user, status: sessionStatus } = useSession();\n  const { language } = useI18n();\n  const ui = operationsUiCopy[language];\n'
);

replaceAll("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "Ã—", "×");
replaceAll("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "Â·", "·");
replaceAll("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "â€”", "—");

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<summary className="button secondary compact"><ThreeDMedicalIcon name="settings" size="sm" /> Options</summary>',
  '<summary className="button secondary compact"><ThreeDMedicalIcon name="settings" size="sm" /> {ui.options}</summary>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<ThreeDMedicalIcon name="encounter" size="sm" tone="rose" /> Void encounter',
  '<ThreeDMedicalIcon name="encounter" size="sm" tone="rose" /> {ui.voidEncounter}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<nav className="active-visit-tabs" aria-label="Active visit modules">\n            {modules.map(([key, label]) => (\n              <Link className={activeModule === key ? "active" : ""} href={`/patients/${patientId}/visits/${visitId}/${key}`} key={key}>{label}</Link>\n            ))}\n          </nav>',
  '<nav className="active-visit-tabs" aria-label={ui.activeVisitModules}>\n            {modules.map(([key]) => (\n              <Link className={activeModule === key ? "active" : ""} href={`/patients/${patientId}/visits/${visitId}/${key}`} key={key}>{ui.modules[key]}</Link>\n            ))}\n          </nav>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<div className="visit-persistent-actions no-print" aria-label="Visit actions">\n            <span className={`badge visit-save-state ${saveState}`}>{saveStateLabel(saveState)}</span>\n            <Link className="button secondary compact" href={`/patients/${patientId}/visits/${visitId}/finish`}>Review visit</Link>\n            <button className="button compact" disabled={finishing || signedVisit || !contextReady || saveState !== "synced"} type="button" onClick={() => requestFinish(false)}>Finish visit</button>\n            <details className="visit-more-actions">\n              <summary className="button secondary compact">More</summary>\n              <div>\n                <Link className="button secondary compact" href={`/patients/${patientId}`}>Save and continue later</Link>\n                <button className="button secondary compact" disabled={finishing || signedVisit || !contextReady || saveState !== "synced"} type="button" onClick={() => requestFinish(true)}>Finish and print</button>\n              </div>\n            </details>\n          </div>',
  '<div className="visit-persistent-actions no-print" aria-label={ui.visitActions}>\n            <span className={`badge visit-save-state ${saveState}`}>{saveStateLabel(saveState, ui)}</span>\n            <Link className="button secondary compact" href={`/patients/${patientId}/visits/${visitId}/finish`}>{ui.reviewVisit}</Link>\n            <button className="button compact" disabled={finishing || signedVisit || !contextReady || saveState !== "synced"} type="button" onClick={() => requestFinish(false)}>{ui.finishVisit}</button>\n            <details className="visit-more-actions">\n              <summary className="button secondary compact">{ui.more}</summary>\n              <div>\n                <Link className="button secondary compact" href={`/patients/${patientId}`}>{ui.saveContinueLater}</Link>\n                <button className="button secondary compact" disabled={finishing || signedVisit || !contextReady || saveState !== "synced"} type="button" onClick={() => requestFinish(true)}>{ui.finishPrint}</button>\n              </div>\n            </details>\n          </div>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<div><strong>{saveState === "conflict" ? "Sync conflict" : saveState === "offline" ? "Working offline" : "Draft waiting to sync"}</strong><p>{saveState === "conflict" ? "A newer server copy exists. This device copy is preserved and will not overwrite it automatically." : "Your draft is saved on this device and remains locked to this patient and visit."}</p></div>\n              <div className="form-actions"><button className="button secondary compact" type="button" disabled={!navigator.onLine || saveState === "conflict"} onClick={() => void retryCurrentVisitSync()}>Retry sync</button>{saveState === "conflict" ? <button className="button secondary compact danger" type="button" onClick={() => void discardLocalVisitCopy()}>Discard local and reload server</button> : null}</div>',
  '<div><strong>{saveState === "conflict" ? ui.syncConflict : saveState === "offline" ? ui.workingOffline : ui.draftWaitingSync}</strong><p>{saveState === "conflict" ? ui.conflictVisitHelp : ui.queuedVisitHelp}</p></div>\n              <div className="form-actions"><button className="button secondary compact" type="button" disabled={!navigator.onLine || saveState === "conflict"} onClick={() => void retryCurrentVisitSync()}>{ui.retrySync}</button>{saveState === "conflict" ? <button className="button secondary compact danger" type="button" onClick={() => void discardLocalVisitCopy()}>{ui.discardReloadServer}</button> : null}</div>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<dialog open className="patient-modal" aria-label="Sign and lock visit confirmation">',
  '<dialog open className="patient-modal" aria-label={ui.signLockAria}>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<div className="modal-header"><h2>Sign and lock this visit?</h2><button className="button-icon" type="button" disabled={finishing} onClick={() => setFinishIntent(null)} aria-label="Close">×</button></div>',
  '<div className="modal-header"><h2>{ui.signLockTitle}</h2><button className="button-icon" type="button" disabled={finishing} onClick={() => setFinishIntent(null)} aria-label={ui.close}>×</button></div>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<p><strong>Patient:</strong> {String(patient?.name ?? "Patient")}</p>\n                  <p><strong>MRN:</strong> {String(patient?.medicalRecordNumber ?? "not recorded")}</p>\n                  <p><strong>Visit ID:</strong> {visitId}</p>\n                  <p><strong>Save state:</strong> {saveStateLabel(saveState)}</p>\n                  <div className="warning-callout" style={{ color: "var(--rose)", background: "var(--rose-light)", padding: "0.75rem", borderRadius: "0.5rem" }}><strong>Clinical record lock:</strong> Signing completes the queue visit and makes this encounter read only. Confirm the patient identity before continuing.</div>',
  '<p><strong>{ui.patient}:</strong> {String(patient?.name ?? ui.patient)}</p>\n                  <p><strong>{ui.mrn}:</strong> <bdi>{String(patient?.medicalRecordNumber ?? "—")}</bdi></p>\n                  <p><strong>{ui.visitId}:</strong> <bdi>{visitId}</bdi></p>\n                  <p><strong>{ui.saveState}:</strong> {saveStateLabel(saveState, ui)}</p>\n                  <div className="warning-callout" style={{ color: "var(--rose)", background: "var(--rose-light)", padding: "0.75rem", borderRadius: "0.5rem" }}><strong>{ui.clinicalRecordLock}:</strong> {ui.clinicalRecordLockHelp}</div>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button secondary" type="button" disabled={finishing} onClick={() => setFinishIntent(null)}>Cancel</button>\n                  <button className="button" type="button" disabled={finishing || !contextReady || signedVisit || saveState !== "synced"} onClick={() => { const printAfter = finishIntent === "print"; setFinishIntent(null); void finishVisit(printAfter); }}>{finishing ? "Signing..." : finishIntent === "print" ? "Confirm, sign and print" : "Confirm sign and lock"}</button>',
  '<button className="button secondary" type="button" disabled={finishing} onClick={() => setFinishIntent(null)}>{ui.cancel}</button>\n                  <button className="button" type="button" disabled={finishing || !contextReady || signedVisit || saveState !== "synced"} onClick={() => { const printAfter = finishIntent === "print"; setFinishIntent(null); void finishVisit(printAfter); }}>{finishing ? ui.signing : finishIntent === "print" ? ui.confirmSignPrint : ui.confirmSignLock}</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<dialog open className="patient-modal" aria-label="Void Encounter Confirmation">',
  '<dialog open className="patient-modal" aria-label={ui.voidConfirmation}>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<h2>Void Encounter</h2>\n                  <button className="button-icon" onClick={() => setVoidModalOpen(false)} disabled={isVoiding} aria-label="Close">×</button>',
  '<h2>{ui.voidTitle}</h2>\n                  <button className="button-icon" onClick={() => setVoidModalOpen(false)} disabled={isVoiding} aria-label={ui.close}>×</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<p><strong>Patient:</strong> {patient?.name ?? patientId}</p>\n                  <p><strong>Impact:</strong> Voiding this encounter will lock it from further edits and mark it as voided in the patient history. This action is auditable.</p>',
  '<p><strong>{ui.patient}:</strong> {patient?.name ?? patientId}</p>\n                  <p><strong>{ui.impact}:</strong> {ui.voidImpact}</p>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<strong>Warning:</strong> Are you sure you want to void this encounter?',
  '<strong>{ui.warning}:</strong> {ui.voidWarning}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'Mandatory reason for voiding:\n                    <input',
  '{ui.voidReason}:\n                    <input'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'placeholder="e.g. Created by mistake"',
  'placeholder={ui.voidReasonPlaceholder}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button secondary" onClick={() => setVoidModalOpen(false)} disabled={isVoiding}>Cancel</button>',
  '<button className="button secondary" onClick={() => setVoidModalOpen(false)} disabled={isVoiding}>{ui.cancel}</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'setVoidError("Could not void this visit. Check permissions or network.");',
  'setVoidError(ui.voidFailed);'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'setVoidError("A network error occurred while voiding.");',
  'setVoidError(ui.voidNetworkFailed);'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '{isVoiding ? "Submitting..." : "Confirm Void"}',
  '{isVoiding ? ui.submitting : ui.confirmVoid}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<div className="section-heading"><h2>{modules.find(([key]) => key === activeModule)?.[1] ?? "Active Visit"}</h2><span className="badge">{status}</span></div>',
  '<div className="section-heading"><h2>{ui.modules[activeModule as keyof typeof ui.modules] ?? ui.activeVisit}</h2><span className="badge">{status}</span></div>'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'export function ActiveVisitLauncher({ patientId, className = "button", children = "Start Visit" }: { patientId: string; className?: string; children?: ReactNode }) {\n  const [busy, setBusy] = useState(false);',
  'export function ActiveVisitLauncher({ patientId, className = "button", children }: { patientId: string; className?: string; children?: ReactNode }) {\n  const { language } = useI18n();\n  const ui = operationsUiCopy[language];\n  const [busy, setBusy] = useState(false);'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'if (!encounterId) throw new Error("Missing visit.");',
  'if (!encounterId) throw new Error(ui.missingVisit);'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'return <button className={className} disabled={busy} type="button" onClick={() => void openVisit()}>{busy ? "Opening..." : children}</button>;',
  'return <button className={className} disabled={busy} type="button" onClick={() => void openVisit()}>{busy ? ui.opening : children ?? ui.startVisit}</button>;'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function EncounterModule({ activeModule, patientType, form, previousEncounters, pregnancyEpisode, infertilityEpisode, readOnly, onChange, onSubmit }: { activeModule: string; patientType: string; form: Record<string, unknown>; previousEncounters: Record<string, unknown>[]; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; readOnly: boolean; onChange: (next: Record<string, unknown>) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {\n  const field =',
  'function EncounterModule({ activeModule, patientType, form, previousEncounters, pregnancyEpisode, infertilityEpisode, readOnly, onChange, onSubmit }: { activeModule: string; patientType: string; form: Record<string, unknown>; previousEncounters: Record<string, unknown>[]; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; readOnly: boolean; onChange: (next: Record<string, unknown>) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {\n  const { language } = useI18n();\n  const ui = operationsUiCopy[language];\n  const field ='
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<label>Lifecycle status',
  '<label>{ui.lifecycleStatus}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<label>Chief complaint<input',
  '<label>{ui.chiefComplaint}<input'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<label>History<textarea',
  '<label>{ui.history}<textarea'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<label>Examination<textarea',
  '<label>{ui.examination}<textarea'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<label>Impression<textarea',
  '<label>{ui.impression}<textarea'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button" type="submit">Save draft</button>',
  '<button className="button" type="submit">{ui.saveDraft}</button>'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function PrescriptionModule({ readOnly, query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: {',
  'function PrescriptionModule({ readOnly, query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: {'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '}) {\n  return (\n    <fieldset className="form-grid structured-rx-workspace"',
  '}) {\n  const { language } = useI18n();\n  const ui = operationsUiCopy[language];\n  return (\n    <fieldset className="form-grid structured-rx-workspace"'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<label className="wide">Medication search<input',
  '<label className="wide">{ui.medicationSearch}<input'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'Search medication catalog first.',
  '{ui.searchMedicationFirst}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'No medication lines yet.',
  '{ui.noMedicationLines}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '>Add custom medication</button>',
  '>{ui.addCustomMedication}</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '>Safety check</button>',
  '>{ui.safetyCheck}</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '>Save draft</button>',
  '>{ui.saveDraft}</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '>Print</button>',
  '>{ui.print}</button>'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function UltrasoundModule({ readOnly, patientType, pregnancyEpisode, infertilityEpisode }: { readOnly: boolean; patientType: string; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null }) {\n  const context =',
  'function UltrasoundModule({ readOnly, patientType, pregnancyEpisode, infertilityEpisode }: { readOnly: boolean; patientType: string; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null }) {\n  const { language } = useI18n();\n  const ui = operationsUiCopy[language];\n  const context ='
);
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", '<label>Scan type<select>', '<label>{ui.scanType}<select>');
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", '<label>Fetus selector<select>', '<label>{ui.fetusSelector}<select>');
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", '<label className="wide">Report note<textarea', '<label className="wide">{ui.reportNote}<textarea');
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", 'No ultrasound reports yet.', '{ui.noUltrasoundReports}');

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function FollowUpModule({ followUp, setFollowUp, onSubmit }: { followUp: { dueAt: string; title: string; note: string }; setFollowUp: (next: { dueAt: string; title: string; note: string }) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {\n  return (',
  'function FollowUpModule({ followUp, setFollowUp, onSubmit }: { followUp: { dueAt: string; title: string; note: string }; setFollowUp: (next: { dueAt: string; title: string; note: string }) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {\n  const { language } = useI18n();\n  const ui = operationsUiCopy[language];\n  return ('
);
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", '<label>Follow-up date<input', '<label>{ui.followUpDate}<input');
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", '<label>Task title<input', '<label>{ui.taskTitle}<input');
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", '<label className="wide">Note<textarea', '<label className="wide">{ui.note}<textarea');
replaceOnce("apps/web/components/clinic/ActiveVisitWorkspace.tsx", '>Save follow-up</button>', '>{ui.saveFollowUp}</button>');

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function SignedVisitReadOnlyNotice() {\n  return <p className="notice">Signed visit · read only. Create a governed correction or a new visit instead of changing the signed record.</p>;\n}',
  'function SignedVisitReadOnlyNotice() {\n  const { language } = useI18n();\n  return <p className="notice">{operationsUiCopy[language].signedReadOnly}</p>;\n}'
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function saveStateLabel(state: string) {\n  if (state === "syncing") return "Syncing";\n  if (state === "synced") return "Synced";\n  if (state === "offline") return "Offline · saved locally";\n  if (state === "queued") return "Pending sync";\n  if (state === "conflict") return "Sync conflict · review required";\n  if (state === "failed") return "Save failed — Retry";\n  if (state === "local") return `Saved locally at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;\n  return "Unsaved changes";\n}',
  'function saveStateLabel(state: string, ui: (typeof operationsUiCopy)[keyof typeof operationsUiCopy]) {\n  if (state === "syncing") return ui.syncing;\n  if (state === "synced") return ui.synced;\n  if (state === "offline") return `${ui.offline} · ${ui.savedLocally}`;\n  if (state === "queued") return ui.pendingSync;\n  if (state === "conflict") return `${ui.syncConflict} · ${ui.reviewRequired}`;\n  if (state === "failed") return ui.syncFailed;\n  if (state === "local") return ui.savedLocally;\n  return ui.unsavedChanges;\n}'
);

replaceOnce(
  "apps/web/app/clinic-operations-page.tsx",
  'import { useI18n } from "@/i18n/useI18n";\n',
  'import { useI18n } from "@/i18n/useI18n";\nimport { operationsUiCopy } from "@/i18n/operations-copy";\n'
);
replaceOnce(
  "apps/web/app/clinic-operations-page.tsx",
  '  const copy = operationsCopy[language];\n',
  '  const copy = operationsCopy[language];\n  const ui = operationsUiCopy[language];\n'
);
replaceOnce("apps/web/app/clinic-operations-page.tsx", 'aria-label="Report date"', 'aria-label={ui.reportDate}');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>Print</button>', '>{ui.print}</button>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>Doctor view</Link>', '>{ui.doctorView}</Link>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>{mode === "queue" ? copy.refresh : "Refresh"}</button>', '>{copy.refresh}</button>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<Metric icon="calendar" label="Appointments"', '<Metric icon="calendar" label={ui.appointments}');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<Metric icon="queue" label="Waiting"', '<Metric icon="queue" label={ui.waiting}');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<Metric icon="doctor" label="Completed visits"', '<Metric icon="doctor" label={ui.completedVisits}');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<Metric icon="investigations" label="Follow-up"', '<Metric icon="investigations" label={ui.followUp}');

replaceOnce(
  "apps/web/app/clinic-operations-page.tsx",
  'function DoctorHandoff({ queue, orders, onRefresh }: { queue: QueueTicket[]; orders: InvestigationOrder[]; onRefresh(): Promise<void> }) {\n  const [actionError, setActionError] = useState("");',
  'function DoctorHandoff({ queue, orders, onRefresh }: { queue: QueueTicket[]; orders: InvestigationOrder[]; onRefresh(): Promise<void> }) {\n  const { language } = useI18n();\n  const ui = operationsUiCopy[language];\n  const [actionError, setActionError] = useState("");'
);
replaceOnce("apps/web/app/clinic-operations-page.tsx", 'setActionError(payload?.message ?? "The queue changed. Refresh and select the patient again.");', 'setActionError(payload?.message ?? ui.queueChanged);');
replaceOnce("apps/web/app/clinic-operations-page.tsx", 'setActionError("The locked visit could not be opened.");', 'setActionError(ui.lockedVisitFailed);');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<h2>Current patient / active visit</h2><p className="muted">One patient can be called or in room at a time.</p>', '<h2>{ui.currentPatientActiveVisit}</h2><p className="muted">{ui.onePatientRule}</p>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", 'current ? friendly(current.status) : "None"', 'current ? friendly(current.status) : ui.none');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '`Follow-up hints ${orders.filter', '`${ui.followUpHints} ${orders.filter');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>Open</Link>', '>{ui.open}</Link>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>Continue</button>', '>{ui.continue}</button>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>Complete</button>', '>{ui.complete}</button>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", 'No patient with doctor.', '{ui.noPatientDoctor}');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<h2>Waiting patients</h2><p className="muted">Urgent first, then check-in order.</p>', '<h2>{ui.waitingPatients}</h2><p className="muted">{ui.urgentFirst}</p>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>Pick next</button>', '>{ui.pickNext}</button>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", ': "Waiting time not recorded"', ': ui.waitingTimeNotRecorded');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '>Start</button>', '>{ui.start}</button>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", 'No patients waiting.', '{ui.noPatientsWaiting}');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<h2>Doctor handoff rules</h2><span className="badge">Safe queue</span>', '<h2>{ui.doctorHandoffRules}</h2><span className="badge">{ui.safeQueue}</span>');
replaceOnce("apps/web/app/clinic-operations-page.tsx", '<li>Open never changes queue status.</li><li>Start and Pick next create one called patient only.</li><li>Continue opens the locked active visit.</li><li>Complete opens the signed finish workflow; it does not bypass clinical signing.</li>', '<li>{ui.openNoStatusChange}</li><li>{ui.startOneCalled}</li><li>{ui.continueLocked}</li><li>{ui.completeSignedFlow}</li>');

appendOnce("apps/web/app/globals.css", "/* Sprint 1 Arabic RTL operations closure */", `/* Sprint 1 Arabic RTL operations closure */
html[dir="rtl"] body { direction: rtl; font-family: Tahoma, Arial, sans-serif; text-align: start; }
html[dir="rtl"] .app-shell, html[dir="rtl"] .patient-modal, html[dir="rtl"] .offline-sync-popover { direction: rtl; }
html[dir="rtl"] .sidebar { border-inline-end: 1px solid var(--border); border-inline-start: 0; }
html[dir="rtl"] .topbar, html[dir="rtl"] .header-row, html[dir="rtl"] .section-heading, html[dir="rtl"] .data-row-header, html[dir="rtl"] .visit-persistent-actions, html[dir="rtl"] .form-actions { text-align: start; }
html[dir="rtl"] label, html[dir="rtl"] .panel, html[dir="rtl"] .data-row, html[dir="rtl"] .modal-content { text-align: start; }
html[dir="rtl"] .offline-sync-popover { inset-inline-end: 0; inset-inline-start: auto; }
html[dir="rtl"] .active-visit-tabs, html[dir="rtl"] .clinical-chip-cloud, html[dir="rtl"] .language-switcher { direction: rtl; }
html[dir="rtl"] input, html[dir="rtl"] textarea, html[dir="rtl"] select { text-align: start; }
html[dir="rtl"] input[type="number"], html[dir="rtl"] input[type="tel"], html[dir="rtl"] input[type="date"], html[dir="rtl"] input[type="datetime-local"], html[dir="rtl"] bdi, html[dir="rtl"] .queue-daily-ticket, html[dir="rtl"] .medical-record-number { direction: ltr; text-align: left; unicode-bidi: isolate; }
html[dir="rtl"] .button .medical-icon, html[dir="rtl"] .nav-item .medical-icon { margin-inline-start: 0; margin-inline-end: 0; }
html[dir="rtl"] .visit-sync-recovery { border-inline-start: 4px solid #c98b20; border-inline-end: 1px solid var(--border); }
html[dir="rtl"] .visit-sync-recovery.conflict { border-inline-start-color: #b84b4b; }
@media (max-width: 720px) {
  html[dir="rtl"] .receptionist-topbar-actions, html[dir="rtl"] .topbar-account-actions { justify-content: flex-start; }
  html[dir="rtl"] .modal-actions, html[dir="rtl"] .visit-persistent-actions { align-items: stretch; }
}`);

write("scripts/sprint1-arabic-rtl-operations-test.mjs", `import fs from "node:fs";

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
requireAll(copy, "bilingual operations copy", ["عيادات", "حالة الحفظ التلقائي", "تعارض في المزامنة", "توقيع وقفل هذه الزيارة", "المريضات في الانتظار", "الروشتة", "السونار"]);
requireAll(activeVisit, "active visit localization", ["operationsUiCopy", "useI18n", "ui.modules[key]", "ui.finishVisit", "ui.retrySync", "ui.signLockTitle", "ui.voidTitle", "ui.lifecycleStatus", "ui.medicationSearch", "ui.followUpDate", "saveStateLabel(saveState, ui)"]);
requireAll(operations, "queue and doctor localization", ["operationsUiCopy", "ui.currentPatientActiveVisit", "ui.waitingPatients", "ui.pickNext", "ui.doctorHandoffRules", "ui.completedVisits"]);
requireAll(offline, "offline health localization", ["operationsUiCopy", "copy.autosaveHealth", "copy.conflictGlobalHelp", "copy.retryPendingSync"]);
requireAll(css, "RTL layout", ["Sprint 1 Arabic RTL operations closure", "html[dir=\"rtl\"]", "border-inline-start", "inset-inline-end", "unicode-bidi: isolate", "@media (max-width: 720px)"]);
if (!ar.includes('appName: "عيادات د. ماجد عطية"')) throw new Error("Arabic clinic name is missing.");
for (const source of [activeVisit, operations, offline, copy, ar, en]) {
  if (/Ã|Â|â€”|â€“|ï¿½/.test(source)) throw new Error("Mojibake remains in a critical bilingual source.");
}
const keys = (source) => new Set([...source.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*):/gm)].map((match) => match[1]));
const enKeys = keys(en);
const arKeys = keys(ar);
for (const key of enKeys) if (!arKeys.has(key)) throw new Error("Arabic dictionary missing key: " + key);
for (const key of arKeys) if (!enKeys.has(key)) throw new Error("English dictionary missing key: " + key);
console.log("Sprint 1 Arabic and RTL critical operations closure PASS");
`);

console.log("Sprint 1 Arabic and RTL operations package applied.");
