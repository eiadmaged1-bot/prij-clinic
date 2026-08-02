"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import InvestigationStationV3 from "@/components/investigations/InvestigationStationV3";
import { useI18n } from "@/i18n/useI18n";
import type { DoctorWorkspaceMode } from "@/lib/interface-mode";
import { HistoryReadOnlyView, SharedClinicalHistoryEditor, historyReviewSummaries } from "./SharedClinicalHistory";
import { encounterStages, type EncounterStageKey, type EncounterWorkspaceController } from "./SharedEncounterWorkspaceController";
import styles from "./visit-cockpit.module.css";

type VisitGroupKey = "note" | "orders" | "review";

const visitGroups: Array<{
  key: VisitGroupKey;
  label: string;
  ar: string;
  stages: EncounterStageKey[];
  defaultStage: EncounterStageKey;
  tabId: string;
}> = [
  {
    key: "note",
    label: "Visit note",
    ar: "ملاحظات الزيارة",
    stages: ["patient-context", "history", "examination", "assessment"],
    defaultStage: "history",
    tabId: "cockpit-tab-history"
  },
  {
    key: "orders",
    label: "Orders & plan",
    ar: "الطلبات والخطة",
    stages: ["investigations", "plan"],
    defaultStage: "plan",
    tabId: "cockpit-tab-plan"
  },
  {
    key: "review",
    label: "Review",
    ar: "المراجعة",
    stages: ["review"],
    defaultStage: "review",
    tabId: "cockpit-tab-review"
  }
];

