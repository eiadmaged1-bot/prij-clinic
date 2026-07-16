"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { AppShell } from "../../../../mvp-page";

type ScanContext = "OB" | "GYN" | "FERTILITY";
type Scan = {
  id: string; patientId: string; encounterId?: string | null; pregnancyId?: string | null;
  status: string; clinicalContext: ScanContext; performedAt: string; scanType?: string | null;
  indication?: string | null; cycleDay?: number | null; gestationalAgeDisplay?: string | null;
  gestationalAgeWeeks?: number | null; gestationalAgeDays?: number | null; fetalHeartRateBpm?: number | null;
  fetalHeartText?: string | null; presentation?: string | null; placenta?: string | null;
  amnioticFluid?: string | null; bpdMm?: number | null; hcMm?: number | null; acMm?: number | null;
  flMm?: number | null; efwGrams?: number | null; dopplerNote?: string | null;
  impressionText?: string | null; comparisonText?: string | null; structuredFindingsJson?: StructuredFindings | null;
  amendmentReason?: string | null; amendmentVersion?: number; signedAt?: string | null;
  patient?: { firstName?: string; lastName?: string; medicalRecordNumber?: string };
  createdByUser?: { displayName?: string | null };
};
type StructuredFindings = {
  uterus?: { position?: string; dimensions?: string; myometrium?: string };
  endometrium?: { thicknessMm?: number; pattern?: string; cavity?: string };
  ovaries?: { right?: string; left?: string; follicleMeasurementsMm?: number[] };
  lesions?: Array<{ id: string; location?: string; figoClassification?: string; dimensions?: string; vascularity?: string }>;
};
type PatientDocument = { id: string; title: string; category: string; fileMimeType?: string | null; imageWidth?: number | null; imageHeight?: number | null };

const templates: Record<ScanContext, string[]> = {
  GYN: ["Pelvic ultrasound", "Uterus / endometrium", "Fibroid mapping", "Adenomyosis", "Ovarian cyst / mass", "IUD", "Postmenopausal", "Follow-up"],
  FERTILITY: ["Follicular monitoring", "Baseline fertility scan", "AFC", "Endometrium monitoring", "Ovulation evidence", "Serial comparison", "Next-scan review"],
  OB: ["Early pregnancy / viability", "Dating", "First trimester / NT", "Anomaly", "Growth", "Placenta / AFI", "Cervical length", "Multiple pregnancy", "Doppler", "Follow-up"]
};

