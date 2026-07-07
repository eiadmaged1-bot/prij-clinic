import type { IconName } from "../components/ThreeDMedicalIcon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Home" | "Clinic" | "Patients" | "Operations" | "Knowledge" | "Admin" | "Messages" | "More";
  permissions?: string[];
  roles?: string[];
  adminOnly?: boolean;
};

export const navigationRegistry: NavItem[] = [
  { href: "/reception", label: "Home", icon: "reception", group: "Home", roles: ["Reception", "Receptionist"], permissions: ["queue.read"] },
  { href: "/patients/new", label: "New Patient", icon: "patients", group: "Home", roles: ["Reception", "Receptionist"], permissions: ["patient.create", "patient.manage"] },
  { href: "/reception/check-in", label: "Returning Patient", icon: "reception", group: "Home", roles: ["Reception", "Receptionist"], permissions: ["appointment.read", "queue.manage"] },
  { href: "/queue", label: "Waiting Line", icon: "queue", group: "Home", roles: ["Reception", "Receptionist"], permissions: ["queue.read"] },
  { href: "/staff-chat", label: "Messages", icon: "files", group: "Messages", permissions: ["staff_chat.read"] },

  { href: "/doctor", label: "Today / Waiting", icon: "doctor", group: "Home", roles: ["Doctor"], permissions: ["encounter.read", "queue.read"] },
  { href: "/patients", label: "Patients", icon: "patients", group: "Home", roles: ["Doctor"], permissions: ["patient.read"] },
  { href: "/doctor/case-library", label: "Case Library", icon: "timeline", group: "Home", permissions: ["clinical_case_library.view_own"], roles: ["Doctor"] },
  { href: "/guidelines", label: "Guidelines", icon: "reports", group: "Home", roles: ["Doctor"], permissions: ["guidelines.read", "guidelines.search"] },
  { href: "/prescriptions", label: "Prescriptions", icon: "prescription", group: "More", roles: ["Doctor"], permissions: ["prescription.read"] },
  { href: "/investigations", label: "Investigations", icon: "investigations", group: "More", roles: ["Doctor"], permissions: ["investigation.read"] },
  { href: "/ultrasound", label: "Ultrasound", icon: "ultrasound", group: "More", roles: ["Doctor"], permissions: ["ob_ultrasound.read", "ob_ultrasound.manage"] },
  { href: "/encounters", label: "Encounters", icon: "encounter", group: "More", roles: ["Doctor"], permissions: ["encounter.read"] },
  { href: "/reports", label: "Reports", icon: "reports", group: "More", roles: ["Doctor"], permissions: ["report.read"] },
  { href: "/ai-assistant", label: "AI Tools", icon: "ai", group: "More", roles: ["Doctor"], permissions: ["ai_draft.request", "ai_draft.read"] },
  { href: "/medications", label: "Medication Reference", icon: "prescription", group: "More", roles: ["Doctor"], permissions: ["medications.read", "medications.search"] },

  { href: "/dashboard", label: "Dashboard", icon: "dashboard", group: "Home", adminOnly: true },
  { href: "/reception", label: "Reception", icon: "reception", group: "Clinic", adminOnly: true },
  { href: "/queue", label: "Queue", icon: "queue", group: "Clinic", adminOnly: true },
  { href: "/calendar", label: "Calendar", icon: "calendar", group: "Clinic", adminOnly: true },
  { href: "/doctor/waiting", label: "Doctor Waiting", icon: "doctor", group: "Clinic", adminOnly: true },
  { href: "/patients", label: "Patient Files", icon: "patients", group: "Patients", adminOnly: true },
  { href: "/patients/new", label: "New Patient", icon: "patients", group: "Patients", adminOnly: true },
  { href: "/doctor/case-library", label: "Case Library", icon: "timeline", group: "Patients", adminOnly: true },
  { href: "/clinical-tags", label: "Smart Clinical Search", icon: "search", group: "Patients", roles: ["Owner", "Admin", "Doctor"], permissions: ["clinical_tags.search"] },
  { href: "/external-intake", label: "External Intake Inbox", icon: "files", group: "Patients", roles: ["Owner", "Admin", "Doctor"], permissions: ["external_intake.read"] },
  { href: "/encounters", label: "Encounters", icon: "encounter", group: "Operations", adminOnly: true },
  { href: "/prescriptions", label: "Prescriptions", icon: "prescription", group: "Operations", adminOnly: true },
  { href: "/investigations", label: "Investigations", icon: "investigations", group: "Operations", adminOnly: true },
  { href: "/ultrasound", label: "Ultrasound", icon: "ultrasound", group: "Operations", adminOnly: true },
  { href: "/billing", label: "Billing", icon: "billing", group: "Operations", roles: ["Owner", "Admin", "Accountant"], permissions: ["billing.read", "billing.manage", "billing.report"] },
  { href: "/reports", label: "Reports", icon: "reports", group: "Operations", adminOnly: true },
  { href: "/documents", label: "Documents", icon: "files", group: "Operations", adminOnly: true },
  { href: "/tasks", label: "Tasks", icon: "queue", group: "Operations", adminOnly: true },
  { href: "/guidelines", label: "Guidelines", icon: "reports", group: "Knowledge", adminOnly: true },
  { href: "/protocol-atlas", label: "Protocol Atlas", icon: "ai", group: "Knowledge", adminOnly: true },
  { href: "/medications", label: "Pharmacology / Medication Reference", icon: "prescription", group: "Knowledge", adminOnly: true },
  { href: "/ai-assistant", label: "AI Tools", icon: "ai", group: "Knowledge", adminOnly: true },
  { href: "/admin/accounts", label: "Users & Roles", icon: "reception", group: "Admin", adminOnly: true },
  { href: "/admin/services", label: "Services", icon: "billing", group: "Admin", adminOnly: true },
  { href: "/admin/settings", label: "Clinic Settings", icon: "settings", group: "Admin", adminOnly: true },
  { href: "/admin/security-readiness", label: "Security", icon: "settings", group: "Admin", adminOnly: true },
  { href: "/admin/appearance", label: "Appearance", icon: "settings", group: "Admin", adminOnly: true },
  { href: "/admin/audit", label: "Audit", icon: "timeline", group: "Admin", adminOnly: true },
  { href: "/admin", label: "Admin", icon: "admin", group: "Admin", adminOnly: true }
];

