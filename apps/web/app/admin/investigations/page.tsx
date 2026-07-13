"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

type CatalogItem = { id: string; code: string; name: string; category: string; subcategory?: string | null; clinicalGroup?: string | null; modality?: string | null; aliasesJson?: unknown; active: boolean };

const emptyDraft = { id: "", code: "", name: "", category: "", subcategory: "", clinicalGroup: "", modality: "", aliases: "", active: true };

export default function InvestigationCatalogAdminPage() {
  const { user, status: sessionStatus } = useSession();
  const canManage = Boolean(user?.permissions.includes("investigations.manage_catalog"));
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Ready");

  const load = useCallback(async () => {
    const response = await apiRequest(`/investigations/admin/catalog?q=${encodeURIComponent(query)}`);
    if (response.ok) setItems((await response.json()) as CatalogItem[]);
  }, [query]);

  useEffect(() => { if (canManage) void load(); }, [canManage, load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const payload = { ...draft, id: undefined, aliases: draft.aliases.split(",").map((value) => value.trim()).filter(Boolean) };
    const response = await apiRequest(draft.id ? `/investigations/admin/catalog/${draft.id}` : "/investigations/admin/catalog", draft.id ? "PATCH" : "POST", payload);
    setMessage(response.ok ? "Catalog item saved and audited." : "Could not save catalog item.");
    if (response.ok) { setDraft(emptyDraft); void load(); }
  }

  function edit(item: CatalogItem) {
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

  async function setActive(item: CatalogItem, active: boolean) {
    const response = await apiRequest(`/investigations/admin/catalog/${item.id}`, "PATCH", {
      code: item.code,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      clinicalGroup: item.clinicalGroup,
      modality: item.modality,
      aliases: Array.isArray(item.aliasesJson) ? item.aliasesJson : [],
      active
    });
    setMessage(response.ok ? (active ? "Catalog item restored." : "Catalog item deactivated; prior records are preserved.") : "Could not update catalog item.");
    if (response.ok) void load();
  }

  return (
    <AppShell>
      <section className="page-header"><p className="eyebrow">Data management</p><h1>Investigation catalog</h1><p className="muted">Create, edit, deactivate, or restore catalog entries. Changes are audited.</p></section>
      {sessionStatus === "authenticated" && !canManage ? <section className="panel"><p className="form-error">You do not have permission to manage the investigation catalog.</p></section> : null}
      {canManage ? <section className="content-grid two-columns">
        <article className="panel">
          <div className="section-heading"><h2>{draft.id ? "Edit investigation" : "New investigation"}</h2><span className="badge">{message}</span></div>
          <form className="form-grid" onSubmit={save}>
            <label>Code<input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder="Generated when blank" /></label>
            <label>Name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Category<input required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
            <label>Subcategory<input value={draft.subcategory} onChange={(event) => setDraft({ ...draft, subcategory: event.target.value })} /></label>
            <label>Clinical group<input value={draft.clinicalGroup} onChange={(event) => setDraft({ ...draft, clinicalGroup: event.target.value })} /></label>
            <label>Modality<input value={draft.modality} onChange={(event) => setDraft({ ...draft, modality: event.target.value })} /></label>
            <label className="wide">Synonyms, comma separated<input value={draft.aliases} onChange={(event) => setDraft({ ...draft, aliases: event.target.value })} /></label>
            <div className="form-actions wide"><button className="button" type="submit">Save</button>{draft.id ? <button className="button secondary" type="button" onClick={() => setDraft(emptyDraft)}>Cancel</button> : null}</div>
          </form>
        </article>
        <article className="panel">
          <label>Search catalog<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="data-list">
            {items.map((item) => <article className="data-row" key={item.id}>
              <div className="data-row-header"><strong>{item.name}</strong><span className="badge">{item.active ? "Active" : "Inactive"}</span></div>
              <p className="muted">{item.code} · {item.category}</p>
              <div className="form-actions"><button className="button secondary compact" type="button" onClick={() => edit(item)}>Edit</button><button className="button secondary compact" type="button" onClick={() => void setActive(item, !item.active)}>{item.active ? "Deactivate" : "Restore"}</button></div>
            </article>)}
          </div>
        </article>
      </section> : null}
    </AppShell>
  );
}

async function apiRequest(endpoint: string, method = "GET", payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: { ...(payload ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 500 }));
}
