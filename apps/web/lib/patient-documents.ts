import { workflowRequest } from "./workflow-api";

export function listPatientDocuments(patientId: string) {
  return workflowRequest<{ patientDocuments: WorkflowRecord[] }>(`/patients/${patientId}/documents`);
}

export function createPatientDocument(patientId: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/patients/${patientId}/documents`, { method: "POST", body: JSON.stringify(input) });
}

export function reviewPatientDocument(patientId: string, documentId: string, input: Record<string, unknown> = {}) {
  return workflowRequest<WorkflowRecord>(`/patients/${patientId}/documents/${documentId}/review`, { method: "POST", body: JSON.stringify(input) });
}

export function archivePatientDocument(patientId: string, documentId: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/patients/${patientId}/documents/${documentId}/archive`, { method: "POST", body: JSON.stringify(input) });
}

export function voidPatientDocument(patientId: string, documentId: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/patients/${patientId}/documents/${documentId}/void`, { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; title?: string; status?: string };