export function VisitCockpitWorkspace({
  controller,
  modeError,
  onModeChange
}: {
  controller: EncounterWorkspaceController;
  modeError: string;
  onModeChange: (mode: DoctorWorkspaceMode) => Promise<void>;
}) {
  const { language } = useI18n();
  const rtl = language === "ar";
  const groupRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [contextExpanded, setContextExpanded] = useState(false);
  const patient = controller.patient;
  const encounter = controller.encounter;
  const { activeStage, isReadOnly, refreshReadiness } = controller;

  useEffect(() => {
    if (activeStage === "review" && !isReadOnly) void refreshReadiness();
  }, [activeStage, isReadOnly, refreshReadiness]);

  if (controller.loadState === "loading") {
    return <main className={styles.statePanel} aria-busy="true"><h1>{rtl ? "الزيارة الحالية" : "Current visit"}</h1><p>{rtl ? "جارٍ تحميل الزيارة والبيانات ذات الصلة…" : "Loading the visit and related clinical information…"}</p></main>;
  }
  if (controller.loadState === "authentication-failed") return <WorkspaceFailure title={rtl ? "انتهت الجلسة" : "Session expired"} detail={rtl ? "سجّل الدخول مرة أخرى للمتابعة." : "Sign in again before continuing this visit."} />;
  if (controller.loadState === "access-denied") return <WorkspaceFailure title={rtl ? "غير مسموح" : "Access denied"} detail={rtl ? "ليس لديك صلاحية لفتح هذه الزيارة." : "You do not have access to this visit."} />;
  if (controller.loadState === "resource-failed") return <WorkspaceFailure title={rtl ? "تعذر تحميل البيانات السريرية" : "Clinical information unavailable"} detail={controller.resourceError ?? (rtl ? "تعذر تحميل بيانات الزيارة." : "The visit information could not be loaded.")} retry={controller.reload} />;
  if (!patient || !encounter) return <WorkspaceFailure title={rtl ? "الزيارة غير متاحة" : "Visit unavailable"} detail={rtl ? "تعذر التحقق من المريضة والزيارة." : "Patient and visit identity could not be verified."} retry={controller.reload} />;

  const activeGroupIndex = visitGroups.findIndex((group) => group.stages.includes(activeStage));
  const activeGroup = visitGroups[Math.max(0, activeGroupIndex)]!;
  const activeSections = activeGroup.stages;
  const dateOfBirth = String(patient.dateOfBirth ?? "");
  const age = dateOfBirth ? ageFromDate(dateOfBirth) : null;
  const pregnancy = record(controller.visit?.pregnancyEpisode);
  const infertility = record(controller.visit?.infertilityEpisode);
  const historySheet = record(controller.visit?.historySheet);
  const historyFailed = controller.resourceErrors.some((error) => error.resource === "history");
  const allergyHistory = String(historySheet?.allergyHistory ?? "").trim();
  const risks = array(patient.risks ?? patient.importantRisks);
  const signature = record(encounter.doctorSignature);

  function moveGroup(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = visitGroups.length - 1;
    else if (event.key === "ArrowRight") next = index + (rtl ? -1 : 1);
    else if (event.key === "ArrowLeft") next = index + (rtl ? 1 : -1);
    else return;
    event.preventDefault();
    next = Math.max(0, Math.min(visitGroups.length - 1, next));
    controller.setActiveStage(visitGroups[next]!.defaultStage);
    groupRefs.current[next]?.focus();
  }

  return <main className={styles.cockpit} data-visit-focus="true" dir={rtl ? "rtl" : "ltr"} aria-labelledby="cockpit-title">
    <header className={styles.identityBar}>
      <div className={styles.identityPrimary}>
        <p className={styles.eyebrow}>{rtl ? "الزيارة الحالية" : "Current visit"} · {visitStatusLabel(String(encounter.status ?? "draft"), rtl)}</p>
        <h1 id="cockpit-title">{String(patient.name ?? (rtl ? "المريضة" : "Patient"))}</h1>
        <p className={styles.identityMeta}>
          <strong>MRN {String(patient.medicalRecordNumber ?? (rtl ? "غير مسجل" : "not recorded"))}</strong>
          <span>·</span>
          <span>{age !== null ? `${age} ${rtl ? "سنة" : "years"}` : `${rtl ? "تاريخ الميلاد" : "DOB"} ${dateOfBirth || (rtl ? "غير مسجل" : "not recorded")}`}</span>
          <span>·</span>
          <span>{humanize(String(patient.patientType ?? "general"))}</span>
        </p>
      </div>

      <div className={styles.safetyFacts} aria-label={rtl ? "سياق سلامة المريضة" : "Patient safety context"}>
        <SafetyFact label={rtl ? "الحساسية" : "Allergies"} value={historyFailed ? (rtl ? "فشل التحميل" : "Failed to load") : allergyHistory || (rtl ? "غير مسجلة" : "Not recorded")} warning={historyFailed || Boolean(allergyHistory)} />
        <SafetyFact label={rtl ? "المخاطر" : "Important risks"} value={risks.length ? risks.map(displayValue).join(", ") : (rtl ? "لم تُقيّم" : "Not assessed")} warning={risks.length > 0} />
        {pregnancy ? <SafetyFact label={rtl ? "الحمل" : "Pregnancy"} value={pregnancyContext(pregnancy)} /> : null}
        {infertility ? <SafetyFact label={rtl ? "الخصوبة" : "Fertility"} value={String(infertility.status ?? (rtl ? "نشط" : "Active"))} /> : null}
      </div>

      <div className={styles.visitActions}>
        <div className={styles.doctorMeta}>
          <strong>{String(signature?.doctorName ?? (rtl ? "الطبيب" : "Doctor"))}</strong>
          <span>{String(patient.branchName ?? encounter.branchName ?? (rtl ? "الفرع الحالي" : "Current branch"))}</span>
        </div>
        <Link className={styles.secondaryButton} href={`/patients/${controller.patientId}`}>
          {rtl ? "ملف المريضة" : "Patient file"}
        </Link>
        <button className={styles.secondaryButton} type="button" onClick={() => setContextExpanded((current) => !current)} aria-expanded={contextExpanded}>
          {contextExpanded ? (rtl ? "إخفاء السياق" : "Hide context") : (rtl ? "السياق السريري" : "Clinical context")}
        </button>
        <button className={styles.secondaryButton} type="button" onClick={() => void onModeChange("CLASSIC")}>
          {rtl ? "العرض القياسي" : "Standard view"}
        </button>
      </div>
    </header>

    {modeError ? <p className={styles.errorBanner} role="alert">{modeError}</p> : null}
    {controller.resourceErrors.length ? <section className={styles.resourceWarning} role="status"><strong>{rtl ? "بعض البيانات ذات الصلة لم تُحمّل." : "Some related clinical information did not load."}</strong><span>{controller.resourceErrors.map((error) => error.resource).join(", ")}</span><button type="button" onClick={() => void controller.reload()}>{rtl ? "إعادة المحاولة" : "Retry"}</button></section> : null}
    <p className={styles.visuallyHidden} aria-live="polite">{controller.announce}</p>

    <nav className={styles.groupRail} aria-label={rtl ? "مراحل الزيارة" : "Visit workflow"} role="tablist">
      {visitGroups.map((group, index) => {
        const active = group.key === activeGroup.key;
        const state = visitGroupState(group.key, controller, rtl);
        return <button
          aria-controls={`cockpit-panel-${controller.activeStage}`}
          aria-selected={active}
          className={`${styles.groupTab} ${active ? styles.activeGroup : ""}`}
          id={group.tabId}
          key={group.key}
          onClick={() => controller.setActiveStage(group.defaultStage)}
          onKeyDown={(event) => moveGroup(event, index)}
          ref={(element) => { groupRefs.current[index] = element; }}
          role="tab"
          tabIndex={active ? 0 : -1}
          type="button"
        >
          <span className={styles.groupNumber}>{index + 1}</span>
          <span className={styles.groupText}>
            <strong>{rtl ? group.ar : group.label}</strong>
            <small>{state.label}</small>
          </span>
          <span className={`${styles.groupState} ${styles[state.tone]}`} aria-hidden="true">{state.icon}</span>
        </button>;
      })}
    </nav>

    <div className={styles.sectionToolbar}>
      <div>
        <p className={styles.eyebrow}>{rtl ? "القسم الحالي" : "Current section"}</p>
        <strong>{stageLabel(activeStage, rtl)}</strong>
      </div>
      {activeSections.length > 1 ? <label className={styles.sectionSelect}>
        <span>{rtl ? "اختر القسم" : "Choose section"}</span>
        <select
          aria-label={rtl ? "قسم الزيارة الحالي" : "Current visit section"}
          value={activeStage}
          onChange={(event) => controller.setActiveStage(event.target.value as EncounterStageKey)}
        >
          {activeSections.map((stage) => <option key={stage} value={stage}>{stageLabel(stage, rtl)}</option>)}
        </select>
      </label> : null}
    </div>

    <div className={styles.workspace}>
      <section
        className={styles.editor}
        aria-labelledby={activeGroup.tabId}
        id={`cockpit-panel-${controller.activeStage}`}
        role="tabpanel"
      >
        <StageEditor controller={controller} />
      </section>

      {contextExpanded ? <aside className={styles.contextDrawer} aria-labelledby="context-pane-heading">
        <ContextPane controller={controller} />
      </aside> : null}
    </div>

    <footer className={`${styles.syncBar} ${styles[controller.saveState]}`}>
      <div className={styles.syncStatus}>
        <strong>{workspaceSaveLabel(controller.saveState, rtl)}</strong>
        <span>{controller.lastSavedRevision ? `${rtl ? "آخر حفظ" : "Last saved"} ${formatTime(controller.lastSavedRevision)}` : (rtl ? "بانتظار أول حفظ" : "Waiting for first save")}</span>
      </div>
      <div className={styles.syncActions}>
        {controller.saveState === "failed" || controller.saveState === "waiting-sync" ? <button type="button" onClick={() => void controller.save()}>{rtl ? "إعادة الحفظ" : "Retry save"}</button> : null}
        {controller.saveState === "conflict" ? <button type="button" onClick={() => void controller.reload()}>{rtl ? "تحميل نسخة الخادم" : "Reload server version"}</button> : null}
        {!controller.isReadOnly && controller.activeStage !== "review" ? <button className={styles.primaryButton} type="button" onClick={() => controller.setActiveStage("review")}>{rtl ? "المراجعة والتوقيع" : "Review & sign"}</button> : null}
      </div>
    </footer>
  </main>;
}

