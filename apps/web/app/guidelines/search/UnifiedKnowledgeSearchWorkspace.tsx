"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

type GuidelineResult = {
  chunkId: string;
  documentId: string;
  title: string;
  organization: string;
  versionLabel?: string | null;
  sectionHeading: string;
  snippet: string;
  citationLabel: string;
  status: string;
  reviewStatus: string;
  pageStart: number | null;
  pageEnd?: number | null;
  originalUrl?: string | null;
  hasAsset?: boolean;
  citedBullets: string[];
  clinicalSubtopic: string;
  matchReason: string;
};

type ProtocolResult = {
  id: string;
  code: string;
  title: string;
  specialtyGroup: string;
  condition: string;
  clinicalArea?: string | null;
  riskLevel: string;
  implementationStatus: string;
  publicationState: string;
  sourceName: string;
  sourceYear?: number | null;
  sourceVersion?: string | null;
  sourceIdentifier?: string | null;
  verified: boolean;
  citations: Array<{ label: string; page: number | null }>;
  aliases: string[];
  link: string;
};

type SearchResponse = {
  query: string;
  guidelineResults: GuidelineResult[];
  protocolResults: ProtocolResult[];
  noSourceFound: boolean;
  doctorReviewRequired: boolean;
};

const emptyResults: SearchResponse = {
  query: "",
  guidelineResults: [],
  protocolResults: [],
  noSourceFound: false,
  doctorReviewRequired: true
};

