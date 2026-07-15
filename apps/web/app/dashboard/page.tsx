"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell, SafetyAlert } from "../mvp-page";
import { useTheme } from "../theme";
import { IconName, ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { OFFICIAL_CLINIC_NAME } from "@/lib/brand";
import { roleLandingPath } from "@/lib/role-routing";

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

const quickActions: Array<[string, string, string, IconName]> = [
  ["/reception", "Reception", "Open the front desk workflow.", "reception"],
  ["/patients/new", "New Patient", "Create a patient file.", "patients"],
  ["/queue", "Waiting Line", "Manage arrivals.", "queue"],
  ["/doctor", "Doctor", "Open the clinical workspace.", "doctor"],
  ["/billing", "Create Invoice", "Record manual clinic charges without a gateway.", "billing"],
  ["/admin", "Admin", "Settings, users, services, and audit.", "admin"]
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

    fetch(`${getApiBaseUrl()}/auth/me`, {
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
        const landing = roleLandingPath(data.user);
        if (landing !== "/dashboard") router.replace(landing);
        return fetch(`${getApiBaseUrl()}/dashboard/summary`, {
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
  }, [router]);

  if (user && roleLandingPath(user) !== "/dashboard") {
    return <main className="page centered role-neutral-loading" aria-busy="true"><div className="skeleton" aria-label="Opening role workspace" /></main>;
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
            <h1 data-testid="page-heading">Good morning, Doctor</h1>
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
              <h1 data-testid="page-heading">{isAccountant ? "Daily finance" : "Front desk home"}</h1>
            </div>
          </div>
          <p className="muted">
            {isAccountant
              ? "Collections, unpaid invoices, manual payments, and daily closing are visible here."
              : "Create patient files, schedule visits, check in arrivals, and hand them off to the doctor."}
          </p>
        </section>
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

  if (theme === "lavender") {
    return (
      <AppShell>
        <section className="portal-header">
          <div>
            <p className="eyebrow">{OFFICIAL_CLINIC_NAME}</p>
            <h1 data-testid="page-heading">Clinic Apps</h1>
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
          <span>Protected access</span>
          <span>Doctor approval</span>
          <span>Audit ready</span>
        </section>
      </AppShell>
    );
  }

  if (theme === "rose") {
    return (
      <AppShell>
        <section className="owner-hero">
          <div>
            <p className="eyebrow">Owner portal</p>
            <h1 data-testid="page-heading">Clinic Command</h1>
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
            ["/investigations", "Lab Orders", "Track investigation orders.", "Clinical"],
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
            <p className="eyebrow">{OFFICIAL_CLINIC_NAME}</p>
            <h1 data-testid="page-heading">Clinic Home</h1>
          </div>
          <div className="topbar-actions">
            <span className="badge accent">{user?.roles.join(", ") || "Staff"}</span>
          </div>
        </div>
      </section>

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

      </section>
    </AppShell>
  );
}

function Metric({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className="muted">{detail ?? "Current"}</p>
    </article>
  );
}
