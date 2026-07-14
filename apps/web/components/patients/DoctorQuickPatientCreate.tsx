"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useIdempotencyKey } from "@/lib/idempotency-key";
import { patientTypeOptions } from "@/lib/patient-labels";
import { DuplicateCandidate, PatientDuplicateCandidates } from "./PatientDuplicateCandidates";

type SaveIntent = "save" | "start";

export function DoctorQuickPatientCreate() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [overrideRequired, setOverrideRequired] = useState(false);
  const [duplicateReviewAccepted, setDuplicateReviewAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { key: idempotencyKey } = useIdempotencyKey();

  async function submit(form: HTMLFormElement, intent: SaveIntent) {
    if (loading) return;
    const data = new FormData(form);
    const fullName = String(data.get("fullName") ?? "").trim().split(/\s+/);
    if (!fullName[0]) { setError("Enter the patient full name."); return; }
    const overrideReason = String(data.get("duplicateOverrideReason") ?? "").trim();
    if (overrideRequired && !overrideReason) { setError("Explain why a new record is needed before creating despite a high-confidence match."); return; }
    setLoading(true);
    setError("");
    const age = Number(data.get("age"));
    const dateOfBirth = String(data.get("dateOfBirth") ?? "") || (age >= 0 && age <= 120 ? `${new Date().getFullYear() - age}-01-01` : "");
    const payload = {
      medicalRecordNumber: makeMrn(),
      firstName: fullName[0],
      lastName: fullName.slice(1).join(" ") || "Patient",
      phone: String(data.get("phone") ?? "").trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      patientType: String(data.get("patientType") ?? "WOMEN_HEALTH"),
      notes: [String(data.get("visitType") ?? ""), String(data.get("visitReason") ?? "")].filter(Boolean).join(": ") || undefined,
      duplicateOverrideReason: overrideReason || undefined
    };
    try {
      if (!duplicateReviewAccepted) {
        const params = new URLSearchParams({ name: `${payload.firstName} ${payload.lastName}`, mrn: payload.medicalRecordNumber });
        if (payload.phone) params.set("phone", payload.phone);
        if (payload.dateOfBirth) params.set("dob", payload.dateOfBirth);
        const reviewResponse = await fetch(`${getApiBaseUrl()}/patients/duplicate-candidates?${params}`, { credentials: "include" });
        if (!reviewResponse.ok) throw new Error("Duplicate review is unavailable. The patient was not created.");
        const review = await reviewResponse.json() as { candidates?: DuplicateCandidate[] };
        const matches = review.candidates ?? [];
        if (matches.length) {
          setCandidates(matches);
          setOverrideRequired(matches.some((candidate) => candidate.confidence === "HIGH"));
          setDuplicateReviewAccepted(true);
          setError("Review the possible existing records, then submit again to confirm creation.");
          return;
        }
      }
      const endpoint = intent === "start" ? "/patients/create-and-start-visit" : "/patients";
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: "POST", credentials: "include",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => null) as { id?: string; visitId?: string; code?: string; message?: string; candidates?: DuplicateCandidate[] } | null;
      if (response.status === 409 && body?.code === "PATIENT_DUPLICATE_REVIEW_REQUIRED") {
        setCandidates(body.candidates ?? []); setOverrideRequired(true); throw new Error(body.message);
      }
      // If we got a 206, the patient was created but the visit start failed. We shouldn't retry creation.
      if (response.status === 206) {
        throw new Error(body?.message || "Patient saved, but the visit could not be started. Open the patient file to continue safely.");
      }
      if (!response.ok || !body?.id) {
        throw new Error(body?.message || "Could not save the patient. Review the details and try again.");
      }

      if (intent === "start" && body.visitId) {
        router.push(`/doctor/visit?patientId=${body.id}`);
      } else {
        router.push(`/patients/${body.id}`);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save the patient.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel form-panel doctor-patient-tool" id="doctor-new-patient">
      <div className="section-heading"><div><h2>New Patient</h2><p className="muted">Fallback registration when reception is unavailable.</p></div><span className="badge">Doctor</span></div>
      <form className="form-grid" onChange={(event) => { if ((event.target as Element).getAttribute("name") !== "duplicateOverrideReason") { setDuplicateReviewAccepted(false); setCandidates([]); setOverrideRequired(false); } }} onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget, "start"); }}>
        <label>Full name<input autoComplete="name" name="fullName" required /></label>
        <label>Phone (optional)<input autoComplete="tel" inputMode="tel" name="phone" /></label>
        <label>Date of birth<input name="dateOfBirth" type="date" /></label>
        <label>Approximate age<input inputMode="numeric" max="120" min="0" name="age" type="number" /></label>
        <label>Patient type<select defaultValue="WOMEN_HEALTH" name="patientType">{patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label>Visit type<select defaultValue="consultation" name="visitType"><option value="consultation">Consultation</option><option value="kashf">New examination</option><option value="recheck">Follow-up</option><option value="urgent_kashf">Urgent examination</option></select></label>
        <label className="wide">Visit reason (optional)<textarea maxLength={500} name="visitReason" rows={2} /></label>
        <PatientDuplicateCandidates candidates={candidates} />
        {overrideRequired ? <label className="wide duplicate-override-reason"><strong>Create New Anyway — reason required</strong><textarea maxLength={500} name="duplicateOverrideReason" required rows={2} /></label> : null}
        {error ? <p className="form-error wide" role="alert">{error}</p> : null}
        <div className="form-actions wide">
          <button className="button" data-action-id={overrideRequired ? "patient.createOverrideDuplicate" : "patient.saveAndStartVisit"} disabled={loading} type="submit">{loading ? "Saving…" : overrideRequired ? "Create New Anyway & Start Visit" : "Save & Start Visit"}</button>
          <button className="button secondary" data-action-id="patient.saveOnly" disabled={loading} onClick={(event) => { if (event.currentTarget.form) void submit(event.currentTarget.form, "save"); }} type="button">Save Patient Only</button>
        </div>
      </form>
    </section>
  );
}

function makeMrn() { return `LOCAL-PAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
