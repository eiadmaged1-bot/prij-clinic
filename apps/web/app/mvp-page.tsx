"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "datetime-local" | "number";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
};

type MvpPageProps = {
  title: string;
  eyebrow: string;
  items: string[];
  endpoint?: string;
  collectionKey?: string;
  createEndpoint?: string;
  createFields?: Field[];
  createNote?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const links = [
  ["/dashboard", "Dashboard"],
  ["/patients", "Patients"],
  ["/patients/new", "New Patient"],
  ["/appointments", "Appointments"],
  ["/calendar", "Calendar"],
  ["/queue", "Queue"],
  ["/encounters", "Encounters"],
  ["/prescriptions", "Prescriptions"],
  ["/investigations", "Investigations"],
  ["/reports", "Reports"],
  ["/pregnancies", "Pregnancy"],
  ["/ultrasound", "OB Ultrasounds"],
  ["/billing", "Billing"],
  ["/ai-drafts", "AI Drafts"]
];

const displayKeys = [
  "medicalRecordNumber",
  "firstName",
  "lastName",
  "status",
  "appointmentType",
  "queueNumber",
  "title",
  "category",
  "invoiceNumber",
  "totalAmount",
  "method",
  "amount",
  "draftType",
  "modelProvider",
  "modelName"
];

export function MvpPage({
  title,
  eyebrow,
  items,
  endpoint,
  collectionKey,
  createEndpoint,
  createFields = [],
  createNote
}: MvpPageProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState("Not loaded");
  const [error, setError] = useState("");
  const [formState, setFormState] = useState<Record<string, string>>(() =>
    Object.fromEntries(createFields.map((field) => [field.name, field.defaultValue ?? ""]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("prijClinicToken");
  }, []);

  useEffect(() => {
    if (!endpoint) return;
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  async function loadRows() {
    setError("");
    setStatus("Loading");

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      });

      if (response.status === 401) {
        setStatus("Login required");
        setRows([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const collection = collectionKey ? data[collectionKey] : data;
      setRows(Array.isArray(collection) ? (collection as Record<string, unknown>[]) : [data]);
      setStatus("Loaded");
    } catch (loadError) {
      setRows([]);
      setStatus("API unavailable");
      setError(loadError instanceof Error ? loadError.message : "Unable to reach local API.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createEndpoint) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}${createEndpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(buildPayload(createFields, formState))
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API returned ${response.status}`);
      }

      setFormState(Object.fromEntries(createFields.map((field) => [field.name, field.defaultValue ?? ""])));
      await loadRows();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save demo record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <nav className="nav-links" aria-label="V0.1 navigation">
          {links.map(([href, label]) => (
            <a key={href} className="button secondary" href={href}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="notice">
        V0.1 local/private pilot only. Use demo data only. Do not enter real patient, payment, report, credential, or secret data.
      </section>

      <section className="workflow-band" aria-label="End-to-end workflow">
        {["Login", "Patient", "Appointment", "Queue", "Encounter", "Rx", "Orders", "OB/Report", "Billing", "Audit", "AI draft"].map(
          (step) => (
            <span key={step}>{step}</span>
          )
        )}
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Module scope</h2>
          <ul className="feature-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Local API data</h2>
            {endpoint ? (
              <button className="button secondary compact" onClick={loadRows} type="button">
                Refresh
              </button>
            ) : null}
          </div>
          <p className="muted">Status: {status}</p>
          {error ? <p className="form-error">{error}</p> : null}
          {endpoint ? <DataList rows={rows} /> : <p className="empty-state">No API list is configured for this page.</p>}
        </div>
      </section>

      {createEndpoint && createFields.length > 0 ? (
        <section className="panel">
          <h2>Safe demo form</h2>
          {createNote ? <p className="muted">{createNote}</p> : null}
          <form className="form-grid" onSubmit={submit}>
            {createFields.map((field) => (
              <label key={field.name}>
                {field.label}
                <input
                  name={field.name}
                  onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                  type={field.type ?? "text"}
                  value={formState[field.name] ?? ""}
                />
              </label>
            ))}
            <button className="button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving" : "Create demo record"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="empty-state">
        Production workflows, file uploads, real payment gateways, diagnostic automation, and external AI calls are intentionally not enabled.
      </section>
    </main>
  );
}

function DataList({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <p className="empty-state">No demo rows returned yet.</p>;
  }

  return (
    <div className="data-list">
      {rows.slice(0, 12).map((row, index) => (
        <article className="data-row" key={String(row.id ?? index)}>
          <strong>{rowLabel(row)}</strong>
          <dl>
            {displayKeys
              .filter((key) => row[key] !== undefined && row[key] !== null && row[key] !== "")
              .slice(0, 5)
              .map((key) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(row[key])}</dd>
                </div>
              ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function rowLabel(row: Record<string, unknown>) {
  return String(row.displayName ?? row.invoiceNumber ?? row.title ?? row.medicalRecordNumber ?? row.id ?? "Demo row");
}

function buildPayload(fields: Field[], state: Record<string, string>) {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const value = state[field.name]?.trim();
    if (!value) continue;
    if (field.type === "number") payload[field.name] = Number(value);
    else if (field.type === "datetime-local") payload[field.name] = new Date(value).toISOString();
    else payload[field.name] = value;
  }

  return payload;
}
