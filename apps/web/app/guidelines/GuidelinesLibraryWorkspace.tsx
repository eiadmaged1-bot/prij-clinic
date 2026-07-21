"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../mvp-page";
import { useSession } from "../session";

type GuidelineDocument = {
  id: string;
  title: string;
  organization: string;
  specialty: string;
  topic: string;
  subtopic?: string | null;
  versionLabel?: string | null;
  publicationDate?: string | null;
  updatedAt?: string | null;
  guidelineStatus: string;
  reviewStatus?: string | null;
  licenseStatus: string;
  accessLevel: string;
  archivedAt?: string | null;
  fileName?: string | null;
  fileMimeType?: string | null;
  pageCount?: number | null;
  hasAsset?: boolean;
  source?: { id: string; name: string; organization: string } | null;
  _count?: { chunks: number; sections: number };
  openedAt?: string;
  favoritedAt?: string;
};

type LibraryState = {
  favoriteIds: string[];
  favorites: GuidelineDocument[];
  recent: GuidelineDocument[];
};

type ViewMode = "library" | "favorites" | "recent" | "review" | "archived";

type ArchiveState = {
  document: GuidelineDocument;
  reason: string;
  confirmation: string;
};

const emptyLibraryState: LibraryState = {
  favoriteIds: [],
  favorites: [],
  recent: []
};