export default function UltrasoundEditorPage() {
  const { id: patientId, scanId } = useParams<{ id: string; scanId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const isNew = scanId === "new";
  const [scan, setScan] = useState<Scan | null>(null);
  const [context, setContext] = useState<ScanContext>((search.get("context") as ScanContext) || "OB");
  const [status, setStatus] = useState(isNew ? "Choose a template and record findings." : "Loading scan");
  const [busy, setBusy] = useState(false);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const encounterId = scan?.encounterId || search.get("encounterId") || search.get("visitId") || "";
  const pregnancyId = scan?.pregnancyId || search.get("pregnancyId") || "";
  const category = scan ? `Ultrasound scan ${scan.id}` : "";

  useEffect(() => { if (!isNew) void loadScan(); }, [scanId]);
  useEffect(() => { if (scan) void loadDocuments(); }, [scan?.id]);

  async function api(path: string, init?: RequestInit) {
    const token = sessionStorage.getItem("prijClinicToken");
    return fetch(`${getApiBaseUrl()}${path}`, { credentials: "include", ...init, headers: { ...(init?.body instanceof FormData ? {} : { "content-type": "application/json" }), ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  }

  async function loadScan() {
    const response = await api(`/ob-ultrasounds/${encodeURIComponent(scanId)}`).catch(() => null);
    if (!response?.ok) return setStatus("The ultrasound record is unavailable or outside your permitted scope.");
    const value = await response.json() as Scan;
    if (value.patientId !== patientId) return setStatus("This scan does not belong to the selected patient.");
    setScan(value); setContext(value.clinicalContext || "OB"); setStatus("Scan loaded.");
  }

  async function loadDocuments() {
    const response = await api(`/patients/${encodeURIComponent(patientId)}/documents`).catch(() => null);
    if (!response?.ok) return;
    const body = await response.json() as { patientDocuments?: PatientDocument[] };
    setDocuments((body.patientDocuments ?? []).filter((item) => item.category === category && item.fileMimeType?.startsWith("image/")));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!encounterId) return setStatus("Open the editor from an active encounter before saving this scan.");
    if (scan && ["reviewed", "signed", "final"].includes(scan.status)) return setStatus("Use the audited amendment action for reviewed or signed records.");
    setBusy(true); setStatus("Saving draft");
    const form = new FormData(event.currentTarget);
    let follicleMeasurementsMm: number[] = [];
    try { follicleMeasurementsMm = parseMeasurements(text(form, "follicleMeasurements")); }
    catch { setBusy(false); return setStatus("Follicle measurements must be comma-separated positive values no greater than 100 mm."); }
    const lesionDimensions = text(form, "lesionDimensions");
    const structuredFindingsJson: StructuredFindings = {
      uterus: compact({ position: text(form, "uterusPosition"), dimensions: text(form, "uterusDimensions"), myometrium: text(form, "myometrium") }),
      endometrium: compact({ thicknessMm: number(form, "endometriumThickness"), pattern: text(form, "endometriumPattern"), cavity: text(form, "endometriumCavity") }),
      ovaries: compact({ right: text(form, "rightOvary"), left: text(form, "leftOvary"), follicleMeasurementsMm }),
      lesions: lesionDimensions ? [{ id: text(form, "lesionId") || crypto.randomUUID(), location: text(form, "lesionLocation"), figoClassification: text(form, "lesionFigo"), dimensions: lesionDimensions, vascularity: text(form, "lesionVascularity") }] : []
    };
    const payload = compact({
      ...(isNew ? { patientId } : {}), encounterId, ...(pregnancyId ? { pregnancyId } : {}), clinicalContext: context,
      performedAt: text(form, "performedAt") ? new Date(text(form, "performedAt")).toISOString() : undefined,
      scanType: text(form, "scanType"), indication: text(form, "indication"), cycleDay: number(form, "cycleDay"),
      gestationalAgeDisplay: text(form, "gestationalAgeDisplay"), gestationalAgeWeeks: number(form, "gestationalAgeWeeks"), gestationalAgeDays: number(form, "gestationalAgeDays"),
      fetalHeartRateBpm: number(form, "fetalHeartRateBpm"), fetalHeartText: text(form, "fetalHeartText"), presentation: text(form, "presentation"), placenta: text(form, "placenta"), amnioticFluid: text(form, "amnioticFluid"),
      bpdMm: number(form, "bpdMm"), hcMm: number(form, "hcMm"), acMm: number(form, "acMm"), flMm: number(form, "flMm"), efwGrams: number(form, "efwGrams"),
      dopplerNote: text(form, "dopplerNote"), impressionText: text(form, "impressionText"), comparisonText: text(form, "comparisonText"), structuredFindingsJson
    });
    const response = await api(isNew ? "/ob-ultrasounds" : `/ob-ultrasounds/${encodeURIComponent(scanId)}`, { method: isNew ? "POST" : "PATCH", body: JSON.stringify(payload) }).catch(() => null);
    const body = await response?.json().catch(() => null) as Scan | { message?: string } | null;
    setBusy(false);
    if (!response?.ok || !body || !("id" in body)) return setStatus((body && "message" in body && body.message) || "The scan could not be saved.");
    setScan(body); setStatus("Draft saved and audit recorded.");
    if (isNew) router.replace(`/patients/${encodeURIComponent(patientId)}/ultrasounds/${encodeURIComponent(body.id)}`);
  }

  async function transition(action: "complete-for-review" | "review" | "sign") {
    if (!scan || !window.confirm(`Confirm ${action.replaceAll("-", " ")} for this scan?`)) return;
    setBusy(true);
    const response = await api(`/ob-ultrasounds/${encodeURIComponent(scan.id)}/${action}`, { method: "PATCH", body: JSON.stringify({}) }).catch(() => null);
    const body = await response?.json().catch(() => null) as Scan | { message?: string } | null;
    setBusy(false);
    if (!response?.ok || !body || !("id" in body)) return setStatus((body && "message" in body && body.message) || "The lifecycle action was rejected.");
    setScan(body); setStatus("Lifecycle status updated and audited.");
  }

  async function amend() {
    if (!scan) return;
    const reason = window.prompt("Document the amendment reason. The signed values remain in the audit history.")?.trim();
    if (!reason) return;
    setBusy(true);
    const response = await api(`/ob-ultrasounds/${encodeURIComponent(scan.id)}/amend`, { method: "PATCH", body: JSON.stringify({ amendmentReason: reason }) }).catch(() => null);
    const body = await response?.json().catch(() => null) as Scan | { message?: string } | null;
    setBusy(false);
    if (!response?.ok || !body || !("id" in body)) return setStatus((body && "message" in body && body.message) || "The amendment could not be opened.");
    setScan(body); setStatus("Audited amendment opened. Edit the record and save the amended version.");
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scan) return setStatus("Save the scan before attaching images.");
    const source = new FormData(event.currentTarget);
    const file = source.get("file");
    if (!(file instanceof File) || !file.size) return setStatus("Choose a JPEG, PNG, or WebP image.");
    const form = new FormData(); form.set("file", file); form.set("title", source.get("caption")?.toString().trim() || "Ultrasound image"); form.set("documentType", "ultrasound_report"); form.set("category", category); form.set("linkedEncounterId", encounterId);
    setBusy(true);
    const response = await api(`/patients/${encodeURIComponent(patientId)}/documents/upload`, { method: "POST", body: form }).catch(() => null);
    const body = await response?.json().catch(() => null) as { message?: string } | null;
    setBusy(false);
    if (!response?.ok) return setStatus(body?.message || "Image upload failed security validation.");
    event.currentTarget.reset(); setStatus("Image sanitized, encrypted, and attached."); await loadDocuments();
  }

  const findings = scan?.structuredFindingsJson;
  const initialDate = scan?.performedAt ? localDateTime(scan.performedAt) : localDateTime(new Date().toISOString());
  const immutable = Boolean(scan && ["reviewed", "signed", "final"].includes(scan.status));
  const lifecycleAction = scan?.status === "draft" ? "complete-for-review" : scan?.status === "complete_for_review" ? "review" : scan?.status === "reviewed" ? "sign" : null;

  return <AppShell>
    <section className="page-header ultrasound-editor-header"><div><p className="eyebrow">Patient-centered imaging</p><h1>{isNew ? "New structured ultrasound" : scan?.scanType || "Ultrasound editor"}</h1><p className="muted">{scan?.patient ? `${scan.patient.firstName ?? ""} ${scan.patient.lastName ?? ""} · ${scan.patient.medicalRecordNumber || "MRN unavailable"}` : "The selected patient and active encounter stay locked to this record."}</p></div><div className="form-actions"><Link className="button secondary compact" href={`/patients/${encodeURIComponent(patientId)}`}>Patient file</Link><Link className="button secondary compact" href="/ob-ultrasounds">Ultrasound Center</Link></div></section>
    <section className="ultrasound-editor-grid">
      <aside className="panel ultrasound-template-rail"><h2>Template</h2><label>Clinical context<select value={context} disabled={immutable} onChange={(event) => setContext(event.target.value as ScanContext)}><option value="GYN">Gynecology</option><option value="FERTILITY">Fertility</option><option value="OB">Obstetric</option></select></label><div className="template-list">{templates[context].map((name) => <button key={name} type="button" disabled={immutable} onClick={() => { const input = document.querySelector<HTMLInputElement>("#scan-type"); if (input) input.value = name; }}>{name}</button>)}</div><p className="notice safety-note">Templates structure recording only. They never diagnose, interpret, or sign.</p></aside>
      <main className="panel printable-summary">
        <div className="section-heading"><div><h2>Structured findings</h2><p className="muted">Save as a draft before review. Required-field checks run again on every lifecycle transition.</p></div>{scan ? <span className="badge">{scan.status.replaceAll("_", " ")}</span> : <span className="badge">New draft</span>}</div>
        <form className="obgyn-form-grid grouped" onSubmit={save}>
          <fieldset className="obgyn-fieldset"><legend>Scan context</legend><label>Scan date and time<input name="performedAt" type="datetime-local" defaultValue={initialDate} disabled={immutable} /></label><label>Scan type<input id="scan-type" name="scanType" defaultValue={scan?.scanType ?? ""} disabled={immutable} required /></label><label>Indication<textarea name="indication" defaultValue={scan?.indication ?? ""} disabled={immutable} /></label>{context === "FERTILITY" ? <label>Cycle day<input name="cycleDay" type="number" min="1" max="60" defaultValue={scan?.cycleDay ?? ""} disabled={immutable} /></label> : null}</fieldset>
          {context !== "OB" ? <><fieldset className="obgyn-fieldset wide"><legend>Uterus and endometrium</legend><label>Uterus position<input name="uterusPosition" defaultValue={findings?.uterus?.position ?? ""} disabled={immutable} /></label><label>Three dimensions<input name="uterusDimensions" defaultValue={findings?.uterus?.dimensions ?? ""} disabled={immutable} placeholder="Record values with units" /></label><label>Myometrium<input name="myometrium" defaultValue={findings?.uterus?.myometrium ?? ""} disabled={immutable} /></label><label>Endometrium thickness (mm)<input name="endometriumThickness" type="number" min="0" step="0.1" defaultValue={findings?.endometrium?.thicknessMm ?? ""} disabled={immutable} /></label><label>Pattern<input name="endometriumPattern" defaultValue={findings?.endometrium?.pattern ?? ""} disabled={immutable} /></label><label>Cavity<input name="endometriumCavity" defaultValue={findings?.endometrium?.cavity ?? ""} disabled={immutable} /></label></fieldset><fieldset className="obgyn-fieldset wide"><legend>Ovaries and lesions</legend><label>Right ovary<textarea name="rightOvary" defaultValue={findings?.ovaries?.right ?? ""} disabled={immutable} /></label><label>Left ovary<textarea name="leftOvary" defaultValue={findings?.ovaries?.left ?? ""} disabled={immutable} /></label>{context === "FERTILITY" ? <label className="wide">Individual follicle measurements (mm)<input name="follicleMeasurements" defaultValue={findings?.ovaries?.follicleMeasurementsMm?.join(", ") ?? ""} disabled={immutable} placeholder="12, 14.5, 18" /></label> : null}<label>Stable lesion ID<input name="lesionId" defaultValue={findings?.lesions?.[0]?.id ?? ""} disabled={immutable} /></label><label>Location<input name="lesionLocation" defaultValue={findings?.lesions?.[0]?.location ?? ""} disabled={immutable} /></label><label>FIGO classification<input name="lesionFigo" defaultValue={findings?.lesions?.[0]?.figoClassification ?? ""} disabled={immutable} /></label><label>Three dimensions<input name="lesionDimensions" defaultValue={findings?.lesions?.[0]?.dimensions ?? ""} disabled={immutable} /></label><label>Vascularity<input name="lesionVascularity" defaultValue={findings?.lesions?.[0]?.vascularity ?? ""} disabled={immutable} /></label></fieldset></> : <ObFields scan={scan} immutable={immutable} />}
          <fieldset className="obgyn-fieldset wide"><legend>Comparison and impression</legend><label>Previous-source comparison<textarea name="comparisonText" defaultValue={scan?.comparisonText ?? ""} disabled={immutable} placeholder="Reference the previous signed scan and record measured change only." /></label><label>Doctor-written impression<textarea name="impressionText" defaultValue={scan?.impressionText ?? ""} disabled={immutable} /></label></fieldset>
          <div className="ultrasound-sticky-actions no-print"><span className="muted" role="status">{status}</span><div className="form-actions"><button className="button secondary" disabled={busy || immutable} type="submit">Save draft</button>{lifecycleAction ? <button className="button" disabled={busy} type="button" onClick={() => void transition(lifecycleAction)}>{lifecycleAction.replaceAll("-", " ")}</button> : null}{scan && ["signed", "final"].includes(scan.status) ? <button className="button" disabled={busy} type="button" onClick={() => void amend()}>Create amendment</button> : null}<button className="button secondary" type="button" onClick={() => window.print()}>Print report</button></div></div>
        </form>
      </main>
      <aside className="panel ultrasound-image-rail"><h2>Images</h2><p className="muted">Images are signature-checked, metadata-sanitized, and encrypted by the patient-document service.</p>{scan ? <form className="stack" onSubmit={uploadImage}><label>Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label>Caption<input name="caption" maxLength={180} /></label><button className="button secondary" disabled={busy} type="submit">Upload image</button></form> : <p className="empty-state compact">Save the draft before adding images.</p>}<SecureGallery patientId={patientId} documents={documents} api={api} /></aside>
    </section>
  </AppShell>;
}

function ObFields({ scan, immutable }: { scan: Scan | null; immutable: boolean }) { return <><fieldset className="obgyn-fieldset"><legend>Pregnancy and fetus</legend><label>Gestational age display<input name="gestationalAgeDisplay" defaultValue={scan?.gestationalAgeDisplay ?? ""} disabled={immutable} /></label><label>Weeks<input name="gestationalAgeWeeks" type="number" min="0" max="45" defaultValue={scan?.gestationalAgeWeeks ?? ""} disabled={immutable} /></label><label>Days<input name="gestationalAgeDays" type="number" min="0" max="6" defaultValue={scan?.gestationalAgeDays ?? ""} disabled={immutable} /></label><label>Fetal heart rate<input name="fetalHeartRateBpm" type="number" min="40" max="240" defaultValue={scan?.fetalHeartRateBpm ?? ""} disabled={immutable} /></label><label>Fetal heart note<input name="fetalHeartText" defaultValue={scan?.fetalHeartText ?? ""} disabled={immutable} /></label></fieldset><fieldset className="obgyn-fieldset"><legend>Placenta, fluid and presentation</legend><label>Presentation<input name="presentation" defaultValue={scan?.presentation ?? ""} disabled={immutable} /></label><label>Placenta<input name="placenta" defaultValue={scan?.placenta ?? ""} disabled={immutable} /></label><label>Amniotic fluid<input name="amnioticFluid" defaultValue={scan?.amnioticFluid ?? ""} disabled={immutable} /></label></fieldset><fieldset className="obgyn-fieldset wide"><legend>Biometry and Doppler</legend><div className="obgyn-biometry">{(["bpdMm", "hcMm", "acMm", "flMm"] as const).map((key) => <label key={key}>{key.replace("Mm", "").toUpperCase()} (mm)<input name={key} type="number" min="0" step="0.1" defaultValue={scan?.[key] ?? ""} disabled={immutable} /></label>)}<label>EFW (g)<input name="efwGrams" type="number" min="0" defaultValue={scan?.efwGrams ?? ""} disabled={immutable} /></label></div><label>Doppler raw measurements / note<textarea name="dopplerNote" defaultValue={scan?.dopplerNote ?? ""} disabled={immutable} /></label></fieldset></>; }

function SecureGallery({ patientId, documents, api }: { patientId: string; documents: PatientDocument[]; api: (path: string, init?: RequestInit) => Promise<Response> }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => { let disposed = false; const created: string[] = []; void Promise.all(documents.map(async (document) => { const response = await api(`/patients/${encodeURIComponent(patientId)}/documents/${encodeURIComponent(document.id)}/download`); if (!response.ok) return; const url = URL.createObjectURL(await response.blob()); created.push(url); if (!disposed) setUrls((value) => ({ ...value, [document.id]: url })); })); return () => { disposed = true; created.forEach(URL.revokeObjectURL); }; }, [documents.map((item) => item.id).join("|")]);
  if (!documents.length) return <p className="empty-state compact">No secured images attached.</p>;
  return <div className="ultrasound-gallery">{documents.map((document) => urls[document.id] ? <a key={document.id} href={urls[document.id]} target="_blank" rel="noreferrer"><img src={urls[document.id]} alt={document.title} /><span>{document.title}</span></a> : <span key={document.id} className="muted">Loading {document.title}</span>)}</div>;
}

function text(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }
function number(form: FormData, key: string) { const raw = text(form, key); if (!raw) return undefined; const value = Number(raw); return Number.isFinite(value) ? value : undefined; }
function compact<T extends Record<string, unknown>>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== "")) as T; }
function parseMeasurements(raw: string) { if (!raw) return []; const values = raw.split(",").map((part) => Number(part.trim())); if (values.some((value) => !Number.isFinite(value) || value <= 0 || value > 100)) throw new Error("invalid"); return values; }
function localDateTime(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 16); }
