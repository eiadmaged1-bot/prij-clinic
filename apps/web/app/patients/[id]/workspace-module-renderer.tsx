"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import {
  CareAssistPanel,
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
  ObDatingReviewPanel
} from "./patient-components";
import { PatientAllergyList, PatientMedicationList } from "../../../components/medications/MedicationComponents";

type ModuleComponent = ComponentType<Record<string, any>>;
const lazy = (loader: () => Promise<ModuleComponent>) => dynamic(loader, { loading: () => <div className="skeleton" aria-label="Loading patient module" /> });

const Timeline = lazy(() => import("./timeline-components").then((module) => module.Timeline as ModuleComponent));
const DoctorVisitFlow = lazy(() => import("./visit-flow-components").then((module) => module.DoctorVisitFlow as ModuleComponent));
const MedicalPanel = lazy(() => import("./panel-components").then((module) => module.MedicalPanel as ModuleComponent));
const HistorySheetWorkspace = lazy(() => import("./panel-components").then((module) => module.HistorySheetWorkspace as ModuleComponent));
const GynecologyWorkspace = lazy(() => import("./panel-components").then((module) => module.GynecologyWorkspace as ModuleComponent));
const InfertilityWorkspacePanel = lazy(() => import("./panel-components").then((module) => module.InfertilityWorkspacePanel as ModuleComponent));
const MotherBabyWorkspace = lazy(() => import("./pregnancy-components").then((module) => module.MotherBabyWorkspace as ModuleComponent));
const ObgynWorkspace = lazy(() => import("./panel-components").then((module) => module.ObgynWorkspace as ModuleComponent));
const UltrasoundWorkspace = lazy(() => import("./panel-components").then((module) => module.UltrasoundWorkspace as ModuleComponent));
const InvestigationsPanel = lazy(() => import("./panel-components").then((module) => module.InvestigationsPanel as ModuleComponent));
const DocumentsPanel = lazy(() => import("./panel-components").then((module) => module.DocumentsPanel as ModuleComponent));

export const workspaceComponentsRegistry: Record<string, ModuleComponent> = {
  overview: ({ patient, related, timelineItems }) => <Overview patient={patient} related={related} timelineItems={timelineItems} />,
  "case-feed": ({ patient, related, timelineItems }) => <PatientCaseFeed patient={patient} related={related} timelineItems={timelineItems} />,
  timeline: ({ patient, timelineItems, timelineHasMore, loadMoreTimeline }) => <Timeline items={timelineItems} patient={patient} hasMore={timelineHasMore} onLoadMore={loadMoreTimeline} />,
  gynecology: ({ patient, related }) => <GynecologyWorkspace patient={patient} visits={related.gynecology ?? []} />,
  infertility: ({ patient, infertilityWorkspace, clinicalPhases }) => <InfertilityWorkspacePanel patient={patient} workspace={infertilityWorkspace} phases={clinicalPhases} />,
  "mother-baby": ({ related }) => <MotherBabyWorkspace pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} />,
  pregnancy: ({ patient, related }) => <><SmartHistoryOptionChips patient={patient} /><SmartObHistoryTags /><ObDatingReviewPanel patient={patient} pregnancies={related.pregnancy ?? []} /><ObgynWorkspace patient={patient} pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} /></>,
  ultrasound: ({ patient, related }) => <UltrasoundWorkspace patient={patient} pregnancies={related.pregnancy ?? []} reports={related.files ?? []} orders={related.orders ?? []} />,
  "case-boards": ({ patient, related }) => <CaseBoardsPanel patient={patient} related={related} />,
  history: ({ patient, related, submitPatientAction, actionStatus }) => <><MedicalPanel patient={patient} related={related} /><HistorySheetWorkspace related={related} onSubmit={submitPatientAction} status={actionStatus} /><CareAssistPanel patientId={patient.id} historySheetId={String((related.history ?? [])[0]?.id ?? "") || undefined} /></>,
  "doctor-visit": ({ patient, related, requestPatientWorkspaceRefresh, permissions, roles }) => <DoctorVisitFlow patient={patient} related={related} onReload={requestPatientWorkspaceRefresh} permissions={permissions} roles={roles} />,
  "secretary-intake": ({ related }) => <SecretaryIntakePanel rows={related["secretary-intake"] ?? []} />,
  "doctor-note": ({ related }) => <DoctorClinicalNotePanel rows={related["doctor-note"] ?? []} />,
  prescriptions: ({ active, related }) => <RelatedPanel config={active} rows={related.prescriptions ?? []} />,
  investigations: ({ related }) => <InvestigationsPanel related={related} />,
  "follow-up-hints": ({ active, related }) => <RelatedPanel config={active} rows={related["follow-up-hints"] ?? []} />,
  documents: ({ related }) => <DocumentsPanel related={related} />,
  billing: ({ active, related }) => <RelatedPanel config={active} rows={related.billing ?? []} />,
  medications: () => <PatientMedicationList />,
  allergies: () => <PatientAllergyList />,
  "medication-safety": ({ patient }) => <MedicationSafetyWorkspace patientId={patient.id} />,
  "ai-snapshot": ({ patient }) => <SafeAiAssistantPanel patientId={patient.id} />,
  more: ({ setActiveTab }) => <MorePatientSections setActiveTab={setActiveTab} />
};

export function WorkspaceModuleRenderer(props: Record<string, any>) {
  const Component = workspaceComponentsRegistry[props.active.key];
  if (Component) return <Component {...props} />;
  const ignoredKeys = ["overview", "case-feed", "case-boards", "mother-baby", "medical", "history-sheet", "care-assist", "doctor-visit", "clinical", "timeline", "print-packet", "ai-snapshot", "protocol-atlas", "calculators", "pregnancy", "ultrasound", "medications", "allergies", "herbals", "medication-safety", "prescription-safety"];
  return ignoredKeys.includes(props.active.key) ? null : <RelatedPanel config={props.active} rows={props.related[props.active.key] ?? []} />;
}
