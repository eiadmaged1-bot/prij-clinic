"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { patientTypeLabel, phaseTypeLabel } from "@/lib/patient-labels";

export type PatientPickerPatient = {
  id: string;
  medicalRecordNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  phoneSuffix?: string | null;
  status?: string | null;
  patientType?: string | null;
  createdAt?: string | null;
  latestVisitDate?: string | null;
  dateOfBirth?: string | null;
  yearOfBirth?: number | null;
  branch?: { name?: string | null } | null;
  queueState?: { status?: string | null; queueNumber?: number | null } | null;
  currentPhase?: { phaseType?: string | null } | null;
};

type PatientPickerProps = {
  patients: PatientPickerPatient[];
  selectedPatientId?: string;
  onSelect: (patientId: string) => void;
  onPatientSelect?: (patient: PatientPickerPatient | null) => void;
  allowStandalone?: boolean;
  standaloneLabel?: string;
  label?: string;
  required?: boolean;
  liveSearch?: boolean;
  minSearchLength?: number;
  storageKey?: string;
};

export function PatientPicker({
  patients,
  selectedPatientId = "",
  onSelect,
  onPatientSelect,
  allowStandalone = false,
  standaloneLabel = "Standalone draft",
  label = "Choose patient",
  required = false,
  liveSearch = true,
  minSearchLength = 2,
  storageKey = "patient-search"
}: PatientPickerProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<PatientPickerPatient | null>(null);
  const [livePatients, setLivePatients] = useState<PatientPickerPatient[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchState, setSearchState] = useState<"idle" | "loading" | "ready" | "empty" | "permission" | "error">("idle");
  const resultsRef = useRef<HTMLDivElement>(null);
  const sourcePatients = liveSearch ? livePatients : patients;
  const selected = sourcePatients.find((patient) => patient.id === selectedPatientId) ?? patients.find((patient) => patient.id === selectedPatientId) ?? (selectedSnapshot?.id === selectedPatientId ? selectedSnapshot : null);

  useEffect(() => {
    const savedQuery = sessionStorage.getItem(`prij:${storageKey}:query`);
    if (savedQuery) setQuery(savedQuery);
    const savedScroll = Number(sessionStorage.getItem(`prij:${storageKey}:scroll`) ?? "0");
    if (savedScroll) requestAnimationFrame(() => resultsRef.current?.scrollTo({ top: savedScroll }));
  }, [storageKey]);

  useEffect(() => { sessionStorage.setItem(`prij:${storageKey}:query`, query); }, [query, storageKey]);

  useEffect(() => {
    if (!liveSearch) return;
    const text = query.trim();
    if (text.length < minSearchLength) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchError("");
      setSearchState("loading");
      void fetchPatients(text, 1)
        .then((data) => { setLivePatients(data.patients); setHasMore(data.hasMore); setSearchState(data.patients.length ? "ready" : "empty"); })
        .catch((error: PatientSearchError) => { setSearchState(error.kind); setSearchError(error.message); });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [liveSearch, minSearchLength, query]);

  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (text.length < minSearchLength) return [];
    return sourcePatients
      .filter((patient) => patientSearchText(patient).includes(text));
  }, [minSearchLength, query, sourcePatients]);

  return (
    <div className="patient-picker" data-patient-picker>
      <div className="section-heading compact-heading">
        <div><h3>{label}</h3><p className="muted">{selected ? "Selected patient" : required ? "Select a patient before continuing" : "Patient can be attached later"}</p></div>
        {selected ? <button className="button secondary compact" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Collapse" : "Change patient"}</button> : null}
      </div>
      {selected ? <SelectedPatientSummary patient={selected} /> : <p className="empty-state compact smart-empty-state"><span>{required ? "No patient selected." : standaloneLabel}</span></p>}
      {expanded ? <div className="patient-picker-panel">
        <label>Search patient<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, phone, MRN, or permanent QR" aria-label="Search patient" /></label>
        {searchState === "loading" ? <p className="muted" role="status">Searching permitted clinic patient files…</p> : null}
        {searchError ? <p className={searchState === "permission" ? "form-error" : "notice"} role="alert">{searchError}</p> : null}
        <div className="dense-card-list patient-picker-results" ref={resultsRef} onScroll={(event) => sessionStorage.setItem(`prij:${storageKey}:scroll`, String(event.currentTarget.scrollTop))} aria-label="Patient results">
          {allowStandalone ? <article className={`patient-search-card ${!selectedPatientId ? "active" : ""}`}>
            <div className="patient-search-card-info">
              <strong>{standaloneLabel}</strong>
              <span>No patient file attached</span>
            </div>
            <div className="patient-search-card-actions"><button className="button secondary compact" type="button" onClick={() => { setSelectedSnapshot(null); onSelect(""); onPatientSelect?.(null); }}>Select</button></div>
          </article> : null}
          {query.trim().length < minSearchLength ? <p className="empty-state compact smart-empty-state"><span>Enter at least {minSearchLength} characters.</span></p> : null}
          {matches.map((patient) => <PatientSearchResult key={patient.id} patient={patient} selected={selectedPatientId === patient.id} onSelect={() => { setSelectedSnapshot(patient); onSelect(patient.id); onPatientSelect?.(patient); }} />)}
          {query.trim().length >= minSearchLength && searchState === "empty" && !matches.length ? <p className="empty-state compact smart-empty-state"><span>No matching patients.</span></p> : null}
          {hasMore ? <button className="button secondary compact" type="button" onClick={() => { const nextPage = page + 1; void fetchPatients(query.trim(), nextPage).then((data) => { setLivePatients((current) => [...current, ...data.patients.filter((row) => !current.some((item) => item.id === row.id))]); setPage(nextPage); setHasMore(data.hasMore); }).catch(() => setSearchError("Could not load more patients. Existing results were kept.")); }}>Load more patients</button> : null}
        </div>
      </div> : null}
    </div>
  );
}

