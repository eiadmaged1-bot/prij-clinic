import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const write = (relativePath, content) => fs.writeFileSync(path.join(root, relativePath), content, "utf8");

function replaceOnce(relativePath, before, after) {
  const source = read(relativePath);
  if (!source.includes(before)) throw new Error(`Missing expected contract in ${relativePath}: ${before.slice(0, 140)}`);
  const next = source.replace(before, after);
  if (next === source) throw new Error(`Replacement made no change in ${relativePath}`);
  write(relativePath, next);
}

function replaceRange(relativePath, startMarker, endMarker, replacement) {
  const source = read(relativePath);
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing start marker in ${relativePath}: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing end marker in ${relativePath}: ${endMarker}`);
  write(relativePath, source.slice(0, start) + replacement + source.slice(end));
}

const shellPath = "apps/web/app/mvp-page.tsx";
replaceOnce(
  shellPath,
  "  const shellNavGroups = buildShellNavGroups({ roles, permissions, canOpenAdmin, canUseStaffChat, isOwnerAdmin, isDoctorOnly, isReceptionistOnly });",
  "  const shellNavGroups = isReceptionistOnly ? [] : buildShellNavGroups({ roles, permissions, canOpenAdmin, canUseStaffChat, isOwnerAdmin, isDoctorOnly, isReceptionistOnly });"
);
replaceOnce(
  shellPath,
  "    setSidebarCollapsed(isReceptionistOnly ? false : localStorage.getItem(\"prijSidebarCollapsed\") === \"true\");",
  "    setSidebarCollapsed(isReceptionistOnly ? true : localStorage.getItem(\"prijSidebarCollapsed\") === \"true\");"
);
replaceOnce(
  shellPath,
  '${isReceptionistOnly ? "receptionist-shell" : ""}`}',
  '${isReceptionistOnly ? "receptionist-shell no-sidebar" : ""}`}'
);
replaceOnce(
  shellPath,
  "      {user ? (\n        <>\n          <button\n            aria-label=\"Close navigation\"",
  "      {user && !isReceptionistOnly ? (\n        <>\n          <button\n            aria-label=\"Close navigation\""
);
replaceOnce(
  shellPath,
  "            {user ? (\n              <button\n                aria-controls=\"clinic-mobile-navigation\"",
  "            {user && !isReceptionistOnly ? (\n              <button\n                aria-controls=\"clinic-mobile-navigation\""
);
replaceOnce(shellPath, "          <UniversalSearchBox />", "          {!isReceptionistOnly ? <UniversalSearchBox /> : null}");
replaceOnce(
  shellPath,
  "          <UserMenu user={user} canOpenAdmin={canOpenAdmin} onLogout={signOut} />",
  `          {isReceptionistOnly ? (
            <div className="receptionist-topbar-actions" aria-label="Reception account actions">
              <Link className="button secondary compact" href="/reception"><ThreeDMedicalIcon name="reception" size="sm" />{t("home")}</Link>
              <LanguageSwitcher />
              <button className="button secondary compact" onClick={() => void signOut()} type="button"><ThreeDMedicalIcon name="settings" size="sm" tone="slate" />{t("logout")}</button>
            </div>
          ) : <UserMenu user={user} canOpenAdmin={canOpenAdmin} onLogout={signOut} />}`
);
replaceOnce(
  shellPath,
  '      {user && interfaceMode === "MINIMALISTIC" && (isDoctorOnly || isReceptionistOnly) ? <MobileBottomNav items={isDoctorOnly ? doctorMinimalisticNav : receptionistMinimalisticNav} /> : null}',
  '      {user && interfaceMode === "MINIMALISTIC" && isDoctorOnly ? <MobileBottomNav items={doctorMinimalisticNav} /> : null}'
);

