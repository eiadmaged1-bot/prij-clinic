"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "./session";
import { useTheme } from "./theme";
import { IconName, ThreeDMedicalIcon } from "../components/ThreeDMedicalIcon";
import { navigationRegistry, type NavItem } from "./navigation-registry";
import { type DensityMode, normalizeDensityMode } from "../lib/theme-registry";

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
            <span className="badge warning">Local Demo Mode</span>
            <span className="badge accent">Doctor review required</span>
          </div>
        </div>
        <p className="muted">
          Use fake demo records only. This workspace is for local workflow review and is not ready for real patient use.
        </p>
      </section>

      <SafetyAlert />

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
              <h2>{title} focus</h2>
            <span className="badge">Workflow</span>
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
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const { theme } = useTheme();
  const { user, status, isAdmin, logout } = useSession();
  const isDoctor = Boolean(user?.roles.includes("Doctor"));
  const canOpenAdmin = isAdmin;
  const visibleNavGroups = useMemo(
    () => groupNavItems(navigationRegistry.filter((item) => canSeeNavItem(item, user?.permissions ?? [], user?.roles ?? [], canOpenAdmin))),
    [canOpenAdmin, user?.permissions, user?.roles]
  );

  useEffect(() => {
    const stored = localStorage.getItem("prijDensityMode");
    setDensity(normalizeDensityMode(stored));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  function setDensityMode(next: DensityMode) {
    setDensity(next);
    localStorage.setItem("prijDensityMode", next);
  }

  async function signOut() {
    await logout();
    router.push("/login");
  }

  return (
    <main className={`app-shell theme-${theme}`} data-density={density}>
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">PC</span>
          <strong>Prij Clinic</strong>
          <span>Local Demo Mode</span>
        </Link>

        {visibleNavGroups.map((group) => (
          <nav className="nav-group" key={group.title} aria-label={group.title}>
            <div className="nav-group-title">{group.title}</div>
            {group.links
              .filter((item) => !isDoctor || canOpenAdmin || !["/admin", "/admin/appearance", "/billing"].includes(item.href))
              .map((item) => (
                <Link className={`nav-item ${isActive(pathname, item.href) ? "active" : ""}`} href={item.href} key={item.href}>
                  <ThreeDMedicalIcon name={item.icon} size="sm" tone={group.title === "Admin" ? "violet" : group.title === "Clinical" ? "navy" : "teal"} />
                  <span>{item.label}</span>
                  <span className="nav-dot" />
                </Link>
              ))}
          </nav>
        ))}
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Clinic workspace</p>
            <p className="muted">Use demo records only. Clinical decisions stay doctor-led.</p>
          </div>
          <label className="portal-search" aria-label="Search patient files">
            <span>Search</span>
            <input placeholder="Find patient file or appointment" />
          </label>
          <div className="topbar-actions">
            <div className="comfort-switch" aria-label="Display density">
              {(["compact", "comfortable", "large", "magnified"] as DensityMode[]).map((mode) => (
                <button className={density === mode ? "active" : ""} key={mode} onClick={() => setDensityMode(mode)} type="button" aria-pressed={density === mode}>
                  <ThreeDMedicalIcon name={mode === "large" || mode === "magnified" ? "search" : mode === "compact" ? "settings" : "doctor"} size="sm" tone="slate" />
                  {mode === "comfortable" ? "Comfort" : mode === "magnified" ? "Magnify" : mode[0]!.toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <div className="user-menu" aria-label="Current user">
              <ThreeDMedicalIcon name={canOpenAdmin ? "admin" : "doctor"} size="sm" tone={canOpenAdmin ? "violet" : "slate"} />
              <div className="user-menu-copy">
                <strong>{user?.displayName ?? "Not signed in"}</strong>
                <span>{user ? `${user.loginId ?? user.email} - ${user.roles.join(", ") || "Staff"}` : "Login required"}</span>
              </div>
              {user ? (
                <>
                  <Link className="button secondary compact" href="/dashboard">
                    <ThreeDMedicalIcon name="dashboard" size="sm" tone="slate" />
                    Dashboard
                  </Link>
                  {canOpenAdmin ? (
                    <Link className="button secondary compact" href="/admin/accounts">
                      <ThreeDMedicalIcon name="reception" size="sm" tone="violet" />
                      Accounts
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
            <Link className="button secondary compact" href="/">
              <ThreeDMedicalIcon name="dashboard" size="sm" tone="slate" />
              Home
            </Link>
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
        <strong>Demo/local only - no real patient data.</strong>
        <p className="muted">
          AI draft tools remain off or doctor-reviewed. They cannot diagnose, prescribe, sign, update final records, or bypass review.
        </p>
      </div>
      <span className="badge danger">Local Demo Mode</span>
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

function canSeeNavItem(item: NavItem, permissions: string[], roles: string[], isAdmin: boolean) {
  if (item.adminOnly) return isAdmin;
  if (!item.permissions?.length && !item.roles?.length) return true;
  return hasAnyPermission(permissions, item.permissions ?? []) || hasAnyPermission(roles, item.roles ?? []);
}

function groupNavItems(items: NavItem[]) {
  const titles: NavItem["group"][] = ["Daily Work", "Clinical", "Women's Health", "Medication", "Finance", "Evidence", "Admin", "Future"];
  return titles
    .map((title) => ({ title, links: items.filter((item) => item.group === title) }))
    .filter((group) => group.links.length > 0);
}

function hasAnyPermission(values: string[], keys: string[]) {
  return keys.some((key) => values.includes(key));
}
