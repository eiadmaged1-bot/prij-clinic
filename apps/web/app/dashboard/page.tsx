"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, SafetyAlert } from "../mvp-page";
import { useTheme } from "../theme";

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

const quickActions: Array<[string, string, string]> = [
  ["/patients/new", "New Patient", "Start demo registration with fake identifiers only."],
  ["/appointments", "New Appointment", "Schedule a safe local visit."],
  ["/queue", "Queue Check-in", "Move a demo patient into today's queue."],
  ["/encounters", "New Encounter", "Open a doctor-authored draft record."],
  ["/billing", "New Invoice", "Review demo invoices without payment gateway data."],
  ["/ai-drafts", "AI Draft Placeholder", "Review disabled/mock-only AI draft boundaries."]
];

const portalModules: Array<[string, string, string, string, string]> = [
  ["/patients", "Operations", "Patients", "PT", "teal"],
  ["/appointments", "Operations", "Appointments", "AP", "teal"],
  ["/queue", "Operations", "Queue", "QU", "teal"],
  ["/calendar", "Operations", "Calendar", "CA", "teal"],
  ["/encounters", "Clinical", "Encounters", "EN", "navy"],
  ["/prescriptions", "Clinical", "Prescriptions", "RX", "navy"],
  ["/investigations", "Clinical", "Investigations", "IV", "navy"],
  ["/reports", "Clinical", "Reports", "RP", "navy"],
  ["/pregnancies", "OB/Pregnancy", "Pregnancy", "PG", "teal"],
  ["/ultrasound", "OB/Pregnancy", "Ultrasound", "US", "teal"],
  ["/billing", "Finance", "Billing", "BI", "navy"],
  ["/consents", "Safety", "Consents", "CO", "gray"],
  ["/ai-drafts", "Safety", "AI Draft Review", "AI", "gray"]
];

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
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

  const canOpenAdmin =
    user?.roles.includes("Owner") ||
    user?.roles.includes("Admin") ||
    user?.roles.includes("Super Admin") ||
    user?.permissions.includes("clinic_settings.manage");

  if (theme === "incision-portal") {
    return (
      <AppShell>
        <section className="portal-header">
          <div>
            <p className="eyebrow">Prij Clinic</p>
            <h1>Clinic Apps</h1>
            <p className="muted">Choose a workflow. Each tile opens one focused clinic area.</p>
          </div>
          <div className="portal-tabs" role="tablist" aria-label="App views">
            <button className="portal-tab active" type="button">My Apps</button>
            <button className="portal-tab" type="button">All Apps</button>
          </div>
        </section>

        <section className="portal-grid" aria-label="Clinic app launcher">
          {[
            ...portalModules,
            ...(canOpenAdmin
              ? ([
                  ["/admin", "Admin", "Control Center", "AD", "gray"],
                  ["/admin/appearance", "Admin", "Appearance", "TH", "gray"]
                ] as Array<[string, string, string, string, string]>)
              : [])
          ].map(
            ([href, category, label, icon, tone]) => (
              <Link className={`portal-card portal-${tone}`} href={href} key={href}>
                <span className="portal-icon">{icon}</span>
                <span className="portal-category">{category}</span>
                <strong>{label}</strong>
              </Link>
            )
          )}
        </section>

        <section className="portal-status">
          <span>No real patient data</span>
          <span>AI disabled</span>
          <span>Local demo only</span>
        </section>
      </AppShell>
    );
  }

  if (theme === "medicolize-portal") {
    return (
      <AppShell>
        <section className="owner-hero">
          <div>
            <p className="eyebrow">Owner portal</p>
            <h1>Clinic Command</h1>
            <p className="muted">Search, open patient files, review today&apos;s flow, and manage owner tools from one clean workspace.</p>
          </div>
          <div className="owner-search-card">
            <label>
              Patient search
              <input placeholder="Name, MRN, phone, or appointment" />
            </label>
            <Link className="button" href="/patients/new">New Patient File</Link>
          </div>
        </section>

        <section className="owner-stats">
          <Metric label="Appointments today" value={summary?.operational.appointmentsToday ?? "-"} />
          <Metric label="Waiting queue" value={summary?.operational.waitingQueue ?? "-"} />
          <Metric label="Pending reports" value={summary?.operational.pendingReports ?? "-"} />
          <Metric label="Open invoices" value={summary?.billing.openInvoices ?? "-"} />
        </section>

        <section className="owner-tabs" aria-label="Clinic module tabs">
          {["Today", "Patients", "Clinical", "Finance", "Safety"].map((tab) => (
            <button className={tab === "Today" ? "owner-tab active" : "owner-tab"} key={tab} type="button">{tab}</button>
          ))}
        </section>

        <section className="owner-card-grid">
          {([
            ["/patients", "Patient Files", "Open patient records and create new files.", "Patients"],
            ["/calendar", "Calendar", "Review schedule and daily bookings.", "Ops"],
            ["/queue", "Queue", "Manage waiting patients and check-in.", "Ops"],
            ["/investigations", "Lab Orders", "Track demo investigation orders.", "Clinical"],
            ["/billing", "Finance", "Open invoices and payment records.", "Finance"],
            ["/admin", "Owner Control", "Settings, prices, users, themes, and audit review.", "Owner"]
          ] as Array<[string, string, string, string]>).filter(([href]) => href !== "/admin" || canOpenAdmin).map(([href, title, description, badge]) => (
            <Link className="owner-module-card" href={href} key={href}>
              <span className="badge accent">{badge}</span>
              <strong>{title}</strong>
              <p className="muted">{description}</p>
            </Link>
          ))}
        </section>
      </AppShell>
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
        <Metric label="Pending reports" value={summary?.operational.pendingReports ?? "-"} />
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
