"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import {
  MedicationSafetyWorkspace,
  MorePatientSections,
  Overview,
  PatientCaseFeed,
  RelatedPanel,
  SafeAiAssistantPanel,
  SecretaryIntakePanel,
  DoctorClinicalNotePanel,
  SmartHistoryOptionChips,
  SmartObHistoryTags,
  ObDatingReviewPanel,
  type ClinicalPhase,
  type InfertilityWorkspace,
  type PatientWorkspaceContext,
  type Patient,
  type TabConfig,
  type TimelineItem
} from "./patient-components";
import { PatientMedicationWorkspace } from "../../../components/medications/MedicationComponents";
import { PatientInvestigationPanel, PatientPrescriptionPanel } from "../../../components/patients/PatientClinicalWorkflowPanels";

type WorkspaceModuleProps = {
  active: TabConfig;
  patient: Patient;
  related: Record<string, Record<string, unknown>[]>;
  timelineItems: TimelineItem[];
  timelineHasMore: boolean;
  loadMoreTimeline: () => void;
  infertilityWorkspace: InfertilityWorkspace;
  workspaceContext: PatientWorkspaceContext;
  clinicalPhases: ClinicalPhase[];
  submitPatientAction: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
  actionStatus: string;
  requestPatientWorkspaceRefresh: () => void;
  permissions: string[];
  roles: string[];
  setActiveTab: (tab: string) => void;
};
type ModuleComponent = ComponentType<WorkspaceModuleProps>;
const lazy = <Props extends object>(loader: () => Promise<ComponentType<Props>>) => dynamic<Props>(loader, { loading: () => <div className="skeleton" aria-label="Loading patient module" /> });

const Timeline = lazy(() => import("./timeline-components").then((module) => module.Timeline));
const HistorySheetWorkspace = lazy(() => import("./panel-components").then((module) => module.HistorySheetWorkspace));
const GynecologyWorkspace = lazy(() => import("./panel-components").then((module) => module.GynecologyWorkspace));
const InfertilityWorkspacePanel = lazy(() => import("./panel-components").then((module) => module.InfertilityWorkspacePanel));
const MotherBabyWorkspace = lazy(() => import("./pregnancy-components").then((module) => module.MotherBabyWorkspace));
const PregnancyContextEditor = lazy(() => import("./pregnancy-components").then((module) => module.PregnancyContextEditor));
const ObgynWorkspace = lazy(() => import("./panel-components").then((module) => module.ObgynWorkspace));
const UltrasoundWorkspace = lazy(() => import("./panel-components").then((module) => module.UltrasoundWorkspace));
const InvestigationsPanel = lazy(() => import("./panel-components").then((module) => module.InvestigationsPanel));
const DocumentsPanel = lazy(() => import("./panel-components").then((module) => module.DocumentsPanel));
const ClinicalInputFoundation = lazy(() => import("../../../components/patients/ClinicalInputFoundation").then((module) => module.ClinicalInputFoundation));

export const workspaceComponentsRegistry: Record<string, ModuleComponent> = {
  overview: ({ patient, related, timelineItems, workspaceContext, setActiveTab }) => <Overview patient={patient} related={related} timelineItems={timelineItems} workspaceContext={workspaceContext} onNavigate={setActiveTab} />,
  "case-feed": ({ patient, related, timelineItems }) => <PatientCaseFeed patient={patient} related={related} timelineItems={timelineItems} />,
  timeline: ({ patient, timelineItems, timelineHasMore, loadMoreTimeline }) => <Timeline items={timelineItems} patient={patient} hasMore={timelineHasMore} onLoadMore={loadMoreTimeline} />,
  gynecology: ({ patient, related }) => <GynecologyWorkspace patient={patient} visits={related.gynecology ?? []} />,
  infertility: ({ patient, infertilityWorkspace, clinicalPhases }) => <InfertilityWorkspacePanel patient={patient} workspace={infertilityWorkspace} phases={clinicalPhases} />,
  "mother-baby": ({ related }) => <MotherBabyWorkspace pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} />,
  pregnancy: ({ patient, related, infertilityWorkspace, clinicalPhases }) => <><PregnancyContextEditor patient={patient} pregnancies={related.pregnancy ?? []} /><SmartHistoryOptionChips patient={patient} /><SmartObHistoryTags /><ObDatingReviewPanel patient={patient} pregnancies={related.pregnancy ?? []} /><GynecologyWorkspace patient={patient} visits={related.gynecology ?? []} />{patient.patientType === "INFERTILITY" || (infertilityWorkspace.cycles?.length ?? 0) > 0 ? <InfertilityWorkspacePanel patient={patient} workspace={infertilityWorkspace} phases={clinicalPhases} /> : null}<ObgynWorkspace patient={patient} pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} /></>,
  ultrasound: ({ patient, related, workspaceContext }) => <UltrasoundWorkspace patient={patient} pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} workspaceContext={workspaceContext} />,
  "case-boards": ({ patient, related, setActiveTab }) => <PatientCarePlanWorkspace patient={patient} related={related} onCreate={() => setActiveTab("doctor-visit")} />,
  history: ({ patient, related, submitPatientAction, actionStatus }) => <><SmartHistoryOptionChips patient={patient} /><details className="legacy-history-form filter-drawer"><summary>Structured history form</summary><HistorySheetWorkspace related={related} onSubmit={submitPatientAction} status={actionStatus} /></details></>,
  "doctor-visit": ({ patient }) => (
    <section aria-label="Current visit clinical workspace">
      <ClinicalInputFoundation patient={patient} />
    </section>
  ),
  "secretary-intake": ({ related }) => <SecretaryIntakePanel rows={related["secretary-intake"] ?? []} />,
  "doctor-note": ({ related }) => <DoctorClinicalNotePanel rows={related["doctor-note"] ?? []} />,
  prescriptions: ({ patient, related, permissions, roles }) => <PatientPrescriptionPanel patient={patient} related={related} permissions={permissions} roles={roles} records={related.prescriptions ?? []} />,
  investigations: ({ patient, related, permissions, roles }) => <PatientInvestigationPanel patient={patient} related={related} permissions={permissions} roles={roles}><InvestigationsPanel related={related} /></PatientInvestigationPanel>,
  "follow-up-hints": ({ patient, related, setActiveTab }) => <PatientFollowUpWorkspace patient={patient} rows={related["follow-up-hints"] ?? []} onSchedule={() => setActiveTab("doctor-visit")} />,
  documents: ({ related }) => <DocumentsPanel related={related} />,
  billing: ({ active, related }) => <RelatedPanel config={active} rows={related.billing ?? []} />,
  medications: ({ patient, related }) => <PatientMedicationWorkspace patientId={patient.id} prescriptions={related.prescriptions ?? []} />,
  "medication-safety": ({ patient }) => <MedicationSafetyWorkspace patientId={patient.id} />,
  "ai-snapshot": ({ patient }) => <SafeAiAssistantPanel patientId={patient.id} />,
  more: ({ setActiveTab }) => <MorePatientSections setActiveTab={setActiveTab} />
};

