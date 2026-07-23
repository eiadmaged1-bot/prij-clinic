"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  sampleType?: string | null;
  modality?: string | null;
  favorite?: boolean;
};

type FavoriteSet = {
  id: string;
  name: string;
  actionable?: boolean;
  items: Array<{ investigationCatalogItem: CatalogItem }>;
};

type ExistingRequest = {
  id: string;
  status: string;
  items?: Array<{ testName?: string }>;
};

type Workspace = {
  investigationCatalog?: CatalogItem[];
  favorites?: CatalogItem[];
  favoriteSets?: FavoriteSet[];
};

export function EncounterInvestigationOrderBuilder({
  patientId,
  encounterId,
  patientName,
  onSaved
}: {
  patientId: string;
  encounterId: string;
  patientName?: string;
  onSaved?: () => void;
}) {
  const [workspace, setWorkspace] = useState<Workspace>({});
  const [existingRequests, setExistingRequests] = useState<ExistingRequest[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [indications, setIndications] = useState<Record<string, string>>({});
  const [priority, setPriority] = useState("routine");
  const [overallNote, setOverallNote] = useState("");
  const [warningConfirmed, setWarningConfirmed] = useState(false);
  const [status, setStatus] = useState("Loading investigation catalogue…");
  const [saving, setSaving] = useState(false);
  const [savedRequestId, setSavedRequestId] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      apiGet("/investigations/catalog"),
      apiGet(`/clinical-requests?patientId=${encodeURIComponent(patientId)}&page=1&limit=50`)
    ]).then(([catalogueBody, requestsBody]) => {
      if (cancelled) return;
      setWorkspace(catalogueBody as Workspace);
      setExistingRequests(((requestsBody as { clinicalRequests?: ExistingRequest[] }).clinicalRequests ?? []));
      setStatus("Ready to order for the locked patient visit.");
    }).catch(() => {
      if (!cancelled) setStatus("Could not load the investigation catalogue. Existing visit data was not changed.");
    });
    return () => { cancelled = true; };
  }, [patientId]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey(patientId, encounterId)) ?? "null") as { selected?: CatalogItem[]; indications?: Record<string, string>; priority?: string; overallNote?: string } | null;
      if (Array.isArray(saved?.selected)) setSelected(unique(saved.selected));
      if (saved?.indications) setIndications(saved.indications);
      if (saved?.priority) setPriority(saved.priority);
      if (typeof saved?.overallNote === "string") setOverallNote(saved.overallNote);
    } catch {
      sessionStorage.removeItem(storageKey(patientId, encounterId));
    }
  }, [encounterId, patientId]);

  useEffect(() => {
    sessionStorage.setItem(storageKey(patientId, encounterId), JSON.stringify({ selected, indications, priority, overallNote }));
    setWarningConfirmed(false);
  }, [encounterId, indications, overallNote, patientId, priority, selected]);

  const catalogue = workspace.investigationCatalog ?? [];
  const categories = useMemo(() => [...new Set(catalogue.map((item) => item.category))].sort(), [catalogue]);
  const visible = useMemo(() => {
    const text = normalize(query);
    return catalogue.filter((item) => {
      if (category && item.category !== category) return false;
      if (!text) return true;
      return normalize([item.name, item.category, item.subcategory, item.sampleType, item.modality].filter(Boolean).join(" ")).includes(text);
    }).slice(0, 60);
  }, [catalogue, category, query]);
  const templates = (workspace.favoriteSets ?? []).filter((set) => set.actionable !== false && set.items.length > 0);

  function add(item: CatalogItem) {
    setSelected((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
  }

  function applyTemplate(set: FavoriteSet) {
    setSelected((current) => unique([...current, ...set.items.map((entry) => entry.investigationCatalogItem)]));
    setStatus(`${set.name} added to the editable order. Nothing has been submitted yet.`);
  }

  async function submit() {
    if (!selected.length || saving) return;
    const names = new Set(selected.map((item) => normalize(item.name)));
    const duplicateActive = existingRequests
      .filter((request) => !["reviewed", "closed", "cancelled", "voided", "not_completed"].includes(request.status))
      .flatMap((request) => request.items ?? [])
      .some((item) => names.has(normalize(item.testName ?? "")));
    const priorResult = existingRequests
      .filter((request) => ["reviewed", "closed"].includes(request.status))
      .flatMap((request) => request.items ?? [])
      .some((item) => names.has(normalize(item.testName ?? "")));

    if ((duplicateActive || priorResult) && !warningConfirmed) {
      setWarningConfirmed(true);
      setStatus(`${duplicateActive ? "An active duplicate request exists. " : ""}${priorResult ? "A previous reviewed result exists. " : ""}Review the patient record, then press Confirm order.`);
      return;
    }

    setSaving(true);
    const response = await apiRequest("/clinical-requests", "POST", {
      patientId,
      encounterId,
      priority,
      requestNote: overallNote || undefined,
      items: selected.map((item) => ({
        title: item.name,
        catalogItemId: item.id,
        requestType: item.category,
        requestNote: indications[item.id] || overallNote || undefined
      }))
    });
    setSaving(false);
    if (!response.ok) {
      setStatus("The investigation order could not be saved. The basket was kept.");
      return;
    }
    const saved = await response.json() as { id?: string };
    setSavedRequestId(saved.id ?? "");
    setSelected([]);
    setIndications({});
    setOverallNote("");
    setWarningConfirmed(false);
    sessionStorage.removeItem(storageKey(patientId, encounterId));
    const requestsBody = await apiGet(`/clinical-requests?patientId=${encodeURIComponent(patientId)}&page=1&limit=50`);
    setExistingRequests(((requestsBody as { clinicalRequests?: ExistingRequest[] }).clinicalRequests ?? []));
    setStatus("Investigation order saved to this encounter and added to the patient timeline.");
    onSaved?.();
  }

  return (
    <div className="embedded-investigation-builder">
      <div className="section-heading">
        <div>
          <h2>Order investigations</h2>
          <p className="muted">Locked to {patientName || "this patient"}. Search, add, review, and submit without leaving the encounter.</p>
        </div>
        <span className="badge">{selected.length} selected</span>
      </div>

      <p className="notice" role="status">{status}</p>

      {(workspace.favorites?.length ?? 0) > 0 ? (
        <div className="clinical-chip-cloud wide" aria-label="Favorite investigations">
          {(workspace.favorites ?? []).slice(0, 10).map((item) => (
            <button className="clinical-chip" key={item.id} type="button" onClick={() => add(item)}><strong>{item.name}</strong><span>Favorite</span></button>
          ))}
        </div>
      ) : null}

      {templates.length ? (
        <details className="filter-drawer">
          <summary className="button secondary compact">Templates</summary>
          <div className="dense-card-list" style={{ marginTop: ".5rem" }}>
            {templates.slice(0, 10).map((set) => <button className="picker-row" key={set.id} type="button" onClick={() => applyTemplate(set)}><strong>{set.name}</strong><span>{set.items.length} editable items</span></button>)}
          </div>
        </details>
      ) : null}

      <div className="form-grid">
        <label>Search catalogue<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CBC, AMH, HSG, ultrasound…" /></label>
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>

      <div className="investigation-encounter-grid">
        <section className="data-list investigation-encounter-results">
          {visible.map((item) => (
            <article className="data-row" key={item.id}>
              <div className="data-row-header"><div><strong>{item.name}</strong><p className="muted">{[item.category, item.subcategory].filter(Boolean).join(" · ")}</p></div><button className="button secondary compact" type="button" disabled={selected.some((entry) => entry.id === item.id)} onClick={() => add(item)}>{selected.some((entry) => entry.id === item.id) ? "Added" : "+ Add"}</button></div>
            </article>
          ))}
          {!visible.length ? <p className="empty-state compact smart-empty-state">No matching active investigations.</p> : null}
        </section>

        <aside className="panel compact-panel investigation-encounter-basket">
          <div className="section-heading"><h3>Current order</h3><button className="button secondary compact" type="button" disabled={!selected.length} onClick={() => { setSelected([]); setIndications({}); }}>Clear</button></div>
          <div className="dense-card-list">
            {selected.map((item, index) => (
              <article className="data-row" key={item.id}>
                <div className="data-row-header"><strong>{item.name}</strong><button className="button secondary compact" type="button" onClick={() => setSelected((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>
                <input value={indications[item.id] ?? ""} onChange={(event) => setIndications((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Clinical indication" />
              </article>
            ))}
            {!selected.length ? <p className="empty-state compact smart-empty-state">No investigations selected.</p> : null}
          </div>
          <label>Overall indication / note<textarea value={overallNote} onChange={(event) => setOverallNote(event.target.value)} /></label>
          <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></label>
          <button className="button" type="button" disabled={!selected.length || saving} onClick={() => void submit()}>{saving ? "Saving…" : warningConfirmed ? "Confirm order" : "Review and submit"}</button>
          {savedRequestId ? <button className="button secondary" type="button" onClick={() => window.open(`/clinical-requests/${encodeURIComponent(savedRequestId)}/print`, "_blank", "noopener,noreferrer")}>Print saved request</button> : null}
        </aside>
      </div>
    </div>
  );
}

function unique(items: CatalogItem[]) {
  return items.filter((item, index, values) => values.findIndex((entry) => entry.id === item.id) === index);
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function storageKey(patientId: string, encounterId: string) {
  return `prij:encounter-investigations:${patientId}:${encounterId}`;
}

async function apiGet(endpoint: string) {
  const token = sessionStorage.getItem("prijClinicToken");
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

async function apiRequest(endpoint: string, method: string, payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 500 }));
}
