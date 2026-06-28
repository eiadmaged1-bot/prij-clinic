"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../mvp-page";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ServiceItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: string;
  currency: string;
  active: boolean;
};

type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
};

type RoleSummary = {
  id: string;
  name: string;
  permissions: string[];
};

type ControlSummary = {
  summary: Record<string, string | number>;
  safety: Record<string, boolean>;
  auditLogs: Array<{ id: string; action: string; resourceType: string; severity: string; reason?: string | null; createdAt: string }>;
};

const emptyService = {
  code: "",
  name: "",
  category: "Consultation",
  price: "0",
  currency: "EGP"
};

export default function AdminPage() {
  const [summary, setSummary] = useState<ControlSummary | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [form, setForm] = useState(emptyService);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => (typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken")), []);
  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }),
    [token]
  );

  useEffect(() => {
    void loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAdmin() {
    setLoading(true);
    setError("");
    try {
      const [summaryResponse, servicesResponse, usersResponse, rolesResponse] = await Promise.all([
        fetch(`${apiUrl}/admin/control-center`, { credentials: "include", headers }),
        fetch(`${apiUrl}/admin/services`, { credentials: "include", headers }),
        fetch(`${apiUrl}/admin/users`, { credentials: "include", headers }),
        fetch(`${apiUrl}/admin/roles`, { credentials: "include", headers })
      ]);

      if ([summaryResponse, servicesResponse, usersResponse, rolesResponse].some((response) => response.status === 401)) {
        throw new Error("Sign in with the local admin demo account to open Admin.");
      }
      if ([summaryResponse, servicesResponse, usersResponse, rolesResponse].some((response) => response.status === 403)) {
        throw new Error("Admin access is required.");
      }

      setSummary((await summaryResponse.json()) as ControlSummary);
      setServices(((await servicesResponse.json()) as { services: ServiceItem[] }).services ?? []);
      setUsers(((await usersResponse.json()) as { users: SafeUser[] }).users ?? []);
      setRoles(((await rolesResponse.json()) as { roles: RoleSummary[] }).roles ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Admin.");
    } finally {
      setLoading(false);
    }
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${apiUrl}/admin/services`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ ...form, price: Number(form.price) })
      });
      if (!response.ok) throw new Error("Could not save service.");
      setForm(emptyService);
      setMessage("Service saved.");
      await loadAdmin();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save service.");
    }
  }

  async function updateService(service: ServiceItem, patch: Partial<ServiceItem>) {
    setMessage("");
    setError("");
    const response = await fetch(`${apiUrl}/admin/services/${service.id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({
        ...patch,
        ...(patch.price !== undefined ? { price: Number(patch.price) } : {})
      })
    });
    if (!response.ok) {
      setError("Could not update service.");
      return;
    }
    setMessage("Service updated and audited.");
    await loadAdmin();
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Control Center</h1>
          </div>
          <span className="badge warning">Local demo only</span>
        </div>
        <p className="muted">Manage demo settings, staff visibility, service prices, and safe override workflows without editing code.</p>
      </section>

      <SafetyAlert />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="success-message">{message}</p> : null}
      {loading ? <div className="skeleton" /> : null}

      {summary ? (
        <section className="summary-grid">
          <Metric label="Staff users" value={summary.summary.users ?? "-"} />
          <Metric label="Roles" value={summary.summary.roles ?? "-"} />
          <Metric label="Services" value={summary.summary.services ?? "-"} />
          <Metric label="AI mode" value={summary.summary.aiMode ?? "Disabled"} />
        </section>
      ) : null}

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Service Catalog and Prices</h2>
              <p className="muted">Add services, edit prices, and deactivate services. No payment gateway is connected.</p>
            </div>
            <span className="badge accent">Audited</span>
          </div>
          <form className="form-grid" onSubmit={createService}>
            <label>
              Code
              <input onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required value={form.code} />
            </label>
            <label>
              Name
              <input onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} />
            </label>
            <label>
              Category
              <input onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required value={form.category} />
            </label>
            <label>
              Price
              <input min="0" onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required type="number" value={form.price} />
            </label>
            <button className="button wide" type="submit">Add service</button>
          </form>

          <div className="data-list">
            {services.map((service) => (
              <article className="data-row" key={service.id}>
                <div className="data-row-header">
                  <div>
                    <strong>{service.name}</strong>
                    <p className="muted">{service.category} - {service.code}</p>
                  </div>
                  <span className={`badge ${service.active ? "accent" : "warning"}`}>{service.active ? "Active" : "Inactive"}</span>
                </div>
                <div className="form-actions">
                  <label>
                    Price
                    <input
                      defaultValue={String(service.price)}
                      onBlur={(event) => {
                        if (event.target.value !== String(service.price)) {
                          void updateService(service, { price: event.target.value });
                        }
                      }}
                      type="number"
                    />
                  </label>
                  <button className="button secondary compact" onClick={() => void updateService(service, { active: !service.active })} type="button">
                    {service.active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Safety Settings</h2>
            <span className="badge danger">Protected</span>
          </div>
          <ul className="feature-list">
            <li>Audit logs cannot be deleted from the app.</li>
            <li>Signed clinical records cannot be silently hard-deleted.</li>
            <li>Admin override actions require a reason and confirmation.</li>
            <li>AI remains disabled, draft-only, and non-diagnostic.</li>
          </ul>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <h2>Users and Roles</h2>
            <span className="badge">{users.length} users</span>
          </div>
          <div className="data-list">
            {users.slice(0, 8).map((user) => (
              <article className="data-row" key={user.id}>
                <div className="data-row-header">
                  <strong>{user.displayName}</strong>
                  <span className="badge">{user.status}</span>
                </div>
                <p className="muted">{user.email} - {user.roles.join(", ") || "No role"}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Permissions Overview</h2>
            <span className="badge">{roles.length} roles</span>
          </div>
          <div className="data-list">
            {roles.map((role) => (
              <article className="data-row" key={role.id}>
                <strong>{role.name}</strong>
                <p className="muted">{role.permissions.length} permissions assigned.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Audit Log Viewer</h2>
          <span className="badge accent">Read only</span>
        </div>
        <div className="data-list">
          {(summary?.auditLogs ?? []).map((entry) => (
            <article className="data-row" key={entry.id}>
              <div className="data-row-header">
                <strong>{entry.action.replaceAll("_", " ")}</strong>
                <span className="badge">{entry.severity}</span>
              </div>
              <p className="muted">{entry.resourceType} - {new Date(entry.createdAt).toLocaleString()}</p>
              {entry.reason ? <p className="muted">Reason: {entry.reason}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className="muted">Local demo setting</p>
    </article>
  );
}