export function UnifiedKnowledgeSearchWorkspace() {
  const searchParams = useSearchParams();
  const { user, status } = useSession();
  const canSearch = Boolean(user?.permissions.includes("guidelines.search"));
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResponse>(emptyResults);
  const [message, setMessage] = useState("Search approved guideline evidence and reviewed protocols together.");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const initial = searchParams.get("q")?.trim() ?? "";
    if (status === "authenticated" && canSearch && initial.length >= 2) {
      void runSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, canSearch, searchParams]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(query);
  }

  async function runSearch(value: string) {
    const cleaned = value.trim();
    if (cleaned.length < 2) {
      setMessage("Enter at least two characters.");
      return;
    }

    setSearching(true);
    setMessage("Searching approved evidence and reviewed protocols…");
    const response = await apiRequest(`/guidelines/knowledge-search?q=${encodeURIComponent(cleaned)}&limit=12`);
    setSearching(false);

    if (!response.ok) {
      setResults(emptyResults);
      setMessage(await responseMessage(response));
      return;
    }

    const body = await response.json() as SearchResponse;
    setResults(body);
    setMessage(body.noSourceFound
      ? "No supporting source was found in the approved guideline library or reviewed protocol catalogue."
      : `${body.guidelineResults.length} guideline evidence matches and ${body.protocolResults.length} reviewed protocol matches.`);
    window.history.replaceState(null, "", `/guidelines/search?q=${encodeURIComponent(cleaned)}`);
  }

  if (status === "loading") {
    return <AppShell><section className="panel empty-state">Loading clinical knowledge search…</section></AppShell>;
  }

  if (!canSearch) {
    return <AppShell><section className="panel"><p className="empty-state">Clinical knowledge search is restricted to authorized roles.</p><Link className="button secondary" href="/guidelines">Back to Guidelines</Link></section></AppShell>;
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Guidelines &amp; Protocols</p>
            <h1>Unified clinical knowledge search</h1>
            <p className="muted">Search approved local source text and reviewed protocols in one workflow.</p>
          </div>
          <Link className="button secondary" href="/guidelines">Back to library</Link>
        </div>
      </section>

      <section className="panel compact-panel">
        <form className="guideline-search guideline-search-sticky" onSubmit={submit}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a condition, investigation, procedure, or clinical question" />
          <button className="button" type="submit" disabled={searching}>{searching ? "Searching…" : "Search"}</button>
        </form>
        <p className="notice" role="status">{message}</p>
        <p className="muted">Search results are navigation and evidence aids only. Protocol application and clinical decisions remain separate Doctor-reviewed actions.</p>
      </section>

      <section className="knowledge-metric-grid" aria-label="Knowledge search result counts">
        <article><strong>{results.guidelineResults.length}</strong><span>Guideline evidence</span></article>
        <article><strong>{results.protocolResults.length}</strong><span>Reviewed protocols</span></article>
        <article><strong>{results.guidelineResults.filter((result) => result.pageStart !== null).length}</strong><span>Page-linked sources</span></article>
      </section>

      <div className="guideline-unified-results">
        <section className="panel">
          <div className="section-heading">
            <div><p className="eyebrow">Approved local evidence</p><h2>Guideline matches</h2></div>
            <span className="badge">{results.guidelineResults.length}</span>
          </div>

          <div className="data-list">
            {results.guidelineResults.map((result) => (
              <article className="data-row" key={result.chunkId}>
                <div className="data-row-header">
                  <strong>{result.title}</strong>
                  <span className={`badge ${result.status === "ACTIVE" ? "accent" : "warning"}`}>{result.status}</span>
                </div>
                <p>{result.snippet}</p>
                {result.citedBullets.length ? <ul>{result.citedBullets.slice(0, 3).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                <p className="muted">{result.organization} · {result.versionLabel || "Version not recorded"} · {result.sectionHeading}{result.pageStart ? ` · Page ${result.pageStart}` : ""}</p>
                <p className="muted">Why matched: {result.matchReason}</p>
                <div className="form-actions">
                  <Link className="button secondary compact" href={`/guidelines/${result.documentId}?tab=summary`}>Open guideline</Link>
                  {result.pageStart ? <Link className="button secondary compact" href={`/guidelines/${result.documentId}?page=${result.pageStart}`}>Open cited page</Link> : null}
                  {!result.hasAsset && result.originalUrl ? <a className="button secondary compact" href={result.originalUrl} target="_blank" rel="noreferrer">Open official source</a> : null}
                </div>
              </article>
            ))}
            {!results.guidelineResults.length ? <p className="empty-state compact">No approved guideline evidence matched this search.</p> : null}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div><p className="eyebrow">Reviewed pathways</p><h2>Protocol matches</h2></div>
            <span className="badge">{results.protocolResults.length}</span>
          </div>

          <div className="data-list">
            {results.protocolResults.map((protocol) => (
              <article className="data-row" key={protocol.id}>
                <div className="data-row-header">
                  <strong>{protocol.title}</strong>
                  <span className="badge accent">Reviewed</span>
                </div>
                <p>{protocol.condition}</p>
                <p className="muted">{protocol.specialtyGroup} · Risk: {protocol.riskLevel} · {protocol.sourceName}{protocol.sourceYear ? ` ${protocol.sourceYear}` : ""}</p>
                {protocol.aliases.length ? <p className="muted">Aliases: {protocol.aliases.join(", ")}</p> : null}
                {protocol.citations.length ? (
                  <ul>{protocol.citations.map((citation) => <li key={`${protocol.id}-${citation.label}-${citation.page ?? "none"}`}>{citation.label}{citation.page ? ` · p. ${citation.page}` : ""}</li>)}</ul>
                ) : <p className="warning-text">No structured page citation is attached to this protocol result. Verify the linked source before use.</p>}
                <div className="form-actions">
                  <Link className="button secondary compact" href={protocol.link}>Open protocol</Link>
                  {protocol.sourceIdentifier ? <Link className="button secondary compact" href={`/guidelines/${encodeURIComponent(protocol.sourceIdentifier)}`}>Open linked source</Link> : null}
                </div>
              </article>
            ))}
            {!results.protocolResults.length ? <p className="empty-state compact">No reviewed protocol matched this search.</p> : null}
          </div>
        </section>
      </div>

      {results.noSourceFound ? (
        <section className="panel">
          <p className="empty-state">No supporting source was found in the approved guideline library or reviewed protocol catalogue. The system will not invent an answer.</p>
        </section>
      ) : null}
    </AppShell>
  );
}

async function apiRequest(path: string) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    headers: token ? { authorization: `Bearer ${token}` } : undefined
  }).catch(() => new Response(null, { status: 503 }));
}

async function responseMessage(response: Response) {
  const body = await response.json().catch(() => ({})) as { message?: string | string[]; error?: { message?: string } };
  if (body.error?.message) return body.error.message;
  if (Array.isArray(body.message)) return body.message[0] ?? "Search failed.";
  return body.message ?? "Clinical knowledge search is unavailable.";
}
