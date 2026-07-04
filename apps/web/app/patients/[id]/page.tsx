"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";
import { ObDatingReviewPanel } from "../../../components/calculators/ObDatingReviewPanel";
import { CareAssistPanel } from "../../../components/care-assist/CareAssistPanel";
import { MedicationSafetyTerminal } from "../../../components/medications/MedicationSafetyTerminal";
import { HerbalSearchPanel, MedicationSafetyPanel, PatientAllergyList, PatientMedicationList, PrescriptionSafetyPanel } from "../../../components/medications/MedicationComponents";
import { PregnancyDatingCard } from "../../../components/patients/PregnancyDatingCard";
import { AppShell, SafetyAlert } from "../../mvp-page";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { createDoctorVisitFollowUp, getCurrentDoctorVisit, getDoctorVisitPacket, startDoctorVisit, updateDoctorVisit, type DoctorVisitState } from "@/lib/doctor-visit";
import { searchMedications, type MedicationResult } from "@/lib/medications";

type Patient = {
  id: string;
  branchId?: string | null;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  sex?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  patientType?: string | null;
  notes?: string | null;
};

type PregnancyRecord = {
  id?: string;
  gravida?: number | string | null;
  para?: number | string | null;
  living?: number | string | null;
  abortions?: number | string | null;
  lmp?: string | null;
  lmpDate?: string | null;
  edd?: string | null;
  estimatedDueDate?: string | null;
  datingMethod?: string | null;
  datingScanDate?: string | null;
  status?: string | null;
  notes?: string | null;
  fetuses?: FetusRecord[];
  antenatalVisits?: Record<string, unknown>[];
  obUltrasounds?: Record<string, unknown>[];
};

type FetusRecord = {
  id?: string;
  label?: string | null;
  chorionicity?: string | null;
  amnionicity?: string | null;
  status?: string | null;
  notes?: string | null;
};

type GynecologyVisit = {
  id?: string;
  templateType?: string | null;
  visitDate?: string | null;
  reasonForVisit?: string | null;
  menstrualHistory?: string | null;
  bleedingPattern?: string | null;
  painSymptoms?: string | null;
  dischargeSymptoms?: string | null;
  contraceptionHistory?: string | null;
  examinationNotes?: string | null;
  doctorImpression?: string | null;
  doctorPlan?: string | null;
  followUpDate?: string | null;
  createdByUser?: { displayName?: string | null } | null;
};

type TabConfig = {
  key: string;
  label: string;
  icon: IconName;
  endpoint?: string;
  collectionKey?: string;
  empty: string;
  permissions?: string[];
  roles?: string[];
};

type TimelineItem = {
  dateTime: string;
  type: string;
  title: string;
  status: string;
  description: string;
  actor?: string;
  href?: string;
};

type ReferenceResult = {
  id: string;
  label: string;
  type: string;
  genericName?: string;
  familyName?: string | null;
  category?: string;
  specialty?: string;
};

const tabs: TabConfig[] = [
  { key: "overview", label: "Summary", icon: "patients", empty: "Start with the patient summary and next best action." },
  { key: "secretary-intake", label: "Secretary Intake", icon: "files", endpoint: "/patient-intake?patientId=:patientId", collectionKey: "patientIntakes", empty: "No patient-reported intake yet.", permissions: ["patient_intake.read"] },
  { key: "doctor-note", label: "Doctor Clinical Note", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No doctor clinical note yet.", permissions: ["encounter.read"] },
  { key: "doctor-visit", label: "Doctor Visit", icon: "encounter", empty: "Guided doctor visit workflow.", permissions: ["encounter.read", "encounter.create", "care_assist.read"] },
  { key: "gynecology", label: "Gynecology", icon: "doctor", endpoint: "/patients/:patientId/gynecology-visits", collectionKey: "gynecologyVisits", empty: "No gynecology visit yet.", permissions: ["encounter.read", "encounter.create"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "history", label: "History", icon: "doctor", endpoint: "/patients/:patientId/history-sheets", collectionKey: "historySheets", empty: "No structured history sheet yet.", permissions: ["patient.read", "encounter.read"] },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit.", permissions: ["prescription.read"] },
  { key: "investigations", label: "Requested Investigations", icon: "investigations", endpoint: "/clinical-requests?patientId=:patientId", collectionKey: "clinicalRequests", empty: "No requested investigation or clinical request yet.", permissions: ["clinical_requests.read", "investigation.read"] },
  { key: "follow-up-hints", label: "Follow-up Hints", icon: "timeline", endpoint: "/patients/:patientId/follow-up-hints", collectionKey: "hints", empty: "No active follow-up hints.", permissions: ["follow_up_hints.read"] },
  { key: "documents", label: "Documents", icon: "files", endpoint: "/patients/:patientId/documents", collectionKey: "patientDocuments", empty: "No archived document metadata yet.", permissions: ["patient_document.read"] },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet.", permissions: ["pregnancy.read", "pregnancy.manage"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "ultrasound", label: "Ultrasound", icon: "ultrasound", endpoint: "/ob-ultrasounds", collectionKey: "obUltrasounds", empty: "No ultrasound record yet.", permissions: ["ob_ultrasound.read", "ob_ultrasound.manage"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "billing", label: "Billing", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet. Create one only with demo payment details.", permissions: ["billing.read", "billing.manage", "billing.report"], roles: ["Owner", "Admin", "Accountant"] },
  { key: "medication-safety", label: "Medication Safety", icon: "ai", empty: "Run a medication safety review when clinically needed.", permissions: ["medications.safety_check"] },
  { key: "timeline", label: "Timeline", icon: "timeline", empty: "The patient story appears here as records are created." }
];

const relatedLoaders: TabConfig[] = [
  ...tabs,
  { key: "appointments", label: "Appointments", icon: "calendar", endpoint: "/appointments", collectionKey: "appointments", empty: "No appointment recorded yet.", permissions: ["appointment.read", "appointments.read"] },
  { key: "visits", label: "Encounters", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready.", permissions: ["encounter.read"] },
  { key: "results", label: "Results", icon: "reports", endpoint: "/patients/:patientId/investigation-results", collectionKey: "investigationResults", empty: "No result metadata yet. Doctor review required.", permissions: ["investigation.result_read"] },
  { key: "files", label: "Reports", icon: "reports", endpoint: "/reports", collectionKey: "reports", empty: "No report record yet. Add report metadata only after doctor review.", permissions: ["report.read"] },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet.", permissions: ["pregnancy.read", "pregnancy.manage"] },
  { key: "consents", label: "Consents", icon: "consent", endpoint: "/consents?patientId=:patientId", collectionKey: "consentRecords", empty: "No consent record yet.", permissions: ["patient.consent_read", "patient.consent_manage", "consent_template.read"] },
  { key: "referrals", label: "Referrals", icon: "reports", endpoint: "/patients/:patientId/referrals", collectionKey: "referrals", empty: "No referral tracked yet.", permissions: ["referral.read"] },
  { key: "tasks", label: "Tasks", icon: "queue", endpoint: "/patients/:patientId/tasks", collectionKey: "patientTasks", empty: "No open patient tasks.", permissions: ["patient_task.read"] },
  { key: "internal-notes", label: "Internal Notes", icon: "doctor", endpoint: "/patients/:patientId/internal-notes", collectionKey: "patientInternalNotes", empty: "No internal notes visible for your role.", permissions: ["patient_internal_note.read"] }
];

export default function PatientFilePage() {
  void ClinicalPanel;
  void ProtocolAtlasPanel;
  void CalculatorsPanel;
  void PrintPacketPanel;
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [related, setRelated] = useState<Record<string, Record<string, unknown>[]>>({});
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const active = useMemo(() => tabs.find((tab) => tab.key === activeTab) ?? tabs[0]!, [activeTab]);
  const visibleTabs = useMemo(
    () => tabs.filter((tab) => {
      if (tab.roles?.length && !tab.roles.some((role) => roles.includes(role))) return false;
      if (tab.permissions?.length && !tab.permissions.some((permission) => permissions.includes(permission))) return false;
      return true;
    }),
    [permissions, roles]
  );
  const ageLabel = patient?.dateOfBirth ? `${patient.dateOfBirth.slice(0, 10)}` : "Age not set";

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    fetch(`${getApiBaseUrl()}/patients/${patientId}`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Please sign in before opening patient files.");
        if (!response.ok) throw new Error("Could not open this patient file.");
        setPatient((await response.json()) as Patient);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to open patient file."));

    fetch(`${getApiBaseUrl()}/auth/me`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) return;
        const session = await response.json() as { user?: { permissions?: string[]; roles?: string[] } };
        setPermissions(session.user?.permissions ?? []);
        setRoles(session.user?.roles ?? []);
      })
      .catch(() => {
        setPermissions([]);
        setRoles([]);
      });
  }, [patientId]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const load = async () => {
      const pairs = await Promise.all(
        relatedLoaders
          .filter((tab) => tab.endpoint)
          .map(async (tab) => {
            try {
              const endpoint = (tab.endpoint ?? "").replace(":patientId", encodeURIComponent(patientId));
              const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                credentials: "include",
                headers: token ? { authorization: `Bearer ${token}` } : undefined
              });
              if (!response.ok) return [tab.key, []] as const;
              const data = await response.json() as Record<string, unknown>;
              const collection = tab.collectionKey ? data[tab.collectionKey] : data;
              const list = Array.isArray(collection) ? collection as Record<string, unknown>[] : [];
              return [tab.key, endpoint.includes(`/patients/${encodeURIComponent(patientId)}`) || endpoint.includes(`patientId=${encodeURIComponent(patientId)}`) ? list : list.filter((row) => row.patientId === patientId)] as const;
            } catch {
              return [tab.key, []] as const;
            }
          })
      );
      setRelated(Object.fromEntries(pairs));
      try {
        const timelineResponse = await fetch(`${getApiBaseUrl()}/patients/${patientId}/timeline`, {
          credentials: "include",
          headers: token ? { authorization: `Bearer ${token}` } : undefined
        });
        if (timelineResponse.ok) {
          const timelineData = await timelineResponse.json() as { items?: TimelineItem[] };
          setTimelineItems(timelineData.items ?? []);
        }
      } catch {
        setTimelineItems([]);
      }
    };
    void load();
  }, [patientId, permissions]);

  async function submitPatientAction(endpoint: string, payload: Record<string, unknown>) {
    const token = sessionStorage.getItem("prijClinicToken");
    setActionStatus("Saving");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setActionStatus("Could not save this patient action. Check your role and try again.");
      return;
    }

    setActionStatus("Saved to this patient file.");
    window.setTimeout(() => window.location.reload(), 500);
  }

  return (
    <AppShell>
      <section className="patient-simple-hero">
        <div className="patient-avatar">
          <ThreeDMedicalIcon name="patients" size="lg" />
        </div>
        <div>
          <p className="eyebrow">Patient file workspace</p>
          <h1>{patient ? `${patient.firstName} ${patient.lastName}` : "Opening patient"}</h1>
          <p className="muted">{patient ? `${ageLabel} | File ${patient.medicalRecordNumber} | ${patient.phone || patient.email || "No contact saved"}` : "Loading patient details"}</p>
          <div className="workflow-band">
            <span>{patient?.status ?? "Opening"}</span>
            <span>Workspace ready</span>
            <span>Allergies available</span>
            <span>Medication safety available by role</span>
          </div>
        </div>
        <div className="patient-primary-actions">
          <button className="button large" type="button" onClick={() => setActiveTab("doctor-visit")} disabled={!patient}>
            <ThreeDMedicalIcon name="encounter" size="sm" />
            Start Visit
          </button>
          <Link className="button secondary large" href="/calendar">
            <ThreeDMedicalIcon name="calendar" size="sm" tone="slate" />
            New Appointment
          </Link>
          <Link className="button secondary large" href="/investigations">
            <ThreeDMedicalIcon name="investigations" size="sm" tone="slate" />
            New Request
          </Link>
          <Link className="button secondary large" href="/billing">
            <ThreeDMedicalIcon name="billing" size="sm" tone="slate" />
            New Invoice
          </Link>
        </div>
      </section>

      <SafetyAlert />

      {error ? (
        <section className="panel">
          <p className="form-error">{error}</p>
          <Link className="button" href="/login">
            <ThreeDMedicalIcon name="doctor" size="sm" />
            Go to login
          </Link>
        </section>
      ) : null}

      {patient ? (
        <>
          <PatientActionPanel patientId={patient.id} onSubmit={submitPatientAction} status={actionStatus} related={related} />
          <PregnancyDatingCard patient={patient} pregnancies={(related.pregnancy ?? []) as PregnancyRecord[]} />

          <section className="patient-tabs simple" aria-label="Patient file sections">
            {visibleTabs.map((tab) => (
              <button className={`tab-button ${activeTab === tab.key ? "active" : ""}`} data-tab-key={tab.key} key={tab.key} onClick={() => setActiveTab(tab.key)} type="button">
                <ThreeDMedicalIcon name={tab.icon} size="sm" />
                {tab.label}
              </button>
            ))}
          </section>

          {active.key === "overview" ? <Overview patient={patient} related={related} /> : null}
          {active.key === "gynecology" ? <GynecologyWorkspace patient={patient} visits={(related.gynecology ?? []) as GynecologyVisit[]} /> : null}
          {active.key === "history" ? (
            <>
              <MedicalPanel patient={patient} related={related} />
              <HistorySheetWorkspace related={related} onSubmit={submitPatientAction} status={actionStatus} />
              <CareAssistPanel patientId={patient.id} historySheetId={String((related.history ?? [])[0]?.id ?? "") || undefined} />
            </>
          ) : null}
          {active.key === "doctor-visit" ? <DoctorVisitFlow patient={patient} related={related} onReload={() => window.location.reload()} /> : null}
          {active.key === "secretary-intake" ? <SecretaryIntakePanel rows={related["secretary-intake"] ?? []} /> : null}
          {active.key === "doctor-note" ? <DoctorClinicalNotePanel rows={related["doctor-note"] ?? []} /> : null}
          {active.key === "prescriptions" ? <RelatedPanel config={active} rows={related.prescriptions ?? []} /> : null}
          {active.key === "investigations" ? <InvestigationsPanel related={related} /> : null}
          {active.key === "follow-up-hints" ? <RelatedPanel config={active} rows={related["follow-up-hints"] ?? []} /> : null}
          {active.key === "documents" ? <DocumentsPanel related={related} /> : null}
          {active.key === "billing" ? <RelatedPanel config={active} rows={related.billing ?? []} /> : null}
          {active.key === "timeline" ? <Timeline items={timelineItems} patient={patient} /> : null}
          {active.key === "medication-safety" ? <MedicationSafetyWorkspace patientId={patient.id} /> : null}
          {active.key === "pregnancy" ? (
            <>
              <ObDatingReviewPanel patient={patient} pregnancies={(related.pregnancy ?? []) as PregnancyRecord[]} />
              <ObgynWorkspace
                patient={patient}
                pregnancies={(related.pregnancy ?? []) as PregnancyRecord[]}
                reports={related.files ?? []}
                orders={related.orders ?? []}
              />
            </>
          ) : null}
          {active.key === "ultrasound" ? <UltrasoundWorkspace patient={patient} pregnancies={(related.pregnancy ?? []) as PregnancyRecord[]} reports={related.files ?? []} orders={related.orders ?? []} /> : null}
          {active.key !== "overview" && active.key !== "medical" && active.key !== "history-sheet" && active.key !== "care-assist" && active.key !== "doctor-visit" && active.key !== "clinical" && active.key !== "timeline" && active.key !== "print-packet" && active.key !== "ai-snapshot" && active.key !== "protocol-atlas" && active.key !== "calculators" && active.key !== "pregnancy" && active.key !== "ultrasound" && active.key !== "medications" && active.key !== "allergies" && active.key !== "herbals" && active.key !== "medication-safety" && active.key !== "prescription-safety" ? (
            <RelatedPanel config={active} rows={related[active.key] ?? []} />
          ) : null}
        </>
      ) : !error ? (
        <div className="skeleton" />
      ) : null}
    </AppShell>
  );
}

