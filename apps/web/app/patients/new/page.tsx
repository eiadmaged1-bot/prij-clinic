"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";

import { getApiBaseUrl } from "@/lib/api-base-url";
import type { VisitTypeValue } from "@/lib/visit-types";

type FormState = {
  medicalRecordNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  sexualActivityStatus: string;
  dateOfBirth: string;
  age: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string;
  referralSource: string;
  notes: string;
};

type ExistingPatient = { id: string; medicalRecordNumber?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null };

const initialState: FormState = {
  medicalRecordNumber: makeMrn(),
  fullName: "",
  firstName: "",
  lastName: "",
  sexualActivityStatus: "unknown",
  dateOfBirth: "",
  age: "",
  phone: "",
  email: "",
  address: "",
  nationalId: "",
  referralSource: "",
  notes: ""
};

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const token = sessionStorage.getItem("prijClinicToken");

    try {
      const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = form.firstName.trim() || nameParts[0] || "";
      const lastName = form.lastName.trim() || nameParts.slice(1).join(" ") || "Patient";
      if (!firstName) {
        throw new Error("Enter a full name or first name before creating the patient file.");
      }
      if (!visitType) {
        throw new Error("Select visit type before saving and checking in.");
      }
      const noteParts = [
        form.notes.trim(),
        form.address.trim() ? `Address note: ${form.address.trim()}` : "",
        form.nationalId.trim() ? `National ID note: ${form.nationalId.trim()}` : "",
        form.referralSource.trim() ? `Referral source: ${form.referralSource.trim()}` : "",
        form.age.trim() && !form.dateOfBirth.trim() ? `Age note: ${form.age.trim()}` : ""
      ].filter(Boolean);
      const payload = Object.fromEntries(
        Object.entries({
          medicalRecordNumber: form.medicalRecordNumber,
          firstName,
          lastName,
          sex: "female",
          patientType: "WOMEN_HEALTH",
          sexualActivityStatus: form.sexualActivityStatus,
          dateOfBirth: form.dateOfBirth,
          phone: form.phone,
          email: form.email,
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
      await fetch(`${getApiBaseUrl()}/queue/check-in`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ patientId: patient.id, visitType, priority: visitType === "urgent_kashf" ? "priority" : "routine" })
      }).catch(() => undefined);
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
            notes: form.notes.trim(),
            referralSource: form.referralSource.trim()
          },
          administrativeJson: {
            sourceLabel: "secretary_intake",
            address: form.address.trim(),
            nationalId: form.nationalId.trim(),
            ageIfDobUnknown: form.age.trim()
          }
        })
      }).catch(() => undefined);
      setSuccess("Patient file created and added to the queue. Opening the patient workspace.");
      router.push(`/patients/${patient.id}`);
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
          <Link className="button secondary compact" href="/patients">
            <ThreeDMedicalIcon name="patients" size="sm" tone="slate" />
            Back to patients
          </Link>
        </div>
        <p className="muted">Create the patient file first. Reception intake stays patient-reported until the doctor reviews it.</p>
      </section>

      <SafetyAlert />

      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <h2>Secretary intake details</h2>
            <p className="muted">Patient-reported / entered by reception. Do not enter diagnosis, examination, clinical impression, prescription, final risk assessment, or treatment plan.</p>
          </div>
          <span className="badge warning">No real patient data</span>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <label>
            File number
            <div className="input-action">
              <input
                onChange={(event) => update("medicalRecordNumber", event.target.value)}
                required
                value={form.medicalRecordNumber}
              />
              <button className="button secondary compact" onClick={() => update("medicalRecordNumber", makeMrn())} type="button">
                <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
                Generate
              </button>
            </div>
          </label>
          <label>
            Full name
            <input onChange={(event) => update("fullName", event.target.value)} placeholder="Enter patient name" value={form.fullName} />
          </label>
          <label>
            First name
            <input onChange={(event) => update("firstName", event.target.value)} placeholder="Auto-filled from full name if blank" value={form.firstName} />
          </label>
          <label>
            Last name
            <input onChange={(event) => update("lastName", event.target.value)} placeholder="Auto-filled from full name if blank" value={form.lastName} />
          </label>
          <details className="form-fieldset wide compact-panel clinical-privacy-section">
            <summary>Sensitive details</summary>
            <p className="muted">Optional and respectful. Reception can leave this as not asked.</p>
            <label>
              Sexual activity status
              <select onChange={(event) => update("sexualActivityStatus", event.target.value)} value={form.sexualActivityStatus}>
                <option value="unknown">Unknown / not asked</option>
                <option value="not_sexually_active">Not sexually active / Virgin</option>
                <option value="sexually_active">Sexually active</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
          </details>
          <label>
            Date of birth
            <input onChange={(event) => update("dateOfBirth", event.target.value)} type="date" value={form.dateOfBirth} />
          </label>
          <label>
            Age if DOB unknown
            <input onChange={(event) => update("age", event.target.value)} placeholder="Optional age note" value={form.age} />
          </label>
          <label>
            Phone
            <input onChange={(event) => update("phone", event.target.value)} placeholder="Optional contact number" value={form.phone} />
          </label>
          <label>
            Email
            <input onChange={(event) => update("email", event.target.value)} placeholder="Optional email" type="email" value={form.email} />
          </label>
          <label>
            Address
            <input onChange={(event) => update("address", event.target.value)} placeholder="Optional local address note" value={form.address} />
          </label>
          <label>
            National ID
            <input onChange={(event) => update("nationalId", event.target.value)} placeholder="Optional identifier" value={form.nationalId} />
          </label>
          <label>
            Source / referral
            <input onChange={(event) => update("referralSource", event.target.value)} placeholder="Walk-in, referral, campaign" value={form.referralSource} />
          </label>
          <label className="wide">
            Notes
            <textarea onChange={(event) => update("notes", event.target.value)} rows={3} value={form.notes} />
          </label>
          <div className="wide">
            <VisitTypeSelector value={visitType} onChange={setVisitType} />
          </div>

          {duplicateWarnings.length ? (
            <div className="alert warning wide" data-testid="duplicate-patient-warning">
              <strong>Possible duplicate patient</strong>
              <p className="muted">{duplicateWarnings.join(" ")}</p>
              <p className="muted">Review the existing file before continuing. Reception or admin may continue when appropriate.</p>
            </div>
          ) : null}

          {error ? <p className="form-error wide">{error}</p> : null}
          {success ? <p className="success-message wide">{success}</p> : null}

          <div className="form-actions wide">
            <button className="button" disabled={isSubmitting} type="submit">
              <ThreeDMedicalIcon name="patients" size="sm" />
              {isSubmitting ? "Creating patient file" : "Save and open patient file"}
            </button>
            <Link className="button secondary" href="/patients">
              <ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

function makeMrn() {
  return `LOCAL-PAT-${Date.now().toString().slice(-8)}`;
}

function possibleDuplicateWarnings(form: FormState, patients: ExistingPatient[]) {
  const phone = normalize(form.phone);
  const mrn = normalize(form.medicalRecordNumber);
  const fullName = normalize(form.fullName || `${form.firstName} ${form.lastName}`);
  const warnings: string[] = [];

  for (const patient of patients) {
    const patientName = normalize(`${patient.firstName ?? ""} ${patient.lastName ?? ""}`);
    if (phone && normalize(patient.phone) === phone) warnings.push(`Phone matches ${patientName || "an existing patient"}.`);
    if (mrn && normalize(patient.medicalRecordNumber) === mrn) warnings.push(`MRN matches ${patientName || "an existing patient"}.`);
    if (fullName && patientName && patientName === fullName) warnings.push(`Name matches existing file ${patient.medicalRecordNumber ?? ""}.`);
  }

  return Array.from(new Set(warnings)).slice(0, 3);
}

function normalize(value?: string | null) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
