export type MouseFirstSection =
  | "Complaint"
  | "History"
  | "OB/GYN history"
  | "Examination"
  | "Investigations"
  | "Plan"
  | "Follow-up";

export type ClinicalChip = {
  label: string;
  section: MouseFirstSection;
  group: string;
  category?: string;
};

export const mouseFirstSections: MouseFirstSection[] = [
  "Complaint",
  "History",
  "OB/GYN history",
  "Examination",
  "Investigations",
  "Plan",
  "Follow-up"
];

export const clinicalChipGroups = [
  "Pregnancy",
  "Gynecology",
  "Infertility",
  "Ultrasound",
  "Post-op",
  "Emergency complaint",
  "Favorites"
];

export const complaintChips: ClinicalChip[] = [
  "Bleeding",
  "Pelvic pain",
  "Discharge",
  "Delayed period",
  "Pregnancy follow-up",
  "Reduced fetal movement",
  "Infertility",
  "PCOS follow-up",
  "Post-op follow-up",
  "Ultrasound review"
].map((label) => ({ label, section: "Complaint", group: label === "Reduced fetal movement" ? "Emergency complaint" : "Gynecology" }));

export const bleedingRelatedChips: ClinicalChip[] = [
  "Early pregnancy",
  "Heavy menstrual bleeding",
  "Intermenstrual bleeding",
  "Postcoital bleeding",
  "Postmenopausal bleeding",
  "With pain",
  "Without pain",
  "Mild",
  "Moderate",
  "Severe",
  "Started today",
  "Started yesterday",
  "Recurrent"
].map((label) => ({ label, section: label.includes("pregnancy") ? "OB/GYN history" : "History", group: "Gynecology", category: "Bleeding" }));

export const durationChips: ClinicalChip[] = ["Today", "Yesterday", "2 days", "1 week", "2 weeks", "1 month"].map((label) => ({
  label,
  section: "History",
  group: "Gynecology",
  category: "Duration"
}));

export const severityChips: ClinicalChip[] = ["Mild", "Moderate", "Severe"].map((label) => ({
  label,
  section: "History",
  group: "Gynecology",
  category: "Severity"
}));

export const normalNegativeFindingChips: ClinicalChip[] = [
  "No bleeding",
  "No pain",
  "No fever",
  "No urinary symptoms",
  "No warning symptoms",
  "General condition stable",
  "No allergy known",
  "No chronic disease known",
  "No current medications"
].map((label) => ({ label, section: label.includes("allergy") || label.includes("medications") ? "History" : "Examination", group: "Favorites", category: "Normal/negative" }));

export const planChips: ClinicalChip[] = [
  "Request CBC",
  "Request urine analysis",
  "Request beta hCG",
  "Review ultrasound report",
  "Book follow-up in 1 week",
  "Safety advice discussed"
].map((label) => ({ label, section: label.startsWith("Request") || label.includes("ultrasound") ? "Investigations" : "Plan", group: "Favorites" }));

export const clinicalChips: ClinicalChip[] = [
  ...complaintChips,
  ...bleedingRelatedChips,
  ...durationChips,
  ...severityChips,
  ...normalNegativeFindingChips,
  ...planChips
];

export const topClinicalChips = clinicalChips.slice(0, 12);

export const currentPregnancyTags = [
  { value: "single_fetus", label: "Single fetus", arabicLabel: "جنين واحد" },
  { value: "twins", label: "Twins", arabicLabel: "توأم" }
];

export const previousHistoryChips = [
  "Previous delivery",
  "No previous delivery",
  "Previous C-section",
  "Previous normal delivery",
  "Previous twins",
  "ولد",
  "بنت",
  "طبيعي",
  "قيصري"
];

export const conceptionMethodChips = ["طبيعي", "تنشيط تبويض", "حقن مجهري ICSI", "غير معروف"];

export const smartClinicalTags = [
  ["#ICSI", "ICSI"],
  ["#IVF", "IVF"],
  ["#Infertility", "Infertility"],
  ["#HighRiskPregnancy", "High-risk pregnancy"],
  ["#PlacentaPrevia", "Placenta previa"],
  ["#PlacentaAccreta", "Placenta accreta"],
  ["#Oncology", "Oncology"],
  ["#Fibroid", "Fibroid"],
  ["#PCOS", "PCOS"],
  ["#Endometriosis", "Endometriosis"],
  ["#RecurrentMiscarriage", "Recurrent miscarriage"],
  ["#GDM", "GDM"],
  ["#Preeclampsia", "Preeclampsia"],
  ["#FGR", "FGR"],
  ["#CurrentTwins", "Current twins"],
  ["#PreviousCS", "Previous C-section"],
  ["#PreviousTwins", "Previous twins"]
] as const;

export const caseBoards = [
  "ICSI Board",
  "Oncology Board",
  "High-Risk Pregnancy Board",
  "Twins Board",
  "Previous C-section Board",
  "Pending Results Board",
  "Fertility Board",
  "Post-op Follow-up Board"
];

export const feedItemTypes = [
  "Visit item",
  "Attachment item",
  "Investigation request",
  "Result uploaded",
  "Result reviewed",
  "Prescription",
  "Follow-up",
  "Consent",
  "Payment/invoice",
  "AI draft approved/rejected"
];

export const resultsReviewInboxItems = [
  "Lab result uploaded",
  "Radiology result uploaded",
  "Ultrasound report pending review",
  "External document needs review",
  "Investigation requested but result missing"
];

export const doctorFavoriteGroups = [
  "Complaints",
  "Exam phrases",
  "Investigations",
  "Plans",
  "Follow-up intervals",
  "Prescription templates",
  "Ultrasound phrases"
];

export const continueLastWorkItems = {
  doctor: ["Continue current visit", "Continue last patient", "Continue draft prescription", "Continue unfinished ultrasound report"],
  receptionist: ["Continue last check-in", "Continue patient registration"]
};

export const openDayChecklist = ["Confirm doctors", "Confirm rooms", "Confirm service prices", "Check backup status", "Check today appointments"];
export const closeDayChecklist = ["Patients completed", "Unpaid invoices", "Cash collected", "Pending results", "Follow-ups booked", "Backup done"];

export const importantPatientBannerItems = ["Allergy", "Pregnant", "High-risk pregnancy", "Outstanding payment", "Needs consent", "Pending result"];

export const guidedStaffHelpItems = [
  "How to add new patient",
  "How to check in returning patient",
  "How to scan QR",
  "How to start doctor visit",
  "How to print packet"
];

export const copyableMessageTemplates = [
  "Appointment reminder",
  "Follow-up reminder",
  "Investigation result ready",
  "Please bring old reports",
  "Payment reminder"
];

export function waitingTimeAlert(waitingMinutes: number) {
  if (waitingMinutes >= 40) return "Patient waiting 40+ minutes";
  if (waitingMinutes >= 20) return "Patient waiting 20+ minutes";
  return "Waiting time normal";
}

export function buildMouseFirstDraftNote(selected: ClinicalChip[], freeText: string) {
  const lines = mouseFirstSections
    .map((section) => {
      const items = selected.filter((chip) => chip.section === section).map((chip) => chip.label);
      return items.length ? `${section}: ${items.join("; ")}` : "";
    })
    .filter(Boolean);
  if (freeText.trim()) lines.push(`Free text: ${freeText.trim()}`);
  return lines.join("\n");
}
