"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Action,
  COMPLAINT_LIFECYCLE_STATUSES,
  calculateEddCandidate,
  complaintLifecycleFromEncounter,
  complaintStatusLabel,
  confirmEddCandidate,
  hasAnyRolePermission,
  isPregnancyMenstrualUiSuppressed,
  type EddCandidate,
  type EddConfirmation,
  type EddSource
} from "@prij-clinic/shared";
import { ThreeDMedicalIcon } from "../ThreeDMedicalIcon";
import { PatientVisitIdentityBar } from "./PatientVisitIdentityBar";
import InvestigationStationV3 from "@/components/investigations/InvestigationStationV3";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { completeDoctorVisit, createDoctorVisitFollowUp, getDoctorVisitPacket, getCurrentDoctorVisit, startDoctorVisit, updateDoctorVisit, type DoctorVisitState } from "@/lib/doctor-visit";
import { useSession } from "@/app/session";
import { AppActionButton } from "@/components/actions/AppActionButton";
import { complaintGroups, historyGroups } from "@/components/patients/ClinicalInputFoundation";

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

type StructuredClinicalInput = {
  version: 1 | 2;
  complaints: StructuredTagItem[];
  history: Array<{ label: string; category: string }>;
  examination: Record<string, string>;
  reproductiveSnapshot?: ReproductiveSnapshot;
};
type StructuredTagItem = { id?: string; label: string; category: string; status?: "Active" | "Improving" | "Resolved" | "Chronic" };
type ReproductiveSnapshot = {
  context: string;
  encounterId?: string;
  episodeId?: string;
  confirmedAt?: string;
  confirmedByUserId?: string;
  previousSnapshotEncounterId?: string;
  changeStatus?: "initial" | "no_change" | "changed";
  baselineProfile?: {
    usualRegularity?: string;
    usualCycleLength?: string;
    usualBleedingDuration?: string;
    usualFlow?: string;
    longstandingDysmenorrhea?: boolean;
    menopauseStatus?: string;
  };
  lmp?: string;
  lmpCertainty?: string;
  regularity?: string;
  cycleLength?: string;
  bleedingDuration?: string;
  flow?: string;
  abnormalFlags?: string[];
  narrative?: string;
  edd?: string;
  datingMethod?: string;
  eddMode?: "manual" | "calculated";
  eddSource?: EddSource;
  datingSourceDate?: string;
  datingFormula?: string;
  datingConfirmationDate?: string;
  datingClinician?: string;
  datingCorrectionReason?: string;
  datingHistory?: EddConfirmation["datingHistory"];
  manualEdd?: string;
  knownConceptionDate?: string;
  ivfTransferDate?: string;
  ivfEmbryoAgeDays?: "3" | "5";
  ultrasoundScanDate?: string;
  ultrasoundGestationalWeeks?: string;
  ultrasoundGestationalDays?: string;
  ultrasoundEdd?: string;
  replaceConfirmedEdd?: boolean;
  pregnancyBleedingStatus?: string;
  pregnancyBleedingOnsetDate?: string;
  inductionStatus?: string;
  cycleNumber?: string;
  triggerDate?: string;
  expectedOvulationDate?: string;
  nextScanDate?: string;
  deliveryDate?: string;
  deliveryMode?: string;
  lochiaStatus?: string;
  returnOfMenstruation?: string;
  breastfeeding?: string;
  contraception?: string;
  menopauseStatus?: string;
  lastNaturalPeriod?: string;
  hormoneTherapy?: string;
  hysterectomyStatus?: string;
  hysterectomyDate?: string;
  cervixStatus?: string;
  ovariesStatus?: string;
};
const emptyStructuredInput: StructuredClinicalInput = { version: 2, complaints: [], history: [], examination: {} };

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
  const activeModule = normalizeModule(moduleKey);
  const { user, status: sessionStatus } = useSession();
  const [visit, setVisit] = useState<DoctorVisitState | null>(null);
  const [status, setStatus] = useState("Loading locked visit context.");
  const [error, setError] = useState("");
  const [encounterForm, setEncounterForm] = useState<Record<string, unknown>>({});
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
  const [saveState, setSaveState] = useState<"synced" | "unsaved" | "local" | "syncing" | "failed" | "offline">("synced");
  const [finishing, setFinishing] = useState(false);
  const draftKey = `prij:unsigned-visit:${patientId}:${visitId}`;

  const roles = user?.roles ?? [];
  const canUseDoctorVisit = hasAnyRolePermission(roles, Action.VISIT_START) || roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
  const patient = visit?.patient as Record<string, string | null> | undefined;
  const encounter = visit?.encounter as Record<string, unknown> | undefined;
  const signedVisit = encounter?.status === "signed";
  const contextReady = Boolean(patientId && visitId && patient?.id === patientId && encounter?.id === visitId);

  const loadVisit = useCallback(async () => {
    try {
      let data = await getCurrentDoctorVisit(patientId);
      if (String(data.encounter?.id ?? "") !== visitId) {
        data = await getDoctorVisitPacket(patientId, visitId);
      }
      setVisit(data);
      const complaintLifecycle = complaintLifecycleFromEncounter((data.encounter ?? {}) as Record<string, unknown>);
      const serverForm: Record<string, unknown> = {
        chiefComplaint: String(data.encounter?.chiefComplaint ?? ""),
        complaintStatus: complaintLifecycle?.status ?? "ACTIVE",
        historyText: String(data.encounter?.historyText ?? ""),
        examText: String(data.encounter?.examText ?? ""),
        assessmentText: String(data.encounter?.assessmentText ?? ""),
        planText: String(data.encounter?.planText ?? ""),
        examinationJson: structuredInput(data.encounter?.examinationJson)
      };
      const recovered = String(data.encounter?.status ?? "") === "draft" ? readLocalVisitDraft(draftKey) : null;
      setEncounterForm(recovered ? { ...serverForm, ...recovered } : serverForm);
      setSaveState(recovered ? "local" : "synced");
      setError("");
      setStatus("");
    } catch {
      setError("Patient context is required before documenting this visit.");
      setStatus("Could not load locked visit context.");
    }
  }, [draftKey, patientId, visitId]);

  useEffect(() => {
    if (!contextReady || saveState !== "unsaved") return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(encounterForm));
        setSaveState(navigator.onLine ? "local" : "offline");
      } catch {
        setSaveState("failed");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [contextReady, draftKey, encounterForm, saveState]);

  useEffect(() => {
    if (!patientId || !visitId) {
      setError("Patient context is required before documenting this visit.");
      return;
    }
    void loadVisit();
  }, [loadVisit, patientId, visitId]);

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
    setSaveState("syncing");
    try {
      await updateDoctorVisit(patientId, visitId, encounterForm);
      localStorage.removeItem(draftKey);
      setSaveState("synced");
      setStatus("Draft synced.");
      await loadVisit();
      window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
    } catch {
      setSaveState(navigator.onLine ? "failed" : "offline");
    }
  }

  function changeEncounterForm(next: Record<string, unknown>) {
    setEncounterForm(next);
    setSaveState("unsaved");
  }

  async function finishVisit(printAfter = false) {
    if (!contextReady || finishing) return;
    setFinishing(true);
    try {
      if (saveState !== "synced") await updateDoctorVisit(patientId, visitId, encounterForm);
      await completeDoctorVisit(visitId);
      localStorage.removeItem(draftKey);
      setSaveState("synced");
      window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
      if (printAfter) {
        await refreshPacket();
        window.setTimeout(() => window.print(), 100);
      } else {
        window.location.assign(`/patients/${patientId}`);
      }
    } catch {
      setStatus("Finish failed â€” review required fields and retry.");
      setFinishing(false);
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
    setStatus(response.ok ? "Prescription draft saved to locked visit." : "Could not save prescription draft.");
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
    setStatus(response.ok ? "Investigation request attached to locked visit." : "Could not attach investigation request.");
    if (response.ok) {
      setBasket([]);
      await loadVisit();
    }
  }

  async function saveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contextReady) return;
    await createDoctorVisitFollowUp(patientId, visitId, followUp);
    setStatus("Follow-up saved to locked visit.");
    await loadVisit();
  }

  async function refreshPacket() {
    setVisit(await getDoctorVisitPacket(patientId, visitId));
    setStatus("Print packet refreshed for locked visit.");
  }

  if (sessionStatus === "loading") {
    return <section className="panel"><div className="skeleton" aria-label="Checking active visit access" /></section>;
  }

  if (!canUseDoctorVisit) {
    return <PatientVisitIdentityBar error="Patient context is required before documenting this visit." />;
  }

  return (
    <section className="active-visit-shell">
      <PatientVisitIdentityBar
        error={error}
        patient={patient ? { id: String(patient.id), name: String(patient.name ?? ""), medicalRecordNumber: String(patient.medicalRecordNumber ?? ""), dateOfBirth: patient.dateOfBirth, patientType: patient.patientType } : null}
        visit={encounter ? { id: String(encounter.id), status: String(encounter.status ?? "draft"), visitType: String(encounter.visitType ?? "Doctor visit"), startedAt: encounter.startedAt == null ? null : String(encounter.startedAt) } : null}
        actions={
          <details className="filter-drawer" style={{ display: "inline-block", position: "relative" }}>
            <summary className="button secondary compact"><ThreeDMedicalIcon name="settings" size="sm" /> Options</summary>
            <div className="dense-card-list" style={{ position: "absolute", zIndex: 10, background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem", borderRadius: "0.5rem", right: "0", minWidth: "180px", marginTop: "0.25rem" }}>
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
            <button className="button compact" disabled={finishing} type="button" onClick={() => void finishVisit(false)}>Finish visit</button>
            <details className="visit-more-actions">
              <summary className="button secondary compact">More</summary>
              <div>
                <Link className="button secondary compact" href={`/patients/${patientId}`}>Save and continue later</Link>
                <button className="button secondary compact" disabled={finishing} type="button" onClick={() => void finishVisit(true)}>Finish and print</button>
              </div>
            </details>
          </div>

          {voidModalOpen && (
            <dialog open className="patient-modal" aria-label="Void Encounter Confirmation">
              <div className="modal-backdrop" onClick={() => !isVoiding && setVoidModalOpen(false)} />
              <div className="modal-content" style={{ maxWidth: "480px" }}>
                <div className="modal-header">
                  <h2>Void Encounter</h2>
                  <button className="button-icon" onClick={() => setVoidModalOpen(false)} disabled={isVoiding} aria-label="Close">Ã—</button>
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
            {activeModule === "encounter" || activeModule === "complaint" || activeModule === "history" || activeModule === "examination" || activeModule === "impression" ? (
              <EncounterModule activeModule={activeModule} patientType={String(patient?.patientType ?? "")} form={encounterForm} previousEncounters={visit?.recentEncounters ?? []} pregnancyEpisode={visit?.pregnancyEpisode ?? null} infertilityEpisode={visit?.infertilityEpisode ?? null} readOnly={signedVisit} onChange={changeEncounterForm} onSubmit={saveEncounter} />
            ) : null}
            {activeModule === "prescription" ? <PrescriptionModule query={medicationQuery} setQuery={setMedicationQuery} results={medicationResults} lines={lines} setLines={setLines} onAdd={addMedication} onSave={savePrescription} onSafety={runSafetyCheck} safety={safety} templates={templates} shortcuts={shortcuts} /> : null}
            {activeModule === "investigations" ? <InvestigationStationV3 lockedPatientId={patientId} lockedEncounterId={visitId} embedded onSaved={() => void loadVisit()} /> : null}
            {activeModule === "ultrasound" ? <UltrasoundModule patientType={String(patient?.patientType ?? "")} pregnancyEpisode={visit?.pregnancyEpisode ?? null} infertilityEpisode={visit?.infertilityEpisode ?? null} /> : null}
            {activeModule === "follow-up" ? <FollowUpModule followUp={followUp} setFollowUp={setFollowUp} onSubmit={saveFollowUp} /> : null}
            {activeModule === "finish" ? <FinishModule visit={visit} patientName={String(patient?.name ?? "Patient")} saveState={saveState} finishing={finishing} onRefresh={refreshPacket} onFinish={finishVisit} /> : null}
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

function EncounterModule({ activeModule, patientType, form, previousEncounters, pregnancyEpisode, infertilityEpisode, readOnly, onChange, onSubmit }: { activeModule: string; patientType: string; form: Record<string, unknown>; previousEncounters: Record<string, unknown>[]; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; readOnly: boolean; onChange: (next: Record<string, unknown>) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const field = activeModule === "complaint" ? "chiefComplaint" : activeModule === "history" ? "historyText" : activeModule === "examination" ? "examText" : activeModule === "impression" ? "assessmentText" : "planText";
  const structured = structuredInput(form.examinationJson);
  const context = visitContext(patientType, pregnancyEpisode, infertilityEpisode);
  const updateStructured = (patch: Partial<StructuredClinicalInput>) => onChange({ ...form, examinationJson: { ...structured, ...patch } });
  const previousSnapshot = previousEncounters.flatMap((row) => {
    const input = structuredInput(row.examinationJson);
    return input.reproductiveSnapshot ? [{ ...input.reproductiveSnapshot, encounterId: input.reproductiveSnapshot.encounterId ?? String(row.id ?? "") }] : [];
  })[0];
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <fieldset className="encounter-module-fields wide" disabled={readOnly}>
      {activeModule === "complaint" ? <StructuredTagPicker title="Smart complaint tags" groups={complaintGroups} selected={structured.complaints} lenses onChange={(complaints) => updateStructured({ complaints })} /> : null}
      {activeModule === "history" ? <><ReproductiveStatusEditor context={context} value={structured.reproductiveSnapshot} previous={previousSnapshot} pregnancyEpisode={pregnancyEpisode} infertilityEpisode={infertilityEpisode} onChange={(reproductiveSnapshot) => updateStructured({ reproductiveSnapshot, version: 2 })} /><StructuredTagPicker title="Structured History" groups={historyGroups} selected={structured.history} onChange={(history) => updateStructured({ history })} /></> : null}
      {activeModule === "examination" ? <StructuredExamination context={context} value={structured.examination} onChange={(examination) => updateStructured({ examination })} /> : null}
      {activeModule === "examination" ? <ChipList labels={examinationChips} onPick={(label) => onChange({ ...form, examText: appendText(String(form.examText ?? ""), label) })} /> : null}
      {activeModule === "complaint" ? (
        <label>Lifecycle status
          <select value={String(form.complaintStatus ?? "ACTIVE")} onChange={(event) => onChange({ ...form, complaintStatus: event.target.value })}>
            {COMPLAINT_LIFECYCLE_STATUSES.map((status) => <option key={status} value={status}>{complaintStatusLabel(status)}</option>)}
          </select>
        </label>
      ) : null}
      <label className="wide">{fieldLabel(field)}<textarea value={String(form[field] ?? "")} onChange={(event) => onChange({ ...form, [field]: event.target.value })} /></label>
      {activeModule === "complaint" ? <span className={`badge complaint-status-badge ${form.complaintStatus === "REFRACTORY" ? "refractory" : ""}`}>{complaintStatusLabel(form.complaintStatus)}</span> : null}
      {activeModule === "encounter" ? (
        <>
          <label>Chief complaint<input value={String(form.chiefComplaint ?? "")} onChange={(event) => onChange({ ...form, chiefComplaint: event.target.value })} /></label>
          <label>History<textarea value={String(form.historyText ?? "")} onChange={(event) => onChange({ ...form, historyText: event.target.value })} /></label>
          <label>Examination<textarea value={String(form.examText ?? "")} onChange={(event) => onChange({ ...form, examText: event.target.value })} /></label>
          <label>Impression<textarea value={String(form.assessmentText ?? "")} onChange={(event) => onChange({ ...form, assessmentText: event.target.value })} /></label>
        </>
      ) : null}
      {!readOnly ? <button className="button" type="submit">Save draft</button> : <p className="notice wide">Signed encounter Â· read only</p>}
      </fieldset>
    </form>
  );
}

const prescriptionDoseOptions = ["نصف قرص", "قرص", "قرصان", "5 مل", "10 مل", "تحميلة", "أمبول", "كبسولة"];
const prescriptionFrequencyOptions = ["مرة يوميًا", "مرتين يوميًا", "3 مرات يوميًا", "كل 6 ساعات", "كل 8 ساعات", "كل 12 ساعة", "عند اللزوم"];
const prescriptionDurationOptions = ["3 أيام", "5 أيام", "7 أيام", "10 أيام", "14 يومًا", "شهر", "حتى المراجعة"];
const prescriptionInstructionOptions = ["بعد الأكل", "قبل الأكل", "مع الأكل", "صباحًا", "مساءً", "قبل النوم", "عند اللزوم"];

function StructuredPrescriptionField({ label, arabicLabel, value, options, onChange }: { label: string; arabicLabel: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <fieldset className="structured-rx-field">
      <legend><span>{label}</span><span dir="rtl">{arabicLabel}</span></legend>
      <div className="structured-rx-options" role="group" aria-label={label}>
        {options.map((option) => <button className={value === option ? "rx-option active" : "rx-option"} key={option} type="button" onClick={() => onChange(option)}>{option}</button>)}
      </div>
      <input aria-label={`Custom ${label}`} dir="auto" value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Custom ${label} / إدخال مخصص`} />
    </fieldset>
  );
}

function PrescriptionModule({ query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: { query: string; setQuery: (value: string) => void; results: MedicationResult[]; lines: PrescriptionLine[]; setLines: (updater: (current: PrescriptionLine[]) => PrescriptionLine[]) => void; onAdd: (result: MedicationResult) => void; onSave: () => void; onSafety: () => void; safety: Record<string, unknown> | null; templates: Record<string, unknown>[]; shortcuts: Record<string, unknown>[] }) {
  return (
    <div className="form-grid structured-rx-workspace">
      <label className="wide">Medication search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="generic, brand, class, painkiller, antibiotic, nausea, thyroid, iron" /></label>
      <div className="medication-result-grid wide">
        {results.map((result) => <MedicationCard key={`${result.type}-${result.id}`} result={result} onAdd={() => onAdd(result)} />)}
        {query.trim().length < 2 ? <p className="empty-state compact smart-empty-state">Search medication catalog first.</p> : null}
      </div>
      <TemplateStrip templates={templates} shortcuts={shortcuts} setLines={setLines} />
      <div className="wide data-list structured-rx-lines">
        {lines.map((line, index) => (
          <article className="data-row structured-rx-line" key={`${line.medicationName}-${index}`}>
            <div className="data-row-header"><strong>{line.medicationName}</strong><button className="button secondary compact" type="button" onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>
            <div className="structured-rx-grid">
              <StructuredPrescriptionField label="Dose" arabicLabel="الجرعة" value={line.dose ?? ""} options={prescriptionDoseOptions} onChange={(value) => setLines((current) => updateLine(current, index, { dose: value }))} />
              <StructuredPrescriptionField label="Frequency" arabicLabel="عدد المرات" value={line.frequency ?? ""} options={prescriptionFrequencyOptions} onChange={(value) => setLines((current) => updateLine(current, index, { frequency: value }))} />
              <StructuredPrescriptionField label="Duration" arabicLabel="المدة" value={line.duration ?? ""} options={prescriptionDurationOptions} onChange={(value) => setLines((current) => updateLine(current, index, { duration: value }))} />
              <StructuredPrescriptionField label="Instructions" arabicLabel="التعليمات" value={line.instructions ?? ""} options={prescriptionInstructionOptions} onChange={(value) => setLines((current) => updateLine(current, index, { instructions: value }))} />
            </div>
            <p className="muted structured-rx-preview" dir="rtl">{[line.dose, line.frequency, line.duration, line.instructions].filter(Boolean).join(" · ") || "اختر الجرعة وعدد المرات والمدة والتعليمات"}</p>
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
  const tradeName = result.tradeName ?? result.brandName ?? result.genericName ?? "Medication";
  const genericName = result.genericName ?? "Generic not recorded";
  const coreMeta = [result.strengthText, result.dosageForm, result.route].filter(Boolean).join(" · ") || "Strength, form, and route not recorded";
  const classifications = [result.family, result.therapeuticClass, result.pharmacologicClass].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);
  return (
    <article className="medication-result-card compact-medication-card">
      <div className="compact-medication-card-main">
        <strong className="medication-trade-name">{tradeName}</strong>
        <span className="medication-generic-name">{genericName}</span>
        <span className="medication-core-meta">{coreMeta}</span>
      </div>
      <div className="medication-classification-chips" aria-label="Medication classification">
        {classifications.length ? classifications.slice(0, 3).map((value) => <span className="badge" key={String(value)}>{value}</span>) : <span className="badge">Medication</span>}
      </div>
      <div className="medication-safety-chips" aria-label="Medication safety review">
        <span className="badge">Pregnancy: {reviewLabel(result.reviewFlags?.pregnancy)}</span>
        <span className="badge">Lactation: {reviewLabel(result.reviewFlags?.lactation)}</span>
      </div>
      <button className="button compact" type="button" onClick={onAdd}>Add to prescription</button>
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

function UltrasoundModule({ patientType, pregnancyEpisode, infertilityEpisode }: { patientType: string; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null }) {
  const context = visitContext(patientType, pregnancyEpisode, infertilityEpisode);
  const title = context === "pregnancy" ? "Obstetric Ultrasound" : context === "infertility" ? "Fertility Ultrasound / Folliculometry" : context === "postpartum" ? "Postpartum Ultrasound" : "Pelvic Ultrasound";
  return (
    <div className="form-grid">
      <h3 className="wide">{title}</h3>
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

function ReproductiveStatusEditor({ context, value, previous, pregnancyEpisode, infertilityEpisode, onChange }: { context: string; value?: ReproductiveSnapshot; previous?: ReproductiveSnapshot; pregnancyEpisode: Record<string, unknown> | null; infertilityEpisode: Record<string, unknown> | null; onChange: (value: ReproductiveSnapshot) => void }) {
  const episodeId = String((context === "pregnancy" ? pregnancyEpisode?.id : infertilityEpisode?.id) ?? "");
  const current: ReproductiveSnapshot = value ?? { context, episodeId: episodeId || undefined, changeStatus: previous ? undefined : "initial", abnormalFlags: [], baselineProfile: previous?.baselineProfile };
  const [candidate, setCandidate] = useState<EddCandidate | null>(null);
  const [datingError, setDatingError] = useState("");
  const update = (patch: Partial<ReproductiveSnapshot>) => {
    const next = { ...current, context, episodeId: episodeId || current.episodeId, ...patch };
    onChange({
      ...next,
      baselineProfile: previous?.baselineProfile ?? current.baselineProfile ?? {
        usualRegularity: next.regularity,
        usualCycleLength: next.cycleLength,
        usualBleedingDuration: next.bleedingDuration,
        usualFlow: next.flow,
        longstandingDysmenorrhea: next.abnormalFlags?.includes("dysmenorrhea"),
        menopauseStatus: next.menopauseStatus
      }
    });
  };
  const noChange = () => previous && onChange({ ...previous, context, episodeId: episodeId || previous.episodeId, encounterId: undefined, confirmedAt: undefined, confirmedByUserId: undefined, previousSnapshotEncounterId: previous.encounterId, changeStatus: "no_change" });
  const menstrualFieldsSuppressed = isPregnancyMenstrualUiSuppressed(context);
  const abnormalOptions = context === "pregnancy"
    ? []
    : context === "postpartum"
      ? ["abnormal bleeding", "infection warning", "wound concern"]
      : context === "menopause" || context === "hysterectomy"
        ? ["postmenopausal bleeding", "new bleeding", "vaginal discharge"]
        : ["amenorrhea", "oligomenorrhea", "polymenorrhea", "hypomenorrhea", "heavy menstrual bleeding", "dysmenorrhea", "intermenstrual bleeding", "postcoital bleeding"];
  const toggleFlag = (flag: string) => update({ changeStatus: "changed", abnormalFlags: current.abnormalFlags?.includes(flag) ? current.abnormalFlags.filter((item) => item !== flag) : [...(current.abnormalFlags ?? []), flag] });
  const pregnancyLmp = String(pregnancyEpisode?.lmpDate ?? "");
  const pregnancyEdd = String(pregnancyEpisode?.estimatedDueDate ?? "");
  const authoritativeEdd = dateOnly(current.edd ?? pregnancyEdd);
  const baseline = current.baselineProfile ?? previous?.baselineProfile;
  const eddMode = current.eddMode ?? "manual";
  const eddSource: EddSource = current.eddSource ?? (eddMode === "manual" ? "MANUAL" : "LMP");

  const previewEdd = () => {
    try {
      let nextCandidate: EddCandidate;
      if (eddMode === "manual") {
        nextCandidate = calculateEddCandidate({ mode: "manual", source: "MANUAL", manualEdd: current.manualEdd ?? "", sourceDate: current.datingSourceDate || current.datingConfirmationDate || current.manualEdd });
      } else if (eddSource === "LMP") {
        nextCandidate = calculateEddCandidate({ mode: "calculated", source: "LMP", lmpDate: current.lmp ?? pregnancyLmp });
      } else if (eddSource === "KNOWN_CONCEPTION") {
        nextCandidate = calculateEddCandidate({ mode: "calculated", source: "KNOWN_CONCEPTION", conceptionDate: current.knownConceptionDate ?? "" });
      } else if (eddSource === "IVF_ET") {
        nextCandidate = calculateEddCandidate({ mode: "calculated", source: "IVF_ET", transferDate: current.ivfTransferDate ?? "", embryoAgeDays: current.ivfEmbryoAgeDays === "3" ? 3 : 5 });
      } else {
        nextCandidate = calculateEddCandidate({
          mode: "calculated",
          source: "ULTRASOUND",
          scanDate: current.ultrasoundScanDate ?? "",
          ...(current.ultrasoundEdd ? { ultrasoundEdd: current.ultrasoundEdd } : {}),
          ...(current.ultrasoundGestationalWeeks !== undefined && current.ultrasoundGestationalWeeks !== "" ? { gestationalWeeks: Number(current.ultrasoundGestationalWeeks) } : {}),
          ...(current.ultrasoundGestationalDays !== undefined && current.ultrasoundGestationalDays !== "" ? { gestationalDays: Number(current.ultrasoundGestationalDays) } : {})
        });
      }
      setCandidate(nextCandidate);
      setDatingError("");
    } catch (error) {
      setCandidate(null);
      setDatingError(error instanceof Error ? error.message : "Could not calculate an EDD candidate.");
    }
  };

  const confirmCandidate = () => {
    if (!candidate) {
      setDatingError("Create a Calculation preview before confirming the authoritative EDD.");
      return;
    }
    try {
      const currentConfirmation: Partial<EddConfirmation> | null = authoritativeEdd ? {
        edd: authoritativeEdd,
        eddMode: current.eddMode ?? "manual",
        datingMethod: (current.eddSource ?? current.datingMethod ?? String(pregnancyEpisode?.datingMethod ?? "MANUAL")) as EddSource,
        datingSourceDate: current.datingSourceDate,
        datingConfirmationDate: current.datingConfirmationDate,
        datingClinician: current.datingClinician,
        datingHistory: current.datingHistory ?? []
      } : null;
      const confirmed = confirmEddCandidate({
        candidate,
        current: currentConfirmation,
        clinician: current.datingClinician ?? "",
        confirmationDate: current.datingConfirmationDate ?? "",
        replaceConfirmed: current.replaceConfirmedEdd === true,
        correctionReason: current.datingCorrectionReason
      });
      update({
        ...confirmed,
        eddSource: confirmed.datingMethod,
        changeStatus: "changed",
        replaceConfirmedEdd: false
      });
      setCandidate(null);
      setDatingError("");
    } catch (error) {
      setDatingError(error instanceof Error ? error.message : "Could not confirm the authoritative EDD.");
    }
  };

  const baselineText = baseline
    ? [baseline.usualRegularity, baseline.usualCycleLength ? `${baseline.usualCycleLength}-day interval` : "", baseline.usualBleedingDuration ? `${baseline.usualBleedingDuration}-day bleeding` : "", baseline.usualFlow].filter(Boolean).join(" · ") || "Baseline recorded"
    : "No pre-pregnancy menstrual baseline recorded.";

  return <section className="reproductive-status-editor wide">
    <div className="section-heading"><div><h3>{reproductiveTitle(context)}</h3><p className="muted">Visit-linked structured snapshot. Previous records remain unchanged.</p></div>{previous ? <button className="button secondary compact" type="button" onClick={noChange}>No change since previous visit</button> : null}</div>
    {previous ? <p className="reproductive-previous-summary">Previous: {snapshotSummary(previous)}</p> : null}
    {context === "pregnancy" && (pregnancyLmp || pregnancyEdd) ? <div className="notice">Active pregnancy dating · LMP {dateOnly(pregnancyLmp) || "Not recorded"} · EDD {dateOnly(pregnancyEdd) || "Not recorded"} · {String(pregnancyEpisode?.datingMethod ?? "Dating method not recorded")}</div> : null}
    {menstrualFieldsSuppressed ? <div className="notice reproductive-baseline-summary"><strong>Pre-pregnancy menstrual baseline</strong><span>{baselineText}. This history is preserved and is not treated as active menstruation during pregnancy.</span></div> : null}
    <div className="form-grid reproductive-fields">
      {context !== "postpartum" && context !== "hysterectomy" ? <label>{context === "pregnancy" ? "Pregnancy dating LMP (historical)" : "LMP"}<input type="date" value={dateOnly(current.lmp ?? (context === "pregnancy" ? pregnancyLmp : ""))} onChange={(event) => update({ lmp: event.target.value, changeStatus: "changed" })} /></label> : null}
      {context === "pregnancy" ? <>
        <label>LMP certainty<select value={current.lmpCertainty ?? ""} onChange={(event) => update({ lmpCertainty: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>certain</option><option>uncertain</option></select></label>
        <label>Pregnancy bleeding status<select value={current.pregnancyBleedingStatus ?? ""} onChange={(event) => update({ pregnancyBleedingStatus: event.target.value, changeStatus: "changed" })}><option value="">None recorded</option><option value="none">No bleeding</option><option value="spotting">Spotting</option><option value="light">Light bleeding</option><option value="moderate">Moderate bleeding</option><option value="heavy">Heavy bleeding</option><option value="resolved">Resolved</option></select></label>
        <label>Pregnancy bleeding onset<input type="date" value={current.pregnancyBleedingOnsetDate ?? ""} onChange={(event) => update({ pregnancyBleedingOnsetDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>EDD mode<select value={eddMode} onChange={(event) => { const mode = event.target.value as "manual" | "calculated"; update({ eddMode: mode, eddSource: mode === "manual" ? "MANUAL" : "LMP", changeStatus: "changed" }); setCandidate(null); setDatingError(""); }}><option value="manual">Manual</option><option value="calculated">Calculated</option></select></label>
        {eddMode === "calculated" ? <label>Calculation source<select value={eddSource} onChange={(event) => { update({ eddSource: event.target.value as EddSource, changeStatus: "changed" }); setCandidate(null); }}><option value="LMP">LMP</option><option value="ULTRASOUND">Ultrasound</option><option value="IVF_ET">IVF / embryo transfer</option><option value="KNOWN_CONCEPTION">Known conception date</option></select></label> : null}
        {eddMode === "manual" ? <><label>Proposed manual EDD<input type="date" value={current.manualEdd ?? ""} onChange={(event) => update({ manualEdd: event.target.value, datingSourceDate: event.target.value, changeStatus: "changed" })} /></label></> : null}
        {eddMode === "calculated" && eddSource === "KNOWN_CONCEPTION" ? <label>Known conception date<input type="date" value={current.knownConceptionDate ?? ""} onChange={(event) => update({ knownConceptionDate: event.target.value, changeStatus: "changed" })} /></label> : null}
        {eddMode === "calculated" && eddSource === "IVF_ET" ? <><label>Embryo transfer date<input type="date" value={current.ivfTransferDate ?? ""} onChange={(event) => update({ ivfTransferDate: event.target.value, changeStatus: "changed" })} /></label><label>Embryo age<select value={current.ivfEmbryoAgeDays ?? "5"} onChange={(event) => update({ ivfEmbryoAgeDays: event.target.value as "3" | "5", changeStatus: "changed" })}><option value="5">Day 5</option><option value="3">Day 3</option></select></label></> : null}
        {eddMode === "calculated" && eddSource === "ULTRASOUND" ? <><label>Ultrasound scan date<input type="date" value={current.ultrasoundScanDate ?? ""} onChange={(event) => update({ ultrasoundScanDate: event.target.value, changeStatus: "changed" })} /></label><label>Explicit scan EDD (optional)<input type="date" value={current.ultrasoundEdd ?? ""} onChange={(event) => update({ ultrasoundEdd: event.target.value, changeStatus: "changed" })} /></label><label>GA weeks<input type="number" min="0" max="40" value={current.ultrasoundGestationalWeeks ?? ""} onChange={(event) => update({ ultrasoundGestationalWeeks: event.target.value, changeStatus: "changed" })} /></label><label>GA days<input type="number" min="0" max="6" value={current.ultrasoundGestationalDays ?? ""} onChange={(event) => update({ ultrasoundGestationalDays: event.target.value, changeStatus: "changed" })} /></label></> : null}
        <div className="wide form-actions"><button className="button secondary" type="button" onClick={previewEdd}>Preview EDD</button></div>
        {candidate ? <div className="notice wide"><strong>Calculation preview</strong>: {candidate.edd} from {candidate.source} ({candidate.formula}) · clinician confirmation required.</div> : null}
        {datingError ? <p className="alert warning wide">{datingError}</p> : null}
        <label>Authoritative EDD<input type="date" value={authoritativeEdd} readOnly /></label>
        <label>Confirmation date<input type="date" value={current.datingConfirmationDate ?? ""} onChange={(event) => update({ datingConfirmationDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Dating clinician<input value={current.datingClinician ?? ""} onChange={(event) => update({ datingClinician: event.target.value, changeStatus: "changed" })} /></label>
        {authoritativeEdd && candidate && authoritativeEdd !== candidate.edd ? <label className="checkbox-row wide"><input type="checkbox" checked={current.replaceConfirmedEdd === true} onChange={(event) => update({ replaceConfirmedEdd: event.target.checked, changeStatus: "changed" })} />Explicitly replace the confirmed EDD</label> : null}
        <label className="wide">Discrepancy / correction reason<input value={current.datingCorrectionReason ?? ""} onChange={(event) => update({ datingCorrectionReason: event.target.value, changeStatus: "changed" })} /></label>
        <div className="wide form-actions"><button className="button" type="button" disabled={!candidate} onClick={confirmCandidate}>Confirm authoritative EDD</button>{current.datingHistory?.length ? <span className="badge">datingHistory: {current.datingHistory.length} prior confirmed EDD</span> : null}</div>
      </> : null}
      {["gynecology", "infertility", "general"].includes(context) ? <>
        <label>Regularity<select value={current.regularity ?? ""} onChange={(event) => update({ regularity: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>regular</option><option>irregular</option><option>amenorrhea</option><option>unknown</option></select></label>
        <label>Cycle interval (days)<input type="number" min="15" max="180" value={current.cycleLength ?? ""} onChange={(event) => update({ cycleLength: event.target.value, changeStatus: "changed" })} /></label>
        <label>Bleeding duration (days)<input type="number" min="0" max="30" value={current.bleedingDuration ?? ""} onChange={(event) => update({ bleedingDuration: event.target.value, changeStatus: "changed" })} /></label>
        <label>Flow<select value={current.flow ?? ""} onChange={(event) => update({ flow: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>light</option><option>moderate</option><option>heavy</option><option>variable</option></select></label>
      </> : null}
      {context === "infertility" ? <>
        <label>Induction-cycle status<input value={current.inductionStatus ?? ""} onChange={(event) => update({ inductionStatus: event.target.value, changeStatus: "changed" })} /></label>
        <label>Cycle number<input type="number" min="1" value={current.cycleNumber ?? ""} onChange={(event) => update({ cycleNumber: event.target.value, changeStatus: "changed" })} /></label>
        <label>Trigger date<input type="date" value={current.triggerDate ?? ""} onChange={(event) => update({ triggerDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Expected ovulation<input type="date" value={current.expectedOvulationDate ?? ""} onChange={(event) => update({ expectedOvulationDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Next scan<input type="date" value={current.nextScanDate ?? ""} onChange={(event) => update({ nextScanDate: event.target.value, changeStatus: "changed" })} /></label>
      </> : null}
      {context === "postpartum" ? <>
        <label>Delivery date<input type="date" value={current.deliveryDate ?? ""} onChange={(event) => update({ deliveryDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Delivery mode<input value={current.deliveryMode ?? ""} onChange={(event) => update({ deliveryMode: event.target.value, changeStatus: "changed" })} /></label>
        <label>Lochia status<input value={current.lochiaStatus ?? ""} onChange={(event) => update({ lochiaStatus: event.target.value, changeStatus: "changed" })} /></label>
        <label>Return of menstruation<select value={current.returnOfMenstruation ?? ""} onChange={(event) => update({ returnOfMenstruation: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>not returned</option><option>returned</option><option>uncertain</option></select></label>
        <label>Breastfeeding<input value={current.breastfeeding ?? ""} onChange={(event) => update({ breastfeeding: event.target.value, changeStatus: "changed" })} /></label>
        <label>Contraception plan<input value={current.contraception ?? ""} onChange={(event) => update({ contraception: event.target.value, changeStatus: "changed" })} /></label>
      </> : null}
      {context === "menopause" ? <>
        <label>Menopause status<select value={current.menopauseStatus ?? ""} onChange={(event) => update({ menopauseStatus: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>perimenopause</option><option>menopause</option><option>postmenopause</option></select></label>
        <label>Last natural period<input type="date" value={current.lastNaturalPeriod ?? ""} onChange={(event) => update({ lastNaturalPeriod: event.target.value, changeStatus: "changed" })} /></label>
        <label>Hormone therapy<input value={current.hormoneTherapy ?? ""} onChange={(event) => update({ hormoneTherapy: event.target.value, changeStatus: "changed" })} /></label>
      </> : null}
      {context === "hysterectomy" ? <>
        <label>Hysterectomy status<input value={current.hysterectomyStatus ?? ""} onChange={(event) => update({ hysterectomyStatus: event.target.value, changeStatus: "changed" })} /></label>
        <label>Hysterectomy date<input type="date" value={current.hysterectomyDate ?? ""} onChange={(event) => update({ hysterectomyDate: event.target.value, changeStatus: "changed" })} /></label>
        <label>Cervix<select value={current.cervixStatus ?? ""} onChange={(event) => update({ cervixStatus: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>retained</option><option>removed</option><option>unknown</option></select></label>
        <label>Ovaries<select value={current.ovariesStatus ?? ""} onChange={(event) => update({ ovariesStatus: event.target.value, changeStatus: "changed" })}><option value="">Select</option><option>retained</option><option>removed</option><option>one retained</option><option>unknown</option></select></label>
      </> : null}
      {!menstrualFieldsSuppressed && abnormalOptions.length ? <div className="wide reproductive-flags">{abnormalOptions.map((flag) => <label className="checkbox-row" key={flag}><input type="checkbox" checked={current.abnormalFlags?.includes(flag) ?? false} onChange={() => toggleFlag(flag)} />{flag}</label>)}</div> : null}
      <label className="wide">{context === "pregnancy" ? "Pregnancy reproductive narrative" : "Menstrual / reproductive narrative"}<textarea value={current.narrative ?? ""} onChange={(event) => update({ narrative: event.target.value, changeStatus: "changed" })} /></label>
    </div>
  </section>;
}

function FinishModule({ visit, patientName, saveState, finishing, onRefresh, onFinish }: { visit: DoctorVisitState | null; patientName: string; saveState: string; finishing: boolean; onRefresh: () => void; onFinish: (printAfter?: boolean) => Promise<void> }) {
  const encounter = visit?.encounter;
  const structured = structuredInput(encounter?.examinationJson);
  const context = visitContext(String(visit?.patient?.patientType ?? ""), visit?.pregnancyEpisode ?? null, visit?.infertilityEpisode ?? null);
  const pregnancyDatingComplete = Boolean(visit?.pregnancyEpisode?.lmpDate && visit?.pregnancyEpisode?.estimatedDueDate && visit?.pregnancyEpisode?.datingMethod);
  const confirmedSnapshotDatingComplete = Boolean(structured.reproductiveSnapshot?.edd && structured.reproductiveSnapshot?.datingMethod && structured.reproductiveSnapshot?.datingConfirmationDate && structured.reproductiveSnapshot?.datingClinician);
  const reproductiveComplete = context === "pregnancy"
    ? pregnancyDatingComplete || confirmedSnapshotDatingComplete
    : Boolean(structured.reproductiveSnapshot?.changeStatus && (structured.reproductiveSnapshot.changeStatus === "no_change" || structured.reproductiveSnapshot.context));
  const requiredMissing = [
    !String(encounter?.chiefComplaint ?? "").trim() && !structured.complaints.length ? "Complaint" : null,
    !reproductiveComplete ? (context === "pregnancy" ? "Pregnancy dating (confirmed EDD, source, confirmation date, clinician)" : "Menstrual / reproductive status") : null
  ].filter((item): item is string => Boolean(item));
  const recommendedMissing = [["History", encounter?.historyText], ["Examination", encounter?.examText], ["Impression", encounter?.assessmentText], ["Follow-up", (visit?.followUps ?? []).length]].filter(([, value]) => !value).map(([label]) => String(label));
  return (
    <div className="print-packet">
      <div className="form-actions no-print"><button className="button secondary" type="button" onClick={onRefresh}>Refresh packet</button><button className="button" disabled={finishing || requiredMissing.length > 0} type="button" onClick={() => void onFinish(false)}>Finish visit</button><button className="button secondary" disabled={finishing || requiredMissing.length > 0} type="button" onClick={() => void onFinish(true)}>Finish and print</button></div>
      <h2>{patientName}</h2>
      {requiredMissing.length ? <p className="alert danger">Required to finish: {requiredMissing.join(", ")}.</p> : <p className="notice">Required fields complete.</p>}
      {recommendedMissing.length ? <p className="notice">Recommended, nonblocking: {recommendedMissing.join(", ")}.</p> : null}
      {saveState !== "synced" ? <p className="alert warning">Unsaved local changes must sync before completion.</p> : null}
      <section><h3>Encounter</h3><p>{String(visit?.encounter?.chiefComplaint ?? "No chief complaint saved.")}</p></section>
      <section><h3>Prescriptions</h3><p>{(visit?.prescriptions ?? []).length} prescription draft(s)</p></section>
      <section><h3>Requested investigations</h3><p>{(visit?.investigationOrders ?? []).length} request(s)</p></section>
      <section><h3>Follow-up</h3><p>{(visit?.followUps ?? []).length} follow-up task(s)</p></section>
    </div>
  );
}

function StructuredTagPicker({ title, groups, selected, onChange, lenses = false }: { title: string; groups: Record<string, string[]>; selected: StructuredTagItem[]; onChange: (value: StructuredTagItem[]) => void; lenses?: boolean }) {
  const [category, setCategory] = useState(Object.keys(groups)[0] ?? "");
  const [view, setView] = useState("Common");
  const [search, setSearch] = useState("");
  const all = Object.entries(groups).flatMap(([group, labels]) => labels.map((label) => ({ label, category: group })));
  const visible = view === "Search All" ? all.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())) : all.filter((item) => item.category === category);
  const isComplaint = title.toLowerCase().includes("complaint");
  const toggle = (item: { label: string; category: string }) => {
    const id = clinicalItemId(item.category, item.label);
    return onChange(selected.some((entry) => (entry.id ?? clinicalItemId(entry.category, entry.label)) === id)
      ? selected.filter((entry) => (entry.id ?? clinicalItemId(entry.category, entry.label)) !== id)
      : [...selected, { ...item, id, ...(isComplaint ? { status: "Active" as const } : {}) }]);
  };
  const setComplaintStatus = (id: string, status: StructuredTagItem["status"]) => onChange(selected.map((item) => (item.id ?? clinicalItemId(item.category, item.label)) === id ? { ...item, id, status } : item));
  const selectedLabel = title.includes("complaint") ? "Selected complaints" : "Selected history";
  return <section className="structured-encounter-picker wide"><h3>{title}</h3>{lenses ? <div className="clinical-lenses clinical-filter-row">{["Common", "Relevant", "Favorites", "Recent", "Search All"].map((label) => <button className={view === label ? "active" : ""} key={label} type="button" onClick={() => setView(label)}>{label}</button>)}</div> : null}<div className="clinical-lenses clinical-category-grid">{Object.keys(groups).map((group) => <button className={category === group ? "active" : ""} key={group} type="button" onClick={() => { setCategory(group); setView("Common"); }}>{group}</button>)}</div>{view === "Search All" ? <input aria-label={`Search ${title}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search all" /> : null}<div className="clinical-chip-cloud" aria-label={`Available ${title}`}>{visible.map((item) => <button className={selected.some((entry) => (entry.id ?? clinicalItemId(entry.category, entry.label)) === clinicalItemId(item.category, item.label)) ? "clinical-chip selected" : "clinical-chip"} key={`${item.category}:${item.label}`} type="button" onClick={() => toggle(item)}>{item.label}</button>)}</div><div className="selected-clinical-basket"><strong>{selectedLabel} ({selected.length})</strong>{selected.map((item) => { const id = item.id ?? clinicalItemId(item.category, item.label); return <span className="selected-clinical-item" key={id}><button type="button" onClick={() => toggle(item)}>{item.label} Ã—</button>{isComplaint ? <select aria-label={`${item.label} status`} value={item.status ?? "Active"} onChange={(event) => setComplaintStatus(id, event.target.value as StructuredTagItem["status"])}><option>Active</option><option>Improving</option><option>Resolved</option><option>Chronic</option></select> : null}</span>; })}</div></section>;
}

const examinationGroups: Record<string, string[]> = {
  general: ["general condition", "pallor"],
  pregnancy: ["vitals", "abdominal examination", "fundal height", "fetal heart", "presentation", "uterine activity", "cervical os", "speculum"],
  gynecology: ["abdomen", "external genital examination", "speculum", "cervical os", "bimanual", "uterine size", "adnexa", "pelvic mass", "breast"],
  infertility: ["vitals / BMI", "thyroid", "androgen-excess findings", "breast / galactorrhea", "pelvic examination", "uterine size", "adnexa"],
  postpartum: ["vitals", "breast / breastfeeding", "abdomen", "uterine involution", "lochia", "perineum / episiotomy", "cesarean wound", "thromboembolism warning signs", "infection warning signs", "mental-health screening"]
};
const exclusiveValues: Record<string, string[]> = { pallor: ["Not examined", "Absent", "Present"], "cervical os": ["Not examined", "Closed", "Open"], "uterine size": ["Not examined", "Normal", "Enlarged"] };

function StructuredExamination({ context, value, onChange }: { context: string; value: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  const [showAll, setShowAll] = useState(false);
  const relevant = [...new Set([...examinationGroups.general!, ...(examinationGroups[context] ?? [])])];
  const groups = showAll ? [...new Set(Object.values(examinationGroups).flat())] : relevant;
  const selected = Object.entries(value).filter(([, finding]) => finding);
  return <section className="structured-examination wide"><div className="section-heading"><h3>Structured examination Â· {context}</h3><button className="button secondary compact" type="button" onClick={() => setShowAll((current) => !current)}>{showAll ? "Show relevant" : "Add another group"}</button></div>{selected.length ? <div className="selected-clinical-basket"><strong>Selected findings ({selected.length})</strong>{selected.map(([group, finding]) => <button key={group} type="button" onClick={() => { const next = { ...value }; delete next[group]; onChange(next); }}>{group}: {finding} Ã—</button>)}</div> : null}<div className="structured-examination-groups">{groups.map((group, index) => { const options = exclusiveValues[group] ?? ["Not examined", "Normal", "Abnormal", "Declined", "Unable to assess"]; return <details key={group} open={index < 2 || Boolean(value[group])}><summary><strong>{group}</strong><span>{value[group] || "Not selected"}</span></summary><div className="exclusive-finding-options">{options.map((option) => <button className={value[group] === option ? "active" : ""} key={option} type="button" onClick={() => onChange({ ...value, [group]: option })}>{option}</button>)}</div></details>; })}</div></section>;
}

function saveStateLabel(state: string) {
  if (state === "syncing") return "Syncing";
  if (state === "synced") return "Synced";
  if (state === "offline") return "Offline";
  if (state === "failed") return "Save failed â€” Retry";
  if (state === "local") return `Saved locally at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return "Unsaved changes";
}

function readLocalVisitDraft(key: string) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as Record<string, unknown> : null;
  } catch {
    return null;
  }
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

function structuredInput(value: unknown): StructuredClinicalInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyStructuredInput;
  const row = value as Partial<StructuredClinicalInput>;
  const complaints = Array.isArray(row.complaints) ? row.complaints.map((item) => ({ ...item, id: item.id ?? clinicalItemId(item.category, item.label), status: item.status ?? "Active" as const })) : [];
  return { version: row.version ?? 2, complaints, history: Array.isArray(row.history) ? row.history : [], examination: row.examination && typeof row.examination === "object" ? row.examination : {}, reproductiveSnapshot: row.reproductiveSnapshot && typeof row.reproductiveSnapshot === "object" ? row.reproductiveSnapshot : undefined };
}

function visitContext(patientType: string, pregnancyEpisode?: Record<string, unknown> | null, infertilityEpisode?: Record<string, unknown> | null) {
  if (pregnancyEpisode && ["active", "current", "in_progress"].includes(String(pregnancyEpisode.status ?? "active").toLowerCase())) return "pregnancy";
  if (infertilityEpisode && ["active", "current", "in_progress"].includes(String(infertilityEpisode.status ?? "active").toLowerCase())) return "infertility";
  const normalized = patientType.toLowerCase().replaceAll("-", "_");
  if (normalized.includes("hysterectomy")) return "hysterectomy";
  if (normalized.includes("menopause") || normalized.includes("postmenopausal") || normalized.includes("perimenopause")) return "menopause";
  if (normalized.includes("postpartum") || normalized.includes("postnatal")) return "postpartum";
  if (normalized.includes("infertility") || normalized.includes("fertility") || normalized.includes("ivf") || normalized.includes("icsi")) return "infertility";
  if (normalized.includes("obstetric") || normalized === "ob" || normalized.includes("pregnan")) return "pregnancy";
  if (normalized.includes("gyn")) return "gynecology";
  return "general";
}

function clinicalItemId(category: string, label: string) {
  return `${category}:${label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function reproductiveTitle(context: string) {
  if (context === "pregnancy") return "Pregnancy dating and pre-pregnancy cycle";
  if (context === "infertility") return "Menstrual and monitored fertility cycle";
  if (context === "postpartum") return "Postpartum reproductive status";
  if (context === "menopause") return "Menopause and bleeding status";
  if (context === "hysterectomy") return "Post-hysterectomy reproductive status";
  return "Menstrual status for this visit";
}

function snapshotSummary(snapshot: ReproductiveSnapshot) {
  return [
    snapshot.lmp ? `LMP ${dateOnly(snapshot.lmp)}` : null,
    snapshot.regularity,
    snapshot.cycleLength ? `${snapshot.cycleLength}-day interval` : null,
    snapshot.flow,
    ...(snapshot.abnormalFlags ?? [])
  ].filter(Boolean).join(" Â· ") || "Structured status recorded";
}

function dateOnly(value: unknown) {
  const text = String(value ?? "");
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
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
