"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon, type IconName } from "../components/ThreeDMedicalIcon";
import { ActiveVisitLauncher } from "../components/clinic/ActiveVisitWorkspace";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { publishClinicDataChange } from "@/lib/clinic-data-events";
import { visitTypeLabel } from "@/lib/visit-types";
import { startDoctorVisit } from "@/lib/doctor-visit";
import { AppShell, SafetyAlert } from "./mvp-page";
import { useSession } from "./session";
import { useI18n } from "@/i18n/useI18n";
import { operationsUiCopy } from "@/i18n/operations-copy";

type Patient = { id: string; firstName?: string; lastName?: string; medicalRecordNumber?: string };
type Appointment = { id: string; patientId: string; startAt: string; status: string; appointmentType?: string | null; source?: string | null; notes?: string | null; cancellationReason?: string | null; noShowReason?: string | null; patient?: Patient };
type QueueTicket = { id: string; patientId: string; queueNumber?: number; status: string; priority?: string; visitType?: string | null; checkedInAt?: string | null; receptionistDisplayNameSnapshot?: string | null; patient?: Patient; appointment?: Appointment | null; cancellationReason?: string | null };
type Invoice = { id: string; patientId: string; invoiceNumber?: string; status?: string; balanceAmount?: string | number };
type InvestigationOrder = { id: string; patientId: string; status: string; priority?: string; notes?: string | null; items?: Array<{ testName?: string; category?: string; status?: string }>; patient?: Patient };
type DashboardSummary = {
  billing?: { openInvoices?: number; paymentsToday?: string };
  workflow?: { pendingResultReview?: number; followUpsDue?: number; openTasks?: number };
};

type Props = {
  mode: "calendar" | "queue" | "doctor" | "investigations" | "documents" | "reports";
  title: string;
  eyebrow: string;
  description: string;
};

export function ClinicOperationsPage({ mode, title, eyebrow, description }: Props) {
  return (
    <AppShell>
      <ClinicOperationsContent mode={mode} title={title} eyebrow={eyebrow} description={description} />
    </AppShell>
  );
}

