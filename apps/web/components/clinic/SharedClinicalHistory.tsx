"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import {
  historyGuidance,
  historySections,
  resolveHistoryContext,
  visibleHistorySections,
  type HistoryFieldDefinition,
  type HistorySectionDefinition
} from "@/lib/history-guidance";
import type { EncounterWorkspaceController } from "./SharedEncounterWorkspaceController";
import styles from "./shared-clinical-history.module.css";

type StructuredField = { status?: string; detail?: string };
type StructuredSection = Record<string, StructuredField>;
type ClinicalHistory = {
  version?: number;
  context?: string;
  concerns?: Array<{ id: string; label: string; source: "doctor-entered" }>;
  sections?: Record<string, StructuredSection>;
};

const fieldStates = [
  ["documented", "Document", "توثيق"],
  ["none", "No", "لا"],
  ["denied", "Explicitly denied", "منفي صراحةً"],
  ["unknown", "Unknown", "غير معروف"],
  ["not_assessed", "Not assessed", "لم يُقيّم"]
] as const;

export function SharedClinicalHistoryEditor({ controller, compact = false }: { controller: EncounterWorkspaceController; compact?: boolean }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const root = object(controller.draft.examinationJson) ?? {};
  const clinicalHistory = readClinicalHistory(root);
  const recordedSections = Object.entries(clinicalHistory.sections ?? {}).filter(([, value]) => Object.keys(value).length).map(([key]) => key);
  const context = resolveHistoryContext({
    patientType: controller.patient?.patientType,
    chiefComplaint: controller.draft.chiefComplaint,
    pregnancyEpisode: controller.visit?.pregnancyEpisode,
    infertilityEpisode: controller.visit?.infertilityEpisode,
    structuredHistory: clinicalHistory
  });
  const definitions = visibleHistorySections(context, recordedSections);
  const [manualSections, setManualSections] = useState<string[]>([]);
  const [concernInput, setConcernInput] = useState("");
  const undoRef = useRef<ClinicalHistory | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const readOnly = controller.isReadOnly;
  const conflict = controller.saveState === "conflict";
  const guidance = historyGuidance[context];

  if (readOnly) return <HistoryReadOnlyView controller={controller} />;

  function commit(next: ClinicalHistory, patch: { chiefComplaint?: string; historyText?: string } = {}) {
    undoRef.current = clinicalHistory;
    controller.updateDraft({
      ...patch,
      examinationJson: {
        ...root,
        clinicalHistory: { ...next, version: 1, context },
        complaints: (next.concerns ?? []).map((item) => ({ ...item, sourceEncounterId: controller.encounterId }))
      }
    });
  }

  function updateField(sectionId: string, fieldId: string, patch: StructuredField | null) {
    const sections = { ...(clinicalHistory.sections ?? {}) };
    const section = { ...(sections[sectionId] ?? {}) };
    if (patch === null) delete section[fieldId];
    else section[fieldId] = { ...(section[fieldId] ?? {}), ...patch };
    if (Object.keys(section).length) sections[sectionId] = section;
    else delete sections[sectionId];
    commit({ ...clinicalHistory, sections });
  }

  function addConcern(label: string) {
    const value = label.trim();
    if (!value) return;
    const concerns = clinicalHistory.concerns ?? [];
    if (concerns.some((item) => item.label.toLowerCase() === value.toLowerCase())) return;
    const next = [...concerns, { id: `concern-${Date.now()}-${concerns.length}`, label: value, source: "doctor-entered" as const }];
    const existing = controller.draft.chiefComplaint.trim();
    commit({ ...clinicalHistory, concerns: next }, { chiefComplaint: existing ? `${existing}; ${value}` : value });
    setConcernInput("");
  }

  function removeConcern(id: string) {
    const concern = clinicalHistory.concerns?.find((item) => item.id === id);
    const concerns = (clinicalHistory.concerns ?? []).filter((item) => item.id !== id);
    const complaint = concern ? controller.draft.chiefComplaint.split(";").map((part) => part.trim()).filter((part) => part.toLowerCase() !== concern.label.toLowerCase()).join("; ") : controller.draft.chiefComplaint;
    commit({ ...clinicalHistory, concerns }, { chiefComplaint: complaint });
  }

  function focusField(sectionId: string, fieldId: string) {
    setManualSections((current) => current.includes(sectionId) ? current : [...current, sectionId]);
    window.setTimeout(() => { const target = fieldRefs.current[`${sectionId}:${fieldId}`]; const section = target?.closest("details") as HTMLDetailsElement | null; if (section) section.open = true; target?.focus(); }, 0);
  }

  const visible = definitions.filter((section) => {
    if (!section.contexts?.length) return true;
    if (section.contexts.includes(context)) return true;
    if (recordedSections.includes(section.id)) return true;
    return manualSections.includes(section.id);
  });
  const hidden = definitions.filter((section) => !visible.includes(section));

  return <div className={`${styles.history} ${compact ? styles.compact : ""}`} dir={ar ? "rtl" : "ltr"}>
    <section className={styles.concern} aria-labelledby="presenting-concern-title">
      <div className={styles.sectionHeading}>
        <div>
          <h3 id="presenting-concern-title">{ar ? "الشكوى الحالية" : "Presenting concern"} <span aria-hidden="true">*</span></h3>
          <p>{ar ? "اختيارات التوثيق لا تُنشئ شكوى تلقائياً." : "Documentation choices never create a concern automatically."}</p>
        </div>
        <span className={styles.contextLabel}>{ar ? guidance.labelAr : guidance.label}</span>
      </div>
      <label className={styles.fullField}>
        <span>{ar ? "الشكوى المطلوبة" : "Required complaint"}</span>
        <input aria-describedby="presenting-concern-help" disabled={conflict} value={controller.draft.chiefComplaint} onChange={(event) => controller.updateDraft({ chiefComplaint: event.target.value })} />
      </label>
      <small id="presenting-concern-help">{ar ? "مطلوبة بموجب عقد إكمال الزيارة الحالي." : "Required by the existing encounter completion contract."}</small>
      <div className={styles.guidance} aria-label={ar ? "اختيارات سريعة للشكوى" : "Quick concern choices"}>
        {guidance.complaintChoices.map(([label, labelAr]) => <button disabled={conflict} key={label} type="button" onClick={() => addConcern(ar ? labelAr : label)}>+ {ar ? labelAr : label}</button>)}
      </div>
      <div className={styles.addRow}>
        <label><span>{ar ? "شكوى إضافية" : "Additional concern"}</span><input disabled={conflict} value={concernInput} onChange={(event) => setConcernInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addConcern(concernInput); } }} /></label>
        <button disabled={conflict || !concernInput.trim()} type="button" onClick={() => addConcern(concernInput)}>{ar ? "إضافة" : "Add"}</button>
      </div>
      {(clinicalHistory.concerns ?? []).length ? <ul className={styles.concernList}>{clinicalHistory.concerns!.map((item) => <li key={item.id}><span>{item.label}</span><button disabled={conflict} type="button" onClick={() => removeConcern(item.id)}>{ar ? "إزالة" : "Remove"}</button></li>)}</ul> : null}
    </section>

    <nav className={styles.guideRail} aria-label={ar ? "إرشادات توثيق التاريخ" : "History documentation guidance"}>
      <strong>{ar ? "انتقل إلى توثيق" : "Jump to documentation"}</strong>
      {historySections[0]!.fields.slice(0, 6).map((field) => <button key={field.id} type="button" onClick={() => focusField("hpi", field.id)}>{ar ? field.labelAr : field.label}</button>)}
    </nav>

    <LongitudinalHistorySnapshot ar={ar} controller={controller} />

    <div className={styles.sectionList}>
      {visible.map((section, index) => <HistorySectionEditor
        ar={ar}
        conflict={conflict}
        definition={section}
        fieldRefs={fieldRefs}
        key={section.id}
        open={index < 1 || recordedSections.includes(section.id) || manualSections.includes(section.id)}
        section={clinicalHistory.sections?.[section.id] ?? {}}
        updateField={updateField}
      />)}
    </div>

    {hidden.length ? <details className={styles.moreSections}><summary>{ar ? "إظهار أقسام إضافية" : "Show additional History sections"}</summary><div>{hidden.map((section) => <button key={section.id} type="button" onClick={() => setManualSections((current) => [...current, section.id])}>{ar ? section.titleAr : section.title}</button>)}</div></details> : null}

    <section className={styles.narrative}>
      <label>
        <span>{ar ? "ملاحظات تاريخ مرضي إضافية" : "Additional History notes"}</span>
        <textarea disabled={conflict} value={controller.draft.historyText} onChange={(event) => controller.updateDraft({ historyText: event.target.value })} />
      </label>
      <p>{ar ? "احتفظ بالسرد للمعلومات التي لا تمثلها الحقول المنظمة." : "Use narrative for information not represented by structured fields."}</p>
    </section>

    {legacyItems(root).length ? <section className={styles.legacy}><h3>{ar ? "بيانات منظمة سابقة" : "Previously recorded structured data"}</h3><ul>{legacyItems(root).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section> : null}

    <div className={styles.editorStatus} role="status" aria-live="polite">
      <span><strong>{localizedSaveMessage(controller.saveState, ar)}</strong>{controller.dirty ? ` · ${ar ? "تغييرات غير محفوظة" : "Unsaved changes"}` : ""}</span>
      {undoRef.current ? <button disabled={conflict} type="button" onClick={() => { const previous = undoRef.current; undoRef.current = null; if (previous) controller.updateDraft({ examinationJson: { ...root, clinicalHistory: previous, complaints: (previous.concerns ?? []).map((item) => ({ ...item, sourceEncounterId: controller.encounterId })) } }); }}>{ar ? "تراجع عن آخر تغيير منظم" : "Undo last structured change"}</button> : null}
    </div>
    {conflict ? <p className={styles.conflict} role="alert">{ar ? "يوجد تعارض في الإصدار. أعد تحميل نسخة الخادم وتسويتها قبل المتابعة." : "Version conflict. Reload and reconcile the server version before continuing."}</p> : null}
  </div>;
}