write("apps/web/app/reception/page.tsx", `"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { patientLabel, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { receptionCopy } from "./reception-copy";

type QueueTicket = { id: string; patientId: string; queueNumber: number; status: string; priority?: string | null; visitType?: string | null; checkedInAt?: string | null; patient?: PatientPickerPatient | null };

export default function ReceptionHomePage() {
  const { language } = useI18n();
  const copy = receptionCopy[language];
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [error, setError] = useState("");

  const refreshQueue = useCallback(async () => {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(\`${getApiBaseUrl()}/queue/today\`, { credentials: "include", headers: token ? { authorization: \`Bearer \${token}\` } : undefined }).catch(() => null);
    if (!response?.ok) { setError(copy.queueUnavailable); return; }
    const body = await response.json() as { queueTickets?: QueueTicket[] };
    setQueue(body.queueTickets ?? []);
    setError("");
  }, [copy.queueUnavailable]);

  useEffect(() => {
    void refreshQueue();
    window.addEventListener("clinic-queue:changed", refreshQueue);
    return () => window.removeEventListener("clinic-queue:changed", refreshQueue);
  }, [refreshQueue]);

  const waiting = useMemo(() => queue
    .filter((ticket) => ticket.status === "waiting")
    .sort((left, right) => Number(right.visitType === "urgent_kashf" || right.priority === "priority") - Number(left.visitType === "urgent_kashf" || left.priority === "priority") || left.queueNumber - right.queueNumber), [queue]);
  const current = useMemo(() => queue.find((ticket) => ticket.status === "in_room") ?? queue.find((ticket) => ticket.status === "called") ?? null, [queue]);
  const nextWaiting = waiting[0] ?? null;

  return <AppShell>
    <section className="page-header reception-page-header"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="muted">{copy.subtitle}</p></section>
    <section className="reception-single-workspace" aria-label={copy.workspaceLabel}>
      <div className="reception-home-grid reception-primary-actions">
        <Link className="reception-action-card premium-depth-card" href="/patients/new"><ThreeDMedicalIcon name="patients" size="sm" /><strong>{copy.newPatient}</strong><span>{copy.newPatientHint}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/reception/check-in"><ThreeDMedicalIcon name="search" size="sm" /><strong>{copy.returningPatient}</strong><span>{copy.returningPatientHint}</span></Link>
        <Link className="reception-action-card premium-depth-card" href="/queue"><ThreeDMedicalIcon name="queue" size="sm" /><strong>{copy.waitingLine}</strong><span>{copy.waitingLineHint}</span></Link>
      </div>
      <section className="panel compact-panel reception-live-status" aria-label={copy.liveClinicStatus} data-reception-live-status>
        <div className="section-heading compact-section-heading"><div><p className="eyebrow">{copy.liveClinicStatus}</p><h2>{copy.nextToDoctor}</h2></div><button className="button secondary compact" type="button" onClick={() => void refreshQueue()}>{copy.refresh}</button></div>
        {error ? <p className="notice" role="status">{error}</p> : null}
        <p className="reception-current-patient" data-next-to-doctor><strong>{current ? patientLabel(current.patient) : copy.doctorAvailable}</strong></p>
        <div className="reception-queue-summary" aria-label={copy.waitingSummary}>
          <span><strong>{waiting.length}</strong> {copy.waiting}</span>
          <span><strong>{nextWaiting ? patientLabel(nextWaiting.patient) : copy.none}</strong> {copy.nextWaiting}</span>
        </div>
      </section>
    </section>
  </AppShell>;
}
`);

