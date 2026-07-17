"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import {
  CaseBoardsPanel,
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
  type Patient,
  type TabConfig,
  type TimelineItem
} from "./patient-components";
import { PatientAllergyList, PatientMedicationList } from "../../../components/medications/MedicationComponents";
import { PatientInvestigationPanel, PatientPrescriptionPanel } from "../../../components/patients/PatientClinicalWorkflowPanels";
import { ActiveVisitLauncher } from "../../../components/clinic/ActiveVisitWorkspace";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";

type WorkspaceModuleProps = {
  active: TabConfig;
  patient: Patient;
  related: Record<string, Record<string, unknown>[]>;
  timelineItems: TimelineItem[];
  timelineHasMore: boolean;
  loadMoreTimeline: () => void;
  infertilityWorkspace: InfertilityWorkspace;
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
const ObgynWorkspace = lazy(() => import("./panel-components").then((module) => module.ObgynWorkspace));
const UltrasoundWorkspace = lazy(() => import("./panel-components").then((module) => module.UltrasoundWorkspace));
const InvestigationsPanel = lazy(() => import("./panel-components").then((module) => module.InvestigationsPanel));
const DocumentsPanel = lazy(() => import("./panel-components").then((module) => module.DocumentsPanel));

export const workspaceComponentsRegistry: Record<string, ModuleComponent> = {
  overview: ({ patient, related, timelineItems }) => <Overview patient={patient} related={related} timelineItems={timelineItems} />,
  "case-feed": ({ patient, related, timelineItems }) => <PatientCaseFeed patient={patient} related={related} timelineItems={timelineItems} />,
  timeline: ({ patient, timelineItems, timelineHasMore, loadMoreTimeline }) => <Timeline items={timelineItems} patient={patient} hasMore={timelineHasMore} onLoadMore={loadMoreTimeline} />,
  gynecology: ({ patient, related }) => <GynecologyWorkspace patient={patient} visits={related.gynecology ?? []} />,
  infertility: ({ patient, infertilityWorkspace, clinicalPhases }) => <InfertilityWorkspacePanel patient={patient} workspace={infertilityWorkspace} phases={clinicalPhases} />,
  "mother-baby": ({ related }) => <MotherBabyWorkspace pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} />,
  pregnancy: ({ patient, related, infertilityWorkspace, clinicalPhases }) => <><SmartHistoryOptionChips patient={patient} /><SmartObHistoryTags /><ObDatingReviewPanel patient={patient} pregnancies={related.pregnancy ?? []} /><GynecologyWorkspace patient={patient} visits={related.gynecology ?? []} />{patient.patientType === "INFERTILITY" || (infertilityWorkspace.cycles?.length ?? 0) > 0 ? <InfertilityWorkspacePanel patient={patient} workspace={infertilityWorkspace} phases={clinicalPhases} /> : null}<ObgynWorkspace patient={patient} pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} /></>,
  ultrasound: ({ patient, related }) => <UltrasoundWorkspace patient={patient} pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} />,
  "case-boards": ({ patient, related }) => <CaseBoardsPanel patient={patient} related={related} />,
  history: ({ patient, related, submitPatientAction, actionStatus }) => <><SmartHistoryOptionChips patient={patient} /><details className="legacy-history-form filter-drawer"><summary>Structured history form</summary><HistorySheetWorkspace related={related} onSubmit={submitPatientAction} status={actionStatus} /></details></>,
  "doctor-visit": ({ patient }) => (
    <section className="panel">
      <div className="section-heading">
        <h2>Doctor Visit Workspace</h2>
        <ActiveVisitLauncher patientId={patient.id} className="button"><ThreeDMedicalIcon name="encounter" size="sm" /> Start / Resume Visit</ActiveVisitLauncher>
      </div>
      <p className="muted">The doctor visit workflow has been unified into a dedicated workspace to ensure context safety and provide more screen space for clinical modules.</p>
    </section>
  ),
  "secretary-intake": ({ related }) => <SecretaryIntakePanel rows={related["secretary-intake"] ?? []} />,
  "doctor-note": ({ related }) => <DoctorClinicalNotePanel rows={related["doctor-note"] ?? []} />,
  prescriptions: ({ patient, related, permissions, roles }) => <PatientPrescriptionPanel patient={patient} related={related} permissions={permissions} roles={roles} records={related.prescriptions ?? []} />,
  investigations: ({ patient, related, permissions, roles }) => <PatientInvestigationPanel patient={patient} related={related} permissions={permissions} roles={roles}><InvestigationsPanel related={related} /></PatientInvestigationPanel>,
  "follow-up-hints": ({ active, related }) => <RelatedPanel config={active} rows={related["follow-up-hints"] ?? []} />,
  documents: ({ related }) => <DocumentsPanel related={related} />,
  billing: ({ active, related }) => <RelatedPanel config={active} rows={related.billing ?? []} />,
  medications: ({ patient }) => <PatientMedicationList patientId={patient.id} />,
  allergies: ({ patient }) => <PatientAllergyList patientId={patient.id} />,
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
