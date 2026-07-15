"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { UniversalSearchBox } from "../../components/clinic/UniversalSearchBox";
import { AppShell, SafetyAlert } from "../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";

type Shortcut = { id: string; displayName: string; genericName: string; defaultDoseText?: string | null; defaultTimingText?: string | null; defaultDurationText?: string | null; defaultInstructions?: string | null };
type Template = { id: string; title: string; category?: string | null; diagnosisOrUseCase?: string | null; ownerUserId?: string | null; clinicScope?: string | null; itemsJson?: PrescriptionItem[] };
type PrescriptionItem = { medicationName: string; medicationGenericId?: string; medicationProductId?: string; drugMarketVariantId?: string; optionalBrandOrTradeName?: string; strengthText?: string; dosageForm?: string; quantityText?: string; dispensingUnit?: string; dose?: string; doseUnit?: string; route?: string; frequency?: string; duration?: string; prn?: boolean; customReason?: string; instructions?: string; notes?: string; manualEntry?: boolean };
type MedicationResult = { type: string; id: string; productId?: string; genericName?: string | null; brandName?: string | null; tradeName?: string | null; strengthText?: string | null; dosageForm?: string | null };

const emptyItem: PrescriptionItem = { medicationName: "", strengthText: "", dosageForm: "", quantityText: "", dispensingUnit: "", dose: "", doseUnit: "", route: "", frequency: "", duration: "", prn: false, customReason: "", instructions: "", notes: "", manualEntry: true };

