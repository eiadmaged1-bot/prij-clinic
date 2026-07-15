"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../mvp-page";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { ageLabel, patientTypeLabel, patientTypeOptions, phaseTypeLabel } from "@/lib/patient-labels";
import { useSession } from "../session";

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
  branch?: { id: string; name: string } | null;
  latestVisitDate?: string | null;
  yearOfBirth?: number | null;
  createdAt?: string | null;
};

type PageInfo = { page: number; limit: number; hasMore: boolean; total: number };
type BranchOption = { id: string; name: string };

export default function PatientsPage() {
  const { user } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState("Loading patient files");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState("all");
  const [exactDate, setExactDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [patientStatus, setPatientStatus] = useState("active");
  const [patientType, setPatientType] = useState("all");
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [phaseType, setPhaseType] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState("created_newest");
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ page: 1, limit: 20, hasMore: false, total: 0 });

  useEffect(() => {
    const text = query.trim();
    const timer = window.setTimeout(() => void loadPatients(text, page), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, page, patientStatus, patientType, query, sortMode]);

  useEffect(() => {
    const savedCategory = localStorage.getItem("prijPatientDirectoryCategory");
    if (savedCategory) setCategory(savedCategory);
    const requestedSearch = new URLSearchParams(window.location.search).get("search");
    if (requestedSearch) setQuery(requestedSearch);
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

  async function loadPatients(search = query.trim(), requestedPage = page) {
    const token = sessionStorage.getItem("prijClinicToken");
    setStatus("Loading");
    setError("");

    try {
      const params = new URLSearchParams({ mode: "directory", page: String(requestedPage), limit: "20", status: patientStatus, sort: sortMode });
      if (search) params.set("q", search);
      if (patientType !== "all") params.set("patientType", patientType);
      if (branchId !== "all") params.set("branchId", branchId);
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
      const data = (await response.json()) as { patients?: Patient[]; pageInfo?: PageInfo; filters?: { branches?: BranchOption[] } };
      setPatients(data.patients ?? []);
      setPageInfo(data.pageInfo ?? { page: requestedPage, limit: 20, hasMore: false, total: data.patients?.length ?? 0 });
      setBranches(data.filters?.branches ?? []);
      setStatus("Loaded");
    } catch (loadError) {
      setPatients([]);
      setStatus("Connection unavailable");
      setError(loadError instanceof Error ? loadError.message : "Unable to load patient files.");
    }
  }

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setPage(1);
    localStorage.setItem("prijPatientDirectoryCategory", nextCategory);
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setSortMode("created_newest");
    setDateFilter("all");
    setPatientStatus("active");
    setPatientType("all");
    setBranchId("all");
    setPhaseType("all");
    setPage(1);
    localStorage.removeItem("prijPatientDirectoryCategory");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Registration</p>
            <h1>All Patients</h1>
          </div>
          <div className="form-actions">{user?.roles.some((role) => ["Owner", "Admin"].includes(role)) ? <Link className="button secondary" href="/patients/import">Import CSV/XLSX</Link> : null}<Link className="button" href="/patients/new">
            <ThreeDMedicalIcon name="patients" size="sm" />
            New Patient File
          </Link></div>
        </div>
        <p className="muted">Find or create a patient file, then continue from the patient workspace.</p>
      </section>

      <SafetyAlert />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Patient directory</h2>
            <p className="muted">{status === "Loaded" ? `${pageInfo.total} patient files · page ${pageInfo.page}` : status}</p>
            <p className="muted">Browse active patients by default, or refine by name, phone, file number, branch, and type.</p>
          </div>
          <button className="button secondary compact" onClick={() => void loadPatients(query.trim(), page)} type="button">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            Refresh
          </button>
        </div>

        <div className="toolbar">
          <label>
            Search by name, phone, MRN/file number, husband name, QR token
            <input
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
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
            <select onChange={(event) => { setSortMode(event.target.value); setPage(1); }} value={sortMode}>
              <option value="created_newest">Created newest</option>
              <option value="created_oldest">Created oldest</option>
              <option value="name_az">Name A-Z</option>
              <option value="name_za">Name Z-A</option>
              <option value="file_number">File number</option>
              <option value="last_visit_desc">Last visit (recent first)</option>
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
            <label>Status<select onChange={(event) => { setPatientStatus(event.target.value); setPage(1); }} value={patientStatus}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
            <label>Patient type<select onChange={(event) => { setPatientType(event.target.value); setPage(1); }} value={patientType}><option value="all">All patient types</option>{patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Branch<select onChange={(event) => { setBranchId(event.target.value); setPage(1); }} value={branchId}><option value="all">All permitted branches</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
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
            {filtered.map((patient) => (
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
                    <dd>{patient.dateOfBirth ? ageLabel(patient.dateOfBirth) : patient.yearOfBirth ? `Approximately ${new Date().getUTCFullYear() - patient.yearOfBirth} years (born ${patient.yearOfBirth})` : "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{patient.phone || patient.email || "No contact saved"}</dd>
                  </div>
                  <div>
                    <dt>Branch / last visit</dt>
                    <dd>{patient.branch?.name ?? "Branch unavailable"} · {patient.latestVisitDate ? patient.latestVisitDate.slice(0, 10) : "No visit recorded"}</dd>
                  </div>
                </dl>
                <Link className="button secondary" href={`/patients/${patient.id}`}>
                  <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
                  Open file
                </Link>
                <Link className="button secondary compact" href={`/reception/check-in?patientId=${patient.id}`}>Add to queue</Link>
              </article>
            ))}
            <div className="form-actions" aria-label="Patient directory pagination">
              <button className="button secondary compact" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
              <span className="muted">Page {pageInfo.page} of {Math.max(1, Math.ceil(pageInfo.total / pageInfo.limit))}</span>
              <button className="button secondary compact" type="button" disabled={!pageInfo.hasMore} onClick={() => setPage((value) => value + 1)}>Next</button>
            </div>
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
  if (category === "womens") return patient.patientType === "WOMEN_HEALTH" || patient.patientType === "GENERAL";
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
    if (mode === "last_visit_desc") return String(right.latestVisitDate ?? "").localeCompare(String(left.latestVisitDate ?? ""));
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
