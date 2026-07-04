import type { IconName } from "../components/ThreeDMedicalIcon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Today" | "Patients" | "Clinical" | "Operations" | "Knowledge" | "Medication Reference" | "Admin";
  permissions?: string[];
  roles?: string[];
  adminOnly?: boolean;
};

export const navigationRegistry: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", group: "Today" },
  { href: "/clinic-day/walkthrough", label: "Clinic Walkthrough", icon: "timeline", group: "Today", roles: ["Owner", "Admin", "Doctor"], permissions: ["patient.read", "queue.read", "encounter.read"] },
  { href: "/reception/today", label: "Reception Today", icon: "reception", group: "Today", roles: ["Owner", "Admin", "Reception", "Receptionist"], permissions: ["appointment.read", "queue.read"] },
  { href: "/reception/check-in", label: "Check-in", icon: "reception", group: "Today", roles: ["Owner", "Admin", "Reception", "Receptionist"], permissions: ["appointment.read", "queue.manage"] },
  { href: "/queue", label: "Queue", icon: "queue", group: "Today", permissions: ["queue.read"] },
  { href: "/calendar", label: "Calendar", icon: "calendar", group: "Today", permissions: ["appointment.read", "appointments.read"] },
  { href: "/patients", label: "Patient Files", icon: "patients", group: "Patients" },
  { href: "/patients/new", label: "New Patient", icon: "patients", group: "Patients" },
  { href: "/doctor", label: "Doctor Workspace", icon: "doctor", group: "Clinical", permissions: ["encounter.read", "queue.read"] },
  { href: "/doctor/waiting", label: "Doctor Waiting", icon: "doctor", group: "Clinical", permissions: ["encounter.read", "queue.read"] },
  { href: "/doctor/visit", label: "Doctor Visit", icon: "encounter", group: "Clinical", permissions: ["encounter.create", "encounter.read"] },
  { href: "/prescriptions", label: "Prescriptions", icon: "prescription", group: "Clinical", permissions: ["prescription.read"] },
  { href: "/care-assist", label: "Care Assist", icon: "ai", group: "Clinical", permissions: ["care_assist.read", "care_assist.evaluate"] },
  { href: "/orders", label: "Orders", icon: "investigations", group: "Clinical", permissions: ["investigation.read"] },
  { href: "/investigations", label: "Investigations", icon: "investigations", group: "Clinical", permissions: ["investigation.read"] },
  { href: "/ultrasound", label: "Ultrasound", icon: "ultrasound", group: "Clinical", permissions: ["ob_ultrasound.read", "ob_ultrasound.manage"] },
  { href: "/encounters", label: "Encounters", icon: "encounter", group: "Clinical", permissions: ["encounter.read"] },
  { href: "/billing", label: "Billing", icon: "billing", group: "Operations", roles: ["Owner", "Admin", "Accountant"], permissions: ["billing.read", "billing.manage", "billing.report"] },
  { href: "/finance", label: "Finance", icon: "billing", group: "Operations", roles: ["Owner", "Admin", "Accountant"], permissions: ["billing.read", "billing.manage", "billing.report"] },
  { href: "/referrals", label: "Referrals", icon: "reports", group: "Operations", permissions: ["referral.read"] },
  { href: "/tasks", label: "Tasks", icon: "queue", group: "Operations", permissions: ["patient_task.read"] },
  { href: "/documents", label: "Documents", icon: "files", group: "Operations", permissions: ["patient_document.read"] },
  { href: "/guidelines", label: "Guidelines", icon: "reports", group: "Knowledge", permissions: ["guidelines.read", "guidelines.search"] },
  { href: "/protocol-atlas", label: "Protocol Atlas", icon: "ai", group: "Knowledge", permissions: ["protocol_atlas.read", "ai_management.read"] },
  { href: "/ai-drafts", label: "AI Drafts", icon: "ai", group: "Knowledge", permissions: ["ai_draft.read", "ai_draft.review", "ai_management.read"] },
  { href: "/medications", label: "Medications", icon: "prescription", group: "Medication Reference", permissions: ["medications.read", "medications.search"] },
  { href: "/drug-market", label: "Medicine Data", icon: "prescription", group: "Medication Reference", permissions: ["drug_market.read", "drug_market.search"] },
  { href: "/admin/accounts", label: "Users and Roles", icon: "reception", group: "Admin", adminOnly: true },
  { href: "/admin/appearance", label: "Appearance", icon: "settings", group: "Admin", adminOnly: true },
  { href: "/owner-control", label: "Owner Control", icon: "admin", group: "Admin", adminOnly: true },
  { href: "/admin", label: "Admin Home", icon: "admin", group: "Admin", adminOnly: true }
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
