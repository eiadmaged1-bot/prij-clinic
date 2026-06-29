"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";
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
  notes?: string | null;
};

type PregnancyRecord = {
  id?: string;
  gravida?: number | string | null;
  para?: number | string | null;
  living?: number | string | null;
  abortions?: number | string | null;
  lmpDate?: string | null;
  estimatedDueDate?: string | null;
  datingMethod?: string | null;
  status?: string | null;
  riskFlags?: string | null;
  notes?: string | null;
  fetuses?: FetusRecord[];
  previousPregnancies?: PreviousPregnancyRecord[];
  antenatalVisits?: AntenatalVisitRecord[];
  obUltrasounds?: UltrasoundRecord[];
};

type PreviousPregnancyRecord = {
  id?: string;
  year?: number | string | null;
  outcome?: string | null;
  gestationalAgeAtOutcome?: string | null;
  modeOfDelivery?: string | null;
  complications?: string | null;
};

type FetusRecord = {
  id?: string;
  label?: string | null;
  chorionicity?: string | null;
  amnionicity?: string | null;
  status?: string | null;
  notes?: string | null;
};

type AntenatalVisitRecord = {
  id?: string;
  visitDate?: string | null;
  gestationalAgeDisplay?: string | null;
  bloodPressure?: string | null;
  weightKg?: number | string | null;
  fetalHeartText?: string | null;
  fundalHeightText?: string | null;
  planText?: string | null;
  nextFollowUpDate?: string | null;
};

