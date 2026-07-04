"use client";

import { useEffect, useState } from "react";
import { searchProtocols, ProtocolSummary } from "../../lib/protocol-atlas";
import { ProtocolGroupGrid } from "./ProtocolGroupGrid";
import { ProtocolSearchBox } from "./ProtocolSearchBox";
import { ProtocolStatusBadge } from "./ProtocolStatusBadge";

export function ProtocolAtlasBrowser() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [view, setView] = useState<"cards" | "list">("list");
  const [protocols, setProtocols] = useState<ProtocolSummary[]>([]);
  const [status, setStatus] = useState("Loading catalog");

  useEffect(() => {
    void load({ nextQuery: "", nextGroup: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(input: { nextQuery?: string; nextGroup?: string; nextStatus?: string; nextRisk?: string; nextVerifiedOnly?: boolean } = {}) {
    const nextQuery = input.nextQuery ?? query;
    const nextGroup = input.nextGroup ?? group;
    const nextStatus = input.nextStatus ?? statusFilter;
    const nextRisk = input.nextRisk ?? riskFilter;
    const nextVerifiedOnly = input.nextVerifiedOnly ?? verifiedOnly;
    setStatus("Loading catalog");
    try {
      const data = await searchProtocols({ query: nextQuery, group: nextGroup, status: nextStatus || undefined, riskLevel: nextRisk || undefined, verifiedOnly: nextVerifiedOnly });
      setProtocols(data.protocols);
      setStatus(data.protocols.length ? "Ready" : "No matching protocol found");
    } catch {
      setProtocols([]);
      setStatus("Clinical protocol catalog is unavailable");
    }
  }

  function selectGroup(nextGroup: string) {
    setGroup(nextGroup);
    void load({ nextGroup });
  }

  function submitQuery(nextQuery: string) {
    setQuery(nextQuery);
    void load({ nextQuery });
  }

  function applyFilters(nextStatus = statusFilter, nextRisk = riskFilter, nextVerifiedOnly = verifiedOnly) {
    setStatusFilter(nextStatus);
    setRiskFilter(nextRisk);
    setVerifiedOnly(nextVerifiedOnly);
    void load({ nextStatus, nextRisk, nextVerifiedOnly });
  }

  const counts = protocols.reduce(
    (current, protocol) => {
      current.total += 1;
      if (protocol.implementationStatus === "verified") current.verified += 1;
      if (protocol.implementationStatus === "draft") current.draft += 1;
      if (protocol.implementationStatus === "catalog_only") current.catalogOnly += 1;
      if (protocol.implementationStatus === "retired") current.retired += 1;
      return current;
    },
    { total: 0, verified: 0, draft: 0, catalogOnly: 0, retired: 0 }
  );

  return (
    <section className="protocol-atlas">
      <ProtocolSearchBox query={query} onQuery={submitQuery} />
      <div className="filter-row">
        <label>Status<select value={statusFilter} onChange={(event) => applyFilters(event.target.value, riskFilter, false)}><option value="">Active statuses</option><option value="verified">Verified</option><option value="draft">Draft</option><option value="catalog_only">Catalog only</option><option value="retired">Retired</option></select></label>
        <label>Risk<select value={riskFilter} onChange={(event) => applyFilters(statusFilter, event.target.value, verifiedOnly)}><option value="">All risk levels</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option></select></label>
        <label className="toggle-row"><input checked={verifiedOnly} onChange={(event) => applyFilters("", riskFilter, event.target.checked)} type="checkbox" /> Verified only</label>
      </div>
      <ProtocolGroupGrid onSelect={selectGroup} />
      <div className="section-heading">
        <div>
          <h2>Protocol matches</h2>
          <p className="muted">{group || "All groups"} - {status}</p>
        </div>
        <span className="badge">{counts.total} total</span>
      </div>
      <div className="status-count-row">
        <span className="badge">Verified {counts.verified}</span>
        <span className="badge">Draft {counts.draft}</span>
        <span className="badge">Catalog-only {counts.catalogOnly}</span>
        <span className="badge">Retired {counts.retired}</span>
        <button className={`button secondary compact ${view === "cards" ? "active" : ""}`} type="button" onClick={() => setView("cards")}>Cards</button>
        <button className={`button secondary compact ${view === "list" ? "active" : ""}`} type="button" onClick={() => setView("list")}>Compact list</button>
      </div>
      <div className={view === "cards" ? "protocol-card-grid compact-protocol-grid" : "dense-card-list"}>
        {protocols.map((protocol) => (
          <article className={view === "cards" ? "protocol-card compact-panel" : "data-row dense"} key={protocol.id}>
            <div className="data-row-header">
              <strong>{protocol.title}</strong>
              <ProtocolStatusBadge status={protocol.implementationStatus} />
            </div>
            <p className="muted protocol-row-meta">{protocol.specialtyGroup} | {protocol.riskLevel}</p>
            <dl className="profile-grid">
              <div><dt>Source</dt><dd>{shortSource(protocol.sourceName)}</dd></div>
              <div><dt>Risk</dt><dd>{protocol.riskLevel}</dd></div>
            </dl>
            <details className="collapsible-help-panel protocol-details">
              <summary>Open details</summary>
              <p className="muted">Aliases: {aliases(protocol.aliases)}</p>
              <p className="muted">{protocol.implementationStatus === "verified" ? "Verified snapshot available for doctor review." : "Listed in the atlas, but management snapshot is not verified yet. Catalog-only and draft protocols do not generate management."}</p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

function aliases(value: unknown) {
  return Array.isArray(value) ? value.slice(0, 3).join(", ") : "Aliases not listed";
}

function shortSource(value?: string | null) {
  if (!value) return "Source tracked";
  return value.length > 28 ? `${value.slice(0, 28)}...` : value;
}
