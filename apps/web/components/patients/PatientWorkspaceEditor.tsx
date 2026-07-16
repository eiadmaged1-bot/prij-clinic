"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { patientWorkspaceRegistry } from "./patient-workspace-registry";
import { useI18n } from "@/i18n/useI18n";

export type WorkspacePanelPlacement = { panelKey: string; order: number; column: number; size: "SMALL" | "MEDIUM" | "WIDE" | "FULL"; collapsed: boolean; pinned: boolean; hidden: boolean };
type MissingFinding = { key: string; missingItem: string; context: string; reason: string; severity: string; requirement: string; actionLink: string; state: string; ruleSource: string; ruleVersion: string };

export function PatientWorkspaceEditor({ patientId, patientType, permissions, roles, onApply, dedicated = false }: { patientId: string; patientType: string; permissions: string[]; roles: string[]; onApply: (panels: WorkspacePanelPlacement[]) => void; dedicated?: boolean }) {
  const { t, language } = useI18n();
  const [editing, setEditing] = useState(dedicated);
  const [panels, setPanels] = useState<WorkspacePanelPlacement[]>([]);
  const [savedPanels, setSavedPanels] = useState<WorkspacePanelPlacement[]>([]);
  const [history, setHistory] = useState<WorkspacePanelPlacement[][]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [draggedKey, setDraggedKey] = useState("");
  const [scope, setScope] = useState<"PERSONAL" | "PATIENT" | "ROLE" | "SPECIALTY" | "CLINIC">("PERSONAL");
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
      setPanels(resolved); setSavedPanels(resolved); onApply(resolved); setPreset(data.layout.presetKey ?? "CUSTOM"); setStatus(`Applied ${data.source.toLowerCase()} layout.`);
    }).catch((error) => { if ((error as Error).name !== "AbortError") setStatus("Workspace layout could not be loaded; the safe built-in order remains active."); });
    void fetch(`${getApiBaseUrl()}/patients/${patientId}/missing-information`, { credentials: "include", headers, signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("findings");
      const data = await response.json() as { findings: MissingFinding[] };
      setFindings(data.findings); setFindingsState("ready");
    }).catch((error) => { if ((error as Error).name !== "AbortError") setFindingsState("error"); });
    return () => controller.abort();
  }, [patientId, permittedRegistry, onApply]);

  const dirty = JSON.stringify(panels) !== JSON.stringify(savedPanels);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
      const response = await apiFetch(`/patients/${patientId}/workspace-layout`, { method: "PUT", body: JSON.stringify({ scope, name: scope === "CLINIC" ? "Clinic default" : scope === "ROLE" ? `${roles[0] ?? "Clinical"} role default` : scope === "SPECIALTY" ? `${patientType} specialty template` : scope === "PATIENT" ? "Patient override" : "My workspace", roleKey: scope === "ROLE" ? roles[0] : undefined, specialtyKey: scope === "SPECIALTY" ? patientType : undefined, presetKey: preset, published: ["CLINIC", "ROLE", "SPECIALTY"].includes(scope), reason: reason.trim() || undefined, panels: panels.map((panel, order) => ({ ...panel, order })) }) });
      if (!response.ok) { const body = await response.json().catch(() => ({})) as { message?: string }; throw new Error(body.message || "Workspace layout was not saved."); }
      const saved = await response.json() as { panels: WorkspacePanelPlacement[] }; setPanels(saved.panels); setSavedPanels(saved.panels); setHistory([]); onApply(saved.panels); setStatus("Workspace layout saved."); if (!dedicated) setEditing(false); setReason("");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Workspace layout was not saved."); }
  }

  async function decideFinding(finding: MissingFinding, decision: "NOT_APPLICABLE" | "PATIENT_DECLINED" | "AWAITING_EXTERNAL_RESULT" | "DISMISS" | "SNOOZE") {
    const reason = window.prompt("Document the reason for this decision")?.trim();
    if (!reason) return;
    const snoozeDate = decision === "SNOOZE" ? window.prompt("Snooze until (YYYY-MM-DD)")?.trim() : undefined;
    if (decision === "SNOOZE" && !snoozeDate) return;
    const response = await apiFetch(`/patients/${patientId}/missing-information/${encodeURIComponent(finding.key)}/decision`, { method: "POST", body: JSON.stringify({ decision, reason, snoozedUntil: snoozeDate ? `${snoozeDate}T00:00:00.000Z` : undefined }) });
    if (!response.ok) { const body = await response.json().catch(() => ({})) as { message?: string }; setStatus(body.message ?? "The missing-information decision was not saved."); return; }
    setFindings((current) => decision === "AWAITING_EXTERNAL_RESULT" ? current.map((item) => item.key === finding.key ? { ...item, state: "Awaiting external result" } : item) : current.filter((item) => item.key !== finding.key));
    setStatus("Missing-information decision saved and audited.");
  }

  function mutate(next: (current: WorkspacePanelPlacement[]) => WorkspacePanelPlacement[]) { setPanels((current) => { const changed = next(current); if (changed === current) return current; setHistory((items) => [...items.slice(-19), current]); onApply(changed); return changed; }); }
  function update(key: string, changes: Partial<WorkspacePanelPlacement>) { mutate((current) => current.map((panel) => panel.panelKey === key ? { ...panel, ...changes } : panel)); }
  function move(index: number, direction: -1 | 1) { mutate((current) => { const next = [...current]; const destination = index + direction; if (destination < 0 || destination >= next.length) return current; const source = next[index]!; next[index] = next[destination]!; next[destination] = source; return next.map((panel, order) => ({ ...panel, order })); }); }
  function dropOn(targetKey: string) { if (!draggedKey || draggedKey === targetKey) return setDraggedKey(""); mutate((current) => { const next = [...current]; const source = next.findIndex((panel) => panel.panelKey === draggedKey); const target = next.findIndex((panel) => panel.panelKey === targetKey); if (source < 0 || target < 0) return current; const [item] = next.splice(source, 1); next.splice(target, 0, item!); return next.map((panel, order) => ({ ...panel, order })); }); setDraggedKey(""); }
  function undo() { const previous = history.at(-1); if (!previous) return; setPanels(previous); onApply(previous); setHistory((items) => items.slice(0, -1)); }
  function cancel() { setPanels(savedPanels); onApply(savedPanels); setHistory([]); setStatus("Unsaved changes discarded."); if (!dedicated) setEditing(false); }

  return <>
    <section className={`panel compact-panel patient-workspace-controls ${dedicated ? "workspace-editor-fullscreen" : ""}`}>
      <div className="section-heading"><div><h2>{t("modularWorkspace")}</h2><p className="muted">{status} {dirty ? "Unsaved changes." : ""}</p></div>{dedicated ? <Link className="button secondary compact" href={`/patients/${patientId}`}>Back to patient</Link> : <Link className="button secondary compact" href={`/patients/${patientId}/workspace-editor`}>{t("editWorkspace")}</Link>}</div>
      {editing ? <><div className="workspace-editor-toolbar"><label>{t("workspacePreset")}<select value={preset} onChange={(event) => void loadPreset(event.target.value)}>{["MINIMAL_VISIT", "GENERAL_WOMENS_HEALTH", "GYNECOLOGY", "AUB_FIBROID", "PCOS_OVARIAN_MONITORING", "INFERTILITY", "ROUTINE_OBSTETRICS", "HIGH_RISK_OBSTETRICS", "POSTPARTUM", "CUSTOM"].map((key) => <option key={key} value={key}>{key.replaceAll("_", " ")}</option>)}</select></label><label>{t("workspaceSaveScope")}<select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}><option value="PERSONAL">{t("workspaceMyAccount")}</option><option value="PATIENT">{t("workspaceThisPatient")}</option>{privileged ? <><option value="ROLE">Doctor role default</option><option value="SPECIALTY">Specialty default</option><option value="CLINIC">{t("workspaceClinicDefault")}</option></> : null}</select></label><button className="button secondary compact" type="button" disabled={!history.length} onClick={undo}>Undo</button><button className="button secondary compact" type="button" onClick={() => { setScope("PERSONAL"); setStatus("Current layout is ready to duplicate to My account. Save to confirm."); }}>Duplicate to My account</button></div>
        <div className="workspace-editor-three-pane">
          <aside className="workspace-panel-library" aria-label="Panel library"><h3>Panel library</h3>{panels.map((panel, index) => { const definition = patientWorkspaceRegistry.find((item) => item.key === panel.panelKey); if (!definition) return null; const panelLabel = language === "ar" ? definition.labelAr : definition.label; return <article className={`workspace-library-item ${selectedKey === panel.panelKey ? "selected" : ""}`} draggable onDragStart={() => setDraggedKey(panel.panelKey)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOn(panel.panelKey)} key={panel.panelKey}><button type="button" onClick={() => setSelectedKey(panel.panelKey)}><strong>{panelLabel}</strong><span>{panel.hidden ? "Hidden" : panel.size.toLowerCase()}</span></button><div className="form-actions"><button type="button" aria-label={`Move ${panelLabel} up`} disabled={index === 0} onClick={() => move(index, -1)}>↑<span className="sr-only">{t("moveUp")}</span></button><button type="button" aria-label={`Move ${panelLabel} down`} disabled={index === panels.length - 1} onClick={() => move(index, 1)}>↓<span className="sr-only">{t("moveDown")}</span></button></div></article>; })}</aside>
          <section className="workspace-live-preview" aria-label="Live workspace preview"><h3>Live workspace preview</h3><div className="patient-workspace-grid">{panels.filter((panel) => !panel.hidden).map((panel) => { const definition = patientWorkspaceRegistry.find((item) => item.key === panel.panelKey); return <article className={`patient-workspace-panel workspace-panel-size-${panel.size.toLowerCase()} ${panel.pinned ? "is-pinned" : ""}`} draggable onDragStart={() => setDraggedKey(panel.panelKey)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropOn(panel.panelKey)} key={panel.panelKey}><header className="workspace-panel-preview-header"><strong>{definition ? (language === "ar" ? definition.labelAr : definition.label) : panel.panelKey}</strong><span className="badge">{panel.collapsed ? "Collapsed" : panel.size.toLowerCase()}</span></header><p className="muted">Authoritative patient data renders here in the saved workspace.</p></article>; })}</div></section>
          <aside className="workspace-panel-properties" aria-label="Panel properties"><h3>Panel properties</h3>{(() => { const panel = panels.find((item) => item.panelKey === selectedKey) ?? panels[0]; const definition = patientWorkspaceRegistry.find((item) => item.key === panel?.panelKey); if (!panel || !definition) return <p className="muted">Select a panel.</p>; return <div className="form-stack"><strong>{language === "ar" ? definition.labelAr : definition.label}</strong><label><input type="checkbox" checked={!panel.hidden} disabled={definition.mandatory} onChange={(event) => update(panel.panelKey, { hidden: !event.target.checked })} /> Visible</label><label>Width<select value={panel.size} disabled={definition.mandatory} onChange={(event) => update(panel.panelKey, { size: event.target.value as WorkspacePanelPlacement["size"] })}>{definition.supportedSizes.map((size) => <option key={size} value={size}>{size === "SMALL" ? "Small · 4" : size === "MEDIUM" ? "Half · 6" : size === "WIDE" ? "Wide · 8" : "Full · 12"}</option>)}</select></label><div className="form-actions"><button type="button" onClick={() => update(panel.panelKey, { column: Math.max(1, panel.column - 1) })}>Move left</button><button type="button" onClick={() => update(panel.panelKey, { column: Math.min(12, panel.column + 1) })}>Move right</button></div><label><input type="checkbox" checked={panel.collapsed} onChange={(event) => update(panel.panelKey, { collapsed: event.target.checked })} /> {t("collapsed")}</label><label><input type="checkbox" checked={panel.pinned} onChange={(event) => update(panel.panelKey, { pinned: event.target.checked })} /> {t("pinned")}</label></div>; })()}</aside>
        </div>
        {scope !== "PERSONAL" ? <label>{t("reason")}<input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} required /></label> : null}<div className="form-actions workspace-editor-sticky-actions"><button className="button" type="button" disabled={!dirty} onClick={() => void save()}>{t("saveLayout")}</button><button className="button secondary" type="button" disabled={!dirty} onClick={cancel}>Cancel changes</button><button className="button secondary" type="button" onClick={() => void loadPreset("MINIMAL_VISIT")}>{t("resetPreview")}</button></div>
      </> : null}
    </section>
    <section className="panel compact-panel missing-information-panel"><div className="section-heading"><div><h2>{t("missingInformation")}</h2><p className="muted">Review compact groups and complete information from its authoritative panel.</p></div>{findingsState === "ready" ? <span className="badge">{findings.length}</span> : null}</div>{findingsState === "loading" ? <div className="skeleton" /> : findingsState === "error" ? <p className="form-error">{t("missingRulesLoadError")}</p> : findings.length ? <div className="missing-information-groups">{groupFindings(findings).map(([group, rows]) => <details key={group} open={rows.some((finding) => finding.severity === "high")}><summary><strong>{group}</strong><span className="badge">{rows.length}</span></summary><div className="dense-card-list">{rows.map((finding) => <article className="data-row compact" key={finding.key}><div><strong>{finding.missingItem}</strong><span className={`badge ${finding.severity === "high" ? "warning" : ""}`}>{finding.state}</span></div><p>{finding.reason}</p><p className="muted"><strong>Impact:</strong> {finding.severity === "high" ? "Required safety or clinical review remains incomplete." : "The patient context or follow-up view may be incomplete."}</p><div className="form-actions"><a className="button secondary compact" href={finding.actionLink}>Complete now</a>{permissions.includes("patient.update") ? <><button className="button secondary compact" type="button" onClick={() => void decideFinding(finding, "NOT_APPLICABLE")}>Not applicable</button><button className="button secondary compact" type="button" onClick={() => void decideFinding(finding, "PATIENT_DECLINED")}>Patient declined</button><button className="button secondary compact" type="button" onClick={() => void decideFinding(finding, "AWAITING_EXTERNAL_RESULT")}>Awaiting external result</button><button className="button secondary compact" type="button" onClick={() => void decideFinding(finding, "SNOOZE")}>Snooze</button>{finding.severity !== "high" ? <button className="button secondary compact" type="button" onClick={() => void decideFinding(finding, "DISMISS")}>Dismiss with reason</button> : null}</> : null}</div></article>)}</div></details>)}</div> : <p className="empty-state compact">{t("noRuleBasedGaps")}</p>}</section>
  </>;
}

function withLibrary(current: WorkspacePanelPlacement[], permittedKeys: string[]) { const existing = new Set(current.map((panel) => panel.panelKey)); return [...current.filter((panel) => permittedKeys.includes(panel.panelKey)), ...permittedKeys.filter((key) => !existing.has(key)).map((panelKey, offset) => ({ panelKey, order: current.length + offset, column: 1, size: "MEDIUM" as const, collapsed: false, pinned: false, hidden: true }))]; }
function groupFindings(findings: MissingFinding[]) { const labels: Record<string, string> = { patient: "Demographics and safety", visit: "Visit documentation", pregnancy: "OB/GYN history", "infertility-cycle": "OB/GYN history", "investigation-order": "Investigations", "investigation-result": "Investigations" }; const groups = new Map<string, MissingFinding[]>(); for (const finding of findings) { const group = labels[finding.context] ?? "Follow-up"; groups.set(group, [...(groups.get(group) ?? []), finding]); } return [...groups.entries()]; }
function apiFetch(path: string, init?: RequestInit) { const token = sessionStorage.getItem("prijClinicToken"); return fetch(`${getApiBaseUrl()}${path}`, { credentials: "include", ...init, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } }); }
