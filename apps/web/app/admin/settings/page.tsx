"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";

type ClinicSettings = {
  clinicName: string;
  phone: string;
  address: string;
  workingHours: string;
  defaultAppointmentDuration: number;
  currency: string;
  invoicePrefix: string;
  receiptFooterNote: string;
  densityMode: string;
};

const fallbackSettings: ClinicSettings = {
  clinicName: "Prij Clinic",
  phone: "",
  address: "",
  workingHours: "09:00-17:00",
  defaultAppointmentDuration: 30,
  currency: "EGP",
  invoicePrefix: "PRJ",
  receiptFooterNote: "",
  densityMode: "comfortable"
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings>(fallbackSettings);
  const [draft, setDraft] = useState<ClinicSettings>(fallbackSettings);
  const [reason, setReason] = useState("Clinic settings update.");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setError("");
    const token = sessionStorage.getItem("prijClinicToken");
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/settings/clinic-profile`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      });
      if (response.status === 403) throw new Error("Owner/Admin access is required.");
      if (!response.ok) throw new Error("Clinic settings are unavailable.");
      const data = (await response.json()) as ClinicSettings;
      setSettings(data);
      setDraft(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load clinic settings.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const token = sessionStorage.getItem("prijClinicToken");
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/settings/clinic-profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...draft, reason })
      });
      if (response.status === 403) throw new Error("Owner/Admin access is required.");
      if (!response.ok) throw new Error("Could not save clinic settings.");
      const data = (await response.json()) as ClinicSettings;
      setSettings(data);
      setDraft(data);
      setEditing(false);
      setMessage("Clinic settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save clinic settings.");
    }
  }

  function update<K extends keyof ClinicSettings>(key: K, value: ClinicSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppShell>
      <section className="page-header compact-page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Clinic Settings</h1>
          </div>
          <div className="form-actions">
            {!editing ? <button className="button compact" onClick={() => setEditing(true)} type="button">Edit</button> : null}
          </div>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="notice">{message}</p> : null}

      <form className="settings-form" onSubmit={save}>
        <section className="panel compact-panel">
          <div className="section-heading"><h2>Clinic identity</h2></div>
          <div className="form-grid">
            <label>Clinic name<input disabled={!editing} maxLength={120} required value={draft.clinicName} onChange={(event) => update("clinicName", event.target.value)} /></label>
            <label>Phone<input disabled={!editing} maxLength={40} value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            <label className="wide">Address<input disabled={!editing} maxLength={240} value={draft.address} onChange={(event) => update("address", event.target.value)} /></label>
          </div>
        </section>

        <section className="panel compact-panel">
          <div className="section-heading"><h2>Schedule</h2></div>
          <div className="form-grid">
            <label>Working hours<input disabled={!editing} maxLength={80} value={draft.workingHours} onChange={(event) => update("workingHours", event.target.value)} /></label>
            <label>Default appointment duration<input disabled={!editing} min={5} max={240} type="number" value={draft.defaultAppointmentDuration} onChange={(event) => update("defaultAppointmentDuration", Number(event.target.value))} /></label>
          </div>
        </section>

        <section className="panel compact-panel">
          <div className="section-heading"><h2>Billing defaults</h2></div>
          <div className="form-grid">
            <label>Currency<select disabled={!editing} value={draft.currency} onChange={(event) => update("currency", event.target.value)}>
              {["EGP", "USD", "EUR", "SAR", "AED"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select></label>
            <label>Invoice prefix<input disabled={!editing} maxLength={12} required value={draft.invoicePrefix} onChange={(event) => update("invoicePrefix", event.target.value)} /></label>
            <label className="wide">Receipt footer note<input disabled={!editing} maxLength={240} value={draft.receiptFooterNote} onChange={(event) => update("receiptFooterNote", event.target.value)} /></label>
          </div>
        </section>

        <section className="panel compact-panel">
          <div className="section-heading"><h2>Appearance</h2></div>
          <div className="form-grid">
            <label>Density<select disabled={!editing} value={draft.densityMode} onChange={(event) => update("densityMode", event.target.value)}>
              <option value="comfortable">Comfortable</option>
              <option value="large">Large</option>
              <option value="compact">Compact</option>
            </select></label>
            <label className="wide">Audit reason<input disabled={!editing} maxLength={500} required value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          </div>
        </section>

        <section className="panel compact-panel">
          <div className="section-heading"><h2>Admin links</h2></div>
          <div className="form-actions">
            <Link className="button secondary compact" href="/admin/audit">Audit Log</Link>
            <Link className="button secondary compact" href="/admin/medication-safety-profiles">Medication Safety Review</Link>
            <Link className="button secondary compact" href="/admin/services">Service Catalog</Link>
            <Link className="button secondary compact" href="/admin/appearance">Appearance</Link>
          </div>
        </section>

        {editing ? (
          <div className="form-actions sticky-form-actions">
            <button className="button" type="submit">Save settings</button>
            <button className="button secondary" onClick={() => { setDraft(settings); setEditing(false); setError(""); }} type="button">Cancel</button>
          </div>
        ) : null}
      </form>
    </AppShell>
  );
}
