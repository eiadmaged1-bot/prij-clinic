"use client";

import { FormEvent, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { DuplicateCandidate, PatientDuplicateCandidates } from "./PatientDuplicateCandidates";

export function PatientSearchMobile() {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) { setStatus("Enter a name, phone number, or MRN."); return; }
    setLoading(true);
    setStatus("");
    try {
      const params = new URLSearchParams(/^[\d+() -]+$/.test(value) ? { phone: value } : value.toUpperCase().startsWith("MRN-") || value.toUpperCase().startsWith("LOCAL-") ? { mrn: value } : { name: value });
      const response = await fetch(`${getApiBaseUrl()}/patients/duplicate-candidates?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Patient search is unavailable.");
      const body = await response.json() as { candidates?: DuplicateCandidate[] };
      setCandidates(body.candidates ?? []);
      setStatus(body.candidates?.length ? `${body.candidates.length} possible result(s).` : "No matching active patient was found in your branch.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Patient search is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel compact-panel doctor-patient-tool" id="doctor-patient-search">
      <div className="section-heading"><h2>Search Patient</h2><span className="badge">Branch scoped</span></div>
      <form className="toolbar" onSubmit={search}>
        <label>Patient name, phone, or MRN<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button className="button secondary" data-action-id="patient.search" disabled={loading} type="submit">{loading ? "Searching…" : "Search Patient"}</button>
      </form>
      {status ? <p className="muted" role="status">{status}</p> : null}
      <PatientDuplicateCandidates candidates={candidates} />
    </section>
  );
}
