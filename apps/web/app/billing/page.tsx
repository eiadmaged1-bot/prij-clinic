"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../mvp-page";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  amountPaid: string;
  balanceAmount: string;
  discountAmount?: string;
  patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string };
};

type Payment = {
  id: string;
  method: string;
  status: string;
  amount: string;
  paidAt: string;
  invoice?: { invoiceNumber?: string };
};

type ServiceItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: string;
  currency: string;
  active: boolean;
};

type Closing = {
  date: string;
  summary: Record<string, string>;
  print?: { exportPlaceholder?: string };
};

type FinanceReports = {
  revenueSummary?: Record<string, string>;
  paymentsByMethod?: Record<string, string>;
  unpaidInvoices?: Invoice[];
  discounts?: Invoice[];
  refundsAndVoids?: { refunds?: Payment[]; voids?: Invoice[] };
  serviceRevenue?: Array<{ serviceItemId: string; code: string; name: string; category: string; revenue: string; quantity: number }>;
  doctorSharePlaceholder?: Array<{ service: string; placeholderAmount?: string | null }>;
  print?: { exportPlaceholder?: string };
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [closing, setClosing] = useState<Closing | null>(null);
  const [reports, setReports] = useState<FinanceReports | null>(null);
  const [statement, setStatement] = useState<Record<string, unknown> | null>(null);
  const [patientId, setPatientId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = useMemo(() => (typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken")), []);
  const headers = useMemo(() => ({ "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }), [token]);

  useEffect(() => {
    void loadFinance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFinance() {
    setError("");
    try {
      const [invoiceResponse, paymentResponse, serviceResponse, closingResponse, reportResponse] = await Promise.all([
        fetch(`${apiUrl}/billing/invoices`, { credentials: "include", headers }),
        fetch(`${apiUrl}/billing/payments`, { credentials: "include", headers }),
        fetch(`${apiUrl}/billing/services`, { credentials: "include", headers }),
        fetch(`${apiUrl}/billing/daily-closing`, { credentials: "include", headers }),
        fetch(`${apiUrl}/billing/reports/finance`, { credentials: "include", headers })
      ]);

      if ([invoiceResponse, paymentResponse, serviceResponse].some((response) => response.status === 401)) {
        throw new Error("Sign in before opening finance.");
      }
      if ([invoiceResponse, paymentResponse, serviceResponse].some((response) => response.status === 403)) {
        throw new Error("Finance access is limited to authorized staff.");
      }

      setInvoices(((await invoiceResponse.json()) as { invoices?: Invoice[] }).invoices ?? []);
      setPayments(((await paymentResponse.json()) as { payments?: Payment[] }).payments ?? []);
      setServices(((await serviceResponse.json()) as { services?: ServiceItem[] }).services ?? []);
      if (closingResponse.ok) setClosing((await closingResponse.json()) as Closing);
      if (reportResponse.ok) setReports((await reportResponse.json()) as FinanceReports);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load finance.");
    }
  }

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const serviceItemId = String(form.get("serviceItemId") ?? "");
    const manualName = String(form.get("description") ?? "").trim();
    const patient = String(form.get("patientId") ?? "").trim();
    const discountAmount = Number(form.get("discountAmount") || 0);
    const payload = {
      patientId: patient,
      discountAmount,
      discountReason: String(form.get("discountReason") ?? "").trim() || undefined,
      notes: "Manual MVP invoice. No payment gateway.",
      items: [
        serviceItemId
          ? { serviceItemId, quantity: Number(form.get("quantity") || 1) }
          : { description: manualName, quantity: Number(form.get("quantity") || 1), unitAmount: Number(form.get("unitAmount") || 0) }
      ]
    };
    await post("/billing/invoices", payload, "Invoice saved.");
    event.currentTarget.reset();
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await post(
      "/billing/payments",
      {
        invoiceId: String(form.get("invoiceId") ?? ""),
        method: String(form.get("method") ?? "cash"),
        amount: Number(form.get("amount") || 0),
        referenceNote: String(form.get("referenceNote") ?? "").trim() || undefined
      },
      "Payment recorded."
    );
    event.currentTarget.reset();
  }

  async function loadStatement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const response = await fetch(`${apiUrl}/billing/patients/${patientId}/statement`, { credentials: "include", headers });
    if (!response.ok) {
      setError("Could not open patient statement. Check the patient file and your access.");
      return;
    }
    setStatement((await response.json()) as Record<string, unknown>);
  }

  async function post(path: string, payload: Record<string, unknown>, success: string) {
    setMessage("");
    setError("");
    const response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      setError("Could not save this finance action. Check permissions and required reason fields.");
      return;
    }
    setMessage(success);
    await loadFinance();
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Finance</p>
            <h1>Invoices, Payments, and Daily Closing</h1>
          </div>
          <div className="topbar-actions">
            <button className="button secondary compact" type="button" onClick={() => window.print()}>
              <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
              Print
            </button>
            <span className="badge warning">Manual payments only</span>
          </div>
        </div>
        <p className="muted">Record clinic invoices and payments manually. No card data, payment tokens, gateway secrets, or real patient data.</p>
      </section>

      <SafetyAlert />
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="success-message">{message}</p> : null}

      <section className="summary-grid">
        <Metric label="Collected today" value={moneyLabel(closing?.summary?.totalCollected)} />
        <Metric label="Cash" value={moneyLabel(closing?.summary?.cash)} />
        <Metric label="Refunds" value={moneyLabel(closing?.summary?.refunds)} />
        <Metric label="Open balances" value={moneyLabel(reports?.revenueSummary?.outstanding)} />
      </section>

      <section className="dashboard-grid">
        <FinanceForm title="Create invoice" onSubmit={createInvoice}>
          <label>Patient ID<input name="patientId" required /></label>
          <label>
            Service catalog
            <select name="serviceItemId">
              <option value="">Manual line</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name} - {service.price} {service.currency}</option>
              ))}
            </select>
          </label>
          <label>Manual service<input name="description" placeholder="Use when no catalog service is selected" /></label>
          <label>Manual price<input name="unitAmount" min="0" step="0.01" type="number" /></label>
          <label>Quantity<input name="quantity" defaultValue="1" min="1" type="number" /></label>
          <label>Discount<input name="discountAmount" min="0" step="0.01" type="number" /></label>
          <label className="wide">Discount reason<input name="discountReason" /></label>
          <button className="button wide" type="submit">Create invoice</button>
        </FinanceForm>

        <FinanceForm title="Record payment" onSubmit={recordPayment}>
          <label>
            Invoice
            <select name="invoiceId" required>
              <option value="">Select invoice</option>
              {invoices.filter((invoice) => !["paid", "voided", "cancelled"].includes(invoice.status)).map((invoice) => (
                <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} - balance {invoice.balanceAmount}</option>
              ))}
            </select>
          </label>
          <label>
            Method
            <select name="method" defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="card">Card manual note</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile_wallet">Mobile wallet</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Amount<input name="amount" min="0.01" step="0.01" required type="number" /></label>
          <label className="wide">Reference note<input name="referenceNote" placeholder="No card numbers or secrets" /></label>
          <button className="button wide" type="submit">Record payment</button>
        </FinanceForm>
      </section>

      <section className="dashboard-grid">
        <FinanceList title="Invoices" rows={invoices} empty="No invoices yet. Create invoice from this page or the patient file." />
        <FinanceList title="Payments" rows={payments} empty="No payments recorded yet." />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <h2>Daily closing</h2>
              <p className="muted">Owner/Admin review of today&apos;s manual payment totals.</p>
            </div>
            <span className="badge">{closing?.date ?? "Today"}</span>
          </div>
          <ReportGrid data={closing?.summary} />
          <p className="empty-state">
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            <span>{closing?.print?.exportPlaceholder ?? "Export placeholder only. Use print for pilot review."}</span>
          </p>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <h2>Patient statement</h2>
              <p className="muted">Print-friendly invoices, payments, refunds, voids, and balance for one patient.</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={loadStatement}>
            <label className="wide">Patient ID<input value={patientId} onChange={(event) => setPatientId(event.target.value)} required /></label>
            <button className="button" type="submit">Open statement</button>
          </form>
          {statement ? <ReportGrid data={(statement.totals ?? {}) as Record<string, string>} /> : <p className="empty-state"><ThreeDMedicalIcon name="billing" size="sm" tone="slate" /><span>No statement opened yet.</span></p>}
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="section-heading">
            <h2>Owner finance reports</h2>
            <span className="badge accent">Review</span>
          </div>
          <ReportGrid data={reports?.revenueSummary} />
          <h3>Payments by method</h3>
          <ReportGrid data={reports?.paymentsByMethod} />
          <p className="empty-state">
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            <span>{reports?.print?.exportPlaceholder ?? "Export placeholder only."}</span>
          </p>
        </article>
        <article className="panel">
          <div className="section-heading">
            <h2>Service revenue</h2>
            <span className="badge">{reports?.serviceRevenue?.length ?? 0} service(s)</span>
          </div>
          <div className="data-list">
            {(reports?.serviceRevenue ?? []).slice(0, 8).map((row) => (
              <article className="data-row" key={row.serviceItemId}>
                <div className="data-row-header">
                  <strong>{row.name}</strong>
                  <span className="badge">{row.quantity} item(s)</span>
                </div>
                <p className="muted">{row.category} - {moneyLabel(row.revenue)}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}

function FinanceForm({ title, children, onSubmit }: { title: string; children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="badge accent">Audited</span>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>{children}</form>
    </section>
  );
}

function FinanceList({ title, rows, empty }: { title: string; rows: Array<Invoice | Payment>; empty: string }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="badge">{rows.length}</span>
      </div>
      {rows.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="billing" size="sm" tone="slate" /><span>{empty}</span></p> : null}
      <div className="data-list">
        {rows.slice(0, 10).map((row) => (
          <article className="data-row" key={row.id}>
            <div className="data-row-header">
              <strong>{"invoiceNumber" in row ? row.invoiceNumber : row.invoice?.invoiceNumber ?? row.method}</strong>
              <span className="badge">{row.status}</span>
            </div>
            <p className="muted">{"balanceAmount" in row ? `Total ${row.totalAmount} - balance ${row.balanceAmount}` : `${row.method} - ${row.amount}`}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className="muted">Manual finance total</p>
    </article>
  );
}

function ReportGrid({ data }: { data?: Record<string, string> }) {
  const entries = Object.entries(data ?? {});
  if (entries.length === 0) return <p className="empty-state"><ThreeDMedicalIcon name="reports" size="sm" tone="slate" /><span>No report data available yet.</span></p>;
  return (
    <dl className="profile-grid">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{labelize(key)}</dt>
          <dd>{moneyLabel(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function moneyLabel(value: unknown) {
  if (value === undefined || value === null || value === "") return "0.00";
  return String(value);
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
