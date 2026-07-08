"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { useSession } from "../../session";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { autosaveLabel, enqueueOfflineOperation, saveLocalDraft, useAutosaveDraft, useOfflineSyncQueue } from "@/lib/autosave-draft";
import {
  buildMouseFirstDraftNote,
  clinicalChipGroups,
  clinicalChips,
  continueLastWorkItems,
  doctorFavoriteGroups,
  mouseFirstSections,
  resultsReviewInboxItems,
  topClinicalChips,
  type ClinicalChip,
  type MouseFirstSection
} from "@/lib/v1200-productivity";

const steps = [
  ["Complaint", "What brought the patient today?", "Chief complaint"],
  ["History", "Relevant history in the doctor's words.", "History"],
  ["Examination", "Clinical examination notes.", "Examination"],
  ["Impression", "Doctor-written impression or diagnosis text.", "Impression / diagnosis text"],
  ["Prescription", "Manual prescription plan. No automatic prescribing.", "Prescription plan"],
  ["Orders", "Lab or radiology orders to request.", "Orders"],
  ["Follow-up", "Plan and next follow-up.", "Follow-up"],
  ["Finish Visit", "Review, save, then finish when ready.", "Final review"]
] as const;

const complaintCards = [
  "AUB",
  "Pelvic pain",
  "Dysmenorrhea",
  "Dyspareunia",
  "Vaginal discharge",
  "UTI symptoms",
  "Infertility",
  "Amenorrhea",
  "Heavy menstrual bleeding",
  "Postmenopausal bleeding",
  "Pregnancy follow-up",
  "Bleeding in pregnancy",
  "Reduced fetal movement",
  "Routine follow-up"
];

export default function GuidedVisitPage() {
  return (
    <Suspense fallback={<GuidedVisitFallback />}>
      <GuidedVisitContent />
    </Suspense>
  );
}

