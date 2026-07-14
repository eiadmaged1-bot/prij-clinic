import { workflowRequest } from "./workflow-api";

export type ClinicalTagDefinition = { id: string; code: string; label: string; labelAr?: string | null; category: string; aliasesJson?: string[]; aliasesArJson?: string[] };
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
  historyStatus?: string | null;
  matchingTags?: Array<{ code: string; label: string; date?: string | null; status?: string | null; sourceType?: string; sourceRecordId?: string | null; sourceEncounterId?: string | null; doctorConfirmed?: boolean; notes?: string | null }>;
  matchingMedications?: Array<{ genericName: string; familyName?: string | null; clinicalGroup?: string | null; status?: string | null }>;
  lastVisit?: string | null;
};

export function listClinicalTagDefinitions() {
  return workflowRequest<{ definitions: ClinicalTagDefinition[] }>("/clinical-tags/definitions");
}

export function searchClinicalTagPatients(tag: string, operator = "AND", status = "") {
  const params = new URLSearchParams({ tag, operator });
  if (status) params.set("status", status);
  return workflowRequest<{ patients: ClinicalTagPatient[] }>(`/clinical-tags/patients?${params.toString()}`);
}