export function GuidelinesLibraryWorkspace() {
  const { user, status } = useSession();
  const canRead = Boolean(user?.permissions.includes("guidelines.read") || user?.permissions.includes("guidelines.search"));
  const canUpload = Boolean(user?.permissions.includes("guidelines.upload"));
  const canReview = Boolean(user?.permissions.includes("guidelines.review"));
  const canArchive = Boolean(
    user?.permissions.includes("guidelines.delete_or_archive") &&
    (user?.isSystemOwner || user?.roles.some((role) => role === "Doctor" || role === "Owner"))
  );

  const [documents, setDocuments] = useState<GuidelineDocument[]>([]);
  const [libraryState, setLibraryState] = useState<LibraryState>(emptyLibraryState);
  const [view, setView] = useState<ViewMode>("library");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [message, setMessage] = useState("Loading guideline library…");
  const [loading, setLoading] = useState(true);
  const [archiveState, setArchiveState] = useState<ArchiveState | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !canRead) return;
    void loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, canRead]);

  async function loadLibrary() {
    setLoading(true);
    const [documentsResponse, stateResponse] = await Promise.all([
      apiRequest("/guidelines/documents?page=1&limit=50"),
      apiRequest("/guidelines/user-library/state")
    ]);

    if (!documentsResponse.ok) {
      setDocuments([]);
      setMessage("The guideline library could not be loaded.");
      setLoading(false);
      return;
    }

    const documentsBody = await documentsResponse.json() as { documents?: GuidelineDocument[] };
    const stateBody = stateResponse.ok ? await stateResponse.json() as LibraryState : emptyLibraryState;
    setDocuments(documentsBody.documents ?? []);
    setLibraryState(stateBody);
    setMessage("Guideline library ready.");
    setLoading(false);
  }

  const topics = useMemo(
    () => [...new Set(documents.map((document) => document.topic).filter(Boolean))].sort(),
    [documents]
  );

  const activeDocuments = useMemo(
    () => documents.filter((document) => isUsableActiveDocument(document)),
    [documents]
  );

  const reviewDocuments = useMemo(
    () => documents.filter((document) => !document.archivedAt && (
      document.guidelineStatus === "NEEDS_REVIEW" ||
      !document.hasAsset && (document._count?.chunks ?? 0) === 0
    )),
    [documents]
  );

  const archivedDocuments = useMemo(
    () => documents.filter((document) => Boolean(document.archivedAt) || document.guidelineStatus === "ARCHIVED"),
    [documents]
  );

  const currentDocuments = useMemo(() => {
    const base = view === "favorites"
      ? libraryState.favorites
      : view === "recent"
        ? libraryState.recent
        : view === "review"
          ? reviewDocuments
          : view === "archived"
            ? archivedDocuments
            : activeDocuments;

    const search = query.trim().toLowerCase();
    return base.filter((document) => {
      const topicMatches = topic === "all" || document.topic === topic;
      const text = [
        document.title,
        document.organization,
        document.specialty,
        document.topic,
        document.subtopic,
        document.versionLabel,
        document.source?.name,
        document.source?.organization
      ].filter(Boolean).join(" ").toLowerCase();
      return topicMatches && (!search || text.includes(search));
    });
  }, [activeDocuments, archivedDocuments, libraryState.favorites, libraryState.recent, query, reviewDocuments, topic, view]);

  async function toggleFavorite(document: GuidelineDocument) {
    const isFavorite = libraryState.favoriteIds.includes(document.id);
    const response = await apiRequest(
      `/guidelines/user-library/documents/${document.id}/favorite`,
      isFavorite ? "DELETE" : "POST"
    );
    if (!response.ok) {
      setMessage("Favorite could not be updated.");
      return;
    }
    setMessage(isFavorite ? "Removed from Favorites." : "Added to Favorites.");
    await loadUserLibraryState();
  }

  async function loadUserLibraryState() {
    const response = await apiRequest("/guidelines/user-library/state");
    if (response.ok) setLibraryState(await response.json() as LibraryState);
  }

  async function openDocument(document: GuidelineDocument) {
    setMessage(`Opening ${document.title}…`);
    await apiRequest(`/guidelines/user-library/documents/${document.id}/opened`, "POST");
    const response = await apiRequest(`/guidelines/documents/${document.id}/view`);
    if (!response.ok) {
      setMessage("The secure viewer could not open this document.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setMessage("Secure document access recorded.");
    await loadUserLibraryState();
  }

  async function archiveDocument() {
    if (!archiveState) return;
    const response = await apiRequest(
      `/guidelines/user-library/documents/${archiveState.document.id}/archive`,
      "POST",
      {
        reason: archiveState.reason,
        confirmation: archiveState.confirmation
      }
    );
    if (!response.ok) {
      setMessage(await responseMessage(response, "Guideline could not be archived."));
      return;
    }
    setArchiveState(null);
    setMessage("Guideline archived. File, citations, summaries, and audit history were preserved.");
    await loadLibrary();
  }

  async function restoreDocument(document: GuidelineDocument) {
    const response = await apiRequest(`/guidelines/user-library/documents/${document.id}/restore`, "POST");
    if (!response.ok) {
      setMessage(await responseMessage(response, "Guideline could not be restored."));
      return;
    }
    setMessage("Guideline restored to Needs Review.");
    await loadLibrary();
  }

  if (status === "loading") {
    return <AppShell><section className="panel empty-state">Loading guideline workspace…</section></AppShell>;
  }

  if (!canRead) {
    return <AppShell><section className="panel empty-state">Guidelines are restricted to authorized clinical roles.</section></AppShell>;
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical knowledge workspace</p>
            <h1>Guidelines &amp; Protocols</h1>
            <p className="muted">Approved local evidence, secure documents, reviewed summaries, and source-linked protocols.</p>
          </div>
          <span className="badge warning">Doctor review required</span>
        </div>
      </section>

      <nav className="tab-row" aria-label="Guideline workspace sections">
        <button className={`button ${view === "library" ? "" : "secondary"}`} type="button" onClick={() => setView("library")}>📚 Guidelines</button>
        <Link className="button secondary" href="/protocol-atlas">🧭 Protocols</Link>
        <button className={`button ${view === "favorites" ? "" : "secondary"}`} type="button" onClick={() => setView("favorites")}>★ Favorites</button>
        <button className={`button ${view === "recent" ? "" : "secondary"}`} type="button" onClick={() => setView("recent")}>◷ Recently Opened</button>
        {canReview ? <button className={`button ${view === "review" ? "" : "secondary"}`} type="button" onClick={() => setView("review")}>✓ Needs Review</button> : null}
        {canUpload ? <Link className="button secondary" href="/guidelines/upload">＋ Upload</Link> : null}
        {canArchive ? <button className={`button ${view === "archived" ? "" : "secondary"}`} type="button" onClick={() => setView("archived")}>▣ Archived</button> : null}
      </nav>

      <section className="knowledge-metric-grid" aria-label="Guideline library metrics">
        <article><strong>{activeDocuments.length}</strong><span>Usable guidelines</span></article>
        <article><strong>{libraryState.favoriteIds.length}</strong><span>Your favorites</span></article>
        <article><strong>{libraryState.recent.length}</strong><span>Recently opened</span></article>
        <article><strong>{reviewDocuments.length}</strong><span>Needs review</span></article>
        <article><strong>{archivedDocuments.length}</strong><span>Archived</span></article>
      </section>

      <section className="panel compact-panel">
        <div className="toolbar">
          <label>
            Search library
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, organization, topic, or version" />
          </label>
          <label>
            Topic
            <select value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="all">All topics</option>
              {topics.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <Link className="button secondary" href={`/guidelines/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`}>Search full text</Link>
          <Link className="button secondary" href="/guidelines/ask">Ask approved library</Link>
        </div>
        <p className="notice" role="status">{message}</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{labelForView(view)}</p>
            <h2>{currentDocuments.length} documents</h2>
          </div>
          <span className="badge">Database backed</span>
        </div>

        {loading ? <p className="empty-state compact">Loading documents…</p> : null}
        {!loading && !currentDocuments.length ? <p className="empty-state compact">No usable documents match this view. Empty shells remain in Needs Review instead of appearing as active guidelines.</p> : null}

        <div className="knowledge-document-grid">
          {currentDocuments.map((document) => {
            const isFavorite = libraryState.favoriteIds.includes(document.id);
            const usable = Boolean(document.hasAsset || (document._count?.chunks ?? 0) > 0);
            return (
              <article className="knowledge-document-card" key={document.id}>
                <div className="data-row-header">
                  <span aria-hidden="true" style={{ fontSize: "2rem" }}>{document.fileMimeType === "application/pdf" ? "📄" : "📑"}</span>
                  <div>
                    <strong>{document.title}</strong>
                    <p className="muted">{document.organization} · {document.topic}</p>
                  </div>
                  <span className={`badge ${document.guidelineStatus === "ACTIVE" ? "accent" : "warning"}`}>{document.guidelineStatus}</span>
                </div>

                <dl className="profile-grid">
                  <div><dt>Version</dt><dd>{document.versionLabel || "Not recorded"}</dd></div>
                  <div><dt>Pages</dt><dd>{document.pageCount ?? "—"}</dd></div>
                  <div><dt>Indexed sections</dt><dd>{document._count?.sections ?? 0}</dd></div>
                  <div><dt>Search chunks</dt><dd>{document._count?.chunks ?? 0}</dd></div>
                </dl>

                <div className="status-count-row">
                  <span className="badge">{document.specialty}</span>
                  <span className="badge">{document.licenseStatus}</span>
                  {!usable ? <span className="badge warning">Incomplete shell</span> : null}
                </div>

                <div className="form-actions">
                  {document.archivedAt || document.guidelineStatus === "ARCHIVED" ? (
                    canArchive ? <button className="button secondary compact" type="button" onClick={() => void restoreDocument(document)}>Restore to review</button> : null
                  ) : (
                    <>
                      <button className="button compact" type="button" disabled={!document.hasAsset} onClick={() => void openDocument(document)}>Open secure viewer</button>
                      <button className="button secondary compact" type="button" onClick={() => void toggleFavorite(document)}>{isFavorite ? "★ Favorited" : "☆ Favorite"}</button>
                      <Link className="button secondary compact" href={`/guidelines/${document.id}`}>Details &amp; summary</Link>
                      {canArchive ? <button className="button secondary compact" type="button" onClick={() => setArchiveState({ document, reason: "", confirmation: "" })}>Archive…</button> : null}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {archiveState ? (
        <div className="admin-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setArchiveState(null); }}>
          <section className="admin-editor-drawer" role="dialog" aria-modal="true" aria-labelledby="archive-guideline-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Protected archive</p>
                <h2 id="archive-guideline-title">Archive guideline</h2>
              </div>
              <button className="button secondary compact" type="button" onClick={() => setArchiveState(null)}>Close</button>
            </div>
            <p className="notice">Archiving hides this guideline from active Doctor views. It does not delete the file, summaries, citations, versions, or audit history.</p>
            <p><strong>{archiveState.document.title}</strong></p>
            <label>
              Archive reason
              <textarea value={archiveState.reason} onChange={(event) => setArchiveState({ ...archiveState, reason: event.target.value })} placeholder="Why should this guideline be hidden?" />
            </label>
            <label>
              Type the exact title to confirm
              <input value={archiveState.confirmation} onChange={(event) => setArchiveState({ ...archiveState, confirmation: event.target.value })} />
            </label>
            <div className="form-actions">
              <button
                className="button danger"
                type="button"
                disabled={archiveState.reason.trim().length < 4 || archiveState.confirmation.trim() !== archiveState.document.title}
                onClick={() => void archiveDocument()}
              >
                Archive guideline
              </button>
              <button className="button secondary" type="button" onClick={() => setArchiveState(null)}>Cancel</button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

function isUsableActiveDocument(document: GuidelineDocument) {
  if (document.archivedAt || document.guidelineStatus === "ARCHIVED") return false;
  if (document.guidelineStatus !== "ACTIVE") return false;
  return Boolean(document.hasAsset || (document._count?.chunks ?? 0) > 0);
}

function labelForView(view: ViewMode) {
  if (view === "favorites") return "Favorites";
  if (view === "recent") return "Recently opened";
  if (view === "review") return "Review queue";
  if (view === "archived") return "Archive";
  return "Approved library";
}

async function apiRequest(path: string, method = "GET", payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(payload ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 503 }));
}

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({})) as { message?: string | string[] };
  if (Array.isArray(body.message)) return body.message[0] ?? fallback;
  return body.message ?? fallback;
}
