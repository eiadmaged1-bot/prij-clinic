"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../mvp-page";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
      const response = await fetch(`${apiUrl}/patients`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      });

      if (response.status === 401) {
        setStatus("Login required");
        setPatients([]);
        return;
      }

      if (!response.ok) throw new Error("Could not load patient files.");
      const data = (await response.json()) as { patients?: Patient[] };
      setPatients(data.patients ?? []);
      setStatus("Loaded");
    } catch (loadError) {
      setPatients([]);
      setStatus("Service unavailable");
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
            New Patient File
          </Link>
        </div>
        <p className="muted">Find or create a demo-safe patient file, then work from inside that file.</p>
      </section>

      <SafetyAlert />

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Patient registry</h2>
            <p className="muted">Status: {status}</p>
          </div>
          <button className="button secondary compact" onClick={loadPatients} type="button">
            Refresh
          </button>
        </div>

        <div className="toolbar">
          <label>
            Search patient files
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by demo MRN or name"
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
          <div className="empty-state">No patient files match this view. Create a new demo patient file to begin.</div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient file</th>
                  <th>MRN</th>
                  <th>Status</th>
                  <th>Contact</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <strong>{patient.firstName} {patient.lastName}</strong>
                      <span className="muted">{patient.sex || "Sex not set"} {patient.dateOfBirth ? `- ${patient.dateOfBirth.slice(0, 10)}` : ""}</span>
                    </td>
                    <td>{patient.medicalRecordNumber}</td>
                    <td><span className="badge">{patient.status}</span></td>
                    <td>{patient.phone || patient.email || "No contact saved"}</td>
                    <td>
                      <Link className="button secondary compact" href={`/patients/${patient.id}`}>
                        Open file
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
