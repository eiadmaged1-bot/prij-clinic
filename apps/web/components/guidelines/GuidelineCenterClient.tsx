"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { askGuidelines, Citation, GuidelineDocument, GuidelineRequestError, GuidelineSource, listGuidelineDocuments, listGuidelineSources, reviewGuidelineDocument, searchGuidelines, uploadDemoGuidelineText } from "../../lib/guidelines";

type Mode = "home" | "search" | "ask" | "sources" | "review" | "vault";

export function GuidelineCenterClient({ mode = "home" }: { mode?: Mode }) {
  const [sources, setSources] = useState<GuidelineSource[]>([]);
  const [documents, setDocuments] = useState<GuidelineDocument[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("Loading guideline inventory…");
  const [inventoryState, setInventoryState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  useEffect(() => {
    void Promise.all([listGuidelineSources(), listGuidelineDocuments()])
      .then(([nextSources, nextDocuments]) => {
        setSources(nextSources);
        setDocuments(nextDocuments);
        setInventoryState(nextSources.length || nextDocuments.length ? "ready" : "empty");
        setStatus(nextSources.length || nextDocuments.length ? "Guideline inventory loaded." : "No guideline documents are currently registered.");
      })
      .catch((error: GuidelineRequestError) => { setInventoryState("error"); setStatus(formatGuidelineError(error)); });
  }, []);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = String(form.get("query") ?? "");
    const result = await searchGuidelines(query);
    setCitations(result.results);
    setAnswer(result.noSourceFound ? "No source found in the local evidence library. Doctor review required." : "");
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await askGuidelines(String(form.get("question") ?? ""));
    setAnswer(result.answer);
    setCitations(result.citations);
  }

  async function importReviewText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await uploadDemoGuidelineText({
      sourceName: String(form.get("sourceName") ?? "Local Clinic Protocol"),
      title: String(form.get("title") ?? ""),
      text: String(form.get("text") ?? ""),
      citationLabel: String(form.get("citationLabel") ?? "")
    });
    setStatus("Text imported for governance review.");
    setDocuments(await listGuidelineDocuments());
  }

  async function markReview(documentId: string) {
    await reviewGuidelineDocument(documentId, "APPROVED", "Governance review action only.");
    setStatus("Review decision saved.");
    setDocuments(await listGuidelineDocuments());
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Guideline Center</p>
            <h2>Evidence library only</h2>
          </div>
          <span className="badge warning">Doctor review required</span>
        </div>
        <p className="notice">Evidence library only. Doctor review required. Local extractive search only. No external AI call.</p>
        <div className="form-actions">
          <Link className="button secondary" href="/guidelines/search">Search</Link>
          <Link className="button secondary" href="/guidelines/ask">Ask</Link>
          <Link className="button secondary" href="/guidelines/sources">Sources</Link>
          <Link className="button secondary" href="/guidelines/review">Review</Link>
        </div>
        {status ? <p className={inventoryState === "error" ? "form-error" : "notice"} role={inventoryState === "error" ? "alert" : "status"}>{status}</p> : null}
        {inventoryState === "error" ? <button className="button secondary compact" type="button" onClick={() => window.location.reload()}>Retry inventory</button> : null}
      </section>

      {mode === "search" || mode === "home" ? (
        <section className="panel">
          <h2>Search citations</h2>
          <form className="form-grid" onSubmit={search}>
            <label>Search terms<input name="query" defaultValue="doctor review" /></label>
            <button className="button" type="submit">Search</button>
          </form>
          <CitationList citations={citations} />
        </section>
      ) : null}

      {mode === "ask" ? (
        <section className="panel">
          <h2>Ask local evidence</h2>
          <form className="form-grid" onSubmit={ask}>
            <label>Question<input name="question" defaultValue="What happens when no source is found?" /></label>
            <button className="button" type="submit">Ask</button>
          </form>
          {answer ? <p className="notice">{answer}</p> : null}
          <CitationList citations={citations} />
        </section>
      ) : null}

      {mode === "sources" || mode === "home" ? (
        <section className="panel">
          <h2>Source registry</h2>
          <div className="data-list">
            {sources.map((source) => (
              <div className="data-row" key={source.id}>
                <strong>{source.name}</strong>
                <span className="badge">{source.status}</span>
                <span className="muted">{source._count?.documents ?? 0} documents</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "review" ? (
        <section className="panel">
          <h2>Governance review</h2>
          <div className="data-list">
            {documents.map((document) => (
              <div className="data-row" key={document.id}>
                <strong>{document.title}</strong>
                <span className="badge">{document.reviewStatus}</span>
                <button className="button secondary compact" onClick={() => markReview(document.id)} type="button">Mark reviewed</button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "vault" ? (
        <section className="panel">
          <h2>Private vault</h2>
          <p className="notice">Use licensed upload or approved open imports only. Do not upload patient data.</p>
          <form className="form-grid" onSubmit={importReviewText}>
            <label>Source<input name="sourceName" defaultValue="Local Clinic Protocol" /></label>
            <label>Title<input name="title" required /></label>
            <label>Citation label<input name="citationLabel" /></label>
            <label className="wide">Review text<textarea name="text" required /></label>
            <button className="button" type="submit">Import text</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function formatGuidelineError(error: GuidelineRequestError) {
  const prefix: Record<string, string> = { SESSION_EXPIRED: "Session expired.", ACCESS_DENIED: "Guideline access denied.", NETWORK_ERROR: "Network error.", DATABASE_OR_API_ERROR: "Guideline API or database error." };
  return `${prefix[error.code] ?? "Guideline inventory error."} ${error.message}${error.requestId ? ` Request ${error.requestId}.` : ""}`;
}

function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations.length) return <p className="muted">No citations loaded yet.</p>;
  return (
    <div className="data-list">
      {citations.map((citation) => (
        <div className="data-row" key={citation.chunkId}>
          <strong>{citation.citationLabel}</strong>
          <span className="muted">{citation.text}</span>
        </div>
      ))}
    </div>
  );
}
