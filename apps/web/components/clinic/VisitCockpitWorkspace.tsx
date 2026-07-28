"use client";

/*
THESIS: One calm, continuous visit surface keeps identity, progress, documentation, context, and sync truth in view.
OWN-WORLD: Prij's clinic-green operational language is compressed into a purpose-built encounter cockpit, not a generic dashboard.
STORY: Confirm the patient, document through seven canonical stages, consult longitudinal context, resolve Review issues, then sign once.
FIRST VIEWPORT: Identity/safety, all seven stages, the active editor, context pane, and persistent save state are visible on desktop.
FORM: A compact three-column clinical instrument with restrained borders, warm-ivory ground, logical spacing, and responsive collapse.
*/

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import InvestigationStationV3 from "@/components/investigations/InvestigationStationV3";
import { useI18n } from "@/i18n/useI18n";
import type { DoctorWorkspaceMode } from "@/lib/interface-mode";
import { HistoryReadOnlyView, SharedClinicalHistoryEditor, historyReviewSummaries } from "./SharedClinicalHistory";
import { encounterStages, type EncounterStageKey, type EncounterWorkspaceController } from "./SharedEncounterWorkspaceController";
import styles from "./visit-cockpit.module.css";

export function VisitCockpitWorkspace({ controller, modeError, onModeChange }: { controller: EncounterWorkspaceController; modeError: string; onModeChange: (mode: DoctorWorkspaceMode) => Promise<void> }) {
  const { language } = useI18n();
  const rtl = language === "ar";
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [contextCollapsed, setContextCollapsed] = useState(false);
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
  const historySheet = record(controller.visit?.historySheet);
  const historyFailed = controller.resourceErrors.some((error) => error.resource === "history");
  const allergyHistory = String(historySheet?.allergyHistory ?? "").trim();
  const risks = array(patient.risks ?? patient.importantRisks);
  const signature = record(encounter.doctorSignature);

  return <main className={styles.cockpit} dir={rtl ? "rtl" : "ltr"} aria-labelledby="cockpit-title">
    <header className={styles.identityBar}>
      <div className={styles.identityPrimary}>
        <p className={styles.eyebrow}>{rtl ? "مساحة الزيارة" : "Visit Cockpit"} · {String(encounter.status ?? "draft")}</p>
        <h1 id="cockpit-title">{String(patient.name ?? "Patient")}</h1>
        <p><strong>MRN {String(patient.medicalRecordNumber ?? (rtl ? "غير مسجل" : "not recorded"))}</strong> · {age !== null ? `${age} ${rtl ? "سنة" : "years"}` : `${rtl ? "تاريخ الميلاد" : "DOB"} ${dateOfBirth || (rtl ? "غير مسجل" : "not recorded")}`} · {humanize(String(patient.patientType ?? "general"))}</p>
      </div>
      <div className={styles.safetyFacts} aria-label={rtl ? "سياق سلامة المريضة" : "Patient safety context"}>
        <SafetyFact label={rtl ? "الحساسية" : "Allergies"} value={historyFailed ? (rtl ? "فشل التحميل" : "Failed to load") : allergyHistory || (rtl ? "غير مسجلة في التاريخ المحمل" : "Not recorded in loaded history")} warning={historyFailed || Boolean(allergyHistory)} />
        <SafetyFact label={rtl ? "مخاطر مهمة" : "Important risks"} value={risks.length ? risks.map(displayValue).join(", ") : (rtl ? "لم تُقيّم في حزمة الزيارة" : "Not assessed in the visit packet")} warning={risks.length > 0} />
        {pregnancy ? <SafetyFact label={rtl ? "سياق الحمل" : "Pregnancy context"} value={pregnancyContext(pregnancy)} /> : null}
        {infertility ? <SafetyFact label={rtl ? "سياق الخصوبة" : "Fertility context"} value={String(infertility.status ?? (rtl ? "حلقة نشطة" : "Active episode"))} /> : null}
      </div>
      <div className={styles.encounterFacts}>
        <span>{String(signature?.doctorName ?? (rtl ? "الطبيب" : "Doctor"))}</span>
        <span>{String(patient.branchName ?? encounter.branchName ?? (rtl ? "الفرع الحالي" : "Current branch"))}</span>
        <button className={styles.modeButton} type="button" onClick={() => void onModeChange("CLASSIC")}>{rtl ? "مساحة العمل الكلاسيكية" : "Classic Workspace"}</button>
      </div>
    </header>

    {modeError ? <p className={styles.errorBanner} role="alert">{modeError}</p> : null}
    {controller.resourceErrors.length ? <section className={styles.resourceWarning} role="status"><strong>Some longitudinal resources did not load.</strong><span>{controller.resourceErrors.map((error) => error.resource).join(", ")}</span><button type="button" onClick={() => void controller.reload()}>Retry resources</button></section> : null}
    <p className="sr-only" aria-live="polite">{controller.announce}</p>

    <nav className={styles.stageRail} aria-label={rtl ? "مراحل الزيارة" : "Visit stages"} role="tablist">
      {encounterStages.map((stage, index) => {
        const state = stageState(stage.key, controller, rtl);
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

    <div className={`${styles.workspaceGrid} ${contextCollapsed ? styles.contextCollapsed : ""}`}>
      <section className={styles.editor} aria-labelledby={`cockpit-tab-${controller.activeStage}`} id={`cockpit-panel-${controller.activeStage}`} role="tabpanel">
        <StageEditor controller={controller} />
      </section>
      <aside className={styles.contextPane} aria-labelledby="context-pane-heading">
        <ContextPane collapsed={contextCollapsed} controller={controller} onToggle={() => setContextCollapsed((current) => !current)} />
      </aside>
    </div>

    <footer className={`${styles.syncBar} ${styles[controller.saveState]}`}>
      <div><strong>{workspaceSaveLabel(controller.saveState, rtl)}</strong><span>{controller.lastSavedRevision ? `${rtl ? "آخر إصدار على الخادم" : "Last server version"} ${formatTime(controller.lastSavedRevision)}` : (rtl ? "بانتظار إصدار الخادم" : "Waiting for server version")}</span></div>
      {controller.saveState === "failed" || controller.saveState === "waiting-sync" ? <button type="button" onClick={() => void controller.save()}>{rtl ? "إعادة محاولة الحفظ" : "Retry save"}</button> : null}
      {controller.saveState === "conflict" ? <button type="button" onClick={() => void controller.reload()}>{rtl ? "إعادة تحميل إصدار الخادم" : "Reload server version"}</button> : null}
      {!controller.isReadOnly && controller.activeStage !== "review" ? <button type="button" onClick={() => controller.setActiveStage("review")}>{rtl ? "الانتقال إلى المراجعة" : "Go to Review"}</button> : null}
    </footer>
  </main>;
}

function StageEditor({ controller }: { controller: EncounterWorkspaceController }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const stage = controller.activeStage;
  const draft = controller.draft;
  const readOnly = controller.isReadOnly;
  if (stage === "patient-context") return <Stage title="Patient Context" description="Confirm identity and relevant episode context before documenting."><PatientContext controller={controller} /></Stage>;
  if (stage === "history") return <Stage title={ar ? "التاريخ المرضي" : "History"} description={ar ? "وثّق الشكوى والتاريخ المنظم ذي الصلة من داخل مساحة الزيارة." : "Document the presenting concern and relevant structured History within the Cockpit."}>{readOnly ? <HistoryReadOnlyView controller={controller} /> : <SharedClinicalHistoryEditor controller={controller} />}</Stage>;
  if (stage === "examination") return <Stage title="Examination" description="Record relevant findings; structured findings already captured remain attached."><fieldset disabled={readOnly} className={styles.fieldset}><label>Examination notes<textarea value={draft.examText} onChange={(event) => controller.updateDraft({ examText: event.target.value })} /></label><StructuredSummary value={draft.examinationJson} kind="examination" /></fieldset></Stage>;
  if (stage === "assessment") return <Stage title="Assessment" description="Record the doctor’s assessment for this encounter."><fieldset disabled={readOnly} className={styles.fieldset}><label>Assessment<textarea value={draft.assessmentText} onChange={(event) => controller.updateDraft({ assessmentText: event.target.value })} /></label></fieldset></Stage>;
  if (stage === "investigations") return <Stage title="Investigations" description="Create and review requests within the locked patient and encounter context."><InvestigationStationV3 lockedPatientId={controller.patientId} lockedEncounterId={controller.encounterId} embedded onSaved={() => void controller.reload()} /></Stage>;
  if (stage === "plan") return <Stage title="Plan" description="Document the plan and review linked prescriptions and follow-up actions."><fieldset disabled={readOnly} className={styles.fieldset}><label>Plan notes<textarea value={draft.planText} onChange={(event) => controller.updateDraft({ planText: event.target.value })} /></label></fieldset><LinkedCounts controller={controller} /></Stage>;
  return <ReviewStage controller={controller} />;
}

function ReviewStage({ controller }: { controller: EncounterWorkspaceController }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const blocking = controller.readiness?.issues.filter((issue) => issue.severity === "blocking") ?? [];
  const warnings = controller.readiness?.issues.filter((issue) => issue.severity === "warning") ?? [];
  const structuredHistory = historyReviewSummaries(controller, ar);
  const canFinish = Boolean(controller.readiness?.ready && controller.saveState === "saved" && !controller.readinessLoading && !controller.isReadOnly);
  return <Stage title={ar ? "المراجعة" : "Review"} description={ar ? "يتحقق الخادم بصورة مستقلة من الجاهزية قبل توقيع الزيارة." : "The server independently checks readiness before the encounter can be signed."}>
    {controller.isReadOnly ? <p className={styles.completedNotice}>{ar ? "زيارة مكتملة · للقراءة فقط" : "Completed encounter · read-only"}</p> : null}
    {controller.readinessLoading ? <p aria-live="polite">{ar ? "جارٍ التحقق من الجاهزية…" : "Checking readiness…"}</p> : null}
    {blocking.length ? <section className={styles.blocking} role="alert"><h3>{ar ? "مشكلات مانعة" : "Blocking issues"}</h3><ul>{blocking.map((issue) => <li key={issue.code}><button className={styles.issueLink} type="button" onClick={() => openReviewIssue(controller, issue.code, issue.section)}><strong>{humanize(issue.section)}:</strong> {issue.message}</button></li>)}</ul></section> : null}
    {warnings.length ? <section className={styles.warning}><h3>{ar ? "تنبيهات المراجعة" : "Review warnings"}</h3><ul>{warnings.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul></section> : null}
    <div className={styles.reviewSummary}>
      <SummaryItem label={ar ? "الشكوى الحالية" : "Presenting complaint"} value={controller.draft.chiefComplaint} />
      <SummaryItem label={ar ? "التاريخ المرضي" : "History"} value={controller.draft.historyText} />
      <SummaryItem label={ar ? "الفحص" : "Examination"} value={controller.draft.examText} />
      <SummaryItem label={ar ? "التقييم" : "Assessment"} value={controller.draft.assessmentText} />
      <SummaryItem label={ar ? "الخطة" : "Plan"} value={controller.draft.planText} />
    </div>
    {structuredHistory.length ? <section className={styles.structuredReview}><h3>{ar ? "ملخص التاريخ المنظم" : "Structured History summary"}</h3>{structuredHistory.map((summary) => <div key={summary.id}><strong>{summary.title}</strong><span>{summary.items.map((item) => `${item.label}: ${item.value}`).join(" · ")}</span><button type="button" onClick={() => openHistorySection(controller, summary.id)}>{ar ? "مراجعة القسم" : "Review section"}</button></div>)}</section> : null}
    {controller.resourceErrors.length ? <section className={styles.warning} role="alert"><h3>{ar ? "موارد لم تُحمّل" : "Resources not loaded"}</h3><p>{ar ? "لا تُفسر الموارد الفاشلة على أنها تاريخ فارغ." : "Failed resources must not be interpreted as empty history."}</p></section> : null}
    {!controller.isReadOnly ? <div className={styles.reviewActions}><button type="button" onClick={() => void controller.refreshReadiness()}>{ar ? "إعادة فحص الجاهزية" : "Recheck readiness"}</button><button className={styles.finishButton} disabled={!canFinish} type="button" onClick={() => void controller.finish()}>{ar ? "توقيع وإنهاء الزيارة" : "Sign and finish encounter"}</button></div> : null}
  </Stage>;
}

function ContextPane({ controller, collapsed, onToggle }: { controller: EncounterWorkspaceController; collapsed: boolean; onToggle: () => void }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const visit = controller.visit;
  const stage = controller.activeStage;
  const historySheet = record(visit?.historySheet);
  const investigationHistory = array(historySheet?.investigationHistoryItems);
  const procedures = array(historySheet?.operationHistoryItems);
  const medicationHistory = array(historySheet?.medicationHistoryItems);
  const groups = stage === "investigations"
    ? [{ kind: "investigations", title: "Investigation requests and results", titleAr: "طلبات الفحوصات والنتائج", rows: [...(visit?.investigationOrders ?? []), ...investigationHistory], resources: ["investigations", "history"] }, { kind: "ultrasounds", title: "Ultrasound history", titleAr: "تاريخ الموجات فوق الصوتية", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }, { kind: "encounters", title: "Previous encounters", titleAr: "زيارات سابقة", rows: visit?.recentEncounters ?? [], resources: ["recent-encounters"] }]
    : stage === "plan"
      ? [{ kind: "medications", title: "Current medications / prescriptions", titleAr: "الأدوية والوصفات الحالية", rows: [...(visit?.prescriptions ?? []), ...medicationHistory], resources: ["prescriptions", "history"] }, { kind: "procedures", title: "Procedures and follow-up", titleAr: "الإجراءات والمتابعة", rows: [...(visit?.followUps ?? []), ...procedures], resources: ["follow-up", "history"] }, { kind: "ultrasounds", title: "Ultrasound history", titleAr: "تاريخ الموجات فوق الصوتية", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }]
      : [{ kind: "encounters", title: "Previous encounters", titleAr: "زيارات سابقة", rows: visit?.recentEncounters ?? [], resources: ["recent-encounters"] }, { kind: "medications", title: "Current medications / prescriptions", titleAr: "الأدوية والوصفات الحالية", rows: [...(visit?.prescriptions ?? []), ...medicationHistory], resources: ["prescriptions", "history"] }, { kind: "investigations", title: "Investigations and results", titleAr: "الفحوصات والنتائج", rows: [...(visit?.investigationOrders ?? []), ...investigationHistory], resources: ["investigations", "history"] }, { kind: "ultrasounds", title: "Ultrasound history", titleAr: "تاريخ الموجات فوق الصوتية", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }];
  const failedResources = new Set(controller.resourceErrors.map((error) => error.resource));
  return <><div className={styles.contextHeading}><div><p className={styles.eyebrow}>{ar ? "السياق الطولي" : "Longitudinal context"}</p><h2 id="context-pane-heading">{ar ? "ذو صلة بالمرحلة الحالية" : `Relevant to ${encounterStages.find((item) => item.key === stage)?.label}`}</h2></div><button aria-expanded={!collapsed} className={styles.contextToggle} type="button" onClick={onToggle}>{collapsed ? (ar ? "فتح السياق" : "Expand context") : (ar ? "طي السياق" : "Collapse context")}</button></div>{collapsed ? null : groups.map((group) => <ContextGroup ar={ar} controller={controller} failed={group.resources.some((resource) => failedResources.has(resource))} key={group.title} kind={group.kind} title={ar ? group.titleAr : group.title} rows={group.rows} />)}</>;
}

function ContextGroup({ title, rows, failed, kind, controller, ar }: { title: string; rows: Record<string, unknown>[]; failed: boolean; kind: string; controller: EncounterWorkspaceController; ar: boolean }) {
  const failure = ar ? "لم يكتمل تحميل هذا المورد. تُعرض الصفوف المتاحة. أعد المحاولة قبل تفسير ذلك على أنه لا يوجد تاريخ." : "This resource did not fully load. Available rows are shown. Retry before interpreting this as no history.";
  return <section className={styles.contextGroup}><h3>{title}<span>{failed ? (rows.length ? (ar ? "جزئي" : "Partial") : (ar ? "خطأ" : "Error")) : rows.length}</span></h3>{failed ? <p className={styles.resourceError} role="alert">{failure}</p> : null}{rows.length ? <ul>{rows.slice(0, 6).map((row, index) => <li key={String(row.id ?? index)}><button type="button" onClick={() => void openContextRow(controller, kind, row)}><strong>{contextRowTitle(kind, row)}</strong><small>{contextRowMeta(kind, row)}</small></button></li>)}</ul> : failed ? null : <p className={styles.empty}>{ar ? "لم تُرجع سجلات." : "No records returned."}</p>}</section>;
}

function openReviewIssue(controller: EncounterWorkspaceController, code: string, section: string) {
  if (section !== "history") {
    controller.setActiveStage(section === "examination" ? "examination" : section === "assessment" ? "assessment" : section === "plan" ? "plan" : "patient-context");
    return;
  }
  const target = code === "CHIEF_COMPLAINT_REQUIRED" ? "presenting-concern-title" : code.includes("PREGNANCY") || code.includes("REPRODUCTIVE") ? "history-section-obstetric-reproductive" : "history-section-hpi";
  controller.setActiveStage("history");
  window.setTimeout(() => document.getElementById(target)?.focus(), 0);
}

function openHistorySection(controller: EncounterWorkspaceController, sectionId: string) {
  controller.setActiveStage("history");
  window.setTimeout(() => {
    const section = document.getElementById(`history-section-${sectionId}`) as HTMLDetailsElement | null;
    if (section) { section.open = true; section.focus(); }
  }, 0);
}

async function openContextRow(controller: EncounterWorkspaceController, kind: string, row: Record<string, unknown>) {
  if (!await controller.prepareModeSwitch()) return;
  const id = String(row.id ?? "");
  const href = kind === "encounters" && id
    ? `/patients/${controller.patientId}/visits/${id}/encounter`
    : kind === "ultrasounds" && id
      ? `/patients/${controller.patientId}/ultrasounds/${id}`
      : `/patients/${controller.patientId}?tab=${kind === "medications" ? "prescriptions" : kind === "procedures" ? "history" : "investigations"}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

function contextRowTitle(kind: string, row: Record<string, unknown>) {
  const firstItem = array(row.items)[0];
  return displayValue(row.title ?? row.name ?? row.chiefComplaint ?? row.scanType ?? record(firstItem)?.medicationName ?? row.status ?? (kind === "encounters" ? "Encounter" : "Record"));
}

function contextRowMeta(kind: string, row: Record<string, unknown>) {
  const date = displayValue(row.signedAt ?? row.performedAt ?? row.orderedAt ?? row.createdAt ?? row.dueAt ?? "");
  const status = displayValue(row.resultReviewStatus ?? row.status ?? "");
  return [status, date, kind === "medications" ? displayValue(record(array(row.items)[0])?.instructions ?? "") : ""].filter(Boolean).join(" · ");
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
  const { language } = useI18n();
  return <><header className={styles.stageHeader}><p className={styles.eyebrow}>{language === "ar" ? "المرحلة الحالية" : "Active stage"}</p><h2>{title}</h2><p>{description}</p></header>{children}</>;
}

function StructuredSummary({ value, kind }: { value: Record<string, unknown>; kind: "history" | "examination" }) {
  const rows = kind === "history" ? [...array(value.complaints), ...array(value.history)] : Object.entries(record(value.examination) ?? {}).map(([label, finding]) => ({ label, finding }));
  if (!rows.length) return <p className={styles.inlineEmpty}>No structured {kind} items have been recorded.</p>;
  return <section className={styles.structuredSummary}><h3>Structured {kind}</h3><ul>{rows.map((row, index) => { const item = record(row); return <li key={String(item?.id ?? item?.label ?? index)}>{String(item?.label ?? item?.category ?? displayValue(row))}{item?.finding ? `: ${String(item.finding)}` : ""}</li>; })}</ul></section>;
}

function SummaryItem({ label, value }: { label: string; value: string }) { return <section><h3>{label}</h3><p>{value || "Not documented"}</p></section>; }
function SafetyFact({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) { return <div className={warning ? styles.safetyWarning : ""}><strong>{warning ? "Attention · " : ""}{label}</strong><span>{value}</span></div>; }
function WorkspaceFailure({ title, detail, retry }: { title: string; detail: string; retry?: () => Promise<void> }) { return <main className={styles.statePanel} role="alert"><h1>{title}</h1><p>{detail}</p>{retry ? <button type="button" onClick={() => void retry()}>Retry</button> : null}</main>; }

function stageState(stage: EncounterStageKey, controller: EncounterWorkspaceController, ar: boolean) {
  const label = (english: string, arabic: string) => ar ? arabic : english;
  if (controller.isReadOnly) return { label: label("Completed", "مكتملة"), icon: "✓", tone: "complete" };
  if (stage === "patient-context") return { label: label("Confirmed", "مؤكد"), icon: "✓", tone: "complete" };
  if (stage === "history") return controller.draft.chiefComplaint || controller.draft.historyText ? { label: label("Documented", "موثق"), icon: "✓", tone: "complete" } : { label: label("Incomplete", "غير مكتمل"), icon: "○", tone: "incomplete" };
  if (stage === "examination") return controller.draft.examText ? { label: label("Documented", "موثق"), icon: "✓", tone: "complete" } : { label: label("Incomplete", "غير مكتمل"), icon: "○", tone: "incomplete" };
  if (stage === "assessment") return controller.draft.assessmentText ? { label: label("Documented", "موثق"), icon: "✓", tone: "complete" } : { label: label("Incomplete", "غير مكتمل"), icon: "○", tone: "incomplete" };
  if (stage === "investigations") return (controller.visit?.investigationOrders?.length ?? 0) > 0 ? { label: label("Records linked", "سجلات مرتبطة"), icon: "✓", tone: "complete" } : { label: label("No requests", "لا طلبات"), icon: "○", tone: "incomplete" };
  if (stage === "plan") return controller.draft.planText || (controller.visit?.prescriptions?.length ?? 0) + (controller.visit?.followUps?.length ?? 0) > 0 ? { label: label("Documented", "موثق"), icon: "✓", tone: "complete" } : { label: label("Incomplete", "غير مكتمل"), icon: "○", tone: "incomplete" };
  if (controller.saveState === "conflict" || (controller.readiness?.issues.some((issue) => issue.severity === "blocking") ?? false)) return { label: label("Blocked", "متعذر"), icon: "!", tone: "blocked" };
  if (controller.saveState !== "saved") return { label: label("Unsaved", "غير محفوظ"), icon: "!", tone: "warningTone" };
  return controller.readiness?.ready ? { label: label("Ready", "جاهزة"), icon: "✓", tone: "complete" } : { label: label("Review", "مراجعة"), icon: "○", tone: "incomplete" };
}

function workspaceSaveLabel(state: EncounterWorkspaceController["saveState"], ar: boolean) {
  if (!ar) return state === "saved" ? "Saved" : state === "saving" ? "Saving…" : state === "waiting-sync" ? "Waiting to sync" : state === "conflict" ? "Version conflict" : state === "failed" ? "Save failed" : "Ready";
  return state === "saved" ? "تم الحفظ" : state === "saving" ? "جارٍ الحفظ…" : state === "waiting-sync" ? "بانتظار المزامنة" : state === "conflict" ? "تعارض في الإصدار" : state === "failed" ? "فشل الحفظ" : "جاهز";
}

function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function array(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter((item) => record(item)).map((item) => item as Record<string, unknown>) : []; }
function displayValue(value: unknown) { if (value && typeof value === "object") return String(record(value)?.name ?? record(value)?.label ?? "Record"); return String(value ?? ""); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function pregnancyContext(value: Record<string, unknown>) { return [value.status, value.estimatedDueDate ? `EDD ${String(value.estimatedDueDate).slice(0, 10)}` : null].filter(Boolean).join(" · ") || "Active pregnancy context"; }
function formatTime(value: string) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : value; }
function ageFromDate(value: string) { const birth = new Date(value); if (!Number.isFinite(birth.getTime())) return null; const now = new Date(); let age = now.getFullYear() - birth.getFullYear(); if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1; return age; }