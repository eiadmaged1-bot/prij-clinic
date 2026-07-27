import type { LongitudinalComplaint } from "./complaint-lifecycle";

export const appName = "Dr Maged Attia Clinics";
export * from "./permissions";
export * from "./app-actions";
export * from "./complaint-lifecycle";
export * from "./pregnancy-dating";

export type PatientWorkspaceSummary = {
  patient: { id: string; displayName: string; medicalRecordNumber: string; dateOfBirth: string | null; yearOfBirth: number | null; ageSummary: string | null; contactSummary: string | null; patientType: string };
  activeClinicalPhase: { phaseType: string; title: string } | null;
  todayAppointment: { id: string; startAt: string; status: string; appointmentType: string | null } | null;
  currentQueueTicket: { id: string; queueNumber: number; status: string; priority: string; visitType: string } | null;
  activeVisit: { id: string; status: string; startedAt: string | null; createdAt: string } | null;
  allergyReviewState?: "recorded" | "review_required";
  medicationReconciliationState?: "recorded" | "review_required";
  pendingResultCount?: number;
  pendingFollowUp: { id: string; status: string; dueAt: string | null } | null;
  balanceState?: { status: string; hasBalance: boolean };
  lastClinicalEvent?: { type: "encounter"; occurredAt: string; status: string } | null;
  nextAppointment: { id: string; startAt: string; status: string; appointmentType: string | null } | null;
  availableActions: string[];
  complaints?: LongitudinalComplaint[];
};
