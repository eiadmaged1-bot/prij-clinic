"use client";

import { FormEvent, useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { UniversalSearchBox } from "../../components/clinic/UniversalSearchBox";
import { PatientPicker, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { AppShell, SafetyAlert } from "../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";

type Shortcut = { id: string; displayName: string; genericName: string; defaultDoseText?: string | null; defaultTimingText?: string | null; defaultDurationText?: string | null; defaultInstructions?: string | null };
type Template = { id: string; title: string; category?: string | null; diagnosisOrUseCase?: string | null; itemsJson?: PrescriptionItem[] };
type PrescriptionItem = { medicationName: string; strengthText?: string; dosageForm?: string; dose?: string; route?: string; frequency?: string; duration?: string; instructions?: string; notes?: string };
type Patient = PatientPickerPatient;

const emptyItem: PrescriptionItem = { medicationName: "", strengthText: "", dosageForm: "", dose: "", route: "", frequency: "", duration: "", instructions: "", notes: "" };

export default function PrescriptionsPage() {
  const [active, setActive] = useState("builder");
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
  const patients: Patient[] = [];
  const [items, setItems] = useState<PrescriptionItem[]>([{ ...emptyItem }]);
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Ready");
  const [patientContext, setPatientContext] = useState<Record<string, unknown> | null>(null);
  const [reviewHints, setReviewHints] = useState<Array<{ message?: string }>>([]);
  const [doctorReviewed, setDoctorReviewed] = useState(false);
  const [alertsHandled, setAlertsHandled] = useState(false);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routePatientId = params.get("patientId");
    const routeVisitId = params.get("visitId") ?? params.get("encounterId");
    if (routePatientId) setPatientId(routePatientId);
    if (routeVisitId) setEncounterId(routeVisitId);
    void load();
  }, []);

  useEffect(() => {
    if (!patientId) { setPatientContext(null); setReviewHints([]); return; }
    void Promise.all([apiGet(`/patients/${patientId}`), apiGet(`/patients/${patientId}/follow-up-hints`)]).then(([patient, hints]) => {
      setPatientContext(patient as Record<string, unknown>);
      setReviewHints(((hints.hints ?? hints.followUpHints ?? []) as Array<{ message?: string }>).filter((hint) => hint.message));
    });
  }, [patientId]);

  useEffect(() => { setSavedPrescriptionId(""); setDoctorReviewed(false); }, [items, notes]);

  async function load() {
    const [shortcutData, templateData, prescriptionData] = await Promise.all([
      apiGet("/prescriptions/shortcuts"),
      apiGet("/prescriptions/templates"),
      apiGet("/prescriptions")
    ]);
    setShortcuts((shortcutData.doctorMedicationShortcuts ?? []) as Shortcut[]);
    setTemplates((templateData.prescriptionTemplates ?? []) as Template[]);
    setRecent((prescriptionData.prescriptions ?? []) as Record<string, unknown>[]);
  }

  async function savePrescription(nextStatus = "draft") {
    setStatus("Saving printable prescription");
    const cleanItems = items.map((item) => ({
      medicationName: item.medicationName.trim(),
      strengthText: item.strengthText?.trim(),
      dosageForm: item.dosageForm?.trim(),
      dose: item.dose?.trim(),
      route: item.route?.trim(),
      frequency: item.frequency?.trim(),
      duration: item.duration?.trim(),
      instructions: item.instructions?.trim()
    })).filter((item) => item.medicationName);
    if (!cleanItems.length) {
      setStatus("Add at least one medication name.");
      return;
    }
    const response = await apiPost("/prescriptions", {
      patientId: patientId.trim() || undefined,
      encounterId: encounterId.trim() || undefined,
      sourceType: "manual",
      notes,
      printSnapshotJson: { items: cleanItems, notes, nextStatus },
      items: cleanItems
    });
    setStatus(response.ok ? "Draft saved. Doctor review remains required before printing." : "Could not save prescription. Open an active patient visit first.");
    if (response.ok) {
      const saved = await response.json().catch(() => ({})) as { id?: string };
      setSavedPrescriptionId(saved.id ?? "");
      void load();
    }
  }

  function addShortcut(shortcut: Shortcut) {
    setItems((current) => {
      const addition = {
        medicationName: shortcut.genericName || shortcut.displayName,
        dose: shortcut.defaultDoseText ?? "",
        frequency: shortcut.defaultTimingText ?? "",
        duration: shortcut.defaultDurationText ?? "",
        instructions: shortcut.defaultInstructions ?? ""
      };
      return current.length === 1 && !current[0]?.medicationName ? [addition] : [...current, addition];
    });
    setActive("builder");
  }

  function applyTemplate(template: Template) {
    const templateItems = Array.isArray(template.itemsJson) ? template.itemsJson : [];
    setItems(templateItems.length ? templateItems : [{ ...emptyItem }]);
    setNotes(template.diagnosisOrUseCase ?? "");
    setTemplateTitle(template.title);
    setEditingTemplateId(template.id);
    setActive("builder");
    setDoctorReviewed(false);
    setAlertsHandled(false);
    setSavedPrescriptionId("");
  }

  const readyItems = items.filter((item) => item.medicationName.trim() && item.dose?.trim() && item.frequency?.trim() && item.duration?.trim());
  const printReady = Boolean(patientId && encounterId && savedPrescriptionId && readyItems.length === items.length && doctorReviewed && alertsHandled);

  function moveItem(index: number, direction: -1 | 1) {
    setItems((current) => {
      const target = index + direction;
      const source = current[index];
      const destination = current[target];
      if (!source || !destination) return current;
      const next = [...current]; next[index] = destination; next[target] = source; return next;
    });
  }

  async function saveCurrentTemplate() {
    if (!templateTitle.trim() || readyItems.length !== items.length) { setStatus("Name the template and complete all medication rows first."); return; }
    const response = editingTemplateId
      ? await apiRequest(`/prescriptions/templates/${editingTemplateId}`, "PATCH", { title: templateTitle.trim(), items, notes })
      : await apiPost("/prescriptions/templates", { title: templateTitle.trim(), items, notes });
    setStatus(response.ok ? "Prescription template saved." : "Could not save prescription template.");
    if (response.ok) { setTemplateTitle(""); setEditingTemplateId(""); void load(); }
  }

  async function preparePrint() {
    if (!printReady) return;
    const response = await apiRequest(`/prescriptions/${savedPrescriptionId}/sign`, "PATCH");
    if (!response.ok) { setStatus("Could not approve this prescription for printing."); return; }
    window.open(`/prescriptions/${savedPrescriptionId}/print`, "_blank", "noopener,noreferrer");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Doctor prescription center</p>
            <h1>Printable Prescription</h1>
          </div>
          <button className="button secondary compact" type="button" disabled={!printReady} onClick={() => void preparePrint()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print
          </button>
        </div>
        <p className="muted">Doctor manual review required. No auto-prescribing or automatic dosing.</p>
      </section>
      <SafetyAlert />
      <section className="patient-tabs simple">
        {([
          ["builder", "Printable Builder"],
          ["templates", "Saved Prescription Templates"],
          ["shortcuts", "My Saved Medications"],
          ["recent", "Recent Patient Prescriptions"]
        ] as const).map(([key, label]) => <button className={`tab-button ${active === key ? "active" : ""}`} key={key} onClick={() => setActive(key)} type="button">{label}</button>)}
      </section>

      {active === "builder" ? (
        <section className="panel printable-summary">
          <div className="section-heading">
            <div>
              <h2>Prescription Builder</h2>
              <p className="muted">Search medication first, then attach to the selected patient file or open from patient profile.</p>
            </div>
            <span className="badge">{status}</span>
          </div>
          <UniversalSearchBox scope="prescriptions" />
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void savePrescription(); }}>
            <div className="wide">
              {encounterId ? <div className="selected-patient-card"><strong>{patientDisplayName(patientContext) || "Locked active visit"}</strong><span>MRN: {String(patientContext?.medicalRecordNumber ?? "Not configured")} · Age: {patientAge(patientContext?.dateOfBirth)}</span><span>Allergies, pregnancy/lactation, and current medicines require doctor review.</span>{reviewHints.slice(0, 3).map((hint, index) => <small key={`${hint.message}-${index}`}>{hint.message}</small>)}</div> : <PatientPicker patients={patients} selectedPatientId={patientId} onSelect={setPatientId} required standaloneLabel="Select a patient and active visit before saving." />}
            </div>
            {items.map((item, index) => (
              <div className="panel compact-panel" key={index}>
                <div className="section-heading compact-section-heading">
                  <h3>Medication {index + 1}</h3>
                  <div className="form-actions"><button className="button secondary compact" type="button" onClick={() => moveItem(index, -1)} disabled={index === 0}>Move up</button><button className="button secondary compact" type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>Move down</button><button className="button secondary compact" type="button" onClick={() => setItems((current) => [...current.slice(0, index + 1), { ...item }, ...current.slice(index + 1)])}>Duplicate</button><button className="button secondary compact" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1}>Remove</button></div>
                </div>
                <label>Medication<input required value={item.medicationName} onChange={(event) => updateItem(index, "medicationName", event.target.value, setItems)} /></label>
                <label>Strength<input value={item.strengthText ?? ""} onChange={(event) => updateItem(index, "strengthText", event.target.value, setItems)} /></label>
                <label>Form<input value={item.dosageForm ?? ""} onChange={(event) => updateItem(index, "dosageForm", event.target.value, setItems)} /></label>
                <label>Dose text<input value={item.dose ?? ""} onChange={(event) => updateItem(index, "dose", event.target.value, setItems)} /></label>
                <label>Route<input value={item.route ?? ""} onChange={(event) => updateItem(index, "route", event.target.value, setItems)} /></label>
                <label>Timing<input value={item.frequency ?? ""} onChange={(event) => updateItem(index, "frequency", event.target.value, setItems)} /></label>
                <label>Duration<input value={item.duration ?? ""} onChange={(event) => updateItem(index, "duration", event.target.value, setItems)} /></label>
                <label>Instructions<input value={item.instructions ?? ""} onChange={(event) => updateItem(index, "instructions", event.target.value, setItems)} /></label>
              </div>
            ))}
            <label>Prescription notes<input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={alertsHandled} onChange={(event) => setAlertsHandled(event.target.checked)} />I reviewed patient-specific alerts and prerequisites.</label>
            <label className="checkbox-row"><input type="checkbox" checked={doctorReviewed} onChange={(event) => setDoctorReviewed(event.target.checked)} />Doctor reviewed this prescription draft.</label>
            <div className="form-actions wide"><input aria-label="Prescription template name" value={templateTitle} onChange={(event) => setTemplateTitle(event.target.value)} placeholder="Template name" /><button className="button secondary" type="button" onClick={() => void saveCurrentTemplate()}>{editingTemplateId ? "Save template changes" : "Save current rows as template"}</button>{editingTemplateId ? <button className="button secondary" type="button" onClick={() => { setEditingTemplateId(""); setTemplateTitle(""); }}>Cancel template edit</button> : null}</div>
            <div className="form-actions">
              <button className="button secondary" type="button" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>Add medication</button>
              <button className="button secondary" type="button" onClick={() => setStatus(patientId && encounterId ? "Patient-aware safety check is assistive. Doctor review required." : "Reference mode only. Select a patient and active visit to run allergy, pregnancy, lactation, and interaction checks.")}>Safety check</button>
              <button className="button" type="submit">Save draft</button>
              <button className="button secondary" type="button" disabled={!printReady} onClick={() => void preparePrint()}>Review, sign and print A5</button>
            </div>
          </form>
        </section>
      ) : null}

      {active === "templates" ? <TemplatePanel templates={templates} onApply={applyTemplate} onSaved={load} /> : null}
      {active === "shortcuts" ? <ShortcutPanel shortcuts={shortcuts} onAdd={addShortcut} onSaved={load} /> : null}
      {active === "recent" ? <RecordList rows={recent} /> : null}
    </AppShell>
  );
}

