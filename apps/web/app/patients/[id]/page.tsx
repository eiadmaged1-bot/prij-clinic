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