function Overview({ patient, related }: { patient: Patient; related: Record<string, Record<string, unknown>[]> }) {
  const pendingResults = (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "pending_review").length;
  const criticalResults = (related.results ?? []).filter((row) => row.criticalFlag === true && String(row.reviewStatus ?? "") !== "reviewed").length;
  const missingConsents = (related.consents ?? []).filter((row) => ["unknown", "declined"].includes(String(row.status ?? ""))).length;
  const openTasks = (related.tasks ?? []).filter((row) => ["open", "in_progress"].includes(String(row.status ?? ""))).length;
  const unreviewedDocuments = (related.documents ?? []).filter((row) => ["draft_metadata", "active"].includes(String(row.status ?? ""))).length;

  return (
    <section className="doctor-friendly-grid">
      <article className="panel">
        <div className="section-heading">
          <div>
            <h2>At a glance</h2>
            <p className="muted">Simple patient summary for daily clinic use.</p>
          </div>
          <ThreeDMedicalIcon name="patients" size="sm" />
        </div>
        <dl className="profile-grid">
          <div><dt>Name</dt><dd>{patient.firstName} {patient.lastName}</dd></div>
          <div><dt>File number</dt><dd>{patient.medicalRecordNumber}</dd></div>
          <div><dt>Contact</dt><dd>{patient.phone || patient.email || "Not saved"}</dd></div>
          <div><dt>Status</dt><dd>{patient.status}</dd></div>
          <div className="wide"><dt>Notes</dt><dd>{patient.notes || "No note saved yet."}</dd></div>
        </dl>
      </article>
      <article className="panel next-step-card">
        <ThreeDMedicalIcon name="doctor" size="lg" />
        <h2>Next best step</h2>
        <p className="muted">Start or continue the visit. The doctor writes the note; the app does not diagnose or prescribe automatically.</p>
        <Link className="button large" href={`/doctor/visit?patientId=${patient.id}`}>
          <ThreeDMedicalIcon name="encounter" size="sm" />
          Start Visit
        </Link>
      </article>
      <article className="panel">
        <div className="section-heading">
          <h2>Recent activity</h2>
          <span className="badge">{Object.values(related).flat().length} items</span>
        </div>
        <div className="workflow-mini-grid">
          <MiniCount label="Pending results" value={pendingResults} />
          <MiniCount label="Critical unreviewed" value={criticalResults} tone={criticalResults ? "warning" : ""} />
          <MiniCount label="Missing consents" value={missingConsents} />
          <MiniCount label="Open tasks" value={openTasks} />
          <MiniCount label="Unreviewed documents" value={unreviewedDocuments} />
          <MiniCount label="Follow-up" value={(related.tasks ?? []).filter((row) => String(row.taskType ?? "") === "schedule_follow_up").length} />
        </div>
      </article>
    </section>
  );
}

