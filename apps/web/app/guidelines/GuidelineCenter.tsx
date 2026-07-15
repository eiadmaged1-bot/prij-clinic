"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../mvp-page";
import { useSession } from "../session";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";

import { getApiBaseUrl } from "@/lib/api-base-url";

type GuidelineCenterProps = {
  view: "home" | "search" | "ask" | "sources" | "upload" | "imports" | "review" | "updates" | "private";
};

type Source = {
  id: string;
  name: string;
  organization: string;
  sourceType: string;
  active: boolean;
};

type Document = {
  id: string;
  title: string;
  organization: string;
  specialty: string;
  topic: string;
  versionLabel?: string;
  guidelineStatus: string;
  licenseStatus: string;
  accessLevel: string;
  downloadsAllowed: boolean;
  fileEncrypted?: boolean;
  fileName?: string;
  fileMimeType?: string;
  lastFileAccess?: { action: string; at: string } | null;
  _count?: { chunks: number };
};

type SearchResult = {
  chunkId: string;
  documentId: string;
  title: string;
  organization: string;
  versionLabel?: string;
  sectionHeading: string;
  snippet: string;
  citationLabel: string;
  accessLevel: string;
  status: string;
  reviewStatus: string;
  publicationDate?: string | null;
  pageStart: number;
  pageEnd?: number;
  citedBullets: string[];
  clinicalSubtopic: string;
  matchReason: string;
};

export function GuidelineCenter({ view }: GuidelineCenterProps) {
  const { user, status } = useSession();
  const canRead = Boolean(user?.permissions.includes("guidelines.read") || user?.permissions.includes("guidelines.search"));
  const canUpload = Boolean(user?.permissions.includes("guidelines.upload"));
  const canImport = Boolean(user?.permissions.includes("guidelines.import"));
  const canReview = Boolean(user?.permissions.includes("guidelines.review"));
  const canManageSources = Boolean(user?.permissions.includes("guidelines.manage_sources"));
  const canManagePrivate = Boolean(user?.roles.includes("Owner") || user?.permissions.includes("guidelines.manage_private"));
  const [sources, setSources] = useState<Source[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Array<{ citationLabel: string; title: string }>>([]);
  const [synthesis, setSynthesis] = useState<{ status: string; agreement: Array<{ bullet: string; documentId: string; page: number }>; differences: string; evidenceGaps: string } | null>(null);
  const [message, setMessage] = useState("Ready");

  useEffect(() => {
    if (!canRead) return;
    void loadBasics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  async function loadBasics() {
    const [sourceBody, documentBody] = await Promise.all([
      apiGet("/guidelines/sources"),
      apiGet("/guidelines/documents")
    ]);
    setSources(sourceBody.sources ?? []);
    setDocuments(documentBody.documents ?? []);
  }

  async function apiGet(path: string) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, { credentials: "include" });
    if (!response.ok) return {};
    return response.json();
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Searching local library");
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({ q: query });
    for (const name of ["organization", "specialty", "year", "region", "status", "sourceKind", "clinicalArea"]) { const value = String(form.get(name) ?? "").trim(); if (value) params.set(name, value); }
    if (form.get("synthesis") === "on") params.set("synthesis", "true");
    const body = await apiGet(`/guidelines/search?${params.toString()}`);
    setResults(body.results ?? []);
    setSynthesis(body.synthesis ?? null);
    setMessage((body.results ?? []).length ? "Results ready" : "No source found in your local library");
  }

  async function submitAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Creating local evidence summary");
    const response = await fetch(`${getApiBaseUrl()}/guidelines/ask`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ question: query })
    });
    const body = response.ok ? await response.json() : { answer: "No source found in your local library.", citations: [] };
    setAnswer(body.answer);
    setCitations(body.citations ?? []);
    setMessage(body.warning ?? "Doctor review required. Evidence summary only.");
  }

  async function openSecureFile(document: Document, action: "view" | "download") {
    setMessage(action === "view" ? "Opening secure viewer" : "Preparing secure download");
    const response = await fetch(`${getApiBaseUrl()}/guidelines/documents/${document.id}/${action}`, {
      credentials: "include"
    });
    if (!response.ok) {
      setMessage(action === "download" ? "Download is not allowed for this document" : "Secure viewer access was denied");
      await loadBasics();
      return;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    if (action === "view") {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } else {
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = document.fileName || `${document.title}.txt`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    }
    setMessage("Access audited");
    await loadBasics();
  }

  async function setDownloadsAllowed(document: Document, downloadsAllowed: boolean) {
    const response = await fetch(`${getApiBaseUrl()}/guidelines/documents/${document.id}/file-access-settings`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ downloadsAllowed })
    });
    setMessage(response.ok ? "Download setting updated and audited" : "Only the owner can change download settings");
    await loadBasics();
  }

  if (status === "loading") return <AppShell><GuidelineShell title="Guideline Center"><Empty text="Loading evidence library" /></GuidelineShell></AppShell>;
  if (!canRead) {
    return (
      <AppShell>
        <GuidelineShell title="Guideline Center">
          <Empty text="Guideline Center is restricted to owner, admin, and doctor roles." />
        </GuidelineShell>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <GuidelineShell title={titleFor(view)} message={message}>
        {view === "home" ? (
          <>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Guidelines</p>
                  <h2>Live Guideline Search</h2>
                </div>
                <span className="badge warning">Evidence only</span>
              </div>
              <form className="guideline-search" onSubmit={submitSearch}>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guidelines..." />
                <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button>
              </form>
            </section>
            {documents.length ? (
              <>
                <DocumentList documents={filterTrainingDocuments(documents).filter((item) => item.guidelineStatus === "ACTIVE")} title="All active guidelines" />
                <DocumentList documents={filterTrainingDocuments(documents).slice(0, 6)} title="Recently indexed" />
                {canManageSources ? <DocumentList documents={documents} title="Owner/Admin inventory — all records" /> : null}
              </>
            ) : (
              <Empty text="No guidelines imported yet. Owner/Admin can import official sources." />
            )}
          </>
        ) : null}
        {view === "search" ? <SearchPanel query={query} setQuery={setQuery} submitSearch={submitSearch} results={results} synthesis={synthesis} /> : null}
        {view === "ask" ? <AskPanel query={query} setQuery={setQuery} submitAsk={submitAsk} answer={answer} citations={citations} /> : null}
        {view === "sources" ? <SourceList sources={sources} canManageSources={canManageSources} /> : null}
        {view === "upload" ? <UploadPanel sources={sources} canUpload={canUpload} /> : null}
        {view === "imports" ? <Empty text={canImport ? "Import job history will appear after uploads or open guideline imports." : "Import tools are restricted."} /> : null}
        {view === "review" ? <DocumentList canReview={canReview} documents={filterTrainingDocuments(documents.filter((item) => item.guidelineStatus === "NEEDS_REVIEW"))} title="Documents needing review" /> : null}
        {view === "updates" ? <Empty text={canImport ? "Possible guideline updates will appear after local update checks." : "Update checks are restricted."} /> : null}
        {view === "private" ? (
          <PrivateVault
            canManagePrivate={canManagePrivate}
            documents={documents.filter((item) => item.accessLevel !== "CLINICAL_TEAM")}
            openSecureFile={openSecureFile}
            setDownloadsAllowed={setDownloadsAllowed}
          />
        ) : null}
      </GuidelineShell>
    </AppShell>
  );
}

