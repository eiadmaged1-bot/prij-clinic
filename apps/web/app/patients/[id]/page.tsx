"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";
import { ManagementSnapshotPanel } from "../../../components/ai-management/ManagementSnapshotPanel";
import { ObDatingReviewPanel } from "../../../components/calculators/ObDatingReviewPanel";
import { PregnancyDatingCard } from "../../../components/patients/PregnancyDatingCard";
import { AppShell, SafetyAlert } from "../../mvp-page";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
  edd?: string | null;
  datingMethod?: string | null;
  status?: string | null;
  notes?: string | null;
};

type FetusRecord = {
  id?: string;
  label?: string | null;
  status?: string | null;
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

const moreCards: Array<[string, string, string, IconName]> = [
  ["/ultrasound", "Ultrasound", "Recording only; clinician interpretation required.", "ultrasound"],
  ["/ai-drafts", "AI Drafts", "Doctor must review before use. Nothing is added to the final record automatically.", "ai"],
  ["/consents", "Consents", "Consent foundation for demo workflows.", "consent"],
  ["/reports", "Attachments", "Demo attachment records only. Private clinical file upload is disabled.", "files"]
];

const tabs: TabConfig[] = [
  { key: "overview", label: "Summary", icon: "patients", empty: "Start with the patient summary and next best action." },
  { key: "pregnancy", label: "Pregnancy/OB", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet." },
  { key: "gynecology", label: "General Gynecology", icon: "doctor", endpoint: "/gynecology-visits", collectionKey: "gynecologyVisits", empty: "No gynecology visit yet. Start with a recording-only template." },
  { key: "ai-snapshot", label: "AI Snapshot", icon: "ai", empty: "No management snapshot yet. Doctor review is required." },
  { key: "visits", label: "Encounters", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready." },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit." },
  { key: "orders", label: "Investigations", icon: "investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", empty: "No test orders yet. Order lab or radiology when needed." },
  { key: "billing", label: "Billing/Finance", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet. Create one only with demo payment details." },
  { key: "files", label: "Files", icon: "files", endpoint: "/reports", collectionKey: "reports", empty: "No report or attachment record yet. Real clinical file upload is disabled." },
  { key: "timeline", label: "Timeline", icon: "timeline", empty: "The patient story appears here as records are created." },
  { key: "more", label: "More", icon: "settings", empty: "Additional safe sections for ultrasound, consents, and AI draft review." }
];

export default function PatientFilePage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [related, setRelated] = useState<Record<string, Record<string, unknown>[]>>({});
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const active = useMemo(() => tabs.find((tab) => tab.key === activeTab) ?? tabs[0]!, [activeTab]);
  const visibleTabs = useMemo(
    () => tabs.filter((tab) => {
      if (tab.key === "gynecology") return permissions.includes("encounter.read") || permissions.includes("encounter.create");
      if (tab.key === "ai-snapshot") return permissions.includes("ai_management.request") || permissions.includes("ai_management.read");
      return true;
    }),
    [permissions]
  );
  const ageLabel = patient?.dateOfBirth ? `${patient.dateOfBirth.slice(0, 10)}` : "Age not set";

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    fetch(`${apiUrl}/patients/${patientId}`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Please sign in before opening patient files.");
        if (!response.ok) throw new Error("Could not open this patient file.");
        setPatient((await response.json()) as Patient);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to open patient file."));

    fetch(`${apiUrl}/auth/me`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) return;
        const session = await response.json() as { user?: { permissions?: string[] } };
        setPermissions(session.user?.permissions ?? []);
      })
      .catch(() => setPermissions([]));
  }, [patientId]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const load = async () => {
      const pairs = await Promise.all(
        tabs
          .filter((tab) => tab.endpoint && (tab.key !== "gynecology" || permissions.includes("encounter.read") || permissions.includes("encounter.create")))
          .map(async (tab) => {
            try {
              const response = await fetch(`${apiUrl}${tab.endpoint}`, {
                credentials: "include",
                headers: token ? { authorization: `Bearer ${token}` } : undefined
              });
              if (!response.ok) return [tab.key, []] as const;
              const data = await response.json() as Record<string, unknown>;
              const collection = tab.collectionKey ? data[tab.collectionKey] : data;
              const list = Array.isArray(collection) ? collection as Record<string, unknown>[] : [];
              return [tab.key, list.filter((row) => row.patientId === patientId)] as const;
            } catch {
              return [tab.key, []] as const;
            }
          })
      );
      setRelated(Object.fromEntries(pairs));
      try {
        const timelineResponse = await fetch(`${apiUrl}/patients/${patientId}/timeline`, {
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
    const response = await fetch(`${apiUrl}/patients/${patientId}/${endpoint}`, {
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
          <p className="eyebrow">Patient file</p>
          <h1>{patient ? `${patient.firstName} ${patient.lastName}` : "Opening patient"}</h1>
          <p className="muted">{patient ? `${ageLabel} | File ${patient.medicalRecordNumber} | ${patient.phone || patient.email || "No contact saved"}` : "Loading patient details"}</p>
        </div>
        <div className="patient-primary-actions">
          <Link className="button large" href={patient ? `/doctor/visit?patientId=${patient.id}` : "/patients"}>
            <ThreeDMedicalIcon name="encounter" size="sm" />
            Start Visit
          </Link>
          <span className="badge">{patient?.status ?? "Loading"}</span>
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
              <button className={`tab-button ${activeTab === tab.key ? "active" : ""}`} key={tab.key} onClick={() => setActiveTab(tab.key)} type="button">
                <ThreeDMedicalIcon name={tab.icon} size="sm" />
                {tab.label}
              </button>
            ))}
          </section>

          {active.key === "overview" ? <Overview patient={patient} related={related} /> : null}
          {active.key === "timeline" ? <Timeline items={timelineItems} patient={patient} /> : null}
          {active.key === "more" ? <MorePanel /> : null}
          {active.key === "ai-snapshot" ? <ManagementSnapshotPanel patientId={patient.id} /> : null}
          {active.key === "gynecology" ? <GynecologyWorkspace patient={patient} visits={(related.gynecology ?? []) as GynecologyVisit[]} /> : null}
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
          {active.key !== "overview" && active.key !== "timeline" && active.key !== "more" && active.key !== "ai-snapshot" && active.key !== "gynecology" && active.key !== "pregnancy" ? (
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
        <p className="empty-state">
          <ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />
          <span>Use the tabs above to review visits, prescriptions, orders, reports, pregnancy records, billing, files, and timeline.</span>
        </p>
      </article>
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

    const response = await fetch(`${apiUrl}/patients/${patient.id}/gynecology-visits`, {
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
            <p className="eyebrow">General Gynecology</p>
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
  const activePregnancy = pregnancies[0];

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
            <span>Create the pregnancy episode from the Pregnancy module first, then return here for antenatal visits and ultrasound recording.</span>
          </p>
        ) : null}
        <div className="obgyn-metric-grid">
          <Metric label="LMP" value={formatDate(activePregnancy?.lmp)} />
          <Metric label="EDD" value={formatDate(activePregnancy?.edd)} />
          <Metric label="Dating method" value={String(activePregnancy?.datingMethod ?? "Not recorded")} />
          <Metric label="Gravida / Para" value={`${activePregnancy?.gravida ?? "-"} / ${activePregnancy?.para ?? "-"}`} />
          <Metric label="Current status" value={String(activePregnancy?.status ?? "Not recorded")} />
          <Metric label="Next visit" value="Schedule follow-up" />
          <Metric label="Last visit" value="Review visits below" />
          <Metric label="Ultrasound summary" value={reports.length ? `${reports.length} report record(s)` : "No ultrasound report yet"} />
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
            <span>Record previous pregnancy details as clinician-entered history only. Use fake/demo data in this pilot environment.</span>
          </p>
        </article>

        <AntenatalVisitCard patient={patient} pregnancy={activePregnancy} />
      </section>

      <section className="obgyn-section-grid">
        <UltrasoundReportBuilder patient={patient} pregnancy={activePregnancy} fetuses={[]} />
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
    const response = await fetch(`${apiUrl}/pregnancies/${pregnancy.id}/antenatal-visits`, {
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

    const response = await fetch(`${apiUrl}/ob-ultrasounds`, {
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
  const invoices = related.billing ?? [];
  const actions: Array<[string, string, IconName]> = [
    ["appointment", "Appointment", "calendar"],
    ["queue", "Check In", "queue"],
    ["prescription", "Prescription", "prescription"],
    ["order", "Order Tests", "investigations"],
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
        <ActionForm
          fields={[
            ["medicationName", "Medicine", "text", true],
            ["dose", "Dose", "text", false],
            ["frequency", "Frequency", "text", false],
            ["instructions", "Instructions", "text", false]
          ]}
          onSubmit={handleSubmit("prescriptions", (form) => ({ items: [values(form, ["medicationName", "dose", "frequency", "instructions"])] }))}
          submitLabel="Add prescription"
        />
      ) : null}

      {open === "order" ? (
        <ActionForm
          fields={[
            ["testName", "Requested test or service", "text", true],
            ["instructions", "Clinical reason", "text", false]
          ]}
          onSubmit={handleSubmit("investigations", (form) => ({ priority: "routine", items: [{ category: "laboratory", ...values(form, ["testName", "instructions"]) }] }))}
          submitLabel="Order test"
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
        <form className="form-grid" onSubmit={handleSubmit("consents", () => ({ consentType: "treatment", status: "granted", notes: "Local demo consent placeholder." }))}>
          <p className="muted">Record a local demo treatment consent placeholder. Real legal text is not included.</p>
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

function values(form: HTMLFormElement, keys: string[]) {
  const formData = new FormData(form);
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "").trim()]).filter(([, value]) => value));
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

function MorePanel() {
  return (
    <section className="module-grid">
      {moreCards.map(([href, title, text, icon]) => (
        <Link className="module-card" href={href} key={title}>
          <ThreeDMedicalIcon name={icon as IconName} size="md" />
          <strong>{title}</strong>
          <p className="muted">{text}</p>
        </Link>
      ))}
      <article className="module-card">
        <ThreeDMedicalIcon name="settings" size="md" tone="slate" />
        <strong>Patient workspace</strong>
        <p className="muted">This workspace stays focused on the current patient and keeps technical details out of the daily visit flow.</p>
      </article>
    </section>
  );
}

function timelineIcon(key: string): IconName {
  if (key.includes("gynecology")) return "doctor";
  if (key.includes("visit") || key.includes("encounter")) return "encounter";
  if (key.includes("prescription")) return "prescription";
  if (key.includes("order") || key.includes("investigation")) return "investigations";
  if (key.includes("billing") || key.includes("invoice") || key.includes("payment")) return "billing";
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