function MiniCount({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`metric-card compact ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MedicalPanel({ patient, related }: { patient: Patient; related: Record<string, Record<string, unknown>[]> }) {
  const medicationCount = related.medications?.length ?? 0;
  const allergyCount = related.allergies?.length ?? 0;
  const pregnancyCount = related.pregnancy?.length ?? 0;
  const reportCount = related.files?.length ?? 0;

  return (
    <section className="doctor-friendly-grid">
      <article className="panel">
        <div className="section-heading">
          <div>
            <h2>Medical summary</h2>
            <p className="muted">A clean overview for the doctor before opening detailed tabs.</p>
          </div>
          <ThreeDMedicalIcon name="doctor" size="sm" />
        </div>
        <dl className="profile-grid">
          <div><dt>Patient type</dt><dd>{patient.patientType ?? "General"}</dd></div>
          <div><dt>Pregnancy records</dt><dd>{pregnancyCount}</dd></div>
          <div><dt>Medication entries</dt><dd>{medicationCount}</dd></div>
          <div><dt>Allergy entries</dt><dd>{allergyCount}</dd></div>
          <div><dt>Reports</dt><dd>{reportCount}</dd></div>
          <div className="wide"><dt>Doctor note</dt><dd>{patient.notes || "No medical note saved yet."}</dd></div>
        </dl>
      </article>
      <article className="panel next-step-card">
        <ThreeDMedicalIcon name="prescription" size="lg" />
        <h2>Medication context</h2>
        <p className="muted">Medication and allergy information is reviewed from its own tab. Market strength and form stay reference metadata only.</p>
        <button className="button secondary" type="button" onClick={() => document.querySelector<HTMLButtonElement>('[data-tab-key="medications"]')?.click()}>
          Open medications
        </button>
      </article>
    </section>
  );
}

function ClinicalPanel({ patient, visits }: { patient: Patient; visits: GynecologyVisit[] }) {
  const cards: Array<[string, string, string, IconName]> = [
    [`/patients/${patient.id}`, "Start Visit", "Open the guided visit workflow from the Doctor Visit tab.", "encounter"],
    ["/protocol-atlas", "Protocol Atlas", "Search verified local protocol summaries when clinically appropriate.", "ai"],
    ["/calculators", "Calculators", "Use deterministic calculator tools with doctor review.", "investigations"],
    ["/guidelines", "Guideline Center", "Search local evidence-library content with citations.", "reports"]
  ];

  return (
    <>
      <section className="module-grid">
        {cards.map(([href, title, text, icon]) => (
          <Link className="module-card" href={href} key={title}>
            <ThreeDMedicalIcon name={icon} size="md" />
            <strong>{title}</strong>
            <p className="muted">{text}</p>
          </Link>
        ))}
        <article className="module-card">
          <ThreeDMedicalIcon name="doctor" size="md" tone="slate" />
          <strong>Doctor-led workflow</strong>
          <p className="muted">Clinical tools assist review only. They do not diagnose, prescribe, sign, or update final records.</p>
        </article>
      </section>
      <GynecologyWorkspace patient={patient} visits={visits} />
    </>
  );
}

function InvestigationsPanel({ related }: { related: Record<string, Record<string, unknown>[]> }) {
  return (
    <section className="dashboard-grid">
      <RelatedPanel config={{ key: "investigations", label: "Investigation Orders", icon: "investigations", empty: "No investigation order yet." }} rows={related.investigations ?? []} />
      <RelatedPanel config={{ key: "results", label: "Investigation Results", icon: "reports", empty: "No result metadata yet. Doctor review required." }} rows={related.results ?? []} />
    </section>
  );
}

function DocumentsPanel({ related }: { related: Record<string, Record<string, unknown>[]> }) {
  return (
    <section className="dashboard-grid">
      <RelatedPanel config={{ key: "documents", label: "Documents", icon: "files", empty: "No archived document metadata yet." }} rows={related.documents ?? []} />
      <RelatedPanel config={{ key: "files", label: "Reports", icon: "reports", empty: "No report record yet. Add report metadata only after doctor review." }} rows={related.files ?? []} />
      <RelatedPanel config={{ key: "consents", label: "Consents", icon: "consent", empty: "No consent record yet." }} rows={related.consents ?? []} />
    </section>
  );
}

function MedicationSafetyWorkspace({ patientId }: { patientId: string }) {
  return (
    <section className="dashboard-grid">
      <MedicationSafetyPanel patientId={patientId} />
      <PrescriptionSafetyPanel patientId={patientId} />
      <PatientMedicationList />
      <PatientAllergyList />
      <HerbalSearchPanel />
    </section>
  );
}

function DoctorVisitFlow({ patient, related, onReload }: { patient: Patient; related: Record<string, Record<string, unknown>[]>; onReload: () => void }) {
  const [visit, setVisit] = useState<DoctorVisitState | null>(null);
  const [status, setStatus] = useState("Open or start a visit.");
  const [selectedMedication, setSelectedMedication] = useState<MedicationResult | null>(null);
  const [hoveredMedication, setHoveredMedication] = useState<MedicationResult | null>(null);
  const [medicationQuery, setMedicationQuery] = useState("");
  const [medicationResults, setMedicationResults] = useState<MedicationResult[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<ReferenceResult | null>(null);
  const [hint, setHint] = useState("");
  const [activeStep, setActiveStep] = useState("History");
  const encounterId = String(visit?.encounter?.id ?? "");
  const latestHistorySheetId = String((related["history-sheet"] ?? [])[0]?.id ?? "") || undefined;
  const terminalMedication = hoveredMedication ?? selectedMedication;

  useEffect(() => {
    void getCurrentDoctorVisit(patient.id)
      .then((data) => {
        setVisit(data);
        setStatus(data.encounter ? "Draft visit open." : "No active draft visit.");
      })
      .catch(() => setStatus("Doctor visit requires clinical access."));
  }, [patient.id]);

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
    setActiveStep("Prescription");
    setStatus("Encounter draft saved.");
    setVisit(await getCurrentDoctorVisit(patient.id));
  }

  async function addPrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!encounterId || !selectedMedication) return;
    const form = event.currentTarget;
    const payload = values(form, ["instructions"]);
    const genericName = selectedMedication.genericName ?? selectedMedication.brandName ?? selectedMedication.tradeName ?? "Generic medication";
    await submitVisitAction(patient.id, "prescriptions", {
      encounterId,
      items: [{
        medicationName: genericName,
        medicationGenericId: selectedMedication.type === "generic_medication" ? selectedMedication.id : undefined,
        instructions: payload.instructions
      }]
    });
    setStatus("Prescription draft updated with generic medication.");
    setActiveStep("Investigations");
    setVisit(await getCurrentDoctorVisit(patient.id));
    form.reset();
  }

  async function addInvestigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!encounterId || !selectedInvestigation) return;
    const payload = values(event.currentTarget, ["instructions"]);
    await submitVisitAction(patient.id, "investigations", {
      encounterId,
      priority: "routine",
      items: [{ category: selectedInvestigation.category ?? "laboratory", testName: selectedInvestigation.label, instructions: payload.instructions }]
    });
    setStatus("Investigation request added.");
    setActiveStep("Follow-up");
    setVisit(await getCurrentDoctorVisit(patient.id));
  }

  async function addFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!encounterId) return;
    await createDoctorVisitFollowUp(patient.id, encounterId, values(event.currentTarget, ["dueAt", "title", "note"]) as { dueAt?: string; title?: string; note?: string });
    setStatus("Follow-up task added.");
    setActiveStep("Packet");
    setVisit(await getCurrentDoctorVisit(patient.id));
  }

  async function loadPacket() {
    if (!encounterId) return;
    setVisit(await getDoctorVisitPacket(patient.id, encounterId));
    setActiveStep("Packet");
    setStatus("Visit packet refreshed.");
  }

  return (
    <section className="panel doctor-visit-flow">
      <div className="section-heading">
        <div>
          <h2>Doctor Visit Flow</h2>
          <p className="muted">History, Care Assist, encounter draft, generic prescription, investigations, follow-up, and print packet.</p>
        </div>
        <button className="button" type="button" onClick={() => void startVisit()}>Start Visit</button>
      </div>
      <div className="workflow-band" aria-label="Doctor visit workflow stepper">
        {(visit?.workflow ?? ["History", "Care Assist", "Encounter", "Prescription", "Investigations", "Follow-up", "Packet"]).map((step) => (
          <button className={activeStep === step || (step === "Print Packet" && activeStep === "Packet") ? "active" : ""} key={step} onClick={() => setActiveStep(step === "Print Packet" ? "Packet" : step)} type="button">
            {step === "Print Packet" ? "Packet" : step}
          </button>
        ))}
      </div>
      {encounterId ? <p className="notice">Active visit banner: draft visit is open for this patient.</p> : null}
      <p className="muted">{status}</p>
      {!encounterId ? <p className="warning-text">Start a visit before adding encounter, prescription, investigation, or follow-up items.</p> : null}

      <div className="doctor-friendly-grid">
        <section className="panel">
          <div className="section-heading"><h3>History</h3><span className="badge">Step 1</span></div>
          <HistorySheetWorkspace related={related} onSubmit={async (endpoint, payload) => { await submitVisitAction(patient.id, endpoint, payload); onReload(); }} status={status} />
        </section>
        <CareAssistPanel patientId={patient.id} historySheetId={latestHistorySheetId} encounterId={encounterId || undefined} prescriptionId={String((visit?.prescriptions ?? [])[0]?.id ?? "") || undefined} investigationOrderId={String((visit?.investigationOrders ?? [])[0]?.id ?? "") || undefined} />
      </div>

      <form className="panel form-grid" onSubmit={(event) => void saveEncounter(event)}>
        <div className="section-heading"><h3>Encounter Draft</h3><span className="badge warning">Doctor review required</span></div>
        <label>Chief complaint<input name="chiefComplaint" defaultValue={String(visit?.encounter?.chiefComplaint ?? "")} /></label>
        <label>HPI<textarea name="historyText" defaultValue={String(visit?.encounter?.historyText ?? "")} /></label>
        <label>Examination notes<textarea name="examText" defaultValue={String(visit?.encounter?.examText ?? "")} /></label>
        <label>Doctor impression<textarea name="assessmentText" defaultValue={String(visit?.encounter?.assessmentText ?? "")} /></label>
        <label>Doctor plan<textarea id="doctor-visit-planText" name="planText" defaultValue={String(visit?.encounter?.planText ?? "")} /></label>
        <button className="button" type="submit" disabled={!encounterId}>Save encounter and continue</button>
      </form>

      <div className="doctor-friendly-grid">
        <form className="panel form-grid" onSubmit={(event) => void addPrescription(event)}>
          <div className="section-heading"><h3>Prescription Draft</h3><span className="badge warning">Generic-first</span></div>
          <label>Search generic medication<input value={medicationQuery} onChange={(event) => setMedicationQuery(event.target.value)} placeholder="Search generic name or class" /></label>
          <div className="data-list">
            {medicationResults.map((row) => (
              <button className="data-row" key={`${row.type}-${row.id}`} type="button" onClick={() => setSelectedMedication(row)} onFocus={() => setHoveredMedication(row)} onMouseEnter={() => setHoveredMedication(row)} onMouseLeave={() => setHoveredMedication(null)}>
                <strong>{row.genericName ?? row.brandName ?? row.tradeName ?? "Generic medication"}</strong>
                <span className="badge">{row.familyName ?? row.family ?? row.className ?? "Generic visible"}</span>
                {row.tradeName || row.brandName ? <span className="muted">Trade/search match: {row.tradeName ?? row.brandName}</span> : null}
              </button>
            ))}
          </div>
          {selectedMedication ? <p className="notice">Selected generic: {selectedMedication.genericName ?? selectedMedication.brandName ?? selectedMedication.tradeName}</p> : null}
          <label>Manual doctor instructions<textarea name="instructions" placeholder="Doctor-written instructions only" /></label>
          <button className="button" type="submit" disabled={!encounterId || !selectedMedication}>Save prescription and continue</button>
          <p className="muted">Dose, frequency, and duration are not auto-filled.</p>
        </form>
        <MedicationSafetyTerminal medication={terminalMedication} title="Medication Safety Terminal" />
      </div>

      <div className="doctor-friendly-grid">
        <form className="panel form-grid" onSubmit={(event) => void addInvestigation(event)}>
          <div className="section-heading"><h3>Investigations</h3><span className="badge">Request only</span></div>
          <ReferencePicker title="Investigation search" endpoint="/reference/investigations/search" placeholder="Search investigation" selected={selectedInvestigation} onSelect={setSelectedInvestigation} />
          {selectedInvestigation ? <p className="notice">Selected investigation: {selectedInvestigation.label}</p> : null}
          <label>Clinical reason<textarea name="instructions" /></label>
          <button className="button" type="submit" disabled={!encounterId || !selectedInvestigation}>Save investigation and continue</button>
        </form>
        <section className="panel">
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
      </div>

      <form className="panel form-grid" onSubmit={(event) => void addFollowUp(event)}>
        <div className="section-heading"><h3>Follow-up</h3><span className="badge">Manual task</span></div>
        <label>Follow-up date<input name="dueAt" type="date" /></label>
        <label>Task title<input name="title" placeholder="Follow-up visit" /></label>
        <label>Note<textarea name="note" /></label>
        <p className="muted">Manual follow-up only. Treatment instructions are not generated automatically.</p>
        <button className="button" type="submit" disabled={!encounterId}>Save follow-up and continue</button>
      </form>

      <section className="panel printable-summary">
        <div className="section-heading no-print">
          <h3>Print Packet</h3>
          <div className="form-actions">
            <button className="button secondary" type="button" disabled={!encounterId} onClick={() => void loadPacket()}>Refresh packet</button>
            <button className="button" type="button" disabled={!encounterId} onClick={() => window.print()}>Print packet</button>
          </div>
        </div>
        <VisitPacketPreview visit={visit} patient={patient} />
      </section>
    </section>
  );
}

function VisitPacketPreview({ visit, patient }: { visit: DoctorVisitState | null; patient: Patient }) {
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

function insertHintIntoPlan(hint: string, setStatus: (value: string) => void) {
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

function ProtocolAtlasPanel() {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Protocol Atlas</h2>
          <p className="muted">Open verified local protocol summaries for doctor review.</p>
        </div>
        <ThreeDMedicalIcon name="ai" size="sm" />
      </div>
      <div className="module-grid compact-grid">
        <Link className="module-card" href="/protocol-atlas">
          <ThreeDMedicalIcon name="ai" size="md" />
          <strong>Browse protocols</strong>
          <p className="muted">Search by condition, group, or verified status.</p>
        </Link>
        <Link className="module-card" href="/guidelines">
          <ThreeDMedicalIcon name="reports" size="md" />
          <strong>Open evidence library</strong>
          <p className="muted">Review local cited source content where available.</p>
        </Link>
      </div>
    </section>
  );
}

function CalculatorsPanel({ patient }: { patient: Patient }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Calculators</h2>
          <p className="muted">Use deterministic tools only. Results require doctor review.</p>
        </div>
        <ThreeDMedicalIcon name="investigations" size="sm" />
      </div>
      <div className="module-grid compact-grid">
        <Link className="module-card" href="/calculators">
          <ThreeDMedicalIcon name="investigations" size="md" />
          <strong>Calculator hub</strong>
          <p className="muted">Open verified calculator tools and history.</p>
        </Link>
        <div className="module-card">
          <ThreeDMedicalIcon name="pregnancy" size="md" />
          <strong>OB dating</strong>
          <p className="muted">{patient.patientType === "OB" ? "Use the Pregnancy tab to review dating candidates." : "Available when an OB pregnancy record is present."}</p>
        </div>
      </div>
    </section>
  );
}

function UltrasoundWorkspace({ patient, pregnancies, reports, orders }: { patient: Patient; pregnancies: PregnancyRecord[]; reports: Record<string, unknown>[]; orders: Record<string, unknown>[] }) {
  const activePregnancy = pregnancies.find((item) => item.status === "active") ?? pregnancies[0];
  return (
    <section className="obgyn-workspace">
      <article className="obgyn-dashboard printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ultrasound</p>
            <h2>Ultrasound workspace</h2>
            <p className="muted">Recording-only ultrasound workflow for {patient.firstName} {patient.lastName}. The doctor completes interpretation.</p>
          </div>
          <ThreeDMedicalIcon name="ultrasound" size="lg" tone="teal" />
        </div>
        <dl className="obgyn-metric-grid">
          <Metric label="Pregnancy context" value={activePregnancy ? "Linked pregnancy available" : "No pregnancy linked yet"} />
          <Metric label="Reports" value={`${reports.length} report record(s)`} />
          <Metric label="Orders" value={`${orders.length} investigation order(s)`} />
        </dl>
      </article>
      <section className="obgyn-section-grid">
        <UltrasoundReportBuilder patient={patient} pregnancy={activePregnancy} fetuses={[]} />
      </section>
    </section>
  );
}

const gynecologyTemplateOptions = [
  ["general", "Gynecology visit"],
  ["abnormal_uterine_bleeding", "Abnormal bleeding"],
  ["pelvic_pain", "Pelvic pain"],
  ["pcos", "PCOS"],
  ["fibroid_ovarian_cyst", "Fibroid or ovarian cyst"],
  ["contraception", "Contraception counseling"]
] as const;

const gynecologyTemplateFields: Record<string, Array<[string, string, "text" | "textarea" | "date"]>> = {
  general: [
    ["reasonForVisit", "Reason for visit", "textarea"],
    ["menstrualHistory", "Menstrual history", "textarea"],
    ["bleedingPattern", "Bleeding pattern", "textarea"],
    ["painSymptoms", "Pain symptoms", "textarea"],
    ["dischargeSymptoms", "Discharge or infection symptoms", "textarea"],
    ["obstetricHistorySummary", "Obstetric history summary", "textarea"],
    ["contraceptionHistory", "Contraception history", "textarea"],
    ["medicalSurgicalHistory", "Relevant medical or surgical history", "textarea"],
    ["examinationNotes", "Examination notes", "textarea"],
    ["doctorImpression", "Doctor-written impression", "textarea"],
    ["doctorPlan", "Doctor-written plan", "textarea"],
    ["followUpDate", "Follow-up date", "date"]
  ],
  abnormal_uterine_bleeding: [
    ["cycleRegularity", "Cycle regularity", "text"],
    ["bleedingDuration", "Duration", "text"],
    ["bleedingAmount", "Amount", "text"],
    ["clots", "Clots", "text"],
    ["intermenstrualBleeding", "Intermenstrual bleeding", "text"],
    ["postcoitalBleeding", "Postcoital bleeding", "text"],
    ["associatedSymptoms", "Associated symptoms", "textarea"],
    ["pregnancyTestNote", "Pregnancy test note", "textarea"],
    ["doctorImpression", "Doctor-written impression", "textarea"]
  ],
  pelvic_pain: [
    ["painOnset", "Onset", "text"],
    ["painDuration", "Duration", "text"],
    ["painSite", "Site", "text"],
    ["relationToCycle", "Relation to cycle", "text"],
    ["painSeverity", "Severity", "text"],
    ["urinaryBowelSymptoms", "Urinary or bowel symptoms", "textarea"],
    ["associatedSymptoms", "Associated symptoms", "textarea"],
    ["doctorImpression", "Doctor-written impression", "textarea"]
  ],
  pcos: [
    ["cyclePattern", "Cycle pattern", "text"],
    ["acneHirsutismNote", "Acne or hirsutism note", "textarea"],
    ["weightMetabolicRiskNote", "Weight or metabolic risk note", "textarea"],
    ["ultrasoundNote", "Ultrasound note field", "textarea"],
    ["labsNote", "Labs note field", "textarea"],
    ["doctorImpression", "Doctor-written impression", "textarea"]
  ],
  fibroid_ovarian_cyst: [
    ["findingSource", "Finding source", "text"],
    ["sizeLocationNote", "Size or location note", "textarea"],
    ["symptoms", "Symptoms", "textarea"],
    ["followUpPlan", "Follow-up plan", "textarea"],
    ["doctorImpression", "Doctor-written impression", "textarea"]
  ],
  contraception: [
    ["currentMethod", "Current method", "text"],
    ["previousMethods", "Previous methods", "textarea"],
    ["contraindicationChecklist", "Contraindication checklist placeholder", "textarea"],
    ["counselingNotes", "Counseling notes", "textarea"],
    ["chosenMethod", "Chosen method", "text"],
    ["followUpPlan", "Follow-up plan", "textarea"]
  ]
};

function GynecologyWorkspace({ patient, visits }: { patient: Patient; visits: GynecologyVisit[] }) {
  const [templateType, setTemplateType] = useState("general");
  const [status, setStatus] = useState("");

  async function saveGynecologyVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("prijClinicToken");
    const payload = {
      templateType,
      visitDate: new Date().toISOString(),
      ...formPayload(event.currentTarget)
    };

    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/gynecology-visits`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setStatus("Could not save the gynecology visit. Check your clinical role and try again.");
      return;
    }

    setStatus("Gynecology visit saved as recording-only and added to the timeline.");
    window.setTimeout(() => window.location.reload(), 600);
  }

  const latest = visits[0];
  const templateFields = gynecologyTemplateFields[templateType] ?? gynecologyTemplateFields.general!;

  return (
    <section className="obgyn-workspace gynecology-workspace">
      <div className="obgyn-print-toolbar no-print">
        <button className="button compact" type="button" onClick={() => setTemplateType("general")}>
          <ThreeDMedicalIcon name="doctor" size="sm" />
          Start Gynecology Visit
        </button>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
          Print gynecology summary
        </button>
      </div>

      <article className="obgyn-dashboard printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gynecology</p>
            <h2>{latest ? "Latest gynecology record" : "Start the first gynecology visit"}</h2>
            <p className="muted">Recording-only gynecology workspace for {patient.firstName} {patient.lastName}. The doctor writes the impression and plan.</p>
          </div>
          <ThreeDMedicalIcon name="doctor" size="lg" tone="teal" />
        </div>
        {!latest ? (
          <p className="empty-state">
            <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
            <span>Use Start Gynecology Visit, choose a starter template, record the history and findings, then the doctor completes the impression and plan.</span>
          </p>
        ) : null}
        <div className="obgyn-metric-grid">
          <Metric label="Visit type" value={templateLabel(latest?.templateType)} />
          <Metric label="Reason" value={latest?.reasonForVisit ?? "Not recorded"} />
          <Metric label="Doctor impression" value={latest?.doctorImpression ?? "Not recorded"} />
          <Metric label="Follow-up" value={formatDate(latest?.followUpDate)} />
        </div>
        <p className="notice safety-note">These templates record clinician-entered information only. They do not diagnose, recommend treatment, choose contraception, or prescribe.</p>
      </article>

      <section className="obgyn-section-grid">
        <article className="panel printable-summary">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Visit Template</p>
              <h2>Recording form</h2>
              <p className="muted">Choose the visit type, then fill only what the doctor wants to record.</p>
            </div>
            <ThreeDMedicalIcon name="files" size="sm" tone="navy" />
          </div>
          <form className="obgyn-form-grid grouped" onSubmit={saveGynecologyVisit}>
            <fieldset className="obgyn-fieldset wide">
              <legend>Visit type</legend>
              <label>
                Template
                <select value={templateType} onChange={(event) => setTemplateType(event.target.value)}>
                  {gynecologyTemplateOptions.map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>
            </fieldset>
            {templateFields.map(([name, label, type]) => (
              <fieldset className={type === "textarea" ? "obgyn-fieldset wide" : "obgyn-fieldset"} key={`${templateType}-${name}`}>
                <legend>{label}</legend>
                <label>
                  {label}
                  {type === "textarea" ? <textarea name={name} placeholder="Doctor-entered note" /> : <input name={name} type={type} />}
                </label>
              </fieldset>
            ))}
            {status ? <p className="notice wide">{status}</p> : null}
            <div className="form-actions no-print">
              <button className="button secondary" type="button" onClick={() => window.print()}>
                <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
                Print summary
              </button>
              <button className="button" type="submit">
                <ThreeDMedicalIcon name="doctor" size="sm" />
                Save gynecology visit
              </button>
            </div>
          </form>
        </article>

        <article className="panel printable-summary">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Starter Templates</p>
              <h2>Problem-focused recording aids</h2>
            </div>
            <span className="badge">{gynecologyTemplateOptions.length} templates</span>
          </div>
          <div className="obgyn-template-grid">
            {gynecologyTemplateOptions.slice(1).map(([value, label]) => (
              <button className={`obgyn-template-card ${templateType === value ? "active" : ""}`} key={value} onClick={() => setTemplateType(value)} type="button">
                <ThreeDMedicalIcon name={value === "contraception" ? "consent" : value === "pelvic_pain" ? "encounter" : "doctor"} size="sm" />
                <strong>{label}</strong>
                <p className="muted">{templateSummary(value)}</p>
              </button>
            ))}
          </div>
        </article>
      </section>

      <article className="panel printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gynecology Timeline</p>
            <h2>Recorded visits</h2>
          </div>
          <span className="badge">{visits.length} visit(s)</span>
        </div>
        {visits.length === 0 ? (
          <p className="empty-state">
            <ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />
            <span>No gynecology event is recorded yet. Saved templates will appear here and in the patient timeline.</span>
          </p>
        ) : null}
        <div className="data-list">
          {visits.slice(0, 6).map((visit, index) => (
            <article className="data-row printable-summary" key={String(visit.id ?? index)}>
              <div className="data-row-header">
                <strong>{templateLabel(visit.templateType)}</strong>
                <span className="badge">{formatDate(visit.visitDate)}</span>
              </div>
              <p className="muted">{visit.reasonForVisit || visit.doctorImpression || "Recording-only gynecology visit."}</p>
              <p className="muted">Plan: {visit.doctorPlan || "Doctor plan not recorded yet."}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function ObgynWorkspace({
  patient,
  pregnancies,
  reports,
  orders
}: {
  patient: Patient;
  pregnancies: PregnancyRecord[];
  reports: Record<string, unknown>[];
  orders: Record<string, unknown>[];
}) {
  const activePregnancy = pregnancies.find((item) => item.status === "active") ?? pregnancies[0];
  const fetuses = activePregnancy?.fetuses ?? [];

  return (
    <section className="obgyn-workspace">
      <div className="obgyn-print-toolbar no-print">
        <Link className="button compact" href={`/doctor/visit?patientId=${patient.id}`}>
          <ThreeDMedicalIcon name="encounter" size="sm" />
          Start antenatal workflow
        </Link>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
          Print patient summary
        </button>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="calendar" size="sm" tone="slate" />
          Print antenatal summary
        </button>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="ultrasound" size="sm" tone="slate" />
          Print ultrasound report
        </button>
      </div>

      <article className="obgyn-dashboard printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pregnancy Overview</p>
            <h2>{activePregnancy ? "Active pregnancy record" : "No active pregnancy recorded"}</h2>
            <p className="muted">Recording-only pregnancy summary for {patient.firstName} {patient.lastName}. The doctor completes interpretation.</p>
          </div>
          <ThreeDMedicalIcon name="pregnancy" size="lg" tone="rose" />
        </div>
        {!activePregnancy ? (
          <p className="empty-state">
            <ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />
            <span>Create a pregnancy episode below, then continue with antenatal visits and ultrasound recording.</span>
          </p>
        ) : null}
        <div className="obgyn-metric-grid">
          <Metric label="LMP" value={formatDate(activePregnancy?.lmpDate ?? activePregnancy?.lmp)} />
          <Metric label="EDD" value={formatDate(activePregnancy?.estimatedDueDate ?? activePregnancy?.edd)} />
          <Metric label="Dating method" value={String(activePregnancy?.datingMethod ?? "Not recorded")} />
          <Metric label="Gravida / Para" value={`${activePregnancy?.gravida ?? "-"} / ${activePregnancy?.para ?? "-"}`} />
          <Metric label="Current status" value={String(activePregnancy?.status ?? "Not recorded")} />
          <Metric label="Fetus records" value={fetuses.length ? `${fetuses.length}` : "Not recorded"} />
          <Metric label="Antenatal visits" value={activePregnancy?.antenatalVisits?.length ? `${activePregnancy.antenatalVisits.length}` : "No visit yet"} />
          <Metric label="Ultrasound summary" value={activePregnancy?.obUltrasounds?.length ? `${activePregnancy.obUltrasounds.length} scan record(s)` : "No ultrasound report yet"} />
        </div>
        <div className="notice">
          <strong>Important notes</strong>
          <p className="muted">{activePregnancy?.notes || "Use this area for clinician-authored pregnancy notes only. The workspace records observations and does not complete clinical interpretation for the doctor."}</p>
        </div>
      </article>

      <section className="obgyn-section-grid">
        <article className="panel printable-summary">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Obstetric History</p>
              <h2>History snapshot</h2>
            </div>
            <ThreeDMedicalIcon name="timeline" size="sm" tone="navy" />
          </div>
          <dl className="profile-grid">
            <div><dt>Gravida</dt><dd>{activePregnancy?.gravida ?? "Not recorded"}</dd></div>
            <div><dt>Para</dt><dd>{activePregnancy?.para ?? "Not recorded"}</dd></div>
            <div><dt>Living</dt><dd>{activePregnancy?.living ?? "Not recorded"}</dd></div>
            <div><dt>Abortions</dt><dd>{activePregnancy?.abortions ?? "Not recorded"}</dd></div>
          </dl>
          <div className="obgyn-mini-flow">
            <span><ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" /> Episode</span>
            <span><ThreeDMedicalIcon name="timeline" size="sm" tone="slate" /> Previous pregnancy</span>
            <span><ThreeDMedicalIcon name="ultrasound" size="sm" tone="slate" /> Fetus record</span>
          </div>
          <p className="empty-state">
            <ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />
            <span>Record previous pregnancy details as clinician-entered history only. Do not enter real patient data in this local review environment.</span>
          </p>
        </article>

        <CreatePregnancyEpisodeCard patient={patient} />
      </section>

      <section className="obgyn-section-grid">
        <FetusStarterCard pregnancy={activePregnancy} fetuses={fetuses} />
        <AntenatalVisitCard patient={patient} pregnancy={activePregnancy} />
      </section>

      <section className="obgyn-section-grid">
        <UltrasoundReportBuilder patient={patient} pregnancy={activePregnancy} fetuses={fetuses} />
        <DoctorTemplateCards />
      </section>

      <section className="obgyn-section-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Investigations</p>
              <h2>Orders linked to this patient</h2>
            </div>
            <span className="badge">{orders.length} order(s)</span>
          </div>
          {orders.length === 0 ? (
            <p className="empty-state">
              <ThreeDMedicalIcon name="investigations" size="sm" tone="slate" />
              <span>No investigation order is linked yet. Use Order Tests from patient actions when clinically needed.</span>
            </p>
          ) : (
            <div className="data-list">
              {orders.slice(0, 3).map((order, index) => (
                <article className="data-row" key={String(order.id ?? index)}>
                  <div className="data-row-header">
                    <strong>{String(order.testName ?? order.title ?? "Investigation order")}</strong>
                    <span className="badge">{String(order.status ?? "Requested")}</span>
                  </div>
                  <p className="muted">{String(order.instructions ?? "Clinician review required.")}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reports</p>
              <h2>Clinical report drafts</h2>
            </div>
            <span className="badge">{reports.length} report(s)</span>
          </div>
          {reports.length === 0 ? (
            <p className="empty-state">
              <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
              <span>No report is linked yet. Report drafts stay clinician-authored and can be printed from the browser.</span>
            </p>
          ) : (
            <div className="data-list">
              {reports.slice(0, 3).map((report, index) => (
                <article className="data-row printable-summary" key={String(report.id ?? index)}>
                  <div className="data-row-header">
                    <strong>{String(report.title ?? "Report draft")}</strong>
                    <span className="badge">{String(report.reviewStatus ?? report.status ?? "Draft")}</span>
                  </div>
                  <p className="muted">{String(report.resultSummary ?? "Doctor review required.")}</p>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Follow-up</p>
            <h2>Next clinical step</h2>
          </div>
          <ThreeDMedicalIcon name="calendar" size="sm" tone="teal" />
        </div>
        <p className="empty-state">
          <ThreeDMedicalIcon name="calendar" size="sm" tone="slate" />
          <span>Set the next follow-up from the appointment action when the doctor completes the visit. This page does not create automatic care plans.</span>
        </p>
      </article>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="obgyn-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CreatePregnancyEpisodeCard({ patient }: { patient: Patient }) {
  const [status, setStatus] = useState("");

  async function savePregnancy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("prijClinicToken");
    const payload = {
      patientId: patient.id,
      status: "active",
      ...formPayload(event.currentTarget, {
        gravida: "number",
        para: "number",
        living: "number",
        abortions: "number"
      })
    };
    const response = await fetch(`${getApiBaseUrl()}/pregnancies`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setStatus("Could not save the pregnancy episode. Check your role and try again.");
      return;
    }

    setStatus("Pregnancy episode saved. Doctor interpretation remains required.");
    window.setTimeout(() => window.location.reload(), 600);
  }

  return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Pregnancy episode</p>
          <h2>Create pregnancy record</h2>
          <p className="muted">Records dating inputs and obstetric summary only. The app does not assign risk diagnoses.</p>
        </div>
        <ThreeDMedicalIcon name="pregnancy" size="sm" tone="rose" />
      </div>
      <form className="obgyn-form-grid grouped" onSubmit={savePregnancy}>
        <fieldset className="obgyn-fieldset">
          <legend>Dating</legend>
          <label>LMP<input name="lmpDate" type="date" /></label>
          <label>EDD<input name="estimatedDueDate" type="date" /></label>
          <label>Dating method<input name="datingMethod" placeholder="LMP, scan, IVF, or clinician note" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Obstetric summary</legend>
          <label>Gravida<input name="gravida" type="number" min="0" max="20" /></label>
          <label>Para<input name="para" type="number" min="0" max="20" /></label>
          <label>Living<input name="living" type="number" min="0" max="20" /></label>
          <label>Abortions<input name="abortions" type="number" min="0" max="20" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Doctor notes</legend>
          <label>Notes<textarea name="notes" placeholder="Doctor-authored pregnancy context" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <button className="button" type="submit"><ThreeDMedicalIcon name="pregnancy" size="sm" />Save pregnancy episode</button>
      </form>
    </article>
  );
}

function FetusStarterCard({ pregnancy, fetuses }: { pregnancy?: PregnancyRecord; fetuses: FetusRecord[] }) {
  const [status, setStatus] = useState("");

  async function saveFetus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pregnancy?.id) {
      setStatus("Create a pregnancy episode before adding fetus records.");
      return;
    }
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/pregnancies/${pregnancy.id}/fetuses`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(formPayload(event.currentTarget))
    }).catch(() => null);

    if (!response || !response.ok) {
      setStatus("Could not save the fetus record. Check your role and try again.");
      return;
    }

    setStatus("Fetus record saved for multiple pregnancy tracking.");
    window.setTimeout(() => window.location.reload(), 600);
  }

  return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Fetus and multiple pregnancy</p>
          <h2>Fetus starter</h2>
          <p className="muted">Use labels such as A, B, or C. This records context only and does not diagnose growth or twin risk.</p>
        </div>
        <span className="badge">{fetuses.length} fetus record(s)</span>
      </div>
      <div className="data-list">
        {fetuses.map((fetus) => (
          <article className="data-row" key={fetus.id ?? fetus.label ?? "fetus"}>
            <div className="data-row-header">
              <strong>Fetus {fetus.label ?? "record"}</strong>
              <span className="badge">{fetus.status ?? "active"}</span>
            </div>
            <p className="muted">{[fetus.chorionicity, fetus.amnionicity, fetus.notes].filter(Boolean).join(" | ") || "No fetus-specific note yet."}</p>
          </article>
        ))}
      </div>
      <form className="obgyn-form-grid grouped" onSubmit={saveFetus}>
        <fieldset className="obgyn-fieldset">
          <legend>Fetus details</legend>
          <label>Label<input name="label" required placeholder="A, B, or C" /></label>
          <label>Chorionicity<input name="chorionicity" placeholder="If known" /></label>
          <label>Amnionicity<input name="amnionicity" placeholder="If known" /></label>
          <label>Status<input name="status" placeholder="active, completed, or note" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Notes</legend>
          <label>Fetus-specific notes<textarea name="notes" placeholder="Clinician-entered notes" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <button className="button secondary" type="submit"><ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />Add fetus record</button>
      </form>
    </article>
  );
}

function AntenatalVisitCard({ patient, pregnancy }: { patient: Patient; pregnancy?: PregnancyRecord }) {
  const [status, setStatus] = useState("");

  async function saveVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pregnancy?.id) {
      setStatus("Create a pregnancy episode before saving an antenatal visit.");
      return;
    }

    const token = sessionStorage.getItem("prijClinicToken");
    const payload = formPayload(event.currentTarget, {
      weightKg: "number",
      pulseBpm: "number"
    });
    const response = await fetch(`${getApiBaseUrl()}/pregnancies/${pregnancy.id}/antenatal-visits`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setStatus("Could not save the antenatal visit. Check your role and try again.");
      return;
    }

    setStatus("Antenatal visit saved to the patient timeline.");
    window.setTimeout(() => window.location.reload(), 600);
  }

  return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Antenatal Visits</p>
          <h2>Visit note workflow</h2>
          <p className="muted">Doctor-friendly recording form grouped in the order used during an antenatal follow-up.</p>
        </div>
        <ThreeDMedicalIcon name="doctor" size="sm" tone="teal" />
      </div>
      <form className="obgyn-form-grid grouped" onSubmit={saveVisit}>
        <fieldset className="obgyn-fieldset">
          <legend>Visit details</legend>
          <label>Visit date<input name="visitDate" type="date" /></label>
          <label>Gestational age<input name="gestationalAgeDisplay" placeholder="Weeks + days" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Maternal observations</legend>
          <label>BP<input name="bloodPressure" placeholder="Example format: 120/80" /></label>
          <label>Weight<input name="weightKg" type="number" min="0" step="0.1" placeholder="kg" /></label>
          <label>Pulse<input name="pulseBpm" type="number" min="0" step="1" placeholder="bpm" /></label>
          <label>Urine protein<input name="urineProtein" placeholder="If checked" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Symptoms</legend>
          <label>Symptoms<textarea name="symptomsText" placeholder="Clinician-recorded symptoms" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Examination</legend>
          <label>Examination<textarea name="examinationText" placeholder="Doctor examination notes" /></label>
          <label>Edema<input name="edema" placeholder="If recorded" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Fetal observations</legend>
          <label>Fetal heart<input name="fetalHeartText" placeholder="Recording only" /></label>
          <label>Fundal height<input name="fundalHeightText" placeholder="cm, if recorded" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Plan</legend>
          <label>Plan<textarea name="planText" placeholder="Doctor-authored plan" /></label>
          <label>Medication note<textarea name="medicationsNote" placeholder="Medication note, if any" /></label>
          <label>Investigations<textarea name="investigationsNote" placeholder="Orders or follow-up tests" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Next follow-up</legend>
          <label>Next follow-up date<input name="nextFollowUpDate" type="date" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <div className="form-actions no-print">
          <button className="button secondary" type="submit">
            <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
            Save Draft
          </button>
          <button className="button" type="submit">
            <ThreeDMedicalIcon name="calendar" size="sm" />
            Save Visit
          </button>
          <Link className="button secondary" href={`/patients/${patient.id}`}>Return to patient file</Link>
        </div>
      </form>
    </article>
  );
}

function UltrasoundReportBuilder({ patient, pregnancy, fetuses }: { patient: Patient; pregnancy?: PregnancyRecord; fetuses: FetusRecord[] }) {
  const [status, setStatus] = useState("");

  async function saveUltrasound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("prijClinicToken");
    const payload = {
      patientId: patient.id,
      ...(pregnancy?.id ? { pregnancyId: pregnancy.id } : {}),
      ...formPayload(event.currentTarget, {
        gestationalAgeWeeks: "number",
        gestationalAgeDays: "number",
        fetalHeartRateBpm: "number",
        bpdMm: "number",
        hcMm: "number",
        acMm: "number",
        flMm: "number",
        efwGrams: "number"
      })
    };

    const response = await fetch(`${getApiBaseUrl()}/ob-ultrasounds`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setStatus("Could not save the ultrasound report. Check your role and try again.");
      return;
    }

    setStatus("Ultrasound report saved as recording-only and added to the timeline.");
    window.setTimeout(() => window.location.reload(), 600);
  }

  return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ultrasound</p>
          <h2>OB ultrasound report builder</h2>
          <p className="muted">Measurements are recorded for clinician review. Interpretation must be completed by the doctor.</p>
        </div>
        <ThreeDMedicalIcon name="ultrasound" size="sm" tone="violet" />
      </div>
      <p className="notice safety-note">
        Measurements are recorded for clinician review. Interpretation must be completed by the doctor.
      </p>
      <form className="obgyn-form-grid grouped" onSubmit={saveUltrasound}>
        <fieldset className="obgyn-fieldset">
          <legend>Scan details</legend>
          <label>Scan date and time<input name="performedAt" type="datetime-local" /></label>
          <label>Scan type<input name="scanType" placeholder="Dating, anatomy, growth, follow-up" /></label>
          <label>Indication<input name="indication" placeholder="Doctor-entered indication" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Pregnancy and fetus context</legend>
          <label>Gestational age<input name="gestationalAgeDisplay" placeholder="Weeks + days" /></label>
          <label>Weeks<input name="gestationalAgeWeeks" type="number" min="0" max="45" /></label>
          <label>Days<input name="gestationalAgeDays" type="number" min="0" max="6" /></label>
          <label>
            Fetus selector
            <select name="fetusId" defaultValue="">
              <option value="">Singleton or not selected</option>
              {fetuses.map((fetus) => (
                <option value={fetus.id} key={fetus.id}>{fetus.label || "Fetus"}</option>
              ))}
            </select>
          </label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Fetal presentation</legend>
          <label>Presentation<input name="presentation" placeholder="Recording only" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Placenta</legend>
          <label>Placenta<input name="placenta" placeholder="Location and notes" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Amniotic fluid</legend>
          <label>Amniotic fluid note<input name="amnioticFluid" placeholder="Recording only" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Fetal heart</legend>
          <label>Fetal heart note<input name="fetalHeartText" placeholder="Observed or note" /></label>
          <label>Fetal heart bpm<input name="fetalHeartRateBpm" type="number" min="40" max="240" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Biometry recording</legend>
          <div className="obgyn-biometry">
            <label>BPD<input name="bpdMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>HC<input name="hcMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>AC<input name="acMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>FL<input name="flMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>EFW<input name="efwGrams" type="number" min="0" step="1" placeholder="grams" /></label>
          </div>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Doppler note placeholder</legend>
          <label>Doppler note<textarea name="dopplerNote" placeholder="Optional clinician note" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Impression</legend>
          <label>Doctor-written impression<textarea name="impressionText" placeholder="Doctor-written impression only" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <div className="form-actions no-print">
          <button className="button secondary" type="button" onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print view
          </button>
          <button className="button" type="submit">
            <ThreeDMedicalIcon name="ultrasound" size="sm" />
            Save ultrasound report
          </button>
        </div>
      </form>
    </article>
  );
}

function DoctorTemplateCards() {
  const templates: Array<[string, IconName, string]> = [
    ["New pregnancy booking", "pregnancy", "Open pregnancy overview, obstetric history, dating details, and first plan."],
    ["Routine antenatal follow-up", "calendar", "Record symptoms, BP, weight, fetal heart, plan, and next visit."],
    ["Ultrasound visit", "ultrasound", "Record scan type, indication, measurements, and doctor-written impression."],
    ["Gynecology visit", "doctor", "Use the guided visit flow for complaint, history, examination, impression, and plan."],
    ["Follow-up visit", "timeline", "Review timeline, prior orders, reports, prescriptions, and follow-up plan."],
    ["Procedure visit placeholder", "reports", "Prepare a clinician-authored note without automatic recommendations."]
  ];

  return (
    <article className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Doctor Templates</p>
          <h2>OB/GYN workflow templates</h2>
        </div>
        <ThreeDMedicalIcon name="files" size="sm" tone="amber" />
      </div>
      <div className="obgyn-template-grid">
        {templates.map(([title, icon, text]) => (
          <div className="obgyn-template-card" key={title}>
            <ThreeDMedicalIcon name={icon} size="sm" />
            <strong>{title}</strong>
            <p className="muted">{text}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function HistorySheetWorkspace({
  related,
  onSubmit,
  status
}: {
  related: Record<string, Record<string, unknown>[]>;
  onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
  status: string;
}) {
  const sheets = related["history-sheet"] ?? [];
  const latestSheet = sheets[0];
  const sheetId = latestSheet?.id ? String(latestSheet.id) : "";
  const [operation, setOperation] = useState<ReferenceResult | null>(null);
  const [medication, setMedication] = useState<ReferenceResult | null>(null);
  const [investigation, setInvestigation] = useState<ReferenceResult | null>(null);

  function handleSheetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      title: "OB/GYN history sheet",
      status: "draft",
      chiefComplaint: String(new FormData(form).get("chiefComplaint") ?? "").trim(),
      historyOfPresentIllness: String(new FormData(form).get("historyOfPresentIllness") ?? "").trim(),
      menstrualHistory: values(form, ["lmp", "cycleRegularity", "cycleInterval", "duration", "bleedingAmount", "dysmenorrhea", "intermenstrualBleeding", "postcoitalBleeding"]),
      obstetricHistory: values(form, ["gravida", "para", "abortions", "livingChildren", "edd", "previousCsCount", "previousVaginalDeliveryCount", "previousEctopicPregnancy", "previousMiscarriage", "previousStillbirth", "previousPretermBirth"]),
      gynecologicalHistory: values(form, ["vaginalDischarge", "pelvicPain", "dyspareunia", "menopauseStatus"]),
      contraceptionHistory: values(form, ["contraceptionHistory"]),
      infertilityHistory: values(form, ["infertilityHistory"]),
      pastMedicalHistory: values(form, ["pastMedicalHistory"]),
      allergyHistory: values(form, ["allergyHistory"]),
      familyHistory: values(form, ["familyHistory"]),
      socialHistory: values(form, ["socialHistory"]),
      notes: String(new FormData(form).get("notes") ?? "").trim()
    };
    void onSubmit("history-sheets", payload);
  }

  function submitHistoryItem(endpoint: string, payload: Record<string, unknown>) {
    void onSubmit(endpoint, { historySheetId: sheetId || undefined, ...payload });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>OB/GYN history sheet</h2>
          <p className="muted">Structured documentation for doctor review. Catalogs are lookup references only.</p>
        </div>
        {status ? <span className="badge">{status}</span> : <span className="badge">{sheets.length} sheet(s)</span>}
      </div>

      <form className="form-grid" onSubmit={handleSheetSubmit}>
        <fieldset className="obgyn-fieldset wide">
          <legend>Presenting history</legend>
          <label>Chief complaint<input name="chiefComplaint" defaultValue={String(latestSheet?.chiefComplaint ?? "")} /></label>
          <label>History of present illness<textarea name="historyOfPresentIllness" defaultValue={String(latestSheet?.historyOfPresentIllness ?? "")} /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Obstetric history</legend>
          <label>Gravida<input name="gravida" type="number" min="0" /></label>
          <label>Para<input name="para" type="number" min="0" /></label>
          <label>Abortions<input name="abortions" type="number" min="0" /></label>
          <label>Living children<input name="livingChildren" type="number" min="0" /></label>
          <label>LMP<input name="lmp" type="date" /></label>
          <label>EDD<input name="edd" type="date" /></label>
          <label>Previous CS count<input name="previousCsCount" type="number" min="0" /></label>
          <label>Previous vaginal delivery count<input name="previousVaginalDeliveryCount" type="number" min="0" /></label>
          <label>Previous ectopic pregnancy<input name="previousEctopicPregnancy" /></label>
          <label>Previous miscarriage<input name="previousMiscarriage" /></label>
          <label>Previous stillbirth<input name="previousStillbirth" /></label>
          <label>Previous preterm birth<input name="previousPretermBirth" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Gynecology history</legend>
          <label>Cycle regularity<input name="cycleRegularity" /></label>
          <label>Cycle interval<input name="cycleInterval" /></label>
          <label>Duration<input name="duration" /></label>
          <label>Amount of bleeding<input name="bleedingAmount" /></label>
          <label>Dysmenorrhea<input name="dysmenorrhea" /></label>
          <label>Intermenstrual bleeding<input name="intermenstrualBleeding" /></label>
          <label>Postcoital bleeding<input name="postcoitalBleeding" /></label>
          <label>Vaginal discharge<input name="vaginalDischarge" /></label>
          <label>Pelvic pain<input name="pelvicPain" /></label>
          <label>Dyspareunia<input name="dyspareunia" /></label>
          <label>Menopause status<input name="menopauseStatus" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Background history</legend>
          <label>Contraception history<textarea name="contraceptionHistory" /></label>
          <label>Infertility history<textarea name="infertilityHistory" /></label>
          <label>Past medical history<textarea name="pastMedicalHistory" /></label>
          <label>Allergy history<textarea name="allergyHistory" /></label>
          <label>Family history<textarea name="familyHistory" /></label>
          <label>Social history<textarea name="socialHistory" /></label>
          <label>Notes/free text<textarea name="notes" defaultValue={String(latestSheet?.notes ?? "")} /></label>
        </fieldset>
        <button className="button" type="submit">Save history sheet</button>
      </form>

      <div className="doctor-friendly-grid">
        <ReferencePicker title="Past operation" endpoint="/reference/operations/search" placeholder="Search operation/procedure" selected={operation} onSelect={setOperation} />
        <ReferencePicker title="Medication history" endpoint="/reference/medications/search" placeholder="Search generic name or class" selected={medication} onSelect={setMedication} />
        <ReferencePicker title="Previous investigation" endpoint="/reference/investigations/search" placeholder="Search investigation" selected={investigation} onSelect={setInvestigation} />
      </div>
      <div className="form-actions no-print">
        <button className="button secondary" type="button" disabled={!operation} onClick={() => operation && submitHistoryItem("operation-history", { operationCatalogItemId: operation.id, operationNameSnapshot: operation.label })}>Add operation</button>
        <button className="button secondary" type="button" disabled={!medication} onClick={() => medication && submitHistoryItem("medication-history", { medicationGenericId: medication.type === "generic_medication" ? medication.id : undefined, genericNameSnapshot: medication.genericName ?? medication.label, familyNameSnapshot: medication.familyName ?? undefined, currentOrPast: "past" })}>Add medication</button>
        <button className="button secondary" type="button" disabled={!investigation} onClick={() => investigation && submitHistoryItem("investigation-history", { investigationCatalogItemId: investigation.id, investigationNameSnapshot: investigation.label, context: "previous" })}>Add investigation</button>
      </div>
      <RelatedPanel config={{ key: "history-sheet", label: "Saved history sheets", icon: "doctor", empty: "No structured history sheet yet." }} rows={sheets} />
    </section>
  );
}

function ReferencePicker({ title, endpoint, placeholder, selected, onSelect }: { title: string; endpoint: string; placeholder: string; selected: ReferenceResult | null; onSelect: (result: ReferenceResult | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReferenceResult[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const token = sessionStorage.getItem("prijClinicToken");
    const timeout = window.setTimeout(() => {
      fetch(`${getApiBaseUrl()}${endpoint}?q=${encodeURIComponent(query)}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      })
        .then(async (response) => response.ok ? response.json() : { results: [] })
        .then((data: { results?: ReferenceResult[] }) => setResults(data.results ?? []))
        .catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [endpoint, query]);

  return (
    <article className="panel">
      <h3>{title}</h3>
      <label>
        Search
        <input value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {selected ? <p className="notice">Selected: {selected.label}</p> : null}
      <div className="data-list">
        {results.slice(0, 6).map((result) => (
          <button className="data-row" key={`${result.type}-${result.id}`} type="button" onClick={() => onSelect(result)}>
            <strong>{result.label}</strong>
            <span className="badge">{result.type.replaceAll("_", " ")}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function PatientActionPanel({
  onSubmit,
  status,
  related
}: {
  patientId: string;
  onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
  status: string;
  related: Record<string, Record<string, unknown>[]>;
}) {
  const [open, setOpen] = useState("appointment");
  const [selectedGeneric, setSelectedGeneric] = useState<ReferenceResult | null>(null);
  const invoices = related.billing ?? [];
  const actions: Array<[string, string, IconName]> = [
    ["appointment", "Appointment", "calendar"],
    ["queue", "Check In", "queue"],
    ["prescription", "Prescription", "prescription"],
    ["request", "Clinical Request", "investigations"],
    ["report", "Report", "reports"],
    ["ultrasound", "Ultrasound", "ultrasound"],
    ["invoice", "Invoice", "billing"],
    ["payment", "Payment", "billing"],
    ["consent", "Consent", "consent"]
  ];

  function handleSubmit(endpoint: string, buildPayload: (form: HTMLFormElement) => Record<string, unknown>) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void onSubmit(endpoint, buildPayload(event.currentTarget));
    };
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Patient actions</h2>
          <p className="muted">These actions save directly to this patient file. No patient re-selection is needed.</p>
        </div>
        {status ? <span className="badge">{status}</span> : null}
      </div>
      <div className="patient-action-strip" aria-label="Patient actions">
        {actions.map(([key, label, icon]) => (
          <button className={`patient-action ${open === key ? "active" : ""}`} key={key} onClick={() => setOpen(key)} type="button">
            <ThreeDMedicalIcon name={icon as IconName} size="sm" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {open === "appointment" ? (
        <ActionForm
          fields={[
            ["startAt", "Start time", "datetime-local", true],
            ["endAt", "End time", "datetime-local", true],
            ["appointmentType", "Visit type", "text", false]
          ]}
          onSubmit={handleSubmit("appointments", (form) => values(form, ["startAt", "endAt", "appointmentType"]))}
          submitLabel="Book appointment"
        />
      ) : null}

      {open === "queue" ? (
        <form className="form-grid" onSubmit={handleSubmit("queue-check-in", () => ({}))}>
          <p className="muted">Check this patient into today&apos;s waiting queue.</p>
          <button className="button" type="submit">Check in patient</button>
        </form>
      ) : null}

      {open === "prescription" ? (
        <form className="form-grid" onSubmit={handleSubmit("prescriptions", (form) => {
          const item = values(form, ["medicationName", "dose", "frequency", "instructions"]);
          return {
            items: [{
              ...item,
              medicationName: selectedGeneric?.genericName ?? selectedGeneric?.label ?? String(item.medicationName ?? ""),
              medicationGenericId: selectedGeneric?.type === "generic_medication" ? selectedGeneric.id : undefined
            }]
          };
        })}>
          <ReferencePicker title="Generic medication lookup" endpoint="/reference/medications/search" placeholder="Search generic name, class, or function" selected={selectedGeneric} onSelect={setSelectedGeneric} />
          <label>Manual generic name<input name="medicationName" required={!selectedGeneric} placeholder="Generic name only" /></label>
          <label>Dose<input name="dose" /></label>
          <label>Frequency<input name="frequency" /></label>
          <label>Instructions<input name="instructions" /></label>
          <button className="button" type="submit">Add prescription</button>
        </form>
      ) : null}

      {open === "request" ? (
        <ActionForm
          fields={[
            ["testName", "Requested test or service", "text", true],
            ["instructions", "Clinical reason", "text", false]
          ]}
          onSubmit={handleSubmit("investigations", (form) => ({ priority: "routine", items: [{ category: "laboratory", ...values(form, ["testName", "instructions"]) }] }))}
          submitLabel="Request investigation"
        />
      ) : null}

      {open === "report" ? (
        <ActionForm
          fields={[
            ["title", "Report title", "text", true],
            ["resultSummary", "Summary", "text", false]
          ]}
          onSubmit={handleSubmit("reports", (form) => ({ category: "other", ...values(form, ["title", "resultSummary"]) }))}
          submitLabel="Create report"
        />
      ) : null}

      {open === "ultrasound" ? (
        <ActionForm
          fields={[["impressionText", "Doctor-written impression", "text", false]]}
          note="Recording only. The app does not diagnose fetal growth or risk."
          onSubmit={handleSubmit("ultrasounds", (form) => values(form, ["impressionText"]))}
          submitLabel="Create ultrasound draft"
        />
      ) : null}

      {open === "invoice" ? (
        <ActionForm
          fields={[
            ["description", "Service", "text", true],
            ["unitAmount", "Price", "number", true],
            ["quantity", "Quantity", "number", false]
          ]}
          onSubmit={handleSubmit("invoices", (form) => {
            const item = values(form, ["description", "unitAmount", "quantity"]);
            return { items: [{ ...item, unitAmount: Number(item.unitAmount), quantity: Number(item.quantity || 1) }] };
          })}
          submitLabel="Create invoice"
        />
      ) : null}

      {open === "payment" ? (
        <form className="form-grid" onSubmit={handleSubmit("payments", (form) => ({ ...values(form, ["invoiceId", "amount", "referenceNote"]), method: "cash", amount: Number(new FormData(form).get("amount") || 0) }))}>
          <label>
            Invoice
            <select name="invoiceId" required>
              <option value="">Select invoice</option>
              {invoices.map((invoice) => (
                <option key={String(invoice.id)} value={String(invoice.id)}>{String(invoice.invoiceNumber ?? "Invoice")}</option>
              ))}
            </select>
          </label>
          <label>Amount<input name="amount" required type="number" min="0" step="0.01" /></label>
          <label>Reference note<input name="referenceNote" /></label>
          <button className="button" type="submit">Record payment</button>
        </form>
      ) : null}

      {open === "consent" ? (
        <form className="form-grid" onSubmit={handleSubmit("consents", () => ({ consentType: "treatment", status: "granted", notes: "Local consent workflow note. Legal text is not included." }))}>
          <p className="muted">Record local treatment consent status. Real legal text is not included.</p>
          <button className="button" type="submit">Record consent</button>
        </form>
      ) : null}
    </section>
  );
}

function ActionForm({
  fields,
  note,
  onSubmit,
  submitLabel
}: {
  fields: Array<[string, string, "text" | "datetime-local" | "number", boolean]>;
  note?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {note ? <p className="muted">{note}</p> : null}
      {fields.map(([name, label, type, required]) => (
        <label key={name}>
          {label}
          <input name={name} required={required} type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} />
        </label>
      ))}
      <button className="button" type="submit">{submitLabel}</button>
    </form>
  );
}

function SecretaryIntakePanel({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Secretary Intake</h2>
          <p className="muted">Patient-reported / entered by reception. Doctor review is required before clinical use.</p>
        </div>
        <span className="badge">Patient-reported</span>
      </div>
      {rows.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="files" size="sm" tone="slate" /><span>No intake submitted yet.</span></p> : null}
      <div className="data-list">{rows.map((row, index) => <article className="data-row" key={String(row.id ?? index)}><div className="data-row-header"><strong>{String(row.intakeType ?? "Intake")}</strong><span className="badge">{String(row.status ?? "draft")}</span></div><p className="muted">Patient-reported / entered by reception until doctor review.</p></article>)}</div>
    </section>
  );
}

function DoctorClinicalNotePanel({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Doctor Clinical Note</h2>
          <p className="muted">Doctor-only examination, clinical impression, diagnosis wording, risk classification, and plan.</p>
        </div>
        <span className="badge">Doctor review</span>
      </div>
      {rows.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="encounter" size="sm" tone="slate" /><span>No doctor clinical note yet.</span></p> : null}
      <div className="data-list">{rows.map((row, index) => <article className="data-row" key={String(row.id ?? index)}><div className="data-row-header"><strong>{String(row.chiefComplaint ?? "Clinical note")}</strong><span className="badge">{String(row.status ?? "draft")}</span></div><p className="muted">{String(row.clinicalImpression ?? row.assessmentText ?? "Doctor-authored clinical fields only.")}</p></article>)}</div>
    </section>
  );
}

function values(form: HTMLFormElement, keys: string[]) {
  const formData = new FormData(form);
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "").trim()]).filter(([, value]) => value));
}

async function submitVisitAction(patientId: string, endpoint: string, payload: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Could not save visit action.");
  return response.json() as Promise<Record<string, unknown>>;
}

function formPayload(form: HTMLFormElement, numericFields: Record<string, "number"> = {}) {
  const formData = new FormData(form);
  const payload: Record<string, unknown> = {};

  for (const [key, raw] of formData.entries()) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    if (numericFields[key]) {
      const numberValue = Number(value);
      if (!Number.isNaN(numberValue)) payload[key] = numberValue;
      continue;
    }
    payload[key] = key === "performedAt" && value.includes("T") ? new Date(value).toISOString() : value;
  }

  return payload;
}

function RelatedPanel({ config, rows }: { config: TabConfig; rows: Record<string, unknown>[] }) {
  const isBilling = config.key === "billing";
  const statementTotal = isBilling ? rows.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0) : 0;
  const statementPaid = isBilling ? rows.reduce((sum, row) => sum + Number(row.amountPaid ?? 0), 0) : 0;
  const statementBalance = isBilling ? rows.reduce((sum, row) => sum + Number(row.balanceAmount ?? 0), 0) : 0;

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{config.label}</h2>
          <p className="muted">Only this patient&apos;s records are shown here.</p>
        </div>
        {isBilling ? (
          <button className="button secondary compact" type="button" onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print statement
          </button>
        ) : (
          <ThreeDMedicalIcon name={config.icon} size="sm" />
        )}
      </div>
      {isBilling ? (
        <dl className="profile-grid printable-summary">
          <div><dt>Invoices</dt><dd>{rows.length}</dd></div>
          <div><dt>Total</dt><dd>{statementTotal.toFixed(2)}</dd></div>
          <div><dt>Paid</dt><dd>{statementPaid.toFixed(2)}</dd></div>
          <div><dt>Balance</dt><dd>{statementBalance.toFixed(2)}</dd></div>
        </dl>
      ) : null}
      {rows.length === 0 ? (
        <div className="empty-state">
          <ThreeDMedicalIcon name={config.icon} size="sm" tone="slate" />
          <span>{config.empty}</span>
        </div>
      ) : null}
      <div className="data-list">
        {rows.map((row, index) => (
          <article className="data-row" key={String(row.id ?? index)}>
            <div className="data-row-header">
              <strong>{String(row.title ?? row.invoiceNumber ?? row.appointmentType ?? row.draftType ?? "Patient record")}</strong>
              <span className="badge">{String(row.status ?? row.reviewStatus ?? row.category ?? "Draft")}</span>
            </div>
            <p className="muted">{String(row.notes ?? row.resultSummary ?? row.inputSourceSummary ?? row.chiefComplaint ?? "Patient-linked record.")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Timeline({ patient, items }: { patient: Patient; items: TimelineItem[] }) {
  const displayItems = items.length > 0 ? items : [{ title: "Patient file opened", description: `MRN ${patient.medicalRecordNumber}`, type: "patients", status: patient.status, dateTime: new Date().toISOString() }];
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Timeline</h2>
        <span className="badge">{displayItems.length} items</span>
      </div>
      <div className="timeline-list">
        {displayItems.map((item, index) => (
          <article className="timeline-item" key={`${item.title}-${index}`}>
            <ThreeDMedicalIcon name={timelineIcon(item.type)} size="sm" />
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.description} - {item.status}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PrintPacketPanel({ patient, related, timelineItems }: { patient: Patient; related: Record<string, Record<string, unknown>[]>; timelineItems: TimelineItem[] }) {
  const sections: Array<[string, Record<string, unknown>[]]> = [
    ["Investigation orders", related.orders ?? []],
    ["Reviewed results", (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "reviewed")],
    ["Documents index", related.documents ?? []],
    ["Consents", related.consents ?? []],
    ["Referrals", related.referrals ?? []],
    ["Follow-up tasks", related.tasks ?? []],
    ["Pregnancy and OB summary", related.pregnancy ?? []]
  ];

  return (
    <section className="panel printable-summary">
      <div className="section-heading no-print">
        <div>
          <h2>Patient visit packet</h2>
          <p className="muted">Browser print only. No PDF generation and no production stationery claim.</p>
        </div>
        <button className="button" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="reports" size="sm" />
          Print packet
        </button>
      </div>
      <div className="print-packet">
        <h2>{patient.firstName} {patient.lastName}</h2>
        <p>File {patient.medicalRecordNumber} | {patient.patientType ?? "General"} | Visit packet</p>
        <p>Document archive is metadata-only here. Doctor review required. No automatic interpretation.</p>
        {sections.map(([title, rows]) => (
          <section key={title}>
            <h3>{title}</h3>
            {rows.length ? rows.slice(0, 12).map((row, index) => (
              <p key={String(row.id ?? index)}>
                <strong>{String(row.title ?? row.reason ?? row.testName ?? row.status ?? "Record")}</strong>{" "}
                <span>{String(row.reviewStatus ?? row.status ?? row.category ?? "")}</span>
              </p>
            )) : <p>No records in this section.</p>}
          </section>
        ))}
        <section>
          <h3>Timeline</h3>
          {timelineItems.slice(0, 20).map((item, index) => (
            <p key={`${item.title}-${index}`}>{item.title}: {item.description}</p>
          ))}
        </section>
      </div>
    </section>
  );
}

function timelineIcon(key: string): IconName {
  if (key.includes("gynecology")) return "doctor";
  if (key.includes("visit") || key.includes("encounter")) return "encounter";
  if (key.includes("prescription")) return "prescription";
  if (key.includes("order") || key.includes("investigation")) return "investigations";
  if (key.includes("billing") || key.includes("invoice") || key.includes("payment")) return "billing";
  if (key.includes("document")) return "files";
  if (key.includes("referral")) return "reports";
  if (key.includes("task")) return "queue";
  if (key.includes("note")) return "doctor";
  if (key.includes("pregnancy")) return "pregnancy";
  if (key.includes("ultrasound")) return "ultrasound";
  if (key.includes("consent")) return "consent";
  return "timeline";
}

function templateLabel(value?: string | null) {
  const found = gynecologyTemplateOptions.find(([key]) => key === value);
  return found?.[1] ?? "Not recorded";
}

function templateSummary(value: string) {
  if (value === "abnormal_uterine_bleeding") return "Cycle pattern, amount, clots, related bleeding, and doctor impression.";
  if (value === "pelvic_pain") return "Onset, site, relation to cycle, urinary or bowel symptoms, and doctor impression.";
  if (value === "pcos") return "Cycle pattern, acne or hirsutism note, ultrasound note, labs note, and doctor impression.";
  if (value === "fibroid_ovarian_cyst") return "Finding source, size or location note, symptoms, follow-up plan, and impression.";
  if (value === "contraception") return "Current method, previous methods, checklist placeholder, counseling notes, chosen method.";
  return "General gynecology visit recording.";
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  return value.slice(0, 10);
}
