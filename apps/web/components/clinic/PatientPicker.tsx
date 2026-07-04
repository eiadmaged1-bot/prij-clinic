"use client";

import { useMemo, useState } from "react";

export type PatientPickerPatient = {
  id: string;
  medicalRecordNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: string | null;
};

type PatientPickerProps = {
  patients: PatientPickerPatient[];
  selectedPatientId?: string;
  onSelect: (patientId: string) => void;
  allowStandalone?: boolean;
  standaloneLabel?: string;
  label?: string;
  required?: boolean;
};

export function PatientPicker({
  patients,
  selectedPatientId = "",
  onSelect,
  allowStandalone = false,
  standaloneLabel = "Standalone draft",
  label = "Choose patient",
  required = false
}: PatientPickerProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(!selectedPatientId);
  const selected = patients.find((patient) => patient.id === selectedPatientId) ?? null;
  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    return patients
      .filter((patient) => !text || patientSearchText(patient).includes(text))
      .slice(0, 8);
  }, [patients, query]);

  return (
    <div className="patient-picker" data-patient-picker>
      <div className="section-heading compact-heading">
        <div>
          <h3>{label}</h3>
          <p className="muted">{selected ? "Patient selected" : required ? "Select a patient before saving" : "Patient can be attached later"}</p>
        </div>
        {selected ? <button className="button secondary compact" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Collapse" : "Change"}</button> : null}
      </div>
      {selected ? <SelectedPatientSummary patient={selected} /> : <p className="empty-state compact smart-empty-state"><span>{required ? "No patient selected." : standaloneLabel}</span></p>}
      {expanded ? (
        <div className="patient-picker-panel">
          <label>
            Search patient
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, MRN / file number, phone" aria-label="Search patient" />
          </label>
          <div className="dense-card-list patient-picker-results" role="listbox" aria-label="Patient results">
            {allowStandalone ? (
              <button className={`picker-row ${!selectedPatientId ? "active" : ""}`} type="button" onClick={() => { onSelect(""); setExpanded(false); }}>
                <strong>{standaloneLabel}</strong>
                <span>No patient file attached</span>
              </button>
            ) : null}
            {matches.map((patient) => (
              <button
                className={`picker-row ${selectedPatientId === patient.id ? "active" : ""}`}
                key={patient.id}
                role="option"
                aria-selected={selectedPatientId === patient.id}
                type="button"
                onClick={() => {
                  onSelect(patient.id);
                  setExpanded(false);
                }}
              >
                <strong>{patientLabel(patient)}</strong>
                <span>{patient.medicalRecordNumber ?? "No MRN"} | {patient.phone ?? "No phone"} | {patient.status ?? "active"}</span>
              </button>
            ))}
            {!matches.length ? <p className="empty-state compact smart-empty-state"><span>No matching patients.</span></p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SelectedPatientSummary({ patient }: { patient: PatientPickerPatient }) {
  return (
    <div className="selected-patient-card">
      <strong>{patientLabel(patient)}</strong>
      <span>{patient.medicalRecordNumber ?? "No MRN"} | {patient.phone ?? "No phone"} | {patient.status ?? "active"}</span>
    </div>
  );
}

export function patientLabel(patient?: PatientPickerPatient | null) {
  if (!patient) return "Patient";
  return `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || patient.medicalRecordNumber || "Patient";
}

export function patientSearchText(patient?: PatientPickerPatient | null) {
  return `${patientLabel(patient)} ${patient?.medicalRecordNumber ?? ""} ${patient?.phone ?? ""} ${patient?.status ?? ""}`.toLowerCase();
}
