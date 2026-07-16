"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, SafetyAlert } from "@/app/mvp-page";
import { useSession } from "@/app/session";
import { PatientWorkspaceEditor, type WorkspacePanelPlacement } from "@/components/patients/PatientWorkspaceEditor";
import { getApiBaseUrl } from "@/lib/api-base-url";

export default function PatientWorkspaceEditorPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const { user } = useSession();
  const [patientType, setPatientType] = useState("GENERAL");
  const [patientLabel, setPatientLabel] = useState("Patient workspace");
  const [status, setStatus] = useState("Loading patient context…");
  const preview = useCallback((_panels: WorkspacePanelPlacement[]) => undefined, []);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    void fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(patientId)}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).then(async (response) => {
      if (!response.ok) throw new Error("Patient context could not be loaded.");
      const patient = await response.json() as { firstName: string; lastName: string; medicalRecordNumber: string; patientType?: string | null };
      setPatientType(patient.patientType ?? "GENERAL");
      setPatientLabel(`${patient.firstName} ${patient.lastName} · ${patient.medicalRecordNumber}`);
      setStatus("Patient context locked.");
    }).catch((error) => setStatus(error instanceof Error ? error.message : "Patient context could not be loaded."));
  }, [patientId]);

  return <AppShell><section className="page-header workspace-editor-route-header"><p className="eyebrow">Dedicated workspace editor</p><h1>{patientLabel}</h1><p className="muted">{status} Layout changes presentation only and never change clinical records.</p></section><SafetyAlert /><PatientWorkspaceEditor dedicated patientId={patientId} patientType={patientType} permissions={user?.permissions ?? []} roles={user?.roles ?? []} onApply={preview} /></AppShell>;
}