type UltrasoundRecord = {
  id?: string;
  performedAt?: string | null;
  status?: string | null;
  scanType?: string | null;
  indication?: string | null;
  gestationalAgeDisplay?: string | null;
  presentation?: string | null;
  placenta?: string | null;
  amnioticFluid?: string | null;
  fetalHeartText?: string | null;
  impressionText?: string | null;
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
  { key: "overview", label: "Overview", icon: "patients", empty: "Start with the patient summary and next best action." },
  { key: "visits", label: "Visits", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready." },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit." },
  { key: "orders", label: "Orders & Reports", icon: "investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", empty: "No test orders yet. Order lab or radiology when needed." },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet." },
  { key: "billing", label: "Billing", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet. Create one only with demo payment details." },
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
  const [error, setError] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const active = useMemo(() => tabs.find((tab) => tab.key === activeTab) ?? tabs[0]!, [activeTab]);
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
  }, [patientId]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const load = async () => {
      const pairs = await Promise.all(
        tabs
          .filter((tab) => tab.endpoint)
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
  }, [patientId]);

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

          <section className="patient-tabs simple" aria-label="Patient file sections">
            {tabs.map((tab) => (
              <button className={`tab-button ${activeTab === tab.key ? "active" : ""}`} key={tab.key} onClick={() => setActiveTab(tab.key)} type="button">
                <ThreeDMedicalIcon name={tab.icon} size="sm" />
                {tab.label}
              </button>
            ))}
          </section>

          {active.key === "overview" ? <Overview patient={patient} related={related} /> : null}
          {active.key === "timeline" ? <Timeline items={timelineItems} patient={patient} /> : null}
          {active.key === "more" ? <MorePanel /> : null}
          {active.key === "pregnancy" ? (
            <ObgynWorkspace patient={patient} pregnancies={(related.pregnancy ?? []) as PregnancyRecord[]} reports={related.files ?? []} orders={related.orders ?? []} timelineItems={timelineItems} />
          ) : null}
          {active.key !== "overview" && active.key !== "timeline" && active.key !== "more" && active.key !== "pregnancy" ? (
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

function ObgynWorkspace({
  patient,
  pregnancies,
  reports,
  orders,
  timelineItems
}: {
  patient: Patient;
  pregnancies: PregnancyRecord[];
  reports: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  timelineItems: TimelineItem[];
}) {
  const activePregnancy = pregnancies[0];
  const fetuses = activePregnancy?.fetuses ?? [];
  const previousPregnancies = activePregnancy?.previousPregnancies ?? [];
  const antenatalVisits = activePregnancy?.antenatalVisits ?? [];
  const obUltrasounds = activePregnancy?.obUltrasounds ?? [];
  const obTimeline = timelineItems.filter((item) => ["pregnancy", "antenatal_visit", "ultrasound", "previous_pregnancy", "pregnancy_fetus"].includes(item.type));
  const [status, setStatus] = useState("");

  async function submitObgyn(endpoint: string, payload: Record<string, unknown>) {
    const token = sessionStorage.getItem("prijClinicToken");
    setStatus("Saving");
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setStatus("Could not save. Check the account permission and try again.");
      return;
    }

    setStatus("Saved to pregnancy workflow.");
    window.setTimeout(() => window.location.reload(), 500);
  }

  return (
    <section className="obgyn-workspace">
      <div className="obgyn-print-toolbar no-print">
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
          Print patient summary
        </button>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="ultrasound" size="sm" tone="slate" />
          Print ultrasound draft
        </button>
        {status ? <span className="badge">{status}</span> : null}
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
        <div className="obgyn-metric-grid">
          <Metric label="LMP" value={formatDate(activePregnancy?.lmpDate)} />
          <Metric label="EDD" value={formatDate(activePregnancy?.estimatedDueDate)} />
          <Metric label="Dating method" value={String(activePregnancy?.datingMethod ?? "Not recorded")} />
          <Metric label="Gravida / Para" value={`${activePregnancy?.gravida ?? "-"} / ${activePregnancy?.para ?? "-"}`} />
          <Metric label="Current status" value={String(activePregnancy?.status ?? "Not recorded")} />
          <Metric label="Next follow-up" value={formatDate(antenatalVisits[0]?.nextFollowUpDate) === "Not recorded" ? "Schedule follow-up" : formatDate(antenatalVisits[0]?.nextFollowUpDate)} />
          <Metric label="Last visit" value={formatDate(antenatalVisits[0]?.visitDate)} />
          <Metric label="Ultrasound summary" value={obUltrasounds.length ? `${obUltrasounds.length} ultrasound record(s)` : "No ultrasound record yet"} />
        </div>
        <div className="notice">
          <strong>Important notes</strong>
          <p className="muted">{activePregnancy?.notes || "Use this area for clinician-authored pregnancy notes only. The app does not provide automated clinical conclusions, growth scoring, or fetal-risk interpretation."}</p>
        </div>
        <PregnancyEpisodeForm patientId={patient.id} onSubmit={submitObgyn} />
      </article>

      <section className="obgyn-section-grid">
        <ObstetricHistoryCard activePregnancy={activePregnancy} histories={previousPregnancies} patientId={patient.id} onSubmit={submitObgyn} />
        <FetusCard activePregnancy={activePregnancy} fetuses={fetuses} onSubmit={submitObgyn} />
      </section>

      <section className="obgyn-section-grid">
        <AntenatalVisitCard activePregnancy={activePregnancy} patientId={patient.id} visits={antenatalVisits} onSubmit={submitObgyn} />
        <UltrasoundReportBuilder activePregnancy={activePregnancy} fetuses={fetuses} patientId={patient.id} ultrasounds={obUltrasounds} onSubmit={submitObgyn} />
      </section>

      <section className="obgyn-section-grid">
        <PregnancyTimelineCard items={obTimeline} />
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

function PregnancyEpisodeForm({ patientId, onSubmit }: { patientId: string; onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void> }) {
  return (
    <form className="obgyn-inline-form no-print" onSubmit={submitForm((form) => onSubmit("/pregnancies", { patientId, status: "active", ...numberValues(form, ["gravida", "para", "living", "abortions"]), ...values(form, ["lmpDate", "estimatedDueDate", "datingMethod", "notes"]) }))}>
      <strong>Start or update a pregnancy episode</strong>
      <label>Gravida<input name="gravida" type="number" min="0" max="20" /></label>
      <label>Para<input name="para" type="number" min="0" max="20" /></label>
      <label>Living<input name="living" type="number" min="0" max="20" /></label>
      <label>Abortions<input name="abortions" type="number" min="0" max="20" /></label>
      <label>LMP<input name="lmpDate" type="date" /></label>
      <label>EDD<input name="estimatedDueDate" type="date" /></label>
      <label>Dating method<input name="datingMethod" placeholder="Doctor-recorded method" /></label>
      <label className="wide">Pregnancy notes<textarea name="notes" placeholder="Clinician-authored notes only" /></label>
      <button className="button" type="submit">
        <ThreeDMedicalIcon name="pregnancy" size="sm" />
        Save pregnancy episode
      </button>
    </form>
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

function ObstetricHistoryCard({
  activePregnancy,
  histories,
  patientId,
  onSubmit
}: {
  activePregnancy?: PregnancyRecord;
  histories: PreviousPregnancyRecord[];
  patientId: string;
  onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
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
      <div className="data-list">
        {histories.slice(0, 3).map((history, index) => (
          <article className="data-row" key={String(history.id ?? index)}>
            <div className="data-row-header">
              <strong>{history.outcome ?? "Previous pregnancy"}</strong>
              <span className="badge">{history.year ?? "Year not set"}</span>
            </div>
            <p className="muted">{[history.gestationalAgeAtOutcome, history.modeOfDelivery, history.complications].filter(Boolean).join(" | ") || "Clinician-recorded history."}</p>
          </article>
        ))}
      </div>
      {histories.length === 0 ? (
        <p className="empty-state">
          <ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />
          <span>No previous pregnancy history recorded yet. Add fake/demo history only during workflow review.</span>
        </p>
      ) : null}
      <form className="obgyn-inline-form no-print" onSubmit={submitForm((form) => onSubmit("/previous-pregnancies", { patientId, pregnancyEpisodeId: activePregnancy?.id, ...numberValues(form, ["year", "birthWeightGrams"]), ...values(form, ["outcome", "gestationalAgeAtOutcome", "modeOfDelivery", "complications", "notes"]) }))}>
        <strong>Add previous pregnancy history</strong>
        <label>Year<input name="year" type="number" min="1900" max="2100" /></label>
        <label>Outcome<input name="outcome" required placeholder="Recorded outcome" /></label>
        <label>Gestational age<input name="gestationalAgeAtOutcome" placeholder="Weeks or term note" /></label>
        <label>Mode of delivery<input name="modeOfDelivery" placeholder="Doctor-recorded" /></label>
        <label>Birth weight<input name="birthWeightGrams" type="number" min="0" max="10000" /></label>
        <label className="wide">Complications or notes<textarea name="complications" placeholder="Recording only" /></label>
        <button className="button secondary" type="submit">Save history</button>
      </form>
    </article>
  );
}

function FetusCard({
  activePregnancy,
  fetuses,
  onSubmit
}: {
  activePregnancy?: PregnancyRecord;
  fetuses: FetusRecord[];
  onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Fetus Records</p>
          <h2>Singleton or multiple pregnancy</h2>
          <p className="muted">Use Singleton, A, B, or another clinician-entered label. This is recording only.</p>
        </div>
        <ThreeDMedicalIcon name="pregnancy" size="sm" tone="rose" />
      </div>
      <div className="data-list">
        {fetuses.map((fetus, index) => (
          <article className="data-row" key={String(fetus.id ?? index)}>
            <div className="data-row-header">
              <strong>Fetus {fetus.label ?? "record"}</strong>
              <span className="badge">{fetus.status ?? "active"}</span>
            </div>
            <p className="muted">{[fetus.chorionicity, fetus.amnionicity, fetus.notes].filter(Boolean).join(" | ") || "No additional note."}</p>
          </article>
        ))}
      </div>
      {fetuses.length === 0 ? (
        <p className="empty-state">
          <ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />
          <span>No fetus record yet. Add Singleton for one fetus or A/B for multiple pregnancy support.</span>
        </p>
      ) : null}
      <form className="obgyn-inline-form no-print" onSubmit={submitForm((form) => activePregnancy?.id ? onSubmit(`/pregnancies/${activePregnancy.id}/fetuses`, { status: "active", ...values(form, ["label", "chorionicity", "amnionicity", "notes"]) }) : Promise.resolve())}>
        <strong>Add fetus record</strong>
        <label>Label<input name="label" required placeholder="Singleton / A / B" /></label>
        <label>Chorionicity<input name="chorionicity" placeholder="If recorded" /></label>
        <label>Amnionicity<input name="amnionicity" placeholder="If recorded" /></label>
        <label className="wide">Notes<textarea name="notes" placeholder="Clinician note" /></label>
        <button className="button secondary" disabled={!activePregnancy?.id} type="submit">Save fetus record</button>
      </form>
    </article>
  );
}

function AntenatalVisitCard({
  activePregnancy,
  patientId,
  visits,
  onSubmit
}: {
  activePregnancy?: PregnancyRecord;
  patientId: string;
  visits: AntenatalVisitRecord[];
  onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Antenatal Visits</p>
          <h2>Visit note workflow</h2>
          <p className="muted">Doctor-friendly recording form. Saved visits appear in the pregnancy timeline and print summary.</p>
        </div>
        <ThreeDMedicalIcon name="doctor" size="sm" tone="teal" />
      </div>
      <div className="data-list">
        {visits.slice(0, 3).map((visit, index) => (
          <article className="data-row" key={String(visit.id ?? index)}>
            <div className="data-row-header">
              <strong>{formatDate(visit.visitDate)}</strong>
              <span className="badge">{visit.gestationalAgeDisplay ?? "GA not set"}</span>
            </div>
            <p className="muted">{[visit.bloodPressure, visit.fetalHeartText, visit.planText].filter(Boolean).join(" | ") || "Antenatal visit recorded."}</p>
          </article>
        ))}
      </div>
      <form className="obgyn-form-grid" onSubmit={submitForm((form) => activePregnancy?.id ? onSubmit(`/pregnancies/${activePregnancy.id}/antenatal-visits`, { ...numberValues(form, ["weightKg", "pulseBpm"]), ...values(form, ["visitDate", "gestationalAgeDisplay", "bloodPressure", "edema", "urineProtein", "symptomsText", "examinationText", "fetalHeartText", "fundalHeightText", "planText", "medicationsNote", "investigationsNote", "nextFollowUpDate"]) }) : Promise.resolve())}>
        <div className="obgyn-form-section wide">
          <strong>Visit details</strong>
          <label>Visit date<input name="visitDate" type="date" /></label>
          <label>Gestational age<input name="gestationalAgeDisplay" placeholder="Weeks + days" /></label>
          <label>Next follow-up<input name="nextFollowUpDate" type="date" /></label>
        </div>
        <div className="obgyn-form-section wide">
          <strong>Vitals and pregnancy checks</strong>
          <label>BP<input name="bloodPressure" placeholder="Example format: 120/80" /></label>
          <label>Weight<input name="weightKg" type="number" min="0" step="0.1" placeholder="kg" /></label>
          <label>Pulse<input name="pulseBpm" type="number" min="0" max="250" /></label>
          <label>Fetal heart<input name="fetalHeartText" placeholder="Recording only" /></label>
          <label>Fundal height<input name="fundalHeightText" placeholder="cm, if recorded" /></label>
          <label>Edema<input name="edema" placeholder="If recorded" /></label>
          <label>Urine protein<input name="urineProtein" placeholder="If recorded" /></label>
        </div>
        <label>Symptoms<textarea name="symptomsText" placeholder="Clinician-recorded symptoms" /></label>
        <label>Examination<textarea name="examinationText" placeholder="Doctor examination notes" /></label>
        <label>Plan<textarea name="planText" placeholder="Doctor-authored plan" /></label>
        <label>Investigations<textarea name="investigationsNote" placeholder="Orders or follow-up tests" /></label>
        <label>Medication note<textarea name="medicationsNote" placeholder="Medication note if needed" /></label>
        <div className="form-actions no-print">
          <button className="button secondary" disabled={!activePregnancy?.id} type="submit">Save Draft</button>
          <button className="button" disabled={!activePregnancy?.id} type="submit">Save Visit</button>
          <Link className="button secondary" href={`/patients/${patientId}`}>Return to patient file</Link>
        </div>
      </form>
    </article>
  );
}

function UltrasoundReportBuilder({
  activePregnancy,
  fetuses,
  patientId,
  ultrasounds,
  onSubmit
}: {
  activePregnancy?: PregnancyRecord;
  fetuses: FetusRecord[];
  patientId: string;
  ultrasounds: UltrasoundRecord[];
  onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
}) {
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
      <p className="notice">Measurements are recorded for clinician review. Interpretation must be completed by the doctor.</p>
      <div className="data-list">
        {ultrasounds.slice(0, 3).map((scan, index) => (
          <article className="data-row" key={String(scan.id ?? index)}>
            <div className="data-row-header">
              <strong>{scan.scanType ?? "OB ultrasound"}</strong>
              <span className="badge">{scan.status ?? "draft"}</span>
            </div>
            <p className="muted">{[formatDate(scan.performedAt), scan.gestationalAgeDisplay, scan.impressionText].filter(Boolean).join(" | ") || "Doctor review required."}</p>
          </article>
        ))}
      </div>
      <form className="obgyn-form-grid" onSubmit={submitForm((form) => onSubmit("/ob-ultrasounds", { patientId, pregnancyId: activePregnancy?.id, ...numberValues(form, ["gestationalAgeWeeks", "gestationalAgeDays", "fetalHeartRateBpm", "bpdMm", "hcMm", "acMm", "flMm", "efwGrams"]), ...dateTimeValues(form, ["performedAt"]), ...values(form, ["scanType", "indication", "gestationalAgeDisplay", "fetusId", "presentation", "placenta", "amnioticFluid", "fetalHeartText", "dopplerNote", "impressionText"]) }))}>
        <div className="obgyn-form-section wide">
          <strong>Scan details</strong>
          <label>Scan date and time<input name="performedAt" type="datetime-local" /></label>
          <label>Scan type<input name="scanType" placeholder="Dating, anatomy, growth, follow-up" /></label>
          <label>Indication<input name="indication" placeholder="Doctor-entered indication" /></label>
        </div>
        <div className="obgyn-form-section wide">
          <strong>Fetus and pregnancy context</strong>
          <label>Gestational age<input name="gestationalAgeDisplay" placeholder="Weeks + days" /></label>
          <label>Weeks<input name="gestationalAgeWeeks" type="number" min="0" max="45" /></label>
          <label>Days<input name="gestationalAgeDays" type="number" min="0" max="6" /></label>
          <label>Fetus selector<select name="fetusId" defaultValue="">
            <option value="">Singleton or not selected</option>
            {fetuses.map((fetus) => <option key={String(fetus.id)} value={String(fetus.id)}>{fetus.label ?? "Fetus"}</option>)}
          </select></label>
        </div>
        <label>Fetal presentation<input name="presentation" placeholder="Recording only" /></label>
        <label>Placenta<input name="placenta" placeholder="Location and notes" /></label>
        <label>Amniotic fluid<input name="amnioticFluid" placeholder="Recording only" /></label>
        <label>Fetal heart<input name="fetalHeartText" placeholder="BPM or observed" /></label>
        <label>Fetal heart rate<input name="fetalHeartRateBpm" type="number" min="40" max="240" placeholder="BPM" /></label>
        <div className="obgyn-biometry wide">
          {["BPD", "HC", "AC", "FL", "EFW"].map((field) => (
            <label key={field}>{field}<input name={field === "EFW" ? "efwGrams" : `${field.toLowerCase()}Mm`} type="number" min="0" step={field === "EFW" ? "1" : "0.1"} placeholder="Manual measurement" /></label>
          ))}
        </div>
        <label>Doppler note<textarea name="dopplerNote" placeholder="Optional clinician note placeholder" /></label>
        <label>Impression<textarea name="impressionText" placeholder="Doctor-written impression only" /></label>
        <label>Report status<select defaultValue="Draft"><option>Draft</option></select></label>
        <p className="notice wide">No automated growth interpretation, fetal risk scoring, growth chart calculation, or fetal-image interpretation is performed.</p>
        <div className="form-actions no-print">
          <button className="button" type="submit">Save ultrasound draft</button>
          <button className="button secondary" type="button" onClick={() => window.print()}>Print ultrasound report</button>
        </div>
      </form>
    </article>
  );
}

function PregnancyTimelineCard({ items }: { items: TimelineItem[] }) {
  return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Timeline integration</p>
          <h2>Pregnancy timeline</h2>
        </div>
        <ThreeDMedicalIcon name="timeline" size="sm" tone="teal" />
      </div>
      {items.length === 0 ? (
        <p className="empty-state">
          <ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />
          <span>Pregnancy episode, obstetric history, antenatal visits, fetus records, and ultrasound records appear here after saving.</span>
        </p>
      ) : (
        <div className="timeline-list">
          {items.slice(0, 6).map((item, index) => (
            <article className="timeline-item" key={`${item.title}-${index}`}>
              <ThreeDMedicalIcon name={timelineIcon(item.type)} size="sm" />
              <div>
                <strong>{item.title}</strong>
                <p className="muted">{item.description} - {formatDate(item.dateTime)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
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
          note="Recording only. The doctor interprets fetal growth and risk."
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

function numberValues(form: HTMLFormElement, keys: string[]) {
  const formData = new FormData(form);
  return Object.fromEntries(
    keys
      .map((key) => [key, String(formData.get(key) ?? "").trim()] as const)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [key, Number(value)])
  );
}

function dateTimeValues(form: HTMLFormElement, keys: string[]) {
  const formData = new FormData(form);
  return Object.fromEntries(
    keys
      .map((key) => [key, String(formData.get(key) ?? "").trim()] as const)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [key, new Date(value).toISOString()])
  );
}

function submitForm(callback: (form: HTMLFormElement) => Promise<void>) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void callback(event.currentTarget);
  };
}

function RelatedPanel({ config, rows }: { config: TabConfig; rows: Record<string, unknown>[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{config.label}</h2>
          <p className="muted">Only this patient&apos;s records are shown here.</p>
        </div>
        <ThreeDMedicalIcon name={config.icon} size="sm" />
      </div>
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
  if (key.includes("visit") || key.includes("encounter")) return "encounter";
  if (key.includes("prescription")) return "prescription";
  if (key.includes("order") || key.includes("investigation")) return "investigations";
  if (key.includes("billing") || key.includes("invoice") || key.includes("payment")) return "billing";
  if (key.includes("pregnancy")) return "pregnancy";
  if (key.includes("ultrasound")) return "ultrasound";
  if (key.includes("consent")) return "consent";
  return "timeline";
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  return value.slice(0, 10);
}
