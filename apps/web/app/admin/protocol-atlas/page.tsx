"use client";

import { FormEvent, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { searchProtocols, ProtocolSummary, updateProtocolStatus } from "../../../lib/protocol-atlas";
import { ProtocolStatusBadge } from "../../../components/protocol-atlas/ProtocolStatusBadge";

export default function AdminProtocolAtlasPage() {
  const [protocols, setProtocols] = useState<ProtocolSummary[]>([]);
  const [selected, setSelected] = useState<ProtocolSummary | null>(null);
  const [status, setStatus] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("query") ?? "");
    try {
      const data = await searchProtocols({ query });
      setProtocols(data.protocols);
      setStatus(`${data.protocols.length} protocols found`);
    } catch {
      setStatus("Could not search protocols. Owner/admin access is required.");
    }
  }

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    try {
      const next = await updateProtocolStatus(selected.id, {
        implementationStatus: String(form.get("implementationStatus") ?? ""),
        reason: String(form.get("reason") ?? ""),
        sourceName: String(form.get("sourceName") ?? "") || undefined,
        sourceYear: Number(form.get("sourceYear") || 0) || undefined,
        sourceVersion: String(form.get("sourceVersion") ?? "") || undefined,
        sourceUrl: String(form.get("sourceUrl") ?? "") || undefined
      });
      setSelected(next);
      setStatus("Protocol status/source updated and audited");
    } catch {
      setStatus("Could not update protocol. Reason and source are required for verification.");
    }
  }

  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>Protocol Verification</h1>
        <p className="muted">Owner/admin only. Content editing is deferred until a safe structured editor exists.</p>
      </section>
      <SafetyAlert />
      <section className="content-grid">
        <div className="panel">
          <form className="protocol-search" onSubmit={search}>
            <input name="query" placeholder="Search protocol to verify" />
            <button className="button" type="submit">Search</button>
          </form>
          <p className="notice">{status || "Search protocols before changing status."}</p>
          <div className="data-list">
            {protocols.map((protocol) => (
              <button className="data-row text-left" key={protocol.id} onClick={() => setSelected(protocol)} type="button">
                <strong>{protocol.title}</strong>
                <ProtocolStatusBadge status={protocol.implementationStatus} />
                <p className="muted">{protocol.sourceName}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="section-heading">
            <h2>{selected?.title ?? "Select a protocol"}</h2>
            {selected ? <ProtocolStatusBadge status={selected.implementationStatus} /> : null}
          </div>
          <form className="form-grid" onSubmit={update}>
            <label>Status<select name="implementationStatus" defaultValue={selected?.implementationStatus ?? "catalog_only"}><option value="catalog_only">catalog_only</option><option value="draft">draft</option><option value="verified">verified</option><option value="retired">retired</option></select></label>
            <label>Reason<textarea name="reason" required /></label>
            <label>Source name<input name="sourceName" defaultValue={selected?.sourceName ?? ""} /></label>
            <label>Source year<input name="sourceYear" type="number" min="1900" max="2100" defaultValue={selected?.sourceYear ?? ""} /></label>
            <label>Source version<input name="sourceVersion" defaultValue={selected?.sourceVersion ?? ""} /></label>
            <label>Source URL<input name="sourceUrl" /></label>
            <button className="button" disabled={!selected} type="submit">Save verification status</button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
