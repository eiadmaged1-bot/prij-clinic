"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

type Source = {
  id: string;
  name: string;
  organization: string;
  sourceType: string;
  active: boolean;
};

type UploadResult = {
  document: {
    id: string;
    title: string;
    guidelineStatus: string;
    _count?: { chunks: number };
  };
  importJobId: string;
};

export function GuidelineUploadWorkspace() {
  const { user, status } = useSession();
  const canUpload = Boolean(user?.permissions.includes("guidelines.upload"));
  const [sources, setSources] = useState<Source[]>([]);
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("obstetrics and gynecology");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [sourceOrganization, setSourceOrganization] = useState("");
  const [accessLevel, setAccessLevel] = useState("OWNER_DOCTOR");
  const [licenseStatus, setLicenseStatus] = useState("LICENSED_PRIVATE");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("Choose a PDF, TXT, or Markdown guideline for protected local review.");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !canUpload) return;
    void (async () => {
      const response = await apiRequest("/guidelines/sources");
      if (!response.ok) {
        setMessage("Source registry could not be loaded. A private licensed source can still be entered manually.");
        return;
      }
      const body = await response.json() as { sources?: Source[] };
      setSources((body.sources ?? []).filter((source) => source.active));
    })();
  }, [canUpload, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!file) {
      setMessage("Choose a guideline file.");
      return;
    }
    if (!title.trim() || !specialty.trim() || !topic.trim()) {
      setMessage("Title, specialty, and topic are required.");
      return;
    }
    if (!sourceId && !sourceOrganization.trim()) {
      setMessage("Choose a registered source or enter the source organization.");
      return;
    }
    if (!validFile(file)) {
      setMessage("Only matching PDF, TXT, MD, or Markdown files up to 20 MB are accepted.");
      return;
    }

    const form = new FormData();
    form.set("file", file);
    form.set("uploadIntent", "create_new_guideline");
    form.set("title", title.trim());
    form.set("specialty", specialty.trim());
    form.set("topic", topic.trim());
    form.set("accessLevel", accessLevel);
    form.set("licenseStatus", licenseStatus);
    if (subtopic.trim()) form.set("subtopic", subtopic.trim());
    if (versionLabel.trim()) form.set("versionLabel", versionLabel.trim());
    if (sourceId) form.set("sourceId", sourceId);
    else form.set("sourceOrganization", sourceOrganization.trim());

    setSubmitting(true);
    setMessage("Encrypting, storing, extracting, and indexing the guideline locally…");
    const response = await apiRequest("/guidelines/upload", "POST", form);
    setSubmitting(false);

    if (!response.ok) {
      setMessage(await errorMessage(response));
      return;
    }

    const body = await response.json() as UploadResult;
    setResult(body);
    setMessage("Upload completed. The guideline remains in Needs Review until an authorized clinical reviewer approves it.");
  }

  if (status === "loading") {
    return <AppShell><section className="panel empty-state">Loading upload workspace…</section></AppShell>;
  }

  if (!canUpload) {
    return <AppShell><section className="panel"><p className="empty-state">Guideline upload is restricted to authorized clinical-content roles.</p><Link className="button secondary" href="/guidelines">Back to Guidelines</Link></section></AppShell>;
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Guidelines &amp; Protocols</p>
            <h1>Upload guideline for review</h1>
            <p className="muted">Protected local storage, extraction, indexing, duplicate detection, and clinical governance review.</p>
          </div>
          <Link className="button secondary" href="/guidelines">Back to library</Link>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Authoritative source file</p>
            <h2>Document and governance details</h2>
          </div>
          <span className="badge warning">Not active until reviewed</span>
        </div>

        <p className="notice">Uploading creates a reviewable document only. Extracted text and any later AI-assisted summary remain drafts until Doctor approval. Exact duplicate files are rejected.</p>

        <form className="form-grid" onSubmit={submit}>
          <label className="wide">
            Guideline file
            <input
              required
              type="file"
              accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <small>PDF, TXT, or Markdown · maximum 20 MB</small>
          </label>

          <label>
            Title
            <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Full guideline title" />
          </label>
          <label>
            Version or year
            <input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} placeholder="For example 2026 or v2.1" />
          </label>
          <label>
            Specialty
            <input required value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
          </label>
          <label>
            Topic
            <input required value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="For example hypertensive disorders in pregnancy" />
          </label>
          <label className="wide">
            Subtopic
            <input value={subtopic} onChange={(event) => setSubtopic(event.target.value)} placeholder="Optional narrower clinical area" />
          </label>

          <label>
            Registered source
            <select value={sourceId} onChange={(event) => { setSourceId(event.target.value); if (event.target.value) setSourceOrganization(""); }}>
              <option value="">Enter organization manually</option>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.organization} · {source.sourceType}</option>)}
            </select>
          </label>
          <label>
            Source organization
            <input disabled={Boolean(sourceId)} value={sourceOrganization} onChange={(event) => setSourceOrganization(event.target.value)} placeholder="Organization shown on the source" />
          </label>

          <label>
            Access
            <select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value)}>
              <option value="OWNER_DOCTOR">Owner and Doctor</option>
              <option value="CLINICAL_TEAM">Clinical team</option>
              <option value="OWNER_ONLY">Owner only</option>
            </select>
          </label>
          <label>
            License status
            <select value={licenseStatus} onChange={(event) => setLicenseStatus(event.target.value)}>
              <option value="LICENSED_PRIVATE">Licensed/private upload</option>
              <option value="OPEN">Open/publicly reusable</option>
              <option value="CHECK_REQUIRED">Reuse terms need review</option>
            </select>
          </label>

          <div className="wide form-actions">
            <button className="button" type="submit" disabled={submitting}>{submitting ? "Uploading…" : "Upload for clinical review"}</button>
            <Link className="button secondary" href="/guidelines">Cancel</Link>
          </div>
          <p className="notice wide" role="status">{message}</p>
        </form>
      </section>

      {result ? (
        <section className="panel">
          <div className="section-heading"><h2>Upload received</h2><span className="badge warning">{result.document.guidelineStatus}</span></div>
          <p><strong>{result.document.title}</strong></p>
          <p className="muted">Indexed chunks: {result.document._count?.chunks ?? 0}. Review the original file and extracted content before activation.</p>
          <div className="form-actions">
            <Link className="button" href={`/guidelines/${result.document.id}`}>Open document review</Link>
            <Link className="button secondary" href="/guidelines/review">Open review queue</Link>
            <button className="button secondary" type="button" onClick={() => { setResult(null); setFile(null); setTitle(""); setTopic(""); setSubtopic(""); setVersionLabel(""); }}>Upload another</button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function validFile(file: File) {
  const extension = file.name.toLowerCase().split(".").pop();
  const acceptedExtension = ["pdf", "txt", "md", "markdown"].includes(extension ?? "");
  const acceptedMime = ["application/pdf", "text/plain", "text/markdown"].includes(file.type) || file.type === "";
  return acceptedExtension && acceptedMime && file.size > 0 && file.size <= 20 * 1024 * 1024;
}

async function apiRequest(path: string, method = "GET", body?: FormData) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${path}`, {
    method,
    credentials: "include",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body
  }).catch(() => new Response(null, { status: 503 }));
}

async function errorMessage(response: Response) {
  const body = await response.json().catch(() => ({})) as {
    message?: string | string[];
    error?: { message?: string };
  };
  if (body.error?.message) return body.error.message;
  if (Array.isArray(body.message)) return body.message[0] ?? "Upload failed.";
  return body.message ?? "Upload failed. Check the file, metadata, duplicate status, and permissions.";
}
