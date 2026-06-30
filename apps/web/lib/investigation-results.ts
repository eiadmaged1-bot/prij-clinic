import { workflowRequest } from "./workflow-api";

export function listPatientInvestigationResults(patientId: string) {
  return workflowRequest<{ investigationResults: WorkflowRecord[] }>(`/patients/${patientId}/investigation-results`);
}

export function createInvestigationResult(input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>("/investigation-results", { method: "POST", body: JSON.stringify(input) });
}

export function reviewInvestigationResult(id: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/investigation-results/${id}/review`, { method: "POST", body: JSON.stringify(input) });
}

export function voidInvestigationResult(id: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/investigation-results/${id}/void`, { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; title?: string; status?: string; reviewStatus?: string };
