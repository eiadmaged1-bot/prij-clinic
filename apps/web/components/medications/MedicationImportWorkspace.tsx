"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useSession } from "../../app/session";

type ImportSource = { code: string; displayName?: string; countryCode?: string | null };
type ImportJob = { id: string; fileName?: string | null; status: string; rowCount: number; importedCount: number; errorCount: number; createdAt: string };
type Preview = { dryRun: true; rowCount: number; validCount: number; errorCount: number; duplicateCount: number; needsReviewCount: number; preview: Array<Record<string, string | null>>; errors: Array<{ rowNumber: number; message: string }> };

const targets = ["tradeName", "genericName", "strengthText", "dosageForm", "route", "countryCode", "registrationNumber", "manufacturer", "atcCode"] as const;

export function MedicationImportWorkspace() {
  const { user, status: sessionStatus } = useSession();
  const canImport = Boolean(user?.permissions.includes("drug_market.import") && (user.roles.includes("Owner") || user.roles.includes("Admin")));
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [sourceCode, setSourceCode] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceVersion, setSourceVersion] = useState("");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState("Choose an approved source and file.");
  const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);

  async function loadReference() {
    const [sourceResponse, jobResponse] = await Promise.all([request("/drug-market/sources"), request("/drug-market/import/jobs")]);
    if (sourceResponse.ok) setSources((await sourceResponse.json()) as ImportSource[]);
    if (jobResponse.ok) setJobs((await jobResponse.json()) as ImportJob[]);
  }

  useEffect(() => { if (canImport) void loadReference(); }, [canImport]);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let parsed: Array<Record<string, string>> = [];
      if (extension === "json") parsed = normalizeRows(JSON.parse(await file.text()));
      else if (extension === "csv") parsed = parseCsv(await file.text());
      else if (extension === "xlsx" || extension === "xls") {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error();
        parsed = normalizeRows(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, { defval: "" }));
      } else throw new Error();
      if (!parsed.length) throw new Error();
      setRows(parsed.slice(0, 10000));
      const headers = Object.keys(parsed[0] ?? {});
      setMapping(Object.fromEntries(targets.map((target) => [target, bestColumn(target, headers)])));
      setStatus(`${parsed.length.toLocaleString()} row(s) loaded locally. Review mapping, then run a dry run.`);
    } catch {
      setRows([]);
      setStatus("This file could not be read. Use a valid CSV, Excel, or JSON table.");
    }
  }

  async function dryRun() {
    if (!readyForPreview()) return;
    setStatus("Validating rows without writing medication data…");
    const response = await request("/drug-market/import/preview", "POST", payload());
    if (!response.ok) { setStatus("Dry run failed. Review the source, mapping, and file contents."); return; }
    const result = (await response.json()) as Preview;
    setPreview(result);
    setStatus(`Dry run complete: ${result.validCount} valid, ${result.duplicateCount} duplicate, ${result.errorCount} error.`);
  }

  async function commit() {
    if (!preview || preview.errorCount > 0 || preview.validCount === 0) { setStatus("Complete a clean dry run before importing."); return; }
    setStatus("Importing rows into the review queue…");
    const response = await request("/drug-market/import/upload", "POST", payload());
    setStatus(response.ok ? "Import completed. Every imported row remains needs review." : "Import failed safely. No success was recorded.");
    if (response.ok) { setPreview(null); void loadReference(); }
  }

  async function archive(job: ImportJob) {
    const response = await request(`/drug-market/import/jobs/${job.id}/archive`, "POST");
    setStatus(response.ok ? "Unverified rows in the batch were archived; verified rows were preserved." : "This batch could not be safely archived.");
    if (response.ok) void loadReference();
  }

  function readyForPreview() {
    if (!sourceCode || !fileName || !sourceVersion.trim() || !rows.length || (!sourceUrl.trim() && !fileName)) {
      setStatus("Source, source version, file, and required column mapping are needed.");
      return false;
    }
    if (!mapping.tradeName && !mapping.genericName) { setStatus("Map at least a trade name or generic name column."); return false; }
    return true;
  }

  function payload() { return { sourceCode, sourceUrl: sourceUrl.trim() || undefined, sourceVersion: sourceVersion.trim(), fileName, rows, columnMapping: mapping }; }

  if (sessionStatus === "authenticated" && !canImport) return <section className="panel"><p className="form-error">Owner or Admin medication-import access is required.</p></section>;
  if (!canImport) return <section className="panel"><p className="muted">Checking medication-import access…</p></section>;

  return <section className="content-grid two-columns">
    <article className="panel">
      <div className="section-heading"><h2>Manual medication import</h2><span className="badge warning">Owner / Admin · needs review</span></div>
      <p className="muted">Official public, open terminology, or owner-provided licensed files only. Do not upload patient data, retail stock, checkout, or self-use directions.</p>
      <div className="form-grid">
        <label>Approved source<select value={sourceCode} onChange={(event) => { setSourceCode(event.target.value); setPreview(null); }}><option value="">Choose source</option>{sources.map((source) => <option key={source.code} value={source.code}>{source.countryCode ? `${source.countryCode} · ` : ""}{source.displayName || source.code}</option>)}</select></label>
        <label>Source version / publication date<input value={sourceVersion} onChange={(event) => { setSourceVersion(event.target.value); setPreview(null); }} required /></label>
        <label className="wide">Source URL, when applicable<input type="url" value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setPreview(null); }} /></label>
        <label className="wide">CSV, Excel, or JSON file<input type="file" accept=".csv,.json,.xlsx,.xls" onChange={(event) => void readFile(event)} /></label>
      </div>
      {columns.length ? <section className="compact-panel"><h3>Column mapping</h3><div className="form-grid">{targets.map((target) => <label key={target}>{friendly(target)}<select value={mapping[target] ?? ""} onChange={(event) => { setMapping({ ...mapping, [target]: event.target.value }); setPreview(null); }}><option value="">Not mapped</option>{columns.map((column) => <option key={column}>{column}</option>)}</select></label>)}</div></section> : null}
      <div className="form-actions"><button className="button secondary" type="button" disabled={!rows.length} onClick={() => void dryRun()}>Dry run</button><button className="button" type="button" disabled={!preview || preview.errorCount > 0 || preview.validCount === 0} onClick={() => void commit()}>Import to review queue</button></div>
      <p className="muted">{status}</p>
    </article>
    <article className="panel">
      <div className="section-heading"><h2>Validation and batches</h2><span className="badge">{jobs.length}</span></div>
      {preview ? <div className="data-list"><article className="data-row"><strong>Dry-run summary</strong><p>{preview.rowCount} rows · {preview.validCount} valid · {preview.duplicateCount} duplicates · {preview.errorCount} errors · {preview.needsReviewCount} needs review</p></article>{preview.errors.map((error) => <article className="data-row" key={`${error.rowNumber}-${error.message}`}><strong>Row {error.rowNumber}</strong><p className="muted">{error.message}</p></article>)}</div> : <p className="empty-state compact">Run validation to see a safe batch summary and error report.</p>}
      <div className="data-list">{jobs.slice(0, 20).map((job) => <article className="data-row" key={job.id}><div className="data-row-header"><strong>{job.fileName || "Medication import"}</strong><span className="badge">{friendly(job.status)}</span></div><p className="muted">{job.rowCount} rows · {job.importedCount} imported · {job.errorCount} errors</p><button className="button secondary compact" type="button" disabled={job.status === "archived"} onClick={() => void archive(job)}>Archive unverified batch</button></article>)}</div>
    </article>
  </section>;
}

function normalizeRows(value: unknown): Array<Record<string, string>> {
  if (!Array.isArray(value)) return [];
  return value.filter((row) => row && typeof row === "object" && !Array.isArray(row)).map((row) => Object.fromEntries(Object.entries(row as Record<string, unknown>).map(([key, cell]) => [key, String(cell ?? "").trim()])));
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = csvLine(lines[0]!);
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, csvLine(line)[index] ?? ""])));
}

function csvLine(line: string) {
  const values: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { values.push(value.trim()); value = ""; } else value += char; }
  values.push(value.trim()); return values;
}

function bestColumn(target: string, columns: string[]) { const normalizedTarget = target.replace(/([A-Z])/g, " $1").toLowerCase(); return columns.find((column) => column.replace(/[_-]/g, " ").toLowerCase() === normalizedTarget) ?? ""; }
function friendly(value: string) { return value.replace(/([A-Z])/g, " $1").replaceAll("_", " ").trim(); }

async function request(endpoint: string, method = "GET", payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, { method, credentials: "include", headers: { ...(payload ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: payload ? JSON.stringify(payload) : undefined }).catch(() => new Response(null, { status: 500 }));
}
