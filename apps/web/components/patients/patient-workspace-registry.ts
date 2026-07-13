import type { IconName } from "../ThreeDMedicalIcon";
import type { InterfaceMode } from "@/lib/interface-mode";

export type PatientWorkspaceItem = {
  key: string; label: string; labelAr: string; route: string; requiredPermissions: string[];
  optimizedVisible: boolean; minimalisticVisible: boolean; mobileVisible: boolean; desktopVisible: boolean;
  lazyComponentLoader: () => Promise<unknown>; priority: number; underMore: boolean; icon: IconName; actionIds: string[];
  endpoint?: string; collectionKey?: string; empty: string; roles?: string[];
};

const loadLight = () => import("./workspace-modules/LightPatientModule");
const loadHeavy = () => import("./workspace-modules/HeavyPatientModule");

export const patientWorkspaceRegistry: PatientWorkspaceItem[] = [
  item("overview", "Overview", "الملخص", 10, "patients", [], ["patient.read"], true, true, loadLight),
  item("history", "History", "التاريخ", 15, "doctor", [], ["patient.read", "encounter.read"], true, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/patients/:patientId/history-sheets", "historySheets"),
  item("doctor-visit", "Current Visit", "الزيارة", 20, "encounter", ["start-visit", "continue-visit", "finish-visit"], ["encounter.read", "encounter.create"], true, true, loadLight, ["Owner", "Admin", "Doctor"]),
  item("prescriptions", "Prescriptions", "الوصفات", 30, "prescription", ["create-prescription"], ["prescription.read"], true, true, loadLight, ["Owner", "Admin", "Doctor"], "/prescriptions?patientId=:patientId", "prescriptions"),
  item("investigations", "Investigations & Results", "الطلبات والنتائج", 40, "investigations", ["create-request", "review-result"], ["clinical_requests.read", "investigation.read"], true, true, loadLight, ["Owner", "Admin", "Doctor"], "/clinical-requests?patientId=:patientId", "clinicalRequests"),
  item("pregnancy", "Women’s Health", "صحة المرأة", 50, "pregnancy", [], ["pregnancy.read", "pregnancy.manage"], true, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/pregnancies?patientId=:patientId", "pregnancies"),
  item("documents", "Documents", "المستندات", 60, "files", [], ["patient_document.read"], true, false, loadHeavy, undefined, "/patients/:patientId/documents", "patientDocuments"),
  item("billing", "Finance", "المالية", 70, "billing", [], ["billing.read", "billing.manage", "billing.report"], false, false, loadHeavy, ["Owner", "Admin", "Accountant"], "/billing/invoices?patientId=:patientId", "invoices", true),
  item("more", "More", "المزيد", 80, "settings", [], ["patient.read"], false, true, loadLight),
  item("timeline", "Timeline", "الخط الزمني", 90, "timeline", [], ["patient.read"], true, false, loadHeavy, undefined, "/patients/:patientId/timeline", "items"),
  item("consents", "Consents", "الموافقات", 100, "consent", [], ["patient.consent_read", "patient.consent_manage"], false, false, loadLight, undefined, "/consents?patientId=:patientId", "consentRecords", true),
  item("infertility", "Infertility", "تأخر الإنجاب", 110, "doctor", [], ["encounter.read"], false, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/patients/:patientId/infertility", "cycles", true),
  item("ultrasound", "Ultrasound", "الموجات فوق الصوتية", 120, "ultrasound", [], ["ob_ultrasound.read", "ob_ultrasound.manage"], false, false, loadHeavy, ["Owner", "Admin", "Doctor"], "/ob-ultrasounds?patientId=:patientId", "obUltrasounds", true),
  item("files", "Reports", "التقارير", 130, "reports", [], ["report.read"], false, false, loadHeavy, undefined, "/reports?patientId=:patientId", "reports", true),
  item("internal-notes", "Internal notes", "ملاحظات داخلية", 140, "doctor", [], ["patient_internal_note.read"], false, false, loadLight, ["Owner", "Admin", "Doctor"], "/patients/:patientId/internal-notes", "patientInternalNotes", true),
  item("ai-snapshot", "Review hints", "تلميحات المراجعة", 150, "ai", [], ["care_assist.read"], false, false, loadHeavy, ["Owner", "Admin", "Doctor"], undefined, undefined, true)
];

export function visiblePatientWorkspaceItems(input: { mode: InterfaceMode; mobile: boolean; permissions: string[]; roles: string[] }) {
  return patientWorkspaceRegistry.filter((entry) => (input.mode === "OPTIMIZED" ? entry.optimizedVisible : entry.minimalisticVisible) && (input.mobile ? entry.mobileVisible : entry.desktopVisible) && (!entry.requiredPermissions.length || entry.requiredPermissions.some((permission) => input.permissions.includes(permission))) && (!entry.roles?.length || entry.roles.some((role) => input.roles.includes(role)))).sort((a, b) => a.priority - b.priority);
}

export function patientWorkspaceItem(key: string) { return patientWorkspaceRegistry.find((entry) => entry.key === key); }

function item(key: string, label: string, labelAr: string, priority: number, icon: IconName, actionIds: string[], requiredPermissions: string[], optimizedVisible: boolean, minimalisticVisible: boolean, lazyComponentLoader: () => Promise<unknown>, roles?: string[], endpoint?: string, collectionKey?: string, underMore = false): PatientWorkspaceItem {
  return { key, label, labelAr, route: `?module=${key}`, requiredPermissions, optimizedVisible, minimalisticVisible, mobileVisible: true, desktopVisible: true, lazyComponentLoader, priority, underMore, icon, actionIds, endpoint, collectionKey, empty: `No ${label.toLowerCase()} records yet.`, roles };
}
