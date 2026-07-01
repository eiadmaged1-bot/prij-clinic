import type { IconName } from "../components/ThreeDMedicalIcon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  group: "Dashboard" | "Patients" | "Doctor workflow" | "Reception queue" | "Calendar" | "Finance" | "Orders" | "Medications" | "Admin / Owner Control";
  permissions?: string[];
  roles?: string[];
  adminOnly?: boolean;
};

export const navigationRegistry: NavItem[] = [
  { href: "/dashboard", label: "Clinic Home", icon: "dashboard", group: "Dashboard" },
  { href: "/patients", label: "Patient Files", icon: "patients", group: "Patients" },
  { href: "/patients/new", label: "New Patient", icon: "patients", group: "Patients" },
  { href: "/doctor", label: "Doctor Workspace", icon: "doctor", group: "Doctor workflow", permissions: ["encounter.read", "encounter.create"] },
  { href: "/doctor/visit", label: "Guided Visit", icon: "encounter", group: "Doctor workflow", permissions: ["encounter.create", "encounter.read"] },
  { href: "/queue", label: "Queue Board", icon: "queue", group: "Reception queue", permissions: ["queue.read"] },
  { href: "/appointments", label: "Appointment Desk", icon: "calendar", group: "Reception queue", permissions: ["appointment.read", "appointments.read"] },
  { href: "/calendar", label: "Clinic Calendar", icon: "calendar", group: "Calendar", permissions: ["appointment.read", "appointments.read"] },
  { href: "/orders", label: "Orders", icon: "investigations", group: "Orders", permissions: ["investigation.read"] },
  { href: "/investigations", label: "Investigations", icon: "investigations", group: "Orders", permissions: ["investigation.read"] },
  { href: "/reports", label: "Reports", icon: "reports", group: "Orders", permissions: ["report.read"] },
  { href: "/billing", label: "Billing", icon: "billing", group: "Finance", roles: ["Owner", "Admin", "Accountant"], permissions: ["billing.read", "billing.manage", "billing.report"] },
  { href: "/finance", label: "Finance Home", icon: "billing", group: "Finance", roles: ["Owner", "Admin", "Accountant"], permissions: ["billing.read", "billing.manage", "billing.report"] },
  { href: "/medications", label: "Medication Reference", icon: "prescription", group: "Medications", permissions: ["medications.read", "medications.search"] },
  { href: "/drug-market", label: "Medicine Data", icon: "prescription", group: "Medications", permissions: ["drug_market.read", "drug_market.search"] },
  { href: "/prescriptions", label: "Prescriptions", icon: "prescription", group: "Doctor workflow", permissions: ["prescription.read"] },
  { href: "/encounters", label: "Encounters", icon: "encounter", group: "Doctor workflow", permissions: ["encounter.read"] },
  { href: "/pregnancies", label: "Pregnancy", icon: "pregnancy", group: "Doctor workflow", permissions: ["pregnancy.read", "pregnancy.manage"] },
  { href: "/ultrasound", label: "Ultrasound", icon: "ultrasound", group: "Doctor workflow", permissions: ["ob_ultrasound.read", "ob_ultrasound.manage"] },
  { href: "/protocol-atlas", label: "Protocols", icon: "ai", group: "Doctor workflow", permissions: ["protocol_atlas.read", "ai_management.read"] },
  { href: "/guidelines", label: "Guidelines", icon: "reports", group: "Doctor workflow", permissions: ["guidelines.read", "guidelines.search"] },
  { href: "/calculators", label: "Calculators", icon: "investigations", group: "Doctor workflow", permissions: ["calculator.read", "calculator.calculate"] },
  { href: "/consents", label: "Consents", icon: "consent", group: "Patients", permissions: ["patient.consent_read", "patient.consent_manage"] },
  { href: "/documents", label: "Documents", icon: "files", group: "Patients", permissions: ["patient_document.read"] },
  { href: "/referrals", label: "Referrals", icon: "reports", group: "Patients", permissions: ["referral.read"] },
  { href: "/tasks", label: "Tasks", icon: "queue", group: "Patients", permissions: ["patient_task.read"] },
  { href: "/ai-drafts", label: "AI Draft Review", icon: "ai", group: "Doctor workflow", permissions: ["ai_draft.read", "ai_draft.review", "ai_management.read"] },
  { href: "/admin", label: "Owner Control", icon: "admin", group: "Admin / Owner Control", adminOnly: true },
  { href: "/owner-control", label: "Owner Home", icon: "admin", group: "Admin / Owner Control", adminOnly: true },
  { href: "/admin/appearance", label: "Appearance", icon: "settings", group: "Admin / Owner Control", adminOnly: true },
  { href: "/admin/accounts", label: "Users and Roles", icon: "reception", group: "Admin / Owner Control", adminOnly: true },
  { href: "/admin/medications", label: "Medication Ops", icon: "prescription", group: "Admin / Owner Control", adminOnly: true },
  { href: "/admin/drug-market/review-queue", label: "Medication Review", icon: "prescription", group: "Admin / Owner Control", adminOnly: true }
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
