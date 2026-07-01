"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, SafetyAlert } from "../mvp-page";
import { useTheme } from "../theme";
import { IconName, ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

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

const workflow = ["Reception", "Appointment", "Queue", "Doctor", "Orders", "Reports", "Finance", "Owner review"];

const quickActions: Array<[string, string, string, IconName]> = [
  ["/patients/new", "New Patient", "Start demo registration with fake identifiers only.", "patients"],
  ["/appointments", "New Appointment", "Schedule a safe local visit.", "calendar"],
  ["/queue", "Queue Check-in", "Move a demo patient into today's queue.", "queue"],
  ["/doctor/visit", "Guided Visit", "Open a large step-by-step doctor note.", "doctor"],
  ["/billing", "Create Invoice", "Record manual clinic charges without a gateway.", "billing"],
  ["/medications", "Search Medication", "Open official reference metadata and safety tools.", "prescription"],
  ["/admin", "Owner Control Center", "Settings, services, roles, audit, backup status.", "admin"]
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

  const isDoctorOnly = Boolean(user?.roles.includes("Doctor") && !canOpenAdmin);
  const isReception = Boolean(user?.roles.includes("Reception") || user?.roles.includes("Receptionist"));
  const isAccountant = Boolean(user?.roles.includes("Accountant"));

  if (isDoctorOnly) {
    return (
      <AppShell>
        <section className="doctor-hero">
          <div>
            <p className="eyebrow">Doctor Mode</p>
            <h1>Good morning, Doctor</h1>
            <p className="muted">A calm daily workspace: open patient, start visit, write note, prescribe, order tests, finish.</p>
          </div>
          <div className="doctor-hero-actions">
              <Link className="button large" href="/doctor">
                <ThreeDMedicalIcon name="doctor" size="sm" />
                Open Doctor Mode
              </Link>
            <Link className="button secondary large" href="/patients">
              <ThreeDMedicalIcon name="patients" size="sm" />
              Find Patient
            </Link>
          </div>
        </section>
        <SafetyAlert />
        <section className="doctor-today-grid">
          <Metric label="Waiting queue" value={summary?.operational.waitingQueue ?? "-"} detail="Open the next patient when ready" />
          <Metric label="Appointments today" value={summary?.operational.appointmentsToday ?? "-"} detail="Today's clinic schedule" />
          <Metric label="Pending reports" value={summary?.operational.pendingReports ?? "-"} detail="Review manually" />
          <Metric label="Medication reference" value="8,269" detail="Official rows for reference only" />
        </section>
        <section className="doctor-step-strip">
          {["Open patient", "Start visit", "Write note", "Prescription", "Orders", "Finish"].map((step, index) => (
            <span key={step}><b>{index + 1}</b>{step}</span>
          ))}
        </section>
      </AppShell>
    );
  }

  if (isReception || isAccountant) {
    return (
      <AppShell>
        <section className="page-header">
          <div className="header-row">
            <div>
              <p className="eyebrow">{isAccountant ? "Finance workspace" : "Reception workspace"}</p>
              <h1>{isAccountant ? "Daily finance" : "Front desk home"}</h1>
            </div>
            <span className="badge warning">Local Demo</span>
          </div>
          <p className="muted">
            {isAccountant
              ? "Collections, unpaid invoices, manual payments, and daily closing are visible here."
              : "Create patient files, schedule visits, check in arrivals, and hand them off to the doctor."}
          </p>
        </section>
        <SafetyAlert />
        <section className="summary-grid">
          <Metric label="Appointments today" value={summary?.operational.appointmentsToday ?? "-"} />
          <Metric label="Waiting queue" value={summary?.operational.waitingQueue ?? "-"} />
          <Metric label="Open invoices" value={summary?.billing.openInvoices ?? "-"} />
          <Metric label="Collected today" value={summary?.billing.paymentsToday ?? "-"} />
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>{isAccountant ? "Finance actions" : "Reception flow"}</h2>
            <span className="badge accent">Role-aware</span>
          </div>
          <div className="quick-grid">
            {(isAccountant
              ? quickActions.filter(([href]) => ["/billing", "/patients"].includes(href))
              : quickActions.filter(([href]) => ["/patients/new", "/appointments", "/queue"].includes(href))
            ).map(([href, label, description, icon]) => (
              <Link className="quick-card" href={href} key={href}>
                <ThreeDMedicalIcon name={icon} size="md" />
                <strong>{label}</strong>
                <span className="muted">{description}</span>
              </Link>
            ))}
          </div>
        </section>
      </AppShell>
    );
  }

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
            <p className="eyebrow">Premium clinic OS</p>
            <h1>Clinic Home</h1>
          </div>
          <div className="topbar-actions">
            <button className="button secondary compact" onClick={logout} type="button">
              Logout
            </button>
            <span className="badge accent">{user?.roles.join(", ") || "Staff"}</span>
            <span className="badge warning">Local Demo</span>
          </div>
        </div>
        <p className="muted">
          A visible home for today&apos;s clinic flow: reception, queue, doctor workspace, orders, finance, medications, and owner controls.
        </p>
      </section>

      <SafetyAlert />

      <section className="summary-grid" aria-label="Operational summary">
        <Metric label="Appointments today" value={summary?.operational.appointmentsToday ?? "-"} />
        <Metric label="Queue waiting" value={summary?.operational.waitingQueue ?? "-"} />
        <Metric label="Orders pending" value={summary?.operational.pendingReports ?? "-"} />
        <Metric label="Unpaid invoices" value={summary?.billing.openInvoices ?? "-"} detail={`Revenue today: ${summary?.billing.paymentsToday ?? "-"}`} />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <h2>Quick actions</h2>
            <span className="badge">Safe workflow</span>
          </div>
          <div className="quick-grid">
            {quickActions.map(([href, label, description, icon]) => (
              <Link className="quick-card" href={href} key={href}>
                <ThreeDMedicalIcon name={icon} size="md" />
                <strong>{label}</strong>
                <span className="muted">{description}</span>
              </Link>
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
                <dt>Access</dt>
                <dd>{user.permissions.length > 0 ? "Clinic access enabled for this demo role" : "No extra access shown"}</dd>
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
        <Metric label="Official rows" value="8,269" detail="Bahrain and Oman official reference data" />
        <Metric label="Verified rows" value="1,200" detail="High-confidence rows verified" />
        <Metric label="Review remaining" value="7,069" detail="Owner review queue remains open" />
        <Metric label="Restore drill" value="Passed" detail="v0.8.6 isolated restore check" />
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