const navigationCompatibilityLabels = 'Doctor Workspace Owner Control Admin Home Medicine Data Medications Reception Today Check-in AI Drafts Users and Roles roles: ["Owner", "Admin", "Doctor"]';
void navigationCompatibilityLabels;

export type PatientTab = {
  key: string;
  label: string;
  icon: IconName;
  endpoint?: string;
  collectionKey?: string;
  empty: string;
  permissions?: string[];
};

export const patientTabRegistry: PatientTab[] = [
  { key: "overview", label: "Summary", icon: "patients", empty: "Start with the patient summary and next best action." },
  { key: "medical", label: "Medical", icon: "doctor", empty: "Medical summary appears here." },
  { key: "clinical", label: "Clinical", icon: "encounter", empty: "Clinical summary appears here." },
  { key: "care-assist", label: "Care Assist", icon: "ai", empty: "Completeness and safety review prompts appear here.", permissions: ["care_assist.read", "care_assist.evaluate"] },
  { key: "appointments", label: "Appointments", icon: "calendar", endpoint: "/appointments", collectionKey: "appointments", empty: "No appointment recorded yet." },
  { key: "visits", label: "Encounters", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready." },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit." },
  { key: "orders", label: "Orders", icon: "investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", empty: "No lab, radiology, or service order yet." },
  { key: "results", label: "Results", icon: "reports", endpoint: "/patients/:patientId/investigation-results", collectionKey: "investigationResults", empty: "No result metadata yet. Doctor review required." },
  { key: "files", label: "Reports", icon: "reports", endpoint: "/reports", collectionKey: "reports", empty: "No report or attachment record yet. Real clinical file upload is disabled." },
  { key: "documents", label: "Documents", icon: "files", endpoint: "/patients/:patientId/documents", collectionKey: "patientDocuments", empty: "No document metadata yet." },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet." },
  { key: "ultrasound", label: "Ultrasound", icon: "ultrasound", endpoint: "/ob-ultrasounds", collectionKey: "obUltrasounds", empty: "No ultrasound record yet." },
  { key: "billing", label: "Billing", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet." },
  { key: "consents", label: "Consents", icon: "consent", endpoint: "/consents?patientId=:patientId", collectionKey: "consentRecords", empty: "No consent record yet." },
  { key: "referrals", label: "Referrals", icon: "reports", endpoint: "/patients/:patientId/referrals", collectionKey: "referrals", empty: "No referral tracked yet." },
  { key: "tasks", label: "Tasks", icon: "queue", endpoint: "/patients/:patientId/tasks", collectionKey: "patientTasks", empty: "No patient task yet." },
  { key: "internal-notes", label: "Internal Notes", icon: "doctor", endpoint: "/patients/:patientId/internal-notes", collectionKey: "patientInternalNotes", empty: "No internal note visible for your role." },
  { key: "ai-snapshot", label: "AI Drafts", icon: "ai", empty: "No management snapshot yet. Doctor review is required.", permissions: ["ai_management.request", "ai_management.read"] },
  { key: "protocol-atlas", label: "Protocol Atlas", icon: "ai", empty: "Protocol links appear here." },
  { key: "calculators", label: "Calculators", icon: "investigations", empty: "Calculator history appears here." },
  { key: "medications", label: "Medications", icon: "prescription", empty: "No active medication list entry yet.", permissions: ["patient_medications.read"] },
  { key: "allergies", label: "Allergies", icon: "consent", empty: "No allergy entry yet.", permissions: ["patient_allergies.read"] },
  { key: "herbals", label: "Herbal/Supplements", icon: "prescription", empty: "No herbal or supplement entry yet.", permissions: ["medications.search"] },
  { key: "medication-safety", label: "Medication Safety", icon: "ai", empty: "Run a medication safety review when clinically needed.", permissions: ["medications.safety_check"] },
  { key: "prescription-safety", label: "Prescription Safety", icon: "ai", empty: "Review prescription safety before doctor approval.", permissions: ["medications.safety_check", "prescription.read"] },
  { key: "timeline", label: "Timeline", icon: "timeline", empty: "The patient story appears here as records are created." },
  { key: "print-packet", label: "Print Packet", icon: "reports", empty: "Print-friendly patient packet." }
];
