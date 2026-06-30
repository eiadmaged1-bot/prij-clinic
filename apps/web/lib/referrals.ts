import { workflowRequest } from "./workflow-api";

export function listReferrals(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return workflowRequest<{ referrals: WorkflowRecord[] }>(`/referrals${query ? `?${query}` : ""}`);
}

export function listPatientReferrals(patientId: string) {
  return workflowRequest<{ referrals: WorkflowRecord[] }>(`/patients/${patientId}/referrals`);
}

export function createReferral(input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>("/referrals", { method: "POST", body: JSON.stringify(input) });
}

export function closeReferral(id: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/referrals/${id}/close`, { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; reason?: string; status?: string };
