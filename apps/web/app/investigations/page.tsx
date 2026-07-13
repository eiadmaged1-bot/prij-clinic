"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { PatientPicker, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { AppShell, SafetyAlert } from "../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { expandSearchShortcut } from "@/lib/search-shortcuts";

type CatalogItem = { id: string; name: string; category: string; subcategory?: string | null; modality?: string | null; favorite?: boolean; isHighPriority?: boolean };
type InvestigationTemplate = { name: string; category: string; subcategory?: string; items: string[] };
type FavoriteSet = { id: string; name: string; defaultVisitType?: string | null; items: Array<{ investigationCatalogItem: CatalogItem }> };
type ClinicalRequest = { id: string; title: string; status: string; patientId: string; requestNote?: string | null; followUpHintActive?: boolean; items?: Array<{ testName?: string; category?: string }> };
type Patient = PatientPickerPatient;

const masterLabCategories = ["Routine labs", "Pregnancy", "Infertility", "Gynecology", "Hormonal", "Infection", "Oncology", "Ultrasound", "Radiology", "Pathology", "Preoperative", "Other"];

export default function InvestigationsPage() {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<CatalogItem[]>([]);
  const [highPriority, setHighPriority] = useState<CatalogItem[]>([]);
  const [templates, setTemplates] = useState<InvestigationTemplate[]>([]);
  const [favoriteSets, setFavoriteSets] = useState<FavoriteSet[]>([]);
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [requests, setRequests] = useState<ClinicalRequest[]>([]);
  const patients: Patient[] = [];
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [indications, setIndications] = useState<Record<string, string>>({});
  const [priority, setPriority] = useState("routine");
  const [followUpDate, setFollowUpDate] = useState("");
  const [setName, setSetName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routePatientId = params.get("patientId");
    const routeVisitId = params.get("visitId") ?? params.get("encounterId");
    if (routePatientId) setPatientId(routePatientId);
    if (routeVisitId) setEncounterId(routeVisitId);
    void loadRequests();
  }, []);
  const searchCatalog = useCallback(async (value: string) => {
    const expanded = expandSearchShortcut(value);
    if (!expanded.trim() && !category) {
      setCatalog([]);
      return;
    }
    const params = new URLSearchParams();
    if (expanded.trim()) params.set("q", expanded);
    if (category) params.set("category", category);
    const data = await apiGet(`/investigations/catalog?${params.toString()}`);
    setCatalog((data.investigationCatalog ?? []) as CatalogItem[]);
    setCategories((data.categories ?? []) as string[]);
    setFavorites((data.favorites ?? []) as CatalogItem[]);
    setHighPriority((data.highPriority ?? []) as CatalogItem[]);
    setTemplates((data.templates ?? []) as InvestigationTemplate[]);
    setFavoriteSets((data.favoriteSets ?? []) as FavoriteSet[]);
  }, [category]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void searchCatalog(query); }, 220);
    return () => window.clearTimeout(timeout);
  }, [query, category, searchCatalog]);

  async function loadRequests() {
    const data = await apiGet("/clinical-requests");
    setRequests((data.clinicalRequests ?? []) as ClinicalRequest[]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId.trim() || !encounterId.trim() || selected.length === 0) {
      setStatus("Open an active patient visit and select at least one request.");
      return;
    }
    const response = await apiPost("/clinical-requests", {
      patientId: patientId.trim(),
      encounterId: encounterId.trim(),
      priority,
      requestedFollowUpDate: followUpDate || undefined,
      requestNote,
      items: selected.map((item) => ({ title: item.name, catalogItemId: item.id.startsWith("template-") ? undefined : item.id, requestType: item.category, requestNote: indications[item.id] || requestNote }))
    });
    setStatus(response.ok ? "Clinical request saved with follow-up hint." : "Could not save clinical request.");
    if (response.ok) {
      setSelected([]);
      setIndications({});
      setQuery("");
      void loadRequests();
    }
  }

  async function action(id: string, endpoint: string) {
    const response = await apiPost(`/clinical-requests/${id}/${endpoint}`, {});
    setStatus(response.ok ? "Result follow-up updated." : "Could not update result follow-up.");
    if (response.ok) void loadRequests();
  }

  async function star(item: CatalogItem) {
    const response = await apiPost(`/investigations/catalog/${item.id}/${item.favorite ? "unfavorite" : "favorite"}`, {});
    if (response.ok) void searchCatalog(query);
  }

  function addTemplate(template: InvestigationTemplate) {
    const additions = template.items.map((name) => ({ id: `template-${template.name}-${name}`, name, category: template.category, subcategory: template.subcategory }));
    setSelected((current) => [...current, ...additions.filter((item) => !current.some((existing) => existing.name === item.name))]);
  }

  function applyFavoriteSet(favoriteSet: FavoriteSet) {
    setSelected((current) => [...current, ...favoriteSet.items.map((item) => item.investigationCatalogItem).filter((item) => !current.some((existing) => existing.id === item.id))]);
  }

  async function saveFavoriteSet() {
    if (!setName.trim() || selected.some((item) => item.id.startsWith("template-"))) {
      setStatus("Name the set and select catalog investigations only.");
      return;
    }
    const response = await apiPost("/investigations/favorite-sets", { name: setName.trim(), investigationCatalogItemIds: selected.map((item) => item.id) });
    setStatus(response.ok ? "Favorite set saved." : "Could not save favorite set.");
    if (response.ok) { setSetName(""); void searchCatalog(query); }
  }

  async function favoriteSetAction(id: string, actionName: "duplicate" | "archive") {
    const response = actionName === "archive" ? await apiRequest(`/investigations/favorite-sets/${id}`, "DELETE") : await apiPost(`/investigations/favorite-sets/${id}/duplicate`, {});
    setStatus(response.ok ? `Favorite set ${actionName === "archive" ? "archived" : "duplicated"}.` : "Could not update favorite set.");
    if (response.ok) void searchCatalog(query);
  }

  function moveSelected(index: number, direction: -1 | 1) {
    setSelected((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const selectedItem = next[index];
      const targetItem = next[target];
      if (!selectedItem || !targetItem) return current;
      next[index] = targetItem;
      next[target] = selectedItem;
      return next;
    });
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical Requests</p>
            <h1>Requested Investigations</h1>
          </div>
          <button className="button secondary compact" type="button" disabled={!patientId || !encounterId || selected.length === 0} onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print
          </button>
        </div>
      </section>
      <SafetyAlert />
      <section className="content-grid investigation-catalog-layout">
        <article className="panel">
          <div className="section-heading"><h2>Request Builder</h2><span className="badge">{status}</span></div>
          <form className="form-grid" onSubmit={submit}>
            <div className="wide">
              {encounterId ? <p className="selected-patient-card"><strong>Locked active visit</strong><span>Investigations inherit patient and visit context.</span></p> : <PatientPicker patients={patients} selectedPatientId={patientId} onSelect={setPatientId} required standaloneLabel="Select a patient and active visit before saving this request." />}
            </div>
            <label className="wide">Search catalog<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CBC, AMH, ferritin, CA-125, Pap, HPV, ultrasound, histopathology" /></label>
            <div className="investigation-category-sidebar wide" aria-label="Investigation category filters">
              {masterLabCategories.map((item) => (
                <button className={query === item ? "active" : ""} key={item} type="button" onClick={() => { setCategory(""); setQuery((current) => current === item ? "" : item); }}>{item}</button>
              ))}
            </div>
            {categories.length ? <label className="wide">Catalog category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label> : null}
            {category ? (
              <div className="wide selected-patient-card">
                <strong>{category}</strong>
                <span>{catalog.length} investigations in this category. Same lab may appear in multiple categories; ordering uses one master investigation item where configured.</span>
              </div>
            ) : null}
            <div className="wide investigation-quick-sections">
              <QuickCatalogSection title="Favorites" items={favorites} onAdd={setSelected} onStar={star} />
              <QuickCatalogSection title="High Priority / Common" items={highPriority} onAdd={setSelected} onStar={star} />
            </div>
            <div className="wide template-list">
              {templates.map((template) => <button className="picker-row" key={template.name} type="button" onClick={() => addTemplate(template)}><strong>{template.name}</strong><span>{template.category}</span></button>)}
            </div>
            <section className="wide compact-panel" aria-label="Saved investigation sets">
              <div className="section-heading compact-section-heading"><h3>My investigation sets</h3><span className="badge">{favoriteSets.length}</span></div>
              <div className="dense-card-list">
                {favoriteSets.map((favoriteSet) => (
                  <div className="data-row" key={favoriteSet.id}>
                    <button className="picker-row" type="button" onClick={() => applyFavoriteSet(favoriteSet)}><strong>{favoriteSet.name}</strong><span>{favoriteSet.items.length} investigations · apply set</span></button>
                    <div className="form-actions">
                      <button className="button secondary compact" type="button" onClick={() => void favoriteSetAction(favoriteSet.id, "duplicate")}>Duplicate</button>
                      <button className="button secondary compact" type="button" onClick={() => void favoriteSetAction(favoriteSet.id, "archive")}>Archive</button>
                    </div>
                  </div>
                ))}
                {!favoriteSets.length ? <p className="muted">Save the current basket to create a reusable set.</p> : null}
              </div>
            </section>
            <div className="data-list">
              {catalog.slice(0, 10).map((item) => (
                <div className="data-row" key={item.id}>
                  <button className="picker-row" type="button" onClick={() => setSelected((current) => current.some((selectedItem) => selectedItem.id === item.id) ? current : [...current, item])}>
                    <strong>{item.name}</strong><span>{[item.category, item.subcategory, item.modality].filter(Boolean).join(" / ")}</span>
                  </button>
                  <button className="button secondary compact" type="button" onClick={() => void star(item)}>{item.favorite ? "Starred" : "Star"}</button>
                </div>
              ))}
              {!query.trim() && !category ? <p className="empty-state compact smart-empty-state">Search or choose a category to browse requests.</p> : null}
              {category && catalog.length === 0 ? <p className="empty-state compact smart-empty-state">No investigations in this category yet.</p> : null}
            </div>
            <div className="selected-request-chips wide" data-selected-request-chips aria-label="Selected investigation request basket">
              {selected.length ? selected.map((item) => (
                <article className="request-chip investigation-basket-row" key={item.id}>
                  <strong>{item.name}</strong><em>{item.modality ?? item.category}</em>
                  <input aria-label={`Clinical indication for ${item.name}`} value={indications[item.id] ?? ""} onChange={(event) => setIndications((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Clinical indication" />
                  <span className="form-actions">
                    <button type="button" aria-label={`Move ${item.name} up`} onClick={() => moveSelected(selected.indexOf(item), -1)}>↑</button>
                    <button type="button" aria-label={`Move ${item.name} down`} onClick={() => moveSelected(selected.indexOf(item), 1)}>↓</button>
                    <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setSelected((current) => current.filter((selectedItem) => selectedItem.id !== item.id))}>×</button>
                  </span>
                </article>
              )) : <span className="empty-state compact smart-empty-state">No requests selected</span>}
            </div>
            <label>Overall clinical note<input value={requestNote} onChange={(event) => setRequestNote(event.target.value)} /></label>
            <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></label>
            <label>Follow-up date<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
            <div className="form-actions wide"><input aria-label="Favorite set name" value={setName} onChange={(event) => setSetName(event.target.value)} placeholder="New favorite set name" /><button className="button secondary" type="button" disabled={!selected.length} onClick={() => void saveFavoriteSet()}>Save as set</button></div>
            <button className="button" type="submit" disabled={!patientId || !encounterId || selected.length === 0}>Attach to locked visit</button>
            <button className="button secondary" type="button" disabled={!patientId || !encounterId || selected.length === 0} onClick={() => window.print()}>Print</button>
          </form>
        </article>
        <article className="panel">
          <div className="section-heading"><h2>Result Follow-up</h2><span className="badge">{requests.length}</span></div>
          <div className="data-list">
            {requests.map((request) => (
              <article className="data-row" key={request.id}>
                <div className="data-row-header"><strong>{request.title}</strong><span className="badge">{friendly(request.status)}</span></div>
                <p className="muted">{request.followUpHintActive ? "Follow-up needed until result or report is reviewed." : "Follow-up resolved."}</p>
                <div className="form-actions">
                  <button className="button secondary compact" type="button" onClick={() => void action(request.id, "mark-result-received")}>Result received</button>
                  <button className="button secondary compact" type="button" onClick={() => void action(request.id, "review")}>Reviewed</button>
                  <button className="button secondary compact" type="button" onClick={() => void action(request.id, "cancel")}>Cancel</button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}

function friendly(value: string) {
  return value.replaceAll("_", " ");
}

function QuickCatalogSection({
  title,
  items,
  onAdd,
  onStar
}: {
  title: string;
  items: CatalogItem[];
  onAdd: (updater: (current: CatalogItem[]) => CatalogItem[]) => void;
  onStar: (item: CatalogItem) => Promise<void>;
}) {
  return (
    <section className="compact-panel">
      <div className="section-heading compact-section-heading"><h3>{title}</h3><span className="badge">{items.length}</span></div>
      <div className="dense-card-list">
        {items.slice(0, 6).map((item) => (
          <button className="picker-row" key={`${title}-${item.id}`} type="button" onClick={() => onAdd((current) => current.some((selected) => selected.id === item.id) ? current : [...current, item])}>
            <strong>{item.name}</strong>
            <span>{item.category}</span>
            <span onClick={(event) => { event.stopPropagation(); void onStar(item); }}>{item.favorite ? "Starred" : "Star"}</span>
          </button>
        ))}
        {items.length === 0 ? <p className="muted">No items yet.</p> : null}
      </div>
    </section>
  );
}

async function apiGet(endpoint: string) {
  const token = sessionStorage.getItem("prijClinicToken");
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
  return response?.ok ? response.json() : {};
}

async function apiPost(endpoint: string, payload: Record<string, unknown>) {
  return apiRequest(endpoint, "POST", payload);
}

async function apiRequest(endpoint: string, method: "POST" | "DELETE", payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 500 }));
}
