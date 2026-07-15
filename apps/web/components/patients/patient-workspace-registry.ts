import type { IconName } from "../ThreeDMedicalIcon";
import type { InterfaceMode } from "@/lib/interface-mode";

export type PatientWorkspaceItem = {
  key: string; label: string; labelAr: string; titleTranslationKey: string; route: string; requiredPermissions: string[];
  optimizedVisible: boolean; minimalisticVisible: boolean; mobileVisible: boolean; desktopVisible: boolean;
  lazyComponentLoader: () => Promise<unknown>; priority: number; underMore: boolean; icon: IconName; actionIds: string[];
  endpoint?: string; collectionKey?: string; empty: string; roles?: string[];
  permittedRoles: string[]; applicablePatientContexts: Array<"GENERAL" | "WOMEN_HEALTH" | "PREGNANCY" | "INFERTILITY">;
  supportedSizes: Array<"SMALL" | "MEDIUM" | "WIDE" | "FULL">; dataSource: { endpoint?: string; collectionKey?: string };
  loadingStrategy: "eager" | "lazy"; mandatory: boolean; missingDataRules: string[]; refreshDependencies: string[];
};

const loadLight = () => import("./workspace-modules/LightPatientModule");
const loadHeavy = () => import("./workspace-modules/HeavyPatientModule");

