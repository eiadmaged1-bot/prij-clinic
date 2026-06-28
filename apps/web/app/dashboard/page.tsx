"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, SafetyAlert } from "../mvp-page";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  branchId: string | null;
  roles: string[];
  permissions: string[];
};

type DashboardSummary = {
  operational: {
    appointmentsToday: number;
    waitingQueue: number;
    pendingReports: number;
    activePregnancies: number;
    draftUltrasounds: number;
  };
  billing: {
    openInvoices: number;
    paymentsToday: string;
  };
  safety: {
    aiEnabled: boolean;
    clinicalDraftsRequireDoctorReview: boolean;
    pendingAiDrafts: number;
  };
};

const workflow = ["Patient", "Appointment", "Queue", "Encounter", "Orders", "Report/OB", "Billing", "AI review"];

const quickActions = [
  ["/patients/new", "New Patient", "Start demo registration with fake identifiers only."],
  ["/appointments", "New Appointment", "Schedule a safe local visit."],
  ["/queue", "Queue Check-in", "Move a demo patient into today's queue."],
  ["/encounters", "New Encounter", "Open a doctor-authored draft record."],
  ["/billing", "New Invoice", "Review demo invoices without payment gateway data."],
  ["/ai-drafts", "AI Draft Placeholder", "Review disabled/mock-only AI draft boundaries."]
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");

    fetch(`${apiUrl}/auth/me`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Authentication is required.");
        }

        return (await response.json()) as { user: SafeUser };
      })
      .then((data) => {
        setUser(data.user);
        return fetch(`${apiUrl}/dashboard/summary`, {
          credentials: "include",
          headers: token ? { authorization: `Bearer ${token}` } : undefined
        });
      })
      .then(async (response) => {
        if (response?.ok) {
          setSummary((await response.json()) as DashboardSummary);
        }
      })
      .catch(() => setError("Please sign in to continue."));
  }, []);

  async function logout() {
    const token = sessionStorage.getItem("prijClinicToken");

    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    });

    sessionStorage.removeItem("prijClinicToken");
    router.push("/login");
  }

  if (error) {
    return (
      <main className="page centered">
        <section className="panel">
          <p className="eyebrow">Authentication required</p>
          <h1>Sign in</h1>
          <p className="form-error">{error}</p>
          <a className="button" href="/login">
            Login
          </a>
        </section>
      </main>
    );
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">V0.1 clinic command center</p>
            <h1>Dashboard</h1>
          </div>
          <div className="topbar-actions">
            <button className="button secondary compact" onClick={logout} type="button">
              Logout
            </button>
            <span className="badge accent">AI disabled</span>
            <span className="badge warning">Demo only</span>
          </div>
        </div>
        <p className="muted">
          A safe local workflow view for clinic operations, clinical drafts, OB records, billing, and security checks.
        </p>
      </section>

      <SafetyAlert />

      <section className="summary-grid" aria-label="Operational summary">
        <Metric label="Appointments today" value={summary?.operational.appointmentsToday ?? "-"} />
        <Metric label="Queue waiting" value={summary?.operational.waitingQueue ?? "-"} />
        <Metric label="Patients and reports" value={summary?.operational.pendingReports ?? "-"} detail="Pending report reviews" />
        <Metric label="Open invoices" value={summary?.billing.openInvoices ?? "-"} detail={`Payments today: ${summary?.billing.paymentsToday ?? "-"}`} />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <h2>Quick actions</h2>
            <span className="badge">Safe workflow</span>
          </div>
          <div className="quick-grid">
            {quickActions.map(([href, label, description]) => (
              <a className="quick-card" href={href} key={href}>
                <strong>{label}</strong>
                <span className="muted">{description}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Session</h2>
            <span className="badge">{user?.status ?? "Loading"}</span>
          </div>
          {user ? (
            <dl className="profile-grid">
              <div>
                <dt>Name</dt>
                <dd>{user.displayName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Roles</dt>
                <dd>{user.roles.join(", ") || "None"}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{user.branchId ?? "Demo scope"}</dd>
              </div>
              <div className="wide">
                <dt>Permissions</dt>
                <dd>{user.permissions.slice(0, 12).join(", ") || "None"}</dd>
              </div>
            </dl>
          ) : (
            <div className="skeleton" />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Clinic workflow</h2>
          <span className="badge accent">End-to-end demo</span>
        </div>
        <div className="workflow-band">
          {workflow.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      </section>

      <section className="summary-grid">
        <Metric label="Active pregnancies" value={summary?.operational.activePregnancies ?? "-"} />
        <Metric label="Draft ultrasounds" value={summary?.operational.draftUltrasounds ?? "-"} detail="Physician interpretation required" />
        <Metric label="Pending AI drafts" value={summary?.safety.pendingAiDrafts ?? "-"} detail="Mock-only, review required" />
        <Metric label="AI features" value={summary?.safety.aiEnabled ? "On" : "Off"} detail="No external provider required" />
      </section>
    </AppShell>
  );
}

function Metric({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className="muted">{detail ?? "Local demo summary"}</p>
    </article>
  );
}
