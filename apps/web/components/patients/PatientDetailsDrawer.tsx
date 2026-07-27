"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { patientTypeOptions } from "@/lib/patient-labels";

type Details = { firstName: string; lastName: string; phone: string; dateOfBirth: string; yearOfBirth: string; address: string; secondaryPhone: string; bloodGroup: string; allergyStatus: string; patientType: string; contextChangeReason: string };
const empty: Details = { firstName: "", lastName: "", phone: "", dateOfBirth: "", yearOfBirth: "", address: "", secondaryPhone: "", bloodGroup: "", allergyStatus: "NOT_ASSESSED", patientType: "OTHER", contextChangeReason: "" };

export function PatientDetailsDrawer({ patientId, open, onClose, onSaved }: { patientId: string; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [details, setDetails] = useState(empty);
  const [originalContext, setOriginalContext] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const token = sessionStorage.getItem("prijClinicToken");
    fetch(`${getApiBaseUrl()}/patients/${patientId}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined })
      .then(async (response) => { if (!response.ok) throw new Error("Patient details could not be loaded."); return response.json(); })
      .then((row) => { const next = { firstName: row.firstName ?? "", lastName: row.lastName ?? "", phone: row.phone ?? "", dateOfBirth: row.dateOfBirth?.slice(0, 10) ?? "", yearOfBirth: row.dateOfBirth ? "" : String(row.yearOfBirth ?? ""), address: row.address ?? "", secondaryPhone: row.secondaryPhone ?? "", bloodGroup: row.bloodGroup ?? "", allergyStatus: row.allergyStatus ?? "NOT_ASSESSED", patientType: row.patientType ?? "OTHER", contextChangeReason: "" }; setDetails(next); setOriginalContext(next.patientType); setState("idle"); setError(""); })
      .catch((cause) => { setError(cause instanceof Error ? cause.message : "Patient details could not be loaded."); setState("failed"); });
  }, [open, patientId]);
  if (!open) return null;
  const update = (key: keyof Details, value: string) => setDetails((current) => ({ ...current, [key]: value }));
  async function save(event: FormEvent) {
    event.preventDefault(); setState("saving"); setError("");
    const token = sessionStorage.getItem("prijClinicToken");
    const payload = { ...details, dateOfBirth: details.dateOfBirth || undefined, yearOfBirth: details.dateOfBirth ? undefined : (details.yearOfBirth ? Number(details.yearOfBirth) : undefined), contextEffectiveAt: new Date().toISOString(), contextChangeReason: details.patientType === originalContext ? undefined : details.contextChangeReason };
    const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) }).catch(() => null);
    if (!response?.ok) { const body = await response?.json().catch(() => null); setError(String(body?.message ?? "Save failed. Your unsaved values remain here.")); setState("failed"); return; }
    setState("saved"); setOriginalContext(details.patientType); onSaved();
  }
  return <div className="modal-backdrop" role="presentation"><aside className="modal-card patient-details-drawer" role="dialog" aria-modal="true" aria-label="Patient Details"><header className="section-heading"><div><p className="eyebrow">Patient profile</p><h2>Patient Details</h2></div><button className="button secondary compact" type="button" onClick={onClose}>Close</button></header><form className="form-grid" onSubmit={save}>
    <label>First name<input value={details.firstName} onChange={(e) => update("firstName", e.target.value)} /></label><label>Last name<input value={details.lastName} onChange={(e) => update("lastName", e.target.value)} /></label><label>Phone<input value={details.phone} onChange={(e) => update("phone", e.target.value)} /></label>
    <label>Exact DOB<input type="date" value={details.dateOfBirth} onChange={(e) => { update("dateOfBirth", e.target.value); if (e.target.value) update("yearOfBirth", ""); }} /></label><label>Birth year (when DOB unknown)<input type="number" min="1900" max={new Date().getFullYear()} disabled={Boolean(details.dateOfBirth)} value={details.yearOfBirth} onChange={(e) => update("yearOfBirth", e.target.value)} /></label>
    <label>Address<input value={details.address} onChange={(e) => update("address", e.target.value)} /></label><label>Emergency contact<input value={details.secondaryPhone} onChange={(e) => update("secondaryPhone", e.target.value)} /></label><label>Blood group and Rh<input placeholder="e.g. A+" value={details.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)} /></label>
    <label>Allergy status<select value={details.allergyStatus} onChange={(e) => update("allergyStatus", e.target.value)}><option value="NOT_ASSESSED">Not assessed</option><option value="NO_KNOWN_ALLERGIES">No known allergies confirmed</option><option value="KNOWN_ALLERGIES">Known allergies</option></select></label>
    <label>Active care context<select value={details.patientType} onChange={(e) => update("patientType", e.target.value)}>{patientTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    {details.patientType !== originalContext ? <label className="wide">Optional transition reason<textarea value={details.contextChangeReason} onChange={(e) => update("contextChangeReason", e.target.value)} /></label> : null}
    {details.allergyStatus === "KNOWN_ALLERGIES" ? <p className="notice wide">Save, then open Allergies to review the existing allergy details. Prior allergy records are never deleted here.</p> : null}
    {error ? <p className="form-error wide">{error}</p> : null}<div className="form-actions wide"><span aria-live="polite">{state === "saving" ? "Saving" : state === "saved" ? "Saved" : state === "failed" ? "Failed" : ""}</span><button className="button" disabled={state === "saving"} type="submit">Save patient details</button></div>
  </form></aside></div>;
}
