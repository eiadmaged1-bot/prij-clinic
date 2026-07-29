"use client";

import { useState } from "react";
import { useInterfaceMode, type DoctorWorkspaceMode } from "@/lib/interface-mode";

export function DoctorWorkspaceModeSettings() {
  const { doctorWorkspaceMode, updatePreferences } = useInterfaceMode();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const options: Array<{ value: DoctorWorkspaceMode; label: string; description: string }> = [
    { value: "CLASSIC", label: "Classic Workspace", description: "The established Prij visit workspace and its familiar clinical modules." },
    { value: "COCKPIT", label: "Visit Cockpit", description: "A compact seven-stage workspace with contextual longitudinal information." }
  ];

  async function choose(value: DoctorWorkspaceMode) {
    if (value === doctorWorkspaceMode || saving) return;
    setSaving(true);
    setMessage("");
    try {
      await updatePreferences({ doctorWorkspaceMode: value });
      setMessage(`${options.find((option) => option.value === value)?.label} is now your default on every device.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The workspace preference could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <fieldset className="appearance-options" aria-describedby="doctor-workspace-help doctor-workspace-status" disabled={saving}>
    <legend>Doctor Workspace</legend>
    <p className="muted" id="doctor-workspace-help">Both modes use the same encounter draft, validation, autosave, and Review gateway.</p>
    {options.map((option) => <label className="appearance-option" key={option.value}>
      <input checked={doctorWorkspaceMode === option.value} name="doctor-workspace-mode" onChange={() => void choose(option.value)} type="radio" />
      <span><strong>{option.label}</strong><small>{option.description}</small></span>
    </label>)}
    <p aria-live="polite" className="muted" id="doctor-workspace-status">{saving ? "Saving preference…" : message}</p>
  </fieldset>;
}