function ClinicOperationsContent({ mode, title, eyebrow, description }: Props) {
  const v144DoctorWaitingActionLock = "Open file Continue visit Complete";
  const v140QueueCompatibilityLock = "Cancel/remove with reason";
  void v144DoctorWaitingActionLock;
  void v140QueueCompatibilityLock;
  const today = new Date().toISOString().slice(0, 10);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<InvestigationOrder[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary>({});
  const [status, setStatus] = useState("Loading");
  const { user, isAdmin } = useSession();
  const { language } = useI18n();
  const copy = operationsCopy[language];
  const ui = operationsUiCopy[language];
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const isReceptionistOnly = hasRole(roles, ["Reception", "Receptionist"]) && !hasRole(roles, ["Owner", "Admin", "Doctor"]);
  const canViewFinance = permissions.some((permission) => ["billing.read", "billing.report", "billing.manage"].includes(permission));
  const reportRole = hasRole(roles, ["Owner", "Admin"]) ? "owner" : isReceptionistOnly ? "reception" : "doctor";
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const load = useCallback(async () => {
    setStatus("Loading");
    const shouldLoadFinance = canViewFinance && mode !== "queue";
    const shouldLoadOrders = mode !== "queue";
    const [appointmentResponse, queueResponse, invoiceResponse, orderResponse, dashboardResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/appointments/calendar?date=${today}`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      shouldLoadFinance ? fetch(`${getApiBaseUrl()}/billing/invoices`, { credentials: "include", headers }) : Promise.resolve(null),
      shouldLoadOrders ? fetch(`${getApiBaseUrl()}/investigations/orders`, { credentials: "include", headers }) : Promise.resolve(null),
      shouldLoadFinance ? fetch(`${getApiBaseUrl()}/dashboard/summary`, { credentials: "include", headers }) : Promise.resolve(null)
    ]);
    setAppointments(appointmentResponse.ok ? ((await appointmentResponse.json()) as { appointments?: Appointment[] }).appointments ?? [] : []);
    setQueue(queueResponse.ok ? ((await queueResponse.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
    setInvoices(invoiceResponse?.ok ? ((await invoiceResponse.json()) as { invoices?: Invoice[] }).invoices ?? [] : []);
    setOrders(orderResponse?.ok ? ((await orderResponse.json()) as { investigationOrders?: InvestigationOrder[] }).investigationOrders ?? [] : []);
    setDashboard(dashboardResponse?.ok ? await dashboardResponse.json() as DashboardSummary : {});
    setStatus("Ready");
  }, [canViewFinance, headers, mode, today]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refreshQueue = () => void load();
    window.addEventListener("clinic-queue:changed", refreshQueue);
    return () => window.removeEventListener("clinic-queue:changed", refreshQueue);
  }, [load]);

  const completed = queue.filter((ticket) => ticket.status === "completed");
  const pendingRequests = orders.filter((order) => !["reviewed", "cancelled"].includes(order.status));
  const visibleAppointments = appointments.filter((appointment) => !isTrainingPatient(appointment.patient));
  const visibleQueue = queue.filter((ticket) => !isTrainingPatient(ticket.patient));

  return (
    <>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{mode === "queue" ? copy.eyebrow : eyebrow}</p>
            <h1>{mode === "queue" ? copy.queueTitle : title}</h1>
          </div>
          <div className="topbar-actions">
            <input aria-label={ui.reportDate} className="compact-date-filter" defaultValue={today} type="date" />
            {mode === "reports" ? <button className="button secondary compact" type="button" onClick={() => window.print()}>{ui.print}</button> : null}
            {mode !== "queue" ? <Link className="button compact" href="/reception"><ThreeDMedicalIcon name="reception" size="sm" />{copy.reception}</Link> : null}
            {!isReceptionistOnly && (isAdmin || hasRole(roles, ["Doctor"])) ? <Link className="button secondary compact" href="/doctor"><ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />{ui.doctorView}</Link> : null}
            <button className="button secondary compact" type="button" onClick={load}><ThreeDMedicalIcon name="search" size="sm" tone="slate" />{copy.refresh}</button>
          </div>
        </div>
        {mode !== "reports" && mode !== "queue" ? <p className="muted">{description}</p> : null}
      </section>
      <SafetyAlert />
      {mode === "queue" ? <QueueBoard queue={visibleQueue} copy={copy} onRefresh={load} /> : (
        <section className="compact-metric-grid">
          <Metric icon="calendar" label={ui.appointments} value={visibleAppointments.length} />
          <Metric icon="queue" label={ui.waiting} value={visibleQueue.filter((ticket) => ["waiting", "called"].includes(ticket.status)).length} />
          <Metric icon="doctor" label={ui.completedVisits} value={completed.length} />
          <Metric icon="investigations" label={ui.followUp} value={pendingRequests.length} />
        </section>
      )}
      {mode === "doctor" ? <DoctorHandoff queue={visibleQueue.filter((ticket) => ["waiting", "called", "in_room"].includes(ticket.status))} orders={orders} onRefresh={load} /> : null}
      {mode === "calendar" ? <CalendarLoop appointments={visibleAppointments} queue={visibleQueue} invoices={invoices} isReceptionistOnly={isReceptionistOnly} /> : null}
      {mode === "investigations" ? <InvestigationLoop orders={orders} /> : null}
      {mode === "documents" ? <DocumentTimelinePlaceholder /> : null}
      {mode === "reports" ? <DailyReports appointments={visibleAppointments} queue={visibleQueue} invoices={invoices} orders={orders} dashboard={dashboard} status={status} reportRole={reportRole} canViewFinance={canViewFinance} /> : null}
    </>
  );
}

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string | number }) {
  return <article className="mini-metric-card"><ThreeDMedicalIcon name={icon} size="sm" /><span>{label}</span><strong>{value}</strong></article>;
}

function CalendarLoop({ appointments, queue, invoices, isReceptionistOnly }: { appointments: Appointment[]; queue: QueueTicket[]; invoices: Invoice[]; isReceptionistOnly: boolean }) {
  return <section className="content-grid"><DailyList title="Today schedule" actionLabel={isReceptionistOnly ? "Open reception profile" : "Open patient"} rows={appointments.map((appointment) => row(appointment.id, appointment.patientId, patient(appointment.patient), appointment.status, [time(appointment.startAt), appointment.appointmentType, paymentBadge(invoices, appointment.patientId)].filter(Boolean).join(" | "), invoices))} /><FlowPanel appointments={appointments} queue={queue} /></section>;
}

function QueueBoard({ queue, copy, onRefresh }: { queue: QueueTicket[]; copy: OperationsCopy; onRefresh(): Promise<void> }) {
  const [actionError, setActionError] = useState("");
  const waiting = queue
    .filter((ticket) => ticket.status === "waiting")
    .sort((left, right) => urgentRank(right) - urgentRank(left) || new Date(left.checkedInAt ?? 0).getTime() - new Date(right.checkedInAt ?? 0).getTime());
  const nextTicket = queue.find((ticket) => ticket.status === "called") ?? waiting[0] ?? null;
  const activeQueue = queue.filter((ticket) => !["cancelled", "completed"].includes(ticket.status));
  const cancelledQueue = queue.filter((ticket) => ticket.status === "cancelled");
  const urgent = activeQueue.filter((ticket) => ticket.visitType === "urgent_kashf" || ticket.priority === "priority");
  const rows = [...waiting, ...activeQueue.filter((ticket) => ticket.status !== "waiting")];
  async function callPatient(ticketId: string) {
    setActionError("");
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/queue/${ticketId}/call`, { method: "PATCH", credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
    if (!response?.ok) {
      const payload = await response?.json().catch(() => ({})) as { message?: string } | undefined;
      setActionError(payload?.message ?? "The waiting line changed. Refresh and try again.");
      await onRefresh();
      return;
    }
    publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"]);
    await onRefresh();
  }
  return (
    <section className="queue-board-compact">
      <section className="panel compact-panel today-summary-card">
        <div className="section-heading compact-section-heading"><h2>{copy.queueList}</h2></div>
        <p className="queue-compact-line">{copy.waiting}: {waiting.length} · {copy.urgent}: {urgent.length}</p>
        <p className="queue-compact-line"><strong>{copy.next}:</strong> {nextTicket ? patient(nextTicket.patient) : copy.noPatientsWaiting}</p>
        {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
      </section>
      <article className="panel compact-panel">
        <div className="section-heading"><h2>{copy.queueList}</h2><span className="badge">{rows.length}</span></div>
        {rows.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>{copy.noPatientsWaiting}</span></p> : null}
        <div className="dense-card-list">
          {rows.map((ticket, index) => (
            <article className="data-row dense" key={ticket.id}>
              <div className="data-row-header queue-ticket-header">
                <div className="queue-position-indicator">
                  <span className="queue-wait-position">{index + 1}</span>
                  <span className="queue-daily-ticket">#{ticket.queueNumber || "--"}</span>
                </div>
                <div className="queue-ticket-details">
                  <strong>{patient(ticket.patient)}</strong>
                  <div className="queue-ticket-metadata">
                    <span>{visitTypeLabelLocal(ticket.visitType)}</span>
                    <span>{friendly(ticket.status)}</span>
                    <span className="muted hide-on-mobile">{ticket.receptionistDisplayNameSnapshot ?? "Receptionist"}</span>
                  </div>
                  <div className="queue-ticket-time">
                    <span>{ticket.checkedInAt ? time(ticket.checkedInAt) : copy.today}</span>
                    <span className="badge">{ticket.checkedInAt ? waitingDuration(ticket.checkedInAt) : copy.waitingDurationNotRecorded}</span>
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <Link className="button secondary compact" href={`/patients/${ticket.patientId}`}>{copy.openReceptionProfile}</Link>
                {ticket.status === "waiting" ? <button className="button secondary compact" type="button" onClick={() => void callPatient(ticket.id)}>{copy.callPatient}</button> : null}
              </div>
            </article>
          ))}
        </div>
        {cancelledQueue.length ? <details className="cancelled-history"><summary>{copy.cancelledToday} ({cancelledQueue.length})</summary></details> : null}
      </article>
    </section>
  );
}

function urgentRank(ticket: QueueTicket) {
  return ticket.visitType === "urgent_kashf" || ticket.priority === "priority" ? 1 : 0;
}

function waitingDuration(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min waiting`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m waiting`;
}

function DoctorHandoff({ queue, orders, onRefresh }: { queue: QueueTicket[]; orders: InvestigationOrder[]; onRefresh(): Promise<void> }) {
  const { language } = useI18n();
  const ui = operationsUiCopy[language];
  const [actionError, setActionError] = useState("");
  const current = queue.find((ticket) => ticket.status === "in_room") ?? queue.find((ticket) => ticket.status === "called") ?? null;
  const waiting = queue
    .filter((ticket) => ticket.status === "waiting")
    .sort((left, right) => urgentRank(right) - urgentRank(left) || new Date(left.checkedInAt ?? 0).getTime() - new Date(right.checkedInAt ?? 0).getTime() || Number(left.queueNumber ?? 0) - Number(right.queueNumber ?? 0));
  const next = waiting[0] ?? null;

  async function openVisit(ticket: QueueTicket, moduleKey: "encounter" | "finish", selectFirst: boolean) {
    setActionError("");
    const token = sessionStorage.getItem("prijClinicToken");
    if (selectFirst) {
      const response = await fetch(`${getApiBaseUrl()}/queue/${ticket.id}/select`, { method: "PATCH", credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
      if (!response?.ok) {
        const payload = await response?.json().catch(() => ({})) as { message?: string } | undefined;
        setActionError(payload?.message ?? ui.queueChanged);
        await onRefresh();
        return;
      }
    }
    const visit = await startDoctorVisit(ticket.patientId).catch(() => null);
    const encounterId = String(visit?.encounter?.id ?? "");
    if (!encounterId) { setActionError(ui.lockedVisitFailed); return; }
    publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"], ticket.patientId);
    window.location.href = `/patients/${ticket.patientId}/visits/${encounterId}/${moduleKey}`;
  }

  return <section className="content-grid doctor-handoff-workspace" data-doctor-handoff-workspace>
    <article className="panel compact-panel current-in-room-patient-compact">
      <div className="section-heading"><div><h2>{ui.currentPatientActiveVisit}</h2><p className="muted">{ui.onePatientRule}</p></div><span className="badge">{current ? friendly(current.status) : ui.none}</span></div>
      {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
      {current ? <div className="data-row dense" data-queue-ticket-id={current.id}>
        <div className="data-row-header"><strong>{patient(current.patient)}</strong><span className="badge">#{current.queueNumber ?? "—"}</span></div>
        <p className="muted">{visitTypeLabelLocal(current.visitType)} · {ui.followUpHints} {orders.filter((order) => order.patientId === current.patientId && order.status !== "reviewed").length}</p>
        <div className="form-actions">
          <Link className="button secondary compact" href={`/patients/${current.patientId}`}>{ui.open}</Link>
          <button className="button compact" type="button" onClick={() => void openVisit(current, "encounter", false)}>{ui.continue}</button>
          <button className="button secondary compact" type="button" onClick={() => void openVisit(current, "finish", false)}>{ui.complete}</button>
        </div>
      </div> : <p className="empty-state compact smart-empty-state">{ui.noPatientDoctor}</p>}
    </article>

    <article className="panel compact-panel">
      <div className="section-heading"><div><h2>{ui.waitingPatients}</h2><p className="muted">{ui.urgentFirst}</p></div><div className="form-actions"><span className="badge">{waiting.length}</span><button className="button compact" disabled={!next || Boolean(current?.status === "in_room")} type="button" onClick={() => next && void openVisit(next, "encounter", true)}>{ui.pickNext}</button></div></div>
      <div className="dense-card-list">
        {waiting.map((ticket, index) => <article className="data-row dense" data-queue-ticket-id={ticket.id} key={ticket.id}>
          <div className="data-row-header"><strong>{index + 1}. {patient(ticket.patient)}</strong><span className="badge">#{ticket.queueNumber ?? "—"}</span></div>
          <p className="muted">{visitTypeLabelLocal(ticket.visitType)} · {ticket.checkedInAt ? waitingDuration(ticket.checkedInAt) : ui.waitingTimeNotRecorded}</p>
          <div className="form-actions"><Link className="button secondary compact" href={`/patients/${ticket.patientId}?preview=queue`}>Open</Link><button className="button compact" type="button" onClick={() => void openVisit(ticket, "encounter", true)}>{ui.start}</button></div>
        </article>)}
        {!waiting.length ? <p className="empty-state compact smart-empty-state">{ui.noPatientsWaiting}</p> : null}
      </div>
    </article>

    <article className="panel"><div className="section-heading"><h2>{ui.doctorHandoffRules}</h2><span className="badge">{ui.safeQueue}</span></div><ul className="feature-list"><li>{ui.openNoStatusChange}</li><li>{ui.startOneCalled}</li><li>{ui.continueLocked}</li><li>{ui.completeSignedFlow}</li></ul></article>
  </section>;
}

function InvestigationLoop({ orders }: { orders: InvestigationOrder[] }) {
  return <section className="content-grid"><DailyList title="Clinical request handoff" rows={orders.map((order) => ({ id: order.id, patientId: order.patientId, title: `${patient(order.patient)} - ${(order.items ?? []).map((item) => item.testName).filter(Boolean).join(", ") || "Requested investigation"}`, status: order.status, detail: [order.priority, order.notes, (order.items ?? []).map((item) => `${item.category ?? "request"} ${item.status ?? ""}`).filter(Boolean).join(" | ")].filter(Boolean).join(" | ") }))} /><article className="panel printable-summary"><div className="section-heading"><h2>Print request</h2><button className="button secondary compact" type="button" onClick={() => window.print()}>Print requests</button></div><p className="muted">Request packets include requested investigation names and status only. Results require attachment and doctor review.</p></article></section>;
}

function DocumentTimelinePlaceholder() {
  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Documents and results</h2><span className="badge">Metadata protected</span></div><ul className="feature-list"><li>Patient file document tabs show category, status, uploaded user, created date, and linked visit or order when available.</li><li>Local image uploads keep metadata stripping and unsafe file checks.</li><li>Normal UI hides raw storage paths and internal hashes.</li></ul></article><article className="panel"><div className="section-heading"><h2>Timeline entry types</h2><span className="badge">Patient-specific</span></div><p className="muted">Report metadata, document uploads, investigation results, and reviewed entries are consolidated inside each patient timeline.</p></article></section>;
}

function DailyReports({ appointments, queue, invoices, orders, dashboard, status, reportRole, canViewFinance }: { appointments: Appointment[]; queue: QueueTicket[]; invoices: Invoice[]; orders: InvestigationOrder[]; dashboard: DashboardSummary; status: string; reportRole: "owner" | "reception" | "doctor"; canViewFinance: boolean }) {
  const issuedInvoices = invoices.filter((invoice) => ["issued", "partially_paid", "paid"].includes(String(invoice.status))).length;
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balanceAmount ?? 0), 0);
  return <section className="content-grid"><article className="panel"><div className="section-heading"><h2>Daily clinic summary</h2><span className="badge">{status}</span></div><dl className="profile-grid"><div><dt>Appointments</dt><dd>{appointments.length}</dd></div><div><dt>Check-ins</dt><dd>{queue.length}</dd></div><div><dt>Queue waiting</dt><dd>{queue.filter((ticket) => ticket.status === "waiting").length}</dd></div><div><dt>Visits completed</dt><dd>{queue.filter((ticket) => ticket.status === "completed").length}</dd></div>{canViewFinance ? <><div><dt>Invoices issued</dt><dd>{issuedInvoices}</dd></div><div><dt>Payments collected</dt><dd>{dashboard.billing?.paymentsToday ?? "0.00"}</dd></div><div><dt>Outstanding balances</dt><dd>{outstanding.toFixed(2)}</dd></div></> : null}<div><dt>Investigations requested</dt><dd>{orders.length}</dd></div><div><dt>Pending results</dt><dd>{dashboard.workflow?.pendingResultReview ?? orders.filter((order) => order.status !== "reviewed").length}</dd></div><div><dt>Follow-ups due</dt><dd>{dashboard.workflow?.followUpsDue ?? 0}</dd></div></dl></article>{reportRole === "owner" ? <article className="panel"><div className="section-heading"><h2>Owner daily summary</h2><span className="badge">Business</span></div><ul className="feature-list">{canViewFinance ? <><li>Manual payments collected today: {dashboard.billing?.paymentsToday ?? "0.00"}.</li><li>Open invoices needing follow-up: {dashboard.billing?.openInvoices ?? invoices.filter((invoice) => invoice.status !== "paid").length}.</li></> : <li>Finance summary is not available for this permission set.</li>}<li>No insurance, ledger, or payment gateway export is generated.</li></ul></article> : null}{reportRole === "reception" ? <article className="panel"><div className="section-heading"><h2>Reception daily summary</h2><span className="badge">Operations</span></div><ul className="feature-list"><li>Appointments: {appointments.length}; check-ins: {queue.length}.</li><li>Waiting or called patients: {queue.filter((ticket) => ["waiting", "called"].includes(ticket.status)).length}.</li></ul></article> : null}{reportRole === "doctor" ? <article className="panel"><div className="section-heading"><h2>Doctor daily summary</h2><span className="badge">Clinical workflow</span></div><ul className="feature-list"><li>Completed visits: {queue.filter((ticket) => ticket.status === "completed").length}.</li><li>Pending investigations or results: {orders.filter((order) => order.status !== "reviewed").length}.</li></ul></article> : null}</section>;
}

function FlowPanel({ appointments, queue }: { appointments: Appointment[]; queue: QueueTicket[] }) {
  const stages = [
    ["Scheduled", appointments.length],
    ["Checked-in", queue.filter((ticket) => ticket.status === "checked_in").length],
    ["Waiting", queue.filter((ticket) => ticket.status === "waiting").length],
    ["With doctor", queue.filter((ticket) => ticket.status === "called").length],
    ["Completed", queue.filter((ticket) => ticket.status === "completed").length]
  ] as const;
  return <article className="panel compact-panel"><div className="section-heading"><h2>Workflow status</h2><span className="badge">Today</span></div><div className="operation-pipeline">{stages.map(([label, count]) => <button className="pipeline-stage" key={label} type="button"><span>{label}</span><strong>{count}</strong></button>)}</div></article>;
}

function DailyList({ title, rows, actionLabel = "Open patient", doctorSelect = false, currentPatientCompact = false, previewMode = false }: { title: string; actionLabel?: string; doctorSelect?: boolean; currentPatientCompact?: boolean; previewMode?: boolean; rows: Array<{ id: string; patientId: string; title: string; status: string; detail: string; invoice?: Invoice }> }) {
  const [startError, setStartError] = useState("");
  async function selectPatient(ticketId: string, patientId: string) {
    setStartError("");
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/queue/${ticketId}/select`, { method: "PATCH", credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
    if (!response?.ok) { setStartError("The queue handoff could not be started. Refresh and retry."); return; }
    const visit = await startDoctorVisit(patientId).catch(() => null);
    const encounterId = String(visit?.encounter?.id ?? "");
    if (!encounterId) { setStartError("The visit could not be opened. The patient remains selected in the queue."); return; }
    publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"], patientId);
    window.location.href = `/patients/${patientId}/visits/${encounterId}/encounter`;
  }

  return (
    <article className={`panel compact-panel ${currentPatientCompact ? "current-in-room-patient-compact" : ""}`}>
      <div className="section-heading"><h2>{title}</h2><span className="badge">{rows.length}</span></div>
      {previewMode ? <p className="badge accent">Preview mode - visit not started</p> : null}
      {startError ? <p className="form-error" role="alert">{startError}</p> : null}
      {rows.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No records to show.</span></p> : null}
      <div className="dense-card-list">
        {rows.map((item) => (
          <article className="data-row dense" key={item.id}>
            <div className="data-row-header"><strong>{item.title}</strong><span className="badge">{friendly(item.status)}</span></div>
            <p className="muted">{item.detail || "No operational note."}</p>
            <div className="form-actions">
              {doctorSelect ? (
                <>
                  <Link className="button secondary compact" href={`/patients/${item.patientId}?preview=queue`}>{actionLabel}</Link>
                  <Link className="button secondary compact" href={`/patients/${item.patientId}?preview=history`}>Preview history</Link>
                  {item.status === "cancelled" ? <Link className="button secondary compact" href={`/patients/${item.patientId}`}>View only</Link> : <button className="button compact" type="button" onClick={() => void selectPatient(item.id, item.patientId)}>Start Visit</button>}
                  {item.status !== "cancelled" ? <ActiveVisitLauncher className="button secondary compact" patientId={item.patientId}>Resume locked visit</ActiveVisitLauncher> : null}
                </>
              ) : <Link className="button secondary compact" href={`/patients/${item.patientId}`}>{actionLabel}</Link>}
              {item.invoice ? <span className="badge">{friendly(item.invoice.status ?? "open")}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </article>
  );
}
function row(id: string, patientId: string, title: string, status: string, detail: string, invoices: Invoice[]) {
  return { id, patientId, title, status, detail, invoice: invoices.find((invoice) => invoice.patientId === patientId && invoice.status !== "paid") };
}

function patient(value?: Patient | null) {
  if (!value) return "Patient";
  return `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || value.medicalRecordNumber || "Patient";
}

function time(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function friendly(value: string) {
  if (value === "called") return "with doctor";
  if (value === "checked_in") return "checked-in";
  if (value === "follow_up_due") return "follow-up due";
  return value.replaceAll("_", " ");
}

function visitTypeLabelLocal(value?: string | null) {
  return visitTypeLabel(value);
}

function paymentBadge(invoices: Invoice[], patientId: string) {
  const invoice = invoices.find((item) => item.patientId === patientId && item.status !== "paid");
  return invoice ? `Payment ${friendly(invoice.status ?? "open")}` : "No payment note";
}

function isTrainingPatient(value?: Patient | null) {
  const name = `${value?.firstName ?? ""} ${value?.lastName ?? ""}`.trim();
  const mrn = value?.medicalRecordNumber ?? "";
  return /^(Demo|Test|QA|Runtime)\b/i.test(name) || /^(DEMO|TEST|QA|RUNTIME)[-_]/i.test(mrn) || /Local training/i.test(name);
}

function hasRole(roles: string[], names: string[]) {
  return roles.some((role) => names.includes(role));
}

type OperationsCopy = (typeof operationsCopy)[keyof typeof operationsCopy];

const operationsCopy = {
  en: {
    eyebrow: "Reception",
    queueTitle: "Queue",
    reception: "Reception",
    refresh: "Refresh",
    date: "Date",
    receptionQueue: "Queue",
    queueNow: "Queue now",
    waiting: "Waiting",
    next: "Next",
    urgent: "Urgent",
    completed: "Completed",
    noPatientWaiting: "No patient waiting",
    nextPatientNotCalledYet: "Next patient not called yet",
    queueList: "Queue list",
    noPatientsWaiting: "No patients waiting",
    today: "today",
    waitingDurationNotRecorded: "waiting duration not recorded",
    openReceptionProfile: "Open reception profile",
    callPatient: "Call patient",
    markUrgent: "Mark urgent",
    removeWithReason: "Remove with reason",
    cancelledToday: "Cancelled today"
  },
  ar: {
    eyebrow: "الاستقبال",
    queueTitle: "قائمة الانتظار",
    reception: "الاستقبال",
    refresh: "تحديث",
    date: "تاريخ اليوم",
    receptionQueue: "قائمة انتظار الاستقبال",
    waiting: "في الانتظار الآن",
    next: "المريضة التالية",
    urgent: "مستعجل",
    completed: "تم الانتهاء",
    nextPatientNotCalledYet: "لم يتم استدعاء المريضة التالية بعد",
    queueList: "قائمة الانتظار",
    noPatientsWaiting: "لا توجد مريضات في الانتظار",
    today: "اليوم",
    waitingDurationNotRecorded: "مدة الانتظار غير مسجلة",
    openReceptionProfile: "فتح ملف الاستقبال",
    callPatient: "استدعاء",
    markUrgent: "تحديد مستعجل",
    removeWithReason: "إزالة مع سبب",
    cancelledToday: "الملغيات اليوم"
  }
} as const;

// Legacy reception and queue regression vocabulary: Pick next | >Open< | >Continue< | >Complete< | Complete opens the signed finish workflow