write("apps/web/app/reception/reception-copy.ts", `export const receptionCopy = {
  en: {
    eyebrow: "Reception", title: "Reception Home", subtitle: "One workspace for registration, check-in, and the waiting line.", workspaceLabel: "Reception workspace",
    newPatient: "New Patient", newPatientHint: "Register a new clinic file.", returningPatient: "Returning Patient", returningPatientHint: "Search, confirm, and check in.", waitingLine: "Waiting Line", waitingLineHint: "Open today’s live queue.",
    liveClinicStatus: "Live clinic status", nextToDoctor: "Next to doctor", doctorAvailable: "No patient with doctor", waiting: "waiting", nextWaiting: "next waiting", waitingSummary: "Waiting-line summary", none: "None", refresh: "Refresh", queueUnavailable: "Queue preview is temporarily unavailable."
  },
  ar: {
    eyebrow: "الاستقبال", title: "الرئيسية — الاستقبال", subtitle: "مساحة واحدة للتسجيل والحضور وقائمة الانتظار.", workspaceLabel: "مساحة عمل الاستقبال",
    newPatient: "مريضة جديدة", newPatientHint: "إنشاء ملف جديد للعيادة.", returningPatient: "مريضة مسجلة", returningPatientHint: "بحث وتأكيد وتسجيل الحضور.", waitingLine: "قائمة الانتظار", waitingLineHint: "فتح قائمة اليوم المباشرة.",
    liveClinicStatus: "حالة العيادة الآن", nextToDoctor: "عند الطبيب الآن", doctorAvailable: "لا توجد مريضة عند الطبيب", waiting: "في الانتظار", nextWaiting: "التالية في الانتظار", waitingSummary: "ملخص قائمة الانتظار", none: "لا يوجد", refresh: "تحديث", queueUnavailable: "تعذر تحميل قائمة الانتظار مؤقتاً."
  }
} as const;

export const receptionWorkflowCopy = {
  en: { checkIn: "Check-in", todayAppointments: "Today’s appointments", bookAppointment: "Book appointment", paymentStatus: "Payment status" },
  ar: { checkIn: "تسجيل الحضور", todayAppointments: "مواعيد اليوم", bookAppointment: "حجز موعد", paymentStatus: "حالة الدفع" }
} as const;
`);

const queueServicePath = "apps/api/src/queue/queue.service.ts";
replaceRange(
  queueServicePath,
  "  async call(id: string, user: AuthUser) {",
  "\n\n  async complete(id: string, user: AuthUser)",
  `  async call(id: string, user: AuthUser) {
    return this.activateForDoctor(id, user, "queue.called");
  }

  async selectForDoctor(id: string, user: AuthUser) {
    return this.activateForDoctor(id, user, "doctor_queue.patient_selected");
  }

  private async activateForDoctor(id: string, user: AuthUser, action: "queue.called" | "doctor_queue.patient_selected") {
    const dateString = this.clinicTime.getClinicDate();
    const { start: queueDate } = this.clinicTime.getClinicDayBounds(dateString);

    return this.prisma.$transaction(async (tx) => {
      const target = await tx.queueTicket.findFirst({
        where: { id, queueDate, ...branchScope(user) },
        include: { patient: true, appointment: true }
      });
      if (!target) throw new NotFoundException("Queue ticket not found.");
      if (target.status === "in_room") return target;
      if (!["waiting", "called"].includes(target.status)) {
        throw new BadRequestException({ code: "QUEUE_INVALID_TRANSITION", message: "Only a waiting or called patient can be selected for the doctor." });
      }

      const occupiedRoom = await tx.queueTicket.findFirst({
        where: { queueDate, status: "in_room", id: { not: id }, ...branchScope(user) },
        select: { id: true, patientId: true, queueNumber: true }
      });
      if (occupiedRoom) {
        throw new ConflictException({ code: "DOCTOR_ROOM_OCCUPIED", message: "Complete or sign the current visit before selecting another patient." });
      }

      const displaced = await tx.queueTicket.findMany({
        where: { queueDate, status: "called", id: { not: id }, ...branchScope(user) },
        select: { id: true }
      });
      if (displaced.length) {
        await tx.queueTicket.updateMany({
          where: { id: { in: displaced.map((ticket) => ticket.id) }, status: "called", ...branchScope(user) },
          data: { status: "waiting", calledAt: null }
        });
      }

      if (target.status === "waiting") {
        const claim = await tx.queueTicket.updateMany({
          where: { id, queueDate, status: "waiting", ...branchScope(user) },
          data: { status: "called", calledAt: new Date() }
        });
        if (claim.count !== 1) {
          throw new ConflictException({ code: "QUEUE_SELECTION_CONFLICT", message: "The waiting line changed. Refresh and select the patient again." });
        }
      }

      const selected = await tx.queueTicket.findUniqueOrThrow({
        where: { id },
        include: { patient: true, appointment: true }
      });

      await this.audit.record({
        actorUserId: user.id,
        action,
        resourceType: "queue_ticket",
        resourceId: selected.id,
        branchId: selected.branchId,
        severity: "high",
        metadataJson: { patientId: selected.patientId, queueNumber: selected.queueNumber, displacedCalledTicketIds: displaced.map((ticket) => ticket.id), singleCalledPatient: true }
      });

      return selected;
    });
  }`
);

