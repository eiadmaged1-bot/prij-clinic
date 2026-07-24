"use client";

import Link from "next/link";
import { Action, hasAnyRolePermission } from "@prij-clinic/shared";
import { ActiveVisitLauncher } from "@/components/clinic/ActiveVisitWorkspace";
import { ThreeDMedicalIcon } from "@/components/ThreeDMedicalIcon";

type Patient = { id: string };
type Row = Record<string, unknown>;

export function PatientPrescriptionPanel({ patient, related, permissions, roles, records }: { patient: Patient; related: Record<string, Row[]>; permissions: string[]; roles: string[]; records: Row[] }) {
  const encounter = activeEncounter(related.visits ?? []);
  const canCreate = permissions.includes("prescription.create") || hasAnyRolePermission(roles, Action.PRESCRIPTION_DRAFT_CREATE);

  return (
    <section className="panel compact-panel patient-clinical-workflow-panel">
      <div className="section-heading">
        <div><h2>Prescriptions</h2><p className="muted">Patient context is locked before a clinical prescription can be drafted.</p></div>
        {canCreate && encounter ? <Link className="button compact" href={`/prescriptions?patientId=${patient.id}&encounterId=${String(encounter.id)}`}><ThreeDMedicalIcon name="prescription" size="sm" />New prescription</Link> : null}
      </div>
      {canCreate && !encounter ? <div className="notice"><span>Start or resume a visit before prescribing.</span><ActiveVisitLauncher className="button compact" patientId={patient.id}>Start / resume visit</ActiveVisitLauncher></div> : null}
      <ClinicalRecordList rows={records} empty="No patient-linked prescriptions yet." />
    </section>
  );
}

export function PatientInvestigationPanel({ patient, related, permissions, roles, children }: { patient: Patient; related: Record<string, Row[]>; permissions: string[]; roles: string[]; children: React.ReactNode }) {
  const encounter = activeEncounter(related.visits ?? []);
  const canCreate = permissions.includes("investigation.create") || permissions.includes("clinical_requests.write") || hasAnyRolePermission(roles, Action.INVESTIGATION_REQUEST);

  return (
    <section className="patient-clinical-workflow-panel">
      <div className="panel compact-panel section-heading">
        <div><h2>Investigations & results</h2><p className="muted">Requests inherit this patient and the active visit.</p></div>
        {canCreate && encounter ? <Link className="button compact" href={`/investigations?patientId=${patient.id}&encounterId=${String(encounter.id)}`}><ThreeDMedicalIcon name="investigations" size="sm" />New request</Link> : null}
        {canCreate && !encounter ? <span className="badge warning">Active visit required to add</span> : null}
      </div>
      {children}
    </section>
  );
}

function activeEncounter(encounters: Row[]) {
  return encounters.find((encounter) => ["draft", "in_progress"].includes(String(encounter.status ?? "").toLowerCase()));
}

function ClinicalRecordList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <p className="empty-state compact smart-empty-state">{empty}</p>;
  return <div className="data-list">{rows.slice(0, 12).map((row, index) => <article className="data-row dense" key={String(row.id ?? index)}><div className="data-row-header"><strong>{String(row.status ?? "Draft")}</strong><span className="badge">{Array.isArray(row.items) ? `${row.items.length} medication(s)` : "Prescription"}</span></div><span className="muted">Doctor review and signature status remain visible in the clinical record.</span></article>)}</div>;
}
