import { workflowRequest } from "./workflow-api";

export function listClinicDepartments() {
  return workflowRequest<{ clinicDepartments: WorkflowRecord[] }>("/clinic-departments");
}

export function createClinicDepartment(input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>("/clinic-departments", { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; name?: string; code?: string };
