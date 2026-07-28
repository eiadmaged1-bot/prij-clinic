"use client";

/*
THESIS: One calm, continuous visit surface keeps identity, progress, documentation, context, and sync truth in view.
OWN-WORLD: Prij's clinic-green operational language is compressed into a purpose-built encounter cockpit, not a generic dashboard.
STORY: Confirm the patient, document through seven canonical stages, consult longitudinal context, resolve Review issues, then sign once.
FIRST VIEWPORT: Identity/safety, all seven stages, the active editor, context pane, and persistent save state are visible on desktop.
FORM: A compact three-column clinical instrument with restrained borders, warm-ivory ground, logical spacing, and responsive collapse.
*/

import { useEffect, useRef, type KeyboardEvent } from "react";
import InvestigationStationV3 from "@/components/investigations/InvestigationStationV3";
import { useI18n } from "@/i18n/useI18n";
import type { DoctorWorkspaceMode } from "@/lib/interface-mode";
import { encounterStages, type EncounterStageKey, type EncounterWorkspaceController } from "./SharedEncounterWorkspaceController";
import styles from "./visit-cockpit.module.css";

export function VisitCockpitWorkspace({ controller, modeError, onModeChange }: { controller: EncounterWorkspaceController; modeError: string; onModeChange: (mode: DoctorWorkspaceMode) => Promise<void> }) {
  const { language } = useI18n();
  const rtl = language === "ar";
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const patient = controller.patient;
  const encounter = controller.encounter;
  const { activeStage, isReadOnly, refreshReadiness } = controller;

  useEffect(() => {
    if (activeStage === "review" && !isReadOnly) void refreshReadiness();
  }, [activeStage, isReadOnly, refreshReadiness]);

  if (controller.loadState === "loading") return <main className={styles.statePanel} aria-busy="true"><h1>Visit Cockpit</h1><p>Loading the encounter and longitudinal resources...</p></main>;
  if (controller.loadState === "authentication-failed") return <WorkspaceFailure title="Session expired" detail="Sign in again before continuing this encounter." />;
  if (controller.loadState === "access-denied") return <WorkspaceFailure title="Access denied" detail="You do not have access to this encounter." />;
  if (controller.loadState === "resource-failed") return <WorkspaceFailure title="Clinical resources unavailable" detail={controller.resourceError ?? "The encounter packet could not be loaded."} retry={controller.reload} />;
  if (!patient || !encounter) return <WorkspaceFailure title="Encounter unavailable" detail="Patient and encounter identity could not be verified." retry={controller.reload} />;

  function moveStage(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = encounterStages.length - 1;
    else if (event.key === "ArrowRight") next = index + (rtl ? -1 : 1);
    else if (event.key === "ArrowLeft") next = index + (rtl ? 1 : -1);
    else return;
    event.preventDefault();
    next = Math.max(0, Math.min(encounterStages.length - 1, next));
    controller.setActiveStage(encounterStages[next]!.key);
    tabsRef.current[next]?.focus();
  }

  const dateOfBirth = String(patient.dateOfBirth ?? "");
  const age = dateOfBirth ? ageFromDate(dateOfBirth) : null;
  const pregnancy = record(controller.visit?.pregnancyEpisode);
  const infertility = record(controller.visit?.infertilityEpisode);
  const allergies = array(patient.allergies);
  const risks = array(patient.risks ?? patient.importantRisks);
  const signature = record(encounter.doctorSignature);

  return <main className={styles.cockpit} dir={rtl ? "rtl" : "ltr"} aria-labelledby="cockpit-title">
    <header className={styles.identityBar}>
      <div className={styles.identityPrimary}>
        <p className={styles.eyebrow}>Visit Cockpit · {String(encounter.status ?? "draft")}</p>
        <h1 id="cockpit-title">{String(patient.name ?? "Patient")}</h1>
        <p><strong>MRN {String(patient.medicalRecordNumber ?? "not recorded")}</strong> · {age !== null ? `${age} years` : `DOB ${dateOfBirth || "not recorded"}`} · {humanize(String(patient.patientType ?? "general"))}</p>
      </div>
      <div className={styles.safetyFacts} aria-label="Patient safety context">
        <SafetyFact label="Allergies" value={allergies.length ? allergies.map(displayValue).join(", ") : "Not available in visit packet"} warning={allergies.length > 0} />
        <SafetyFact label="Important risks" value={risks.length ? risks.map(displayValue).join(", ") : "No risk data supplied in visit packet"} warning={risks.length > 0} />
        {pregnancy ? <SafetyFact label="Pregnancy context" value={pregnancyContext(pregnancy)} /> : null}
        {infertility ? <SafetyFact label="Fertility context" value={String(infertility.status ?? "Active episode")} /> : null}
      </div>
      <div className={styles.encounterFacts}>
        <span>{String(signature?.doctorName ?? "Doctor")}</span>
        <span>{String(patient.branchName ?? encounter.branchName ?? "Current branch")}</span>
        <button className={styles.modeButton} type="button" onClick={() => void onModeChange("CLASSIC")}>Classic Workspace</button>
      </div>
    </header>

    {modeError ? <p className={styles.errorBanner} role="alert">{modeError}</p> : null}
    {controller.resourceErrors.length ? <section className={styles.resourceWarning} role="status"><strong>Some longitudinal resources did not load.</strong><span>{controller.resourceErrors.map((error) => error.resource).join(", ")}</span><button type="button" onClick={() => void controller.reload()}>Retry resources</button></section> : null}
    <p className="sr-only" aria-live="polite">{controller.announce}</p>

    <nav className={styles.stageRail} aria-label={rtl ? "مراحل الزيارة" : "Visit stages"} role="tablist">
      {encounterStages.map((stage, index) => {
        const state = stageState(stage.key, controller);
        return <button
          aria-controls={`cockpit-panel-${stage.key}`}
          aria-selected={controller.activeStage === stage.key}
          className={`${styles.stage} ${controller.activeStage === stage.key ? styles.activeStage : ""}`}
          id={`cockpit-tab-${stage.key}`}
          key={stage.key}
          onClick={() => controller.setActiveStage(stage.key)}
          onKeyDown={(event) => moveStage(event, index)}
          ref={(element) => { tabsRef.current[index] = element; }}
          role="tab"
          tabIndex={controller.activeStage === stage.key ? 0 : -1}
          type="button"
        >
          <span className={styles.stageNumber}>{index + 1}</span>
          <span>{rtl ? stage.ar : stage.label}<small>{state.label}</small></span>
          <span className={`${styles.stageState} ${styles[state.tone]}`} aria-hidden="true">{state.icon}</span>
        </button>;
      })}
    </nav>

    <div className={styles.workspaceGrid}>
      <section className={styles.editor} aria-labelledby={`cockpit-tab-${controller.activeStage}`} id={`cockpit-panel-${controller.activeStage}`} role="tabpanel">
        <StageEditor controller={controller} />
      </section>
      <aside className={styles.contextPane} aria-labelledby="context-pane-heading">
        <ContextPane controller={controller} />
      </aside>
    </div>

    <footer className={`${styles.syncBar} ${styles[controller.saveState]}`}>
      <div><strong>{controller.saveMessage}</strong><span>{controller.lastSavedRevision ? `Last server version ${formatTime(controller.lastSavedRevision)}` : "Waiting for server version"}</span></div>
      {controller.saveState === "failed" || controller.saveState === "waiting-sync" ? <button type="button" onClick={() => void controller.save()}>Retry save</button> : null}
      {controller.saveState === "conflict" ? <button type="button" onClick={() => void controller.reload()}>Reload server version</button> : null}
      {!controller.isReadOnly && controller.activeStage !== "review" ? <button type="button" onClick={() => controller.setActiveStage("review")}>Go to Review</button> : null}
    </footer>
  </main>;
}

