"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { PatientPicker, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { AppShell, SafetyAlert } from "../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { expandSearchShortcut } from "@/lib/search-shortcuts";

type CatalogItem = { id: string; name: string; category: string; subcategory?: string | null; modality?: string | null; favorite?: boolean; isHighPriority?: boolean };
type InvestigationTemplate = { name: string; category: string; subcategory?: string; items: string[] };
type ClinicalRequest = { id: string; title: string; status: string; patientId: string; requestNote?: string | null; followUpHintActive?: boolean; items?: Array<{ testName?: string; category?: string }> };
type Patient = PatientPickerPatient;

export default function InvestigationsPage() {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<CatalogItem[]>([]);
  const [highPriority, setHighPriority] = useState<CatalogItem[]>([]);
  const [templates, setTemplates] = useState<InvestigationTemplate[]>([]);
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [requests, setRequests] = useState<ClinicalRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routePatientId = params.get("patientId");
    if (routePatientId) setPatientId(routePatientId);
    void loadRequests();
    void loadPatients();
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
  }, [category]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void searchCatalog(query); }, 220);
    return () => window.clearTimeout(timeout);
  }, [query, category, searchCatalog]);

  async function loadRequests() {
    const data = await apiGet("/clinical-requests");
    setRequests((data.clinicalRequests ?? []) as ClinicalRequest[]);
  }

  async function loadPatients() {
    const data = await apiGet("/patients");
    setPatients((data.patients ?? []) as Patient[]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId.trim() || selected.length === 0) {
      setStatus("Select a patient and at least one request.");
      return;
    }
    const response = await apiPost("/clinical-requests", {
      patientId: patientId.trim(),
      requestNote,
      items: selected.map((item) => ({ title: item.name, catalogItemId: item.id.startsWith("template-") ? undefined : item.id, requestType: item.category, requestNote }))
    });
    setStatus(response.ok ? "Clinical request saved with follow-up hint." : "Could not save clinical request.");
    if (response.ok) {
      setSelected([]);
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

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical Requests</p>
            <h1>Requested Investigations</h1>
          </div>
          <button className="button secondary compact" type="button" disabled={!patientId || selected.length === 0} onClick={() => window.print()}>
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
              <PatientPicker patients={patients} selectedPatientId={patientId} onSelect={setPatientId} required standaloneLabel="Select a patient file before saving this request." />
            </div>
            <label className="wide">Search catalog<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CBC, AMH, ferritin, CA-125, Pap, HPV, ultrasound, histopathology" /></label>
            <div className="investigation-category-sidebar wide" aria-label="Investigation category filters">
              {categories.map((item) => (
                <button className={category === item ? "active" : ""} key={item} type="button" onClick={() => setCategory((current) => current === item ? "" : item)}>{item}</button>
              ))}
            </div>
            <div className="wide investigation-quick-sections">
              <QuickCatalogSection title="Favorites" items={favorites} onAdd={setSelected} onStar={star} />
              <QuickCatalogSection title="High Priority / Common" items={highPriority} onAdd={setSelected} onStar={star} />
            </div>
            <div className="wide template-list">
              {templates.map((template) => <button className="picker-row" key={template.name} type="button" onClick={() => addTemplate(template)}><strong>{template.name}</strong><span>{template.category}</span></button>)}
            </div>
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
            </div>
            <div className="selected-request-chips wide" data-selected-request-chips>
              {selected.length ? selected.map((item) => (
                <span className="request-chip" key={item.id}>
                  <strong>{item.name}</strong>
                  <em>{item.modality ?? item.category}</em>
                  <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setSelected((current) => current.filter((selectedItem) => selectedItem.id !== item.id))}>x</button>
                </span>
              )) : <span className="empty-state compact smart-empty-state">No requests selected</span>}
            </div>
            <label>Clinical note per request<input value={requestNote} onChange={(event) => setRequestNote(event.target.value)} /></label>
            <button className="button" type="submit" disabled={!patientId || selected.length === 0}>Attach to patient</button>
            <button className="button secondary" type="button" disabled={!patientId || selected.length === 0} onClick={() => window.print()}>Print</button>
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
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  }).catch(() => new Response(null, { status: 500 }));
}
