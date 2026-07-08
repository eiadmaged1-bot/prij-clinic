"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";

export type PatientPickerPatient = {
  id: string;
  medicalRecordNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: string | null;
  patientType?: string | null;
  createdAt?: string | null;
  latestVisitDate?: string | null;
};

type PatientPickerProps = {
  patients: PatientPickerPatient[];
  selectedPatientId?: string;
  onSelect: (patientId: string) => void;
  allowStandalone?: boolean;
  standaloneLabel?: string;
  label?: string;
  required?: boolean;
  liveSearch?: boolean;
  minSearchLength?: number;
};

export function PatientPicker({
  patients,
  selectedPatientId = "",
  onSelect,
  allowStandalone = false,
  standaloneLabel = "Standalone draft",
  label = "Choose patient",
  required = false,
  liveSearch = true,
  minSearchLength = 2
}: PatientPickerProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(!selectedPatientId);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [livePatients, setLivePatients] = useState<PatientPickerPatient[]>([]);
  const sourcePatients = liveSearch ? livePatients : patients;
  const selected = sourcePatients.find((patient) => patient.id === selectedPatientId) ?? patients.find((patient) => patient.id === selectedPatientId) ?? null;

  useEffect(() => {
    if (!liveSearch) return;
    const text = query.trim();
    if (text.length < minSearchLength) {
      setLivePatients([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchPatients(text, includeArchived).then(setLivePatients).catch(() => setLivePatients([]));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [includeArchived, liveSearch, minSearchLength, query]);

  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (text.length < minSearchLength) return [];
    return sourcePatients
      .filter((patient) => includeArchived || patient.status !== "archived")
      .filter((patient) => patientSearchText(patient).includes(text))
      .filter((patient) => !isDemoLikePatient(patient))
      .sort(comparePatientRecency)
      .slice(0, 20);
  }, [includeArchived, minSearchLength, query, sourcePatients]);

  const groupedMatches = useMemo(() => groupPatientsByType(matches), [matches]);

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
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient by name, phone, or file number." aria-label="Search patient" />
          </label>
          <label className="checkbox-row">
            <input checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} type="checkbox" />
            Include archived patients
          </label>
          <div className="dense-card-list patient-picker-results" role="listbox" aria-label="Patient results">
            {allowStandalone ? (
              <button className={`picker-row ${!selectedPatientId ? "active" : ""}`} type="button" onClick={() => { onSelect(""); setExpanded(false); }}>
                <strong>{standaloneLabel}</strong>
                <span>No patient file attached</span>
              </button>
            ) : null}
            {query.trim().length < minSearchLength ? <p className="empty-state compact smart-empty-state"><span>Search patient by name, phone, or file number.</span></p> : null}
            {groupedMatches.map(([group, rows]) => (
              <section className="compact-panel" key={group}>
                <h4>{group}</h4>
                {rows.map((patient) => (
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
              </section>
            ))}
            {query.trim().length >= minSearchLength && !matches.length ? <p className="empty-state compact smart-empty-state"><span>No matching patients.</span></p> : null}
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
  return `${patientLabel(patient)} ${patient?.medicalRecordNumber ?? ""} ${patient?.phone ?? ""} ${patient?.status ?? ""} ${patient?.patientType ?? ""}`.toLowerCase();
}

async function fetchPatients(query: string, includeArchived: boolean) {
  const token = sessionStorage.getItem("prijClinicToken");
  const params = new URLSearchParams({ q: query, includeArchived: String(includeArchived) });
  const response = await fetch(`${getApiBaseUrl()}/patients?${params.toString()}`, {
    credentials: "include",
    headers: token ? { authorization: `Bearer ${token}` } : undefined
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { patients?: PatientPickerPatient[] };
  return data.patients ?? [];
}

function groupPatientsByType(patients: PatientPickerPatient[]) {
  const order = ["OB", "GYN", "INFERTILITY", "WOMEN_HEALTH", "OTHER", "UNCLASSIFIED"];
  const labels: Record<string, string> = {
    OB: "Obstetric / Pregnancy",
    GYN: "Gynecology",
    INFERTILITY: "Infertility",
    WOMEN_HEALTH: "Women's Health / General",
    OTHER: "Other / Unclassified",
    UNCLASSIFIED: "Unclassified - needs patient type review"
  };
  return order
    .map((key) => [labels[key], patients.filter((patient) => (patient.patientType || "UNCLASSIFIED") === key)] as const)
    .filter(([, rows]) => rows.length > 0);
}

function comparePatientRecency(left: PatientPickerPatient, right: PatientPickerPatient) {
  return String(right.latestVisitDate ?? right.createdAt ?? "").localeCompare(String(left.latestVisitDate ?? left.createdAt ?? ""));
}

function isDemoLikePatient(patient: PatientPickerPatient) {
  return /\b(demo|test|qa|runtime|fixture|ux-)\b/i.test(`${patientLabel(patient)} ${patient.medicalRecordNumber ?? ""}`);
}
