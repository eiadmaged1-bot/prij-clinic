"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "../../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";

type Section = { id: string; heading: string; orderIndex: number; text?: string | null; pageStart?: number | null; pageEnd?: number | null };
type Chunk = { id: string; heading?: string | null; sectionPath?: string | null; chunkIndex: number; text: string; citationLabel?: string | null; pageStart?: number | null; pageEnd?: number | null };
type SummaryCitation = { id: string; bulletIndex: number; pageStart: number; pageEnd?: number | null; citationType: string; label: string };
type SummarySection = { id: string; heading: string; sectionType: string; bulletsJson: string[]; citations: SummaryCitation[] };
type GuidelineSummary = { id: string; status: string; provenanceType: string; reviewReason?: string | null; sections: SummarySection[]; reviewedBy?: { displayName: string } | null };
type Document = { id: string; title: string; organization: string; versionLabel?: string | null; guidelineStatus: string; reviewStatus: string; specialty: string; topic: string; pageCount?: number | null; fileMimeType?: string | null; downloadsAllowed?: boolean; source?: { name?: string; organization?: string }; sections?: Section[]; chunks?: Chunk[]; summaries?: GuidelineSummary[] };
type MobileTab = "PDF" | "Clinical Summary" | "Sections" | "Sources";

export default function GuidelineViewerPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState<"width" | "page" | "custom">("width");
  const [renderFailed, setRenderFailed] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("PDF");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const controller = new AbortController();
    void fetch(`${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}`, { credentials: "include", signal: controller.signal, headers: token ? { authorization: `Bearer ${token}` } : undefined })
      .then(async (response) => { if (!response.ok) throw new Error(); setDocument(await response.json() as Document); })
      .catch((loadError) => { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("This guideline is unavailable, archived outside your scope, or you do not have permission."); });
    return () => controller.abort();
  }, [params.id]);

  useEffect(() => {
    const requested = Number(searchParams.get("page"));
    const remembered = requested > 0 ? requested : Number(localStorage.getItem(`guideline:last-page:${params.id}`));
    if (Number.isInteger(remembered) && remembered > 0) setPage(remembered);
    if (searchParams.get("tab") === "summary") setMobileTab("Clinical Summary");
  }, [params.id, searchParams]);

  useEffect(() => { localStorage.setItem(`guideline:last-page:${params.id}`, String(page)); }, [page, params.id]);

  useEffect(() => {
    if (!document || document.fileMimeType !== "application/pdf" || pdfLoaded || renderFailed) return;
    const timeout = window.setTimeout(() => setRenderFailed(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [document, pdfLoaded, renderAttempt, renderFailed]);

  const sections = useMemo(() => document?.sections?.length ? document.sections : (document?.chunks ?? []).map((chunk) => ({ id: chunk.id, heading: chunk.heading || chunk.sectionPath || `Section ${chunk.chunkIndex + 1}`, orderIndex: chunk.chunkIndex, text: chunk.text, pageStart: chunk.pageStart, pageEnd: chunk.pageEnd })), [document]);
  const pageCount = useMemo(() => document?.pageCount && document.pageCount > 0 ? document.pageCount : null, [document?.pageCount]);
  const matches = useMemo(() => query.trim() ? sections.filter((section) => `${section.heading} ${section.text ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) : [], [query, sections]);
  const summary = useMemo(() => document?.summaries?.find((item) => item.status === "CLINIC_APPROVED") ?? document?.summaries?.[0] ?? null, [document]);
  const pdfUrl = `${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}/view#page=${page}&zoom=${fit === "width" ? "page-width" : fit === "page" ? "page-fit" : zoom}`;
  const isPdf = document?.fileMimeType === "application/pdf";

  function goToPage(next: number) { setPage(pageCount ? Math.min(pageCount, Math.max(1, next)) : Math.max(1, next)); }
  function goToMatch(direction: -1 | 1) {
    if (!matches.length) return;
    const next = (matchIndex + direction + matches.length) % matches.length;
    setMatchIndex(next); goToPage(matches[next]?.pageStart ?? 1);
  }
  function swipeEnd(x: number) {
    if (touchStart === null) return;
    if (x - touchStart > 55) goToPage(page - 1);
    if (touchStart - x > 55) goToPage(page + 1);
    setTouchStart(null);
  }

  if (error) return <AppShell><section className="panel"><p className="empty-state">{error}</p><Link className="button secondary" href="/guidelines">Back to library</Link></section></AppShell>;
  if (!document) return <AppShell><section className="panel"><p className="empty-state">Loading guideline…</p></section></AppShell>;

  return <AppShell>
    <section className="page-header compact-guideline-header"><div className="header-row"><div><p className="eyebrow">Authoritative document viewer</p><h1>{document.title}</h1><p className="muted">{document.organization} · {document.versionLabel || "Version not recorded"} · {document.guidelineStatus}</p></div><Link className="button secondary" href="/guidelines">Back to library</Link></div></section>
    <p className="notice">The original PDF is authoritative. Extracted text and summaries are navigation aids only. Doctor review is required; this viewer cannot finalize clinical decisions.</p>
    <nav className="guideline-mobile-tabs" aria-label="Guideline mobile views">{(["PDF", "Clinical Summary", "Sections", "Sources"] as MobileTab[]).map((tab) => <button className={mobileTab === tab ? "active" : ""} key={tab} type="button" onClick={() => setMobileTab(tab)}>{tab}</button>)}</nav>
    <section className="guideline-pdf-workspace" ref={viewerRef}>
      <aside className={`panel guideline-thumbnails ${mobileTab === "Sections" ? "mobile-active" : ""}`}>
        <label>Search original text<input value={query} onChange={(event) => { setQuery(event.target.value); setMatchIndex(0); }} /></label>
        <div className="guideline-search-nav"><button type="button" disabled={!matches.length} onClick={() => goToMatch(-1)}>Previous match</button><span>{matches.length ? `${matchIndex + 1}/${matches.length}` : "0 matches"}</span><button type="button" disabled={!matches.length} onClick={() => goToMatch(1)}>Next match</button></div>
        <details open><summary>Table of contents</summary><nav className="history-category-list">{sections.map((section) => <button className={page >= (section.pageStart ?? 1) && page <= (section.pageEnd ?? section.pageStart ?? 1) ? "active" : ""} key={section.id} type="button" onClick={() => { goToPage(section.pageStart ?? 1); setMobileTab("PDF"); }}>{section.heading}<small>Page {section.pageStart ?? "—"}</small></button>)}</nav></details>
        <details><summary>Page thumbnails</summary><div className="pdf-thumbnail-list">{pageCount ? Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button className={page === number ? "active" : ""} key={number} type="button" onClick={() => goToPage(number)}><span className="pdf-thumbnail-placeholder">PDF</span>Page {number}</button>) : <p className="muted">Page metadata is loading.</p>}</div></details>
      </aside>
      <main className={`panel guideline-pdf-stage ${mobileTab === "PDF" ? "mobile-active" : ""}`} onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => swipeEnd(event.changedTouches[0]?.clientX ?? 0)}>
        <div className="pdf-toolbar" aria-label="PDF controls">
          <button type="button" aria-label="Previous page" onClick={() => goToPage(page - 1)} disabled={page <= 1}>‹</button><label>Page<input inputMode="numeric" value={page} onChange={(event) => goToPage(Number(event.target.value) || 1)} /></label><span>/ {pageCount ?? "…"}</span><button type="button" aria-label="Next page" onClick={() => goToPage(page + 1)} disabled={!pageCount || page >= pageCount}>›</button>
          <button type="button" onClick={() => { setFit("custom"); setZoom((value) => Math.max(50, value - 10)); }}>−</button><span>{zoom}%</span><button type="button" onClick={() => { setFit("custom"); setZoom((value) => Math.min(200, value + 10)); }}>+</button><details className="pdf-more-menu"><summary>⋯</summary><button type="button" onClick={() => { setFit("width"); setZoom(100); }}>Fit width</button><button type="button" onClick={() => { setFit("page"); setZoom(100); }}>Fit page</button><button type="button" onClick={() => setRotation((value) => (value + 90) % 360)}>Rotate</button><button type="button" onClick={() => void viewerRef.current?.requestFullscreen()}>Full screen</button><button type="button" onClick={() => window.open(`${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}/view`, "_blank", "noopener,noreferrer")}>Open original</button></details>
        </div>
        {isPdf && !renderFailed ? <div className="native-pdf-frame" style={{ transform: `rotate(${rotation}deg)` }}>{!pdfLoaded ? <p className="empty-state">Loading authoritative PDF…</p> : null}<object data={pdfUrl} key={`${renderAttempt}-${page}-${fit}-${zoom}`} onLoad={() => setPdfLoaded(true)} type="application/pdf" aria-label={`Original PDF: ${document.title}`}><div className="notice"><p>This browser cannot embed the authoritative PDF.</p><button className="button secondary compact" type="button" onClick={() => window.open(`${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}/view#page=${page}`, "_blank", "noopener,noreferrer")}>Open original</button></div></object></div> : <GuidelinePageFallback page={page} sections={sections} />}
        {!isPdf ? <p className="warning-text">No original PDF is attached to this record. Showing preserved extracted source text.</p> : null}
        {renderFailed ? <div className="notice"><p>PDF rendering failed. A safe page-text fallback is shown.</p><button className="button secondary compact" type="button" onClick={() => { setRenderFailed(false); setPdfLoaded(false); setRenderAttempt((value) => value + 1); }}>Retry PDF</button></div> : null}
      </main>
      <aside className={`panel guideline-summary-citations ${mobileTab === "Clinical Summary" || mobileTab === "Sources" ? "mobile-active" : ""}`}>
        {mobileTab === "Sources" ? <><h2>Sources</h2><p>{document.source?.organization || document.source?.name || document.organization}</p><p>{document.specialty} · {document.topic}</p><p>Status: {humanReviewStatus(document.reviewStatus)}</p><button className="button secondary compact" type="button" onClick={() => window.open(`${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}/view#page=${page}`, "_blank", "noopener,noreferrer")}>Open the same authoritative PDF</button></> : <><div className="section-heading"><h2>Clinical Summary</h2><span className={`badge ${summary?.status === "CLINIC_APPROVED" ? "" : "warning"}`}>{humanSummaryStatus(summary?.status)}</span></div>{summary ? <><p className="muted">Provenance: {summary.provenanceType.replaceAll("_", " ")}. {summary.status === "CLINIC_APPROVED" ? `Reviewed by ${summary.reviewedBy?.displayName ?? "authorized doctor"}.` : "Doctor review required; not approved for clinical reliance."}</p><div className="guideline-structured-summary">{summary.sections.map((section) => <details key={section.id} open={section.sectionType === "AT_A_GLANCE"}><summary>{section.heading}</summary><ul>{section.bulletsJson.map((bullet, bulletIndex) => <li key={`${section.id}-${bulletIndex}`}>{bullet}<span className="summary-citations">{section.citations.filter((citation) => citation.bulletIndex === bulletIndex).map((citation) => <button key={citation.id} type="button" title={citation.citationType.replaceAll("_", " ")} onClick={() => { goToPage(citation.pageStart); setMobileTab("PDF"); }}>p. {citation.pageStart}{citation.pageEnd && citation.pageEnd !== citation.pageStart ? `–${citation.pageEnd}` : ""}</button>)}</span></li>)}</ul></details>)}</div></> : <p className="muted">No clinic-approved structured summary is published for this document yet. Read the authoritative PDF and cited source sections.</p>}</>}
        <details className="summary-provenance-legend"><summary>Recommendation provenance</summary><ul><li>Direct guideline recommendation</li><li>Background information</li><li>Local clinic note</li><li>AI-generated draft</li><li>Doctor annotation</li></ul></details>
        <div className="form-actions"><button type="button" onClick={() => window.open(`${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}/view`, "_blank", "noopener,noreferrer")}>Print / open original</button>{document.downloadsAllowed ? <a className="button secondary" href={`${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}/download`}>Download</a> : null}</div>
      </aside>
    </section>
  </AppShell>;
}

function GuidelinePageFallback({ page, sections }: { page: number; sections: Section[] }) {
  const content = sections.filter((section) => page >= (section.pageStart ?? 1) && page <= (section.pageEnd ?? section.pageStart ?? 1));
  return <article className="guideline-page-fallback" aria-label={`Extracted fallback for page ${page}`}><span className="badge">Page {page} fallback</span>{content.length ? content.map((section) => <section key={section.id}><h2>{section.heading}</h2><div className="guideline-readable-text" dir="auto">{section.text || "No extracted text for this section."}</div></section>) : <p>No extracted page text is available. Use the authoritative original file when permitted.</p>}</article>;
}

function humanSummaryStatus(value?: string) { if (value === "CLINIC_APPROVED") return "Approved"; if (value === "SOURCE_INCOMPLETE") return "Source incomplete"; return "Summary pending review"; }
function humanReviewStatus(value: string) { if (/approved/i.test(value)) return "Approved"; if (/incomplete/i.test(value)) return "Source incomplete"; return "Summary pending review"; }
