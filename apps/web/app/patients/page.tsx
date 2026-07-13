"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../mvp-page";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { ageLabel, patientTypeLabel, patientTypeOptions, phaseTypeLabel } from "@/lib/patient-labels";

type Patient = {
  id: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  sex?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  patientType?: string | null;
  currentPhase?: { phaseType?: string | null; title?: string | null; status?: string | null } | null;
  branchId?: string | null;
  createdAt?: string | null;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState("Loading patient files");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState("all");
  const [exactDate, setExactDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [patientStatus, setPatientStatus] = useState("all");
  const [patientType, setPatientType] = useState("all");
  const [phaseType, setPhaseType] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState("created_newest");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const text = query.trim();
    const timer = window.setTimeout(() => void loadPatients(text), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, patientStatus]);

  useEffect(() => {
    const savedCategory = localStorage.getItem("prijPatientDirectoryCategory");
    if (savedCategory) setCategory(savedCategory);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = patients.filter((patient) => {
      const textMatch = !q || `${patient.medicalRecordNumber} ${patient.firstName} ${patient.lastName} ${patient.phone ?? ""}`.toLowerCase().includes(q);
      const statusMatch = patientStatus === "all" || patient.status === patientStatus;
      const typeMatch = patientType === "all" || patient.patientType === patientType;
      const phaseMatch = phaseType === "all" || patient.currentPhase?.phaseType === phaseType;
      const dateMatch = matchesPatientDate(patient.createdAt, dateFilter, exactDate, rangeStart, rangeEnd, today);
      const categoryMatch = matchesCategory(patient, category, today);
      const trainingMatch = !isSeededTrainingRecord(patient);
      return textMatch && statusMatch && typeMatch && phaseMatch && dateMatch && categoryMatch && trainingMatch;
    });
    return sortPatients(rows, sortMode);
  }, [category, dateFilter, exactDate, patientStatus, patientType, phaseType, patients, query, rangeEnd, rangeStart, sortMode, today]);

  async function loadPatients(search = query.trim()) {
    const token = sessionStorage.getItem("prijClinicToken");
    setStatus("Loading");
    setError("");

    try {
      const params = new URLSearchParams({ includeArchived: String(patientStatus === "archived" || patientStatus === "all") });
      if (search) params.set("q", search);
      const response = await fetch(`${getApiBaseUrl()}/patients?${params.toString()}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      });

      if (response.status === 401) {
        setStatus("Login required");
        setPatients([]);
        return;
      }

      if (!response.ok) throw new Error("Patient files could not be loaded.");
      const data = (await response.json()) as { patients?: Patient[] };
      setPatients(data.patients ?? []);
      setStatus("Loaded");
    } catch (loadError) {
      setPatients([]);
      setStatus("Connection unavailable");
      setError(loadError instanceof Error ? loadError.message : "Unable to load patient files.");
    }
  }

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setVisibleCount(12);
    localStorage.setItem("prijPatientDirectoryCategory", nextCategory);
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setSortMode("created_newest");
    setDateFilter("all");
    setPatientStatus("all");
    setPatientType("all");
    setPhaseType("all");
    setVisibleCount(12);
    localStorage.removeItem("prijPatientDirectoryCategory");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Registration</p>
            <h1>Patient files</h1>
          </div>
          <Link className="button" href="/patients/new">
            <ThreeDMedicalIcon name="patients" size="sm" />
            New Patient File
          </Link>
        </div>
        <p className="muted">Find or create a patient file, then continue from the patient workspace.</p>
      </section>

      <SafetyAlert />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Patient directory</h2>
            <p className="muted">{status === "Loaded" ? `${filtered.length} matching patient files` : status}</p>
            <p className="muted">Search patient by name, phone, or file number.</p>
          </div>
          <button className="button secondary compact" onClick={() => void loadPatients()} type="button">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            Refresh
          </button>
        </div>

        <div className="toolbar">
          <label>
            Search by name, phone, MRN/file number, husband name, QR token
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by file number, name, phone, husband name, or QR"
              value={query}
            />
          </label>
          <label>
            Category
            <select onChange={(event) => selectCategory(event.target.value)} value={category}>
              <option value="all">All patients</option>
              <option value="today">Today&apos;s patients</option>
              <option value="ob">Obstetric / Pregnancy</option>
              <option value="gyn">Gynecology</option>
              <option value="infertility">Infertility</option>
              <option value="womens">Women&apos;s Health / General</option>
              <option value="high_risk">High-risk</option>
              <option value="needs_review">Needs review</option>
              <option value="follow_up_due">Follow-up due</option>
            </select>
          </label>
          <label>
            Sort by
            <select onChange={(event) => setSortMode(event.target.value)} value={sortMode}>
              <option value="created_newest">Created newest</option>
              <option value="created_oldest">Created oldest</option>
              <option value="name_az">Name A-Z</option>
              <option value="name_za">Name Z-A</option>
              <option value="file_number">File number</option>
              <option value="age_year">Age/year of birth</option>
            </select>
          </label>
        </div>

        <details className="filter-drawer">
          <summary>More Filters</summary>
          <div className="toolbar more-filter-grid">
            <label>Date<select onChange={(event) => setDateFilter(event.target.value)} value={dateFilter}><option value="all">Any date</option><option value="today">Seen / created today</option><option value="yesterday">Yesterday</option><option value="exact">Exact date</option><option value="range">Date range</option></select></label>
            {dateFilter === "exact" ? <label>Exact date<input type="date" value={exactDate} onChange={(event) => setExactDate(event.target.value)} /></label> : null}
            {dateFilter === "range" ? <label>From<input type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} /></label> : null}
            {dateFilter === "range" ? <label>To<input type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} /></label> : null}
            <label>Status<select onChange={(event) => setPatientStatus(event.target.value)} value={patientStatus}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
            <label>Patient type<select onChange={(event) => setPatientType(event.target.value)} value={patientType}><option value="all">All patient types</option>{patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Current phase<select onChange={(event) => setPhaseType(event.target.value)} value={phaseType}><option value="all">All phases</option><option value="infertility">Infertility</option><option value="pregnancy">Pregnancy</option><option value="gynecology">Gynecology</option><option value="postpartum">Postpartum</option><option value="general">General</option></select></label>
          </div>
        </details>
        <div className="form-actions"><button className="button secondary compact" type="button" onClick={clearFilters}>Clear filters</button></div>

        {error ? <p className="form-error">{error}</p> : null}
        {status === "Login required" ? (
          <div className="empty-state">
            Sign in before opening patient files. <Link href="/login">Go to login</Link>
          </div>
        ) : null}

        {status === "Loading" ? <div className="skeleton" /> : null}
        {status !== "Loading" && filtered.length === 0 && status !== "Login required" ? (
          <div className="empty-state smart-empty-state">
            <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
            <span>
              No patient files match this view. Create a new patient file to begin.
            </span>
            <Link className="button secondary compact" href="/patients/new">New Patient File</Link>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="data-list">
            {filtered.slice(0, visibleCount).map((patient) => (
              <article className="data-row patient-list-card" key={patient.id}>
                <div className="data-row-header">
                  <div className="patient-list-title">
                    <ThreeDMedicalIcon name="patients" size="sm" />
                    <div>
                      <strong>{patientDisplayName(patient)}</strong>
                      <span className="muted">{patient.sex || "Sex not set"} {patient.dateOfBirth ? `- ${patient.dateOfBirth.slice(0, 10)}` : ""}</span>
                    </div>
                  </div>
                  <span className="badge">{friendlyStatus(patient.status)}</span>
                </div>
                <div className="workflow-band compact">
                  <span>{patientTypeLabel(patient.patientType)}</span>
                  <span>{phaseTypeLabel(patient.currentPhase?.phaseType)}</span>
                </div>
                <dl>
                  <div>
                    <dt>File number</dt>
                    <dd>{patientFileNumber(patient)}</dd>
                  </div>
                  <div>
                    <dt>Age</dt>
                    <dd>{ageLabel(patient.dateOfBirth)}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{patient.phone || patient.email || "No contact saved"}</dd>
                  </div>
                </dl>
                <Link className="button secondary" href={`/patients/${patient.id}`}>
                  <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
                  Open file
                </Link>
                <Link className="button secondary compact" href={`/reception/check-in?patientId=${patient.id}`}>Add to queue</Link>
              </article>
            ))}
            {filtered.length > visibleCount ? (
              <button className="button secondary" type="button" onClick={() => setVisibleCount((count) => count + 12)}>Load more</button>
            ) : null}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

function matchesCategory(patient: Patient, category: string, today: string) {
  if (category === "all") return true;
  if (category === "today") return patient.createdAt?.slice(0, 10) === today;
  if (category === "ob") return patient.patientType === "OB" || patient.currentPhase?.phaseType === "pregnancy";
  if (category === "gyn") return patient.patientType === "GYN" || patient.currentPhase?.phaseType === "gynecology";
  if (category === "infertility") return patient.patientType === "INFERTILITY" || patient.currentPhase?.phaseType === "infertility";
  if (category === "womens") return patient.patientType === "WOMEN_HEALTH" || patient.patientType === "OTHER";
  if (category === "high_risk") return /high.?risk/i.test(`${patient.currentPhase?.title ?? ""} ${patient.currentPhase?.status ?? ""}`);
  if (category === "needs_review") return /review/i.test(`${patient.status} ${patient.currentPhase?.status ?? ""}`);
  if (category === "follow_up_due") return /follow/i.test(`${patient.currentPhase?.status ?? ""} ${patient.currentPhase?.title ?? ""}`);
  return true;
}

function sortPatients(rows: Patient[], mode: string) {
  return [...rows].sort((left, right) => {
    if (mode === "name_az") return patientDisplayName(left).localeCompare(patientDisplayName(right));
    if (mode === "name_za") return patientDisplayName(right).localeCompare(patientDisplayName(left));
    if (mode === "created_oldest") return String(left.createdAt ?? "").localeCompare(String(right.createdAt ?? ""));
    if (mode === "file_number") return left.medicalRecordNumber.localeCompare(right.medicalRecordNumber);
    if (mode === "age_year") return String(left.dateOfBirth ?? "").localeCompare(String(right.dateOfBirth ?? ""));
    return String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""));
  });
}

function friendlyStatus(value: string) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function patientDisplayName(patient: Patient) {
  const name = `${patient.firstName} ${patient.lastName}`.trim();
  if (isSeededTrainingRecord(patient) || /^demo\b/i.test(name)) {
    return "Filtered record";
  }
  return name || "Patient file";
}

function patientFileNumber(patient: Patient) {
  return isSeededTrainingRecord(patient) ? "Filtered file" : patient.medicalRecordNumber;
}

function matchesPatientDate(value: string | null | undefined, mode: string, exactDate: string, rangeStart: string, rangeEnd: string, today: string) {
  if (mode === "all") return true;
  if (!value) return false;
  const date = value.slice(0, 10);
  if (mode === "today") return date === today;
  if (mode === "yesterday") {
    const yesterday = new Date(`${today}T00:00:00`);
    yesterday.setDate(yesterday.getDate() - 1);
    return date === yesterday.toISOString().slice(0, 10);
  }
  if (mode === "exact") return date === exactDate;
  if (mode === "range") return date >= rangeStart && date <= rangeEnd;
  return true;
}

function isSeededTrainingRecord(patient: Patient) {
  return /^DEMO[-_]/i.test(patient.medicalRecordNumber) || /^Demo\b/i.test(`${patient.firstName} ${patient.lastName}`.trim());
}
