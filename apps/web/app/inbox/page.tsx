"use client";

import Link from "next/link";
import { useSession } from "../session";
import { AppShell, SafetyAlert } from "../mvp-page";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

const roleInboxItems: Record<string, Array<{ title: string; text: string; href: string }>> = {
  Owner: [
    { title: "Backup and security readiness", text: "Review readiness warnings, backup status, audit logs, and system status.", href: "/admin/security-readiness" },
    { title: "Reports and audit review", text: "Open operational reports and audit review queues.", href: "/reports" },
    { title: "Business summary", text: "Review source-backed finance and clinic summary only.", href: "/dashboard" }
  ],
  Admin: [
    { title: "Backup and security readiness", text: "Review readiness warnings, backup status, audit logs, and system status.", href: "/admin/security-readiness" },
    { title: "Audit review", text: "Check account, role, and patient workflow audit events.", href: "/admin/audit" }
  ],
  Doctor: [
    { title: "Patients waiting", text: "Open the doctor waiting list and continue the next visit.", href: "/doctor/waiting" },
    { title: "Results to review", text: "Review pending investigation and report metadata.", href: "/investigations" },
    { title: "Draft visits not completed", text: "Continue draft encounters; doctor approval remains required.", href: "/doctor/visit" },
    { title: "AI drafts awaiting review", text: "Review draft-only AI support; no automatic diagnosis or prescribing.", href: "/ai-drafts" }
  ],
  Receptionist: [
    { title: "Pending check-ins", text: "Complete visit type selection and queue check-in.", href: "/reception/check-in" },
    { title: "Appointments not checked in", text: "Use today desk and QR workflow for arrivals.", href: "/reception/today" },
    { title: "Missing phone or ID", text: "Open patient files and update reception-safe demographics.", href: "/patients" },
    { title: "Follow-ups not booked", text: "Book follow-up appointments without clinical automation.", href: "/calendar" }
  ],
  Accountant: [
    { title: "Unpaid invoices", text: "Review issued and partially paid invoices.", href: "/billing" },
    { title: "Partial payments", text: "Record payment status without a real payment gateway.", href: "/billing" },
    { title: "Voided invoices needing review", text: "Review source-backed voided invoice records.", href: "/finance" },
    { title: "Daily closing pending", text: "Use daily closing readiness in the finance area.", href: "/finance" }
  ]
};

export default function PendingWorkInboxPage() {
  const { user } = useSession();
  const roles = user?.roles ?? [];
  const role = roles.find((item) => roleInboxItems[item]) ?? "Receptionist";
  const items = roleInboxItems[role] ?? [];

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Pending work inbox</p>
            <h1>Today&apos;s pending work</h1>
            <p className="muted">Role-specific work only. Empty states stay clean when source data is unavailable.</p>
          </div>
          <span className="badge">{role}</span>
        </div>
      </section>
      <SafetyAlert />
      <section className="dashboard-grid" aria-label="Role specific pending work inbox">
        {items.map((item) => (
          <article className="panel compact-panel" key={item.title}>
            <div className="section-heading">
              <h2>{item.title}</h2>
              <ThreeDMedicalIcon name="queue" size="sm" tone="slate" />
            </div>
            <p className="muted">{item.text}</p>
            <Link className="button secondary compact" href={item.href}>Open</Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
