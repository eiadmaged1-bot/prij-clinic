"use client";

import { FormEvent, useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { PatientPicker, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { AppShell, SafetyAlert } from "../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { expandSearchShortcut } from "@/lib/search-shortcuts";

type CatalogItem = { id: string; name: string; category: string; modality?: string | null };
type ClinicalRequest = { id: string; title: string; status: string; patientId: string; requestNote?: string | null; followUpHintActive?: boolean; items?: Array<{ testName?: string; category?: string }> };
type Patient = PatientPickerPatient;

export default function InvestigationsPage() {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [requests, setRequests] = useState<ClinicalRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const routePatientId = params.get("patientId");
    if (routePatientId) setPatientId(routePatientId);
    void loadRequests();
    void loadPatients();
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => { void searchCatalog(query); }, 220);
    return () => window.clearTimeout(timeout);
  }, [query]);

  async function searchCatalog(value: string) {
    const expanded = expandSearchShortcut(value);
    const data = await apiGet(`/investigations/catalog${expanded.trim() ? `?q=${encodeURIComponent(expanded)}` : ""}`);
    setCatalog((data.investigationCatalog ?? []) as CatalogItem[]);
  }

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
      items: selected.map((item) => ({ title: item.name, catalogItemId: item.id, requestType: item.category, requestNote }))
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

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical Requests</p>
            <h1>Requested Investigations</h1>
          </div>
          <button className="button secondary compact" type="button" onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print request
          </button>
        </div>
        <p className="muted">Create lab, imaging, pathology, cytology, tumor marker, specialist report, and external procedure requests. Follow-up stays active until results or reports are received and reviewed.</p>
      </section>
      <SafetyAlert />
      <section className="content-grid">
        <article className="panel">
          <div className="section-heading"><h2>Request Builder</h2><span className="badge">{status}</span></div>
          <form className="form-grid" onSubmit={submit}>
            <div className="wide">
              <PatientPicker patients={patients} selectedPatientId={patientId} onSelect={setPatientId} required standaloneLabel="Select a patient file before saving this request." />
            </div>
            <label>Search catalog<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CBC, ferritin, CA-125, X-ray, 4D ultrasound, vascular report" /></label>
            <div className="data-list">
              {catalog.slice(0, 10).map((item) => (
                <button className="data-row" key={item.id} type="button" onClick={() => setSelected((current) => current.some((selectedItem) => selectedItem.id === item.id) ? current : [...current, item])}>
                  <div className="data-row-header"><strong>{item.name}</strong><span className="badge">{item.modality ?? item.category}</span></div>
                </button>
              ))}
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
            <button className="button" type="submit">Attach to patient</button>
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
