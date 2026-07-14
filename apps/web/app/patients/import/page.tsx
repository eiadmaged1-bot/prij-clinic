"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";

type ImportRow = { id: string; rowNumber: number; status: string; normalizedJson: Record<string, unknown>; warningsJson?: string[]; duplicateJson?: Array<Record<string, unknown>> };
type Batch = { id: string; status: string; rowCount: number; importedCount: number; skippedCount: number; failedCount: number; rows: ImportRow[] };
const fields = ["fullName", "primaryPhone", "secondaryPhone", "address", "spouseName", "birthValue", "patientType", "currentPhase", "registrationDate", "notes", "externalId"];

export default function PatientImportPage() {
  const [headers, setHeaders] = useState<string[]>([]); const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); const [fileMeta, setFileMeta] = useState<{ name: string; hash: string; type: "csv" | "xlsx"; encoding: string } | null>(null);
  const [encoding, setEncoding] = useState("utf-8"); const [batch, setBatch] = useState<Batch | null>(null); const [selected, setSelected] = useState<string[]>([]); const [status, setStatus] = useState("Choose a CSV or XLSX file.");

  async function readFile(file?: File) {
    if (!file) return; setStatus("Reading file safely"); setBatch(null);
    if (file.size > 5 * 1024 * 1024) return setStatus("File exceeds the 5 MB limit.");
    const extension = file.name.split(".").pop()?.toLowerCase(); if (extension !== "csv" && extension !== "xlsx") return setStatus("Only CSV and XLSX files are supported.");
    try {
      const hashForm = new FormData(); hashForm.set("file", file); const hashResponse = await fetch("/api/patient-import/hash", { method: "POST", body: hashForm }); if (!hashResponse.ok) throw new Error("Could not hash file."); const hash = (await hashResponse.json()).sha256 as string;
      let parsed: Array<Record<string, unknown>> = [];
      if (extension === "xlsx") { const XLSX = await import("xlsx"); const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellFormula: false, cellHTML: false, cellText: true }); const sheet = book.Sheets[book.SheetNames[0] ?? ""]; if (!sheet) throw new Error("Workbook has no readable sheet."); parsed = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }); }
      else { const decoded = new TextDecoder(encoding, { fatal: true }).decode(await file.arrayBuffer()).replace(/^\uFEFF/, ""); parsed = parseCsv(decoded); }
      if (!parsed.length) throw new Error("File has no data rows."); if (JSON.stringify(parsed).includes("\uFFFD")) throw new Error("Corrupted replacement characters detected. Choose the correct encoding.");
      const nextHeaders = Object.keys(parsed[0] ?? {}); setHeaders(nextHeaders); setRows(parsed); setFileMeta({ name: file.name, hash, type: extension, encoding }); setMapping(autoMap(nextHeaders)); setStatus(`${parsed.length} rows ready for column mapping and dry-run preview.`);
    } catch (error) { setRows([]); setStatus(error instanceof Error ? error.message : "Could not read this file."); }
  }

  async function preview() {
    if (!fileMeta || !mapping.fullName) return setStatus("Map the Full name column first."); setStatus("Validating rows without creating patients");
    const response = await api("/patient-import/preview", { fileName: fileMeta.name, fileHash: fileMeta.hash, fileType: fileMeta.type, encoding: fileMeta.encoding, mapping, rows });
    if (!response.ok) return setStatus(await errorText(response)); const next = await response.json() as Batch; setBatch(next); setSelected(next.rows.filter((row) => row.status === "READY").map((row) => row.id)); setStatus("Dry run complete. Review warnings and select READY rows.");
  }

  async function commit() {
    if (!batch || !selected.length) return; setStatus("Importing selected READY rows"); const response = await api(`/patient-import/${batch.id}/commit`, { rowIds: selected }); if (!response.ok) return setStatus(await errorText(response)); setBatch(await response.json() as Batch); setStatus("Import completed. Review the batch result below.");
  }

  return <AppShell><section className="page-header"><div className="header-row"><div><p className="eyebrow">Owner / Admin</p><h1>Patient spreadsheet import</h1><p className="muted">Preview and dry-run are mandatory. No automatic merge or overwrite.</p></div><Link className="button secondary compact" href="/patients">Back to patients</Link></div></section>
    <section className="panel"><div className="section-heading"><h2>1. Upload and encoding</h2><span className="badge">{status}</span></div><div className="form-grid"><label>CSV encoding<select value={encoding} onChange={(event) => setEncoding(event.target.value)}><option value="utf-8">UTF-8 / UTF-8 BOM</option><option value="windows-1256">Windows-1256 Arabic</option></select></label><label className="wide">CSV or XLSX<input type="file" accept=".csv,.xlsx" onChange={(event) => void readFile(event.target.files?.[0])} /></label></div></section>
    {headers.length ? <section className="panel"><div className="section-heading"><h2>2. Column mapping</h2><span className="badge">{rows.length} rows</span></div><div className="form-grid">{fields.map((field) => <label key={field}>{label(field)}<select value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}><option value="">Not mapped</option>{headers.map((header) => <option key={header}>{header}</option>)}</select></label>)}<button className="button" type="button" onClick={() => void preview()}>Run dry-run preview</button></div></section> : null}
    {batch ? <section className="panel"><div className="section-heading"><h2>3. Warning review and selected import</h2><span className="badge">{batch.status}</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Select</th><th>Row</th><th>Status</th><th>Name</th><th>Phone</th><th>Warnings / duplicate evidence</th></tr></thead><tbody>{batch.rows.map((row) => <tr key={row.id}><td><input type="checkbox" checked={selected.includes(row.id)} disabled={row.status !== "READY"} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} /></td><td>{row.rowNumber}</td><td><span className="badge">{row.status}</span></td><td>{String(row.normalizedJson.fullName ?? "")}</td><td>{String(row.normalizedJson.primaryPhone ?? "")}</td><td>{[...(row.warningsJson ?? []), ...(row.duplicateJson ?? []).map((item) => `Possible match ${String(item.medicalRecordNumber ?? "")}`)].join(" · ") || "Ready"}</td></tr>)}</tbody></table></div><div className="form-actions"><button className="button" type="button" disabled={!selected.length || batch.status !== "previewed"} onClick={() => void commit()}>Import selected READY rows</button><span className="muted">Imported {batch.importedCount} · skipped {batch.skippedCount} · failed {batch.failedCount}</span></div></section> : null}
  </AppShell>;
}

