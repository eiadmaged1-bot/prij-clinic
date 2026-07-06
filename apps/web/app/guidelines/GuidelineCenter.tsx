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
  title: string;
  organization: string;
  versionLabel?: string;
  sectionHeading: string;
  snippet: string;
  citationLabel: string;
  accessLevel: string;
};

export function GuidelineCenter({ view }: GuidelineCenterProps) {
  const { user, status, token } = useSession();
  const canRead = Boolean(user?.permissions.includes("guidelines.read") || user?.permissions.includes("guidelines.search"));
  const canUpload = Boolean(user?.permissions.includes("guidelines.upload"));
  const canImport = Boolean(user?.permissions.includes("guidelines.import"));
  const canReview = Boolean(user?.permissions.includes("guidelines.review"));
  const canManageSources = Boolean(user?.permissions.includes("guidelines.manage_sources"));
  const canManagePrivate = Boolean(user?.roles.includes("Owner") || user?.permissions.includes("guidelines.manage_private"));
  const isOwnerAdmin = Boolean(user?.roles.includes("Owner") || user?.roles.includes("Admin"));
  const [sources, setSources] = useState<Source[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Array<{ citationLabel: string; title: string }>>([]);
  const [message, setMessage] = useState("Ready");

  useEffect(() => {
    if (!token || !canRead) return;
    void loadBasics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canRead]);

  async function loadBasics() {
    const [sourceBody, documentBody] = await Promise.all([
      apiGet("/guidelines/sources"),
      apiGet("/guidelines/documents")
    ]);
    setSources(sourceBody.sources ?? []);
    setDocuments(documentBody.documents ?? []);
  }

  async function apiGet(path: string) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, { headers: token ? { authorization: `Bearer ${token}` } : undefined });
    if (!response.ok) return {};
    return response.json();
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Searching local library");
    const body = await apiGet(`/guidelines/search?q=${encodeURIComponent(query)}`);
    setResults(body.results ?? []);
    setMessage((body.results ?? []).length ? "Results ready" : "No source found in your local library");
  }

  async function submitAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Creating local evidence summary");
    const response = await fetch(`${getApiBaseUrl()}/guidelines/ask`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
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
      headers: token ? { authorization: `Bearer ${token}` } : undefined
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
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
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
                  <h2>Search Guidelines</h2>
                </div>
                <span className="badge warning">Evidence only</span>
              </div>
              <form className="guideline-search" onSubmit={submitSearch}>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guidelines..." />
                <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button>
              </form>
              <div className="form-actions">
                <Link className="button secondary compact" href="/guidelines/search">Browse</Link>
                <Link className="button secondary compact" href="/guidelines/ask">Ask Evidence Library</Link>
                <Link className="button secondary compact" href="/guidelines">Recent</Link>
              </div>
            </section>
            <section className="guideline-actions">
              {cards({ canUpload, canImport, canReview, isOwnerAdmin }).map((card) => (
                <Link className="guideline-card" href={card.href} key={card.href}>
                  <ThreeDMedicalIcon name={card.icon} size="md" tone="navy" />
                  <strong>{card.title}</strong>
                  <span>{card.copy}</span>
                </Link>
              ))}
            </section>
            {documents.length ? (
              <DocumentList documents={filterTrainingDocuments(documents).slice(0, 6)} title="Recently indexed documents" />
            ) : (
              <Empty text="No guidelines imported yet. Owner/Admin can import official sources." />
            )}
          </>
        ) : null}
        {view === "search" ? <SearchPanel query={query} setQuery={setQuery} submitSearch={submitSearch} results={results} /> : null}
        {view === "ask" ? <AskPanel query={query} setQuery={setQuery} submitAsk={submitAsk} answer={answer} citations={citations} /> : null}
        {view === "sources" ? <SourceList sources={sources} canManageSources={canManageSources} /> : null}
        {view === "upload" ? <UploadPanel sources={sources} canUpload={canUpload} /> : null}
        {view === "imports" ? <Empty text={canImport ? "Import job history will appear after uploads or open guideline imports." : "Import tools are restricted."} /> : null}
        {view === "review" ? <DocumentList documents={filterTrainingDocuments(documents.filter((item) => item.guidelineStatus === "NEEDS_REVIEW"))} title="Documents needing review" /> : null}
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
      {children}
    </>
  );
}

