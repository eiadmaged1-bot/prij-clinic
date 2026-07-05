import { workflowRequest } from "./workflow-api";

export type AiSafetyStatus = {
  externalAiEnabled: boolean;
  modelProvider: string;
  modelName: string;
  clinicalOutputMode: string;
  doctorReviewRequired: boolean;
  autonomousDiagnosis: boolean;
  autonomousPrescribing: boolean;
  autonomousDosing: boolean;
  patientDataExternalSharing: boolean;
  promptInjectionGuard: string;
};

export type AiChecklistItem = {
  key: string;
  label: string;
  status: string;
  note: string;
};

export type AiAssistantState = {
  patientId: string;
  safetyStatus: AiSafetyStatus;
  availableDrafts: Array<{ kind: string; label: string }>;
  missingFieldChecklist: AiChecklistItem[];
  draftLabel: string;
};

export type AiDraft = {
  id: string;
  draftType: string;
  status: string;
  patientId?: string | null;
  encounterId?: string | null;
  inputSourceSummary?: string | null;
  generatedText: string;
  modelProvider: string;
  modelName: string;
  promptVersion?: string | null;
  createdAt?: string;
};

export type AiSearchResult = {
  section: string;
  label: string;
  status?: string | null;
  summary: string;
  date?: string | null;
};

export function getAiSafetyStatus() {
  return workflowRequest<AiSafetyStatus>("/ai-drafts/safety-status");
}

export function getPatientAiAssistant(patientId: string) {
  return workflowRequest<AiAssistantState>(`/ai-drafts/patients/${encodeURIComponent(patientId)}/assistant`);
}

export function generatePatientAiDraft(patientId: string, draftKind: string, encounterId?: string) {
  return workflowRequest<AiDraft>(`/ai-drafts/patients/${encodeURIComponent(patientId)}/generate`, {
    method: "POST",
    body: JSON.stringify({ draftKind, encounterId: encounterId || undefined })
  });
}

export function reviewAiDraft(draftId: string, status: string, reviewNote?: string) {
  return workflowRequest<AiDraft>(`/ai-drafts/${encodeURIComponent(draftId)}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status, reviewNote })
  });
}

export function searchPatientAiFile(patientId: string, query: string) {
  return workflowRequest<{ patientId: string; patientScoped: boolean; externalAiAccess: boolean; results: AiSearchResult[] }>(
    `/ai-drafts/patients/${encodeURIComponent(patientId)}/search`,
    { method: "POST", body: JSON.stringify({ query }) }
  );
}