const operationsPath = "apps/web/app/clinic-operations-page.tsx";
replaceOnce(
  operationsPath,
  '{mode === "doctor" ? <DoctorHandoff queue={visibleQueue.filter((ticket) => ["waiting", "called"].includes(ticket.status))} orders={orders} invoices={invoices} /> : null}',
  '{mode === "doctor" ? <DoctorHandoff queue={visibleQueue.filter((ticket) => ["waiting", "called", "in_room"].includes(ticket.status))} orders={orders} invoices={invoices} onRefresh={load} /> : null}'
);
replaceRange(
  operationsPath,
  "function DoctorHandoff(",
  "\n\nfunction InvestigationLoop",
  `function DoctorHandoff({ queue, orders, invoices, onRefresh }: { queue: QueueTicket[]; orders: InvestigationOrder[]; invoices: Invoice[]; onRefresh(): Promise<void> }) {
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
      const response = await fetch(\`${getApiBaseUrl()}/queue/\${ticket.id}/select\`, { method: "PATCH", credentials: "include", headers: token ? { authorization: \`Bearer \${token}\` } : undefined }).catch(() => null);
      if (!response?.ok) {
        const payload = await response?.json().catch(() => ({})) as { message?: string } | undefined;
        setActionError(payload?.message ?? "The queue changed. Refresh and select the patient again.");
        await onRefresh();
        return;
      }
    }
    const visit = await startDoctorVisit(ticket.patientId).catch(() => null);
    const encounterId = String(visit?.encounter?.id ?? "");
    if (!encounterId) { setActionError("The locked visit could not be opened."); return; }
    publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"], ticket.patientId);
    window.location.href = \`/patients/\${ticket.patientId}/visits/\${encounterId}/\${moduleKey}\`;
  }

  return <section className="content-grid doctor-handoff-workspace" data-doctor-handoff-workspace>
    <article className="panel compact-panel current-in-room-patient-compact">
      <div className="section-heading"><div><h2>Current patient / active visit</h2><p className="muted">One patient can be called or in room at a time.</p></div><span className="badge">{current ? friendly(current.status) : "None"}</span></div>
      {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
      {current ? <div className="data-row dense" data-queue-ticket-id={current.id}>
        <div className="data-row-header"><strong>{patient(current.patient)}</strong><span className="badge">#{current.queueNumber ?? "—"}</span></div>
        <p className="muted">{visitTypeLabelLocal(current.visitType)} · Follow-up hints {orders.filter((order) => order.patientId === current.patientId && order.status !== "reviewed").length}</p>
        <div className="form-actions">
          <Link className="button secondary compact" href={\`/patients/\${current.patientId}\`}>Open</Link>
          <button className="button compact" type="button" onClick={() => void openVisit(current, "encounter", false)}>Continue</button>
          <button className="button secondary compact" type="button" onClick={() => void openVisit(current, "finish", false)}>Complete</button>
        </div>
      </div> : <p className="empty-state compact smart-empty-state">No patient with doctor.</p>}
    </article>

    <article className="panel compact-panel">
      <div className="section-heading"><div><h2>Waiting patients</h2><p className="muted">Urgent first, then check-in order.</p></div><div className="form-actions"><span className="badge">{waiting.length}</span><button className="button compact" disabled={!next || Boolean(current?.status === "in_room")} type="button" onClick={() => next && void openVisit(next, "encounter", true)}>Pick next</button></div></div>
      <div className="dense-card-list">
        {waiting.map((ticket, index) => <article className="data-row dense" data-queue-ticket-id={ticket.id} key={ticket.id}>
          <div className="data-row-header"><strong>{index + 1}. {patient(ticket.patient)}</strong><span className="badge">#{ticket.queueNumber ?? "—"}</span></div>
          <p className="muted">{visitTypeLabelLocal(ticket.visitType)} · {ticket.checkedInAt ? waitingDuration(ticket.checkedInAt) : "Waiting time not recorded"}</p>
          <div className="form-actions"><Link className="button secondary compact" href={\`/patients/\${ticket.patientId}?preview=queue\`}>Open</Link><button className="button compact" type="button" onClick={() => void openVisit(ticket, "encounter", true)}>Start</button></div>
        </article>)}
        {!waiting.length ? <p className="empty-state compact smart-empty-state">No patients waiting.</p> : null}
      </div>
    </article>

    <article className="panel"><div className="section-heading"><h2>Doctor handoff rules</h2><span className="badge">Safe queue</span></div><ul className="feature-list"><li>Open never changes queue status.</li><li>Start and Pick next create one called patient only.</li><li>Continue opens the locked active visit.</li><li>Complete opens the signed finish workflow; it does not bypass clinical signing.</li></ul></article>
  </section>;
}`
);
replaceOnce(
  operationsPath,
  "function QueueBoard({ queue, copy, onRefresh }: { queue: QueueTicket[]; copy: OperationsCopy; onRefresh(): Promise<void> }) {\n  const waiting = queue",
  "function QueueBoard({ queue, copy, onRefresh }: { queue: QueueTicket[]; copy: OperationsCopy; onRefresh(): Promise<void> }) {\n  const [actionError, setActionError] = useState(\"\");\n  const waiting = queue"
);
replaceOnce(
  operationsPath,
  `  async function callPatient(ticketId: string) {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(\`${getApiBaseUrl()}/queue/\${ticketId}/call\`, { method: "PATCH", credentials: "include", headers: token ? { authorization: \`Bearer \${token}\` } : undefined }).catch(() => null);
    if (response?.ok) { publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"]); await onRefresh(); }
  }`,
  `  async function callPatient(ticketId: string) {
    setActionError("");
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(\`${getApiBaseUrl()}/queue/\${ticketId}/call\`, { method: "PATCH", credentials: "include", headers: token ? { authorization: \`Bearer \${token}\` } : undefined }).catch(() => null);
    if (!response?.ok) {
      const payload = await response?.json().catch(() => ({})) as { message?: string } | undefined;
      setActionError(payload?.message ?? "The waiting line changed. Refresh and try again.");
      await onRefresh();
      return;
    }
    publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"]);
    await onRefresh();
  }`
);
replaceOnce(
  operationsPath,
  `        {error ? <p className="notice" role="status">{error}</p> : null}`,
  `        {error ? <p className="notice" role="status">{error}</p> : null}`
);
replaceOnce(
  operationsPath,
  `        <p className="queue-compact-line"><strong>{copy.next}:</strong> {nextTicket ? patient(nextTicket.patient) : copy.noPatientsWaiting}</p>`,
  `        <p className="queue-compact-line"><strong>{copy.next}:</strong> {nextTicket ? patient(nextTicket.patient) : copy.noPatientsWaiting}</p>\n        {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}`
);

