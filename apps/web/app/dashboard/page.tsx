"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      <main className="page">
        <section className="panel">
          <p className="form-error">{error}</p>
          <a className="button" href="/login">
            Login
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">MVP demo foundation</p>
          <h1>Prij Clinic Dashboard</h1>
        </div>
        <nav className="nav-links" aria-label="MVP navigation">
          <a className="button secondary" href="/patients">
            Patients
          </a>
          <a className="button secondary" href="/appointments">
            Appointments
          </a>
          <a className="button secondary" href="/calendar">
            Calendar
          </a>
          <a className="button secondary" href="/queue">
            Queue
          </a>
          <a className="button secondary" href="/billing">
            Billing
          </a>
          <a className="button secondary" href="/ai-drafts">
            AI Drafts
          </a>
          <button className="button secondary" onClick={logout} type="button">
            Logout
          </button>
        </nav>
      </header>

      <section className="notice">
        Local demo only. AI is disabled/mock-only and cannot diagnose, prescribe, sign, or update final clinical records.
      </section>

      <section className="panel">
        <h2>Logged-in user</h2>
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
              <dt>Status</dt>
              <dd>{user.status}</dd>
            </div>
            <div>
              <dt>Roles</dt>
              <dd>{user.roles.join(", ") || "None"}</dd>
            </div>
            <div className="wide">
              <dt>Permissions</dt>
              <dd>{user.permissions.join(", ") || "None"}</dd>
            </div>
          </dl>
        ) : (
          <p>Loading</p>
        )}
      </section>

      <section className="panel">
        <h2>Operational summary</h2>
        {summary ? (
          <dl className="profile-grid">
            <div>
              <dt>Appointments today</dt>
              <dd>{summary.operational.appointmentsToday}</dd>
            </div>
            <div>
              <dt>Waiting queue</dt>
              <dd>{summary.operational.waitingQueue}</dd>
            </div>
            <div>
              <dt>Pending reports</dt>
              <dd>{summary.operational.pendingReports}</dd>
            </div>
            <div>
              <dt>Active pregnancies</dt>
              <dd>{summary.operational.activePregnancies}</dd>
            </div>
            <div>
              <dt>Draft OB ultrasounds</dt>
              <dd>{summary.operational.draftUltrasounds}</dd>
            </div>
            <div>
              <dt>Open invoices</dt>
              <dd>{summary.billing.openInvoices}</dd>
            </div>
            <div>
              <dt>Payments today</dt>
              <dd>{summary.billing.paymentsToday}</dd>
            </div>
            <div>
              <dt>AI status</dt>
              <dd>{summary.safety.aiEnabled ? "Enabled" : "Disabled"}</dd>
            </div>
            <div>
              <dt>Pending AI drafts</dt>
              <dd>{summary.safety.pendingAiDrafts}</dd>
            </div>
          </dl>
        ) : (
          <p>Loading</p>
        )}
      </section>
    </main>
  );
}