function StageEditor({ controller }: { controller: EncounterWorkspaceController }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const stage = controller.activeStage;
  const draft = controller.draft;
  const readOnly = controller.isReadOnly;

  if (stage === "patient-context") return <Stage title={ar ? "سياق المريضة" : "Patient context"} description={ar ? "تأكد من الهوية والسياق النشط قبل التوثيق." : "Confirm identity and the active clinical context before documenting."}><PatientContext controller={controller} /></Stage>;
  if (stage === "history") return <Stage title={ar ? "التاريخ المرضي" : "History"} description={ar ? "وثّق الشكوى والتاريخ المنظم ذي الصلة." : "Document the presenting concern and relevant structured history."}>{readOnly ? <HistoryReadOnlyView controller={controller} /> : <SharedClinicalHistoryEditor controller={controller} />}</Stage>;
  if (stage === "examination") return <Stage title={ar ? "الفحص" : "Examination"} description={ar ? "سجّل النتائج السريرية ذات الصلة." : "Record the relevant clinical findings."}><fieldset disabled={readOnly} className={styles.fieldset}><label>{ar ? "ملاحظات الفحص" : "Examination notes"}<textarea value={draft.examText} onChange={(event) => controller.updateDraft({ examText: event.target.value })} /></label><StructuredSummary value={draft.examinationJson} kind="examination" /></fieldset></Stage>;
  if (stage === "assessment") return <Stage title={ar ? "التقييم" : "Assessment"} description={ar ? "سجّل تقييم الطبيب لهذه الزيارة." : "Record the doctor’s assessment for this visit."}><fieldset disabled={readOnly} className={styles.fieldset}><label>{ar ? "التقييم" : "Assessment"}<textarea value={draft.assessmentText} onChange={(event) => controller.updateDraft({ assessmentText: event.target.value })} /></label></fieldset></Stage>;
  if (stage === "investigations") return <Stage title={ar ? "الفحوصات" : "Investigations"} description={ar ? "أنشئ الطلبات وراجعها ضمن سياق المريضة والزيارة." : "Create and review requests within the locked patient and visit context."}><InvestigationStationV3 lockedPatientId={controller.patientId} lockedEncounterId={controller.encounterId} embedded onSaved={() => void controller.reload()} /></Stage>;
  if (stage === "plan") return <Stage title={ar ? "الخطة" : "Plan"} description={ar ? "وثّق الخطة وراجع الطلبات والمتابعة المرتبطة." : "Document the plan and review linked orders and follow-up actions."}><fieldset disabled={readOnly} className={styles.fieldset}><label>{ar ? "ملاحظات الخطة" : "Plan notes"}<textarea value={draft.planText} onChange={(event) => controller.updateDraft({ planText: event.target.value })} /></label></fieldset><LinkedCounts controller={controller} ar={ar} /></Stage>;
  return <ReviewStage controller={controller} />;
}

