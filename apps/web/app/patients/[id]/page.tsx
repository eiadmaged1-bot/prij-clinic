"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

type TabConfig = {
  key: string;
  label: string;
  icon: IconName;
  endpoint?: string;
  collectionKey?: string;
  empty: string;
};

const patientActions: Array<[string, string, IconName]> = [
  ["/appointments", "Appointment", "calendar"],
  ["/queue", "Check In", "queue"],
  ["/prescriptions", "Prescription", "prescription"],
  ["/investigations", "Order Tests", "investigations"],
  ["/billing", "Invoice", "billing"],
  ["/consents", "Consent", "consent"]
];

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
  const [error, setError] = useState("");

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
    };
    void load();
  }, [patientId]);

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
          <Link className="button large" href="/doctor/visit">
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
          <section className="patient-action-strip" aria-label="Patient actions">
            {patientActions.map(([href, label, icon]) => (
              <Link className="patient-action" href={href} key={label}>
                <ThreeDMedicalIcon name={icon as IconName} size="sm" />
                <span>{label}</span>
              </Link>
            ))}
          </section>

          <section className="patient-tabs simple" aria-label="Patient file sections">
            {tabs.map((tab) => (
              <button className={`tab-button ${activeTab === tab.key ? "active" : ""}`} key={tab.key} onClick={() => setActiveTab(tab.key)} type="button">
                <ThreeDMedicalIcon name={tab.icon} size="sm" />
                {tab.label}
              </button>
            ))}
          </section>

          {active.key === "overview" ? <Overview patient={patient} related={related} /> : null}
          {active.key === "timeline" ? <Timeline related={related} patient={patient} /> : null}
          {active.key === "more" ? <MorePanel /> : null}
          {active.key !== "overview" && active.key !== "timeline" && active.key !== "more" ? (
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
        <Link className="button large" href="/doctor/visit">
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

function Timeline({ patient, related }: { patient: Patient; related: Record<string, Record<string, unknown>[]> }) {
  const items = [
    { title: "Patient file opened", detail: `File ${patient.medicalRecordNumber}`, icon: "patients" as IconName },
    ...Object.entries(related).flatMap(([key, rows]) => rows.map((row) => ({
      title: labelize(key),
      detail: String(row.title ?? row.invoiceNumber ?? row.appointmentType ?? row.status ?? "Patient activity"),
      icon: timelineIcon(key)
    })))
  ];
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Timeline</h2>
        <span className="badge">{items.length} items</span>
      </div>
      <div className="timeline-list">
        {items.map((item, index) => (
          <article className="timeline-item" key={`${item.title}-${index}`}>
            <ThreeDMedicalIcon name={item.icon} size="sm" />
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.detail}</p>
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

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function timelineIcon(key: string): IconName {
  if (key.includes("visit")) return "encounter";
  if (key.includes("prescription")) return "prescription";
  if (key.includes("order")) return "investigations";
  if (key.includes("billing")) return "billing";
  if (key.includes("pregnancy")) return "pregnancy";
  return "timeline";
}