function TemplatePanel({ templates, onApply, onSaved }: { templates: Template[]; onApply: (template: Template) => void; onSaved: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const medicationName = String(form.get("medicationName") ?? "").trim();
    const response = await apiPost("/prescriptions/templates", {
      title: String(form.get("title") ?? "").trim(),
      category: String(form.get("category") ?? "").trim(),
      diagnosisOrUseCase: String(form.get("useCase") ?? "").trim(),
      items: [{ medicationName }]
    });
    if (response.ok) onSaved();
    event.currentTarget.reset();
  }

  async function action(template: Template, actionName: "duplicate" | "archive") {
    const response = actionName === "archive" ? await apiRequest(`/prescriptions/templates/${template.id}`, "DELETE") : await apiPost(`/prescriptions/templates/${template.id}/duplicate`, {});
    if (response.ok) onSaved();
  }

  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Saved Prescription Templates</h2><span className="badge">{templates.length}</span></div><div className="data-list">{templates.map((template) => <article className="data-row" key={template.id}><div className="data-row-header"><strong>{template.title}</strong><span className="badge">{template.category ?? "Template"}</span></div><p className="muted">{template.diagnosisOrUseCase ?? "Draft support template"}</p><div className="form-actions"><button className="button secondary compact" type="button" onClick={() => onApply(template)}>Apply / edit in builder</button><button className="button secondary compact" type="button" onClick={() => void action(template, "duplicate")}>Duplicate</button><button className="button secondary compact" type="button" onClick={() => void action(template, "archive")}>Archive</button></div></article>)}</div></article><article className="panel"><h2>Create template</h2><p className="muted">For multi-medication templates, arrange the rows in the builder and save them there.</p><form className="form-grid" onSubmit={submit}><label>Title<input name="title" required /></label><label>Category<input name="category" /></label><label>Use case<input name="useCase" /></label><label>Medication name<input name="medicationName" required /></label><button className="button" type="submit">Save template</button></form></article></section>;
}

