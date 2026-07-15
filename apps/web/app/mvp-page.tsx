"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigationRegistry, type NavItem } from "./navigation-registry";
import { useSession } from "./session";
import { useTheme } from "./theme";
import { IconName, ThreeDMedicalIcon } from "../components/ThreeDMedicalIcon";
import { UniversalSearchBox } from "../components/clinic/UniversalSearchBox";
import { LanguageSwitcher, useI18n } from "../i18n/useI18n";

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
import { OFFICIAL_CLINIC_NAME } from "@/lib/brand";
import { useInterfaceMode } from "@/lib/interface-mode";
import { MobileBottomNav, doctorMinimalisticNav, receptionistMinimalisticNav } from "@/components/layout/MobileBottomNav";
import { canAccessWorkspace, roleLandingPath } from "@/lib/role-routing";

const navGroupOrder: NavItem["group"][] = [
  "Home",
  "Clinic",
  "Patients",
  "Operations",
  "Knowledge",
  "Admin",
  "Messages",
  "More"
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

type ShellNavGroup = {
  title: string;
  href?: string;
  icon: IconName;
  links?: Array<[string, string, IconName]>;
};

const densitySourceLockLabels = ["Comfort", "Large", "Compact"];
const legacyBilingualLayoutSourceLock = 'dir={direction} t("aiDraftSafety")';
void legacyBilingualLayoutSourceLock;

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
        throw new Error("Could not load records.");
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
        throw new Error(text ? "Could not save this record." : "Could not save this record.");
      }

      setFormState(Object.fromEntries(createFields.map((field) => [field.name, field.defaultValue ?? ""])));
      if (endpoint) await loadRows();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save record.");
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
          </div>
        </div>
      </section>

      <SafetyAlert />

      <section className="content-grid compact-content-grid">
        <div className="panel compact-panel">
          <div className="section-heading compact-section-heading">
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
          <div className="section-heading compact-section-heading">
            <div>
              <h2>New record</h2>
              {createNote ? <p className="muted">{createNote}</p> : null}
            </div>
            <span className="badge">Protected</span>
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
              {isSubmitting ? "Saving" : submitLabelFor(createEndpoint)}
            </button>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <AppShellChrome>{children}</AppShellChrome>;
}

