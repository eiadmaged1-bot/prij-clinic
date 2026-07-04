"use client";

import { FormEvent, useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { UniversalSearchBox } from "../../components/clinic/UniversalSearchBox";
import { PatientPicker, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { AppShell, SafetyAlert } from "../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";

type Shortcut = { id: string; displayName: string; genericName: string; defaultDoseText?: string | null; defaultTimingText?: string | null; defaultDurationText?: string | null; defaultInstructions?: string | null };
type Template = { id: string; title: string; category?: string | null; diagnosisOrUseCase?: string | null; itemsJson?: PrescriptionItem[] };
type PrescriptionItem = { medicationName: string; dose?: string; frequency?: string; duration?: string; instructions?: string; notes?: string };
type Patient = PatientPickerPatient;

const emptyItem: PrescriptionItem = { medicationName: "", dose: "", frequency: "", duration: "", instructions: "", notes: "" };

export default function PrescriptionsPage() {
  const [active, setActive] = useState("builder");
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [items, setItems] = useState<PrescriptionItem[]>([{ ...emptyItem }]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routePatientId = params.get("patientId");
    if (routePatientId) setPatientId(routePatientId);
    void load();
  }, []);

  async function load() {
    const [shortcutData, templateData, prescriptionData, patientData] = await Promise.all([
      apiGet("/prescriptions/shortcuts"),
      apiGet("/prescriptions/templates"),
      apiGet("/prescriptions"),
      apiGet("/patients")
    ]);
    setShortcuts((shortcutData.doctorMedicationShortcuts ?? []) as Shortcut[]);
    setTemplates((templateData.prescriptionTemplates ?? []) as Template[]);
    setRecent((prescriptionData.prescriptions ?? []) as Record<string, unknown>[]);
    setPatients((patientData.patients ?? []) as Patient[]);
  }

  async function savePrescription(nextStatus = "draft") {
    setStatus("Saving printable prescription");
    const cleanItems = items.map((item) => ({
      medicationName: item.medicationName.trim(),
      dose: item.dose?.trim(),
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
      sourceType: "manual",
      notes,
      printSnapshotJson: { items: cleanItems, notes, nextStatus },
      items: cleanItems
    });
    setStatus(response.ok ? (patientId.trim() ? "Saved and attached to patient file." : "Standalone printable draft saved.") : "Could not save prescription.");
    if (response.ok) void load();
  }

  function addShortcut(shortcut: Shortcut) {
    setItems((current) => [
      ...current,
      {
        medicationName: shortcut.genericName || shortcut.displayName,
        dose: shortcut.defaultDoseText ?? "",
        frequency: shortcut.defaultTimingText ?? "",
        duration: shortcut.defaultDurationText ?? "",
        instructions: shortcut.defaultInstructions ?? ""
      }
    ]);
    setActive("builder");
  }

  function applyTemplate(template: Template) {
    const templateItems = Array.isArray(template.itemsJson) ? template.itemsJson : [];
    setItems(templateItems.length ? templateItems : [{ ...emptyItem }]);
    setNotes(template.diagnosisOrUseCase ?? "");
    setActive("builder");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Doctor prescription center</p>
            <h1>Printable Prescription</h1>
          </div>
          <button className="button secondary compact" type="button" onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print
          </button>
        </div>
        <p className="muted">Templates and saved medications are draft aids only. The doctor must manually review and edit every patient instruction before saving or signing.</p>
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
              <p className="muted">Attach to the selected patient file, or open from a patient profile to fill the patient automatically.</p>
            </div>
            <span className="badge">{status}</span>
          </div>
          <UniversalSearchBox scope="prescriptions" />
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void savePrescription(); }}>
            <div className="wide">
              <PatientPicker patients={patients} selectedPatientId={patientId} onSelect={setPatientId} allowStandalone standaloneLabel="Standalone print draft" />
            </div>
            {items.map((item, index) => (
              <div className="panel compact-panel" key={index}>
                <label>Medication name<input required value={item.medicationName} onChange={(event) => updateItem(index, "medicationName", event.target.value, setItems)} /></label>
                <label>Dose text<input value={item.dose ?? ""} onChange={(event) => updateItem(index, "dose", event.target.value, setItems)} /></label>
                <label>Timing<input value={item.frequency ?? ""} onChange={(event) => updateItem(index, "frequency", event.target.value, setItems)} /></label>
                <label>Duration<input value={item.duration ?? ""} onChange={(event) => updateItem(index, "duration", event.target.value, setItems)} /></label>
                <label>Instructions<input value={item.instructions ?? ""} onChange={(event) => updateItem(index, "instructions", event.target.value, setItems)} /></label>
              </div>
            ))}
            <label>Prescription notes<input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <div className="form-actions">
              <button className="button secondary" type="button" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>Add medication</button>
              <button className="button" type="submit">Save draft</button>
              <button className="button secondary" type="button" onClick={() => void savePrescription("printed")}>Save print snapshot</button>
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

  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Saved Prescription Templates</h2><span className="badge">{templates.length}</span></div><div className="data-list">{templates.map((template) => <article className="data-row" key={template.id}><div className="data-row-header"><strong>{template.title}</strong><span className="badge">{template.category ?? "Template"}</span></div><p className="muted">{template.diagnosisOrUseCase ?? "Draft support template"}</p><button className="button secondary compact" type="button" onClick={() => onApply(template)}>Use in builder</button></article>)}</div></article><article className="panel"><h2>Create template</h2><form className="form-grid" onSubmit={submit}><label>Title<input name="title" required /></label><label>Category<input name="category" /></label><label>Use case<input name="useCase" /></label><label>Medication name<input name="medicationName" required /></label><button className="button" type="submit">Save template</button></form></article></section>;
}

function ShortcutPanel({ shortcuts, onAdd, onSaved }: { shortcuts: Shortcut[]; onAdd: (shortcut: Shortcut) => void; onSaved: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await apiPost("/prescriptions/shortcuts", Object.fromEntries(form.entries()));
    if (response.ok) onSaved();
    event.currentTarget.reset();
  }

  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>My Saved Medications</h2><span className="badge">{shortcuts.length}</span></div><div className="data-list">{shortcuts.map((shortcut) => <article className="data-row" key={shortcut.id}><div className="data-row-header"><strong>{shortcut.displayName}</strong><span className="badge">{shortcut.genericName}</span></div><p className="muted">{shortcut.defaultInstructions ?? "Editable before saving to a patient."}</p><button className="button secondary compact" type="button" onClick={() => onAdd(shortcut)}>Add to builder</button></article>)}</div></article><article className="panel"><h2>Add saved medication</h2><form className="form-grid" onSubmit={submit}><label>Display name<input name="displayName" required /></label><label>Generic name<input name="genericName" required /></label><label>Optional brand or trade name<input name="optionalBrandOrTradeName" /></label><label>Dose text<input name="defaultDoseText" /></label><label>Timing<input name="defaultTimingText" /></label><label>Duration<input name="defaultDurationText" /></label><label>Instructions<input name="defaultInstructions" /></label><button className="button" type="submit">Save medication</button></form></article></section>;
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
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  }).catch(() => new Response(null, { status: 500 }));
}