export default function PrescriptionsPage() {
  const [active, setActive] = useState("templates");
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
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
  const [templateScope, setTemplateScope] = useState<"personal" | "clinic">("personal");
  const [removedItem, setRemovedItem] = useState<{ item: PrescriptionItem; index: number } | null>(null);
  const [medicationQuery, setMedicationQuery] = useState("");
  const [medicationResults, setMedicationResults] = useState<MedicationResult[]>([]);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const lockedContext = Boolean(patientId && encounterId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routePatientId = params.get("patientId");
    const routeVisitId = params.get("visitId") ?? params.get("encounterId");
    const routeMedication = params.get("medication")?.trim();
    if (routePatientId) setPatientId(routePatientId);
    if (routeVisitId) setEncounterId(routeVisitId);
    if (routePatientId && routeVisitId) setActive("builder");
    if (routeMedication) setItems([{ ...emptyItem, medicationName: routeMedication }]);
    void load();
  }, []);

  useEffect(() => {
    if (!patientId) { setPatientContext(null); setReviewHints([]); return; }
    void Promise.all([apiGet(`/patients/${patientId}`), apiGet(`/patients/${patientId}/follow-up-hints`)]).then(([patient, hints]) => {
      setPatientContext(patient as Record<string, unknown>);
      setReviewHints(((hints.hints ?? hints.followUpHints ?? []) as Array<{ message?: string }>).filter((hint) => hint.message));
    });
  }, [patientId]);

  useEffect(() => { setSavedPrescriptionId(""); setDoctorReviewed(false); setIdentityConfirmed(false); }, [items, notes]);

  useEffect(() => {
    if (!lockedContext || medicationQuery.trim().length < 2) { setMedicationResults([]); return; }
    const timer = window.setTimeout(() => {
      void apiPost("/medications/search", { query: medicationQuery.trim() }).then(async (response) => {
        const data = response.ok ? await response.json() as { results?: MedicationResult[] } : {};
        setMedicationResults((data.results ?? []).filter((result) => result.type !== "family").slice(0, 10));
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [lockedContext, medicationQuery]);

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
    if (!lockedContext) {
      setStatus("Open a patient file and active visit before creating a prescription draft.");
      return;
    }
    setStatus("Saving printable prescription");
    const cleanItems = items.map((item) => ({
      medicationName: item.medicationName.trim(),
      medicationGenericId: item.medicationGenericId,
      medicationProductId: item.medicationProductId,
      drugMarketVariantId: item.drugMarketVariantId,
      optionalBrandOrTradeName: item.optionalBrandOrTradeName?.trim(),
      strengthText: item.strengthText?.trim(),
      dosageForm: item.dosageForm?.trim(),
      quantityText: item.quantityText?.trim(),
      dispensingUnit: item.dispensingUnit?.trim(),
      dose: item.dose?.trim(),
      doseUnit: item.doseUnit?.trim(),
      route: item.route?.trim(),
      frequency: item.frequency?.trim(),
      duration: item.duration?.trim(),
      prn: item.prn === true,
      customReason: item.customReason?.trim(),
      instructions: item.instructions?.trim(),
      manualEntry: item.manualEntry
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
    if (!lockedContext) {
      setStatus("Template ready. Open a patient file and active visit to apply it as a clinical draft.");
      return;
    }
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

  const readyItems = items.filter((item) => item.medicationName.trim() && item.strengthText?.trim() && item.dosageForm?.trim() && item.dose?.trim() && item.doseUnit?.trim() && item.route?.trim() && item.frequency?.trim() && item.duration?.trim() && item.quantityText?.trim() && (!item.manualEntry || item.customReason?.trim()));
  const printReady = Boolean(patientId && encounterId && savedPrescriptionId && readyItems.length === items.length && identityConfirmed && doctorReviewed && alertsHandled);

  function addCatalogMedication(result: MedicationResult) {
    const item: PrescriptionItem = {
      medicationName: result.genericName ?? result.tradeName ?? result.brandName ?? "Medication",
      optionalBrandOrTradeName: result.tradeName ?? result.brandName ?? "",
      strengthText: result.strengthText ?? "",
      dosageForm: result.dosageForm ?? "",
      medicationGenericId: ["ingredient", "generic_medication"].includes(result.type) ? result.id : undefined,
      medicationProductId: result.type === "product" ? result.id : result.productId,
      drugMarketVariantId: result.type === "market_variant" ? result.id : undefined,
      manualEntry: false
    };
    setItems((current) => {
      const duplicate = current.some((entry) => (item.medicationGenericId && entry.medicationGenericId === item.medicationGenericId) || (entry.medicationName.trim().toLocaleLowerCase() === item.medicationName.trim().toLocaleLowerCase() && (entry.strengthText ?? "") === (item.strengthText ?? "") && (entry.dosageForm ?? "") === (item.dosageForm ?? "")));
      if (duplicate) { setStatus("That medication, strength, and form is already selected."); return current; }
      return current.length === 1 && !current[0]?.medicationName ? [item] : [...current, item];
    });
    setMedicationQuery("");
    setMedicationResults([]);
  }

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
      : await apiPost("/prescriptions/templates", { title: templateTitle.trim(), templateScope, items, notes });
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
            <h1>{lockedContext ? "Patient Prescription Draft" : "Prescription Templates & Frequent Medications"}</h1>
          </div>
          {lockedContext ? <button className="button secondary compact" type="button" disabled={!printReady} onClick={() => void preparePrint()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print
          </button> : <Link className="button secondary compact" href="/patients">Open patient file</Link>}
        </div>
        <p className="muted">Doctor manual review required. No auto-prescribing or automatic dosing.</p>
      </section>
      <SafetyAlert />
      <section className="patient-tabs simple prescription-tabs" aria-label="Prescription Center sections">
        {([
          ...(lockedContext ? [["builder", "Patient Prescription"]] : []),
          ["templates", "Templates"],
          ["shortcuts", "Saved meds"],
          ["recent", "Recent"]
        ] as const).map(([key, label]) => <button className={`tab-button ${active === key ? "active" : ""}`} key={key} onClick={() => setActive(key)} type="button">{label}</button>)}
      </section>

      {!lockedContext ? <section className="panel compact-panel prescription-center-intro"><div><h2>Template and shortcut center</h2><p className="muted">Manage reusable medication shortcuts and prescription sets here. Clinical prescriptions can only be created from a selected patient and active visit.</p></div><Link className="button compact" href="/patients">Find patient</Link></section> : null}

      {active === "builder" && lockedContext ? (
        <section className="panel printable-summary">
          <div className="section-heading">
            <div>
              <h2>Prescription Builder</h2>
              <p className="muted">Search medication first, then attach to the selected patient file or open from patient profile.</p>
            </div>
            <span className="badge">{status}</span>
          </div>
          <UniversalSearchBox scope="prescriptions" />
          <div className="search-picker medication-catalog-picker">
            <label>Medication catalog search<input value={medicationQuery} onChange={(event) => setMedicationQuery(event.target.value)} placeholder="Generic, brand, trade name, or class" /></label>
            {medicationResults.length ? <div className="data-list">{medicationResults.map((result) => <button className="picker-row" key={`${result.type}-${result.id}`} onClick={() => addCatalogMedication(result)} type="button"><strong>{result.tradeName ?? result.brandName ?? result.genericName}</strong><span>{[result.genericName, result.strengthText, result.dosageForm].filter(Boolean).join(" · ")}</span></button>)}</div> : null}
          </div>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void savePrescription(); }}>
            <div className="wide">
              <div className="selected-patient-card"><strong>{patientDisplayName(patientContext) || "Locked active visit"}</strong><span>MRN: {String(patientContext?.medicalRecordNumber ?? "Not configured")} · Age: {patientAge(patientContext?.dateOfBirth)}</span><span>Allergies, pregnancy/lactation, and current medicines require doctor review.</span>{reviewHints.slice(0, 3).map((hint, index) => <small key={`${hint.message}-${index}`}>{hint.message}</small>)}</div>
            </div>
            {items.map((item, index) => (
              <details className="compact-editor-drawer medication-editor-card wide" key={index} open={!item.medicationName}>
                <summary><span><strong>{item.medicationName || `Medication ${index + 1}`}</strong><small>{[item.optionalBrandOrTradeName, item.strengthText, item.dosageForm, item.dose, item.frequency].filter(Boolean).join(" · ") || "Complete medication details"}</small></span><span className={`badge ${item.manualEntry ? "warning" : "accent"}`}>{item.manualEntry ? "Manual / unverified" : "Catalog linked"}</span></summary>
                <div className="form-grid compact-medication-fields">
                  <label>Generic / medication name<input value={item.medicationName} onChange={(event) => updateItem(index, "medicationName", event.target.value, setItems)} /></label>
                  <label>Optional brand / trade name<input value={item.optionalBrandOrTradeName ?? ""} onChange={(event) => updateItem(index, "optionalBrandOrTradeName", event.target.value, setItems)} /></label>
                  <label>Strength<input value={item.strengthText ?? ""} onChange={(event) => updateItem(index, "strengthText", event.target.value, setItems)} /></label>
                  <label>Dosage form<input value={item.dosageForm ?? ""} onChange={(event) => updateItem(index, "dosageForm", event.target.value, setItems)} /></label>
                  <label>Quantity<input value={item.quantityText ?? ""} onChange={(event) => updateItem(index, "quantityText", event.target.value, setItems)} placeholder="1" /></label>
                  <label>Dispensing unit<input value={item.dispensingUnit ?? ""} onChange={(event) => updateItem(index, "dispensingUnit", event.target.value, setItems)} placeholder="box or strip" /></label>
                  <label>Dose<input value={item.dose ?? ""} onChange={(event) => updateItem(index, "dose", event.target.value, setItems)} /></label>
                  <label>Dose unit<input value={item.doseUnit ?? ""} onChange={(event) => updateItem(index, "doseUnit", event.target.value, setItems)} placeholder="mg, mL, tablet" /></label>
                  <label>Route<input value={item.route ?? ""} onChange={(event) => updateItem(index, "route", event.target.value, setItems)} /></label>
                  <label>Frequency<input value={item.frequency ?? ""} onChange={(event) => updateItem(index, "frequency", event.target.value, setItems)} /></label>
                  <label>Duration<input value={item.duration ?? ""} onChange={(event) => updateItem(index, "duration", event.target.value, setItems)} /></label>
                  <label className="checkbox-row"><input type="checkbox" checked={item.prn === true} onChange={(event) => updateItem(index, "prn", event.target.checked, setItems)} />PRN / when needed</label>
                  {item.manualEntry ? <label className="wide">Reason for custom or unlisted medication<input value={item.customReason ?? ""} onChange={(event) => updateItem(index, "customReason", event.target.value, setItems)} required /></label> : null}
                  <label className="wide">Additional instructions<input value={item.instructions ?? ""} onChange={(event) => updateItem(index, "instructions", event.target.value, setItems)} /></label>
                  <div className="form-actions wide"><button className="button secondary compact" type="button" onClick={() => moveItem(index, -1)} disabled={index === 0}>Move up</button><button className="button secondary compact" type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>Move down</button><button className="button secondary compact" type="button" onClick={() => { if (window.confirm("Add a distinct formulation, route, or treatment phase?")) setItems((current) => [...current.slice(0, index + 1), { ...item } as PrescriptionItem, ...current.slice(index + 1)]); }}>Duplicate</button><button className="button secondary compact" type="button" onClick={() => { setRemovedItem({ item, index }); setItems((current) => current.filter((_, itemIndex) => itemIndex !== index)); }} disabled={items.length === 1}>Remove</button></div>
                </div>
              </details>
            ))}
            <label>Prescription notes<input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <section className="panel compact-panel wide prescription-review-panel"><h3>Doctor review</h3><label className="checkbox-row"><input type="checkbox" checked={identityConfirmed} onChange={(event) => setIdentityConfirmed(event.target.checked)} />Patient identity confirmed.</label><label className="checkbox-row"><input type="checkbox" checked={alertsHandled} onChange={(event) => setAlertsHandled(event.target.checked)} />Allergies, current medications, pregnancy and lactation reviewed.</label><label className="checkbox-row"><input type="checkbox" checked={doctorReviewed} onChange={(event) => setDoctorReviewed(event.target.checked)} />Dose, route, frequency, duration and instructions verified by the doctor.</label></section>
            {removedItem ? <div className="notice wide">Medication removed. <button className="button secondary compact" type="button" onClick={() => { setItems((current) => [...current.slice(0, removedItem.index), removedItem.item, ...current.slice(removedItem.index)]); setRemovedItem(null); }}>Undo remove</button></div> : null}
            <div className="form-actions wide"><input aria-label="Prescription template name" value={templateTitle} onChange={(event) => setTemplateTitle(event.target.value)} placeholder="Template name" />{!editingTemplateId ? <label>Template visibility<select value={templateScope} onChange={(event) => setTemplateScope(event.target.value as "personal" | "clinic")}><option value="personal">Personal template</option><option value="clinic">Clinic template (Owner/Admin only)</option></select></label> : null}<button className="button secondary" type="button" onClick={() => void saveCurrentTemplate()}>{editingTemplateId ? "Save template changes" : "Save current rows as template"}</button>{editingTemplateId ? <button className="button secondary" type="button" onClick={() => { setEditingTemplateId(""); setTemplateTitle(""); }}>Cancel template edit</button> : null}</div>
            <div className="form-actions">
              <button className="button secondary" type="button" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>More options · Add custom medication</button>
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
      templateScope: String(form.get("templateScope") ?? "personal"),
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

  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Saved Prescription Templates</h2><span className="badge">{templates.length}</span></div><div className="data-list">{templates.map((template) => <article className="data-row" key={template.id}><div className="data-row-header"><strong>{template.title}</strong><span className="badge">{template.clinicScope ? "Clinic" : "Personal"}</span></div><p className="muted">{template.diagnosisOrUseCase ?? "Draft support template"}</p><div className="form-actions"><button className="button secondary compact" type="button" onClick={() => onApply(template)}>Apply / edit in builder</button><button className="button secondary compact" type="button" onClick={() => void action(template, "duplicate")}>Duplicate</button><button className="button secondary compact" type="button" onClick={() => void action(template, "archive")}>Archive</button></div></article>)}</div></article><article className="panel"><h2>Create template</h2><p className="muted">For multi-medication templates, arrange the rows in the patient prescription builder and save them there.</p><p className="muted">Template creation from this management view starts a single generic row; it does not create a patient prescription.</p><form className="form-grid" onSubmit={submit}><label>Title<input name="title" required /></label><label>Visibility<select name="templateScope"><option value="personal">Personal template</option><option value="clinic">Clinic template (Owner/Admin only)</option></select></label><label>Category<input name="category" /></label><label>Use case<input name="useCase" /></label><label>Generic medication name<input name="medicationName" required /></label><button className="button" type="submit">Save template</button></form></article></section>;
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

function updateItem(index: number, key: keyof PrescriptionItem, value: string | boolean, setItems: (updater: (current: PrescriptionItem[]) => PrescriptionItem[]) => void) {
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
