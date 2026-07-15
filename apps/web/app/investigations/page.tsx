"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { expandSearchShortcut } from "@/lib/search-shortcuts";

type CatalogItem = { id: string; name: string; category: string; subcategory?: string | null; modality?: string | null; favorite?: boolean };
type FavoriteSet = { id: string; name: string; nameAr?: string | null; scope?: string; items: Array<{ investigationCatalogItem: CatalogItem }> };
type ClinicalRequest = { id: string; title: string; status: string; patientId: string; followUpHintActive?: boolean; patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string } };
type Workspace = { investigationCatalog?: CatalogItem[]; categories?: string[]; favorites?: CatalogItem[]; highPriority?: CatalogItem[]; favoriteSets?: FavoriteSet[] };

const categoryTabs = ["Favorites", "Routine labs", "Antenatal", "High-risk pregnancy", "Infertility", "Gynecology", "Hormonal", "Infection", "Oncology", "Tumor markers", "Ultrasound", "Radiology", "Pathology", "Cervical screening", "Preoperative", "Postoperative", "Other"];

export default function InvestigationsPage() {
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>({});
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [removed, setRemoved] = useState<{ item: CatalogItem; index: number } | null>(null);
  const [indications, setIndications] = useState<Record<string, string>>({});
  const [priority, setPriority] = useState("routine");
  const [requestNote, setRequestNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [setName, setSetName] = useState("");
  const [setNameAr, setSetNameAr] = useState("");
  const [requests, setRequests] = useState<ClinicalRequest[]>([]);
  const [status, setStatus] = useState("Ready");
  const [savedRequestId, setSavedRequestId] = useState("");
  const [activeSection, setActiveSection] = useState<"catalog" | "sets" | "followup" | "manage">("catalog");
  const [basketReady, setBasketReady] = useState(false);
  const hasPatientContext = Boolean(patientId && encounterId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPatientId = params.get("patientId") ?? "";
    const nextEncounterId = params.get("encounterId") ?? params.get("visitId") ?? "";
    setPatientId(nextPatientId);
    setEncounterId(nextEncounterId);
    if (nextPatientId && nextEncounterId) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(basketStorageKey(nextPatientId, nextEncounterId)) ?? "null") as { selected?: CatalogItem[]; indications?: Record<string, string> } | null;
        if (Array.isArray(saved?.selected)) setSelected(uniqueCatalogItems(saved.selected));
        if (saved?.indications && typeof saved.indications === "object") setIndications(saved.indications);
      } catch {
        sessionStorage.removeItem(basketStorageKey(nextPatientId, nextEncounterId));
      }
    }
    setBasketReady(true);
    void loadRequests();
  }, []);

  useEffect(() => {
    if (!basketReady || !patientId || !encounterId) return;
    sessionStorage.setItem(basketStorageKey(patientId, encounterId), JSON.stringify({ selected, indications }));
  }, [basketReady, encounterId, indications, patientId, selected]);

  const loadWorkspace = useCallback(async () => {
    const params = new URLSearchParams();
    const expanded = expandSearchShortcut(query);
    if (expanded.trim()) params.set("q", expanded);
    if (category && category !== "Favorites") params.set("category", category);
    setStatus("Loading investigation catalog…");
    try { setWorkspace(await apiGet(`/investigations/catalog?${params.toString()}`) as Workspace); setStatus("Ready"); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Investigation catalog API failed."); }
  }, [query, category]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadWorkspace(), 180);
    return () => window.clearTimeout(timeout);
  }, [loadWorkspace]);

  async function loadRequests() {
    try { const data = await apiGet("/clinical-requests") as { clinicalRequests?: ClinicalRequest[] }; setRequests(data.clinicalRequests ?? []); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Result follow-up API failed."); }
  }

  const patient = useMemo(() => requests.find((request) => request.patientId === patientId)?.patient, [requests, patientId]);
  const visibleCatalog = category === "Favorites" ? workspace.favorites ?? [] : workspace.investigationCatalog ?? [];

  function add(item: CatalogItem) {
    setSelected((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
  }

  function applySet(set: FavoriteSet) {
    setSelected((current) => [...current, ...set.items.map((entry) => entry.investigationCatalogItem).filter((item) => !current.some((existing) => existing.id === item.id))]);
  }

  function move(index: number, offset: -1 | 1) {
    setSelected((current) => {
      const destination = index + offset;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination]!, next[index]!];
      return next;
    });
  }

  function remove(index: number) {
    const item = selected[index];
    if (!item) return;
    setRemoved({ item, index });
    setSelected((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function undoRemove() {
    if (!removed) return;
    setSelected((current) => { const next = [...current]; next.splice(Math.min(removed.index, next.length), 0, removed.item); return next; });
    setRemoved(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!hasPatientContext || !selected.length) return setStatus("Open an active patient visit and select at least one investigation.");
    const response = await apiPost("/clinical-requests", {
      patientId, encounterId, priority, requestedFollowUpDate: followUpDate || undefined, requestNote,
      items: selected.map((item) => ({ title: item.name, catalogItemId: cleanCatalogId(item.id), requestType: item.category, requestNote: indications[item.id] || requestNote }))
    });
    if (!response.ok) return setStatus("The request could not be saved. Check the active visit and try again.");
    const saved = await response.json() as ClinicalRequest;
    setSavedRequestId(saved.id);
    setStatus("Request saved to this visit. It is ready for the dedicated print view.");
    setSelected([]);
    setIndications({});
    await loadRequests();
  }

  async function saveSet() {
    const ids = selected.map((item) => cleanCatalogId(item.id)).filter(Boolean) as string[];
    if (!setName.trim() || ids.length !== selected.length) return setStatus("Name the set and use approved catalog investigations only.");
    const response = await apiPost("/investigations/favorite-sets", { name: setName.trim(), nameAr: setNameAr.trim() || undefined, scope: "personal", investigationCatalogItemIds: ids });
    if (!response.ok) return setStatus("The reusable set could not be saved.");
    setSetName(""); setSetNameAr(""); setStatus("Reusable investigation set saved."); await loadWorkspace();
  }

  async function setAction(id: string, action: "duplicate" | "archive") {
    const response = action === "archive" ? await apiRequest(`/investigations/favorite-sets/${id}`, "DELETE") : await apiPost(`/investigations/favorite-sets/${id}/duplicate`, {});
    setStatus(response.ok ? `Set ${action === "archive" ? "archived" : "duplicated"}.` : "The set could not be updated.");
    if (response.ok) await loadWorkspace();
  }

  async function followUp(id: string, action: "mark-result-received" | "review") {
    const response = await apiPost(`/clinical-requests/${id}/${action}`, {});
    setStatus(response.ok ? "Result follow-up updated." : "Result follow-up could not be updated.");
    if (response.ok) await loadRequests();
  }

  function printRequest(id: string) {
    window.open(`/clinical-requests/${encodeURIComponent(id)}/print`, "_blank", "noopener,noreferrer");
  }

  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">{hasPatientContext ? "Patient clinical workflow" : "Investigation center"}</p><h1>{hasPatientContext ? "New investigation request" : "Investigation Library, Templates & Result Follow-up"}</h1></div>{savedRequestId ? <button className="button secondary compact" type="button" onClick={() => printRequest(savedRequestId)}>Print saved request</button> : null}</div></section>
    <SafetyAlert />
    <nav className="investigation-mobile-tabs" aria-label="Investigation Center sections">
      {(["catalog", "sets", "followup", "manage"] as const).map((section) => <button className={activeSection === section ? "active" : ""} key={section} type="button" onClick={() => setActiveSection(section)}>{section === "followup" ? "Follow-up" : `${section[0]?.toUpperCase()}${section.slice(1)}`}</button>)}
    </nav>
    <section className={`content-grid investigation-catalog-layout ${hasPatientContext ? "patient-context" : "library-context"}`} data-mobile-active={activeSection}>
      <article className="panel investigation-workspace-panel">
        <div className="section-heading"><div><h2>{hasPatientContext ? "Catalog and request basket" : "Catalog and reusable sets"}</h2><p className="muted">Click an investigation to add it. Applying a set never orders automatically.</p></div><span className="badge">{status}</span></div>
        <form className="form-grid" onSubmit={submit} noValidate>
          {hasPatientContext ? <div className="patient-context-bar wide mobile-section mobile-catalog"><strong>{[patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || "Selected patient"}</strong><span>MRN: {patient?.medicalRecordNumber || "Patient file"}</span><span>Active visit locked</span></div> : <div className="notice wide mobile-section mobile-catalog"><strong>Management-only center</strong><span>Open Patient File → Current Visit → Investigations to save a real request.</span></div>}
          <label className="wide mobile-section mobile-catalog">Search catalog<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CBC, AMH, ferritin, CA-125, Pap, HPV, ultrasound" /></label>
          <div className="investigation-category-sidebar wide mobile-section mobile-catalog" aria-label="Investigation categories">{categoryTabs.map((tab) => <button className={category === tab ? "active" : ""} key={tab} type="button" onClick={() => setCategory((current) => current === tab ? "" : tab)}>{tab}</button>)}</div>
          <div className="wide investigation-quick-sections mobile-section mobile-catalog"><CatalogList title="Favorites" items={workspace.favorites ?? []} onAdd={add} /><CatalogList title="Common and high priority" items={workspace.highPriority ?? []} onAdd={add} /></div>
          <div className="wide data-list mobile-section mobile-catalog">{visibleCatalog.slice(0, 30).map((item) => <button className="picker-row" key={item.id} type="button" onClick={() => add(item)}><strong>{item.name}</strong><span>{[item.category, item.subcategory, item.modality].filter(Boolean).join(" · ")}</span></button>)}{!visibleCatalog.length ? <p className="empty-state compact smart-empty-state">No catalog items match this view.</p> : null}</div>
          <section className="wide compact-panel mobile-section mobile-sets"><div className="section-heading compact-section-heading"><h3>Reusable investigation sets</h3><span className="badge">{workspace.favoriteSets?.length ?? 0}</span></div><div className="dense-card-list">{(workspace.favoriteSets ?? []).map((set) => <div className="data-row" key={set.id}><button className="picker-row" type="button" onClick={() => applySet(set)}><strong>{set.name}{set.nameAr ? ` / ${set.nameAr}` : ""}</strong><span>{set.items.length} investigations · {set.scope ?? "personal"}</span></button><div className="form-actions"><button className="button secondary compact" type="button" onClick={() => void setAction(set.id, "duplicate")}>Duplicate</button><button className="button secondary compact" type="button" onClick={() => void setAction(set.id, "archive")}>Archive</button></div></div>)}</div></section>
          <section className="wide selected-item-basket mobile-section mobile-catalog"><div className="section-heading compact-section-heading"><h3>Selected basket</h3><span className="badge">{selected.length}</span></div>{selected.map((item, index) => <article className="request-chip investigation-basket-row" key={item.id}><div><strong>{item.name}</strong><em>{item.category}</em></div><input aria-label={`Clinical indication for ${item.name}`} value={indications[item.id] ?? ""} onChange={(event) => setIndications((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Clinical indication" /><div className="form-actions"><button type="button" onClick={() => move(index, -1)} aria-label={`Move ${item.name} up`}>↑</button><button type="button" onClick={() => move(index, 1)} aria-label={`Move ${item.name} down`}>↓</button><button type="button" onClick={() => remove(index)}>Remove</button></div></article>)}{removed ? <button className="button secondary compact" type="button" onClick={undoRemove}>Undo remove</button> : null}{!selected.length ? <p className="empty-state compact smart-empty-state">No investigations selected.</p> : null}</section>
          <div className="form-actions wide mobile-section mobile-sets"><input aria-label="Set English name" value={setName} onChange={(event) => setSetName(event.target.value)} placeholder="Custom set name" /><input aria-label="Set Arabic name" dir="rtl" value={setNameAr} onChange={(event) => setSetNameAr(event.target.value)} placeholder="اسم المجموعة بالعربية" /><button className="button secondary" type="button" disabled={!selected.length} onClick={() => void saveSet()}>Save as custom set</button></div>
          {hasPatientContext ? <div className="mobile-section mobile-catalog investigation-request-fields"><label>Overall indication<input value={requestNote} onChange={(event) => setRequestNote(event.target.value)} /></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></label><label>Follow-up deadline<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label><div className="form-actions wide"><button className="button" type="submit" disabled={!selected.length}>Save to visit</button><button className="button secondary" type="button" onClick={() => { setSelected([]); setIndications({}); }}>Clear basket</button></div></div> : null}
        </form>
      </article>
      <article className="panel"><div className="section-heading"><h2>Cross-patient result follow-up</h2><span className="badge">{requests.length}</span></div><div className="data-list">{requests.map((request) => <article className="data-row" key={request.id}><div className="data-row-header"><strong>{request.title}</strong><span className="badge">{request.status.replaceAll("_", " ")}</span></div><p className="muted">{request.followUpHintActive ? "Follow-up remains active until doctor review." : "Follow-up resolved."}</p><div className="form-actions"><button className="button secondary compact" type="button" onClick={() => printRequest(request.id)}>Print request</button><button className="button secondary compact" type="button" onClick={() => void followUp(request.id, "mark-result-received")}>Result received</button><button className="button secondary compact" type="button" onClick={() => void followUp(request.id, "review")}>Doctor reviewed</button></div></article>)}{!requests.length ? <p className="empty-state compact smart-empty-state">No requests are visible in your permitted scope.</p> : null}</div></article>
      <article className="panel mobile-manage-panel"><div className="section-heading"><h2>Catalog management</h2><span className="badge">Manage</span></div><p className="muted">Manage active catalog categories and reusable sets without mixing controls into a patient ordering workspace.</p><div className="investigation-category-sidebar">{categoryTabs.map((tab) => <button className={category === tab ? "active" : ""} key={`manage-${tab}`} type="button" onClick={() => setCategory(tab)}>{tab}</button>)}</div></article>
    </section>
  </AppShell>;
}

function CatalogList({ title, items, onAdd }: { title: string; items: CatalogItem[]; onAdd: (item: CatalogItem) => void }) {
  return <section className="compact-panel"><div className="section-heading compact-section-heading"><h3>{title}</h3><span className="badge">{items.length}</span></div>{items.slice(0, 8).map((item) => <button className="picker-row" key={`${title}-${item.id}`} type="button" onClick={() => onAdd(item)}><strong>{item.name}</strong><span>{item.category}</span></button>)}{!items.length ? <p className="muted">No items yet.</p> : null}</section>;
}

function cleanCatalogId(id: string) { return id; }
function basketStorageKey(patientId: string, encounterId: string) { return `prij-investigation-basket:${patientId}:${encounterId}`; }
function uniqueCatalogItems(items: CatalogItem[]) { return items.filter((item, index) => Boolean(item?.id) && items.findIndex((candidate) => candidate.id === item.id) === index); }
async function apiGet(endpoint: string) { const response = await apiRequest(endpoint, "GET"); if (!response.ok) { const body = await response.json().catch(() => null) as { error?: { message?: string; requestId?: string } } | null; throw new Error(`${body?.error?.message ?? "Investigation request failed."}${body?.error?.requestId ? ` Request ${body.error.requestId}.` : ""}`); } return response.json(); }
async function apiPost(endpoint: string, payload: Record<string, unknown>) { return apiRequest(endpoint, "POST", payload); }
async function apiRequest(endpoint: string, method: "GET" | "POST" | "DELETE", payload?: Record<string, unknown>) { const token = sessionStorage.getItem("prijClinicToken"); return fetch(`${getApiBaseUrl()}${endpoint}`, { method, credentials: "include", headers: { ...(payload ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: payload ? JSON.stringify(payload) : undefined }).catch(() => new Response(null, { status: 500 })); }
