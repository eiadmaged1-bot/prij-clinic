import { workflowRequest } from "./workflow-api";

export function listExternalProviders() {
  return workflowRequest<{ externalProviders: WorkflowRecord[] }>("/external-providers");
}

export function createExternalProvider(input: Record<string, unknown>) {
  return workflowRequest<WorkflowRecord>("/external-providers", { method: "POST", body: JSON.stringify(input) });
}

export type WorkflowRecord = Record<string, unknown> & { id: string; name?: string };