export const patientWorkspaceRegistry: PatientWorkspaceItem[] = [
  item("overview", "Overview", "الملخص", 10, "patients", [], ["patient.read"], true, true, loadLight),
  item("history", "History", "التاريخ", 15, "doctor", [], ["patient.read", "encounter.read"], true, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/patients/:patientId/history-sheets", "historySheets"),
  item("doctor-visit", "Visit", "الزيارة", 20, "encounter", ["start-visit", "continue-visit", "finish-visit"], ["encounter.read", "encounter.create"], true, true, loadLight, ["Owner", "Admin", "Doctor"]),
  item("allergies", "Allergies", "الحساسية", 25, "consent", [], ["patient_allergies.read"], false, false, loadLight, ["Owner", "Admin", "Doctor"], "/patients/:patientId/allergies", "allergies", true),
  item("medications", "Medications", "الأدوية", 26, "prescription", [], ["patient_medications.read"], false, false, loadLight, ["Owner", "Admin", "Doctor"], "/patients/:patientId/medications", "medications", true),
  item("prescriptions", "Previous Prescriptions", "الوصفات السابقة", 30, "prescription", ["create-prescription"], ["prescription.read"], false, false, loadLight, ["Owner", "Admin", "Doctor"], "/prescriptions?patientId=:patientId", "prescriptions", true),
  item("investigations", "Results", "النتائج", 40, "investigations", ["create-request", "review-result"], ["clinical_requests.read", "investigation.read"], false, false, loadLight, ["Owner", "Admin", "Doctor"], "/clinical-requests?patientId=:patientId", "clinicalRequests", true),
  item("pregnancy", "Women’s Health", "صحة المرأة", 50, "pregnancy", [], ["pregnancy.read", "pregnancy.manage"], false, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/pregnancies?patientId=:patientId", "pregnancies", true),
  item("documents", "Documents", "المستندات", 60, "files", [], ["patient_document.read"], false, false, loadHeavy, undefined, "/patients/:patientId/documents", "patientDocuments", true),
  item("billing", "Finance", "المالية", 70, "billing", [], ["billing.read", "billing.manage", "billing.report"], false, false, loadHeavy, ["Owner", "Admin", "Accountant"], "/billing/invoices?patientId=:patientId", "invoices", true),
  item("timeline", "Timeline", "الخط الزمني", 70, "timeline", [], ["patient.read"], true, true, loadHeavy, undefined, "/patients/:patientId/timeline", "items"),
  item("more", "More", "المزيد", 80, "settings", [], ["patient.read"], true, true, loadLight),
  item("consents", "Consents", "الموافقات", 100, "consent", [], ["patient.consent_read", "patient.consent_manage"], false, false, loadLight, undefined, "/consents?patientId=:patientId", "consentRecords", true),
  item("infertility", "Infertility", "تأخر الإنجاب", 110, "doctor", [], ["encounter.read"], false, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/patients/:patientId/infertility", "cycles", true),
  item("ultrasound", "Ultrasound", "الموجات فوق الصوتية", 120, "ultrasound", [], ["ob_ultrasound.read", "ob_ultrasound.manage"], false, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/ob-ultrasounds?patientId=:patientId", "obUltrasounds", true),
  item("files", "Reports", "التقارير", 130, "reports", [], ["report.read"], false, false, loadHeavy, undefined, "/reports?patientId=:patientId", "reports", true),
  item("internal-notes", "Internal notes", "ملاحظات داخلية", 140, "doctor", [], ["patient_internal_note.read"], false, false, loadLight, ["Owner", "Admin", "Doctor"], "/patients/:patientId/internal-notes", "patientInternalNotes", true),
  item("tasks", "Tasks and reminders", "المهام والتذكيرات", 145, "queue", [], ["patient_task.read"], false, false, loadLight, undefined, "/patients/:patientId/tasks", "patientTasks", true),
  item("referrals", "Referrals", "الإحالات", 146, "reports", [], ["referral.read"], false, false, loadLight, ["Owner", "Admin", "Doctor"], "/patients/:patientId/referrals", "referrals", true),
  item("ai-snapshot", "Review hints", "تلميحات المراجعة", 150, "ai", [], ["care_assist.read"], false, false, loadHeavy, ["Owner", "Admin", "Doctor"], undefined, undefined, true)
];

export function visiblePatientWorkspaceItems(input: { mode: InterfaceMode; mobile: boolean; permissions: string[]; roles: string[] }) {
  const primaryOrder = new Map(["overview", "doctor-visit", "history", "timeline", "more"].map((key, index) => [key, index]));
  return patientWorkspaceRegistry.filter((entry) => (entry.key === "history" || (input.mode === "OPTIMIZED" ? entry.optimizedVisible : entry.minimalisticVisible)) && (input.mobile ? entry.mobileVisible : entry.desktopVisible) && (!entry.requiredPermissions.length || entry.requiredPermissions.some((permission) => input.permissions.includes(permission))) && (!entry.roles?.length || entry.roles.some((role) => input.roles.includes(role)))).sort((a, b) => (primaryOrder.get(a.key) ?? a.priority + 100) - (primaryOrder.get(b.key) ?? b.priority + 100));
}

export function patientWorkspaceItem(key: string) { return patientWorkspaceRegistry.find((entry) => entry.key === key); }

function item(key: string, label: string, labelAr: string, priority: number, icon: IconName, actionIds: string[], requiredPermissions: string[], optimizedVisible: boolean, minimalisticVisible: boolean, lazyComponentLoader: () => Promise<unknown>, roles?: string[], endpoint?: string, collectionKey?: string, underMore = false): PatientWorkspaceItem {
  const mandatory = key === "overview";
  return { key, label, labelAr, titleTranslationKey: `patientWorkspace.panels.${key}.title`, route: `?module=${key}`, requiredPermissions, optimizedVisible, minimalisticVisible, mobileVisible: true, desktopVisible: true, lazyComponentLoader, priority, underMore, icon, actionIds, endpoint, collectionKey, empty: `No ${label.toLowerCase()} records yet.`, roles, permittedRoles: roles ?? [], applicablePatientContexts: contextsFor(key), supportedSizes: mandatory ? ["FULL"] : ["SMALL", "MEDIUM", "WIDE", "FULL"], dataSource: { endpoint, collectionKey }, loadingStrategy: key === "overview" || key === "doctor-visit" ? "eager" : "lazy", mandatory, missingDataRules: missingRulesFor(key), refreshDependencies: refreshDependenciesFor(key) };
}

function contextsFor(key: string): PatientWorkspaceItem["applicablePatientContexts"] { if (key === "pregnancy") return ["PREGNANCY"]; if (key === "infertility") return ["INFERTILITY"]; return ["GENERAL", "WOMEN_HEALTH", "PREGNANCY", "INFERTILITY"]; }
function missingRulesFor(key: string) { const map: Record<string, string[]> = { overview: ["DOB_ABSENT"], allergies: ["ALLERGY_STATUS_UNKNOWN"], "doctor-visit": ["UNSIGNED_ENCOUNTER", "ACTIVE_VISIT_BP_ABSENT", "TREATMENT_CONSENT_ABSENT"], pregnancy: ["PREGNANCY_EDD_ABSENT"], infertility: ["INFERTILITY_CYCLE_DAY_ABSENT"], investigations: ["ORDER_RESULT", "RESULT_REVIEW"] }; return map[key] ?? []; }
function refreshDependenciesFor(key: string) { const map: Record<string, string[]> = { overview: ["patient.updated"], "doctor-visit": ["queue.changed", "encounter.changed"], investigations: ["investigation.changed", "result.changed"], ultrasound: ["ultrasound.changed"], prescriptions: ["prescription.changed"], medications: ["prescription.changed", "medication.changed"], pregnancy: ["pregnancy.changed", "ultrasound.changed"], infertility: ["fertility-cycle.changed", "ultrasound.changed"], timeline: ["queue.changed", "encounter.changed", "investigation.changed", "ultrasound.changed", "prescription.changed"] }; return map[key] ?? ["patient.updated"]; }
