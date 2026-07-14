import { AppActionButton } from "@/components/actions/AppActionButton";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { completeDoctorVisit, createDoctorVisitFollowUp, getCurrentDoctorVisit, getDoctorVisitPacket, startDoctorVisit, updateDoctorVisit, type DoctorVisitState } from "@/lib/doctor-visit";
import { searchMedications, type MedicationResult } from "@/lib/medications";
import { Patient, ReferenceResult, TimelineItem, values, submitVisitAction, CareAssistPanel, MedicationSafetyTerminal, ReferencePicker } from "./patient-components";
import { HistorySheetWorkspace } from "./panel-components";
import { DoctorSignatureBadge } from "./timeline-components";
import { createSecureIdempotencyKey } from "@/lib/idempotency-key";
import { addUniqueBasketItem, SelectedBasket, type SelectedBasketItem } from "@/components/clinical/SelectedBasket";

type PrescriptionBasketItem = SelectedBasketItem & { medication: MedicationResult };
type InvestigationBasketItem = SelectedBasketItem & { investigation: ReferenceResult };
const visitSteps = ["History", "Examination", "Assessment", "Plan", "Review"] as const;

export function DoctorVisitFlow({ patient, related, onReload, permissions = [], roles = [] }: { patient: Patient; related: Record<string, Record<string, unknown>[]>; onReload: () => void; permissions?: string[]; roles?: string[] }) {
  const [visit, setVisit] = useState<DoctorVisitState | null>(null);
  const [status, setStatus] = useState("Open or start a visit.");
  const [selectedMedication, setSelectedMedication] = useState<MedicationResult | null>(null);
  const [hoveredMedication, setHoveredMedication] = useState<MedicationResult | null>(null);
  const [medicationQuery, setMedicationQuery] = useState("");
  const [medicationResults, setMedicationResults] = useState<MedicationResult[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<ReferenceResult | null>(null);
  const [prescriptionBasket, setPrescriptionBasket] = useState<PrescriptionBasketItem[]>([]);
  const [investigationBasket, setInvestigationBasket] = useState<InvestigationBasketItem[]>([]);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState("");
  const [investigationReason, setInvestigationReason] = useState("");
  const [hint, setHint] = useState("");
  const actionKeys = useRef<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState<(typeof visitSteps)[number]>("History");
  const [activePlanSection, setActivePlanSection] = useState("Prescription");
  const encounterId = String(visit?.encounter?.id ?? "");
  const latestHistorySheetId = String((related["history-sheet"] ?? [])[0]?.id ?? "") || undefined;
  const terminalMedication = hoveredMedication ?? selectedMedication;
  const activeStepIndex = Math.max(0, visitSteps.indexOf(activeStep));
  const encounterReady = Boolean(String(visit?.encounter?.chiefComplaint ?? "").trim() && String(visit?.encounter?.assessmentText ?? "").trim() && String(visit?.encounter?.planText ?? "").trim());

  useEffect(() => {
    void getCurrentDoctorVisit(patient.id)
      .then((data) => {
        setVisit(data);
        setStatus(data.encounter ? "Draft visit open." : "No active draft visit.");
      })
      .catch(() => setStatus("Doctor visit requires clinical access."));
  }, [patient.id]);

  useEffect(() => {
    const navigate = (event: Event) => {
      const action = (event as CustomEvent<string>).detail;
      const index = visitSteps.indexOf(activeStep);
      if (action === "back") setActiveStep(visitSteps[Math.max(0, index - 1)] ?? "History");
      if (action === "next") setActiveStep(visitSteps[Math.min(visitSteps.length - 1, index + 1)] ?? "Review");
      if (action === "review") setActiveStep("Review");
      if (action === "save") setStatus("Use the active section save action to persist this doctor-reviewed draft.");
    };
    window.addEventListener("patient-visit:navigate", navigate);
    return () => window.removeEventListener("patient-visit:navigate", navigate);
  }, [activeStep]);

  useEffect(() => {
    if (!medicationQuery.trim()) {
      setMedicationResults([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      void searchMedications(medicationQuery)
        .then((data) => setMedicationResults((data.results ?? []).filter((row) => row.genericName || row.type === "generic_medication").slice(0, 8)))
        .catch(() => setMedicationResults([]));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [medicationQuery]);

  async function startVisit() {
    setStatus("Starting visit");
    try {
      const data = await startDoctorVisit(patient.id);
      setVisit(data);
      setActiveStep("History");
      setStatus("Draft visit open.");
    } catch {
      setStatus("Could not start visit. Check clinical role and permissions.");
    }
  }

  async function saveEncounter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!encounterId) return;
    const payload = values(event.currentTarget, ["chiefComplaint", "historyText", "examText", "assessmentText", "planText"]) as Record<string, string>;
    await updateDoctorVisit(patient.id, encounterId, payload);
    setStatus("Encounter draft saved.");
    setVisit(await getCurrentDoctorVisit(patient.id));
  }

  async function savePrescriptionBasket() {
    if (!encounterId || !prescriptionBasket.length) return;
    try {
      actionKeys.current.prescription ||= createSecureIdempotencyKey();
      await submitVisitAction(patient.id, "prescriptions", { encounterId, items: prescriptionBasket.map(({ medication }) => ({ medicationName: medication.genericName ?? medication.brandName ?? medication.tradeName ?? "Generic medication", medicationGenericId: medication.type === "generic_medication" ? medication.id : undefined, instructions: prescriptionInstructions || undefined })) }, actionKeys.current.prescription);
      delete actionKeys.current.prescription;
      setSelectedMedication(null);
      setPrescriptionBasket([]);
      setPrescriptionInstructions("");
      setStatus("Prescription draft updated with generic medication.");
      setActivePlanSection("Investigations");
      setVisit(await getCurrentDoctorVisit(patient.id));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Prescription save failed. The selected medication was preserved for retry.");
      throw error;
    }
  }

  async function saveInvestigationBasket() {
    if (!encounterId || !investigationBasket.length) return;
    try {
      actionKeys.current.investigation ||= createSecureIdempotencyKey();
      await submitVisitAction(patient.id, "investigations", { encounterId, priority: "routine", items: investigationBasket.map(({ investigation }) => ({ category: investigationCategory(investigation.category), testName: investigation.label, instructions: investigationReason || undefined })) }, actionKeys.current.investigation);
      delete actionKeys.current.investigation;
      setSelectedInvestigation(null);
      setInvestigationBasket([]);
      setInvestigationReason("");
      setStatus("Investigation request added.");
      setActivePlanSection("Follow-up");
      setVisit(await getCurrentDoctorVisit(patient.id));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Investigation save failed. CBC/TSH selection was preserved for retry.");
      throw error;
    }
  }

  async function addFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!encounterId) return;
    try {
      actionKeys.current.followUp ||= createSecureIdempotencyKey();
      await createDoctorVisitFollowUp(patient.id, encounterId, values(event.currentTarget, ["dueAt", "title", "note"]) as { dueAt?: string; title?: string; note?: string }, actionKeys.current.followUp);
      delete actionKeys.current.followUp;
      setStatus("Follow-up task added.");
      setActiveStep("Review");
      setVisit(await getCurrentDoctorVisit(patient.id));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Follow-up save failed. The form was preserved for retry.");
    }
  }

  async function loadPacket() {
    if (!encounterId) return;
    setVisit(await getDoctorVisitPacket(patient.id, encounterId));
    setActiveStep("Review");
    setStatus("Visit packet refreshed.");
  }

  async function completeVisit() {
    if (!encounterId || !encounterReady) return;
    await completeDoctorVisit(encounterId);
    setStatus("Visit completed and signed. Future changes require an audited amendment.");
    setVisit(await getDoctorVisitPacket(patient.id, encounterId));
  }

  const visitSignature = visit?.encounter?.doctorSignature as TimelineItem["doctorSignature"] | undefined;

  return (
    <section className="panel doctor-visit-flow">
      <div className="section-heading">
        <div>
          <h2>Visit</h2>
          <p className="muted">One clinical section is shown at a time. Clinical decisions and completion remain with the doctor.</p>
        </div>
        <div className="actions" style={{ display: "flex", gap: "0.5rem" }}>
          {encounterId ? <AppActionButton actionId="encounter.void" userPermissions={permissions} userRoles={roles} className="button secondary danger" type="button" onClick={async () => {
            const reason = window.prompt("Reason for voiding this draft visit:")?.trim();
            if (!reason) return;
            const response = await fetch(`${getApiBaseUrl()}/encounters/${encounterId}/void`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
            if (!response.ok) { setStatus("Could not void this draft visit."); return; }
            setVisit(null); setStatus("Visit voided."); onReload();
          }}><ThreeDMedicalIcon name="encounter" size="sm" tone="rose" /> Void</AppActionButton> : null}
          <button className="button" type="button" onClick={() => void startVisit()} disabled={Boolean(encounterId)}>Start Visit</button>
        </div>
      </div>
      {encounterId ? <span className="badge warning">Draft</span> : null}
      {visitSignature?.doctorName ? <DoctorSignatureBadge signature={visitSignature} /> : null}
      <p className="muted">{status}</p>
      {!encounterId ? <p className="warning-text">Start a visit before adding encounter, prescription, investigation, or follow-up items.</p> : null}

      <div className="visit-progress-header"><strong>Step {activeStepIndex + 1} of {visitSteps.length} · {activeStep}</strong><div className="form-actions"><button className="button secondary compact" type="button" disabled={activeStepIndex === 0} onClick={() => setActiveStep(visitSteps[activeStepIndex - 1] ?? "History")}>Back</button><span className="badge">Saved</span><button className="button secondary compact" type="button" disabled={activeStepIndex >= visitSteps.length - 1} onClick={() => setActiveStep(visitSteps[activeStepIndex + 1] ?? "Review")}>Next</button></div></div>

      {activeStep === "History" ? <div className="doctor-friendly-grid active-visit-step">
        <section className="panel">
          <div className="section-heading"><h3>History</h3><span className="badge">Step 1</span></div>
          <form className="form-grid" onSubmit={(event) => void saveEncounter(event)}><fieldset className="obgyn-fieldset wide"><legend>Presenting complaint</legend><label>Complaint<input name="chiefComplaint" defaultValue={String(visit?.encounter?.chiefComplaint ?? "")} /></label><label>History of presenting concern<textarea name="historyText" defaultValue={String(visit?.encounter?.historyText ?? "")} /></label></fieldset><button className="button" type="submit" disabled={!encounterId}>Save presenting complaint</button></form>
          <HistorySheetWorkspace related={related} onSubmit={async (endpoint, payload, idempotencyKey) => { await submitVisitAction(patient.id, endpoint, payload, idempotencyKey); onReload(); }} status={status} />
        </section>
      </div> : null}

      {activeStep === "Examination" ? <form className="panel form-grid active-visit-step" onSubmit={(event) => void saveEncounter(event)}>
        <div className="section-heading"><h3>Examination</h3><span className="badge warning">Doctor authored</span></div>
        <label>Examination notes<textarea name="examText" defaultValue={String(visit?.encounter?.examText ?? "")} /></label>
        <button className="button" type="submit" disabled={!encounterId}>Save examination and continue</button>
      </form> : null}

      {activeStep === "Assessment" ? <div className="doctor-friendly-grid active-visit-step"><form className="panel form-grid" onSubmit={(event) => void saveEncounter(event)}>
        <div className="section-heading"><h3>Assessment</h3><span className="badge warning">Doctor review required</span></div>
        <label>Doctor impression<textarea name="assessmentText" defaultValue={String(visit?.encounter?.assessmentText ?? "")} /></label>
        <button className="button" type="submit" disabled={!encounterId}>Save assessment</button>
      </form><CareAssistPanel patientId={patient.id} historySheetId={latestHistorySheetId} encounterId={encounterId || undefined} prescriptionId={String((visit?.prescriptions ?? [])[0]?.id ?? "") || undefined} investigationOrderId={String((visit?.investigationOrders ?? [])[0]?.id ?? "") || undefined} /></div> : null}

      {activeStep === "Plan" ? <div className="active-visit-step">
        <form className="panel form-grid" onSubmit={(event) => void saveEncounter(event)}><label>Doctor plan<textarea id="doctor-visit-planText" name="planText" defaultValue={String(visit?.encounter?.planText ?? "")} /></label><button className="button" type="submit" disabled={!encounterId}>Save plan summary</button></form>
        <div className="visit-plan-tabs" aria-label="Plan sections">{["Prescription", "Investigations", "Follow-up"].map((section) => <button className={activePlanSection === section ? "active" : ""} key={section} onClick={() => setActivePlanSection(section)} type="button">{section}</button>)}</div>
      {activePlanSection === "Prescription" ? <div className="doctor-friendly-grid">
        <form className="panel form-grid" onSubmit={(event) => event.preventDefault()}>
          <div className="section-heading"><h3>Prescription Draft</h3><span className="badge warning">Generic-first</span></div>
          <label>Search generic medication<input value={medicationQuery} onChange={(event) => setMedicationQuery(event.target.value)} placeholder="Search generic name or class" /></label>
          <div className="data-list">
            {medicationResults.map((row) => (
              <button className="data-row" key={`${row.type}-${row.id}`} type="button" onClick={() => { setSelectedMedication(row); setPrescriptionBasket((items) => addUniqueBasketItem(items, { key: `prescription:${row.id}`, stableId: row.id, kind: "prescription", label: row.genericName ?? row.brandName ?? row.tradeName ?? "Generic medication", subtitle: row.familyName ?? row.className ?? "Generic medication", medication: row })); }} onFocus={() => setHoveredMedication(row)} onMouseEnter={() => setHoveredMedication(row)} onMouseLeave={() => setHoveredMedication(null)}>
                <strong>{row.genericName ?? row.brandName ?? row.tradeName ?? "Generic medication"}</strong>
                <span className="badge">{row.familyName ?? row.family ?? row.className ?? "Generic visible"}</span>
                {row.tradeName || row.brandName ? <span className="muted">Trade/search match: {row.tradeName ?? row.brandName}</span> : null}
              </button>
            ))}
          </div>
          {selectedMedication ? <p className="notice">Selected generic: {selectedMedication.genericName ?? selectedMedication.brandName ?? selectedMedication.tradeName}</p> : null}
          <label>Manual doctor instructions<textarea name="instructions" value={prescriptionInstructions} onChange={(event) => setPrescriptionInstructions(event.target.value)} placeholder="Doctor-written instructions only" /></label>
          <SelectedBasket title="Prescription medications" items={prescriptionBasket} onChange={setPrescriptionBasket} onSave={savePrescriptionBasket} saveLabel="Save prescription once" />
          <p className="muted">Dose, frequency, and duration are not auto-filled.</p>
        </form>
        <div className="doctor-advanced-tool">
          <MedicationSafetyTerminal medication={terminalMedication} title="Medication Safety Terminal" />
        </div>
      </div> : null}

      {activePlanSection === "Investigations" ? <div className="doctor-friendly-grid">
        <form className="panel form-grid" onSubmit={(event) => event.preventDefault()}>
          <div className="section-heading"><h3>Investigations</h3><span className="badge">Request only</span></div>
          <ReferencePicker title="Investigation search" endpoint="/reference/investigations/search" placeholder="Search investigation" selected={selectedInvestigation} onSelect={(item) => { setSelectedInvestigation(item); if (item) setInvestigationBasket((items) => addUniqueBasketItem(items, { key: `investigation:${item.id}`, stableId: item.id, kind: "investigation", label: item.label, subtitle: item.category, investigation: item })); }} />
          {selectedInvestigation ? <p className="notice">Selected investigation: {selectedInvestigation.label}</p> : null}
          <label>Clinical reason<textarea name="instructions" value={investigationReason} onChange={(event) => setInvestigationReason(event.target.value)} /></label>
          <SelectedBasket title="Investigation requests" items={investigationBasket} onChange={setInvestigationBasket} onSave={saveInvestigationBasket} saveLabel="Save investigations once" />
        </form>
        <section className="panel doctor-advanced-tool">
          <h3>Clinical Note Terminal</h3>
          <p className="muted">Doctor review required. Notes stay here unless inserted into a draft field by the doctor.</p>
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={() => setHint("Doctor review required. No automated diagnosis is generated. Consider documenting differential considerations manually if clinically relevant.")}>Show clinical considerations</button>
            <button className="button secondary" type="button" onClick={() => setHint("Doctor review required. Medication options are not generated from unsourced safety data in this build.")}>Show medication options for review</button>
            <button className="button secondary" type="button" onClick={() => setHint("Doctor review required. No saved doctor-written dosing template is available.")}>Show dosing note from saved template</button>
            <button className="button secondary" type="button" onClick={() => setHint("")}>Dismiss note</button>
          </div>
          {hint ? <p className="notice">{hint}</p> : <p className="muted">No note selected.</p>}
          <button className="button" type="button" disabled={!hint} onClick={() => insertHintIntoPlan(hint, setStatus)}>Insert selected note into draft</button>
        </section>
      </div> : null}

      {activePlanSection === "Follow-up" ? <form className="panel form-grid" onSubmit={(event) => void addFollowUp(event)}>
        <div className="section-heading"><h3>Follow-up</h3><span className="badge">Manual task</span></div>
        <label>Follow-up date<input name="dueAt" type="date" /></label>
        <label>Task title<input name="title" placeholder="Follow-up visit" /></label>
        <label>Note<textarea name="note" /></label>
        <p className="muted">Manual follow-up only. Treatment instructions are not generated automatically.</p>
        <button className="button" type="submit" disabled={!encounterId}>Save follow-up and continue</button>
      </form> : null}
      </div> : null}

      {activeStep === "Review" ? <section className="panel printable-summary active-visit-step">
        <div className="section-heading no-print">
          <h3>Print Packet</h3>
          <div className="form-actions">
            <button className="button secondary" type="button" disabled={!encounterId} onClick={() => void loadPacket()}>Refresh packet</button>
            <button className="button" type="button" disabled={!encounterId} onClick={() => window.print()}>Print packet</button>
            <button className="button" type="button" disabled={!encounterId || !encounterReady || String(visit?.encounter?.status ?? "draft") !== "draft"} onClick={() => void completeVisit()}>Complete Visit</button>
          </div>
        </div>
        <VisitPacketPreview visit={visit} patient={patient} />
      </section> : null}
    </section>
  );
}

export function VisitPacketPreview({ visit, patient }: { visit: DoctorVisitState | null; patient: Patient }) {
    const prescriptions = visit?.prescriptions ?? [];
    const orders = visit?.investigationOrders ?? [];
    const followUps = visit?.followUps ?? [];
    return (
    <div className="print-packet">
      <h2>{patient.firstName} {patient.lastName}</h2>
      <p>File {patient.medicalRecordNumber} | Doctor review required</p>
      <section><h3>Encounter</h3><p>{String(visit?.encounter?.chiefComplaint ?? "No chief complaint saved.")}</p></section>
      <section><h3>History</h3><p>{String(visit?.historySheet?.chiefComplaint ?? "No history sheet summary saved.")}</p></section>
      <section><h3>Care Assist findings</h3>{(visit?.careAssistFindings ?? []).length ? (visit?.careAssistFindings ?? []).slice(0, 8).map((finding, index) => <p key={String(finding.id ?? index)}>{String(finding.title ?? "Care Assist finding")} - {String(finding.status ?? "active")}</p>) : <p>No Care Assist findings saved for this visit.</p>}</section>
      <section><h3>Prescriptions</h3>{prescriptions.length ? prescriptions.map((prescription, index) => <p key={String(prescription.id ?? index)}>{String((prescription.items as Record<string, unknown>[] | undefined)?.map((item) => item.genericName ?? item.medicationName).join(", ") ?? "Generic medication")}</p>) : <p>No prescription draft in this visit.</p>}</section>
      <section><h3>Requested investigations</h3>{orders.length ? orders.map((order, index) => <p key={String(order.id ?? index)}>{String((order.items as Record<string, unknown>[] | undefined)?.map((item) => item.testName).join(", ") ?? "Investigation request")}</p>) : <p>No investigation requests in this visit.</p>}</section>
      <section><h3>Follow-up</h3>{followUps.length ? followUps.map((task, index) => <p key={String(task.id ?? index)}>{String(task.title ?? "Follow-up")} {String(task.dueAt ?? "").slice(0, 10)}</p>) : <p>No follow-up task saved.</p>}</section>
    </div>
    );
}

export function insertHintIntoPlan(hint: string, setStatus: (value: string) => void) {
    const field = document.getElementById("doctor-visit-planText") as HTMLTextAreaElement | null;
    if (!field) {
    setStatus("Open the encounter draft before inserting the selected note.");
    return;
    }

    const insertion = `Doctor review required: ${hint}`;
    field.value = [field.value.trim(), insertion].filter(Boolean).join("\n");
    field.dispatchEvent(new Event("input", { bubbles: true }));
    setStatus("Selected note inserted into the encounter draft. Save draft to persist it.");
}

function investigationCategory(category?: string | null) {
    const value = String(category ?? "").toLowerCase();
    if (/ultrasound|sonograph/.test(value)) return "ultrasound";
    if (/radiology|imaging|x-ray|ct|mri/.test(value)) return "radiology";
    if (/patholog|histolog|biopsy/.test(value)) return "pathology";
    if (/cytolog|pap/.test(value)) return "cytology";
    if (/procedure|endoscopy/.test(value)) return "procedure";
    if (/external|referral/.test(value)) return "external";
    if (/other/.test(value)) return "other";
    return "laboratory";
}
