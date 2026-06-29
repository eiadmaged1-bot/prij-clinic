"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type FormState = {
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  notes: string;
};

const initialState: FormState = {
  medicalRecordNumber: makeMrn(),
  firstName: "",
  lastName: "",
  sex: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  notes: "Local V0.1 demo patient file only."
};

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const token = sessionStorage.getItem("prijClinicToken");

    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim() !== ""));
      const response = await fetch(`${apiUrl}/patients`, {
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
      setSuccess("Patient file created. Opening the patient workspace.");
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
        <p className="muted">Create the patient file first. Appointments, queue, clinical notes, billing, consents, and AI draft placeholders belong inside that file.</p>
      </section>

      <SafetyAlert />

      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <h2>Patient file details</h2>
            <p className="muted">Use fake demo details only. Do not enter real names, phone numbers, addresses, histories, or identifiers.</p>
          </div>
          <span className="badge warning">No real patient data</span>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <label>
            Demo file number
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
            First name
            <input onChange={(event) => update("firstName", event.target.value)} placeholder="Demo" required value={form.firstName} />
          </label>
          <label>
            Last name
            <input onChange={(event) => update("lastName", event.target.value)} placeholder="Patient" required value={form.lastName} />
          </label>
          <label>
            Sex
            <select onChange={(event) => update("sex", event.target.value)} value={form.sex}>
              <option value="">Not set</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other / not specified</option>
            </select>
          </label>
          <label>
            Date of birth
            <input onChange={(event) => update("dateOfBirth", event.target.value)} type="date" value={form.dateOfBirth} />
          </label>
          <label>
            Phone
            <input onChange={(event) => update("phone", event.target.value)} placeholder="Demo phone only" value={form.phone} />
          </label>
          <label>
            Email
            <input onChange={(event) => update("email", event.target.value)} placeholder="demo@example.local" type="email" value={form.email} />
          </label>
          <label className="wide">
            Notes
            <textarea onChange={(event) => update("notes", event.target.value)} rows={3} value={form.notes} />
          </label>

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
  return `DEMO-PAT-${Date.now().toString().slice(-8)}`;
}