function ReviewStage({ controller }: { controller: EncounterWorkspaceController }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const blocking = controller.readiness?.issues.filter((issue) => issue.severity === "blocking") ?? [];
  const warnings = controller.readiness?.issues.filter((issue) => issue.severity === "warning") ?? [];
  const structuredHistory = historyReviewSummaries(controller, ar);
  const canFinish = Boolean(controller.readiness?.ready && controller.saveState === "saved" && !controller.readinessLoading && !controller.isReadOnly);

  return <Stage title={ar ? "المراجعة" : "Review"} description={ar ? "يتحقق الخادم من الجاهزية قبل توقيع الزيارة." : "The server checks readiness before the visit can be signed."}>
    {controller.isReadOnly ? <p className={styles.completedNotice}>{ar ? "زيارة مكتملة · للقراءة فقط" : "Completed visit · read-only"}<span className={styles.visuallyHidden}>Completed encounter · read-only</span></p> : null}
    {controller.readinessLoading ? <p className={styles.inlineStatus} aria-live="polite">{ar ? "جارٍ التحقق من الجاهزية…" : "Checking readiness…"}</p> : null}
    {blocking.length ? <section className={styles.blocking} role="alert"><h3 aria-label="Blocking issues">{ar ? "يجب إكمال التالي" : "Complete before signing"}</h3><ul>{blocking.map((issue) => <li key={issue.code}><button className={styles.issueLink} type="button" onClick={() => openReviewIssue(controller, issue.code, issue.section)}><strong>{humanize(issue.section)}:</strong> {issue.message}</button></li>)}</ul></section> : null}
    {warnings.length ? <section className={styles.warning}><h3>{ar ? "تنبيهات المراجعة" : "Review warnings"}</h3><ul>{warnings.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul></section> : null}

    <div className={styles.reviewSummary}>
      <SummaryItem label={ar ? "الشكوى الحالية" : "Presenting complaint"} value={controller.draft.chiefComplaint} />
      <SummaryItem label={ar ? "التاريخ المرضي" : "History"} value={controller.draft.historyText} />
      <SummaryItem label={ar ? "الفحص" : "Examination"} value={controller.draft.examText} />
      <SummaryItem label={ar ? "التقييم" : "Assessment"} value={controller.draft.assessmentText} />
      <SummaryItem label={ar ? "الخطة" : "Plan"} value={controller.draft.planText} />
    </div>

    {structuredHistory.length ? <details className={styles.structuredReview}>
      <summary>{ar ? "ملخص التاريخ المنظم" : "Structured history summary"}</summary>
      {structuredHistory.map((summary) => <div key={summary.id}><strong>{summary.title}</strong><span>{summary.items.map((item) => `${item.label}: ${item.value}`).join(" · ")}</span><button type="button" onClick={() => openHistorySection(controller, summary.id)}>{ar ? "مراجعة القسم" : "Review section"}</button></div>)}
    </details> : null}

    {controller.resourceErrors.length ? <section className={styles.warning} role="alert"><h3>{ar ? "بيانات لم تُحمّل" : "Information not loaded"}</h3><p>{ar ? "لا تعتبر البيانات التي فشل تحميلها تاريخًا فارغًا." : "Failed information must not be interpreted as an empty history."}</p></section> : null}

    {!controller.isReadOnly ? <div className={styles.reviewActions}>
      <button type="button" onClick={() => void controller.refreshReadiness()}>{ar ? "إعادة فحص الجاهزية" : "Recheck readiness"}</button>
      <button aria-label="Sign and finish encounter" className={styles.finishButton} disabled={!canFinish} type="button" onClick={() => void controller.finish()}>{ar ? "توقيع وإنهاء الزيارة" : "Sign and finish visit"}</button>
    </div> : null}
  </Stage>;
}

function ContextPane({ controller }: { controller: EncounterWorkspaceController }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const visit = controller.visit;
  const stage = controller.activeStage;
  const historySheet = record(visit?.historySheet);
  const investigationHistory = array(historySheet?.investigationHistoryItems);
  const procedures = array(historySheet?.operationHistoryItems);
  const medicationHistory = array(historySheet?.medicationHistoryItems);
  const groups = stage === "investigations"
    ? [
        { kind: "investigations", title: "Investigation requests and results", titleAr: "طلبات الفحوصات والنتائج", rows: [...(visit?.investigationOrders ?? []), ...investigationHistory], resources: ["investigations", "history"] },
        { kind: "ultrasounds", title: "Ultrasound history", titleAr: "تاريخ الموجات فوق الصوتية", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] },
        { kind: "encounters", title: "Previous visits", titleAr: "الزيارات السابقة", rows: visit?.recentEncounters ?? [], resources: ["recent-encounters"] }
      ]
    : stage === "plan"
      ? [
          { kind: "medications", title: "Current medications / prescriptions", titleAr: "الأدوية والوصفات الحالية", rows: [...(visit?.prescriptions ?? []), ...medicationHistory], resources: ["prescriptions", "history"] },
          { kind: "procedures", title: "Procedures and follow-up", titleAr: "الإجراءات والمتابعة", rows: [...(visit?.followUps ?? []), ...procedures], resources: ["follow-up", "history"] },
          { kind: "ultrasounds", title: "Ultrasound history", titleAr: "تاريخ الموجات فوق الصوتية", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }
        ]
      : [
          { kind: "encounters", title: "Previous visits", titleAr: "الزيارات السابقة", rows: visit?.recentEncounters ?? [], resources: ["recent-encounters"] },
          { kind: "medications", title: "Current medications / prescriptions", titleAr: "الأدوية والوصفات الحالية", rows: [...(visit?.prescriptions ?? []), ...medicationHistory], resources: ["prescriptions", "history"] },
          { kind: "investigations", title: "Investigations and results", titleAr: "الفحوصات والنتائج", rows: [...(visit?.investigationOrders ?? []), ...investigationHistory], resources: ["investigations", "history"] },
          { kind: "ultrasounds", title: "Ultrasound history", titleAr: "تاريخ الموجات فوق الصوتية", rows: visit?.ultrasounds ?? [], resources: ["ultrasounds"] }
        ];
  const failedResources = new Set(controller.resourceErrors.map((error) => error.resource));

  return <div className={styles.contextContent}>
    <div className={styles.contextHeading}>
      <div>
        <p className={styles.eyebrow}>{ar ? "السياق السريري" : "Clinical context"}</p>
        <h2 id="context-pane-heading">{ar ? "ذو صلة بالقسم الحالي" : `Relevant to ${stageLabel(stage, false)}`}</h2>
      </div>
    </div>
    <div className={styles.contextGroups}>
      {groups.map((group) => <ContextGroup ar={ar} controller={controller} failed={group.resources.some((resource) => failedResources.has(resource))} key={group.title} kind={group.kind} title={ar ? group.titleAr : group.title} rows={group.rows} />)}
    </div>
  </div>;
}

