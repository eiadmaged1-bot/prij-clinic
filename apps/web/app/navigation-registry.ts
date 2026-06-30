import type { IconName } from "../components/ThreeDMedicalIcon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Operations" | "Clinical" | "OB/Pregnancy" | "Finance" | "Safety/Admin" | "Admin";
  permissions?: string[];
  roles?: string[];
  adminOnly?: boolean;
};

export const navigationRegistry: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", group: "Operations" },
  { href: "/doctor", label: "Doctor Mode", icon: "doctor", group: "Operations", permissions: ["encounter.read", "encounter.create"] },
  { href: "/patients", label: "Patients", icon: "patients", group: "Operations" },
  { href: "/patients/new", label: "New Patient", icon: "patients", group: "Operations", permissions: ["patient.create", "patients.manage"] },
  { href: "/appointments", label: "Appointments", icon: "calendar", group: "Operations", permissions: ["appointment.read", "appointments.read"] },
  { href: "/calendar", label: "Calendar", icon: "calendar", group: "Operations", permissions: ["appointment.read", "appointments.read"] },
  { href: "/queue", label: "Queue", icon: "queue", group: "Operations", permissions: ["queue.read"] },
  { href: "/doctor/visit", label: "Guided Visit", icon: "encounter", group: "Clinical", permissions: ["encounter.create", "encounter.read"] },
  { href: "/calculators", label: "Calculators", icon: "investigations", group: "Clinical", permissions: ["calculator.read", "calculator.calculate"] },
  { href: "/protocol-atlas", label: "Protocol Atlas", icon: "ai", group: "Clinical", permissions: ["protocol_atlas.read", "ai_management.read"] },
  { href: "/guidelines", label: "Guideline Center", icon: "reports", group: "Clinical", permissions: ["guidelines.read", "guidelines.search"] },
  { href: "/medications", label: "Medications", icon: "prescription", group: "Clinical", permissions: ["medications.read", "medications.search"] },
  { href: "/drug-market", label: "Drug Market", icon: "prescription", group: "Clinical", permissions: ["drug_market.read", "drug_market.search"] },
  { href: "/encounters", label: "Visits", icon: "encounter", group: "Clinical", permissions: ["encounter.read"] },
  { href: "/prescriptions", label: "Prescriptions", icon: "prescription", group: "Clinical", permissions: ["prescription.read"] },
  { href: "/investigations", label: "Orders", icon: "investigations", group: "Clinical", permissions: ["investigation.read"] },
  { href: "/reports", label: "Reports", icon: "reports", group: "Clinical", permissions: ["report.read"] },
  { href: "/documents", label: "Documents", icon: "files", group: "Clinical", permissions: ["patient_document.read"] },
  { href: "/referrals", label: "Referrals", icon: "reports", group: "Clinical", permissions: ["referral.read"] },
  { href: "/tasks", label: "Tasks", icon: "queue", group: "Operations", permissions: ["patient_task.read"] },
  { href: "/guidelines/search", label: "Evidence Library", icon: "reports", group: "Clinical", permissions: ["guidelines.search"] },
  { href: "/pregnancies", label: "Pregnancy", icon: "pregnancy", group: "OB/Pregnancy", permissions: ["pregnancy.read", "pregnancy.manage"] },
  { href: "/ultrasound", label: "Ultrasound", icon: "ultrasound", group: "OB/Pregnancy", permissions: ["ob_ultrasound.read", "ob_ultrasound.manage"] },
  { href: "/billing", label: "Billing", icon: "billing", group: "Finance", roles: ["Owner", "Admin", "Accountant"], permissions: ["billing.read", "billing.manage", "billing.report"] },
  { href: "/consents", label: "Consents", icon: "consent", group: "Safety/Admin", permissions: ["patient.consent_read", "patient.consent_manage"] },
  { href: "/ai-drafts", label: "AI Draft Review", icon: "ai", group: "Safety/Admin", permissions: ["ai_draft.read", "ai_draft.review", "ai_management.read"] },
  { href: "/admin", label: "Admin Control Center", icon: "admin", group: "Admin", adminOnly: true },
  { href: "/admin/medications", label: "Medication Catalog/Admin", icon: "prescription", group: "Admin", adminOnly: true },
  { href: "/admin/drug-market", label: "Drug Market Admin", icon: "prescription", group: "Admin", adminOnly: true },
  { href: "/admin/drug-market/coverage", label: "Drug Market Coverage", icon: "prescription", group: "Admin", adminOnly: true },
  { href: "/admin/drug-market/import", label: "Medication Import", icon: "prescription", group: "Admin", adminOnly: true },
  { href: "/admin/drug-market/review-queue", label: "Medication Review Queue", icon: "prescription", group: "Admin", adminOnly: true },
  { href: "/admin/protocol-atlas", label: "Protocol Verification", icon: "ai", group: "Admin", adminOnly: true },
  { href: "/admin/appearance", label: "Appearance", icon: "settings", group: "Admin", adminOnly: true },
  { href: "/admin/accounts", label: "Accounts", icon: "reception", group: "Admin", adminOnly: true }
];

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
  { key: "appointments", label: "Appointments", icon: "calendar", endpoint: "/appointments", collectionKey: "appointments", empty: "No appointment recorded yet." },
  { key: "visits", label: "Encounters", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready." },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit." },
  { key: "orders", label: "Investigations", icon: "investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", empty: "No test orders yet. Order lab or radiology when needed." },
  { key: "results", label: "Results", icon: "reports", endpoint: "/patients/:patientId/investigation-results", collectionKey: "investigationResults", empty: "No result metadata yet. Doctor review required." },
  { key: "files", label: "Reports", icon: "reports", endpoint: "/reports", collectionKey: "reports", empty: "No report or attachment record yet. Real clinical file upload is disabled." },
  { key: "documents", label: "Documents", icon: "files", endpoint: "/patients/:patientId/documents", collectionKey: "patientDocuments", empty: "No document metadata yet." },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet." },
  { key: "ultrasound", label: "Ultrasound", icon: "ultrasound", endpoint: "/ob-ultrasounds", collectionKey: "obUltrasounds", empty: "No ultrasound record yet." },
  { key: "billing", label: "Billing", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet. Create one only with demo payment details." },
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
