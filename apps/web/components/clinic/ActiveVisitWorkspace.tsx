"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Action, hasAnyRolePermission } from "@prij-clinic/shared";
import { ThreeDMedicalIcon } from "../ThreeDMedicalIcon";
import { PatientVisitIdentityBar } from "./PatientVisitIdentityBar";
import InvestigationStationV3 from "@/components/investigations/InvestigationStationV3";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { createDoctorVisitFollowUp, startDoctorVisit } from "@/lib/doctor-visit";
import { useInterfaceMode, type DoctorWorkspaceMode } from "@/lib/interface-mode";
import { VisitCockpitWorkspace } from "./VisitCockpitWorkspace";
import { SharedClinicalHistoryEditor } from "./SharedClinicalHistory";
import { stageFromModule, useSharedEncounterWorkspaceController, type EncounterWorkspaceController } from "./SharedEncounterWorkspaceController";
import { useSession } from "@/app/session";
import { AppActionButton } from "@/components/actions/AppActionButton";

type MedicationResult = {
  type: string;
  id: string;
  productId?: string;
  genericName?: string | null;
  brandName?: string | null;
  tradeName?: string | null;
  family?: string | null;
  therapeuticClass?: string | null;
  pharmacologicClass?: string | null;
  route?: string | null;
  dosageForm?: string | null;
  strengthText?: string | null;
  reviewFlags?: { pregnancy?: string; lactation?: string };
};

type PrescriptionLine = {
  medicationName: string;
  medicationGenericId?: string;
  medicationProductId?: string;
  drugMarketVariantId?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  family?: string | null;
  manualEntry?: boolean;
};

const modules = [
  ["encounter", "Encounter"],
  ["complaint", "Complaint"],
  ["history", "History"],
  ["examination", "Examination"],
  ["impression", "Impression"],
  ["prescription", "Prescription"],
  ["investigations", "Investigations"],
  ["ultrasound", "Ultrasound"],
  ["follow-up", "Follow-up"],
  ["finish", "Finish / Print"]
] as const;

const examinationChips = [
  "General condition stable",
  "Pallor absent",
  "Pallor present",
  "Abdomen soft",
  "Abdominal tenderness",
  "Fundal height recorded",
  "Fetal heart heard",
  "Speculum exam normal",
  "Cervix closed",
  "Cervix open",
  "Cervix soft",
  "Cervix dilated",
  "Bleeding seen",
  "Vaginal discharge seen",
  "Uterus normal size",
  "Uterus enlarged",
  "Uterine tenderness",
  "Adnexal tenderness",
  "Cervical motion tenderness",
  "Pelvic mass felt"
];

const investigationCategories = ["Common", "Pregnancy / Obstetric", "Gynecology", "Infertility", "Oncology / Screening", "Infection / STI", "Imaging / Radiology", "Emergency / Pre-op"];
const scanTypes = ["Dating", "Anomaly", "Growth", "Doppler", "Follow-up"];

export function ActiveVisitWorkspace({ patientId, visitId, moduleKey }: { patientId: string; visitId: string; moduleKey?: string }) {
  const controller = useSharedEncounterWorkspaceController({ patientId, encounterId: visitId, initialStage: stageFromModule(moduleKey) });
  const { doctorWorkspaceMode, ready, updatePreferences } = useInterfaceMode();
  const [modeError, setModeError] = useState("");

  async function switchMode(mode: DoctorWorkspaceMode) {
    setModeError("");
    if (!await controller.prepareModeSwitch()) {
      setModeError("Resolve the unsaved or conflicting encounter state before switching workspace modes.");
      return;
    }
    try {
      await updatePreferences({ doctorWorkspaceMode: mode });
    } catch (error) {
      setModeError(error instanceof Error ? error.message : "Workspace mode could not be changed.");
    }
  }

  if (!ready) return <section className="panel" aria-busy="true">Loading doctor workspace preference…</section>;
  if (doctorWorkspaceMode === "COCKPIT") return <VisitCockpitWorkspace controller={controller} modeError={modeError} onModeChange={switchMode} />;
  return <ClassicDoctorWorkspace controller={controller} moduleKey={moduleKey} modeError={modeError} onModeChange={switchMode} />;
}