export function HistoryReadOnlyView({ controller }: { controller: EncounterWorkspaceController }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const root = object(controller.draft.examinationJson) ?? {};
  const clinicalHistory = readClinicalHistory(root);
  const summaries = historySectionSummaries(clinicalHistory, ar);
  return <article className={styles.readOnly} dir={ar ? "rtl" : "ltr"}>
    <header><span>{ar ? "سجل مكتمل · للقراءة فقط" : "Completed record · read-only"}</span><h3>{ar ? "التاريخ المرضي الموثق" : "Documented History"}</h3><p>{ar ? "لا تتوفر عناصر تعديل لهذا السجل المكتمل." : "No editing controls are available for this completed record."}</p></header>
    <ReadOnlyBlock label={ar ? "الشكوى الحالية" : "Presenting concern"} value={controller.draft.chiefComplaint} />
    {summaries.map((summary) => <details key={summary.id} open={summary.id === "hpi"}><summary>{summary.title}<span>{summary.count}</span></summary><dl>{summary.items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></details>)}
    <ReadOnlyBlock label={ar ? "ملاحظات إضافية" : "Additional narrative"} value={controller.draft.historyText} />
    {legacyItems(root).length ? <section><h4>{ar ? "بيانات منظمة سابقة" : "Previously recorded structured data"}</h4><ul>{legacyItems(root).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section> : null}
    <footer>{ar ? "حالة الزيارة" : "Encounter status"}: {String(controller.encounter?.status ?? "completed")} · {ar ? "نسخة الخادم" : "Server revision"} {controller.serverRevision ? new Date(controller.serverRevision).toLocaleString(ar ? "ar-EG" : "en-GB") : (ar ? "غير متاح" : "Unavailable")}</footer>
  </article>;
}

export function historyReviewSummaries(controller: EncounterWorkspaceController, ar: boolean) {
  const history = readClinicalHistory(object(controller.draft.examinationJson) ?? {});
  return historySectionSummaries(history, ar);
}

function HistorySectionEditor({ definition, section, updateField, conflict, ar, open, fieldRefs }: {
  definition: HistorySectionDefinition;
  section: StructuredSection;
  updateField: (sectionId: string, fieldId: string, patch: StructuredField | null) => void;
  conflict: boolean;
  ar: boolean;
  open: boolean;
  fieldRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}) {
  const documented = Object.values(section).filter((item) => item.status || item.detail).length;
  return <details className={styles.historySection} id={`history-section-${definition.id}`} open={open} tabIndex={-1}>
    <summary><span><strong>{ar ? definition.titleAr : definition.title}</strong><small>{ar ? definition.descriptionAr : definition.description}</small></span><span>{documented ? `${documented} ${ar ? "موثق" : "documented"}` : (ar ? "لم يوثق" : "Not documented")}</span></summary>
    <fieldset disabled={conflict}><legend className="sr-only">{ar ? definition.titleAr : definition.title}</legend>
      {definition.fields.map((field) => <StructuredFieldEditor ar={ar} definition={field} key={field.id} elementRef={(element) => { fieldRefs.current[`${definition.id}:${field.id}`] = element; }} onChange={(patch) => updateField(definition.id, field.id, patch)} value={section[field.id]} />)}
    </fieldset>
  </details>;
}

const StructuredFieldEditor = function StructuredFieldEditor({ definition, value, onChange, ar, elementRef }: {
  definition: HistoryFieldDefinition;
  value?: StructuredField;
  onChange: (patch: StructuredField | null) => void;
  ar: boolean;
  elementRef: (element: HTMLElement | null) => void;
}) {
  const id = `history-${definition.id}`;
  const status = value?.status ?? "";
  return <details className={styles.structuredField} ref={elementRef as (element: HTMLDetailsElement | null) => void} tabIndex={-1}>
    <summary><span>{ar ? definition.labelAr : definition.label}</span><span>{value ? stateLabel(value, ar) : (ar ? "إضافة توثيق" : "Add documentation")}</span></summary>
    <div className={styles.fieldBody}>
      <div className={styles.fieldHeading}><label htmlFor={id}>{ar ? "تفاصيل التوثيق" : "Documentation details"}</label>{value ? <button type="button" onClick={() => onChange(null)}>{ar ? "مسح" : "Clear"}</button> : null}</div>
      {definition.prompt ? <small>{ar ? definition.promptAr : definition.prompt}</small> : null}
      <div className={styles.stateChoices} role="group" aria-label={`${ar ? definition.labelAr : definition.label}: ${ar ? "حالة التوثيق" : "documentation state"}`}>
        {fieldStates.map(([key, label, labelAr]) => <button aria-pressed={status === key} key={key} type="button" onClick={() => onChange({ status: key, detail: status === key ? value?.detail : "" })}>{ar ? labelAr : label}</button>)}
      </div>
      {status === "documented" || status === "denied" ? <input id={id} type={definition.type ?? "text"} value={value?.detail ?? ""} onChange={(event) => onChange({ status, detail: event.target.value })} /> : null}
    </div>
  </details>;
};

function LongitudinalHistorySnapshot({ controller, ar }: { controller: EncounterWorkspaceController; ar: boolean }) {
  const failed = controller.resourceErrors.some((error) => error.resource === "history");
  const sheet = object(controller.visit?.historySheet);
  const pregnancy = object(controller.visit?.pregnancyEpisode);
  const fertility = object(controller.visit?.infertilityEpisode);
  if (failed) return <p className={styles.contextFailure} role="alert">{ar ? "فشل تحميل التاريخ الطولي. لا تفسر ذلك على أنه لا يوجد تاريخ." : "Longitudinal History failed to load. Do not interpret this as no history."}</p>;
  const rows = [
    [ar ? "التاريخ المرضي" : "Medical history", sheet?.pastMedicalHistory],
    [ar ? "التاريخ الجراحي" : "Surgical history", sheet?.pastSurgicalHistory],
    [ar ? "الحساسية" : "Allergies", sheet?.allergyHistory],
    [ar ? "التاريخ العائلي" : "Family history", sheet?.familyHistory],
    [ar ? "سياق الحمل" : "Pregnancy context", pregnancy ? pregnancy.status ?? "Active episode" : null],
    [ar ? "سياق الخصوبة" : "Fertility context", fertility ? fertility.status ?? "Active episode" : null]
  ].filter((row) => row[1]);
  return <section className={styles.longitudinalSnapshot}><div><h3>{ar ? "السجل الطولي المحمل" : "Loaded longitudinal record"}</h3><span>{rows.length ? (ar ? "للمراجعة فقط" : "Review only") : (ar ? "لا توجد تفاصيل في حزمة الزيارة" : "No details in visit packet")}</span></div>{rows.length ? <dl>{rows.map(([label, value]) => <div key={String(label)}><dt>{String(label)}</dt><dd>{String(value)}</dd></div>)}</dl> : null}</section>;
}

function historySectionSummaries(history: ClinicalHistory, ar: boolean) {
  return historySections.map((definition) => {
    const section = history.sections?.[definition.id] ?? {};
    const items = definition.fields.flatMap((field) => {
      const value = section[field.id];
      if (!value?.status && !value?.detail) return [];
      return [{ label: ar ? field.labelAr : field.label, value: stateLabel(value, ar) }];
    });
    return { id: definition.id, title: ar ? definition.titleAr : definition.title, count: items.length, items };
  }).filter((summary) => summary.items.length);
}

function stateLabel(value: StructuredField, ar: boolean) {
  const state = fieldStates.find(([key]) => key === value.status);
  const label = state ? (ar ? state[2] : state[1]) : (ar ? "موثق" : "Documented");
  return value.detail ? `${label}: ${value.detail}` : label;
}

function ReadOnlyBlock({ label, value }: { label: string; value: string }) {
  return <section><h4>{label}</h4><p>{value || "Not documented"}</p></section>;
}

function readClinicalHistory(root: Record<string, unknown>): ClinicalHistory {
  return object(root.clinicalHistory) as ClinicalHistory ?? {};
}

function legacyItems(root: Record<string, unknown>) {
  return [...list(root.complaints), ...list(root.history)].map((value) => {
    const item = object(value);
    if (item?.source === "doctor-entered") return "";
    return String(item?.label ?? item?.category ?? item?.detail ?? value);
  }).filter(Boolean);
}

function localizedSaveMessage(state: EncounterWorkspaceController["saveState"], ar: boolean) {
  if (!ar) return state === "saved" ? "Saved" : state === "saving" ? "Saving…" : state === "waiting-sync" ? "Waiting to sync" : state === "conflict" ? "Version conflict" : state === "failed" ? "Save failed" : "Ready";
  return state === "saved" ? "تم الحفظ" : state === "saving" ? "جارٍ الحفظ…" : state === "waiting-sync" ? "بانتظار المزامنة" : state === "conflict" ? "تعارض في الإصدار" : state === "failed" ? "فشل الحفظ" : "جاهز";
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