const cssPath = "apps/web/app/globals.css";
const css = read(cssPath);
const cssMarker = "/* Sprint 1 reception and queue core */";
if (!css.includes(cssMarker)) {
  write(cssPath, `${css}\n\n${cssMarker}\n.app-shell.receptionist-shell.no-sidebar {\n  --density-sidebar-width: 0rem;\n  grid-template-columns: minmax(0, 1fr);\n}\n.app-shell.receptionist-shell.no-sidebar .app-main { grid-column: 1; min-width: 0; }\n.receptionist-topbar-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.55rem; flex-wrap: wrap; }\n.reception-single-workspace { display: grid; gap: 1rem; }\n.reception-primary-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n.reception-action-card { min-height: 7.25rem; display: grid; align-content: center; justify-items: start; gap: 0.35rem; }\n.reception-action-card > span:last-child { color: var(--muted); font-size: 0.9rem; }\n.reception-live-status { max-width: 100%; }\n.reception-current-patient { margin: 0.35rem 0 0.75rem; font-size: clamp(1.2rem, 2vw, 1.65rem); }\n.reception-queue-summary { display: flex; gap: 0.7rem; flex-wrap: wrap; }\n.reception-queue-summary > span { border: 1px solid var(--border); border-radius: 999px; padding: 0.42rem 0.7rem; background: var(--surface-subtle); }\n.doctor-handoff-workspace .data-row[data-queue-ticket-id] { scroll-margin-top: 5rem; }\n@media (max-width: 767px) {\n  .reception-primary-actions { grid-template-columns: minmax(0, 1fr); }\n  .receptionist-topbar-actions { width: 100%; justify-content: space-between; }\n  .receptionist-topbar-actions .button { min-height: 2.75rem; }\n}\n`);
}

