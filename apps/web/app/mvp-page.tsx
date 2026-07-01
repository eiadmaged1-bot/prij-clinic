"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigationRegistry, type NavItem } from "./navigation-registry";
import { useSession } from "./session";
import { useTheme } from "./theme";
import { IconName, ThreeDMedicalIcon } from "../components/ThreeDMedicalIcon";

type Field = {
  name: string;
  label: string;
  type?: "text" | "datetime-local" | "number";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
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

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const navGroupOrder: NavItem["group"][] = [
  "Dashboard",
  "Patients",
  "Doctor workflow",
  "Reception queue",
  "Calendar",
  "Finance",
  "Orders",
  "Medications",
  "Admin / Owner Control"
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

  async function loadRows() {
    if (!endpoint) return;

    setError("");
    setStatus("Loading records");

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createEndpoint) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}${createEndpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(buildPayload(createFields, formState))
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
            <h1>{title}</h1>
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
          Use fake demo records only. This V0.1 interface is for local workflow review and is not ready for real patient use.
        </p>
      </section>

      <SafetyAlert />

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
              <h2>{title} focus</h2>
            <span className="badge">V0.1</span>
          </div>
          <ul className="feature-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Demo records</h2>
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
          {endpoint ? <DataList rows={rows} status={status} /> : <EmptyState icon="files">This page is ready for new demo entries.</EmptyState>}
        </div>
      </section>

      {createEndpoint && createFields.length > 0 ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Safe demo form</h2>
              {createNote ? <p className="muted">{createNote}</p> : null}
            </div>
            <span className="badge warning">No real data</span>
          </div>
          <form className="form-grid" onSubmit={submit}>
            {createFields.map((field) => (
              <label key={field.name}>
                {field.label}
                <input
                  name={field.name}
                  onChange={(event) => setFormState((current) => ({ ...current, [field.name]: event.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                  type={field.type ?? "text"}
                  value={formState[field.name] ?? ""}
                />
              </label>
            ))}
            <button className="button" disabled={isSubmitting} type="submit">
              <ThreeDMedicalIcon name="files" size="sm" />
              {isSubmitting ? "Saving demo record" : "Create demo record"}
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
  const { theme } = useTheme();
  const { user, status, isAdmin, logout } = useSession();
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const canOpenAdmin = isAdmin;
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
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  function setComfortMode(next: string) {
    setComfort(next);
    localStorage.setItem("prijDensityMode", next);
    localStorage.setItem("prijComfortMode", next);
  }

  async function signOut() {
    await logout();
    router.push("/login");
  }

  return (
    <main className={`app-shell theme-${theme} comfort-${comfort}`} data-density={comfort}>
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">P</span>
          <strong>Prij Clinic OS</strong>
          <span>Women&apos;s health</span>
        </Link>

        {visibleNavGroups.map((group) => (
          <nav className="nav-group" key={group.title} aria-label={group.title}>
            <div className="nav-group-title">{group.title}</div>
            {group.links.map(([href, label, icon]) => (
                <Link className={`nav-item ${isActive(pathname, href) ? "active" : ""}`} href={href} key={href}>
                  <ThreeDMedicalIcon name={icon} size="sm" tone={group.title === "Doctor workflow" ? "navy" : "teal"} />
                  <span>{label}</span>
                  <span className="nav-dot" />
                </Link>
            ))}
          </nav>
        ))}
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Clinic operations</p>
            <p className="muted">Patient files, queue, doctor workflow, finance, and owner controls.</p>
          </div>
          <label className="portal-search" aria-label="Search patient files">
            <span>Patient search</span>
            <input placeholder="Name, file number, phone, or appointment" />
          </label>
          <div className="topbar-actions">
            <Link className="button compact" href="/patients/new">
              <ThreeDMedicalIcon name="patients" size="sm" />
              New Patient
            </Link>
            <span className="badge warning">Local Demo</span>
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
        <strong>Local demo only - no real patient data.</strong>
        <p className="muted">
          AI remains assistive and draft-only. It cannot diagnose, prescribe, sign, update final records, or bypass doctor review.
        </p>
      </div>
      <span className="badge danger">Not production-ready</span>
    </section>
  );
}

function DataList({ rows, status }: { rows: Record<string, unknown>[]; status: string }) {
  if (status === "Loading records") {
    return <div className="skeleton" aria-label="Loading demo records" />;
  }

  if (rows.length === 0) {
    return <EmptyState>No demo records yet. Sign in and use the local demo data before workflow review.</EmptyState>;
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
            <span className="badge">{String(row.status ?? row.reviewStatus ?? row.category ?? "demo")}</span>
          </div>
          <dl>
            {displayKeys
              .filter((key) => row[key] !== undefined && row[key] !== null && row[key] !== "")
              .slice(0, 6)
              .map((key) => (
                <div key={key}>
                  <dt>{labelize(key)}</dt>
                  <dd>{String(row[key])}</dd>
                </div>
              ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ children, icon = "files" }: { children: ReactNode; icon?: IconName }) {
  return (
    <p className="empty-state">
      <ThreeDMedicalIcon name={icon} size="sm" tone="slate" />
      <span>{children}</span>
    </p>
  );
}

function rowLabel(row: Record<string, unknown>) {
  return String(row.displayName ?? row.invoiceNumber ?? row.title ?? row.medicalRecordNumber ?? row.id ?? "Demo row");
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

function buildPayload(fields: Field[], state: Record<string, string>) {
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

function canSeeNavItem(item: NavItem, roles: string[], permissions: string[], canOpenAdmin: boolean) {
  if (item.adminOnly) return canOpenAdmin;
  if (item.roles?.length && !item.roles.some((role) => roles.includes(role))) return false;
  if (item.permissions?.length && !hasAnyPermission(permissions, item.permissions)) return false;
  return true;
}
