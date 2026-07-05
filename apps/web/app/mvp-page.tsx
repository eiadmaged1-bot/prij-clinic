"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigationRegistry, type NavItem } from "./navigation-registry";
import { useSession } from "./session";
import { useTheme } from "./theme";
import { IconName, ThreeDMedicalIcon } from "../components/ThreeDMedicalIcon";
import { UniversalSearchBox } from "../components/clinic/UniversalSearchBox";

type Field = {
  name: string;
  label: string;
  type?: "text" | "datetime-local" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  suggestionsEndpoint?: string;
  suggestionCollectionKey?: string;
  suggestionLabelKey?: string;
};

type MvpPageProps = {
  title: string;
  eyebrow: string;
  items: string[];
  endpoint?: string;
  collectionKey?: string;
  createEndpoint?: string;
  createFields?: Field[];
  createNote?: string;
  primaryAction?: [string, string];
};

import { getApiBaseUrl } from "@/lib/api-base-url";

const navGroupOrder: NavItem["group"][] = [
  "Today",
  "Patients",
  "Clinical",
  "Operations",
  "Knowledge",
  "Medication Reference",
  "Admin"
];

const displayKeys = [
  "medicalRecordNumber",
  "firstName",
  "lastName",
  "status",
  "appointmentType",
  "queueNumber",
  "title",
  "category",
  "invoiceNumber",
  "totalAmount",
  "method",
  "amount",
  "draftType",
  "reviewStatus"
];

