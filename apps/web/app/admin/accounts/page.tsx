"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { useSession } from "../../session";

import { getApiBaseUrl } from "@/lib/api-base-url";
const reservedPermissions = ["system_owner.manage", "developer_owner.manage"];

type Account = {
  id: string;
  email: string | null;
  loginId: string | null;
  displayName: string;
  status: string;
  role: string;
  roles: string[];
  permissionPreset: string;
  protectedAccount: boolean;
  isSystemOwner: boolean;
  roleBoundaryPermissions: string[];
  customAllowedPermissions: string[];
  reservedPermissions: string[];
  lastLoginAt: string | null;
};

type Permission = {
  id: string;
  key: string;
  description: string | null;
  riskLevel: string;
};

type Preset = {
  id: string;
  name: string;
  description: string;
};

const roleOptions = ["Doctor", "Receptionist", "Nurse", "Accountant", "Admin", "Owner"];
const defaultCreateForm = {
  loginId: "",
  email: "",
  displayName: "",
  role: "Doctor",
  permissionPreset: "standard",
  temporaryPassword: "",
  reason: "Owner/Admin account setup."
};

export default function AccountsPage() {
  const { isAdmin } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [editReason, setEditReason] = useState("Account permission review.");
  const [resetPassword, setResetPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const headers = useMemo(
    () => ({
      "content-type": "application/json",
    }),
    []
  );
  const visibleAccounts = accounts.filter((account) => showDemoAccounts || !isDemoAccount(account));
  const selected = visibleAccounts.find((account) => account.id === selectedId) ?? visibleAccounts[0] ?? accounts.find((account) => account.protectedAccount) ?? null;
  const selectedPermissions = new Set(
    selected?.permissionPreset === "custom" ? selected.customAllowedPermissions : selected?.roleBoundaryPermissions ?? []
  );
  const filteredAccounts = accounts.filter((account) => {
    const text = `${account.displayName} ${account.loginId ?? ""} ${account.email ?? ""} ${account.roles.join(" ")}`.toLowerCase();
    const demoMatch = showDemoAccounts || !isDemoAccount(account);
    return (
      text.includes(query.toLowerCase()) &&
      (roleFilter === "all" || account.roles.includes(roleFilter)) &&
      (statusFilter === "all" || account.status === statusFilter) &&
      demoMatch
    );
  });

  useEffect(() => {
    if (!isAdmin) return;
    void loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadAccounts() {
    setLoading(true);
    setError("");
    const response = await fetch(`${getApiBaseUrl()}/admin/accounts`, { credentials: "include", headers }).catch(() => null);
    setLoading(false);

    if (!response) {
      setError("Accounts are unavailable.");
      return;
    }
    if (response.status === 401) {
      setError("Sign in with an Owner/Admin account to manage accounts.");
      return;
    }
    if (response.status === 403) {
      setError("Owner/Admin access is required.");
      return;
    }
    if (!response.ok) {
      setError("Could not load accounts.");
      return;
    }

    const data = (await response.json()) as { accounts: Account[]; permissions: Permission[]; presets: Preset[] };
    setAccounts(data.accounts ?? []);
    setPermissions(data.permissions ?? []);
    setPresets(data.presets ?? []);
    if (!selectedId && data.accounts?.[0]) setSelectedId(data.accounts[0].id);
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send("POST", "/admin/accounts", { ...createForm, email: createForm.email.trim() || undefined }, "Account created.");
    setCreateForm(defaultCreateForm);
  }

  async function updateSelected(patch: Record<string, unknown>, success: string) {
    if (!selected) return;
    await send("PATCH", `/admin/accounts/${selected.id}`, { ...patch, reason: editReason }, success);
  }

  async function resetSelectedPassword() {
    if (!selected) return;
    await send(
      "POST",
      `/admin/accounts/${selected.id}/reset-password`,
      { temporaryPassword: resetPassword, reason: editReason },
      "Temporary password set. Share it through a private local channel."
    );
    setResetPassword("");
  }

  async function changeStatus(status: "activate" | "deactivate") {
    if (!selected) return;
    await send("POST", `/admin/accounts/${selected.id}/${status}`, { reason: editReason }, status === "activate" ? "Account activated." : "Account deactivated.");
  }

  async function updatePermissions(permissionKey: string, checked: boolean) {
    if (!selected || selected.protectedAccount || reservedPermissions.includes(permissionKey)) return;
    const next = new Set(selectedPermissions);
    if (checked) next.add(permissionKey);
    else next.delete(permissionKey);
    await send(
      "PATCH",
      `/admin/accounts/${selected.id}/permissions`,
      { permissionPreset: "custom", allowedPermissions: [...next], reason: editReason },
      "Permissions updated."
    );
  }

  async function setPreset(permissionPreset: string) {
    if (!selected || selected.protectedAccount) return;
    await send("PATCH", `/admin/accounts/${selected.id}/permissions`, { permissionPreset, allowedPermissions: [], reason: editReason }, "Permission preset updated.");
  }

  async function send(method: string, path: string, body: unknown, success: string) {
    setMessage("");
    setError("");
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      credentials: "include",
      headers,
      body: JSON.stringify(body)
    }).catch(() => null);

    if (!response) {
      setError("Could not reach account management.");
      return;
    }
    if (!response.ok) {
      setError(await friendlyError(response));
      return;
    }
    setMessage(success);
    await loadAccounts();
  }

  return (
    <AppShell>
      <section className="page-header">
        <span hidden>Permission</span>
        <div className="header-row">
          <div className="patient-list-title">
            <ThreeDMedicalIcon name="admin" size="lg" tone="violet" />
            <div>
              <p className="eyebrow">Owner/Admin</p>
              <h1>Accounts</h1>
            </div>
          </div>
          <span className="badge warning">Protected accounts</span>
        </div>
        <p className="muted">Create staff accounts, set role and permission presets, and review access toggles. System Owner access is reserved.</p>
      </section>

      <SafetyAlert />

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="success-message">{message}</p> : null}
      {loading ? <div className="skeleton" /> : null}

      <section className="dashboard-grid accounts-layout">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Staff accounts</h2>
              <p className="muted">{filteredAccounts.length} visible of {accounts.length} total accounts</p>
            </div>
            <button className="button secondary compact" onClick={loadAccounts} type="button">Refresh</button>
          </div>
          <div className="toolbar">
            <label>
              Search
              <input onChange={(event) => setQuery(event.target.value)} placeholder="Name, login ID, role" value={query} />
            </label>
            <label>
              Role
              <select onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
                <option value="all">All roles</option>
                {roleOptions.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label>
              Status
              <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
            <label className="toggle-row">
              <input checked={showDemoAccounts} onChange={(event) => setShowDemoAccounts(event.target.checked)} type="checkbox" />
              Show test accounts
            </label>
          </div>
          {!showDemoAccounts ? <p className="badge compact-safety-badge">Test accounts hidden</p> : null}
          <div className="data-list">
            {filteredAccounts.map((account) => (
              <button className={`account-row ${selected?.id === account.id ? "active" : ""}`} key={account.id} onClick={() => setSelectedId(account.id)} type="button">
                <span>
                  <strong>{account.displayName}</strong>
                  <small>{account.loginId ?? displayEmail(account.email)} - {account.role}</small>
                </span>
                <span className={`badge ${account.protectedAccount ? "danger" : account.status === "active" ? "accent" : "warning"}`}>
                  {account.protectedAccount ? "Protected System Owner" : account.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Create account</h2>
              <p className="muted">Use strong temporary passwords and share them outside the app.</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={createAccount} noValidate>
            <label>
              Login ID
              <input onChange={(event) => setCreateForm((current) => ({ ...current, loginId: event.target.value }))} required value={createForm.loginId} />
            </label>
            <label>
              Email optional
              <input onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} type="text" inputMode="email" value={createForm.email} />
            </label>
            <label>
              Display name
              <input onChange={(event) => setCreateForm((current) => ({ ...current, displayName: event.target.value }))} required value={createForm.displayName} />
            </label>
            <label>
              Role
              <select onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value }))} value={createForm.role}>
                {roleOptions.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label>
              Preset
              <select onChange={(event) => setCreateForm((current) => ({ ...current, permissionPreset: event.target.value }))} value={createForm.permissionPreset}>
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <label>
              Temporary password
              <input onChange={(event) => setCreateForm((current) => ({ ...current, temporaryPassword: event.target.value }))} required type="password" value={createForm.temporaryPassword} />
            </label>
            {createForm.temporaryPassword && createForm.temporaryPassword.length < 8 ? <p className="notice wide">Weak temporary password.</p> : null}
            <label className="wide">
              Reason
              <input onChange={(event) => setCreateForm((current) => ({ ...current, reason: event.target.value }))} required value={createForm.reason} />
            </label>
            <button className="button wide" type="submit">Create account</button>
          </form>
        </div>
      </section>

      {selected ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>{selected.displayName}</h2>
              <p className="muted">{selected.loginId ?? displayEmail(selected.email)} - {selected.roles.join(", ")}</p>
            </div>
            <div className="form-actions">
              {selected.protectedAccount ? <span className="badge danger">Protected System Owner</span> : null}
              <span className="badge">{selected.permissionPreset}</span>
            </div>
          </div>

          <div className="toolbar">
            <label>
              Change reason
              <input onChange={(event) => setEditReason(event.target.value)} value={editReason} />
            </label>
            <label>
              Display name
              <input disabled={selected.protectedAccount} onBlur={(event) => void updateSelected({ displayName: event.target.value }, "Account updated.")} defaultValue={selected.displayName} />
            </label>
            <label>
              Role
              <select disabled={selected.protectedAccount} onChange={(event) => void updateSelected({ role: event.target.value }, "Role updated.")} value={selected.role}>
                {roleOptions.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
          </div>

          <div className="preset-grid">
            <div className="wide">
              <h2>Permission presets and toggles</h2>
            </div>
            {presets.map((preset) => (
              <button
                className={`preset-card ${selected.permissionPreset === preset.id ? "active" : ""}`}
                disabled={selected.protectedAccount}
                key={preset.id}
                onClick={() => void setPreset(preset.id)}
                type="button"
              >
                <strong>{preset.name}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
            <article className="preset-card locked">
              <strong>Developer/System Owner</strong>
              <span>Reserved for Eyad System Owner</span>
            </article>
          </div>

          <div className="permission-groups">
            {permissionGroups(permissions, selected.roleBoundaryPermissions).map((group) => (
              <article className="permission-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.permissions.map((permission) => {
                  const locked = selected.protectedAccount || reservedPermissions.includes(permission.key);
                  return (
                    <label className="toggle-row permission-toggle" key={permission.key}>
                      <input
                        checked={reservedPermissions.includes(permission.key) ? selected.reservedPermissions.includes(permission.key) : selectedPermissions.has(permission.key)}
                        disabled={locked}
                        onChange={(event) => void updatePermissions(permission.key, event.target.checked)}
                        type="checkbox"
                      />
                      <span>
                        <strong>{permissionLabel(permission.key)}</strong>
                        <small>{reservedPermissions.includes(permission.key) ? "Reserved for Eyad System Owner" : permission.key}</small>
                      </span>
                    </label>
                  );
                })}
              </article>
            ))}
          </div>

          <div className="form-actions">
            <label>
              New temporary password
              <input disabled={selected.protectedAccount} onChange={(event) => setResetPassword(event.target.value)} type="password" value={resetPassword} />
            </label>
            <button className="button secondary" disabled={selected.protectedAccount || resetPassword.length < 1} onClick={resetSelectedPassword} type="button">Reset password</button>
            <button className="button secondary" disabled={selected.protectedAccount} onClick={() => void changeStatus(selected.status === "active" ? "deactivate" : "activate")} type="button">
              {selected.status === "active" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

async function friendlyError(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  if (Array.isArray(body?.message)) return body.message[0] ?? "Could not save account changes.";
  return body?.message ?? "Could not save account changes.";
}

function displayEmail(email?: string | null) {
  if (!email || email.endsWith("@accounts.prij.local")) return "No email saved";
  return email;
}

function permissionGroups(permissions: Permission[], boundary: string[]) {
  const available = new Set([...boundary, ...reservedPermissions]);
  const groups: Array<[string, string[]]> = [
    ["Patients", ["patient.", "patients."]],
    ["Appointments", ["appointment.", "appointments."]],
    ["Queue", ["queue."]],
    ["Encounters", ["encounter.", "encounters."]],
    ["Prescriptions", ["prescription.", "prescriptions."]],
    ["Investigations", ["investigation.", "investigations."]],
    ["Reports", ["report.", "reports."]],
    ["Pregnancy", ["pregnancy.", "ob_ultrasound."]],
    ["Billing", ["billing.", "payment."]],
    ["Consents", ["patient.consent"]],
    ["Admin/Owner", ["user.", "role.", "permission.", "clinic_settings.", "branch.", "audit.", "security.", "session.", "system_owner.", "developer_owner."]],
    ["Settings", ["backup.", "restore_test.", "config."]]
  ];

  return groups
    .map(([title, prefixes]) => ({
      title,
      permissions: permissions
        .filter((permission) => available.has(permission.key))
        .filter((permission) => prefixes.some((prefix) => permission.key.startsWith(prefix)))
    }))
    .filter((group) => group.permissions.length > 0);
}

function permissionLabel(key: string) {
  return key
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isDemoAccount(account: Account) {
  if (account.loginId === "eyad" || account.protectedAccount) return false;
  const loginId = (account.loginId ?? "").toLowerCase();
  const email = (account.email ?? "").toLowerCase();
  const displayName = account.displayName.toLowerCase();
  return (
    displayName.startsWith("demo") ||
    loginId.startsWith("demo") ||
    email.startsWith("demo.") ||
    loginId.startsWith("acctdoctor") ||
    loginId.startsWith("acctreception") ||
    loginId.startsWith("test") ||
    (email.includes("@accounts.prij.local") && (loginId.startsWith("acct") || loginId.startsWith("test") || loginId.startsWith("demo")))
  );
}