function StageEditor({ controller }: { controller: EncounterWorkspaceController }) {
  const stage = controller.activeStage;
  const draft = controller.draft;
  const readOnly = controller.isReadOnly;
  if (stage === "patient-context") return <Stage title="Patient Context" description="Confirm identity and relevant episode context before documenting."><PatientContext controller={controller} /></Stage>;
  if (stage === "history") return <Stage title="History" description="Document the presenting concern and relevant history."><fieldset disabled={readOnly} className={styles.fieldset}><label>Presenting complaint<input aria-describedby="complaint-help" value={draft.chiefComplaint} onChange={(event) => controller.updateDraft({ chiefComplaint: event.target.value })} /></label><small id="complaint-help">Required by the existing encounter completion contract.</small><label>History notes<textarea value={draft.historyText} onChange={(event) => controller.updateDraft({ historyText: event.target.value })} /></label><StructuredSummary value={draft.examinationJson} kind="history" /></fieldset></Stage>;
  if (stage === "examination") return <Stage title="Examination" description="Record relevant findings; structured findings already captured remain attached."><fieldset disabled={readOnly} className={styles.fieldset}><label>Examination notes<textarea value={draft.examText} onChange={(event) => controller.updateDraft({ examText: event.target.value })} /></label><StructuredSummary value={draft.examinationJson} kind="examination" /></fieldset></Stage>;
  if (stage === "assessment") return <Stage title="Assessment" description="Record the doctor’s assessment for this encounter."><fieldset disabled={readOnly} className={styles.fieldset}><label>Assessment<textarea value={draft.assessmentText} onChange={(event) => controller.updateDraft({ assessmentText: event.target.value })} /></label></fieldset></Stage>;
  if (stage === "investigations") return <Stage title="Investigations" description="Create and review requests within the locked patient and encounter context."><InvestigationStationV3 lockedPatientId={controller.patientId} lockedEncounterId={controller.encounterId} embedded onSaved={() => void controller.reload()} /></Stage>;
  if (stage === "plan") return <Stage title="Plan" description="Document the plan and review linked prescriptions and follow-up actions."><fieldset disabled={readOnly} className={styles.fieldset}><label>Plan notes<textarea value={draft.planText} onChange={(event) => controller.updateDraft({ planText: event.target.value })} /></label></fieldset><LinkedCounts controller={controller} /></Stage>;
  return <ReviewStage controller={controller} />;
}