function parseCsv(text: string) { const lines = text.split(/\r?\n/).filter((line) => line.trim()); if (!lines.length) return []; const values = lines.map(parseCsvLine); const headers = values[0] ?? []; return values.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header.trim(), row[index] ?? ""]))); }
function parseCsvLine(line: string) { const cells: string[] = []; let value = ""; let quoted = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]!; if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { cells.push(value); value = ""; } else value += char; } cells.push(value); return cells; }
function autoMap(headers: string[]) { const aliases: Record<string, string[]> = { fullName: ["full name", "name", "الاسم"], primaryPhone: ["phone", "mobile", "الهاتف"], address: ["address", "العنوان"], spouseName: ["spouse", "husband", "الزوج"], birthValue: ["dob", "birth", "الميلاد"], patientType: ["patient type", "type"], notes: ["notes", "ملاحظات"], externalId: ["external id", "file number"] }; return Object.fromEntries(Object.entries(aliases).map(([field, terms]) => [field, headers.find((header) => terms.some((term) => header.toLowerCase().includes(term))) ?? ""])); }
function label(value: string) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
async function api(path: string, body: unknown) { const token = sessionStorage.getItem("prijClinicToken"); return fetch(`${getApiBaseUrl()}${path}`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }).catch(() => new Response(null, { status: 500 })); }
async function errorText(response: Response) { const body = await response.json().catch(() => ({})); return String(body.message ?? body.error?.message ?? "Import request failed."); }
