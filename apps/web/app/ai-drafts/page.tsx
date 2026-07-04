"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell, SafetyAlert } from "../mvp-page";

type AiDraft = { id: string; draftType?: string; reviewStatus?: string; patientId?: string; createdAt?: string };

export default function AiDraftsPage() {
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [active, setActive] = useState("pending_review");
  const [status, setStatus] = useState("Loading");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/ai-drafts`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined })
      .then(async (response) => {
        setDrafts(response.ok ? ((await response.json()) as { aiDrafts?: AiDraft[] }).aiDrafts ?? [] : []);
        setStatus(response.ok ? "Ready" : "Unavailable");
      })
      .catch(() => setStatus("Unavailable"));
  }, [token]);

  const filtered = drafts.filter((draft) => (draft.reviewStatus ?? "pending_review") === active);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">AI Drafts</p>
            <h1>Draft review workspace</h1>
          </div>
          <div className="topbar-actions">
            <span className="badge warning">AI disabled / draft-only</span>
            <span className="badge">Doctor review</span>
          </div>
        </div>
        <p className="muted">Review placeholders only. No external AI request is made and drafts cannot diagnose, prescribe, sign, or update final records.</p>
      </section>
      <SafetyAlert />
      <section className="compact-metric-grid">
        <Metric label="Pending review" value={drafts.filter((draft) => (draft.reviewStatus ?? "pending_review") === "pending_review").length} />
        <Metric label="Approved" value={drafts.filter((draft) => draft.reviewStatus === "approved").length} />
        <Metric label="Rejected" value={drafts.filter((draft) => draft.reviewStatus === "rejected").length} />
        <Metric label="Status" value={status} />
      </section>
      <section className="panel compact-panel">
        <div className="segmented-control" aria-label="AI draft review status">
          {([
            ["pending_review", "Pending review"],
            ["approved", "Approved"],
            ["rejected", "Rejected"]
          ] as Array<[string, string]>).map(([key, label]) => <button className={active === key ? "active" : ""} key={key} type="button" onClick={() => setActive(key)}>{label}</button>)}
        </div>
        {filtered.length === 0 ? (
          <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="ai" size="sm" tone="slate" /><span>No AI drafts pending review.</span><Link className="button secondary compact" href="/patients">Open patient file</Link><Link className="button secondary compact" href="/doctor/visit">Start visit</Link></p>
        ) : null}
        <div className="dense-card-list">
          {filtered.map((draft) => <article className="data-row dense" key={draft.id}><div className="data-row-header"><strong>{draft.draftType ?? "AI draft"}</strong><span className="badge">{draft.reviewStatus ?? "pending_review"}</span></div><p className="muted">Patient-scoped draft placeholder. Doctor review required.</p>{draft.patientId ? <Link className="button secondary compact" href={`/patients/${draft.patientId}`}>Open patient file</Link> : null}</article>)}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="mini-metric-card"><span>{label}</span><strong>{value}</strong></article>;
}
