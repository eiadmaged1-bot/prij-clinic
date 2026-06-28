"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

type RelatedConfig = {
  key: string;
  label: string;
  endpoint?: string;
  collectionKey?: string;
  actionLabel: string;
  actionHref: string;
  empty: string;
};

const tabs: RelatedConfig[] = [
  { key: "overview", label: "Overview", actionLabel: "Edit in future", actionHref: "/patients", empty: "Patient demographics and safety context." },
  { key: "appointments", label: "Appointments", endpoint: "/appointments", collectionKey: "appointments", actionLabel: "Create appointment", actionHref: "/appointments", empty: "No appointments found for this patient in the current branch list." },
  { key: "queue", label: "Queue", endpoint: "/queue/today", collectionKey: "queueTickets", actionLabel: "Check in queue", actionHref: "/queue", empty: "No active queue ticket found for this patient today." },
  { key: "encounters", label: "Encounters", endpoint: "/encounters", collectionKey: "encounters", actionLabel: "Create encounter", actionHref: "/encounters", empty: "No encounters found for this patient." },
  { key: "prescriptions", label: "Prescriptions", endpoint: "/prescriptions", collectionKey: "prescriptions", actionLabel: "Create prescription", actionHref: "/prescriptions", empty: "No prescriptions found for this patient." },
  { key: "investigations", label: "Investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", actionLabel: "Create order", actionHref: "/investigations", empty: "No investigation orders found for this patient." },
  { key: "reports", label: "Reports", endpoint: "/reports", collectionKey: "reports", actionLabel: "Create report metadata", actionHref: "/reports", empty: "No report metadata found for this patient." },
  { key: "ob", label: "Pregnancy/Ultrasound", endpoint: "/pregnancies", collectionKey: "pregnancies", actionLabel: "Open OB workflow", actionHref: "/pregnancies", empty: "No pregnancy record found for this patient." },
  { key: "billing", label: "Billing", endpoint: "/billing/invoices", collectionKey: "invoices", actionLabel: "Create invoice", actionHref: "/billing", empty: "No invoices found for this patient." },
  { key: "consents", label: "Consents", endpoint: "/consents", collectionKey: "consentRecords", actionLabel: "Record consent", actionHref: "/consents", empty: "No consent record found for this patient." },
  { key: "ai", label: "AI Drafts", endpoint: "/ai-drafts", collectionKey: "aiDrafts", actionLabel: "Create AI placeholder", actionHref: "/ai-drafts", empty: "No disabled/mock AI draft found for this patient." }
];
const defaultTab = tabs[0]!;

export default function PatientFilePage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");

  const active = useMemo(() => tabs.find((tab) => tab.key === activeTab) ?? defaultTab, [activeTab]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    fetch(`${apiUrl}/patients/${patientId}`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Please sign in before opening patient files.");
        if (!response.ok) throw new Error(`Patient file returned ${response.status}.`);
        setPatient((await response.json()) as Patient);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to open patient file."));
  }, [patientId]);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Patient file</p>
            <h1>{patient ? `${patient.firstName} ${patient.lastName}` : "Opening patient file"}</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button secondary compact" href="/patients">
              Back to patients
            </Link>
            <span className="badge">{patient?.status ?? "Loading"}</span>
          </div>
        </div>
        <p className="muted">This workspace is scoped to one patient file. Module content below is filtered to this patient where the current APIs support it.</p>
      </section>

      <SafetyAlert />

      {error ? (
        <section className="panel">
          <p className="form-error">{error}</p>
          <Link className="button" href="/login">Go to login</Link>
        </section>
      ) : null}

      {patient ? (
        <>
          <section className="patient-hero panel">
            <div>
              <p className="eyebrow">MRN</p>
              <strong>{patient.medicalRecordNumber}</strong>
            </div>
            <div>
              <p className="eyebrow">DOB / age</p>
              <strong>{patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "Not set"}</strong>
            </div>
            <div>
              <p className="eyebrow">Sex</p>
              <strong>{patient.sex || "Not set"}</strong>
            </div>
            <div>
              <p className="eyebrow">Contact</p>
              <strong>{patient.phone || patient.email || "Not saved"}</strong>
            </div>
            <div className="wide">
              <p className="eyebrow">Patient ID for demo forms</p>
              <code>{patient.id}</code>
            </div>
          </section>

          <section className="patient-tabs" aria-label="Patient file sections">
            {tabs.map((tab) => (
              <button
                className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </section>

          {active.key === "overview" ? <Overview patient={patient} /> : <RelatedPanel config={active} patientId={patient.id} />}
        </>
      ) : !error ? (
        <div className="skeleton" />
      ) : null}
    </AppShell>
  );
}

function Overview({ patient }: { patient: Patient }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Patient overview</h2>
          <p className="muted">Only minimum demographics are shown. No clinical decision support is implemented.</p>
        </div>
        <span className="badge warning">Demo file</span>
      </div>
      <dl className="profile-grid">
        <div>
          <dt>Name</dt>
          <dd>{patient.firstName} {patient.lastName}</dd>
        </div>
        <div>
          <dt>MRN</dt>
          <dd>{patient.medicalRecordNumber}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{patient.branchId ?? "Current branch scope"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{patient.status}</dd>
        </div>
        <div className="wide">
          <dt>Notes</dt>
          <dd>{patient.notes || "No notes saved."}</dd>
        </div>
      </dl>
    </section>
  );
}

function RelatedPanel({ config, patientId }: { config: RelatedConfig; patientId: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState("Loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!config.endpoint) return;
    const token = sessionStorage.getItem("prijClinicToken");
    setStatus("Loading");
    setError("");
    fetch(`${apiUrl}${config.endpoint}`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}.`);
        const data = await response.json() as Record<string, unknown>;
        const collection = config.collectionKey ? data[config.collectionKey] : data;
        const list = Array.isArray(collection) ? collection as Record<string, unknown>[] : [];
        setRows(list.filter((row) => row.patientId === patientId));
        setStatus("Loaded");
      })
      .catch((loadError) => {
        setRows([]);
        setStatus("Unavailable");
        setError(loadError instanceof Error ? loadError.message : "Unable to load patient-scoped records.");
      });
  }, [config, patientId]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{config.label}</h2>
          <p className="muted">Patient-scoped view only. Status: {status}</p>
        </div>
        <Link className="button compact" href={config.actionHref}>
          {config.actionLabel}
        </Link>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {status === "Loading" ? <div className="skeleton" /> : null}
      {status !== "Loading" && rows.length === 0 ? <div className="empty-state">{config.empty}</div> : null}
      {rows.length > 0 ? (
        <div className="data-list">
          {rows.map((row, index) => (
            <article className="data-row" key={String(row.id ?? index)}>
              <div className="data-row-header">
                <strong>{String(row.title ?? row.invoiceNumber ?? row.appointmentType ?? row.draftType ?? row.id)}</strong>
                <span className="badge">{String(row.status ?? row.reviewStatus ?? row.category ?? "demo")}</span>
              </div>
              <p className="muted">{String(row.notes ?? row.resultSummary ?? row.inputSourceSummary ?? "Patient-linked demo record.")}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