function ReviewStage({ controller }: { controller: EncounterWorkspaceController }) {
  const blocking = controller.readiness?.issues.filter((issue) => issue.severity === "blocking") ?? [];
  const warnings = controller.readiness?.issues.filter((issue) => issue.severity === "warning") ?? [];
  const canFinish = Boolean(controller.readiness?.ready && controller.saveState === "saved" && !controller.readinessLoading && !controller.isReadOnly);
  return <Stage title="Review" description="The server independently checks readiness before the encounter can be signed.">
    {controller.isReadOnly ? <p className={styles.completedNotice}>Completed encounter · read-only</p> : null}
    {controller.readinessLoading ? <p aria-live="polite">Checking readiness...</p> : null}
    {blocking.length ? <section className={styles.blocking} role="alert"><h3>Blocking issues</h3><ul>{blocking.map((issue) => <li key={issue.code}><strong>{humanize(issue.section)}:</strong> {issue.message}</li>)}</ul></section> : null}
    {warnings.length ? <section className={styles.warning}><h3>Review warnings</h3><ul>{warnings.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul></section> : null}
    <div className={styles.reviewSummary}>
      <SummaryItem label="Presenting complaint" value={controller.draft.chiefComplaint} />
      <SummaryItem label="History" value={controller.draft.historyText} />
      <SummaryItem label="Examination" value={controller.draft.examText} />
      <SummaryItem label="Assessment" value={controller.draft.assessmentText} />
      <SummaryItem label="Plan" value={controller.draft.planText} />
    </div>
    {!controller.isReadOnly ? <div className={styles.reviewActions}><button type="button" onClick={() => void controller.refreshReadiness()}>Recheck readiness</button><button className={styles.finishButton} disabled={!canFinish} type="button" onClick={() => void controller.finish()}>Sign and finish encounter</button></div> : null}
  </Stage>;
}

function ContextPane({ controller }: { controller: EncounterWorkspaceController }) {
  const visit = controller.visit;
  const stage = controller.activeStage;
  const historySheet = record(visit?.historySheet);
  const investigationHistory = array(historySheet?.investigationHistoryItems);
  const procedures = array(historySheet?.operationHistoryItems);
  const groups = stage === "investigations"
    ? [{ title: "Investigation requests and results", rows: [...(visit?.investigationOrders ?? []), ...investigationHistory], resources: ["investigations", "history"] }, { title: "Ultrasound history", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }, { title: "Previous encounters", rows: visit?.recentEncounters ?? [], resources: ["recent-encounters"] }]
    : stage === "plan"
      ? [{ title: "Current medications / prescriptions", rows: visit?.prescriptions ?? [], resources: ["prescriptions"] }, { title: "Procedures and follow-up", rows: [...(visit?.followUps ?? []), ...procedures], resources: ["follow-up", "history"] }, { title: "Ultrasound history", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }]
      : [{ title: "Previous encounters", rows: visit?.recentEncounters ?? [], resources: ["recent-encounters"] }, { title: "Current medications / prescriptions", rows: visit?.prescriptions ?? [], resources: ["prescriptions"] }, { title: "Investigations and results", rows: [...(visit?.investigationOrders ?? []), ...investigationHistory], resources: ["investigations", "history"] }, { title: "Ultrasound history", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }];
  const failedResources = new Set(controller.resourceErrors.map((error) => error.resource));
  return <><div className={styles.contextHeading}><p className={styles.eyebrow}>Longitudinal context</p><h2 id="context-pane-heading">Relevant to {encounterStages.find((item) => item.key === stage)?.label}</h2></div>{groups.map((group) => <ContextGroup failed={group.resources.some((resource) => failedResources.has(resource))} key={group.title} title={group.title} rows={group.rows} />)}</>;
}

function ContextGroup({ title, rows, failed }: { title: string; rows: Record<string, unknown>[]; failed: boolean }) {
  return <section className={styles.contextGroup}><h3>{title}<span>{failed ? "Error" : rows.length}</span></h3>{failed ? <p className={styles.resourceError} role="alert">This resource is unavailable. Retry before interpreting this as no history.</p> : rows.length ? <ul>{rows.slice(0, 6).map((row, index) => <li key={String(row.id ?? index)}><strong>{displayValue(row.title ?? row.name ?? row.chiefComplaint ?? row.status ?? "Record")}</strong><small>{displayValue(row.createdAt ?? row.orderedAt ?? row.dueAt ?? "")}</small></li>)}</ul> : <p className={styles.empty}>No records returned.</p>}</section>;
}

function PatientContext({ controller }: { controller: EncounterWorkspaceController }) {
  const pregnancy = record(controller.visit?.pregnancyEpisode);
  const infertility = record(controller.visit?.infertilityEpisode);
  return <dl className={styles.contextFacts}><div><dt>Encounter</dt><dd>{String(controller.encounter?.status ?? "draft")}</dd></div><div><dt>Patient type</dt><dd>{humanize(String(controller.patient?.patientType ?? "general"))}</dd></div><div><dt>Pregnancy episode</dt><dd>{pregnancy ? pregnancyContext(pregnancy) : "No active episode returned"}</dd></div><div><dt>Fertility episode</dt><dd>{infertility ? String(infertility.status ?? "Active") : "No active episode returned"}</dd></div></dl>;
}

function LinkedCounts({ controller }: { controller: EncounterWorkspaceController }) {
  return <div className={styles.linkedCounts}><span><strong>{controller.visit?.prescriptions?.length ?? 0}</strong> prescriptions</span><span><strong>{controller.visit?.followUps?.length ?? 0}</strong> follow-up actions</span><span><strong>{controller.visit?.investigationOrders?.length ?? 0}</strong> investigation requests</span></div>;
}

function Stage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <><header className={styles.stageHeader}><p className={styles.eyebrow}>Active stage</p><h2>{title}</h2><p>{description}</p></header>{children}</>;
}