function ClassicDoctorWorkspace({ controller, moduleKey, modeError, onModeChange }: { controller: EncounterWorkspaceController; moduleKey?: string; modeError: string; onModeChange: (mode: DoctorWorkspaceMode) => Promise<void> }) {
  const { patientId, encounterId: visitId, visit } = controller;
  const activeModule = normalizeModule(moduleKey);
  const { user, status: sessionStatus } = useSession();
  const [actionStatus, setActionStatus] = useState("");
  const [medicationQuery, setMedicationQuery] = useState("");
  const [medicationResults, setMedicationResults] = useState<MedicationResult[]>([]);
  const [lines, setLines] = useState<PrescriptionLine[]>([]);
  const [templates, setTemplates] = useState<Record<string, unknown>[]>([]);
  const [shortcuts, setShortcuts] = useState<Record<string, unknown>[]>([]);
  const [safety, setSafety] = useState<Record<string, unknown> | null>(null);
  const [investigationQuery, setInvestigationQuery] = useState("");
  const [investigationCategory, setInvestigationCategory] = useState("");
  const [catalog, setCatalog] = useState<Array<{ id: string; name: string; category: string; subcategory?: string | null }>>([]);
  const [basket, setBasket] = useState<Array<{ id: string; name: string; category: string; note?: string }>>([]);
  const [followUp, setFollowUp] = useState({ dueAt: "", title: "", note: "" });
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");

  const roles = user?.roles ?? [];
  const canUseDoctorVisit = hasAnyRolePermission(roles, Action.VISIT_START) || roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
  const patient = controller.patient as Record<string, string | null> | null;
  const encounter = controller.encounter as Record<string, string | null> | null;
  const signedVisit = controller.isReadOnly;
  const contextReady = Boolean(patientId && visitId && patient?.id === patientId && encounter?.id === visitId);
  const encounterForm = controller.draft as unknown as Record<string, unknown>;
  const saveState = controller.saveState;
  const finishing = controller.readinessLoading || saveState === "saving";
  const error = controller.resourceError || "";
  const status = actionStatus || controller.announce;
  const loadVisit = controller.reload;

  useEffect(() => {
    if (activeModule !== "prescription") return;
    void Promise.all([apiGet("/prescriptions/templates"), apiGet("/prescriptions/shortcuts")]).then(([templateData, shortcutData]) => {
      setTemplates((templateData.prescriptionTemplates ?? []) as Record<string, unknown>[]);
      setShortcuts((shortcutData.doctorMedicationShortcuts ?? []) as Record<string, unknown>[]);
    });
  }, [activeModule]);

  useEffect(() => {
    if (activeModule !== "prescription") return;
    const query = medicationQuery.trim();
    if (query.length < 2) {
      setMedicationResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void apiPost("/medications/search", { query }).then(async (response) => {
        const data = response.ok ? await response.json() as { results?: MedicationResult[] } : {};
        setMedicationResults((data.results ?? []).filter((item) => item.type !== "family").slice(0, 12));
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [activeModule, medicationQuery]);

  useEffect(() => {
    if (activeModule !== "investigations") return;
    const params = new URLSearchParams();
    if (investigationQuery.trim()) params.set("q", investigationQuery.trim());
    if (investigationCategory) params.set("category", investigationCategory);
    if (!params.toString()) {
      setCatalog([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void apiGet(`/investigations/catalog?${params.toString()}`).then((data) => setCatalog((data.investigationCatalog ?? []) as Array<{ id: string; name: string; category: string; subcategory?: string | null }>));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [activeModule, investigationCategory, investigationQuery]);

  async function saveEncounter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contextReady) return;
    if (await controller.save()) {
      setActionStatus("Draft synced.");
      window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
    }
  }

  function changeEncounterForm(next: Record<string, string>) {
    controller.updateDraft(next);
  }

  async function finishVisit(printAfter = false) {
    if (!contextReady || finishing) return;
    if (!await controller.finish()) return;
    window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
    if (printAfter) {
      await refreshPacket();
      window.setTimeout(() => window.print(), 100);
    } else {
      window.location.assign(`/patients/${patientId}`);
    }
  }

  function addMedication(result: MedicationResult) {
    const generic = result.genericName ?? result.brandName ?? result.tradeName ?? "Medication";
    setLines((current) => [
      ...current,
      {
        medicationName: generic,
        medicationGenericId: result.type === "ingredient" || result.type === "generic_medication" ? result.id : undefined,
        medicationProductId: result.type === "product" ? result.id : result.productId,
        drugMarketVariantId: result.type === "market_variant" ? result.id : undefined,
        family: result.family ?? result.therapeuticClass ?? result.pharmacologicClass
      }
    ]);
  }

  async function savePrescription() {
    if (!contextReady || !lines.length) return;
    const response = await apiPost("/prescriptions", { patientId, encounterId: visitId, sourceType: "manual", items: lines });
    setActionStatus(response.ok ? "Prescription draft saved to locked visit." : "Could not save prescription draft.");
    if (response.ok) await loadVisit();
  }

  async function runSafetyCheck() {
    const response = await apiPost("/medications/safety-check", { patientId, medications: lines.map((line) => ({ displayName: line.medicationName, genericName: line.medicationName, family: line.family ?? undefined })) });
    const data = response.ok ? await response.json() as Record<string, unknown> : { error: "Safety check failed." };
    setSafety(data);
  }

  async function attachInvestigations() {
    if (!contextReady || !basket.length) return;
    const response = await apiPost("/clinical-requests", {
      patientId,
      encounterId: visitId,
      priority: "routine",
      items: basket.map((item) => ({ title: item.name, catalogItemId: item.id, requestType: item.category, requestNote: item.note }))
    });
    setActionStatus(response.ok ? "Investigation request attached to locked visit." : "Could not attach investigation request.");
    if (response.ok) {
      setBasket([]);
      await loadVisit();
    }
  }

  async function saveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contextReady) return;
    await createDoctorVisitFollowUp(patientId, visitId, followUp);
    setActionStatus("Follow-up saved to locked visit.");
    await loadVisit();
  }

  async function refreshPacket() {
    await controller.reload();
    setActionStatus("Print packet refreshed for locked visit.");
  }

  if (sessionStatus === "loading") {
    return <section className="panel"><div className="skeleton" aria-label="Checking active visit access" /></section>;
  }

  if (controller.loadState === "loading") return <section className="panel" aria-busy="true">Loading the active encounter and related clinical context...</section>;
  if (controller.loadState === "authentication-failed") return <section className="panel safety-alert" role="alert"><h2>Session expired</h2><p>Sign in again before continuing this encounter.</p></section>;
  if (controller.loadState === "access-denied") return <section className="panel safety-alert" role="alert"><h2>Access denied</h2><p>You do not have access to this encounter.</p></section>;
  if (controller.loadState === "resource-failed") return <section className="panel safety-alert" role="alert"><h2>Encounter resources unavailable</h2><p>{controller.resourceError}</p><button className="button secondary" type="button" onClick={() => void controller.reload()}>Retry</button></section>;
  if (!canUseDoctorVisit) {
    return <PatientVisitIdentityBar error="Patient context is required before documenting this visit." />;
  }

  return (
    <section className="active-visit-shell">
      <PatientVisitIdentityBar
        error={error}
        patient={patient ? { id: String(patient.id), name: String(patient.name ?? ""), medicalRecordNumber: String(patient.medicalRecordNumber ?? ""), dateOfBirth: patient.dateOfBirth, patientType: patient.patientType } : null}
        visit={encounter ? { id: String(encounter.id), status: String(encounter.status ?? "draft"), visitType: String(encounter.visitType ?? "Doctor visit"), startedAt: encounter.startedAt } : null}
        actions={
          <details className="filter-drawer" style={{ display: "inline-block", position: "relative" }}>
            <summary className="button secondary compact"><ThreeDMedicalIcon name="settings" size="sm" /> Options</summary>
            <div className="dense-card-list" style={{ position: "absolute", zIndex: 10, background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem", borderRadius: "0.5rem", right: "0", minWidth: "180px", marginTop: "0.25rem" }}>
              {roles.some((role) => role === "Doctor" || role === "Owner") ? <button className="button secondary compact" type="button" onClick={() => void onModeChange("COCKPIT")} style={{ width: "100%", justifyContent: "flex-start" }}><ThreeDMedicalIcon name="doctor" size="sm" /> Open Visit Cockpit</button> : null}
              <AppActionButton actionId="encounter.void" userPermissions={user?.permissions ?? []} userRoles={roles} className="button secondary compact danger" type="button" onClick={() => {
                setVoidModalOpen(true);
                setVoidReason("");
                setVoidError("");
              }} style={{ width: "100%", justifyContent: "flex-start" }}>
                <ThreeDMedicalIcon name="encounter" size="sm" tone="rose" /> Void encounter
              </AppActionButton>
            </div>
          </details>
        }
      />
      {modeError ? <p className="form-error" role="alert">{modeError}</p> : null}
      {controller.resourceErrors.length ? <section className="alert warning" role="status"><strong>Some related clinical resources are unavailable.</strong> {controller.resourceErrors.map((item) => item.resource).join(", ")}. <button className="button secondary compact" type="button" onClick={() => void controller.reload()}>Retry resources</button></section> : null}
      {error ? <BlockedContext patientId={patientId} /> : null}
      {!error ? (
        <>
          <nav className="active-visit-tabs" aria-label="Active visit modules">
            {modules.map(([key, label]) => (
              <Link className={activeModule === key ? "active" : ""} href={`/patients/${patientId}/visits/${visitId}/${key}`} key={key}>{label}</Link>
            ))}
          </nav>
          <div className="visit-persistent-actions no-print" aria-label="Visit actions">
            <span className={`badge visit-save-state ${saveState}`}>{saveStateLabel(saveState)}</span>
            <Link className="button secondary compact" href={`/patients/${patientId}/visits/${visitId}/finish`}>Review visit</Link>
            <details className="visit-more-actions">
              <summary className="button secondary compact">More</summary>
              <div>
                <Link className="button secondary compact" href={`/patients/${patientId}`}>Save and continue later</Link>
              </div>
            </details>
          </div>

          {voidModalOpen && (
            <dialog open className="patient-modal" aria-label="Void Encounter Confirmation">
              <div className="modal-backdrop" onClick={() => !isVoiding && setVoidModalOpen(false)} />
              <div className="modal-content" style={{ maxWidth: "480px" }}>
                <div className="modal-header">
                  <h2>Void Encounter</h2>
                  <button className="button-icon" onClick={() => setVoidModalOpen(false)} disabled={isVoiding} aria-label="Close">×</button>
                </div>
                <div className="modal-body">
                  <p><strong>Patient:</strong> {patient?.name ?? patientId}</p>
                  <p><strong>Impact:</strong> Voiding this encounter will lock it from further edits and mark it as voided in the patient history. This action is auditable.</p>
                  <div className="warning-callout" style={{ color: "var(--rose)", background: "var(--rose-light)", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                    <strong>Warning:</strong> Are you sure you want to void this encounter?
                  </div>
                  {voidError && <p className="form-error">{voidError}</p>}
                  <label>
                    Mandatory reason for voiding:
                    <input
                      type="text"
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="e.g. Created by mistake"
                      disabled={isVoiding}
                      autoFocus
                    />
                  </label>
                </div>
                <div className="modal-actions form-actions">
                  <button className="button secondary" onClick={() => setVoidModalOpen(false)} disabled={isVoiding}>Cancel</button>
                  <button
                    className="button danger"
                    disabled={isVoiding || voidReason.trim().length === 0}
                    onClick={async () => {
                      const reason = voidReason.trim();
                      if (!reason) return;
                      setIsVoiding(true);
                      setVoidError("");
                      try {
                        const response = await fetch(`${getApiBaseUrl()}/encounters/${visitId}/void`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
                        if (!response.ok) {
                          setVoidError("Could not void this visit. Check permissions or network.");
                          setIsVoiding(false);
                          return;
                        }
                        window.location.assign(`/patients/${patientId}`);
                      } catch {
                        setVoidError("A network error occurred while voiding.");
                        setIsVoiding(false);
                      }
                    }}
                  >
                    {isVoiding ? "Submitting..." : "Confirm Void"}
                  </button>
                </div>
              </div>
            </dialog>
          )}
          <section className="panel">
            <div className="section-heading"><h2>{modules.find(([key]) => key === activeModule)?.[1] ?? "Active Visit"}</h2><span className="badge">{status}</span></div>
            {activeModule === "history" ? <SharedClinicalHistoryEditor compact controller={controller} /> : null}
            {activeModule === "encounter" || activeModule === "complaint" || activeModule === "examination" || activeModule === "impression" ? (
              <EncounterModule activeModule={activeModule} form={encounterForm as Record<string, string>} readOnly={signedVisit} onChange={changeEncounterForm} onSubmit={saveEncounter} />
            ) : null}
            {activeModule === "prescription" ? <PrescriptionModule query={medicationQuery} setQuery={setMedicationQuery} results={medicationResults} lines={lines} setLines={setLines} onAdd={addMedication} onSave={savePrescription} onSafety={runSafetyCheck} safety={safety} templates={templates} shortcuts={shortcuts} /> : null}
            {activeModule === "investigations" ? <InvestigationStationV3 lockedPatientId={patientId} lockedEncounterId={visitId} embedded onSaved={() => void loadVisit()} /> : null}
            {activeModule === "ultrasound" ? <UltrasoundModule patientType={String(patient?.patientType ?? "")} /> : null}
            {activeModule === "follow-up" ? <FollowUpModule followUp={followUp} setFollowUp={setFollowUp} onSubmit={saveFollowUp} /> : null}
            {activeModule === "finish" ? <FinishModule controller={controller} patientName={String(patient?.name ?? "Patient")} onRefresh={refreshPacket} onFinish={finishVisit} /> : null}
          </section>
        </>
      ) : null}
    </section>
  );
}

export function ActiveVisitLauncher({ patientId, className = "button", children = "Start Visit" }: { patientId: string; className?: string; children?: ReactNode }) {
  const [busy, setBusy] = useState(false);
  async function openVisit() {
    setBusy(true);
    try {
      const data = await startDoctorVisit(patientId);
      const encounterId = String(data.encounter?.id ?? "");
      if (!encounterId) throw new Error("Missing visit.");
      window.location.href = `/patients/${patientId}/visits/${encounterId}/encounter`;
    } catch {
      window.location.href = `/patients/${patientId}`;
    }
  }
  return <button className={className} disabled={busy} type="button" onClick={() => void openVisit()}>{busy ? "Opening..." : children}</button>;
}

function EncounterModule({ activeModule, form, readOnly, onChange, onSubmit }: { activeModule: string; form: Record<string, string>; readOnly: boolean; onChange: (next: Record<string, string>) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const field = activeModule === "complaint" ? "chiefComplaint" : activeModule === "history" ? "historyText" : activeModule === "examination" ? "examText" : activeModule === "impression" ? "assessmentText" : "planText";
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {activeModule === "examination" ? <ChipList labels={examinationChips} onPick={(label) => onChange({ ...form, examText: appendText(form.examText, label) })} /> : null}
      <label className="wide">{fieldLabel(field)}<textarea value={form[field] ?? ""} onChange={(event) => onChange({ ...form, [field]: event.target.value })} /></label>
      {activeModule === "encounter" ? (
        <>
          <label>Chief complaint<input value={form.chiefComplaint ?? ""} onChange={(event) => onChange({ ...form, chiefComplaint: event.target.value })} /></label>
          <label>History<textarea value={form.historyText ?? ""} onChange={(event) => onChange({ ...form, historyText: event.target.value })} /></label>
          <label>Examination<textarea value={form.examText ?? ""} onChange={(event) => onChange({ ...form, examText: event.target.value })} /></label>
          <label>Impression<textarea value={form.assessmentText ?? ""} onChange={(event) => onChange({ ...form, assessmentText: event.target.value })} /></label>
        </>
      ) : null}
      {!readOnly ? <button className="button" type="submit">Save draft</button> : <p className="notice wide">Signed encounter · read only</p>}
    </form>
  );
}

function PrescriptionModule({ query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: { query: string; setQuery: (value: string) => void; results: MedicationResult[]; lines: PrescriptionLine[]; setLines: (updater: (current: PrescriptionLine[]) => PrescriptionLine[]) => void; onAdd: (result: MedicationResult) => void; onSave: () => void; onSafety: () => void; safety: Record<string, unknown> | null; templates: Record<string, unknown>[]; shortcuts: Record<string, unknown>[] }) {
  return (
    <div className="form-grid">
<label className="wide">Medication search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="generic, brand, class, painkiller, antibiotic, nausea, thyroid, iron" /></label>
      <p className="notice wide">Dose, frequency, and duration are not auto-filled. The doctor must enter and review each instruction.</p>
      <div className="data-list wide">
        {results.map((result) => <MedicationCard key={`${result.type}-${result.id}`} result={result} onAdd={() => onAdd(result)} />)}
        {query.trim().length < 2 ? <p className="empty-state compact smart-empty-state">Search medication catalog first.</p> : null}
      </div>
      <TemplateStrip templates={templates} shortcuts={shortcuts} setLines={setLines} />
      <div className="wide data-list">
        {lines.map((line, index) => (
          <article className="data-row" key={`${line.medicationName}-${index}`}>
            <div className="data-row-header"><strong>{line.medicationName}</strong><button className="button secondary compact" type="button" onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>
            <div className="form-grid">
              <label>Dose text<input value={line.dose ?? ""} onChange={(event) => setLines((current) => updateLine(current, index, { dose: event.target.value }))} /></label>
              <label>Timing<input value={line.frequency ?? ""} onChange={(event) => setLines((current) => updateLine(current, index, { frequency: event.target.value }))} /></label>
              <label>Duration<input value={line.duration ?? ""} onChange={(event) => setLines((current) => updateLine(current, index, { duration: event.target.value }))} /></label>
              <label>Instructions<input value={line.instructions ?? ""} onChange={(event) => setLines((current) => updateLine(current, index, { instructions: event.target.value }))} /></label>
            </div>
          </article>
        ))}
        {!lines.length ? <p className="empty-state compact smart-empty-state">No medication lines yet.</p> : null}
      </div>
      <SafetyPanel safety={safety} />
      <div className="form-actions wide">
        <button className="button secondary" type="button" onClick={() => setLines((current) => [...current, { medicationName: "Custom medication", manualEntry: true }])}>Add custom medication</button>
        <button className="button secondary" type="button" disabled={!lines.length} onClick={onSafety}>Safety check</button>
        <button className="button" type="button" disabled={!lines.length} onClick={onSave}>Save draft</button>
        <button className="button secondary" type="button" disabled={!lines.length} onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}

function MedicationCard({ result, onAdd }: { result: MedicationResult; onAdd: () => void }) {
  return (
    <article className="data-row medication-result-card">
      <div className="data-row-header"><strong>{result.genericName ?? result.tradeName ?? result.brandName}</strong><span className="badge">{result.family ?? result.therapeuticClass ?? result.pharmacologicClass ?? "Medication"}</span></div>
      {result.tradeName || result.brandName ? <p className="muted">Trade match: {result.tradeName ?? result.brandName}</p> : null}
      <p className="muted">{[result.dosageForm, result.strengthText, result.route].filter(Boolean).join(" | ") || "Form/strength metadata not recorded."}</p>
      <div className="form-actions">
        <span className="badge">Pregnancy: {reviewLabel(result.reviewFlags?.pregnancy)}</span>
        <span className="badge">Lactation: {reviewLabel(result.reviewFlags?.lactation)}</span>
        <button className="button compact" type="button" onClick={onAdd}>Add to prescription</button>
      </div>
    </article>
  );
}

function TemplateStrip({ templates, shortcuts, setLines }: { templates: Record<string, unknown>[]; shortcuts: Record<string, unknown>[]; setLines: (updater: (current: PrescriptionLine[]) => PrescriptionLine[]) => void }) {
  const hasItems = templates.length > 0 || shortcuts.length > 0;
  if (!hasItems) return <p className="empty-state compact smart-empty-state wide">No saved prescription templates yet.</p>;
  return (
    <div className="wide template-list">
      {templates.map((template) => <button className="picker-row" key={String(template.id)} type="button" onClick={() => setLines(() => ((template.itemsJson as PrescriptionLine[] | undefined) ?? []))}><strong>{String(template.title ?? "Template")}</strong><span>Use template</span></button>)}
      {shortcuts.map((shortcut) => <button className="picker-row" key={String(shortcut.id)} type="button" onClick={() => setLines((current) => [...current, { medicationName: String(shortcut.genericName ?? shortcut.displayName), dose: String(shortcut.defaultDoseText ?? ""), frequency: String(shortcut.defaultTimingText ?? ""), duration: String(shortcut.defaultDurationText ?? ""), instructions: String(shortcut.defaultInstructions ?? "") }])}><strong>{String(shortcut.displayName ?? shortcut.genericName)}</strong><span>Use template | Custom dose</span></button>)}
    </div>
  );
}

function SafetyPanel({ safety }: { safety: Record<string, unknown> | null }) {
  const alerts = (safety?.alerts as Array<Record<string, unknown>> | undefined) ?? [];
  return (
    <section className="panel compact-panel wide">
      <div className="section-heading compact-section-heading"><h3>Patient-aware safety panel</h3><span className="badge">Review required</span></div>
      <div className="visit-type-counts"><span>Allergies</span><span>Current medications</span><span>Pregnancy/lactation status</span><span>Missing safety data checklist</span></div>
      {alerts.map((alert, index) => <p className="notice" key={index}><strong>{severityLabel(String(alert.severity ?? "unknown"))}</strong>: {String(alert.title ?? alert.alertType)}. Suggested doctor action: review before signing; override requires reason if allowed.</p>)}
      {!safety ? <p className="muted">Run safety check after adding medication lines.</p> : null}
    </section>
  );
}

function UltrasoundModule({ patientType }: { patientType: string }) {
  const hasPregnancy = patientType === "OB";
  return (
    <div className="form-grid">
      {!hasPregnancy ? <p className="empty-state compact smart-empty-state wide">No active pregnancy episode recorded.</p> : null}
      {!hasPregnancy ? <button className="button secondary" type="button">Create pregnancy episode</button> : null}
      <label>Scan type<select>{scanTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Fetus selector<select><option>Baby</option><option>Baby A</option><option>Baby B</option></select></label>
      <label>GA<input placeholder="From reviewed/locked EDD when available" /></label>
      <label className="wide">Report note<textarea placeholder="Doctor-written report. No automatic FGR, anomaly, or treatment labels." /></label>
      <p className="empty-state compact smart-empty-state wide">No ultrasound reports yet.</p>
    </div>
  );
}

function FollowUpModule({ followUp, setFollowUp, onSubmit }: { followUp: { dueAt: string; title: string; note: string }; setFollowUp: (next: { dueAt: string; title: string; note: string }) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>Follow-up date<input type="date" value={followUp.dueAt} onChange={(event) => setFollowUp({ ...followUp, dueAt: event.target.value })} /></label>
      <label>Task title<input value={followUp.title} onChange={(event) => setFollowUp({ ...followUp, title: event.target.value })} placeholder="Follow-up visit" /></label>
      <label className="wide">Note<textarea value={followUp.note} onChange={(event) => setFollowUp({ ...followUp, note: event.target.value })} /></label>
      <button className="button" type="submit">Save follow-up</button>
    </form>
  );
}

function FinishModule({ controller, patientName, onRefresh, onFinish }: { controller: EncounterWorkspaceController; patientName: string; onRefresh: () => void; onFinish: () => Promise<void> }) {
  const { visit, readiness, readinessLoading, saveState, isReadOnly, refreshReadiness } = controller;
  useEffect(() => { if (!isReadOnly) void refreshReadiness(); }, [isReadOnly, refreshReadiness]);
  const blocking = readiness?.issues.filter((issue) => issue.severity === "blocking") ?? [];
  const warnings = readiness?.issues.filter((issue) => issue.severity === "warning") ?? [];
  const canFinish = Boolean(readiness?.ready && saveState === "saved" && !readinessLoading && !isReadOnly);
  return (
    <div className="print-packet">
      <div className="form-actions no-print">
        <button className="button secondary" type="button" onClick={onRefresh}>Refresh packet</button>
        <button className="button" disabled={!canFinish} type="button" onClick={() => void onFinish()}>Sign and finish encounter</button>
      </div>
      <h2>{patientName}</h2>
      {isReadOnly ? <p className="notice">This completed or historical encounter is read-only.</p> : null}
      {readinessLoading ? <p className="notice" aria-live="polite">Checking server readiness...</p> : null}
      {blocking.length ? <section className="alert danger" role="alert"><h3>Blocking review issues</h3><ul>{blocking.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul></section> : null}
      {warnings.length ? <section className="notice"><h3>Review warnings</h3><ul>{warnings.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul></section> : null}
      {!blocking.length && readiness?.ready ? <p className="notice">Server readiness check passed. Review the summary before signing.</p> : null}
      {saveState !== "saved" && !isReadOnly ? <p className="alert warning">Current state: {controller.saveMessage}. Changes must be saved before completion.</p> : null}
      <section><h3>Encounter</h3><p>{controller.draft.chiefComplaint || "No chief complaint saved."}</p></section>
      <section><h3>Prescriptions</h3><p>{(visit?.prescriptions ?? []).length} prescription draft(s)</p></section>
      <section><h3>Requested investigations</h3><p>{(visit?.investigationOrders ?? []).length} request(s)</p></section>
      <section><h3>Follow-up</h3><p>{(visit?.followUps ?? []).length} follow-up task(s)</p></section>
    </div>
  );
}

function saveStateLabel(state: string) {
  const labels: Record<string, string> = { loading: "Loading", saved: "Saved", dirty: "Unsaved changes", saving: "Autosaving", "waiting-sync": "Waiting to sync", failed: "Save failed - Retry", offline: "Offline", conflict: "Version conflict", completed: "Completed - read-only", "read-only": "Historical - read-only" };
  return labels[state] ?? state;
}

function BlockedContext({ patientId }: { patientId: string }) {
  return <div className="form-actions"><Link className="button secondary" href="/doctor">Back to Doctor Mode</Link>{patientId ? <Link className="button secondary" href={`/patients/${patientId}`}>Open patient file</Link> : null}</div>;
}

function ChipList({ labels, onPick }: { labels: string[]; onPick: (label: string) => void }) {
  return <div className="clinical-chip-cloud wide">{[...new Set(labels)].map((label) => <button className="clinical-chip" key={label} type="button" onClick={() => onPick(label)}><strong>{label}</strong><span>Examination</span></button>)}</div>;
}

function normalizeModule(value?: string) {
  return modules.some(([key]) => key === value) ? value! : "encounter";
}

function fieldLabel(field: string) {
  if (field === "chiefComplaint") return "Chief complaint";
  if (field === "historyText") return "History";
  if (field === "examText") return "Examination notes";
  if (field === "assessmentText") return "Doctor impression";
  return "Doctor plan";
}

function appendText(existing = "", label: string) {
  return [existing.trim(), label].filter(Boolean).join(existing.trim() ? "\n" : "");
}

function updateLine(lines: PrescriptionLine[], index: number, patch: Partial<PrescriptionLine>) {
  return lines.map((line, itemIndex) => itemIndex === index ? { ...line, ...patch } : line);
}

function reviewLabel(value?: string) {
  return value === "reviewed" ? "reviewed source available" : "review required";
}

function severityLabel(value: string) {
  if (value === "critical") return "Do not proceed without doctor override";
  if (value === "major") return "Major";
  if (value === "moderate") return "Important";
  if (value === "unknown") return "Review required";
  return "Info";
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
