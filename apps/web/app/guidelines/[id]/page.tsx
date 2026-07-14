"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";

type Section = { id: string; heading: string; orderIndex: number; text?: string | null };
type Chunk = { id: string; heading?: string | null; sectionPath?: string | null; chunkIndex: number; text: string; citationLabel?: string | null };
type Document = { id: string; title: string; organization: string; versionLabel?: string | null; guidelineStatus: string; specialty: string; topic: string; source?: { name?: string; organization?: string }; sections?: Section[]; chunks?: Chunk[] };

export default function GuidelineViewerPage() {
  const params = useParams<{ id: string }>(); const [document, setDocument] = useState<Document | null>(null); const [error, setError] = useState(""); const [query, setQuery] = useState(""); const [index, setIndex] = useState(0);
  useEffect(() => { const token = sessionStorage.getItem("prijClinicToken"); void fetch(`${getApiBaseUrl()}/guidelines/documents/${encodeURIComponent(params.id)}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined }).then(async (response) => { if (!response.ok) throw new Error(); setDocument(await response.json() as Document); }).catch(() => setError("This guideline is unavailable, archived outside your scope, or you do not have permission.")); }, [params.id]);
  const sections = useMemo(() => document?.sections?.length ? document.sections : (document?.chunks ?? []).map((chunk) => ({ id: chunk.id, heading: chunk.heading || chunk.sectionPath || `Section ${chunk.chunkIndex + 1}`, orderIndex: chunk.chunkIndex, text: chunk.text })), [document]);
  const visible = sections.filter((section) => !query.trim() || `${section.heading} ${section.text ?? ""}`.toLowerCase().includes(query.toLowerCase())); const current = sections[index] ?? sections[0];
  if (error) return <AppShell><section className="panel"><p className="empty-state">{error}</p><Link className="button secondary" href="/guidelines">Back to library</Link></section></AppShell>;
  if (!document) return <AppShell><section className="panel"><p className="empty-state">Loading guideline…</p></section></AppShell>;
  return <AppShell><section className="page-header"><div className="header-row"><div><p className="eyebrow">Guideline viewer</p><h1>{document.title}</h1><p className="muted">{document.organization} · {document.versionLabel || "Version not recorded"} · {document.guidelineStatus}</p></div><Link className="button secondary" href="/guidelines">Back to library</Link></div></section><p className="notice">Uploaded and retrieved text is untrusted evidence content. Doctor review is required; it cannot finalize clinical decisions.</p>
    <section className="content-grid guideline-viewer-grid"><aside className="panel compact-panel"><label>Search within<input value={query} onChange={(event) => setQuery(event.target.value)} /></label><nav className="history-category-list" aria-label="Table of contents">{visible.map((section) => <button className={current?.id === section.id ? "active" : ""} key={section.id} type="button" onClick={() => setIndex(sections.findIndex((item) => item.id === section.id))}>{section.heading}</button>)}</nav></aside><article className="panel guideline-section-viewer"><div className="section-heading"><div><h2>{current?.heading || "Indexed content"}</h2><span className="muted">{document.source?.organization || document.source?.name || document.organization} · {document.specialty} · {document.topic}</span></div><span className="badge">Section {Math.min(index + 1, sections.length)} of {sections.length}</span></div><div className="guideline-readable-text" dir="auto">{current?.text || "This section has no extracted text."}</div><div className="form-actions"><button className="button secondary" type="button" disabled={index <= 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>Previous section</button><button className="button secondary" type="button" disabled={index >= sections.length - 1} onClick={() => setIndex((value) => Math.min(sections.length - 1, value + 1))}>Next section</button></div></article></section>
  </AppShell>;
}