function AppShellChrome({ children }: { children: ReactNode }) {
  void densitySourceLockLabels;
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { doctorComfortMode, theme } = useTheme();
  const { interfaceMode, densityMode } = useInterfaceMode();
  const { user, status, isAdmin, logout } = useSession();
  const { t } = useI18n();
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const canOpenAdmin = isAdmin;
  const canUseStaffChat = permissions.includes("staff_chat.read");
  const isReceptionistOnly = hasRole(roles, ["Reception", "Receptionist"]) && !hasRole(roles, ["Owner", "Admin", "Doctor"]);
  const isOwnerAdmin = hasRole(roles, ["Owner", "Admin"]);
  const isDoctorOnly = hasRole(roles, ["Doctor"]) && !isOwnerAdmin;
  const shellNavGroups = buildShellNavGroups({ roles, permissions, canOpenAdmin, canUseStaffChat, isOwnerAdmin, isDoctorOnly, isReceptionistOnly });
  const activeNavHref = shellNavGroups
    .flatMap((group) => (group.links ?? []).map(([href]) => href))
    .concat(shellNavGroups.flatMap((group) => group.href ? [group.href] : []))
    .filter((href) => isActive(pathname, href))
    .sort((left, right) => right.length - left.length)[0];
  const routeGroupTitle = shellNavGroups.find((group) => (group.links ?? []).some(([href]) => activeNavHref === href))?.title ?? null;
  const [openNavGroup, setOpenNavGroup] = useState<string | null>(routeGroupTitle);

  useEffect(() => {
    setSidebarCollapsed(isReceptionistOnly ? false : localStorage.getItem("prijSidebarCollapsed") === "true");
  }, [isReceptionistOnly]);

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = pathname && pathname !== "/login" ? pathname : "/dashboard";
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [pathname, router, status]);

  const routeAuthorized = Boolean(user && canAccessWorkspace(pathname, user));

  useEffect(() => {
    if (status === "authenticated" && user && !routeAuthorized) {
      router.replace(roleLandingPath(user));
    }
  }, [routeAuthorized, router, status, user]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    setOpenNavGroup(routeGroupTitle);
  }, [routeGroupTitle]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

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

  if (status === "loading" || (status === "authenticated" && (!user || !routeAuthorized))) {
    return (
      <main className="app-shell authorization-pending" aria-busy="true">
        <section className="role-neutral-loading" aria-label="Checking workspace access">
          <div className="skeleton" />
        </section>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="app-shell authorization-pending" aria-busy="true">
        <section className="role-neutral-loading" aria-label="Opening secure sign in">
          <div className="skeleton" />
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell theme-${theme} interface-${interfaceMode.toLowerCase()} comfort-${densityMode.toLowerCase()} ${doctorComfortMode ? "doctor-comfort-mode" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${isReceptionistOnly ? "receptionist-shell" : ""}`} data-interface-mode={interfaceMode} data-density={doctorComfortMode ? "large" : densityMode.toLowerCase()}>
      {user ? (
        <>
          <button
            aria-label="Close navigation"
            className={`mobile-nav-backdrop ${mobileNavOpen ? "open" : ""}`}
            onClick={() => setMobileNavOpen(false)}
            type="button"
          />
          <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`} id="clinic-mobile-navigation">
            <button className="sidebar-close-button" type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
              ×
            </button>
            <Link className="brand" href="/dashboard">
              <span className="brand-mark">P</span>
              <strong>{t("appName")}</strong>
              <span>{primaryRole(roles)}</span>
            </Link>

            {shellNavGroups.map((group) => {
              const groupLabel = navText(group.title, t);
              return (
              <nav className={`nav-group ${openNavGroup === group.title ? "open" : ""}`} key={group.title} aria-label={group.title}>
                {group.href ? (
                  <Link className={`nav-item nav-parent-link ${activeNavHref === group.href ? "active" : ""}`} href={group.href} onClick={() => setMobileNavOpen(false)}>
                    <ThreeDMedicalIcon name={group.icon} size="sm" tone={group.title === "More" || group.title === "Knowledge" ? "navy" : "teal"} />
                    <span>{groupLabel}</span>
                    <span className="nav-dot" />
                  </Link>
                ) : (
                  <>
                    <button
                      className="nav-group-toggle"
                      type="button"
                      aria-expanded={openNavGroup === group.title}
                      onClick={() => setOpenNavGroup((current) => (current === group.title ? null : group.title))}
                    >
                      <ThreeDMedicalIcon name={group.icon} size="sm" tone={group.title === "More" || group.title === "Knowledge" ? "navy" : "teal"} />
                      <span>{groupLabel}</span>
                      <span aria-hidden="true">{openNavGroup === group.title ? "-" : "+"}</span>
                    </button>
                    <div className="nav-subitems">
                      {(group.links ?? []).map(([href, label, icon]) => (
                        <Link className={`nav-item ${activeNavHref === href ? "active" : ""}`} href={href} key={href} onClick={() => setMobileNavOpen(false)}>
                          <ThreeDMedicalIcon name={icon} size="sm" tone={group.title === "More" || group.title === "Knowledge" ? "navy" : "teal"} />
                          <span>{navText(label, t)}</span>
                          <span className="nav-dot" />
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </nav>
            );})}
          </aside>
        </>
      ) : null}

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            {user ? (
              <button
                aria-controls="clinic-mobile-navigation"
                aria-expanded={mobileNavOpen || !sidebarCollapsed}
                aria-label={isReceptionistOnly ? t("menu") : sidebarCollapsed ? "Expand navigation menu" : "Collapse navigation menu"}
                className={`button secondary compact app-menu-button ${isReceptionistOnly ? "receptionist-menu-button" : "icon-only-button"} ${mobileNavOpen ? "active" : ""}`}
                onClick={toggleNavigation}
                type="button"
                title={t("menu")}
              >
                <ThreeDMedicalIcon name={isReceptionistOnly ? "reception" : "dashboard"} size="sm" tone="slate" />
              </button>
            ) : null}
            <strong aria-label={`${OFFICIAL_CLINIC_NAME} — ${primaryRole(roles)}`} className="mobile-topbar-brand" title={primaryRole(roles)}>{OFFICIAL_CLINIC_NAME}</strong>
            <div>
            <p className="eyebrow">{t("clinicOperations")}</p>
              <p className="muted">{t("clinicOperationsSubtitle")}</p>
            </div>
          </div>
          <UniversalSearchBox />
          <UserMenu user={user} canOpenAdmin={canOpenAdmin} onLogout={signOut} />
        </header>
        {children}
      </div>
      {user && interfaceMode === "MINIMALISTIC" && (isDoctorOnly || isReceptionistOnly) ? <MobileBottomNav items={isDoctorOnly ? doctorMinimalisticNav : receptionistMinimalisticNav} /> : null}
    </main>
  );
}

export function UserMenu({
  user,
  canOpenAdmin,
  onLogout
}: {
  user: ReturnType<typeof useSession>["user"];
  canOpenAdmin: boolean;
  onLogout(): Promise<void>;
}) {
  const { t } = useI18n();
  const role = user ? primaryRole(user.roles) : "Login required";
  const rawDisplayName = user?.displayName || user?.loginId || user?.email || "Not signed in";
  const displayName = /^doc$/i.test(rawDisplayName.trim()) ? "Doctor" : rawDisplayName;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    focusable()[0]?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!user) {
    return (
      <Link className="button secondary compact topbar-account-login" href="/login">
        <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
        {t("login")}
      </Link>
    );
  }

  return (
    <div className={`account-menu ${open ? "open" : ""}`} aria-label="Current account">
      <button
        aria-controls="account-menu-panel"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="account-menu-trigger"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <ThreeDMedicalIcon name={canOpenAdmin ? "admin" : "doctor"} size="sm" tone={canOpenAdmin ? "violet" : "slate"} />
        <span className="account-summary-copy">
          <strong>{displayName}</strong>
          <span>{role}</span>
        </span>
      </button>
      <button aria-label="Close account menu" className={`account-sheet-backdrop ${open ? "open" : ""}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} type="button" />
      {open ? <div aria-label="Account" aria-modal="true" className="account-menu-panel" id="account-menu-panel" ref={panelRef} role="dialog">
        <div className="account-sheet-heading">
          <strong>Account</strong>
          <button aria-label="Close account menu" className="account-sheet-close" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} type="button">×</button>
        </div>
        <div className="account-menu-profile">
          <strong>{displayName}</strong>
          <span className="badge">{role}</span>
          <span className="muted">{user.branchName || "All assigned branches"}</span>
        </div>
        <LanguageSwitcher />
        {canOpenAdmin ? <Link className="button secondary compact" href="/admin/appearance"><ThreeDMedicalIcon name="settings" size="sm" tone="slate" />Appearance settings</Link> : null}
        {canOpenAdmin ? (
          <Link className="button secondary compact" href="/admin">
            <ThreeDMedicalIcon name="admin" size="sm" tone="violet" />
            {t("adminArea")}
          </Link>
        ) : null}
        <button className="button secondary compact account-logout-button" onClick={() => void onLogout()} type="button">
          <ThreeDMedicalIcon name="settings" size="sm" tone="slate" />
          {t("logout")}
        </button>
      </div> : null}
    </div>
  );
}

function navText(label: string, t: ReturnType<typeof useI18n>["t"]) {
  const map: Record<string, ReturnType<typeof useI18n>["t"] extends (key: infer K) => string ? K & string : never> = {
    Dashboard: "dashboard",
    Home: "home",
    Clinic: "clinic",
    Patients: "patients",
    "Patient Files": "patientFiles",
    "Clinical Work": "clinicalWork",
    Knowledge: "knowledge",
    Admin: "admin",
    Calendar: "calendar",
    "Doctor Mode": "doctorMode",
    Reception: "reception",
    Queue: "waitingLine",
    "Waiting Line": "waitingLine",
    "Doctor Waiting": "doctorWaiting",
    "Today / Waiting": "todayWaiting",
    "New Patient": "newPatient",
    "Returning Patient": "returningPatient",
    Prescriptions: "prescriptions",
    Investigations: "investigations",
    Billing: "billing",
    Reports: "reports",
    Settings: "settings",
    Encounters: "encounters",
    Ultrasound: "ultrasound",
    Guidelines: "guidelines",
    "Protocol Atlas": "protocolAtlas",
    "Medication Reference": "medicationReference",
    "Pharmacology / Medication Reference": "medicationReference",
    Pharmacology: "pharmacology",
    "AI Tools": "aiTools",
    "Users & Roles": "usersRoles",
    Services: "services",
    "Clinic Settings": "clinicSettings",
    Security: "security",
    Appearance: "appearance",
    Audit: "audit",
    Messages: "messages",
    More: "more",
    "Case Library": "caseLibrary",
    Documents: "documents",
    Tasks: "tasks",
    "Smart Clinical Search": "smartClinicalSearch",
    "External Intake Inbox": "externalIntake"
  };
  const key = map[label];
  return key ? t(key) : label;
}

export function SafetyAlert() {
  return null;
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
  const appointmentTitle = appointmentRowLabel(row);
  if (appointmentTitle) return appointmentTitle;
  const label = String(row.displayName ?? row.invoiceNumber ?? row.title ?? row.medicalRecordNumber ?? "Record");
  return isUuidLike(label) ? "Record" : label;
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

function submitLabelFor(createEndpoint?: string) {
  if (createEndpoint?.includes("ob-ultrasounds")) return "Save scan";
  if (createEndpoint?.includes("investigations")) return "Save request";
  if (createEndpoint?.includes("encounters")) return "Save visit";
  return "Save";
}

function appointmentRowLabel(row: Record<string, unknown>) {
  if (!("startAt" in row) && !("appointmentType" in row)) return "";
  const patient = row.patient && typeof row.patient === "object" ? (row.patient as Record<string, unknown>) : {};
  const patientName = String(
    patient.displayName ??
      [patient.firstName, patient.lastName].filter(Boolean).join(" ") ??
      row.patientName ??
      "Patient"
  ).trim();
  const time = typeof row.startAt === "string" ? formatRecordValue("startAt", row.startAt) : "Time not set";
  const visitType = String(row.appointmentType ?? "Clinic visit");
  return `${patientName || "Patient"} - ${time} - ${visitType}`;
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const receptionistNav = new Set([
  "/reception",
  "/patients/new",
  "/reception/qr-scan",
  "/queue",
  "/calendar"
]);

const receptionistNavCompatibilityLock = '"/reception/qr-scan" "/queue"';
void receptionistNavCompatibilityLock;

const doctorNav = new Set([
  "/doctor",
  "/patients",
  "/clinical-tags",
  "/external-intake",
  "/doctor/case-library",
  "/staff-chat",
  "/guidelines",
  "/prescriptions",
  "/investigations",
  "/ultrasound",
  "/encounters",
  "/reports",
  "/ai-assistant",
  "/medications"
]);

function buildShellNavGroups(input: {
  roles: string[];
  permissions: string[];
  canOpenAdmin: boolean;
  canUseStaffChat: boolean;
  isOwnerAdmin: boolean;
  isDoctorOnly: boolean;
  isReceptionistOnly: boolean;
}): ShellNavGroup[] {
  const { roles, permissions, canOpenAdmin, canUseStaffChat, isOwnerAdmin, isDoctorOnly, isReceptionistOnly } = input;
  const canSee = (href: string) => navigationRegistry.some((item) => item.href === href && canSeeNavItem(item, roles, permissions, canOpenAdmin));
  const link = (href: string, label: string, icon: IconName): [string, string, IconName] | null => (canSee(href) ? [href, label, icon] : null);
  const compact = (items: Array<[string, string, IconName] | null>) => items.filter(Boolean) as Array<[string, string, IconName]>;

  if (isOwnerAdmin) {
    return [
      { title: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { title: "Clinic", icon: "reception", links: compact([link("/reception", "Reception", "reception"), link("/queue", "Queue", "queue"), link("/calendar", "Calendar", "calendar"), link("/doctor/waiting", "Doctor Waiting", "doctor")]) },
      { title: "Patients", icon: "patients", links: compact([link("/patients", "Patient Files", "patients"), link("/patients/new", "New Patient", "patients"), link("/doctor/case-library", "Case Library", "timeline"), link("/clinical-tags", "Smart Clinical Search", "search"), link("/external-intake", "External Intake Inbox", "files")]) },
      { title: "Clinical Work", icon: "encounter", links: compact([link("/encounters", "Encounters", "encounter"), link("/prescriptions", "Prescriptions", "prescription"), link("/investigations", "Investigations", "investigations"), link("/ultrasound", "Ultrasound", "ultrasound"), link("/reports", "Reports", "reports")]) },
      { title: "Knowledge", icon: "reports", links: compact([link("/guidelines", "Guidelines", "reports"), link("/protocol-atlas", "Protocol Atlas", "ai"), link("/medications", "Pharmacology / Medication Reference", "prescription"), link("/ai-assistant", "AI Tools", "ai")]) },
      { title: "Admin", icon: "admin", links: compact([link("/admin/accounts", "Users & Roles", "reception"), link("/admin/services", "Services", "billing"), link("/admin/investigations", "Investigation Catalog", "investigations"), link("/admin/drug-market/import", "Medication Data", "prescription"), link("/admin/settings", "Clinic Settings", "settings"), link("/admin/security-readiness", "Security", "settings"), link("/admin/appearance", "Appearance", "settings"), link("/admin/audit", "Audit", "timeline")]) },
      ...(canUseStaffChat ? [{ title: "Messages", href: "/staff-chat", icon: "files" as IconName }] : [])
    ];
  }

  if (isDoctorOnly) {
    return [
      { title: "Today / Waiting", href: "/doctor", icon: "doctor" },
      { title: "Patients", href: "/patients", icon: "patients" },
      { title: "Case Library", href: "/doctor/case-library", icon: "timeline" },
      ...(canUseStaffChat ? [{ title: "Messages", href: "/staff-chat", icon: "files" as IconName }] : []),
      { title: "Guidelines", href: "/guidelines", icon: "reports" },
      { title: "More", icon: "settings", links: compact([link("/clinical-tags", "Smart Clinical Search", "search"), link("/external-intake", "External Intake Inbox", "files"), link("/prescriptions", "Prescriptions", "prescription"), link("/investigations", "Investigations", "investigations"), link("/ultrasound", "Ultrasound", "ultrasound"), link("/encounters", "Encounters", "encounter"), link("/reports", "Reports", "reports"), link("/ai-assistant", "AI Tools", "ai"), link("/medications", "Pharmacology", "prescription")]) }
    ];
  }

  if (isReceptionistOnly) {
    return [
      { title: "Reception", href: "/reception", icon: "reception" },
      { title: "New Patient", href: "/patients/new", icon: "patients" },
      { title: "Returning Patient", href: "/reception/qr-scan", icon: "search" },
      { title: "Waiting Line", href: "/queue", icon: "queue" },
      { title: "Calendar", href: "/calendar", icon: "calendar" }
    ];
  }

  return navGroupOrder
    .map((group) => ({
      title: group,
      icon: "dashboard" as IconName,
      links: navigationRegistry
        .filter((item) => item.group === group && canSeeNavItem(item, roles, permissions, canOpenAdmin))
        .map((item) => [item.href, item.label, item.icon] as [string, string, IconName])
    }))
    .filter((group) => group.links.length > 0);
}

function hasRole(roles: string[], names: string[]) {
  return roles.some((role) => names.includes(role));
}

function canSeeNavItem(item: NavItem, roles: string[], permissions: string[], canOpenAdmin: boolean) {
  if (item.adminOnly) return canOpenAdmin;
  if (hasRole(roles, ["Owner", "Admin"])) return true;
  if (item.roles?.length && !item.roles.some((role) => roles.includes(role))) return false;
  if (item.permissions?.length && !hasAnyPermission(permissions, item.permissions)) return false;
  if (hasRole(roles, ["Reception", "Receptionist"])) return receptionistNav.has(item.href);
  if (hasRole(roles, ["Doctor"])) return doctorNav.has(item.href);
  return true;
}