function ContextGroup({
  title,
  rows,
  failed,
  kind,
  controller,
  ar
}: {
  title: string;
  rows: Record<string, unknown>[];
  failed: boolean;
  kind: string;
  controller: EncounterWorkspaceController;
  ar: boolean;
}) {
  const failure = ar ? "لم يكتمل تحميل هذا المورد. أعد المحاولة قبل اعتباره فارغًا." : "This information did not fully load. Retry before treating it as empty.";
  return <section className={styles.contextGroup}>
    <h3>{title}<span>{failed ? (rows.length ? (ar ? "جزئي" : "Partial") : (ar ? "خطأ" : "Error")) : rows.length}</span></h3>
    {failed ? <p className={styles.resourceError} role="alert">{failure}</p> : null}
    {rows.length ? <ul>{rows.slice(0, 6).map((row, index) => <li key={String(row.id ?? index)}><button type="button" onClick={() => void openContextRow(controller, kind, row)}><strong>{contextRowTitle(kind, row)}</strong><small>{contextRowMeta(kind, row)}</small></button></li>)}</ul> : failed ? null : <p className={styles.empty}>{ar ? "لا توجد سجلات." : "No records returned."}</p>}
  </section>;
}

function openReviewIssue(controller: EncounterWorkspaceController, code: string, section: string) {
  if (section !== "history") {
    controller.setActiveStage(section === "examination" ? "examination" : section === "assessment" ? "assessment" : section === "plan" ? "plan" : "patient-context");
    return;
  }
  const target = code === "CHIEF_COMPLAINT_REQUIRED"
    ? "presenting-concern-title"
    : code.includes("PREGNANCY") || code.includes("REPRODUCTIVE")
      ? "history-section-obstetric-reproductive"
      : "history-section-hpi";
  controller.setActiveStage("history");
  window.setTimeout(() => document.getElementById(target)?.focus(), 0);
}

