import { workflowRequest } from "./workflow-api";

export function listConsentTemplates() {
  return workflowRequest<{ consentTemplates: WorkflowRecord[] }>("/consent-templates");
}

export function createConsentTemplate(input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>("/consent-templates", { method: "POST", body: JSON.stringify(input) });
}

export function updateConsentTemplate(id: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/consent-templates/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function signConsentDemo(consentId: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/consents/${consentId}/sign-demo`, { method: "POST", body: JSON.stringify(input) });
}

export function reviewConsentRecord(consentId: string, input: Record<string, unknown> = {}) {
  return workflowRequest<WorkflowRecord>(`/consents/${consentId}/review`, { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; title?: string; code?: string };
