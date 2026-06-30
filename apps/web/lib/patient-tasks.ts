import { workflowRequest } from "./workflow-api";

export function listPatientTasks(patientId: string) {
  return workflowRequest<{ patientTasks: WorkflowRecord[] }>(`/patients/${patientId}/tasks`);
}

export function createPatientTask(input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>("/patient-tasks", { method: "POST", body: JSON.stringify(input) });
}

export function updatePatientTask(id: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/patient-tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function completePatientTask(id: string, input: Record<string, unknown> = {}) {
  return workflowRequest<WorkflowRecord>(`/patient-tasks/${id}/complete`, { method: "POST", body: JSON.stringify(input) });
}

export function cancelPatientTask(id: string, input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>(`/patient-tasks/${id}/cancel`, { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; title?: string; status?: string };
