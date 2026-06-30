import { workflowRequest } from "./workflow-api";

export function listPatientInternalNotes(patientId: string) {
  return workflowRequest<{ patientInternalNotes: WorkflowRecord[] }>(`/patients/${patientId}/internal-notes`);
}

export function createPatientInternalNote(patientId: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/patients/${patientId}/internal-notes`, { method: "POST", body: JSON.stringify(input) });
}

export function archivePatientInternalNote(patientId: string, noteId: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/patients/${patientId}/internal-notes/${noteId}/archive`, { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; title?: string; visibility?: string };