function openHistorySection(controller: EncounterWorkspaceController, sectionId: string) {
  controller.setActiveStage("history");
  window.setTimeout(() => {
    const section = document.getElementById(`history-section-${sectionId}`) as HTMLDetailsElement | null;
    if (section) {
      section.open = true;
      section.focus();
    }
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
  return displayValue(row.title ?? row.name ?? row.chiefComplaint ?? row.scanType ?? record(firstItem)?.medicationName ?? row.status ?? (kind === "encounters" ? "Visit" : "Record"));
}

function contextRowMeta(kind: string, row: Record<string, unknown>) {
  const date = displayValue(row.signedAt ?? row.performedAt ?? row.orderedAt ?? row.createdAt ?? row.dueAt ?? "");
  const status = displayValue(row.resultReviewStatus ?? row.status ?? "");
  return [status, date, kind === "medications" ? displayValue(record(array(row.items)[0])?.instructions ?? "") : ""].filter(Boolean).join(" · ");
}

function PatientContext({ controller }: { controller: EncounterWorkspaceController }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const pregnancy = record(controller.visit?.pregnancyEpisode);
  const infertility = record(controller.visit?.infertilityEpisode);
  return <dl className={styles.contextFacts}>
    <div><dt>{ar ? "حالة الزيارة" : "Visit status"}</dt><dd>{visitStatusLabel(String(controller.encounter?.status ?? "draft"), ar)}</dd></div>
    <div><dt>{ar ? "نوع المريضة" : "Patient type"}</dt><dd>{humanize(String(controller.patient?.patientType ?? "general"))}</dd></div>
    <div><dt>{ar ? "الحمل" : "Pregnancy"}</dt><dd>{pregnancy ? pregnancyContext(pregnancy) : (ar ? "لا توجد حلقة نشطة" : "No active episode returned")}</dd></div>
    <div><dt>{ar ? "الخصوبة" : "Fertility"}</dt><dd>{infertility ? String(infertility.status ?? (ar ? "نشط" : "Active")) : (ar ? "لا توجد حلقة نشطة" : "No active episode returned")}</dd></div>
  </dl>;
}

function LinkedCounts({ controller, ar }: { controller: EncounterWorkspaceController; ar: boolean }) {
  const counts = [
    { value: controller.visit?.prescriptions?.length ?? 0, label: ar ? "وصفات" : "prescriptions" },
    { value: controller.visit?.followUps?.length ?? 0, label: ar ? "متابعات" : "follow-up actions" },
    { value: controller.visit?.investigationOrders?.length ?? 0, label: ar ? "طلبات فحوصات" : "investigation requests" }
  ].filter((item) => item.value > 0);
  if (!counts.length) return <p className={styles.inlineEmpty}>{ar ? "لا توجد طلبات أو متابعات مرتبطة بعد." : "No linked orders or follow-up actions yet."}</p>;
  return <p className={styles.linkedSummary}>{counts.map((item) => `${item.value} ${item.label}`).join(" · ")}</p>;
}

function Stage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <>
    <header className={styles.stageHeader}>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
    {children}
  </>;
}

function StructuredSummary({ value, kind }: { value: Record<string, unknown>; kind: "history" | "examination" }) {
  const rows = kind === "history"
    ? [...array(value.complaints), ...array(value.history)]
    : Object.entries(record(value.examination) ?? {}).map(([label, finding]) => ({ label, finding }));
  if (!rows.length) return <p className={styles.inlineEmpty}>No structured {kind} items have been recorded.</p>;
  return <details className={styles.structuredSummary}><summary>Structured {kind}</summary><ul>{rows.map((row, index) => {
    const item = record(row);
    return <li key={String(item?.id ?? item?.label ?? index)}>{String(item?.label ?? item?.category ?? displayValue(row))}{item?.finding ? `: ${String(item.finding)}` : ""}</li>;
  })}</ul></details>;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <section><h3>{label}</h3><p>{value || "Not documented"}</p></section>;
}

function SafetyFact({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className={`${styles.safetyFact} ${warning ? styles.safetyWarning : ""}`}><strong>{label}</strong><span>{value}</span></div>;
}

function WorkspaceFailure({ title, detail, retry }: { title: string; detail: string; retry?: () => Promise<void> }) {
  return <main className={styles.statePanel} role="alert"><h1>{title}</h1><p>{detail}</p>{retry ? <button type="button" onClick={() => void retry()}>Retry</button> : null}</main>;
}

function visitGroupState(group: VisitGroupKey, controller: EncounterWorkspaceController, ar: boolean) {
  if (controller.isReadOnly) return { label: ar ? "مكتملة" : "Completed", icon: "✓", tone: "complete" };
  if (group === "note") {
    const complete = Boolean(controller.draft.chiefComplaint && controller.draft.historyText && controller.draft.examText && controller.draft.assessmentText);
    return complete
      ? { label: ar ? "موثقة" : "Documented", icon: "✓", tone: "complete" }
      : { label: ar ? "قيد التوثيق" : "In progress", icon: "•", tone: "incomplete" };
  }
  if (group === "orders") {
    const complete = Boolean(controller.draft.planText || (controller.visit?.prescriptions?.length ?? 0) + (controller.visit?.followUps?.length ?? 0) + (controller.visit?.investigationOrders?.length ?? 0) > 0);
    return complete
      ? { label: ar ? "موثقة" : "Documented", icon: "✓", tone: "complete" }
      : { label: ar ? "اختياري" : "Optional", icon: "•", tone: "incomplete" };
  }
  if (controller.saveState === "conflict" || (controller.readiness?.issues.some((issue) => issue.severity === "blocking") ?? false)) {
    return { label: ar ? "متعذرة" : "Blocked", icon: "!", tone: "blocked" };
  }
  if (controller.saveState !== "saved") return { label: ar ? "غير محفوظة" : "Unsaved", icon: "!", tone: "warningTone" };
  return controller.readiness?.ready
    ? { label: ar ? "جاهزة" : "Ready", icon: "✓", tone: "complete" }
    : { label: ar ? "تحتاج مراجعة" : "Needs review", icon: "•", tone: "incomplete" };
}

function stageLabel(stage: EncounterStageKey, ar: boolean) {
  const match = encounterStages.find((item) => item.key === stage);
  return match ? (ar ? match.ar : match.label) : stage;
}

function workspaceSaveLabel(state: EncounterWorkspaceController["saveState"], ar: boolean) {
  if (!ar) return state === "saved" ? "Saved" : state === "saving" ? "Saving…" : state === "waiting-sync" ? "Waiting to sync" : state === "conflict" ? "Version conflict" : state === "failed" ? "Save failed" : state === "completed" || state === "read-only" ? "Read-only" : "Ready";
  return state === "saved" ? "تم الحفظ" : state === "saving" ? "جارٍ الحفظ…" : state === "waiting-sync" ? "بانتظار المزامنة" : state === "conflict" ? "تعارض في الإصدار" : state === "failed" ? "فشل الحفظ" : state === "completed" || state === "read-only" ? "للقراءة فقط" : "جاهز";
}

function visitStatusLabel(status: string, ar: boolean) {
  if (status === "signed") return ar ? "موقعة" : "Signed";
  if (status === "voided") return ar ? "ملغاة" : "Voided";
  return ar ? "مسودة" : "Draft";
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function array(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item) => record(item)).map((item) => item as Record<string, unknown>) : [];
}

function displayValue(value: unknown) {
  if (value && typeof value === "object") return String(record(value)?.name ?? record(value)?.label ?? "Record");
  return String(value ?? "");
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pregnancyContext(value: Record<string, unknown>) {
  return [value.status, value.estimatedDueDate ? `EDD ${String(value.estimatedDueDate).slice(0, 10)}` : null].filter(Boolean).join(" · ") || "Active pregnancy";
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : value;
}

function ageFromDate(value: string) {
  const birth = new Date(value);
  if (!Number.isFinite(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