export function SelectedPatientSummary({ patient }: { patient: PatientPickerPatient }) {
  return <div className="selected-patient-card"><strong>{patientLabel(patient)}</strong><span>{patient.medicalRecordNumber ?? "No MRN"} | {patientAgeLabel(patient)} | {patient.status ?? "active"} | today: {patient.queueState?.status ? `${patient.queueState.status}${patient.queueState.queueNumber ? ` #${patient.queueState.queueNumber}` : ""}` : "not queued"}</span></div>;
}

export function PatientSearchResult({ patient, selected = false, onSelect }: { patient: PatientPickerPatient; selected?: boolean; onSelect?: () => void }) {
  return <article className={`patient-search-card ${selected ? "active" : ""}`}>
    <div className="patient-search-card-info">
      <strong>{patientLabel(patient)}</strong>
      <span>{patient.medicalRecordNumber ?? "No MRN"} | phone …{patient.phoneSuffix ?? patient.phone?.replace(/\D/g, "").slice(-4) ?? "none"} | {patientAgeLabel(patient)} | {patient.patientType ? patientTypeLabel(patient.patientType) : phaseTypeLabel(patient.currentPhase?.phaseType)}</span>
      <span>{patient.status ?? "active"} | {patient.branch?.name ?? "Branch unavailable"} | {patient.queueState?.status ? `queue ${patient.queueState.status}${patient.queueState.queueNumber ? ` #${patient.queueState.queueNumber}` : ""}` : "not queued"} | {patient.latestVisitDate ? `last visit ${patient.latestVisitDate.slice(0, 10)}` : "no visit"}</span>
    </div>
    {onSelect ? <div className="patient-search-card-actions"><button className="button secondary compact" type="button" onClick={onSelect}>Select</button></div> : null}
  </article>;
}

export function patientLabel(patient?: PatientPickerPatient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

export function patientSearchText(patient?: PatientPickerPatient | null) {
  return `${patientLabel(patient)} ${patient?.medicalRecordNumber ?? ""} ${patient?.phone ?? ""} ${patient?.status ?? ""} ${patient?.patientType ?? ""}`.toLowerCase();
}

async function fetchPatients(query: string, page: number) {
  const token = sessionStorage.getItem("prijClinicToken");
  const params = new URLSearchParams({ q: query, page: String(page), limit: "20" });
  const response = await fetch(`${getApiBaseUrl()}/patients?${params.toString()}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string; requestId?: string } } | null;
    const request = body?.error?.requestId ? ` Request ${body.error.requestId}.` : "";
    if (response.status === 401) throw new PatientSearchError("permission", `Your session expired. Sign in again.${request}`);
    if (response.status === 403) throw new PatientSearchError("permission", `You do not have permission to search patient files.${request}`);
    throw new PatientSearchError("error", `${body?.error?.message ?? "Patient search is temporarily unavailable."} Your selection and prior results were kept.${request}`);
  }
  const data = (await response.json()) as { patients?: PatientPickerPatient[]; pageInfo?: { hasMore?: boolean } };
  return { patients: data.patients ?? [], hasMore: Boolean(data.pageInfo?.hasMore) };
}

function patientAgeLabel(patient: PatientPickerPatient) {
  if (patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth);
    const now = new Date();
    const age = now.getUTCFullYear() - dob.getUTCFullYear() - (now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate()) ? 1 : 0);
    return `age ${age}`;
  }
  return patient.yearOfBirth ? `approximately ${new Date().getUTCFullYear() - patient.yearOfBirth} years (born ${patient.yearOfBirth})` : "age unavailable";
}

class PatientSearchError extends Error {
  constructor(readonly kind: "permission" | "error", message: string) { super(message); }
}
