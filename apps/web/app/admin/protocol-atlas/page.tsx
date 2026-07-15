"use client";

import { FormEvent, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";
import {
  ClinicalProtocol,
  getProtocolEditor,
  ProtocolSummary,
  requestProtocolVerification,
  retireProtocol,
  searchProtocols,
  StructuredProtocolContent,
  updateProtocolAliases,
  updateProtocolCompletion,
  updateProtocolSource,
  updateStructuredProtocolContent,
  verifyProtocol
} from "../../../lib/protocol-atlas";
import { ProtocolStatusBadge } from "../../../components/protocol-atlas/ProtocolStatusBadge";

const contentSections: Array<{ key: keyof Omit<StructuredProtocolContent, "summary" | "verifiedManagementAvailable">; label: string }> = [
  { key: "goals", label: "Goals" },
  { key: "options", label: "Management options" },
  { key: "safetyChecks", label: "Safety checks" },
  { key: "contraindicationChecks", label: "Contraindication checks" },
  { key: "redFlags", label: "Red flags" },
  { key: "followUpConsiderations", label: "Follow-up considerations" },
  { key: "referralConsiderations", label: "Referral considerations" },
  { key: "limitations", label: "Limitations" }
];

const completionSections = ["scope", "inclusion", "exclusion", "requiredHistory", "examination", "investigations", "redFlags", "management", "medicationConsiderations", "followUp", "escalationReferral", "counselling", "sourceVersion", "clinicWorkflow", "reviewer", "approval", "unansweredQuestions", "evidenceRecommendations"] as const;

export default function AdminProtocolAtlasPage() {
  const [protocols, setProtocols] = useState<ProtocolSummary[]>([]);
  const [selected, setSelected] = useState<ClinicalProtocol | null>(null);
  const [status, setStatus] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await searchProtocols({
        query: String(form.get("query") ?? ""),
        status: String(form.get("status") ?? "") || undefined
      });
      setProtocols(data.protocols);
      setStatus(`${data.protocols.length} protocols found`);
    } catch {
      setStatus("Could not search protocols. Owner/admin access is required.");
    }
  }

  async function openEditor(protocol: ProtocolSummary) {
    try {
      const next = await getProtocolEditor(protocol.id);
      setSelected(next);
      setStatus("Structured editor loaded");
    } catch {
      setStatus("Could not open editor. Owner/admin access is required.");
    }
  }

  async function saveSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    await save(() => updateProtocolSource(selected.id, {
      reason: String(form.get("reason") ?? ""),
      sourceName: String(form.get("sourceName") ?? ""),
      sourceYear: Number(form.get("sourceYear") || 0) || undefined,
      sourceVersion: String(form.get("sourceVersion") ?? "") || undefined,
      sourceUrl: String(form.get("sourceUrl") ?? "") || undefined
    }), "Source saved and audited");
  }

  async function saveAliases(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    await save(() => updateProtocolAliases(selected.id, {
      reason: String(form.get("reason") ?? ""),
      aliases: splitLines(String(form.get("aliases") ?? ""))
    }), "Aliases saved and audited");
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const content = contentFromForm(form, selected);
    await save(() => updateStructuredProtocolContent(selected.id, { reason: String(form.get("reason") ?? ""), content }), "Structured content saved and audited");
  }

  async function saveCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget);
    const questionnaire = Object.fromEntries(completionSections.map((key) => [key, splitLines(String(form.get(key) ?? ""))]));
    const connections = Object.fromEntries(["guidelines", "medicationFamilies", "investigationSets", "ultrasoundTemplates", "referrals", "followUpTasks", "patientContexts"].map((key) => [key, splitLines(String(form.get(`connection-${key}`) ?? ""))]));
    await save(() => updateProtocolCompletion(selected.id, { reason: String(form.get("reason") ?? ""), questionnaire, connections }), "Protocol completion questionnaire saved and audited");
  }

  async function statusAction(action: "draft" | "verify" | "retire") {
    if (!selected) return;
    const reason = window.prompt("Audit reason for this protocol status change") ?? "";
    const call = action === "draft" ? requestProtocolVerification : action === "verify" ? verifyProtocol : retireProtocol;
    await save(() => call(selected.id, reason), "Protocol status updated and audited");
  }

  async function save(call: () => Promise<ClinicalProtocol>, message: string) {
    try {
      const next = await call();
      setSelected(next);
      setStatus(message);
    } catch {
      setStatus("Save blocked. Check required reason, source, status, and structured safety rules.");
    }
  }

  const content = selected?.structuredContent ?? emptyContent();
  const canVerify = Boolean(selected && selected.implementationStatus === "draft" && selected.sourceName && (selected.sourceYear || selected.sourceVersion || selected.sourceUrl) && content.summary && content.options.length);

  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>Structured Protocol Editor</h1>
        <p className="muted">Owner/admin only. Catalog-only and draft protocols do not generate management advice. Verified protocols require source and audit reason.</p>
      </section>
      <SafetyAlert />
      <section className="content-grid protocol-editor-layout">
        <div className="panel">
          <form className="protocol-search" onSubmit={search}>
            <input name="query" placeholder="Search protocol to edit" />
            <select name="status" defaultValue="">
              <option value="">All active statuses</option>
              <option value="catalog_only">Catalog only</option>
              <option value="draft">Draft</option>
              <option value="verified">Verified</option>
              <option value="retired">Retired</option>
            </select>
            <button className="button" type="submit">Search</button>
          </form>
          <p className="notice">{status || "Search and select a protocol. Use structured fields only."}</p>
          <div className="data-list">
            {protocols.map((protocol) => (
              <button className="data-row text-left" key={protocol.id} onClick={() => void openEditor(protocol)} type="button">
                <strong>{protocol.title}</strong>
                <ProtocolStatusBadge status={protocol.implementationStatus} />
                <p className="muted">{protocol.code} - {protocol.specialtyGroup}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>{selected?.title ?? "Select a protocol"}</h2>
              <p className="muted">{selected ? `${selected.code} - ${selected.specialtyGroup} - ${selected.riskLevel}` : "Structured fields only"}</p>
            </div>
            {selected ? <ProtocolStatusBadge status={selected.implementationStatus} /> : null}
          </div>
          {selected ? (
            <div className="stack">
              <div className="notice safety-note">
                Catalog-only protocols do not generate management advice. Draft protocols do not generate management advice. Verified protocols require source and audit reason.
              </div>
              <form className="form-grid" onSubmit={saveSource} key={`source-${selected.id}-${selected.updatedAt ?? ""}`}>
                <h3>Source metadata</h3>
                <label>Source name<input name="sourceName" required defaultValue={selected.sourceName ?? ""} /></label>
                <label>Source year<input name="sourceYear" type="number" min="1900" max="2100" defaultValue={selected.sourceYear ?? ""} /></label>
                <label>Source version or note<input name="sourceVersion" defaultValue={selected.sourceVersion ?? ""} /></label>
                <label>Source URL<input name="sourceUrl" defaultValue={selected.sourceUrl ?? ""} /></label>
                <label>Reason<textarea name="reason" required /></label>
                <button className="button" type="submit">Save source</button>
              </form>

              <form className="form-grid" onSubmit={saveAliases} key={`aliases-${selected.id}-${selected.updatedAt ?? ""}`}>
                <h3>Aliases</h3>
                <label>One alias per line<textarea name="aliases" required defaultValue={(selected.aliases ?? []).join("\n")} /></label>
                <label>Reason<textarea name="reason" required /></label>
                <button className="button" type="submit">Save aliases</button>
              </form>

              <form className="form-grid" onSubmit={saveContent} key={`content-${selected.id}-${selected.updatedAt ?? ""}`}>
                <h3>Structured content</h3>
                <label>Summary<textarea name="summary" required defaultValue={content.summary} /></label>
                {contentSections.map((section) => (
                  <label key={section.key}>{section.label}<textarea name={section.key} defaultValue={content[section.key].join("\n")} /></label>
                ))}
                <label>Reason<textarea name="reason" required /></label>
                <button className="button" type="submit">Save structured content</button>
              </form>
              <details className="filter-drawer"><summary>Protocol Completion Studio</summary><form className="form-grid" onSubmit={saveCompletion}>{completionSections.map((key) => <label className="wide" key={key}>{key.replace(/([A-Z])/g, " $1")}<textarea name={key} placeholder="Leave unanswered items blank; do not invent medical content." /></label>)}<label className="wide">Linked guidelines<textarea name="connection-guidelines" /></label><label className="wide">Linked medication families / generics<textarea name="connection-medicationFamilies" /></label><label className="wide">Linked investigation sets<textarea name="connection-investigationSets" /></label><label className="wide">Linked ultrasound templates<textarea name="connection-ultrasoundTemplates" /></label><label className="wide">Linked referrals / follow-up tasks / patient contexts<textarea name="connection-referrals" /></label><label>Audit reason<textarea name="reason" required /></label><button className="button" type="submit">Save completion questionnaire</button></form></details>

              <article className="snapshot-result">
                <h3>Doctor preview after verification</h3>
                <p className="muted">{content.summary || "No verified summary yet."}</p>
                <PreviewList title="Management options" items={selected.implementationStatus === "verified" ? content.options : []} empty="Hidden until verified." />
                <PreviewList title="Safety checks" items={content.safetyChecks} empty="Add safety checks before verification." />
                <p className="notice">Source: {selected.sourceName || "Source required before verification"}</p>
              </article>

              <div className="form-actions">
                <button className="button secondary" disabled={selected.implementationStatus !== "catalog_only"} onClick={() => void statusAction("draft")} type="button">Move to draft</button>
                <button className="button" disabled={!canVerify} onClick={() => void statusAction("verify")} type="button">Verify protocol</button>
                <button className="button secondary" onClick={() => void statusAction("retire")} type="button">Retire protocol</button>
              </div>
            </div>
          ) : (
            <p className="notice">Select a protocol to edit source, aliases, structured content, and verification status.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function contentFromForm(form: FormData, selected: ClinicalProtocol): StructuredProtocolContent {
  return {
    summary: String(form.get("summary") ?? ""),
    verifiedManagementAvailable: selected.implementationStatus === "verified",
    goals: splitLines(String(form.get("goals") ?? "")),
    options: splitLines(String(form.get("options") ?? "")),
    safetyChecks: splitLines(String(form.get("safetyChecks") ?? "")),
    contraindicationChecks: splitLines(String(form.get("contraindicationChecks") ?? "")),
    redFlags: splitLines(String(form.get("redFlags") ?? "")),
    followUpConsiderations: splitLines(String(form.get("followUpConsiderations") ?? "")),
    referralConsiderations: splitLines(String(form.get("referralConsiderations") ?? "")),
    limitations: splitLines(String(form.get("limitations") ?? ""))
  };
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function emptyContent(): StructuredProtocolContent {
  return { summary: "", verifiedManagementAvailable: false, goals: [], options: [], safetyChecks: [], contraindicationChecks: [], redFlags: [], followUpConsiderations: [], referralConsiderations: [], limitations: [] };
}

function PreviewList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="snapshot-section">
      <strong>{title}</strong>
      {items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">{empty}</p>}
    </div>
  );
}