function GuidedVisitFallback() {
  return (
    <AppShell>
      <section className="visit-shell">
        <div className="visit-header">
          <div>
            <p className="eyebrow">Guided Visit</p>
            <h1>Preparing visit</h1>
            <p className="muted">Open the patient, write doctor-authored notes, then save the visit draft.</p>
          </div>
          <Link className="button secondary" href="/doctor">
            <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
            Back to Doctor Mode
          </Link>
        </div>
        <div className="visit-card">
          <div className="skeleton" />
          <div className="visit-actions">
            <button className="button secondary" disabled type="button">
              <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
              Save Draft
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function GuidedVisitContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const { user, status: sessionStatus } = useSession();
  const roles = user?.roles ?? [];
  const isReceptionistOnly = roles.some((role) => ["Reception", "Receptionist"].includes(role)) && !roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [patientName, setPatientName] = useState("Selected patient");
  const [visitMode, setVisitMode] = useState<"mouse" | "detailed">("mouse");
  const [chipSearch, setChipSearch] = useState("");
  const [activeMouseSection, setActiveMouseSection] = useState<MouseFirstSection>("Complaint");
  const [selectedChips, setSelectedChips] = useState<ClinicalChip[]>([]);
  const [, setChipHistory] = useState<ClinicalChip[]>([]);
  const [mouseFreeText, setMouseFreeText] = useState("");
  const [formState, setFormState] = useState({
    chiefComplaint: "",
    historyText: "",
    examText: "",
    assessmentText: "",
    prescriptionPlan: "",
    ordersPlan: "",
    planText: ""
  });

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("prijClinicToken");
  }, []);
  const apiBaseUrl = useMemo(() => (typeof window === "undefined" ? "" : getApiBaseUrl()), []);
  const generatedDraftNote = useMemo(() => buildMouseFirstDraftNote(selectedChips, mouseFreeText), [mouseFreeText, selectedChips]);
  const hasUnsavedChanges = useMemo(
    () => selectedChips.length > 0 || Boolean(mouseFreeText.trim()) || Object.values(formState).some((value) => value.trim()),
    [formState, mouseFreeText, selectedChips.length]
  );
  const autosave = useAutosaveDraft({
    key: `doctor-visit:${patientId ?? "unassigned"}`,
    entityType: "doctor_visit_draft",
    patientId,
    payload: { ...formState, mouseFirstSelected: selectedChips.map((chip) => chip.label), mouseFirstFreeText: mouseFreeText, generatedDraftNote },
    enabled: Boolean(patientId),
    debounceMs: 400
  });
  const syncQueue = useOfflineSyncQueue(apiBaseUrl, token);

  useEffect(() => {
    if (!patientId) return;
    fetch(`${apiBaseUrl}/patients/${patientId}`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) return;
        const patient = await response.json() as { firstName?: string; lastName?: string };
        setPatientName(`${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || "Selected patient");
      })
      .catch(() => undefined);
  }, [apiBaseUrl, patientId, token]);

  useEffect(() => {
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [hasUnsavedChanges]);

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!patientId) {
      setError("Open a patient file first, then start the guided visit.");
      return;
    }

    const payload = {
      chiefComplaint: mergeDraftField(formState.chiefComplaint, selectedChips.filter((chip) => chip.section === "Complaint").map((chip) => chip.label)),
      historyText: mergeDraftField(formState.historyText, selectedChips.filter((chip) => chip.section === "History" || chip.section === "OB/GYN history").map((chip) => chip.label)),
      examText: mergeDraftField(formState.examText, selectedChips.filter((chip) => chip.section === "Examination").map((chip) => chip.label)),
      assessmentText: formState.assessmentText,
      planText: [
        formState.planText,
        selectedChips.filter((chip) => chip.section === "Plan" || chip.section === "Follow-up").map((chip) => chip.label).join("; "),
        selectedChips.filter((chip) => chip.section === "Investigations").map((chip) => chip.label).join("; "),
        mouseFreeText.trim(),
        formState.prescriptionPlan ? `Prescription plan: ${formState.prescriptionPlan}` : "",
        formState.ordersPlan ? `Orders: ${formState.ordersPlan}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    };

    const response = await fetch(`${apiBaseUrl}${encounterId ? `/encounters/${encounterId}` : `/patients/${patientId}/encounters`}`, {
      method: encounterId ? "PATCH" : "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      await enqueueOfflineOperation({
        entityType: "doctor_visit_draft",
        patientId,
        endpoint: encounterId ? `/encounters/${encounterId}` : `/patients/${patientId}/encounters`,
        method: encounterId ? "PATCH" : "POST",
        payload
      });
      setError("Server unavailable - draft saved on this device and queued for sync.");
      return;
    }

    const encounter = await response.json() as { id?: string };
    if (encounter.id) setEncounterId(encounter.id);
    setSaved("Visit draft saved to the patient file.");
  }

  function toggleChip(chip: ClinicalChip) {
    setSelectedChips((current) => {
      const exists = current.some((item) => item.label === chip.label && item.section === chip.section);
      if (exists) return current.filter((item) => !(item.label === chip.label && item.section === chip.section));
      setChipHistory((history) => [...history, chip]);
      return [...current, chip];
    });
  }

  function undoLastClick() {
    setChipHistory((history) => {
      const last = history.at(-1);
      if (!last) return history;
      setSelectedChips((current) => current.filter((item) => !(item.label === last.label && item.section === last.section)));
      return history.slice(0, -1);
    });
  }

  function clearSection(section: MouseFirstSection) {
    setSelectedChips((current) => current.filter((chip) => chip.section !== section));
  }

  const current = steps[step]!;

  function addComplaint(label: string) {
    let nextState = formState;
    setFormState((currentState) => {
      const existing = currentState.chiefComplaint.trim();
      nextState = { ...currentState, chiefComplaint: existing ? `${existing}; ${label}` : label };
      return nextState;
    });
    if (patientId) {
      void saveLocalDraft({
        key: `doctor-visit:${patientId}`,
        entityType: "doctor_visit_draft",
        patientId,
        payload: nextState,
        updatedAt: new Date().toISOString()
      });
    }
    setStep(0);
    setSaved("Complaint added to draft. Save when ready.");
  }

  if (sessionStatus === "loading") {
    return (
      <AppShell>
        <section className="panel">
          <div className="skeleton" aria-label="Checking access" />
        </section>
      </AppShell>
    );
  }

  if (isReceptionistOnly) {
    return (
      <AppShell>
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Access denied</p>
              <h1>Doctor visit workflow is not available to Reception</h1>
              <p className="muted">Reception can manage identity, appointments, queue, consent basics, and payments only.</p>
            </div>
            <span className="badge">Reception</span>
          </div>
          <div className="form-actions">
            {patientId ? <Link className="button" href={`/patients/${patientId}`}>Open reception profile</Link> : null}
            <Link className="button secondary" href="/reception">Back to Reception</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="visit-shell">
        <div className="visit-header">
          <div>
            <p className="eyebrow">Guided Visit</p>
            <h1>{current[0]}</h1>
            <p className="muted">{patientId ? `${patientName} - ${current[1]}` : current[1]}</p>
          </div>
          <span className="badge accent">{autosaveLabel(autosave.state)}</span>
          <Link className="button secondary" href={patientId ? `/patients/${patientId}` : "/doctor"}>
            <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
            {patientId ? "Back to patient file" : "Back to Doctor Mode"}
          </Link>
        </div>

        <SafetyAlert />

        {syncQueue.pendingCount > 0 ? (
          <div className="notice">
            <strong>Sync pending:</strong> {syncQueue.pendingCount} local draft operation{syncQueue.pendingCount === 1 ? "" : "s"} saved on this device.
            <button className="button secondary" disabled={syncQueue.isSyncing} onClick={() => void syncQueue.syncNow()} type="button">
              {syncQueue.isSyncing ? "Syncing..." : "Sync now"}
            </button>
          </div>
        ) : syncQueue.lastSyncedAt ? (
          <p className="notice success">Synced just now.</p>
        ) : null}

        <section className="visit-progress" aria-label="Visit steps">
          {steps.map(([label], index) => (
            <button className={index === step ? "active" : ""} key={label} onClick={() => setStep(index)} type="button">
              <ThreeDMedicalIcon name={index < 4 ? "encounter" : index === 4 ? "prescription" : index === 5 ? "investigations" : "timeline"} size="sm" />
              <span>{label}</span>
            </button>
          ))}
        </section>

        <section className="panel mouse-first-workspace" aria-label="Doctor Mouse-First Mode">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Doctor Mouse-First Mode</p>
              <h2>Mouse Mode / Detailed Mode</h2>
              <p className="muted">Routine documentation is chip-driven. Free text is a fallback for unusual details, and the note stays draft-only until the doctor saves it.</p>
            </div>
            <div className="segmented-control" aria-label="Visit documentation mode">
              <button className={visitMode === "mouse" ? "active" : ""} type="button" onClick={() => setVisitMode("mouse")}>Mouse Mode</button>
              <button className={visitMode === "detailed" ? "active" : ""} type="button" onClick={() => setVisitMode("detailed")}>Detailed Mode</button>
            </div>
          </div>

          <div className="required-section-progress" aria-label="Required section progress">
            {mouseFirstSections.map((section) => {
              const status = selectedChips.some((chip) => chip.section === section) || (section === "Plan" && formState.planText.trim()) ? "complete" : section === "Follow-up" ? "optional" : "missing";
              return <span className={`badge ${status === "complete" ? "accent" : status === "missing" ? "warning" : ""}`} key={section}>{section}: {status}</span>;
            })}
          </div>

          {hasUnsavedChanges ? (
            <div className="notice unsaved-change-warning">
              <strong>Unsaved changes warning</strong>
              <span> Save draft before leaving, or choose Leave anyway if the doctor intentionally discards the local draft.</span>
              <div className="form-actions">
                <button className="button secondary compact" type="button" onClick={() => setSaved("Use Save Draft below to write this draft to the patient file.")}>Save draft</button>
                <Link className="button secondary compact" href={patientId ? `/patients/${patientId}` : "/doctor"}>Leave anyway</Link>
              </div>
            </div>
          ) : null}

          {visitMode === "mouse" ? (
            <div className="mouse-first-grid">
              <div className="mouse-chip-panel">
                <div className="segmented-control mouse-section-tabs" aria-label="Mouse-first sections">
                  {mouseFirstSections.map((section) => (
                    <button className={activeMouseSection === section ? "active" : ""} key={section} type="button" onClick={() => setActiveMouseSection(section)}>
                      {section}
                    </button>
                  ))}
                </div>
                <h3>Top 12 common chips</h3>
                <ChipCloud chips={topClinicalChips.filter((chip) => chip.section === activeMouseSection || activeMouseSection === "Complaint")} selected={selectedChips} onToggle={toggleChip} />
                <h3>Categories</h3>
                <div className="chip-category-row">
                  {clinicalChipGroups.map((group) => <span className="badge" key={group}>{group}</span>)}
                </div>
                <label>
                  Search chips
                  <input value={chipSearch} onChange={(event) => setChipSearch(event.target.value)} placeholder="Search structured chips" />
                </label>
                <ChipCloud
                  chips={clinicalChips.filter((chip) => chip.section === activeMouseSection && chip.label.toLowerCase().includes(chipSearch.toLowerCase())).slice(0, 18)}
                  selected={selectedChips}
                  onToggle={toggleChip}
                />
                <label>
                  Free text fallback
                  <textarea value={mouseFreeText} onChange={(event) => setMouseFreeText(event.target.value)} placeholder="Only add unusual or custom details here." />
                </label>
              </div>
              <aside className="selected-preview-panel">
                <div className="section-heading">
                  <h3>Selected items preview</h3>
                  <div className="form-actions">
                    <button className="button secondary compact" type="button" onClick={undoLastClick}>Undo last click</button>
                    <button className="button secondary compact" type="button" onClick={() => clearSection(activeMouseSection)}>Clear section</button>
                  </div>
                </div>
                {selectedChips.length === 0 ? <p className="empty-state compact smart-empty-state">No chips selected yet.</p> : null}
                <div className="selected-chip-list">
                  {selectedChips.map((chip) => (
                    <button className="selected-chip active" key={`${chip.section}-${chip.label}`} type="button" onClick={() => toggleChip(chip)}>
                      <strong>{chip.label}</strong>
                      <span>{chip.section} - remove selected item</span>
                    </button>
                  ))}
                </div>
                <div className="generated-note-preview">
                  <h3>Generated note preview</h3>
                  <div className="generated-note-text">{generatedDraftNote || "Select chips to build a draft note preview."}</div>
                  <p className="notice">Draft-only. No automatic diagnosis, prescribing, dosing, or treatment ranking.</p>
                </div>
              </aside>
            </div>
          ) : (
            <p className="notice">Detailed Mode is active. Use the detailed fields below when chips are not enough.</p>
          )}
        </section>

        <section className="doctor-productivity-grid" aria-label="Doctor productivity pack">
          <ProductivityPanel title="Continue Last Work" items={[...continueLastWorkItems.doctor, ...continueLastWorkItems.receptionist]} />
          <ProductivityPanel title="Doctor Results Review Inbox" items={resultsReviewInboxItems} />
          <ProductivityPanel title="Doctor Favorites" items={doctorFavoriteGroups} />
        </section>

        <form className="visit-card" onSubmit={saveDraft}>
          {step === 0 ? (
            <div className="obgyn-template-grid">
              {complaintCards.map((label) => (
                <button className="obgyn-template-card" key={label} type="button" onClick={() => addComplaint(label)}>
                  <ThreeDMedicalIcon name={label.includes("pregnancy") || label.includes("fetal") ? "pregnancy" : "encounter"} size="sm" />
                  <strong>{label}</strong>
                  <p className="muted">Add to draft complaint</p>
                </button>
              ))}
            </div>
          ) : null}
          <label>
            {current[2]}
            <textarea
              onChange={(event) => setFormState((currentState) => ({ ...currentState, [fieldForStep(step)]: event.target.value }))}
              placeholder="Write clear doctor-authored notes here. No AI text is inserted automatically."
              value={formState[fieldForStep(step)]}
            />
          </label>
          {step === 3 ? <p className="notice">This field is doctor-authored. The app does not diagnose automatically.</p> : null}
          {step === 4 ? <p className="notice">Prescription text must be written and reviewed by the doctor.</p> : null}
          {step === 7 ? <p className="notice">Finish only after manual review. Signed records stay protected.</p> : null}
          {saved ? <p className="notice success">{saved}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="visit-actions">
            <button className="button secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} type="button">
              <ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />
              Previous
            </button>
            <button className="button secondary" type="submit">
              <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
              Save Draft
            </button>
            {step < steps.length - 1 ? (
              <button className="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} type="button">
                <ThreeDMedicalIcon name="timeline" size="sm" />
                Next
              </button>
            ) : (
              <Link className="button" href={patientId ? `/patients/${patientId}` : "/patients"}>
                <ThreeDMedicalIcon name="patients" size="sm" />
                Finish Visit
              </Link>
            )}
          </div>
        </form>
      </section>
    </AppShell>
  );
}

type VisitField = "chiefComplaint" | "historyText" | "examText" | "assessmentText" | "prescriptionPlan" | "ordersPlan" | "planText";

function fieldForStep(step: number): VisitField {
  if (step === 0) return "chiefComplaint";
  if (step === 1) return "historyText";
  if (step === 2) return "examText";
  if (step === 3) return "assessmentText";
  if (step === 4) return "prescriptionPlan";
  if (step === 5) return "ordersPlan";
  return "planText";
}

function ChipCloud({
  chips,
  selected,
  onToggle
}: {
  chips: ClinicalChip[];
  selected: ClinicalChip[];
  onToggle(chip: ClinicalChip): void;
}) {
  return (
    <div className="clinical-chip-cloud">
      {chips.map((chip) => {
        const active = selected.some((item) => item.label === chip.label && item.section === chip.section);
        return (
          <button className={`clinical-chip ${active ? "active" : ""}`} key={`${chip.section}-${chip.label}`} type="button" onClick={() => onToggle(chip)}>
            <strong>{chip.label}</strong>
            <span>{chip.category ?? chip.group}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProductivityPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="panel compact-panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="badge">Manual shortcuts</span>
      </div>
      <div className="dense-card-list">
        {items.map((item) => (
          <button className="picker-row" key={item} type="button">
            <strong>{item}</strong>
            <span>No automatic clinical action</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function mergeDraftField(existing: string, chips: string[]) {
  const parts = [existing.trim(), chips.join("; ")].filter(Boolean);
  return parts.join(existing.trim() && chips.length ? "\n" : "");
}