export function WorkspaceModuleRenderer(props: WorkspaceModuleProps) {
  const Component = workspaceComponentsRegistry[props.active.key];
  if (Component) return <Component {...props} />;
  const ignoredKeys = ["overview", "case-feed", "case-boards", "mother-baby", "medical", "history-sheet", "care-assist", "doctor-visit", "clinical", "timeline", "print-packet", "ai-snapshot", "protocol-atlas", "calculators", "pregnancy", "ultrasound", "medications", "allergies", "herbals", "medication-safety", "prescription-safety"];
  return ignoredKeys.includes(props.active.key) ? null : <RelatedPanel config={props.active} rows={props.related[props.active.key] ?? []} />;
}

function PatientCarePlanWorkspace({ related, onCreate }: { patient: Patient; related: Record<string, Record<string, unknown>[]>; onCreate: () => void }) {
  const rows = [...(related.tasks ?? []), ...(related.referrals ?? []), ...(related.orders ?? [])];
  const completed = rows.filter((row) => ["completed", "resolved", "closed"].includes(String(row.status ?? "").toLowerCase()));
  const active = rows.filter((row) => !completed.includes(row));
  const group = (title: string, items: Record<string, unknown>[]) => <section className="panel compact-panel"><h2>{title}</h2>{items.length ? <div className="data-list">{items.slice(0, 4).map((row, index) => <article className="data-row compact" key={String(row.id ?? index)}><strong>{String(row.title ?? row.name ?? row.type ?? "Plan item")}</strong><span>{String(row.status ?? "planned")}</span></article>)}</div> : <p className="empty-state compact smart-empty-state">No patient-specific items in this section.</p>}</section>;
  return <section className="patient-care-plan-workspace"><div className="section-heading"><div><h2>Patient care plan</h2><p className="muted">Only this patient’s recorded goals, actions, monitoring, referrals, and unresolved work appear here.</p></div><button className="button compact" type="button" onClick={onCreate}>+ Create care plan</button></div><div className="module-grid compact-grid">{group("Active plan", active.slice(0, 4))}{group("Planned actions", active.slice(4, 8))}{group("Monitoring and pending items", [...(related.orders ?? []), ...(related.referrals ?? [])])}{group("Completed items", completed)}</div></section>;
}

function PatientFollowUpWorkspace({ rows, onSchedule }: { patient: Patient; rows: Record<string, unknown>[]; onSchedule: () => void }) {
  return <section className="panel patient-follow-up-workspace"><div className="section-heading"><div><h2>Follow-up</h2><p className="muted">Patient-specific appointments, prerequisites, responsibility, and task status.</p></div><button className="button compact" type="button" onClick={onSchedule}>Schedule follow-up</button></div>{rows.length ? <div className="data-list">{rows.slice(0, 6).map((row, index) => <article className="data-row dense" key={String(row.id ?? index)}><strong>{String(row.reason ?? row.title ?? "Follow-up")}</strong><span>{[row.followUpDate ?? row.date, row.visitType, row.status].filter(Boolean).map(String).join(" · ")}</span></article>)}</div> : <div className="empty-state compact smart-empty-state"><button className="button secondary compact" type="button" onClick={onSchedule}>Schedule follow-up</button><span>Add the date, reason, visit type, prerequisites, assignee, and note in the visit workflow.</span></div>}<p className="notice">No reminder or patient notification is implied until its recorded delivery status is available.</p></section>;
}
