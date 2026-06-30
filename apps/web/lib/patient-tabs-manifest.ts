import type { IconName } from "../components/ThreeDMedicalIcon";

export type PatientTabConfig = {
  key: string;
  label: string;
  icon: IconName;
  endpoint?: string;
  collectionKey?: string;
  empty: string;
};

export const patientTabsManifest: PatientTabConfig[] = [
  { key: "overview", label: "Summary", icon: "patients", empty: "Start with the patient summary and next best action." },
  { key: "pregnancy", label: "Pregnancy/OB", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet." },
  { key: "gynecology", label: "General Gynecology", icon: "doctor", endpoint: "/gynecology-visits", collectionKey: "gynecologyVisits", empty: "No gynecology visit yet. Start with a recording-only template." },
  { key: "ai-snapshot", label: "AI Snapshot", icon: "ai", empty: "No management snapshot yet. Doctor review is required." },
  { key: "visits", label: "Encounters", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready." },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit." },
  { key: "medications", label: "Medications", icon: "prescription", endpoint: "", empty: "No active medication list entry yet." },
  { key: "allergies", label: "Allergies", icon: "consent", endpoint: "", empty: "No allergy entry yet." },
  { key: "herbals", label: "Herbal/Supplements", icon: "files", endpoint: "", empty: "No herbal or supplement entry yet." },
  { key: "medication-safety", label: "Medication Safety", icon: "ai", empty: "Run a medication safety review when clinically needed." },
  { key: "prescription-safety", label: "Prescription Safety", icon: "prescription", empty: "Prescription safety review appears here." },
  { key: "orders", label: "Investigations", icon: "investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", empty: "No test orders yet. Order lab or radiology when needed." },
  { key: "billing", label: "Billing/Finance", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet. Create one only with demo payment details." },
  { key: "files", label: "Files", icon: "files", endpoint: "/reports", collectionKey: "reports", empty: "No report or attachment record yet. Real clinical file upload is disabled." },
  { key: "timeline", label: "Timeline", icon: "timeline", empty: "The patient story appears here as records are created." },
  { key: "more", label: "More", icon: "settings", empty: "Additional safe sections for ultrasound, consents, and AI draft review." }
];