function SearchPanel(props: {
  query: string;
  setQuery: (value: string) => void;
  submitSearch: (event: FormEvent<HTMLFormElement>) => void;
  results: SearchResult[];
}) {
  return (
    <section className="panel">
      <form className="guideline-search" onSubmit={props.submitSearch}>
        <input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search local guideline text" />
        <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Search</button>
      </form>
      <div className="data-list">
        {props.results.map((result) => (
          <article className="data-row" key={result.chunkId}>
            <div className="data-row-header"><strong>{result.title}</strong><span className="badge">{result.accessLevel}</span></div>
            <p>{result.snippet}</p>
            <p className="muted">{result.organization} - {result.versionLabel ?? "current"} - {result.sectionHeading}</p>
            <span className="badge accent">{result.citationLabel}</span>
          </article>
        ))}
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
  return (
    <section className="panel">
      <div className="section-heading"><h2>Upload licensed PDF or text</h2><span className="badge warning">Private vault</span></div>
      {canUpload ? (
        <form className="form-grid">
          <label>Title<input placeholder="Document title" /></label>
          <label>Specialty<input placeholder="obstetrics or gynecology" /></label>
          <label>Topic<input placeholder="Topic" /></label>
          <label>Source<select>{sources.map((source) => <option key={source.id}>{source.organization}</option>)}</select></label>
          <label>Access<select><option>Owner and Doctor</option><option>Owner only</option></select></label>
          <label>File<input type="file" accept=".pdf,.txt,text/plain,application/pdf" /></label>
          <button className="button" type="button"><ThreeDMedicalIcon name="files" size="sm" />Upload for review</button>
        </form>
      ) : <Empty text="Upload is restricted to authorized owner or doctor accounts." />}
    </section>
  );
}

function DocumentList({ documents, title }: { documents: Document[]; title: string }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="badge">{documents.length}</span>
      </div>
      <div className="dense-card-list">
        {documents.map((document) => (
          <article className="data-row dense" key={document.id}>
            <div className="data-row-header"><strong>{document.title}</strong><span className="badge">{document.guidelineStatus}</span></div>
            <p>{document.organization} - {document.specialty} - {document.topic}</p>
            <p className="muted">{document.versionLabel ?? "No version label"} - {document._count?.chunks ?? 0} indexed chunks</p>
          </article>
        ))}
        {!documents.length ? <Empty text={title === "Documents needing review" ? "No documents need review" : "No guideline documents in this view yet."} /> : null}
      </div>
    </section>
  );
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

function cards({
  canUpload,
  canImport,
  canReview,
  isOwnerAdmin
}: {
  canUpload: boolean;
  canImport: boolean;
  canReview: boolean;
  isOwnerAdmin: boolean;
}) {
  if (!isOwnerAdmin) {
    return [
      { href: "/guidelines", title: "Guidelines", copy: "Recent indexed evidence-library documents.", icon: "reports" as const },
      { href: "/guidelines/search", title: "Search", copy: "Find indexed sections with citations.", icon: "search" as const },
      { href: "/guidelines/search", title: "Browse", copy: "Browse local evidence-library content.", icon: "files" as const },
      { href: "/guidelines/ask", title: "Ask Evidence Library", copy: "Local summary from indexed chunks only.", icon: "ai" as const },
      { href: "/guidelines", title: "Recent", copy: "Recently indexed guideline documents.", icon: "timeline" as const }
    ];
  }
  return [
    { href: "/guidelines/imports", title: "Import official guidelines", copy: canImport ? "Run the built-in official source pack from the server CLI." : "Restricted import area.", icon: "reports" as const },
    { href: "/guidelines/search", title: "Search All Guidelines", copy: "Find indexed sections with citations.", icon: "search" as const },
    { href: "/guidelines/ask", title: "Ask Evidence Library", copy: "Local summary from indexed chunks only.", icon: "ai" as const },
    { href: "/guidelines/upload", title: "Upload Licensed PDF", copy: canUpload ? "Private file extraction and review." : "Restricted upload area.", icon: "files" as const },
    { href: "/guidelines/sources", title: "Sources Registry", copy: canImport ? "Manage open and restricted sources." : "Review source access types.", icon: "reports" as const },
    { href: "/guidelines/review", title: "Needs Review", copy: canReview ? "Approve, reject, or archive imports." : "Doctor review queue.", icon: "doctor" as const },
    { href: "/guidelines/private-vault", title: "Private Vault", copy: "Licensed local uploads stay private.", icon: "consent" as const }
  ];
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
