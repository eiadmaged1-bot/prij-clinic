"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  favorited?: boolean;
  queueState?: { status: string; queueNumber: number; visitType?: string | null } | null;
};

type PageInfo = { page: number; limit: number; hasMore: boolean; total: number };
type BranchOption = { id: string; name: string };

export default function PatientsPage() {
  const { user } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState("Loading patient files");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [directoryView, setDirectoryView] = useState("all");
  const [patientType, setPatientType] = useState("all");
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [sortMode, setSortMode] = useState("created_newest");
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ page: 1, limit: 20, hasMore: false, total: 0 });

  useEffect(() => {
    const text = query.trim();
    const timer = window.setTimeout(() => void loadPatients(text, page), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, directoryView, page, patientType, query, sortMode]);

  useEffect(() => {
    const requestedSearch = new URLSearchParams(window.location.search).get("search");
    if (requestedSearch) setQuery(requestedSearch);
  }, []);

  const filtered = patients;

  async function loadPatients(search = query.trim(), requestedPage = page) {
    const token = sessionStorage.getItem("prijClinicToken");
    setStatus("Loading");
    setError("");

    try {
      const params = new URLSearchParams({ mode: "directory", view: directoryView, page: String(requestedPage), limit: "20", sort: sortMode });
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

  function clearFilters() {
    setQuery("");
    setSortMode("created_newest");
    setDirectoryView("all");
    setPatientType("all");
    setBranchId("all");
    setPage(1);
  }

  async function toggleFavorite(patient: Patient) {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/favorite`, { method: patient.favorited ? "DELETE" : "POST", credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).catch(() => null);
    if (!response?.ok) return setError("Favorite could not be updated. Retry.");
    if (directoryView === "favorites" && patient.favorited) void loadPatients(query.trim(), page);
    else setPatients((current) => current.map((row) => row.id === patient.id ? { ...row, favorited: !row.favorited } : row));
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
            <p className="muted">{status === "Loaded" ? `${pageInfo.total} patient files · showing ${pageInfo.total ? (pageInfo.page - 1) * pageInfo.limit + 1 : 0}–${Math.min(pageInfo.page * pageInfo.limit, pageInfo.total)}` : status}</p>
            <p className="muted">Browse active patients by default, or refine by name, phone, file number, branch, and type.</p>
          </div>
          <button className="button secondary compact" onClick={() => void loadPatients(query.trim(), page)} type="button">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            Refresh
          </button>
        </div>

        <div className="toolbar">
          <label>
            Directory view
            <select onChange={(event) => { setDirectoryView(event.target.value); setPage(1); }} value={directoryView}>
              <option value="all">All clinic patients</option>
              <option value="today">Today</option>
              <option value="waiting">Waiting</option>
              <option value="recent">Recent</option>
              <option value="favorites">Favorites</option>
            </select>
          </label>
          <label>
            Search by name, phone, MRN/file number, husband name, QR token
            <input
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search by file number, name, phone, husband name, or QR"
              value={query}
            />
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

        <div className="toolbar more-filter-grid"><label>Patient type<select onChange={(event) => { setPatientType(event.target.value); setPage(1); }} value={patientType}><option value="all">All patient types</option>{patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label>Branch<select onChange={(event) => { setBranchId(event.target.value); setPage(1); }} value={branchId}><option value="all">All permitted branches</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label></div>
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
                  <span>{patient.queueState ? `Queue #${patient.queueState.queueNumber} · ${patient.queueState.status}` : "Not in today’s queue"}</span>
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
                <button className="button secondary compact" type="button" aria-pressed={Boolean(patient.favorited)} onClick={() => void toggleFavorite(patient)}>{patient.favorited ? "Remove favorite" : "Add favorite"}</button>
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

function friendlyStatus(value: string) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

function patientDisplayName(patient: Patient) {
  const name = `${patient.firstName} ${patient.lastName}`.trim();
  return name || "Patient file";
}

function patientFileNumber(patient: Patient) {
  return patient.medicalRecordNumber;
}
