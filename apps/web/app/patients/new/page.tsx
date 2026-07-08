"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../../mvp-page";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { patientTypeOptions } from "@/lib/patient-labels";
import type { VisitTypeValue } from "@/lib/visit-types";

type FormState = {
  medicalRecordNumber: string;
  fullName: string;
  patientType: string;
  sexualActivityStatus: string;
  dateOfBirth: string;
  yearOfBirth: string;
  phone: string;
  address: string;
  notes: string;
};

type ExistingPatient = { id: string; medicalRecordNumber?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null };

const initialState: FormState = {
  medicalRecordNumber: makeMrn(),
  fullName: "",
  patientType: "WOMEN_HEALTH",
  sexualActivityStatus: "unknown",
  dateOfBirth: "",
  yearOfBirth: "",
  phone: "",
  address: "",
  notes: ""
};

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdPatientId, setCreatedPatientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [existingPatients, setExistingPatients] = useState<ExistingPatient[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    fetch(`${getApiBaseUrl()}/patients`, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => response.ok ? (await response.json()) as { patients?: ExistingPatient[] } : { patients: [] })
      .then((body) => setExistingPatients(body.patients ?? []))
      .catch(() => setExistingPatients([]));
  }, []);

  const duplicateWarnings = useMemo(() => possibleDuplicateWarnings(form, existingPatients), [existingPatients, form]);
  const calculatedAge = useMemo(() => ageFromYear(form.yearOfBirth), [form.yearOfBirth]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const token = sessionStorage.getItem("prijClinicToken");

    try {
      const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "Patient";
      const formData = new FormData(event.currentTarget);
      const saveIntent = String(formData.get("saveIntent") ?? "queue");
      if (!firstName) {
        throw new Error("Enter the patient full name before creating the file.");
      }
      if (saveIntent === "queue" && !visitType) {
        throw new Error("Select visit type before saving and adding to queue.");
      }
      const noteParts = [
        form.notes.trim(),
        form.address.trim() ? `Area/address: ${form.address.trim()}` : "",
        form.yearOfBirth.trim() && !form.dateOfBirth ? `Year of birth: ${form.yearOfBirth.trim()}` : ""
      ].filter(Boolean);
      const payload = Object.fromEntries(
        Object.entries({
          medicalRecordNumber: form.medicalRecordNumber,
          firstName,
          lastName,
          sex: "female",
          patientType: form.patientType || "WOMEN_HEALTH",
          sexualActivityStatus: form.sexualActivityStatus,
          dateOfBirth: form.dateOfBirth || (form.yearOfBirth ? `${form.yearOfBirth}-01-01` : ""),
          phone: form.phone,
          notes: noteParts.join("\n")
        }).filter(([, value]) => String(value).trim() !== "")
      );
      const response = await fetch(`${getApiBaseUrl()}/patients`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        throw new Error("Please sign in before creating a patient file.");
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || "Could not create this patient file. Please review the required fields and try again.");
      }

      const patient = (await response.json()) as { id: string };
      setCreatedPatientId(patient.id);
      let queueTicket: { queueNumber?: number; visitType?: string } | null = null;
      if (saveIntent === "queue") {
        const queueResponse = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ patientId: patient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine" })
        }).catch(() => undefined);
        queueTicket = queueResponse?.ok ? await queueResponse.json().catch(() => null) as { queueNumber?: number; visitType?: string } | null : null;
      }
      await fetch(`${getApiBaseUrl()}/patient-intake`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          patientId: patient.id,
          intakeType: "new_patient",
          patientReportedJson: {
            sourceLabel: "patient_reported",
            notes: form.notes.trim()
          },
          administrativeJson: {
            sourceLabel: "secretary_intake",
            address: form.address.trim(),
            yearOfBirth: form.yearOfBirth.trim(),
            calculatedAge
          }
        })
      }).catch(() => undefined);
      setSuccess(saveIntent === "queue" ? `Added to queue - Position ${queueTicket?.queueNumber ?? "new"}.` : "Patient file saved.");
      if (saveIntent === "queue") router.push(`/patients/${patient.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create patient file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Registration</p>
            <h1>New patient file</h1>
          </div>
          <Link className="button secondary compact" href="/reception">
            <ThreeDMedicalIcon name="patients" size="sm" tone="slate" />
            Back to Reception
          </Link>
        </div>
        <p className="muted">Create the file and add the patient to today&apos;s queue.</p>
      </section>

      <section className="panel form-panel new-patient-card premium-depth-card">
        <div className="section-heading">
          <div>
            <h2>Patient details</h2>
          </div>
          <span className="badge warning">Reception</span>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <label>
            File number
            <div className="input-action">
              <input
                required
                readOnly
                value={form.medicalRecordNumber}
              />
              <button className="button secondary compact icon-only-button" aria-label="Regenerate file number" onClick={() => update("medicalRecordNumber", makeMrn())} type="button">
                <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
              </button>
            </div>
            <button className="button secondary compact" onClick={() => update("medicalRecordNumber", makeMrn())} type="button">Generate another file number</button>
          </label>
          <label>
            Full name
            <input autoComplete="name" onChange={(event) => update("fullName", event.target.value)} placeholder="Enter patient name" value={form.fullName} />
          </label>
          <label>
            Phone number
            <input autoComplete="tel" inputMode="tel" onChange={(event) => update("phone", event.target.value)} placeholder="Strongly recommended for follow-up and duplicate checks" value={form.phone} />
          </label>
          <label>
            Patient type
            <select onChange={(event) => update("patientType", event.target.value)} value={form.patientType}>
              {patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Date of birth
            <input type="date" onChange={(event) => update("dateOfBirth", event.target.value)} value={form.dateOfBirth} />
          </label>
          <label>
            Year of birth
            <input disabled={Boolean(form.dateOfBirth)} inputMode="numeric" max={new Date().getFullYear()} min="1900" onChange={(event) => update("yearOfBirth", event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY fallback if full DOB is unknown" value={form.yearOfBirth} />
          </label>
          <div className="age-chip" aria-label="Auto-calculated age">Age: {calculatedAge}</div>
          <label>
            Area/address
            <input onChange={(event) => update("address", event.target.value)} placeholder="Optional short area or address" value={form.address} />
          </label>
          <label className="wide">
            Notes
            <textarea onChange={(event) => update("notes", event.target.value)} rows={3} value={form.notes} />
          </label>
          <div className="wide">
            <VisitTypeSelector value={visitType} onChange={setVisitType} />
          </div>

          <label className="wide toggle-row sensitive-bottom-checkbox">
            <input
              checked={form.sexualActivityStatus === "not_sexually_active"}
              onChange={(event) => update("sexualActivityStatus", event.target.checked ? "not_sexually_active" : "unknown")}
              type="checkbox"
            />
            Not sexually active
            <span className="muted">Unchecked = unknown / not asked.</span>
          </label>
          <details hidden>
            <summary>Sensitive details</summary>
            <span>Unknown / not asked</span>
          </details>

          {duplicateWarnings.length ? (
            <div className="alert warning wide" data-testid="duplicate-patient-warning">
              <strong>Possible match found. Open existing file to review.</strong>
              <p className="muted">{duplicateWarnings.join(" ")}</p>
            </div>
          ) : null}

          {error ? <p className="form-error wide">{error}</p> : null}
          {success ? <p className="success-message wide">{success}</p> : null}

          <div className="form-actions wide">
            <button className="button" disabled={isSubmitting} name="saveIntent" value="queue" type="submit">
              <ThreeDMedicalIcon name="patients" size="sm" />
              {isSubmitting ? "Saving" : "Save and add to queue"}
            </button>
            <button className="button secondary" disabled={isSubmitting} name="saveIntent" value="file" type="submit">Save file only</button>
            {createdPatientId ? <Link className="button secondary" href={`/patients/${createdPatientId}`}>Open reception profile</Link> : null}
          </div>
        </form>
      </section>
    </AppShell>
  );
}

function makeMrn() {
  return `LOCAL-PAT-${Date.now().toString().slice(-8)}`;
}

function ageFromYear(year: string) {
  if (!/^\d{4}$/.test(year)) return "Unknown";
  const value = Number(year);
  const currentYear = new Date().getFullYear();
  if (value < 1900 || value > currentYear) return "Unknown";
  return String(currentYear - value);
}

function possibleDuplicateWarnings(form: FormState, patients: ExistingPatient[]) {
  const phone = normalize(form.phone);
  const mrn = normalize(form.medicalRecordNumber);
  const fullName = normalize(form.fullName);
  const warnings: string[] = [];

  for (const patient of patients) {
    const patientName = normalize(`${patient.firstName ?? ""} ${patient.lastName ?? ""}`);
    if (phone && normalize(patient.phone) === phone) warnings.push("Phone matches an existing file.");
    if (mrn && normalize(patient.medicalRecordNumber) === mrn) warnings.push("File number matches an existing file.");
    if (fullName && patientName && patientName === fullName) warnings.push("Name may match an existing file.");
  }

  return Array.from(new Set(warnings)).slice(0, 3);
}

function normalize(value?: string | null) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
