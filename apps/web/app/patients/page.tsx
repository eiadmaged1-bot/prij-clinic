"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../mvp-page";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

import { getApiBaseUrl } from "@/lib/api-base-url";

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
  branchId?: string | null;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [status, setStatus] = useState("Loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadPatients();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((patient) =>
      `${patient.medicalRecordNumber} ${patient.firstName} ${patient.lastName}`.toLowerCase().includes(q)
    );
  }, [patients, query]);

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
            <p className="muted">Status: {status}</p>
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
              placeholder="Search by file number or name"
              value={query}
            />
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
          <div className="empty-state">No patient files match this view. Create a new patient file to begin.</div>
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
                  <span className="badge">{patient.status}</span>
                </div>
                <dl>
                  <div>
                    <dt>File number</dt>
                    <dd>{patientFileNumber(patient)}</dd>
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

function patientDisplayName(patient: Patient) {
  const name = `${patient.firstName} ${patient.lastName}`.trim();
  if (isSeededTrainingRecord(patient) || /^demo\b/i.test(name)) {
    return "Local training record";
  }
  return name || "Patient file";
}

function patientFileNumber(patient: Patient) {
  return isSeededTrainingRecord(patient) ? "Local training file" : patient.medicalRecordNumber;
}

function isSeededTrainingRecord(patient: Patient) {
  return /^DEMO[-_]/i.test(patient.medicalRecordNumber) || /^Demo\b/i.test(`${patient.firstName} ${patient.lastName}`.trim());
}
