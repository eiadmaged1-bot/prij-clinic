import { workflowRequest } from "./workflow-api";

export type ClinicalTagDefinition = { id: string; code: string; label: string; category: string; aliasesJson?: string[] };
export type ClinicalTagPatient = {
  id: string;
  patientId: string;
  patientName: string;
  medicalRecordNumber: string;
  phone?: string | null;
  patientType?: string;
  currentPhase?: { phaseType?: string; title?: string } | null;
  tagLabel: string;
  tagCode: string;
  tagCategory: string;
  sourceType: string;
  tagDate?: string | null;
};

export function listClinicalTagDefinitions() {
  return workflowRequest<{ definitions: ClinicalTagDefinition[] }>("/clinical-tags/definitions");
}

export function searchClinicalTagPatients(tag: string) {
  const params = new URLSearchParams({ tag });
  return workflowRequest<{ patients: ClinicalTagPatient[] }>(`/clinical-tags/patients?${params.toString()}`);
}
