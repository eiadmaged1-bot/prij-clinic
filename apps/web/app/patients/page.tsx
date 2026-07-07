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
  const [status, setStatus] = useState("Loading");
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

  useEffect(() => {
    void loadPatients();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((patient) => {
      const textMatch = !q || `${patient.medicalRecordNumber} ${patient.firstName} ${patient.lastName} ${patient.phone ?? ""}`.toLowerCase().includes(q);
      const statusMatch = patientStatus === "all" || patient.status === patientStatus;
      const typeMatch = patientType === "all" || patient.patientType === patientType;
      const phaseMatch = phaseType === "all" || patient.currentPhase?.phaseType === phaseType;
      const dateMatch = matchesPatientDate(patient.createdAt, dateFilter, exactDate, rangeStart, rangeEnd, today);
      const trainingMatch = !isSeededTrainingRecord(patient);
      return textMatch && statusMatch && typeMatch && phaseMatch && dateMatch && trainingMatch;
    });
  }, [dateFilter, exactDate, patientStatus, patientType, phaseType, patients, query, rangeEnd, rangeStart, today]);

  async function loadPatients() {
    const token = sessionStorage.getItem("prijClinicToken");
    setStatus("Loading");
    setError("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/patients`, {
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
            <h2>Patient registry</h2>
            <p className="muted">{status === "Loaded" ? `${filtered.length} patient files shown` : status}</p>
          </div>
          <button className="button secondary compact" onClick={loadPatients} type="button">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            Refresh
          </button>
        </div>

        <div className="toolbar">
          <label>
            Search patient files
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by file number, name, or phone"
              value={query}
            />
          </label>
          <label>
            Date
            <select onChange={(event) => setDateFilter(event.target.value)} value={dateFilter}>
              <option value="all">Any date</option>
              <option value="today">Seen / created today</option>
              <option value="yesterday">Yesterday</option>
              <option value="exact">Exact date</option>
              <option value="range">Date range</option>
            </select>
          </label>
          {dateFilter === "exact" ? <label>Exact date<input type="date" value={exactDate} onChange={(event) => setExactDate(event.target.value)} /></label> : null}
          {dateFilter === "range" ? <label>From<input type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} /></label> : null}
          {dateFilter === "range" ? <label>To<input type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} /></label> : null}
          <label>
            Status
            <select onChange={(event) => setPatientStatus(event.target.value)} value={patientStatus}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            Patient type
            <select onChange={(event) => setPatientType(event.target.value)} value={patientType}>
              <option value="all">All patient types</option>
              {patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Current phase
            <select onChange={(event) => setPhaseType(event.target.value)} value={phaseType}>
              <option value="all">All phases</option>
              <option value="infertility">Infertility</option>
              <option value="pregnancy">Pregnancy</option>
              <option value="gynecology">Gynecology</option>
              <option value="postpartum">Postpartum</option>
              <option value="general">General</option>
            </select>
          </label>
        </div>

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
              </article>
            ))}
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