function ShortcutPanel({ shortcuts, onAdd, onSaved }: { shortcuts: Shortcut[]; onAdd: (shortcut: Shortcut) => void; onSaved: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await apiPost("/prescriptions/shortcuts", Object.fromEntries(form.entries()));
    if (response.ok) onSaved();
    event.currentTarget.reset();
  }

  async function edit(event: FormEvent<HTMLFormElement>, shortcut: Shortcut) {
    event.preventDefault();
    const response = await apiRequest(`/prescriptions/shortcuts/${shortcut.id}`, "PATCH", Object.fromEntries(new FormData(event.currentTarget).entries()));
    if (response.ok) onSaved();
  }

  async function archive(shortcut: Shortcut) {
    const response = await apiRequest(`/prescriptions/shortcuts/${shortcut.id}`, "DELETE");
    if (response.ok) onSaved();
  }

  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>My Saved Medications</h2><span className="badge">{shortcuts.length}</span></div><div className="data-list">{shortcuts.map((shortcut) => <article className="data-row" key={shortcut.id}><div className="data-row-header"><strong>{shortcut.displayName}</strong><span className="badge">{shortcut.genericName}</span></div><p className="muted">{shortcut.defaultInstructions ?? "Editable before saving to a patient."}</p><div className="form-actions"><button className="button secondary compact" type="button" onClick={() => onAdd(shortcut)}>Add to builder</button><button className="button secondary compact" type="button" onClick={() => void archive(shortcut)}>Archive</button></div><details><summary>Edit shortcut</summary><form className="form-grid" onSubmit={(event) => void edit(event, shortcut)}><label>Display name<input name="displayName" required defaultValue={shortcut.displayName} /></label><label>Generic name<input name="genericName" required defaultValue={shortcut.genericName} /></label><label>Dose text<input name="defaultDoseText" defaultValue={shortcut.defaultDoseText ?? ""} /></label><label>Timing<input name="defaultTimingText" defaultValue={shortcut.defaultTimingText ?? ""} /></label><label>Duration<input name="defaultDurationText" defaultValue={shortcut.defaultDurationText ?? ""} /></label><label>Instructions<input name="defaultInstructions" defaultValue={shortcut.defaultInstructions ?? ""} /></label><button className="button" type="submit">Save changes</button></form></details></article>)}</div></article><article className="panel"><h2>Add saved medication</h2><form className="form-grid" onSubmit={submit}><label>Display name<input name="displayName" required /></label><label>Generic name<input name="genericName" required /></label><label>Optional brand or trade name<input name="optionalBrandOrTradeName" /></label><label>Dose text<input name="defaultDoseText" /></label><label>Timing<input name="defaultTimingText" /></label><label>Duration<input name="defaultDurationText" /></label><label>Instructions<input name="defaultInstructions" /></label><button className="button" type="submit">Save medication</button></form></article></section>;
}