export function MvpPage({
  title,
  eyebrow,
  items,
  endpoint,
  collectionKey,
  createEndpoint,
  createFields = [],
  createNote,
  primaryAction
}: MvpPageProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [status, setStatus] = useState("Not loaded yet");
  const [error, setError] = useState("");
  const [formState, setFormState] = useState<Record<string, string>>(() =>
    Object.fromEntries(createFields.map((field) => [field.name, field.defaultValue ?? ""]))
  );
  const [suggestionsByField, setSuggestionsByField] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("prijClinicToken");
  }, []);

  useEffect(() => {
    if (!endpoint) return;
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    for (const field of createFields) {
      if (field.suggestionsEndpoint) void loadSuggestions(field);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFields.map((field) => field.suggestionsEndpoint ?? "").join("|")]);

  async function loadRows() {
    if (!endpoint) return;

    setError("");
    setStatus("Loading records");

    try {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      });

      if (response.status === 401) {
        setStatus("Login required");
        setRows([]);
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load demo records.");
      }

      const data = (await response.json()) as Record<string, unknown>;
      const collection = collectionKey ? data[collectionKey] : data;
      setRows(Array.isArray(collection) ? (collection as Record<string, unknown>[]) : [data]);
      setStatus("Ready");
    } catch (loadError) {
      setRows([]);
      setStatus("Clinic service unavailable");
      setError(loadError instanceof Error ? loadError.message : "Unable to reach the clinic service.");
    }
  }

  async function loadSuggestions(field: Field) {
    if (!field.suggestionsEndpoint) return;
    try {
      const response = await fetch(`${getApiBaseUrl()}${field.suggestionsEndpoint}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      });
      if (!response.ok) return;
      const data = (await response.json()) as Record<string, unknown>;
      const collection = field.suggestionCollectionKey ? data[field.suggestionCollectionKey] : data;
      const labelKey = field.suggestionLabelKey ?? "name";
      const suggestions = Array.isArray(collection)
        ? collection.map((item) => (typeof item === "object" && item ? String((item as Record<string, unknown>)[labelKey] ?? "") : "")).filter(Boolean)
        : [];
      setSuggestionsByField((current) => ({ ...current, [field.name]: suggestions }));
    } catch {
      setSuggestionsByField((current) => ({ ...current, [field.name]: [] }));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createEndpoint) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${getApiBaseUrl()}${createEndpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(buildPayload(createFields, formState, createEndpoint))
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text ? "Could not save this demo record." : "Could not save this demo record.");
      }

      setFormState(Object.fromEntries(createFields.map((field) => [field.name, field.defaultValue ?? ""])));
      if (endpoint) await loadRows();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save demo record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 data-testid="page-heading">{title}</h1>
          </div>
          <div className="topbar-actions">
            {primaryAction ? (
              <Link className="button compact" href={primaryAction[0]}>
                <ThreeDMedicalIcon name="patients" size="sm" />
                {primaryAction[1]}
              </Link>
            ) : null}
            <span className="badge warning">Demo/local only</span>
            <span className="badge accent">AI disabled</span>
          </div>
        </div>
        <p className="muted">
          Use local training records only. This interface is for workflow review and is not ready for real patient use.
        </p>
      </section>

      <SafetyAlert />

      <section className="content-grid">
        <div className="panel compact-panel">
          <div className="section-heading">
            <div>
              <h2>Records</h2>
              <p className="muted">Status: {status}</p>
            </div>
            {endpoint ? (
              <button className="button secondary compact" onClick={loadRows} type="button">
                <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
                Refresh
              </button>
            ) : null}
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          {endpoint ? (
            <DataList rows={rows} status={status} />
          ) : (
            <EmptyState actionHref="/dashboard" actionLabel="Open dashboard" icon="files">
              No records are loaded for this workspace yet.
            </EmptyState>
          )}
        </div>

        <details className="collapsible-help-panel">
          <summary>How this works</summary>
          <ul className="feature-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </section>

      {createEndpoint && createFields.length > 0 ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Safe local form</h2>
              {createNote ? <p className="muted">{createNote}</p> : null}
            </div>
            <span className="badge warning">No real patient data</span>
          </div>
          <form className="form-grid" onSubmit={submit}>
            {createFields.map((field) => {
              const suggestions = suggestionsByField[field.name] ?? [];
              const datalistId = suggestions.length ? `${field.name}-suggestions` : undefined;
              return (
                <label key={field.name}>
                  {field.label}
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))}
                      required={field.required}
                      value={formState[field.name] ?? ""}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        list={datalistId}
                        name={field.name}
                        onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))}
                        placeholder={field.placeholder}
                        required={field.required}
                        type={field.type ?? "text"}
                        value={formState[field.name] ?? ""}
                      />
                      {datalistId ? (
                        <datalist id={datalistId}>
                          {suggestions.map((suggestion) => (
                            <option key={suggestion} value={suggestion} />
                          ))}
                        </datalist>
                      ) : null}
                    </>
                  )}
                </label>
              );
            })}
            <button className="button" disabled={isSubmitting} type="submit">
              <ThreeDMedicalIcon name="files" size="sm" />
              {isSubmitting ? "Saving record" : "Create record"}
            </button>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [comfort, setComfort] = useState("comfortable");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { doctorComfortMode, setDoctorComfortMode, theme } = useTheme();
  const { user, status, isAdmin, logout } = useSession();
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const canOpenAdmin = isAdmin;
  const canUseDoctorComfort = hasRole(roles, ["Owner", "Admin", "Doctor"]);
  const visibleNavGroups = navGroupOrder
    .map((group) => ({
      title: group,
      links: navigationRegistry
        .filter((item) => item.group === group && canSeeNavItem(item, roles, permissions, canOpenAdmin))
        .map((item) => [item.href, item.label, item.icon] as [string, string, IconName])
    }))
    .filter((group) => group.links.length > 0);

  useEffect(() => {
    setComfort(localStorage.getItem("prijDensityMode") ?? localStorage.getItem("prijComfortMode") ?? "comfortable");
    setSidebarCollapsed(localStorage.getItem("prijSidebarCollapsed") === "true");
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  function setComfortMode(next: string) {
    setComfort(next);
    localStorage.setItem("prijDensityMode", next);
    localStorage.setItem("prijComfortMode", next);
  }

  function toggleNavigation() {
    if (window.matchMedia("(max-width: 1199px)").matches) {
      setMobileNavOpen((open) => !open);
      return;
    }
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("prijSidebarCollapsed", String(next));
      return next;
    });
  }

  async function signOut() {
    await logout();
    router.push("/login");
  }

  return (
    <main className={`app-shell theme-${theme} comfort-${comfort} ${doctorComfortMode ? "doctor-comfort-mode" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} data-density={doctorComfortMode ? "large" : comfort}>
      <button
        aria-label="Close navigation"
        className={`mobile-nav-backdrop ${mobileNavOpen ? "open" : ""}`}
        onClick={() => setMobileNavOpen(false)}
        type="button"
      />
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`} id="clinic-mobile-navigation">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">P</span>
        <strong>Prij Clinic</strong>
          <span>Women&apos;s health</span>
        </Link>

        {visibleNavGroups.map((group) => (
          <nav className="nav-group" key={group.title} aria-label={group.title}>
            <div className="nav-group-title">{group.title}</div>
            {group.links.map(([href, label, icon]) => (
                <Link className={`nav-item ${isActive(pathname, href) ? "active" : ""}`} href={href} key={href} onClick={() => setMobileNavOpen(false)}>
                  <ThreeDMedicalIcon name={icon} size="sm" tone={group.title === "Clinical" ? "navy" : "teal"} />
                  <span>{label}</span>
                  <span className="nav-dot" />
                </Link>
            ))}
          </nav>
        ))}
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              aria-controls="clinic-mobile-navigation"
              aria-expanded={mobileNavOpen || !sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expand navigation menu" : "Collapse navigation menu"}
              className={`button secondary compact app-menu-button ${mobileNavOpen ? "active" : ""}`}
              onClick={toggleNavigation}
              type="button"
            >
              <ThreeDMedicalIcon name="dashboard" size="sm" tone="slate" />
              <span>Menu</span>
            </button>
            <strong className="mobile-topbar-brand">Prij Clinic</strong>
            <div>
            <p className="eyebrow">Clinic operations</p>
              <p className="muted">Patient files, queue, doctor workflow, finance, and owner controls.</p>
            </div>
          </div>
          <UniversalSearchBox />
          <div className="topbar-actions">
            <Link className="button compact" href="/patients/new">
              <ThreeDMedicalIcon name="patients" size="sm" />
              New Patient
            </Link>
            <span className="badge warning compact-safety-badge">Local Demo</span>
            {canUseDoctorComfort ? (
              <button className={`button secondary compact doctor-comfort-toggle ${doctorComfortMode ? "active" : ""}`} onClick={() => setDoctorComfortMode(!doctorComfortMode)} type="button">
                <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
                {doctorComfortMode ? "Comfort On" : "Doctor Comfort"}
              </button>
            ) : null}
            <div className="comfort-switch" aria-label="Display comfort">
              {["comfortable", "large", "compact"].map((mode) => (
                <button className={comfort === mode ? "active" : ""} key={mode} onClick={() => setComfortMode(mode)} type="button">
                  <ThreeDMedicalIcon name={mode === "large" ? "search" : mode === "compact" ? "settings" : "doctor"} size="sm" tone="slate" />
                  {mode === "comfortable" ? "Comfort" : mode === "large" ? "Large" : "Compact"}
                </button>
              ))}
            </div>
            <div className="user-menu" aria-label="Current user">
              <ThreeDMedicalIcon name={canOpenAdmin ? "admin" : "doctor"} size="sm" tone={canOpenAdmin ? "violet" : "slate"} />
              <div className="user-menu-copy">
                <strong>{user?.displayName ?? "Not signed in"}</strong>
                <span>{user ? `${primaryRole(user.roles)} role` : "Login required"}</span>
              </div>
              {user ? (
                <>
                  {canOpenAdmin ? (
                    <Link className="button secondary compact" href="/admin">
                      <ThreeDMedicalIcon name="admin" size="sm" tone="violet" />
                      Owner
                    </Link>
                  ) : null}
                  <button className="button secondary compact" onClick={signOut} type="button">
                    <ThreeDMedicalIcon name="settings" size="sm" tone="slate" />
                    Logout
                  </button>
                </>
              ) : (
                <Link className="button secondary compact" href="/login">
                  <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function SafetyAlert() {
  return (
    <section className="alert">
      <div>
        <strong>Local workflow review only - no real patient data.</strong>
        <p className="muted">
          AI remains assistive and draft-only. It cannot diagnose, prescribe, sign, update final records, or bypass doctor review.
        </p>
      </div>
      <div className="safety-badge-stack" aria-label="Safety status">
        <span className="badge danger compact-safety-badge">Demo only</span>
        <span className="badge warning compact-safety-badge">AI draft-only</span>
        <span className="badge compact-safety-badge">Doctor review</span>
      </div>
    </section>
  );
}

function DataList({ rows, status }: { rows: Record<string, unknown>[]; status: string }) {
  if (status === "Loading records") {
    return <div className="skeleton" aria-label="Loading records" />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState actionHref="/patients/new" actionLabel="Create patient">
        No records yet. Start with a patient record or refresh after creating a record.
      </EmptyState>
    );
  }

  return (
    <div className="data-list">
      {rows.slice(0, 12).map((row, index) => (
        <article className="data-row" key={String(row.id ?? index)}>
          <div className="data-row-header">
            {row.id && row.medicalRecordNumber ? (
              <Link href={`/patients/${String(row.id)}`}>
                <strong>{rowLabel(row)}</strong>
              </Link>
            ) : (
              <strong>{rowLabel(row)}</strong>
            )}
            <span className="badge">{String(row.status ?? row.reviewStatus ?? row.category ?? "record")}</span>
          </div>
          <dl>
            {displayKeys
              .filter((key) => row[key] !== undefined && row[key] !== null && row[key] !== "")
              .slice(0, 6)
              .map((key) => (
                <div key={key}>
                  <dt>{labelize(key)}</dt>
                  <dd>{formatRecordValue(key, row[key])}</dd>
                </div>
              ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ children, icon = "files", actionHref, actionLabel }: { children: ReactNode; icon?: IconName; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="empty-state smart-empty-state">
      <ThreeDMedicalIcon name={icon} size="sm" tone="slate" />
      <span>{children}</span>
      {actionHref && actionLabel ? <Link className="button secondary compact" href={actionHref}>{actionLabel}</Link> : null}
    </div>
  );
}

function rowLabel(row: Record<string, unknown>) {
  return String(row.displayName ?? row.invoiceNumber ?? row.title ?? row.medicalRecordNumber ?? row.id ?? "Record");
}

function labelize(value: string) {
  const friendly: Record<string, string> = {
    medicalRecordNumber: "File number",
    appointmentType: "Visit type",
    queueNumber: "Queue number",
    invoiceNumber: "Invoice number",
    totalAmount: "Total",
    draftType: "Draft type",
    reviewStatus: "Review status"
  };

  return friendly[value] ?? value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function buildPayload(fields: Field[], state: Record<string, string>, createEndpoint?: string) {
  if (createEndpoint === "/investigations/orders") {
    return {
      patientId: state.patientId?.trim(),
      encounterId: state.encounterId?.trim() || undefined,
      priority: state.priority?.trim() || "routine",
      notes: state.notes?.trim() || undefined,
      items: [
        {
          category: state.category?.trim() || "laboratory",
          testName: state.testName?.trim(),
          instructions: state.instructions?.trim() || undefined
        }
      ]
    };
  }

  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const value = state[field.name]?.trim();
    if (!value) continue;
    if (field.type === "number") payload[field.name] = Number(value);
    else if (field.type === "datetime-local") payload[field.name] = new Date(value).toISOString();
    else payload[field.name] = value;
  }

  return payload;
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function primaryRole(roles: string[]) {
  return roles[0] ?? "Staff";
}

function hasAnyPermission(permissions: string[], keys: string[]) {
  return keys.some((key) => permissions.includes(key));
}

function formatRecordValue(key: string, value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleString();
  const text = String(value ?? "");
  if (!text) return "Not recorded";
  if ((key.endsWith("At") || key.toLowerCase().includes("date")) && /^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: text.includes("T") ? "short" : undefined });
  }
  if (["totalAmount", "amount", "balanceAmount", "amountPaid"].includes(key)) {
    const amount = Number(text);
    if (!Number.isNaN(amount)) return amount.toFixed(2);
  }
  return text.replaceAll("_", " ");
}

const receptionistNav = new Set([
  "/dashboard",
  "/reception/today",
  "/reception/check-in",
  "/queue",
  "/calendar",
  "/patients",
  "/patients/new",
  "/tasks",
  "/documents"
]);

const doctorNav = new Set([
  "/dashboard",
  "/doctor",
  "/doctor/waiting",
  "/patients",
  "/doctor/visit",
  "/prescriptions",
  "/investigations",
  "/ultrasound",
  "/encounters",
  "/medications",
  "/guidelines",
  "/protocol-atlas",
  "/ai-assistant",
  "/ai-drafts"
]);

function hasRole(roles: string[], names: string[]) {
  return roles.some((role) => names.includes(role));
}

function canSeeNavItem(item: NavItem, roles: string[], permissions: string[], canOpenAdmin: boolean) {
  if (item.adminOnly) return canOpenAdmin;
  if (item.roles?.length && !item.roles.some((role) => roles.includes(role))) return false;
  if (item.permissions?.length && !hasAnyPermission(permissions, item.permissions)) return false;
  if (hasRole(roles, ["Owner", "Admin"])) return true;
  if (hasRole(roles, ["Reception", "Receptionist"])) return receptionistNav.has(item.href);
  if (hasRole(roles, ["Doctor"])) return doctorNav.has(item.href);
  return true;
}