function GuidelineShell({ title, message, children }: { title: string; message?: string; children: React.ReactNode }) {
  return (
    <>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Guideline Library</p>
            <h1>{title}</h1>
          </div>
          <span className="badge warning">Evidence summary only</span>
        </div>
        <p className="muted">{message ?? "Doctor review required. No diagnosis, prescription, or record update is created here."}</p>
      </section>
      <nav className="patient-tabs simple" aria-label="Guideline library navigation"><Link href="/guidelines">Library</Link><Link href="/guidelines/search">Search</Link><Link href="/guidelines/review">Review Queue</Link><Link href="/guidelines/upload">Upload</Link></nav>
      {children}
    </>
  );
}

function SearchPanel(props: {
  query: string;
  setQuery: (value: string) => void;
  submitSearch: (event: FormEvent<HTMLFormElement>) => void;
  results: SearchResult[];
  synthesis: { status: string; agreement: Array<{ bullet: string; documentId: string; page: number }>; differences: string; evidenceGaps: string } | null;
}) {
  const groups = props.results.reduce<Record<string, SearchResult[]>>((all, result) => { (all[result.clinicalSubtopic] ??= []).push(result); return all; }, {});
  return (
    <section className="panel">
      <form className="guideline-search guideline-search-sticky" onSubmit={props.submitSearch}>
        <input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search guidelines in English or Arabic (for example PCO or تكيس المبايض)" />
        <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button>
        <details className="filter-drawer"><summary>Filters</summary><div className="guideline-filter-grid"><label>Organization<input name="organization" /></label><label>Specialty<input name="specialty" /></label><label>Year<input name="year" inputMode="numeric" /></label><label>Region<input name="region" /></label><label>Status<select name="status"><option value="">All</option><option value="ACTIVE">Current</option><option value="NEEDS_REVIEW">Needs review</option><option value="SUPERSEDED">Superseded</option><option value="ARCHIVED">Archived</option></select></label><label>Source<select name="sourceKind"><option value="">Official or custom</option><option value="official">Official</option><option value="custom">Custom</option></select></label><label>Clinical area<select name="clinicalArea"><option value="">All areas</option>{["pregnancy", "infertility", "gynecology", "oncology", "medication", "investigation", "procedure"].map((area) => <option key={area} value={area}>{area}</option>)}</select></label><label className="checkbox-row"><input name="synthesis" type="checkbox" />Cited cross-document synthesis</label></div></details>
      </form>
      <p className="muted" aria-label="Search result modes">Result modes: <strong>Sources</strong> | <strong>Evidence synthesis</strong> (doctor review required)</p>
      {props.synthesis ? <article className="notice"><div className="section-heading"><strong>Cross-document synthesis</strong><span className="badge warning">Doctor review required</span></div><h3>Agreement</h3><ul>{props.synthesis.agreement.map((item) => <li key={`${item.documentId}-${item.page}`}>{item.bullet} <Link href={`/guidelines/${item.documentId}?page=${item.page}`}>p. {item.page}</Link></li>)}</ul><h3>Differences</h3><p>{props.synthesis.differences}</p><h3>Evidence gaps</h3><p>{props.synthesis.evidenceGaps}</p></article> : null}
      <div className="data-list">
        {Object.entries(groups).map(([group, results]) => <section className="guideline-result-group" key={group}><h2>{group}</h2>{results.map((result) => (
          <article className="data-row" key={result.chunkId}>
            <div className="data-row-header"><strong>{result.title}</strong><span className="badge">{result.status}</span></div>
            <p>{result.snippet}</p>
            {result.citedBullets.length ? <ul>{result.citedBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            <p className="muted">{result.organization} · {result.versionLabel ?? result.publicationDate?.slice(0, 4) ?? "Version not recorded"} · {result.sectionHeading} · Page {result.pageStart}</p>
            <p className="muted">Why matched: {result.matchReason}</p>
            <div className="form-actions"><Link className="button secondary compact" href={`/guidelines/${result.documentId}?tab=summary`}>Open summary</Link><Link className="button secondary compact" href={`/guidelines/${result.documentId}?page=${result.pageStart}`}>Open exact PDF page</Link></div>
          </article>
        ))}</section>)}
        {!props.results.length ? <Empty text="No matching source found in your local guideline library." /> : null}
      </div>
    </section>
  );
}

function AskPanel(props: {
  query: string;
  setQuery: (value: string) => void;
  submitAsk: (event: FormEvent<HTMLFormElement>) => void;
  answer: string;
  citations: Array<{ citationLabel: string; title: string }>;
}) {
  return (
    <section className="panel">
      <form className="guideline-search" onSubmit={props.submitAsk}>
        <textarea value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Ask from indexed guideline chunks" />
        <button className="button" type="submit"><ThreeDMedicalIcon name="ai" size="sm" />Ask Evidence Library</button>
      </form>
      <article className="evidence-answer">
        <strong>Evidence summary from local library only.</strong>
        <p>{props.answer || "No matching source found in your local guideline library."}</p>
        <p className="muted">Doctor review required. Evidence summary only.</p>
      </article>
      {props.citations.map((citation) => <span className="badge accent" key={citation.citationLabel}>{citation.citationLabel}</span>)}
    </section>
  );
}

function SourceList({ sources, canManageSources }: { sources: Source[]; canManageSources: boolean }) {
  return (
    <section className="panel">
      <div className="section-heading"><h2>Source registry</h2>{canManageSources ? <span className="badge">Owner tools enabled</span> : null}</div>
      <div className="data-list">
        {sources.map((source) => (
          <article className="data-row" key={source.id}>
            <div className="data-row-header"><strong>{source.organization}</strong><span className="badge">{source.sourceType}</span></div>
            <p>{source.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function UploadPanel({ sources, canUpload }: { sources: Source[]; canUpload: boolean }) {
  const [title, setTitle] = useState(""); const [specialty, setSpecialty] = useState(""); const [topic, setTopic] = useState(""); const [version, setVersion] = useState(""); const [sourceId, setSourceId] = useState(""); const [file, setFile] = useState<File | null>(null); const [status, setStatus] = useState(""); const [uploadIntent, setUploadIntent] = useState("");
  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file || !title.trim() || !specialty.trim() || !topic.trim() || !uploadIntent) return setStatus("Intent, title, specialty, topic, and file are required.");
    const form = new FormData(); form.set("file", file); form.set("uploadIntent", uploadIntent); form.set("title", title.trim()); form.set("specialty", specialty.trim()); form.set("topic", topic.trim()); form.set("accessLevel", "OWNER_DOCTOR"); form.set("licenseStatus", "LICENSED_PRIVATE"); if (version.trim()) form.set("versionLabel", version.trim()); if (sourceId) form.set("sourceId", sourceId);
    setStatus("Uploading to protected storage for review");
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/guidelines/upload`, { method: "POST", credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined, body: form });
    if (!response.ok) return setStatus("Upload failed. Check file type, metadata, permissions, or duplicate hash.");
    const body = await response.json(); setStatus("Uploaded and indexed. Governance review is required before publication."); window.location.href = `/guidelines/${body.document.id}`;
  }
  return (
    <section className="panel">
      <div className="section-heading"><h2>Upload licensed PDF or text</h2><span className="badge warning">Private vault</span></div>
      {canUpload ? (
        <form className="form-grid" onSubmit={upload} noValidate>
          <label>Upload intent<select required value={uploadIntent} onChange={(event) => setUploadIntent(event.target.value)}><option value="">Choose explicitly</option><option value="create_new_guideline">Create new guideline</option><option value="create_new_version">Create new version (blocked until version asset storage is configured)</option><option value="restore_archived">Restore archived record (blocked until version asset storage is configured)</option></select></label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Document title" /></label>
          <label>Specialty<input value={specialty} onChange={(event) => setSpecialty(event.target.value)} placeholder="obstetrics or gynecology" /></label>
          <label>Topic<input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" /></label>
          <label>Version<input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="Version label" /></label>
          <label>Source<select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Private licensed upload</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.organization}</option>)}</select></label>
          <label>Access<select><option>Owner and Doctor</option><option>Owner only</option></select></label>
          <label>File<input type="file" accept=".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
          <button className="button" type="submit"><ThreeDMedicalIcon name="files" size="sm" />Upload for review</button>
          {status ? <p className="notice wide">{status}</p> : null}
        </form>
      ) : <Empty text="Upload is restricted to authorized owner or doctor accounts." />}
    </section>
  );
}

function DocumentList({ documents, title, canReview = false }: { documents: Document[]; title: string; canReview?: boolean }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="badge">{documents.length}</span>
      </div>
      <div className="dense-card-list">
        {documents.map((document) => (
          <article className="data-row dense" key={document.id}>
            <div className="data-row-header"><Link href={`/guidelines/${document.id}`}><strong>{document.title}</strong></Link><span className="badge">{document.guidelineStatus}</span></div>
            <p>{document.organization} - {document.specialty} - {document.topic}</p>
            <p className="muted">{document.versionLabel ?? "No version label"} - {document._count?.chunks ?? 0} indexed chunks</p>
            <Link className="button secondary compact" href={`/guidelines/${document.id}`}>Open viewer</Link>
            {canReview ? <GuidelineReviewActions documentId={document.id} /> : null}
          </article>
        ))}
        {!documents.length ? <Empty text={title === "Documents needing review" ? "No documents need review" : "No guideline documents in this view yet."} /> : null}
      </div>
    </section>
  );
}

function GuidelineReviewActions({ documentId }: { documentId: string }) {
  const [reason, setReason] = useState(""); const [status, setStatus] = useState("");
  async function decide(decision: "APPROVED" | "REJECTED" | "ARCHIVED") { if (decision !== "APPROVED" && !reason.trim()) return setStatus("A reason is required."); const token = sessionStorage.getItem("prijClinicToken"); const response = await fetch(`${getApiBaseUrl()}/guidelines/documents/${documentId}/review`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ decision, reason: reason.trim() || undefined }) }); if (!response.ok) return setStatus("Review decision could not be saved."); setStatus("Review decision saved and audited."); window.location.reload(); }
  return <div className="compact-panel"><label>Review note<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for rejection or archive" /></label><div className="form-actions"><button className="button compact" type="button" onClick={() => void decide("APPROVED")}>Approve</button><button className="button secondary compact" type="button" onClick={() => void decide("REJECTED")}>Reject</button><button className="button secondary compact" type="button" onClick={() => void decide("ARCHIVED")}>Archive</button></div>{status ? <p className="muted">{status}</p> : null}</div>;
}

function filterTrainingDocuments(documents: Document[]) {
  return documents.filter((document) => !isTrainingDocument(document));
}

function isTrainingDocument(document: Document) {
  const text = `${document.title} ${document.organization} ${document.topic}`.toLowerCase();
  return document.title.toLowerCase().startsWith("demo") || text.includes("route guideline") || text.includes("local demo") || text.includes("training");
}

function PrivateVault({
  documents,
  canManagePrivate,
  openSecureFile,
  setDownloadsAllowed
}: {
  documents: Document[];
  canManagePrivate: boolean;
  openSecureFile: (document: Document, action: "view" | "download") => Promise<void>;
  setDownloadsAllowed: (document: Document, downloadsAllowed: boolean) => Promise<void>;
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Private vault</h2>
        <span className="badge warning">Access audited</span>
      </div>
      <div className="data-list">
        {documents.map((document) => (
          <article className="data-row" key={document.id}>
            <div className="data-row-header">
              <strong>{document.title}</strong>
              <span className="badge">{document.guidelineStatus}</span>
            </div>
            <p>{document.organization} - {document.specialty} - {document.topic}</p>
            <div className="guideline-meta-grid">
              <span><strong>Access level</strong>{friendlyAccess(document.accessLevel)}</span>
              <span><strong>License status</strong>{friendlyLicense(document.licenseStatus)}</span>
              <span><strong>Storage</strong>{document.fileEncrypted ? "Encrypted locally" : "Protected storage"}</span>
              <span><strong>Last access</strong>{lastAccessText(document.lastFileAccess)}</span>
            </div>
            <div className="guideline-file-actions">
              <button className="button" type="button" onClick={() => void openSecureFile(document, "view")}>
                <ThreeDMedicalIcon name="files" size="sm" />Open secure viewer
              </button>
              {document.downloadsAllowed ? (
                <button className="button secondary" type="button" onClick={() => void openSecureFile(document, "download")}>
                  <ThreeDMedicalIcon name="reports" size="sm" />Download
                </button>
              ) : (
                <span className="badge warning">Downloads disabled by owner</span>
              )}
              {canManagePrivate ? (
                <label className="toggle-line">
                  <input
                    checked={document.downloadsAllowed}
                    onChange={(event) => void setDownloadsAllowed(document, event.target.checked)}
                    type="checkbox"
                  />
                  Allow downloads
                </label>
              ) : null}
            </div>
            <p className="muted">Private file access is checked by the server and recorded in the audit log.</p>
          </article>
        ))}
        {!documents.length ? <Empty text="No private guideline documents in this vault yet." /> : null}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="empty-state"><ThreeDMedicalIcon name="files" size="sm" tone="slate" /><span>{text}</span></p>;
}

function titleFor(view: GuidelineCenterProps["view"]) {
  const titles = {
    home: "Browse Guidelines",
    search: "Search All Guidelines",
    ask: "Ask Evidence Library",
    sources: "Sources Registry",
    upload: "Upload Licensed PDF",
    imports: "Import Jobs",
    review: "Review Queue",
    updates: "Possible Updates",
    private: "Private Vault"
  };
  return titles[view];
}

function friendlyAccess(value: string) {
  if (value === "OWNER_ONLY") return "Owner only";
  if (value === "OWNER_DOCTOR") return "Owner and doctors";
  if (value === "CLINICAL_TEAM") return "Clinical team";
  return "Restricted";
}

function friendlyLicense(value: string) {
  if (value === "LICENSED_PRIVATE") return "Licensed private";
  if (value === "OPEN") return "Open";
  if (value === "CHECK_REQUIRED") return "License check required";
  if (value === "LOGIN_REQUIRED") return "Login required";
  if (value === "LINK_ONLY") return "Link only";
  if (value === "DO_NOT_IMPORT") return "Do not import";
  return "Restricted";
}

function lastAccessText(value?: { action: string; at: string } | null) {
  if (!value) return "No file access yet";
  const label = value.action === "downloaded" ? "Downloaded" : "Viewed";
  return `${label} ${new Date(value.at).toLocaleString()}`;
}
