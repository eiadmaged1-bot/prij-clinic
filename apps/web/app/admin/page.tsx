"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, SafetyAlert } from "../mvp-page";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { clearSyncedOfflineOperations, listOfflineOperations, useOfflineSyncQueue } from "@/lib/autosave-draft";

type ServiceItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: string | null;
  currency: string;
  active: boolean;
  costAmount?: string | null;
  doctorShareAmount?: string | null;
  reviewStatus?: string;
};

type MedicationReadiness = {
  officialRows: number;
  verifiedRows: number;
  status: string;
  warning?: string | null;
};

type SafeUser = {
  id: string;
  email: string | null;
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

type SyncHealthSummary = {
  total: number;
  pending: number;
  failed: number;
  synced: number;
  lastAttemptAt: string | null;
  entityTypes: string[];
};

const emptyService = {
  code: "",
  name: "",
  category: "Consultation",
  price: "",
  currency: "EGP",
  costAmount: "",
  doctorShareAmount: ""
};

export default function AdminPage() {
  const [summary, setSummary] = useState<ControlSummary | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [medicationReadiness, setMedicationReadiness] = useState<MedicationReadiness | null>(null);
  const [form, setForm] = useState(emptyService);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncHealth, setSyncHealth] = useState<SyncHealthSummary>({ total: 0, pending: 0, failed: 0, synced: 0, lastAttemptAt: null, entityTypes: [] });
  const [userSearch, setUserSearch] = useState("");
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  const [showReadAuditEvents, setShowReadAuditEvents] = useState(false);

  const token = useMemo(() => (typeof window === "undefined" ? null : sessionStorage.getItem("prijClinicToken")), []);
  const apiBaseUrl = useMemo(() => (typeof window === "undefined" ? "" : getApiBaseUrl()), []);
  const syncQueue = useOfflineSyncQueue(apiBaseUrl, token);
  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }),
    [token]
  );
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users
      .filter((user) => showDemoUsers || !isDemoUser(user))
      .filter((user) => !query || [user.displayName, user.email ?? "", user.roles.join(" ")].some((value) => value.toLowerCase().includes(query)));
  }, [showDemoUsers, userSearch, users]);
  const visibleAuditLogs = useMemo(() => (summary?.auditLogs ?? []).filter((entry) => showReadAuditEvents || !isReadAuditEvent(entry.action)), [showReadAuditEvents, summary]);

  useEffect(() => {
    void loadAdmin();
    void loadSyncHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAdmin() {
    setLoading(true);
    setError("");
    try {
      const [summaryResponse, servicesResponse, usersResponse, rolesResponse, medicationResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/admin/control-center`, { credentials: "include", headers }),
        fetch(`${apiBaseUrl}/admin/services`, { credentials: "include", headers }),
        fetch(`${apiBaseUrl}/admin/users`, { credentials: "include", headers }),
        fetch(`${apiBaseUrl}/admin/roles`, { credentials: "include", headers }),
        fetch(`${apiBaseUrl}/reference/medication-readiness`, { credentials: "include", headers })
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
      if (medicationResponse.ok) setMedicationReadiness((await medicationResponse.json()) as MedicationReadiness);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Admin.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSyncHealth() {
    const operations = await listOfflineOperations();
    const lastAttemptAt = operations
      .map((operation) => operation.lastAttemptAt ?? operation.createdAt)
      .sort()
      .at(-1) ?? null;
    setSyncHealth({
      total: operations.length,
      pending: operations.filter((operation) => operation.status === "pending").length,
      failed: operations.filter((operation) => operation.status === "failed").length,
      synced: operations.filter((operation) => operation.status === "synced").length,
      lastAttemptAt,
      entityTypes: Array.from(new Set(operations.map((operation) => operation.entityType))).sort()
    });
  }

  async function syncNowFromOwnerCenter() {
    await syncQueue.syncNow();
    await loadSyncHealth();
  }

  async function clearSyncedFromOwnerCenter() {
    if (!window.confirm("Clear synced local queue entries from this browser? Pending and failed drafts stay protected.")) return;
    const cleared = await clearSyncedOfflineOperations();
    setMessage(`Cleared ${cleared} synced local queue entr${cleared === 1 ? "y" : "ies"}.`);
    await loadSyncHealth();
  }

  function exportSyncDiagnostic() {
    const diagnostic = {
      generatedAt: new Date().toISOString(),
      pending: syncHealth.pending,
      failed: syncHealth.failed,
      synced: syncHealth.synced,
      total: syncHealth.total,
      lastAttemptAt: syncHealth.lastAttemptAt,
      entityTypes: syncHealth.entityTypes
    };
    const blob = new Blob([JSON.stringify(diagnostic, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prij-sync-diagnostic.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/services`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          ...form,
          price: form.price ? Number(form.price) : undefined,
          costAmount: form.costAmount ? Number(form.costAmount) : undefined,
          doctorShareAmount: form.doctorShareAmount ? Number(form.doctorShareAmount) : undefined
        })
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
    const needsReason = patch.price !== undefined || patch.active !== undefined;
    const reason = needsReason ? window.prompt("Reason for this service change")?.trim() : undefined;
    if (needsReason && !reason) {
      setError("A reason is required for service price or status changes.");
      return;
    }
    const response = await fetch(`${getApiBaseUrl()}/admin/services/${service.id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({
        ...patch,
        reason,
        ...(patch.price !== undefined ? { price: Number(patch.price) } : {}),
        ...(patch.costAmount !== undefined ? { costAmount: patch.costAmount === "" ? undefined : Number(patch.costAmount) } : {}),
        ...(patch.doctorShareAmount !== undefined ? { doctorShareAmount: patch.doctorShareAmount === "" ? undefined : Number(patch.doctorShareAmount) } : {})
      })
    });
    if (!response.ok) {
      setError("Could not update service.");
      return;
    }
    setMessage("Service updated and audited.");
    await loadAdmin();
  }

  async function changeServiceStatus(service: ServiceItem) {
    const reason = window.prompt(`Reason to ${service.active ? "deactivate" : "reactivate"} this service`)?.trim();
    if (!reason) {
      setError("A reason is required for service status changes.");
      return;
    }
    if (!window.confirm("Confirm this service status change")) return;
    setMessage("");
    setError("");
    const action = service.active ? "deactivate" : "reactivate";
    const response = await fetch(`${getApiBaseUrl()}/admin/services/${service.id}/${action}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ reason, confirmation: "CONFIRM" })
    });
    if (!response.ok) {
      setError("Could not change service status.");
      return;
    }
    setMessage("Service status changed and audited.");
    await loadAdmin();
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Owner tools</p>
            <h1>Owner Control Center</h1>
          </div>
          <span className="badge warning">Protected admin</span>
        </div>
        <p className="muted">Manage demo settings, staff visibility, service prices, themes, safety controls, and audit review from the app.</p>
      </section>

      <SafetyAlert />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="success-message">{message}</p> : null}
      {loading ? <div className="skeleton" /> : null}

      {summary ? (
        <section className="summary-grid">
          <Metric label="Visible staff users" value={filteredUsers.length} />
          <Metric label="Roles" value={summary.summary.roles ?? "-"} />
          <Metric label="Services" value={summary.summary.services ?? "-"} />
          <Metric label="Official medication rows" value={medicationReadiness?.officialRows ?? "-"} />
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Appearance</h2>
            <p className="muted">Switch between Original Premium, Clinic Portal, Incision Portal, Minimal Clean, and Compact Operations.</p>
          </div>
          <Link className="button compact" href="/admin/appearance">
            Open Appearance
          </Link>
        </div>
      </section>

      <section className="module-grid">
        {[
          { href: "/clinic-day/walkthrough", label: "Clinic walkthrough", description: "Run the connected local training clinic day from owner setup through print packet." },
          { href: "/admin/accounts", label: "Staff and permissions", description: "Create staff, review roles, and keep owner access protected." },
          { href: "/admin/services", label: "Services and prices", description: "Adjust service catalog controls with reason-required audit." },
          { href: "/admin/security-readiness", label: "Security readiness", description: "Review real patient data readiness gates, blockers, and safety posture." },
          { href: "/admin/appearance", label: "Appearance", description: "Set the default clinic look and local browser preference." },
          { href: "/admin/audit", label: "Audit logs", description: "Review clinical, account, and owner-control activity." },
          { href: "/admin/settings", label: "Clinic setup", description: "Profile, rooms, branches, templates, and safety settings." },
          { href: "/admin/drug-market", label: "Medicine data controls", description: "Reference import/review tools without patient dosing automation." }
        ].map((item) => (
          <Link className="module-card" href={item.href} key={item.href}>
            <strong>{item.label}</strong>
            <span className="muted">{item.description}</span>
          </Link>
        ))}
      </section>

      <section className="module-grid">
        {[
          ["Clinic Profile", "Clinic name, branch identity, and contact details are planned for a guarded settings flow."],
          ["Branches and Rooms", "Branch and room setup is planned. No production scheduling policy is changed here."],
          ["Billing Settings", "Service prices, cost placeholders, and doctor share placeholders are active now. Taxes and gateways remain future work."],
          ["Medication Data Operations", medicationReadiness ? `${medicationReadiness.officialRows} official rows, ${medicationReadiness.verifiedRows} verified rows. ${medicationReadiness.warning ?? "Rows remain review-gated."}` : "Medication readiness is reported from the reference API when available."],
          ["Backup and Export Status", "The official medication export and isolated restore drill passed in v0.8.6. Local export files remain ignored."],
          ["Demo Data Tools", "Local reset tools remain guarded scripts. No automatic reset runs from this screen."],
          ["Feature Flags", "AI stays disabled and draft-only. Future flags must remain audited and owner-controlled."],
          ["Safe Force Actions", "Force actions require a reason and audit entry. Signed clinical records are not silently hard-deleted."],
          ["Safety Settings", "Audit logs cannot be deleted from normal UI and clinical changes remain auditable."]
        ].map(([label, description]) => (
          <article className="module-card" key={label}>
            <strong>{label}</strong>
            <span className="muted">{description}</span>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Autosave and Sync Health</h2>
            <p className="muted">This browser only. Diagnostic export excludes draft payloads and patient details.</p>
          </div>
          <span className={`badge ${syncHealth.failed ? "warning" : syncHealth.pending ? "accent" : ""}`}>
            {syncHealth.pending + syncHealth.failed} pending
          </span>
        </div>
        <div className="summary-grid">
          <Metric label="Pending local drafts" value={syncHealth.pending} />
          <Metric label="Failed sync attempts" value={syncHealth.failed} />
          <Metric label="Synced local entries" value={syncHealth.synced} />
          <Metric label="Last sync check" value={syncHealth.lastAttemptAt ? new Date(syncHealth.lastAttemptAt).toLocaleString() : "No local sync yet"} />
        </div>
        <p className="muted">Tracked draft areas: {syncHealth.entityTypes.length ? syncHealth.entityTypes.join(", ") : "None on this browser"}.</p>
        <div className="form-actions">
          <button className="button secondary compact" disabled={syncQueue.isSyncing} onClick={() => void syncNowFromOwnerCenter()} type="button">
            {syncQueue.isSyncing ? "Syncing..." : "Sync now"}
          </button>
          <button className="button secondary compact" onClick={() => void clearSyncedFromOwnerCenter()} type="button">
            Clear synced entries
          </button>
          <button className="button secondary compact" onClick={exportSyncDiagnostic} type="button">
            Export diagnostic
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Service Catalog and Prices</h2>
              <p className="muted">Add services, edit prices, set finance placeholders, and deactivate services. No payment gateway is connected.</p>
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
              <input min="0" onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} type="number" value={form.price} />
            </label>
            <label>
              Cost placeholder
              <input min="0" onChange={(event) => setForm((current) => ({ ...current, costAmount: event.target.value }))} type="number" value={form.costAmount} />
            </label>
            <label>
              Doctor share placeholder
              <input min="0" onChange={(event) => setForm((current) => ({ ...current, doctorShareAmount: event.target.value }))} type="number" value={form.doctorShareAmount} />
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
                      defaultValue={service.price === null ? "" : String(service.price)}
                      placeholder={service.price === null ? "Review required" : undefined}
                      onBlur={(event) => {
                        if (event.target.value !== String(service.price ?? "")) {
                          void updateService(service, { price: event.target.value });
                        }
                      }}
                      type="number"
                    />
                  </label>
                  <label>
                    Cost
                    <input
                      defaultValue={service.costAmount ? String(service.costAmount) : ""}
                      onBlur={(event) => {
                        if (event.target.value !== String(service.costAmount ?? "")) {
                          void updateService(service, { costAmount: event.target.value } as Partial<ServiceItem>);
                        }
                      }}
                      type="number"
                    />
                  </label>
                  <label>
                    Doctor share
                    <input
                      defaultValue={service.doctorShareAmount ? String(service.doctorShareAmount) : ""}
                      onBlur={(event) => {
                        if (event.target.value !== String(service.doctorShareAmount ?? "")) {
                          void updateService(service, { doctorShareAmount: event.target.value } as Partial<ServiceItem>);
                        }
                      }}
                      type="number"
                    />
                  </label>
                  <button className="button secondary compact" onClick={() => void changeServiceStatus(service)} type="button">
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
            <div>
              <h2>Users and Roles</h2>
              <p className="muted">Search staff without opening code-like permission lists.</p>
            </div>
            <span className="badge">{filteredUsers.length} users</span>
          </div>
          <label>
            Search staff
            <input onChange={(event) => setUserSearch(event.target.value)} placeholder="Name, email, or role" value={userSearch} />
          </label>
          <label className="toggle-row">
            <input checked={showDemoUsers} onChange={(event) => setShowDemoUsers(event.target.checked)} type="checkbox" />
            Show test accounts
          </label>
          {!showDemoUsers ? <p className="badge compact-safety-badge">Test accounts hidden</p> : null}
          <div className="data-list">
            {filteredUsers.slice(0, 8).map((user) => (
              <article className="data-row" key={user.id}>
                <div className="data-row-header">
                  <strong>{user.displayName}</strong>
                  <span className="badge">{user.status}</span>
                </div>
                <p className="muted">{displayEmail(user.email)} - {user.roles.join(", ") || "No role"}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Access Overview</h2>
            <span className="badge">{roles.length} roles</span>
          </div>
          <div className="role-compact-grid">
            {roles.map((role) => (
              <article className="role-compact-card" key={role.id}>
                <strong>{role.name}</strong>
                <span className="badge">{role.permissions.length} rules</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Audit Log Viewer</h2>
          <label className="toggle-row">
            <input checked={showReadAuditEvents} onChange={(event) => setShowReadAuditEvents(event.target.checked)} type="checkbox" />
            Show read events
          </label>
        </div>
        {!showReadAuditEvents ? <p className="badge compact-safety-badge">Read/view events hidden</p> : null}
        <div className="data-list">
          {visibleAuditLogs.map((entry) => (
            <article className="data-row" key={entry.id}>
              <div className="data-row-header">
                <strong>{auditLabel(entry.action, entry.resourceType)}</strong>
                <span className="badge">{entry.severity}</span>
              </div>
              <p className="muted">{humanResourceType(entry.resourceType)} - {new Date(entry.createdAt).toLocaleString()}</p>
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
      <p className="muted">Shared setting</p>
    </article>
  );
}

function auditLabel(action: string, resourceType: string) {
  if (action === "admin.users.read") return "User list viewed";
  if (action === "admin.accounts.read") return "Account list viewed";
  if (action === "admin.appearance.read") return "Appearance settings viewed";
  const normalized = `${resourceType}.${action}`.toLowerCase();
  if (normalized.includes("admin") && normalized.includes("control")) return "Owner opened Control Center";
  if (normalized.includes("user") && normalized.includes("list")) return "User list viewed";
  if (normalized.includes("role") || normalized.includes("permission")) return "Role permissions viewed";
  if (normalized.includes("patient") && normalized.includes("update")) return "Patient file updated";
  if (normalized.includes("draft") && normalized.includes("save")) return "Draft autosaved";
  if (normalized.includes("investigation")) return "Investigation request updated";
  if (normalized.includes("service")) return "Service catalog updated";
  return action.replaceAll("_", " ").replaceAll(".", " ");
}

function isReadAuditEvent(action: string) {
  const value = action.toLowerCase();
  return value.endsWith(".read") || value.includes(".view");
}

function isDemoUser(user: SafeUser) {
  const displayName = user.displayName.toLowerCase();
  const email = (user.email ?? "").toLowerCase();
  const loginLike = email.split("@")[0] ?? "";
  return displayName.startsWith("demo") || email.startsWith("demo.") || email.includes("test") || (email.includes("@accounts.prij.local") && (loginLike.startsWith("acct") || loginLike.startsWith("test") || loginLike.startsWith("demo")));
}

function displayEmail(email?: string | null) {
  if (!email || email.endsWith("@accounts.prij.local")) return "No email saved";
  return email;
}

function humanResourceType(resourceType: string) {
  return resourceType
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