function StructuredSummary({ value, kind }: { value: Record<string, unknown>; kind: "history" | "examination" }) {
  const rows = kind === "history" ? [...array(value.complaints), ...array(value.history)] : Object.entries(record(value.examination) ?? {}).map(([label, finding]) => ({ label, finding }));
  if (!rows.length) return <p className={styles.inlineEmpty}>No structured {kind} items captured yet. Classic Workspace remains available for detailed structured entry.</p>;
  return <section className={styles.structuredSummary}><h3>Structured {kind}</h3><ul>{rows.map((row, index) => { const item = record(row); return <li key={String(item?.id ?? item?.label ?? index)}>{String(item?.label ?? item?.category ?? displayValue(row))}{item?.finding ? `: ${String(item.finding)}` : ""}</li>; })}</ul></section>;
}

function SummaryItem({ label, value }: { label: string; value: string }) { return <section><h3>{label}</h3><p>{value || "Not documented"}</p></section>; }
function SafetyFact({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) { return <div className={warning ? styles.safetyWarning : ""}><strong>{warning ? "Attention · " : ""}{label}</strong><span>{value}</span></div>; }
function WorkspaceFailure({ title, detail, retry }: { title: string; detail: string; retry?: () => Promise<void> }) { return <main className={styles.statePanel} role="alert"><h1>{title}</h1><p>{detail}</p>{retry ? <button type="button" onClick={() => void retry()}>Retry</button> : null}</main>; }

function stageState(stage: EncounterStageKey, controller: EncounterWorkspaceController) {
  if (controller.isReadOnly) return { label: "Completed", icon: "✓", tone: "complete" };
  if (stage === "patient-context") return { label: "Confirmed", icon: "✓", tone: "complete" };
  if (stage === "history") return controller.draft.chiefComplaint || controller.draft.historyText ? { label: "Documented", icon: "✓", tone: "complete" } : { label: "Incomplete", icon: "○", tone: "incomplete" };
  if (stage === "examination") return controller.draft.examText ? { label: "Documented", icon: "✓", tone: "complete" } : { label: "Incomplete", icon: "○", tone: "incomplete" };
  if (stage === "assessment") return controller.draft.assessmentText ? { label: "Documented", icon: "✓", tone: "complete" } : { label: "Incomplete", icon: "○", tone: "incomplete" };
  if (stage === "investigations") return (controller.visit?.investigationOrders?.length ?? 0) > 0 ? { label: "Records linked", icon: "✓", tone: "complete" } : { label: "No requests", icon: "○", tone: "incomplete" };
  if (stage === "plan") return controller.draft.planText || (controller.visit?.prescriptions?.length ?? 0) + (controller.visit?.followUps?.length ?? 0) > 0 ? { label: "Documented", icon: "✓", tone: "complete" } : { label: "Incomplete", icon: "○", tone: "incomplete" };
  if (controller.saveState === "conflict" || (controller.readiness?.issues.some((issue) => issue.severity === "blocking") ?? false)) return { label: "Blocked", icon: "!", tone: "blocked" };
  if (controller.saveState !== "saved") return { label: "Unsaved", icon: "!", tone: "warningTone" };
  return controller.readiness?.ready ? { label: "Ready", icon: "✓", tone: "complete" } : { label: "Review", icon: "○", tone: "incomplete" };
}

function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function array(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter((item) => record(item)).map((item) => item as Record<string, unknown>) : []; }
function displayValue(value: unknown) { if (value && typeof value === "object") return String(record(value)?.name ?? record(value)?.label ?? "Record"); return String(value ?? ""); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function pregnancyContext(value: Record<string, unknown>) { return [value.status, value.estimatedDueDate ? `EDD ${String(value.estimatedDueDate).slice(0, 10)}` : null].filter(Boolean).join(" · ") || "Active pregnancy context"; }
function formatTime(value: string) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : value; }
function ageFromDate(value: string) { const birth = new Date(value); if (!Number.isFinite(birth.getTime())) return null; const now = new Date(); let age = now.getFullYear() - birth.getFullYear(); if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1; return age; }