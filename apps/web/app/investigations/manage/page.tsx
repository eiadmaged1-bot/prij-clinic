"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "@/app/mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";
import styles from "./manage-investigations.module.css";

type CatalogItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory?: string | null;
  modality?: string | null;
  aliasesJson?: unknown;
  active: boolean;
};

type Filter = "active" | "archived" | "all";

const categories = [
  "Laboratory",
  "Imaging",
  "Pathology",
  "Cardiac and Functional Tests",
  "Procedures and Referrals",
  "Other"
];

export default function ManageInvestigationsPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]!);
  const [subcategory, setSubcategory] = useState("");
  const [modality, setModality] = useState("");
  const [aliases, setAliases] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<CatalogItem | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveConfirmation, setArchiveConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`${getApiBaseUrl()}/investigations/catalog-management`, {
      credentials: "include",
      headers: authHeaders()
    });
    if (!response.ok) throw new Error(await responseMessage(response, "Could not load investigation management."));
    setItems(await response.json() as CatalogItem[]);
  }, []);

  useEffect(() => { void load().catch((error: Error) => setStatus(error.message)); }, [load]);

  const visible = useMemo(() => {
    const text = normalize(query);
    return items.filter((item) => {
      if (filter === "active" && !item.active) return false;
      if (filter === "archived" && item.active) return false;
      if (!text) return true;
      return normalize([item.name, item.code, item.category, item.subcategory, item.modality, ...jsonStrings(item.aliasesJson)].filter(Boolean).join(" ")).includes(text);
    });
  }, [filter, items, query]);

  async function createCustom(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const response = await apiRequest("/investigations/catalog-management/custom", "POST", {
      name: name.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      modality: modality.trim() || undefined,
      aliases: aliases.split(/[,\n]/).map((value) => value.trim()).filter(Boolean)
    });
    setSaving(false);
    if (!response.ok) return setStatus(await responseMessage(response, "Could not add the investigation."));
    const body = await response.json() as { created?: boolean; duplicatePrevented?: boolean };
    setName("");
    setSubcategory("");
    setModality("");
    setAliases("");
    await load();
    setStatus(body.duplicatePrevented ? "A matching active investigation already existed; the existing item was reused." : "Custom investigation added.");
  }

  async function archive() {
    if (!archiveTarget) return;
    setSaving(true);
    const response = await apiRequest(`/investigations/catalog-management/${archiveTarget.id}/archive`, "POST", {
      reason: archiveReason,
      confirmation: archiveConfirmation
    });
    setSaving(false);
    if (!response.ok) return setStatus(await responseMessage(response, "Could not archive the investigation."));
    setArchiveTarget(null);
    setArchiveReason("");
    setArchiveConfirmation("");
    await load();
    setStatus("Investigation archived. Historical patient orders and results were preserved.");
  }

  async function restore(item: CatalogItem) {
    const response = await apiRequest(`/investigations/catalog-management/${item.id}/restore`, "POST", {});
    if (!response.ok) return setStatus(await responseMessage(response, "Could not restore the investigation."));
    await load();
    setStatus("Investigation restored to the active catalogue.");
  }

  return (
    <AppShell>
      <header className={styles.header}>
        <div><h1>Manage investigations</h1><p>Add a missing custom investigation or safely archive an unwanted item.</p></div>
        <Link className="button secondary compact" href="/investigations">Back to ordering</Link>
      </header>
      <SafetyAlert />
      {status ? <p className={styles.status} role="status">{status}</p> : null}

      <section className={styles.grid}>
        <form className={`panel ${styles.form}`} onSubmit={createCustom}>
          <h2>Add custom investigation</h2>
          <label>Investigation name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
          <label>Subcategory<input value={subcategory} onChange={(event) => setSubcategory(event.target.value)} placeholder="Example: Coagulation" /></label>
          <label>Modality or specimen — optional<input value={modality} onChange={(event) => setModality(event.target.value)} placeholder="Example: Plasma, MRI, Ultrasound" /></label>
          <label>Aliases — optional<textarea value={aliases} onChange={(event) => setAliases(event.target.value)} placeholder="Comma-separated English or Arabic search terms" /></label>
          <button className="button" type="submit" disabled={saving || name.trim().length < 2}>{saving ? "Saving…" : "Add investigation"}</button>
        </form>

        <section className={`panel ${styles.catalogue}`}>
          <div className={styles.tools}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, code, category, or alias" />
            <div>
              <button className={filter === "active" ? styles.activeFilter : ""} type="button" onClick={() => setFilter("active")}>Active</button>
              <button className={filter === "archived" ? styles.activeFilter : ""} type="button" onClick={() => setFilter("archived")}>Archived</button>
              <button className={filter === "all" ? styles.activeFilter : ""} type="button" onClick={() => setFilter("all")}>All</button>
            </div>
          </div>
          <div className={styles.rows}>
            {visible.map((item) => <article className={styles.row} key={item.id}>
              <div><strong>{item.name}</strong><span>{item.code} · {item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}{item.modality ? ` · ${item.modality}` : ""}</span></div>
              {item.active ? <button className="button secondary compact" type="button" onClick={() => { setArchiveTarget(item); setArchiveReason(""); setArchiveConfirmation(""); }}>Archive</button> : <button className="button secondary compact" type="button" onClick={() => void restore(item)}>Restore</button>}
            </article>)}
            {!visible.length ? <p className="empty-state compact smart-empty-state">No investigations match this view.</p> : null}
          </div>
        </section>
      </section>

      {archiveTarget ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setArchiveTarget(null); }}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="archive-investigation-title">
          <h2 id="archive-investigation-title">Archive {archiveTarget.name}</h2>
          <p>This hides the item from active ordering. Historical orders and results remain unchanged.</p>
          <label>Reason<input value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="At least 4 characters" /></label>
          <label>Type the exact investigation name<input value={archiveConfirmation} onChange={(event) => setArchiveConfirmation(event.target.value)} placeholder={archiveTarget.name} /></label>
          <div><button className="button secondary" type="button" onClick={() => setArchiveTarget(null)}>Cancel</button><button className="button" type="button" disabled={saving || archiveReason.trim().length < 4 || archiveConfirmation.trim() !== archiveTarget.name} onClick={() => void archive()}>{saving ? "Archiving…" : "Archive investigation"}</button></div>
        </section>
      </div> : null}
    </AppShell>
  );
}

function jsonStrings(value: unknown): string[] { return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []; }
function normalize(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }

async function apiRequest(endpoint: string, method: string, payload?: Record<string, unknown>) {
  return fetch(`${getApiBaseUrl()}${endpoint}`, { method, credentials: "include", headers: { "content-type": "application/json", ...authHeaders(), ...csrfHeaders() }, body: payload ? JSON.stringify(payload) : undefined }).catch(() => new Response(null, { status: 500 }));
}
async function responseMessage(response: Response, fallback: string) { const body = await response.json().catch(() => null) as { message?: string; error?: { message?: string } } | null; return body?.message || body?.error?.message || fallback; }
function authHeaders(): Record<string, string> { const token = sessionStorage.getItem("prijClinicToken"); return token ? { authorization: `Bearer ${token}` } : {}; }
function csrfHeaders(): Record<string, string> { const token = /(?:^|;\s*)csrf-token=([^;]+)/.exec(document.cookie)?.[1]; return token ? { "x-csrf-token": decodeURIComponent(token) } : {}; }