write("scripts/v1444-reception-shell-test.mjs", `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");
const reception = await readFile("apps/web/app/reception/page.tsx", "utf8");

assert.match(shell, /isReceptionistOnly \? \[\] : buildShellNavGroups/);
assert.match(shell, /user && !isReceptionistOnly[\s\S]*?aria-label="Close navigation"/);
assert.match(shell, /isReceptionistOnly \? "receptionist-shell no-sidebar"/);
assert.match(shell, /!isReceptionistOnly \? <UniversalSearchBox \/> : null/);
assert.match(shell, /receptionist-topbar-actions/);
assert.match(shell, /href="\/reception"[\s\S]*?LanguageSwitcher[\s\S]*?signOut\(\)/);
assert.doesNotMatch(shell, /interfaceMode === "MINIMALISTIC" && \(isDoctorOnly \|\| isReceptionistOnly\)/);
assert.match(css, /\.app-shell\.receptionist-shell\.no-sidebar[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
assert.match(css, /\.reception-primary-actions[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.reception-primary-actions[\s\S]*?minmax\(0, 1fr\)/);
for (const action of ["New Patient", "Returning Patient", "Waiting Line", "Next to doctor"]) assert.ok(reception.includes(action), `Reception workspace must expose ${action}`);
for (const forbidden of ["Doctor view", "New Encounter", "New Prescription", "Owner Control"]) assert.equal(reception.includes(forbidden), false, `Reception workspace must not expose ${forbidden}`);
assert.match(reception, /data-next-to-doctor/);
assert.match(reception, /ticket\.status === "in_room"[\s\S]*?ticket\.status === "called"/);
console.log("v1.4.4 receptionist single-workspace isolation PASS");
`);

write("scripts/sprint1-reception-queue-core-test.mjs", `import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("apps/web/app/mvp-page.tsx", "utf8");
const reception = fs.readFileSync("apps/web/app/reception/page.tsx", "utf8");
const operations = fs.readFileSync("apps/web/app/clinic-operations-page.tsx", "utf8");
const queue = fs.readFileSync("apps/api/src/queue/queue.service.ts", "utf8");

for (const needle of ["receptionist-shell no-sidebar", "receptionist-topbar-actions", "LanguageSwitcher", "!isReceptionistOnly ? <UniversalSearchBox /> : null"]) assert.ok(shell.includes(needle), `Reception shell missing ${needle}`);
for (const needle of ["/patients/new", "/reception/check-in", "/queue", "data-next-to-doctor", "No patient with doctor"]) assert.ok(reception.includes(needle), `Reception workspace missing ${needle}`);
for (const needle of ["activateForDoctor", "DOCTOR_ROOM_OCCUPIED", "QUEUE_SELECTION_CONFLICT", "singleCalledPatient: true", "displacedCalledTicketIds", 'data: { status: "waiting", calledAt: null }']) assert.ok(queue.includes(needle), `Queue reliability missing ${needle}`);
for (const needle of ["data-doctor-handoff-workspace", "Pick next", ">Open<", ">Continue<", ">Complete<", "Complete opens the signed finish workflow", 'moduleKey: "encounter" | "finish"']) assert.ok(operations.includes(needle), `Doctor queue workflow missing ${needle}`);
assert.match(operations, /\["waiting", "called", "in_room"\]/);
assert.match(operations, /key=\{ticket\.id\}/);
assert.doesNotMatch(operations, /Complete[\s\S]{0,120}\/queue\/\$\{ticket\.id\}\/complete/);
console.log("Sprint 1 reception and queue core PASS");
`);

console.log("Sprint 1 reception and queue core patch applied.");