function RecordList({ rows }: { rows: Record<string, unknown>[] }) {
  return <section className="panel"><div className="section-heading"><h2>Recent Patient Prescriptions</h2><span className="badge">{rows.length}</span></div><div className="data-list">{rows.map((row, index) => <article className="data-row" key={String(row.id ?? index)}><div className="data-row-header"><strong>{String(row.notes ?? "Prescription")}</strong><span className="badge">{String(row.status ?? "draft")}</span></div><p className="muted">Patient-linked prescription history. Review manually before continuing.</p></article>)}</div></section>;
}

function updateItem(index: number, key: keyof PrescriptionItem, value: string, setItems: (updater: (current: PrescriptionItem[]) => PrescriptionItem[]) => void) {
  setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
}

async function apiGet(endpoint: string) {
  const token = sessionStorage.getItem("prijClinicToken");
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
  return response?.ok ? response.json() : {};
}

async function apiPost(endpoint: string, payload: Record<string, unknown>) {
  return apiRequest(endpoint, "POST", payload);
}

async function apiRequest(endpoint: string, method: "POST" | "PATCH" | "DELETE", payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 500 }));
}

function patientDisplayName(patient: Record<string, unknown> | null) {
  if (!patient) return "";
  return String(patient.displayName ?? [patient.firstName, patient.lastName].filter(Boolean).join(" ")).trim();
}

function patientAge(value: unknown) {
  if (!value) return "Not recorded";
  const birth = new Date(String(value));
  if (Number.isNaN(birth.getTime())) return "Not recorded";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
  return `${Math.max(age, 0)} years`;
}
