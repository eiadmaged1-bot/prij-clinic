"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { patientWorkspaceRegistry } from "./patient-workspace-registry";

export type WorkspacePanelPlacement = { panelKey: string; order: number; column: number; size: "SMALL" | "MEDIUM" | "WIDE" | "FULL"; collapsed: boolean; pinned: boolean; hidden: boolean };
type MissingFinding = { key: string; missingItem: string; context: string; reason: string; severity: string; requirement: string; actionLink: string; state: string; ruleSource: string; ruleVersion: string };

export function PatientWorkspaceEditor({ patientId, permissions, roles, onApply }: { patientId: string; permissions: string[]; roles: string[]; onApply: (panels: WorkspacePanelPlacement[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [panels, setPanels] = useState<WorkspacePanelPlacement[]>([]);
  const [scope, setScope] = useState<"PERSONAL" | "PATIENT" | "CLINIC">("PERSONAL");
  const [preset, setPreset] = useState("MINIMAL_VISIT");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Loading workspace layout…");
  const [findings, setFindings] = useState<MissingFinding[]>([]);
  const [findingsState, setFindingsState] = useState<"loading" | "ready" | "error">("loading");
  const privileged = roles.some((role) => ["Owner", "Admin"].includes(role));
  const permittedRegistry = useMemo(() => patientWorkspaceRegistry.filter((entry) => (!entry.requiredPermissions.length || entry.requiredPermissions.some((permission) => permissions.includes(permission))) && (!entry.roles?.length || entry.roles.some((role) => roles.includes(role)))), [permissions, roles]);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("prijClinicToken");
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;
    void fetch(`${getApiBaseUrl()}/patients/${patientId}/workspace-layout`, { credentials: "include", headers, signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("layout");
      const data = await response.json() as { layout: { panels: WorkspacePanelPlacement[]; presetKey?: string | null }; source: string };
      const resolved = withLibrary(data.layout.panels, permittedRegistry.map((item) => item.key));
      setPanels(resolved); onApply(resolved); setPreset(data.layout.presetKey ?? "CUSTOM"); setStatus(`Applied ${data.source.toLowerCase()} layout.`);
    }).catch((error) => { if ((error as Error).name !== "AbortError") setStatus("Workspace layout could not be loaded; the safe built-in order remains active."); });
    void fetch(`${getApiBaseUrl()}/patients/${patientId}/missing-information`, { credentials: "include", headers, signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("findings");
      const data = await response.json() as { findings: MissingFinding[] };
      setFindings(data.findings); setFindingsState("ready");
    }).catch((error) => { if ((error as Error).name !== "AbortError") setFindingsState("error"); });
    return () => controller.abort();
  }, [patientId, permittedRegistry, onApply]);

  async function loadPreset(nextPreset: string) {
    setPreset(nextPreset); setStatus("Loading preset…");
    try {
      const response = await apiFetch(`/patients/${patientId}/workspace-presets/${nextPreset}`);
      if (!response.ok) throw new Error("preset");
      const data = await response.json() as { panels: WorkspacePanelPlacement[] };
      const next = withLibrary(data.panels, permittedRegistry.map((item) => item.key)); setPanels(next); onApply(next); setStatus("Preset preview applied. Save to keep it.");
    } catch { setStatus("Preset could not be loaded."); }
  }

  async function save() {
    setStatus("Saving workspace layout…");
    try {
      const response = await apiFetch(`/patients/${patientId}/workspace-layout`, { method: "PUT", body: JSON.stringify({ scope, name: scope === "CLINIC" ? "Clinic default" : scope === "PATIENT" ? "Patient override" : "My workspace", presetKey: preset, published: scope === "CLINIC", reason: reason.trim() || undefined, panels: panels.map((panel, order) => ({ ...panel, order })) }) });
      if (!response.ok) { const body = await response.json().catch(() => ({})) as { message?: string }; throw new Error(body.message || "Workspace layout was not saved."); }
      const saved = await response.json() as { panels: WorkspacePanelPlacement[] }; setPanels(saved.panels); onApply(saved.panels); setStatus("Workspace layout saved."); setEditing(false); setReason("");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Workspace layout was not saved."); }
  }

  function update(key: string, changes: Partial<WorkspacePanelPlacement>) { setPanels((current) => current.map((panel) => panel.panelKey === key ? { ...panel, ...changes } : panel)); }
  function move(index: number, direction: -1 | 1) { setPanels((current) => { const next = [...current]; const destination = index + direction; if (destination < 0 || destination >= next.length) return current; const source = next[index]!; next[index] = next[destination]!; next[destination] = source; return next.map((panel, order) => ({ ...panel, order })); }); }

  return <>
    <section className="panel compact-panel patient-workspace-controls">
      <div className="section-heading"><div><h2>Modular patient workspace</h2><p className="muted">{status}</p></div><button className="button secondary compact" type="button" onClick={() => setEditing((value) => !value)}>{editing ? "Close editor" : "Edit Workspace"}</button></div>
      {editing ? <div className="workspace-editor-grid">
        <div className="inline-form"><label>Preset<select value={preset} onChange={(event) => void loadPreset(event.target.value)}>{["MINIMAL_VISIT", "GENERAL_WOMENS_HEALTH", "GYNECOLOGY", "INFERTILITY", "ROUTINE_OBSTETRICS", "HIGH_RISK_OBSTETRICS", "POSTPARTUM", "CUSTOM"].map((key) => <option key={key} value={key}>{key.replaceAll("_", " ")}</option>)}</select></label><label>Save scope<select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}><option value="PERSONAL">My account</option><option value="PATIENT">This patient</option>{privileged ? <option value="CLINIC">Clinic default</option> : null}</select></label></div>
        <div className="workspace-panel-library">{panels.map((panel, index) => { const definition = patientWorkspaceRegistry.find((item) => item.key === panel.panelKey); if (!definition) return null; return <article className="data-row compact" key={panel.panelKey}><label><input type="checkbox" checked={!panel.hidden} disabled={definition.mandatory} onChange={(event) => update(panel.panelKey, { hidden: !event.target.checked })} /> {definition.label}{definition.mandatory ? " (required)" : ""}</label><div className="form-actions"><button type="button" className="button secondary compact" disabled={index === 0} onClick={() => move(index, -1)}>Move up</button><button type="button" className="button secondary compact" disabled={index === panels.length - 1} onClick={() => move(index, 1)}>Move down</button><select aria-label={`${definition.label} size`} value={panel.size} disabled={definition.mandatory} onChange={(event) => update(panel.panelKey, { size: event.target.value as WorkspacePanelPlacement["size"] })}>{definition.supportedSizes.map((size) => <option key={size} value={size}>{size.toLowerCase()}</option>)}</select><label><input type="checkbox" checked={panel.collapsed} onChange={(event) => update(panel.panelKey, { collapsed: event.target.checked })} /> Collapsed</label><label><input type="checkbox" checked={panel.pinned} onChange={(event) => update(panel.panelKey, { pinned: event.target.checked })} /> Pinned</label></div></article>; })}</div>
        {scope !== "PERSONAL" ? <label>Reason<input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} required /></label> : null}<div className="form-actions"><button className="button" type="button" onClick={() => void save()}>Save layout</button><button className="button secondary" type="button" onClick={() => void loadPreset("MINIMAL_VISIT")}>Reset preview</button></div>
      </div> : null}
    </section>
    <section className="panel compact-panel missing-information-panel"><div className="section-heading"><div><h2>Missing information</h2><p className="muted">Deterministic prompts only; no diagnosis or prescribing.</p></div>{findingsState === "ready" ? <span className="badge">{findings.length}</span> : null}</div>{findingsState === "loading" ? <div className="skeleton" /> : findingsState === "error" ? <p className="form-error">Missing-information rules could not be loaded.</p> : findings.length ? <div className="dense-card-list">{findings.map((finding) => <article className="data-row compact" key={finding.key}><div><strong>{finding.missingItem}</strong><span className="badge warning">{finding.state}</span></div><p>{finding.reason}</p><small>{finding.requirement} · {finding.context} · rule {finding.ruleVersion}</small><a className="button secondary compact" href={finding.actionLink}>Record or review</a></article>)}</div> : <p className="empty-state compact">No current rule-based gaps were found.</p>}</section>
  </>;
}

function withLibrary(current: WorkspacePanelPlacement[], permittedKeys: string[]) { const existing = new Set(current.map((panel) => panel.panelKey)); return [...current.filter((panel) => permittedKeys.includes(panel.panelKey)), ...permittedKeys.filter((key) => !existing.has(key)).map((panelKey, offset) => ({ panelKey, order: current.length + offset, column: 1, size: "MEDIUM" as const, collapsed: false, pinned: false, hidden: true }))]; }
function apiFetch(path: string, init?: RequestInit) { const token = sessionStorage.getItem("prijClinicToken"); return fetch(`${getApiBaseUrl()}${path}`, { credentials: "include", ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } }); }
