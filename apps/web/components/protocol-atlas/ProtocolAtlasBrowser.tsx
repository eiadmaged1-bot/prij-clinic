"use client";

import { useEffect, useState } from "react";
import { searchProtocols, ProtocolSummary } from "../../lib/protocol-atlas";
import { ProtocolGroupGrid } from "./ProtocolGroupGrid";
import { ProtocolSearchBox } from "./ProtocolSearchBox";
import { ProtocolStatusBadge } from "./ProtocolStatusBadge";

export function ProtocolAtlasBrowser() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [protocols, setProtocols] = useState<ProtocolSummary[]>([]);
  const [status, setStatus] = useState("Loading catalog");

  useEffect(() => {
    void load("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(nextQuery = query, nextGroup = group) {
    setStatus("Loading catalog");
    try {
      const data = await searchProtocols({ query: nextQuery, group: nextGroup });
      setProtocols(data.protocols);
      setStatus(data.protocols.length ? "Ready" : "No matching protocol found");
    } catch {
      setProtocols([]);
      setStatus("Clinical protocol catalog is unavailable");
    }
  }

  function selectGroup(nextGroup: string) {
    setGroup(nextGroup);
    void load(query, nextGroup);
  }

  function submitQuery(nextQuery: string) {
    setQuery(nextQuery);
    void load(nextQuery, group);
  }

  return (
    <section className="protocol-atlas">
      <ProtocolSearchBox query={query} onQuery={submitQuery} />
      <ProtocolGroupGrid onSelect={selectGroup} />
      <div className="section-heading">
        <div>
          <h2>Protocol matches</h2>
          <p className="muted">{group || "All groups"} - {status}</p>
        </div>
        <span className="badge">{protocols.length} shown</span>
      </div>
      <div className="protocol-card-grid">
        {protocols.map((protocol) => (
          <article className="protocol-card" key={protocol.id}>
            <div className="data-row-header">
              <strong>{protocol.title}</strong>
              <ProtocolStatusBadge status={protocol.implementationStatus} />
            </div>
            <p className="muted">{protocol.specialtyGroup}</p>
            <p className="muted">{aliases(protocol.aliases)}</p>
            <dl className="profile-grid">
              <div><dt>Source</dt><dd>{protocol.sourceName}</dd></div>
              <div><dt>Risk</dt><dd>{protocol.riskLevel}</dd></div>
            </dl>
            {protocol.implementationStatus === "verified" ? (
              <p className="notice">Verified management snapshot available for doctor review.</p>
            ) : (
              <p className="notice">Catalog only. No management options are generated.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function aliases(value: unknown) {
  return Array.isArray(value) ? value.slice(0, 3).join(", ") : "Aliases not listed";
}
