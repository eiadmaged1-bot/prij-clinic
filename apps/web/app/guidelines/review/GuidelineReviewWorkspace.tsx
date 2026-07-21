"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

type ReviewDocument = {
  id: string;
  title: string;
  organization: string;
  specialty: string;
  topic: string;
  subtopic?: string | null;
  versionLabel?: string | null;
  guidelineStatus: string;
  reviewStatus: string;
  licenseStatus: string;
  accessLevel: string;
  fileName?: string | null;
  fileMimeType?: string | null;
  pageCount?: number | null;
  hasAsset?: boolean;
  updatedAt?: string;
  _count?: { chunks: number; sections: number };
};

type DecisionState = {
  document: ReviewDocument;
  decision: "APPROVED" | "REJECTED";
  reason: string;
};

export function GuidelineReviewWorkspace() {
  const { user, status } = useSession();
  const canReview = Boolean(user?.permissions.includes("guidelines.review"));
  const isClinicalReviewer = Boolean(user?.isSystemOwner || user?.roles.some((role) => role === "Doctor" || role === "Owner"));
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading review queue…");
  const [loading, setLoading] = useState(true);
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !canReview) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, canReview]);

  async function load() {
    setLoading(true);
    const response = await apiRequest("/guidelines/documents?page=1&limit=50&status=NEEDS_REVIEW");
    if (!response.ok) {
      setDocuments([]);
      setMessage("Review queue could not be loaded.");
      setLoading(false);
      return;
    }
    const body = await response.json() as { documents?: ReviewDocument[] };
    setDocuments(body.documents ?? []);
    setMessage("Review queue ready.");
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return documents.filter((document) => !search || [
      document.title,
      document.organization,
      document.specialty,
      document.topic,
      document.subtopic,
      document.versionLabel
    ].filter(Boolean).join(" ").toLowerCase().includes(search));
  }, [documents, query]);

  async function saveDecision() {
    if (!decisionState) return;
    const usable = isUsable(decisionState.document);
    if (decisionState.decision === "APPROVED" && !usable) {
      setMessage("This record cannot be activated because it has neither a stored source asset nor indexed content.");
      return;
    }
    if (decisionState.reason.trim().length < 4) {
      setMessage("Enter a review note of at least four characters.");
      return;
    }

    setSaving(true);
    const response = await apiRequest(
      `/guidelines/documents/${decisionState.document.id}/review`,
      "POST",
      {
        decision: decisionState.decision,
        reason: decisionState.reason.trim()
      }
    );
    setSaving(false);

    if (!response.ok) {
      setMessage(await responseMessage(response, "Review decision could not be saved."));
      return;
    }

    setMessage(decisionState.decision === "APPROVED"
      ? "Guideline activated after clinical review."
      : "Guideline rejected and retained in the governance history.");
    setDecisionState(null);
    await load();
  }

  if (status === "loading") {
    return <AppShell><section className="panel empty-state">Loading guideline review…</section></AppShell>;
  }

  if (!canReview || !isClinicalReviewer) {
    return <AppShell><section className="panel"><p className="empty-state">Guideline approval is restricted to authorized clinical reviewers.</p><Link className="button secondary" href="/guidelines">Back to Guidelines</Link></section></AppShell>;
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinical governance</p>
            <h1>Guideline review queue</h1>
            <p className="muted">Review the authoritative source, indexed text, licensing, and access level before activation.</p>
          </div>
          <div className="form-actions">
            <Link className="button secondary" href="/guidelines/upload">＋ Upload</Link>
            <Link className="button secondary" href="/guidelines">Back to library</Link>
          </div>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="toolbar">
          <label>
            Search review queue
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, organization, topic, or version" />
          </label>
          <span className="badge warning">{documents.length} awaiting review</span>
        </div>
        <p className="notice" role="status">{message}</p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Needs Review</p>
            <h2>{filtered.length} documents</h2>
          </div>
          <span className="badge">No automatic activation</span>
        </div>

        {loading ? <p className="empty-state compact">Loading review records…</p> : null}
        {!loading && !filtered.length ? <p className="empty-state compact">No guideline currently requires review.</p> : null}

        <div className="knowledge-document-grid">
          {filtered.map((document) => {
            const usable = isUsable(document);
            return (
              <article className="knowledge-document-card" key={document.id}>
                <div className="data-row-header">
                  <span aria-hidden="true" style={{ fontSize: "2rem" }}>{document.fileMimeType === "application/pdf" ? "📄" : "📑"}</span>
                  <div>
                    <strong>{document.title}</strong>
                    <p className="muted">{document.organization} · {document.topic}</p>
                  </div>
                  <span className="badge warning">{document.guidelineStatus}</span>
                </div>

                <dl className="profile-grid">
                  <div><dt>Version</dt><dd>{document.versionLabel || "Not recorded"}</dd></div>
                  <div><dt>Pages</dt><dd>{document.pageCount ?? "—"}</dd></div>
                  <div><dt>Indexed sections</dt><dd>{document._count?.sections ?? 0}</dd></div>
                  <div><dt>Search chunks</dt><dd>{document._count?.chunks ?? 0}</dd></div>
                  <div><dt>Access</dt><dd>{friendly(document.accessLevel)}</dd></div>
                  <div><dt>License</dt><dd>{friendly(document.licenseStatus)}</dd></div>
                </dl>

                <div className="status-count-row">
                  <span className="badge">{document.specialty}</span>
                  <span className={`badge ${usable ? "accent" : "warning"}`}>{usable ? "Source available" : "Incomplete shell"}</span>
                  {document.hasAsset ? <span className="badge">Stored file</span> : null}
                </div>

                {!usable ? <p className="warning-text">Activation is blocked until a source asset or indexed source text is available.</p> : null}

                <div className="form-actions">
                  <Link className="button" href={`/guidelines/${document.id}`}>Review document</Link>
                  <button className="button secondary" type="button" disabled={!usable} onClick={() => setDecisionState({ document, decision: "APPROVED", reason: "" })}>Approve…</button>
                  <button className="button secondary" type="button" onClick={() => setDecisionState({ document, decision: "REJECTED", reason: "" })}>Reject…</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {decisionState ? (
        <div className="admin-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDecisionState(null); }}>
          <section className="admin-editor-drawer" role="dialog" aria-modal="true" aria-labelledby="review-decision-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Clinical review decision</p>
                <h2 id="review-decision-title">{decisionState.decision === "APPROVED" ? "Approve guideline" : "Reject guideline"}</h2>
              </div>
              <button className="button secondary compact" type="button" onClick={() => setDecisionState(null)}>Close</button>
            </div>
            <p><strong>{decisionState.document.title}</strong></p>
            <p className="notice">Approval makes the guideline visible in the active Doctor library. It does not automatically approve derived summaries or protocols.</p>
            <label>
              Review note
              <textarea value={decisionState.reason} onChange={(event) => setDecisionState({ ...decisionState, reason: event.target.value })} placeholder="What was reviewed and why this decision is appropriate" />
            </label>
            <div className="form-actions">
              <button className="button" type="button" disabled={saving || decisionState.reason.trim().length < 4} onClick={() => void saveDecision()}>{saving ? "Saving…" : decisionState.decision === "APPROVED" ? "Approve and activate" : "Reject guideline"}</button>
              <button className="button secondary" type="button" onClick={() => setDecisionState(null)}>Cancel</button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

function isUsable(document: ReviewDocument) {
  return Boolean(document.hasAsset || (document._count?.chunks ?? 0) > 0);
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
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
  const body = await response.json().catch(() => ({})) as { message?: string | string[]; error?: { message?: string } };
  if (body.error?.message) return body.error.message;
  if (Array.isArray(body.message)) return body.message[0] ?? fallback;
  return body.message ?? fallback;
}
