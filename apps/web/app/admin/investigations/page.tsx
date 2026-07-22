"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useI18n } from "@/i18n/useI18n";
import { ArchiveInvestigationAction } from "../../../components/investigations/ArchiveInvestigationAction";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

type CatalogItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory?: string | null;
  clinicalGroup?: string | null;
  modality?: string | null;
  aliasesJson?: unknown;
  active: boolean;
};

type Draft = {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  clinicalGroup: string;
  modality: string;
  aliases: string;
  active: boolean;
};

const emptyDraft: Draft = {
  id: "",
  code: "",
  name: "",
  category: "Laboratory",
  subcategory: "Custom",
  clinicalGroup: "Custom",
  modality: "",
  aliases: "",
  active: true
};

const canonicalCategories = [
  "Laboratory",
  "Imaging",
  "Pathology",
  "Cardiac and Functional Tests",
  "Procedures and Referrals",
  "Other"
];

const pageSize = 25;

export default function InvestigationCatalogAdminPage() {
  const { t } = useI18n();
  const { user, status: sessionStatus } = useSession();
  const canManage = Boolean(user?.permissions.includes("investigations.manage_catalog"));
  const canDoctorManage = Boolean(user?.roles.some((role) => role === "Doctor" || role === "Owner"));
  const canAccess = canManage || canDoctorManage;

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("Ready");
  const drawerOpen = Boolean(draft);

  const load = useCallback(async () => {
    if (!canAccess) return;
    const endpoint = canDoctorManage ? "/investigations/catalog-management" : "/investigations/admin/catalog";
    const response = await apiRequest(endpoint);
    if (!response.ok) {
      setMessage(response.status === 403 ? "You do not have permission to manage the investigation catalog." : "Catalog could not be loaded.");
      return;
    }
    setItems((await response.json()) as CatalogItem[]);
  }, [canAccess, canDoctorManage]);

  useEffect(() => {
    if (sessionStatus === "authenticated" && canAccess) void load();
  }, [canAccess, load, sessionStatus]);

  useEffect(() => {
    setPage(1);
  }, [query, category, statusFilter, sort]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDraft(null);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [drawerOpen]);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const filtered = useMemo(() => items
    .filter((item) => {
      const statusMatches = statusFilter === "all" || (statusFilter === "active" ? item.active : !item.active);
      const categoryMatches = category === "all" || item.category === category;
      const aliases = Array.isArray(item.aliasesJson) ? item.aliasesJson.join(" ") : "";
      const searchText = `${item.code} ${item.name} ${item.category} ${item.subcategory ?? ""} ${item.clinicalGroup ?? ""} ${aliases}`.toLowerCase();
      return statusMatches && categoryMatches && searchText.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => sort === "category"
      ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      : sort === "code"
        ? a.code.localeCompare(b.code)
        : a.name.localeCompare(b.name)), [items, query, category, statusFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const start = filtered.length ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, filtered.length);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || (!canManage && !canDoctorManage)) return;

    const aliases = draft.aliases.split(",").map((value) => value.trim()).filter(Boolean);
    const editExisting = Boolean(draft.id);
    if (editExisting && !canManage) {
      setMessage("Doctors can add custom investigations, but editing governed catalogue entries requires catalogue-management permission.");
      return;
    }

    const endpoint = editExisting
      ? `/investigations/admin/catalog/${draft.id}`
      : canManage
        ? "/investigations/admin/catalog"
        : "/investigations/catalog-management/custom";

    const payload = editExisting || canManage
      ? {
          code: draft.code || undefined,
          name: draft.name,
          category: draft.category,
          subcategory: draft.subcategory || undefined,
          clinicalGroup: draft.clinicalGroup || draft.subcategory || undefined,
          modality: draft.modality || undefined,
          aliases,
          active: draft.active
        }
      : {
          name: draft.name,
          category: draft.category,
          subcategory: draft.subcategory || undefined,
          modality: draft.modality || undefined,
          aliases
        };

    const response = await apiRequest(endpoint, editExisting ? "PATCH" : "POST", payload);
    setMessage(response.ok
      ? editExisting
        ? "Catalog item saved and audited."
        : "Custom investigation added to the active catalogue and audited."
      : await responseError(response));

    if (response.ok) {
      setDraft(null);
      await load();
    }
  }

  function edit(item: CatalogItem) {
    if (!canManage) return;
    setDraft({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory ?? "",
      clinicalGroup: item.clinicalGroup ?? "",
      modality: item.modality ?? "",
      aliases: Array.isArray(item.aliasesJson) ? item.aliasesJson.join(", ") : "",
      active: item.active
    });
  }

  async function archiveComplete(nextMessage: string) {
    setMessage(nextMessage);
    await load();
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{t("ownerAdmin")}</p>
            <h1>{t("investigationCatalog")}</h1>
            <p className="muted">Add missing custom investigations or archive unwanted items without deleting historical patient orders or results.</p>
          </div>
          {canManage || canDoctorManage ? (
            <button className="button" type="button" onClick={() => setDraft({ ...emptyDraft })}>
              + Custom investigation
            </button>
          ) : null}
        </div>
      </section>

      {sessionStatus === "authenticated" && !canAccess ? (
        <section className="panel"><p className="form-error">Only an authorized Owner, Doctor, or catalogue manager can open this workspace.</p></section>
      ) : null}

      {canAccess ? (
        <>
          <section className="panel compact-panel">
            <div className="toolbar">
              <label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, name, alias, or group" /></label>
              <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></select></label>
              <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Name</option><option value="code">Code</option><option value="category">Category</option></select></label>
            </div>
            <p className="notice" role="status">{message}</p>
          </section>

          <section className="panel">
            <div className="section-heading"><h2>Catalog entries</h2><span className="badge">{start}-{end} of {filtered.length}</span></div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Code</th><th>Investigation</th><th>Category</th><th>Clinical group</th><th>Modality</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td><strong>{item.name}</strong><small>{item.subcategory ?? ""}</small></td>
                      <td>{item.category}</td>
                      <td>{item.clinicalGroup ?? "—"}</td>
                      <td>{item.modality ?? "—"}</td>
                      <td><span className={`badge ${item.active ? "accent" : "warning"}`}>{item.active ? "Active" : "Archived"}</span></td>
                      <td>
                        <div className="form-actions">
                          {canManage ? <button className="button secondary compact" type="button" onClick={() => edit(item)}>Edit</button> : null}
                          {canDoctorManage ? <ArchiveInvestigationAction item={item} onComplete={archiveComplete} /> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!visible.length ? <p className="empty-state compact">No catalog items match these filters.</p> : null}
            <div className="pagination-row">
              <button className="button secondary compact" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button>
              <span>Page {page} of {pageCount}</span>
              <button className="button secondary compact" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
            </div>
          </section>
        </>
      ) : null}

      {draft ? (
        <div className="admin-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}>
          <section className="admin-editor-drawer" role="dialog" aria-modal="true" aria-labelledby="investigation-editor-title">
            <div className="section-heading">
              <h2 id="investigation-editor-title">{draft.id ? "Edit investigation" : "Add custom investigation"}</h2>
              <button className="button secondary compact" type="button" onClick={() => setDraft(null)}>Close</button>
            </div>
            <p className="notice">A matching active name will be reused. If the same investigation is archived, restore it instead of creating a duplicate.</p>
            <form className="form-grid" onSubmit={save}>
              {canManage ? <label>Code<input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder="Generated when blank" /></label> : null}
              <label>Name<input required minLength={2} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label>Category<select required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{canonicalCategories.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label>Subcategory<input value={draft.subcategory} onChange={(event) => setDraft({ ...draft, subcategory: event.target.value })} /></label>
              {canManage ? <label>Clinical group<input value={draft.clinicalGroup} onChange={(event) => setDraft({ ...draft, clinicalGroup: event.target.value })} /></label> : null}
              <label>Modality<input value={draft.modality} onChange={(event) => setDraft({ ...draft, modality: event.target.value })} /></label>
              <label className="wide">Synonyms, comma separated<input value={draft.aliases} onChange={(event) => setDraft({ ...draft, aliases: event.target.value })} /></label>
              <div className="form-actions wide">
                <button className="button" type="submit">Save</button>
                <button className="button secondary" type="button" onClick={() => setDraft(null)}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

async function apiRequest(endpoint: string, method = "GET", payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: {
      ...(payload ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 503 }));
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({})) as { message?: string | string[] };
  return Array.isArray(body.message) ? body.message[0] ?? "Catalog action failed." : body.message ?? "Catalog action failed.";
}
