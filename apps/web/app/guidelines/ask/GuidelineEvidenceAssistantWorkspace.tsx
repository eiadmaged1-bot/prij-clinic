"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

type AssistantResponse = {
  question: string;
  answer: string;
  statements: Array<{
    statement: string;
    documentId: string;
    page: number | null;
    citationLabel: string;
  }>;
  citations: Array<{
    documentId: string;
    title: string;
    organization: string;
    versionLabel?: string | null;
    sectionHeading: string;
    citationLabel: string;
    pageStart: number | null;
    pageEnd?: number | null;
    link: string;
  }>;
  relatedProtocols: Array<{
    id: string;
    title: string;
    condition: string;
    riskLevel: string;
    sourceName: string;
    link: string;
    linkedDocument?: { link: string; title: string } | null;
  }>;
  noSupportingSource: boolean;
  doctorReviewRequired: boolean;
  externalAiAccess: boolean;
  generatedClinicalPlan: boolean;
};

export function GuidelineEvidenceAssistantWorkspace() {
  const { user, status } = useSession();
  const canSearch = Boolean(user?.permissions.includes("guidelines.search"));
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [message, setMessage] = useState("Ask a focused question. The assistant will use approved local evidence only.");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = question.trim();
    if (cleaned.length < 4) {
      setMessage("Enter a clinical question of at least four characters.");
      return;
    }

    setSubmitting(true);
    setResponse(null);
    setMessage("Searching approved local evidence…");
    const apiResponse = await apiRequest("/guidelines/evidence-assistant/ask", {
      question: cleaned
    });
    setSubmitting(false);

    if (!apiResponse.ok) {
      setMessage(await responseMessage(apiResponse));
      return;
    }

    const body = await apiResponse.json() as AssistantResponse;
    setResponse(body);
    setMessage(body.noSupportingSource
      ? "No supporting source was found in the approved guideline library."
      : `${body.citations.length} supporting source records found. Doctor review remains required.`);
  }

  if (status === "loading") {
    return <AppShell><section className="panel empty-state">Loading approved evidence assistant…</section></AppShell>;
  }

  if (!canSearch) {
    return <AppShell><section className="panel"><p className="empty-state">The evidence assistant is restricted to authorized clinical roles.</p><Link className="button secondary" href="/guidelines">Back to Guidelines</Link></section></AppShell>;
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Guidelines &amp; Protocols</p>
            <h1>Ask the approved evidence library</h1>
            <p className="muted">Deterministic source retrieval with page-linked evidence. No diagnosis, prescription, or autonomous clinical plan.</p>
          </div>
          <Link className="button secondary" href="/guidelines">Back to library</Link>
        </div>
      </section>

      <section className="panel">
        <form className="guideline-search" onSubmit={submit}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="For example: What does the approved library say about assessment of reduced fetal movements?"
          />
          <button className="button" type="submit" disabled={submitting}>{submitting ? "Searching…" : "Ask approved library"}</button>
        </form>
        <p className="notice" role="status">{message}</p>
        <p className="muted">The system retrieves source statements only. It does not infer missing recommendations or replace clinical judgment.</p>
      </section>

      {response ? (
        <>
          <section className="panel">
            <div className="section-heading">
              <div><p className="eyebrow">Source-grounded response</p><h2>Evidence summary</h2></div>
              <span className="badge warning">Doctor review required</span>
            </div>
            <p><strong>{response.answer}</strong></p>
            {response.statements.length ? (
              <ol>
                {response.statements.map((entry, index) => (
                  <li key={`${entry.documentId}-${entry.page ?? "none"}-${index}`}>
                    <p>{entry.statement}</p>
                    <Link className="button secondary compact" href={entry.page ? `/guidelines/${entry.documentId}?page=${entry.page}` : `/guidelines/${entry.documentId}?tab=summary`}>
                      {entry.citationLabel}{entry.page ? ` · p. ${entry.page}` : ""}
                    </Link>
                  </li>
                ))}
              </ol>
            ) : <p className="empty-state compact">No supporting source was found in the approved guideline library. The system did not generate an answer.</p>}
          </section>

          <section className="panel">
            <div className="section-heading"><h2>Supporting sources</h2><span className="badge">{response.citations.length}</span></div>
            <div className="data-list">
              {response.citations.map((citation) => (
                <article className="data-row" key={`${citation.documentId}-${citation.pageStart ?? "none"}-${citation.sectionHeading}`}>
                  <strong>{citation.title}</strong>
                  <p>{citation.organization} · {citation.versionLabel || "Version not recorded"}</p>
                  <p className="muted">{citation.sectionHeading}{citation.pageStart ? ` · Page ${citation.pageStart}${citation.pageEnd && citation.pageEnd !== citation.pageStart ? `–${citation.pageEnd}` : ""}` : ""}</p>
                  <Link className="button secondary compact" href={citation.link}>Open supporting source</Link>
                </article>
              ))}
            </div>
          </section>

          {response.relatedProtocols.length ? (
            <section className="panel">
              <div className="section-heading"><h2>Related reviewed protocols</h2><span className="badge">{response.relatedProtocols.length}</span></div>
              <p className="muted">Related protocols are navigation suggestions only and are not automatically applied.</p>
              <div className="data-list">
                {response.relatedProtocols.map((protocol) => (
                  <article className="data-row" key={protocol.id}>
                    <div className="data-row-header"><strong>{protocol.title}</strong><span className="badge accent">Reviewed</span></div>
                    <p>{protocol.condition}</p>
                    <p className="muted">Risk: {protocol.riskLevel} · {protocol.sourceName}</p>
                    <div className="form-actions">
                      <Link className="button secondary compact" href={protocol.link}>Open protocol</Link>
                      {protocol.linkedDocument ? <Link className="button secondary compact" href={protocol.linkedDocument.link}>Open linked guideline</Link> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel compact-panel">
            <p className="muted">External AI access: {response.externalAiAccess ? "Enabled" : "Disabled"} · Generated clinical plan: {response.generatedClinicalPlan ? "Yes" : "No"} · Doctor review required: {response.doctorReviewRequired ? "Yes" : "No"}</p>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

async function apiRequest(path: string, payload: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  }).catch(() => new Response(null, { status: 503 }));
}

async function responseMessage(response: Response) {
  const body = await response.json().catch(() => ({})) as { message?: string | string[]; error?: { message?: string } };
  if (body.error?.message) return body.error.message;
  if (Array.isArray(body.message)) return body.message[0] ?? "Evidence search failed.";
  return body.message ?? "The approved evidence assistant is unavailable.";
}
