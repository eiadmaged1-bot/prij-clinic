import type { IconName } from "../components/ThreeDMedicalIcon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Daily Work" | "Clinical" | "Women's Health" | "Medication" | "Finance" | "Evidence" | "Admin" | "Future";
  permissions?: string[];
  roles?: string[];
  adminOnly?: boolean;
};

export const navigationRegistry: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", group: "Daily Work" },
  { href: "/doctor", label: "Doctor Mode", icon: "doctor", group: "Daily Work", permissions: ["encounter.read", "encounter.create"] },
  { href: "/patients", label: "Patients", icon: "patients", group: "Daily Work" },
  { href: "/patients/new", label: "New Patient", icon: "patients", group: "Daily Work", permissions: ["patient.create", "patients.manage"] },
  { href: "/appointments", label: "Appointments", icon: "calendar", group: "Daily Work", permissions: ["appointment.read", "appointments.read"] },
  { href: "/calendar", label: "Calendar", icon: "calendar", group: "Daily Work", permissions: ["appointment.read", "appointments.read"] },
  { href: "/queue", label: "Queue", icon: "queue", group: "Daily Work", permissions: ["queue.read"] },
  { href: "/doctor/visit", label: "Guided Visit", icon: "encounter", group: "Clinical", permissions: ["encounter.create", "encounter.read"] },
  { href: "/encounters", label: "Encounters", icon: "encounter", group: "Clinical", permissions: ["encounter.read"] },
  { href: "/prescriptions", label: "Prescriptions", icon: "prescription", group: "Clinical", permissions: ["prescription.read"] },
  { href: "/investigations", label: "Investigations", icon: "investigations", group: "Clinical", permissions: ["investigation.read"] },
  { href: "/reports", label: "Reports", icon: "reports", group: "Clinical", permissions: ["report.read"] },
  { href: "/pregnancies", label: "Pregnancy", icon: "pregnancy", group: "Women's Health", permissions: ["pregnancy.read", "pregnancy.manage"] },
  { href: "/ultrasound", label: "Ultrasound", icon: "ultrasound", group: "Women's Health", permissions: ["ob_ultrasound.read", "ob_ultrasound.manage"] },
  { href: "/gynecology", label: "Gynecology", icon: "doctor", group: "Women's Health", permissions: ["encounter.read", "encounter.create"] },
  { href: "/medications", label: "Medication Center", icon: "prescription", group: "Medication", permissions: ["medications.read", "medications.search"] },
  { href: "/drug-market", label: "Drug Market", icon: "prescription", group: "Medication", permissions: ["drug_market.read", "drug_market.search"] },
  { href: "/billing", label: "Billing", icon: "billing", group: "Finance", roles: ["Owner", "Admin", "Accountant"], permissions: ["billing.read", "billing.manage", "billing.report"] },
  { href: "/protocol-atlas", label: "Protocol Atlas", icon: "ai", group: "Evidence", permissions: ["protocol_atlas.read", "ai_management.read"] },
  { href: "/guidelines", label: "Guideline Center", icon: "reports", group: "Evidence", permissions: ["guidelines.read", "guidelines.search"] },
  { href: "/guidelines/search", label: "Evidence Library", icon: "reports", group: "Evidence", permissions: ["guidelines.search"] },
  { href: "/consents", label: "Consents", icon: "consent", group: "Evidence", permissions: ["patient.consent_read", "patient.consent_manage"] },
  { href: "/ai-drafts", label: "AI Draft Review", icon: "ai", group: "Evidence", permissions: ["ai_draft.read", "ai_draft.review", "ai_management.read"] },
  { href: "/admin", label: "Admin Control Center", icon: "admin", group: "Admin", adminOnly: true },
  { href: "/admin/medications", label: "Medication Catalog/Admin", icon: "prescription", group: "Admin", adminOnly: true },
  { href: "/admin/drug-market", label: "Drug Market Admin", icon: "prescription", group: "Admin", adminOnly: true },
  { href: "/admin/protocol-atlas", label: "Protocol Verification", icon: "ai", group: "Admin", adminOnly: true },
  { href: "/admin/appearance", label: "Appearance", icon: "settings", group: "Admin", adminOnly: true },
  { href: "/admin/accounts", label: "Accounts", icon: "reception", group: "Admin", adminOnly: true },
  { href: "/support", label: "Support", icon: "files", group: "Future", permissions: ["future.placeholder"] },
  { href: "/inventory", label: "Inventory", icon: "files", group: "Future", permissions: ["future.placeholder"] },
  { href: "/analytics", label: "Analytics", icon: "dashboard", group: "Future", permissions: ["future.placeholder"] }
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
  { key: "queue", label: "Queue", icon: "queue", empty: "No queue entry recorded yet." },
  { key: "visits", label: "Encounters", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready." },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit." },
  { key: "orders", label: "Investigations", icon: "investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", empty: "No test orders yet. Order lab or radiology when needed." },
  { key: "files", label: "Reports", icon: "reports", endpoint: "/reports", collectionKey: "reports", empty: "No report or attachment record yet. Real clinical file upload is disabled." },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet." },
  { key: "ultrasound", label: "Ultrasound", icon: "ultrasound", endpoint: "/ob-ultrasounds", collectionKey: "obUltrasounds", empty: "No ultrasound record yet." },
  { key: "gynecology", label: "Gynecology", icon: "doctor", empty: "No gynecology visit recorded yet.", permissions: ["encounter.read", "encounter.create"] },
  { key: "billing", label: "Billing", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet. Create one only with demo payment details." },
  { key: "consents", label: "Consents", icon: "consent", endpoint: "/consents", collectionKey: "consents", empty: "No consent record yet." },
  { key: "files", label: "Files", icon: "files", empty: "No attachment placeholder recorded yet." },
  { key: "ai-snapshot", label: "AI Snapshot", icon: "ai", empty: "No management snapshot yet. Doctor review is required.", permissions: ["ai_management.request", "ai_management.read"] },
  { key: "protocol-atlas", label: "Protocol Atlas", icon: "ai", empty: "Protocol links appear here." },
  { key: "calculators", label: "Calculators", icon: "investigations", empty: "Calculator history appears here." },
  { key: "medications", label: "Medications", icon: "prescription", empty: "No active medication list entry yet.", permissions: ["patient_medications.read"] },
  { key: "allergies", label: "Allergies", icon: "consent", empty: "No allergy entry yet.", permissions: ["patient_allergies.read"] },
  { key: "herbals", label: "Herbal/Supplements", icon: "files", empty: "No herbal or supplement entry yet.", permissions: ["patient_medications.read"] },
  { key: "medication-safety", label: "Medication Safety", icon: "ai", empty: "Run a medication safety review when clinically needed.", permissions: ["medications.safety_check"] },
  { key: "prescription-safety", label: "Prescription Safety", icon: "prescription", empty: "Prescription safety review appears here.", permissions: ["medications.safety_check"] },
  { key: "timeline", label: "Timeline", icon: "timeline", empty: "The patient story appears here as records are created." }
];
