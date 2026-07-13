import { workflowRequest } from "./workflow-api";

export type ExternalIntakeSubmission = {
  id: string;
  source: string;
  language: string;
  submittedAt?: string | null;
  receivedAt: string;
  status: string;
  mappedPatientJson?: Record<string, unknown> | null;
  mappedCaseTypeJson?: Record<string, unknown> | null;
  duplicateCandidatesJson?: Array<Record<string, unknown>> | null;
  reviewReason?: string | null;
};

export function listExternalIntake(status = "pending_review") {
  const params = new URLSearchParams({ status });
  return workflowRequest<{ submissions: ExternalIntakeSubmission[] }>(`/external-intake?${params.toString()}`);
}

export function createPatientFromSubmission(id: string, reviewReason: string, createInitialPhase: boolean) {
  return workflowRequest(`/external-intake/${id}/create-patient`, {
    method: "POST",
    body: JSON.stringify({ reviewReason, createInitialPhase })
  });
}

export function attachSubmissionToPatient(id: string, patientId: string, reviewReason: string) {
  return workflowRequest(`/external-intake/${id}/attach`, {
    method: "POST",
    body: JSON.stringify({ patientId, reviewReason, selectedFields: { noBlindOverwrite: true } })
  });
}

export function rejectExternalSubmission(id: string, reason: string) {
  return workflowRequest(`/external-intake/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export function requestExternalIntakeCorrection(id: string, reason: string) {
  return workflowRequest(`/external-intake/${id}/request-correction`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}
