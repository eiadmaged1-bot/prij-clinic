"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { searchMedications, listDrugFamilies, runMedicationSafetyCheck, type MedicationResult } from "../../lib/medications";
import {
  searchDrugMarket,
  listDrugMarketCountries,
  listDrugMarketSources,
  listDrugMarketConnectors,
  listDrugMarketReviewQueue,
  getDrugMarketCoverage,
  rejectDrugMarketVariant,
  retireDrugMarketVariant,
  verifyDrugMarketVariant,
  verifyDrugMarketBatch,
  type DrugMarketProduct
} from "../../lib/drug-market";

export function MedicationSearchBox() {
  const [query, setQuery] = useState("ACEI");
  const [results, setResults] = useState<MedicationResult[]>([]);
  const [status, setStatus] = useState("Ready");

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setStatus("Searching");
    try {
      const data = await searchMedications(query);
      setResults(data.results);
      setStatus(`${data.results.length} result(s)`);
    } catch {
      setStatus("Sign in with a clinical account to search");
    }
  }

  useEffect(() => {
    void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Medication Search</h2>
          <p className="muted">Generic, brand, trade, family, herbal, strength, and form lookup for clinician review.</p>
        </div>
        <span className="badge warning">Doctor approval required</span>
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ACEI, beta blocker, NSAID, or demo trade name" />
        <button className="button" type="submit">Search</button>
      </form>
      <p className="muted">{status}</p>
      <div className="card-grid">
        {results.map((result) => <MedicationResultCard key={`${result.type}-${result.id}`} result={result} />)}
      </div>
    </section>
  );
}

export function MedicationResultCard({ result }: { result: MedicationResult }) {
  return (
    <article className="data-row">
      <div className="data-row-header">
        <strong>{result.genericName || result.tradeName || result.family || "Medication reference"}</strong>
        <span className="badge">{result.verificationStatus ?? "needs review"}</span>
      </div>
      <dl>
        <div><dt>Generic name</dt><dd>{result.genericName || "Not listed"}</dd></div>
        <div><dt>Brand or trade</dt><dd>{result.tradeName || result.brandName || "Not listed"}</dd></div>
        <div><dt>Drug family</dt><dd>{result.family || "Not listed"}</dd></div>
        <div><dt>Strength and form</dt><dd>{[result.strengthText, result.dosageForm, result.route].filter(Boolean).join(" · ") || "Market variant only when listed"}</dd></div>
      </dl>
    </article>
  );
}

export function DrugFamilyBrowser() {
  const [families, setFamilies] = useState<Array<{ id: string; code: string; displayName: string; verificationStatus: string }>>([]);
  useEffect(() => { void listDrugFamilies().then(setFamilies).catch(() => setFamilies([])); }, []);
  return (
    <section className="panel">
      <div className="section-heading"><h2>Drug Families</h2><span className="badge">Taxonomy</span></div>
      <div className="chip-list">
        {families.map((family) => <span className="badge" key={family.id}>{family.displayName}</span>)}
      </div>
    </section>
  );
}

export function MedicationProfileCard() {
  return <section className="panel"><h2>Medication Profile</h2><p className="muted">Profiles show labels and review flags only after source verification. They do not provide self-use directions.</p></section>;
}

export function MedicationSafetyPanel({ patientId }: { patientId?: string }) {
  const [status, setStatus] = useState("No check run");
  async function runCheck() {
    try {
      const result = await runMedicationSafetyCheck({ patientId, medications: [{ displayName: "Demo herbal supplement", family: "herbal/supplement" }] }) as { alerts?: Array<{ severity: string }> };
      setStatus(`Draft safety review created with ${result.alerts?.length ?? 0} alert(s)`);
    } catch {
      setStatus("Safety review requires Doctor, Admin, or Owner access");
    }
  }
  return (
    <section className="panel">
      <div className="section-heading"><h2>Medication Safety</h2><SafetyAlertBadge severity="major" /></div>
      <p className="muted">Draft alerts support clinician review only. They never edit or sign a prescription.</p>
      <button className="button" onClick={runCheck} type="button">Run Safety Check</button>
      <p className="muted">{status}</p>
    </section>
  );
}

export function PrescriptionSafetyPanel({ patientId }: { patientId?: string }) {
  const [status, setStatus] = useState("No prescription check run");
  async function runCheck() {
    try {
      const result = await runMedicationSafetyCheck({ patientId, medications: [{ displayName: "Demo prescription item", family: "prescription draft" }] }) as { alerts?: Array<{ severity: string }> };
      setStatus(`Draft prescription safety review created with ${result.alerts?.length ?? 0} alert(s)`);
    } catch {
      setStatus("Prescription safety review requires clinical access");
    }
  }
  return (
    <section className="panel">
      <div className="section-heading"><h2>Prescription Safety</h2><SafetyAlertBadge severity="major" /></div>
      <p className="muted">Prescription checks are draft safety support for the doctor. They do not prescribe, sign, or change final prescriptions.</p>
      <button className="button" onClick={runCheck} type="button">Run Prescription Check</button>
      <p className="muted">{status}</p>
    </section>
  );
}

export function SafetyAlertBadge({ severity }: { severity: string }) {
  return <span className={`badge ${severity === "critical" || severity === "major" ? "danger" : "warning"}`}>{severity} review</span>;
}

export function HerbalSearchPanel() {
  return <section className="panel"><h2>Herbal and Supplements</h2><p className="muted">Herbal records are catalog references for doctor review and interaction screening.</p><MedicationSearchBox /></section>;
}

export function PatientMedicationList() {
  return <section className="panel"><h2>Current Medications</h2><p className="muted">Active prescription, OTC, herbal, supplement, and historical entries are recorded for clinician review.</p></section>;
}

export function PatientAllergyList() {
  return <section className="panel"><h2>Allergies</h2><p className="muted">Medication, ingredient, family, herbal, and other allergies are kept visible for safety review.</p></section>;
}

export function DrugMarketSearchBox() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<DrugMarketProduct[]>([]);
  const [status, setStatus] = useState("Ready");

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setStatus("Searching");
    try {
      const data = await searchDrugMarket(query);
      setProducts(data.products);
      setStatus(`${data.products.length} product group(s)`);
    } catch {
      setStatus("Sign in to search the market catalog");
    }
  }

  useEffect(() => { void submit(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel">
      <div className="section-heading"><h2>Drug Market Search</h2><span className="badge">Strength/form variants only</span></div>
      <form className="inline-form" onSubmit={submit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trade, generic, family, ATC, strength, form, source, or country" />
        <button className="button" type="submit">Search</button>
      </form>
      <p className="muted">{status}</p>
      <div className="card-grid">{products.map((product) => <DrugMarketResultCard key={product.id} product={product} />)}</div>
    </section>
  );
}

export function DrugMarketResultCard({ product }: { product: DrugMarketProduct }) {
  const verified = product.variantSummary?.some((variant) => variant.verificationStatus === "verified");
  return (
    <article className="data-row">
      <div className="data-row-header">
        <strong>{product.tradeName}</strong>
        <span>{product.isDemo ? <span className="badge warning">Demo</span> : <span className={verified ? "badge accent" : "badge warning"}>{verified ? "Verified official row" : "Needs review"}</span>} {product.badges?.map((badge) => <CountryBadge key={badge} label={badge} />)}</span>
      </div>
      <dl>
        <div><dt>Generic name</dt><dd>{product.genericName || "Not listed"}</dd></div>
        <div><dt>Drug family</dt><dd>{product.family || "Not listed"}</dd></div>
        <div><dt>Variants</dt><dd><StrengthVariantList variants={product.variantSummary ?? []} /></dd></div>
        <div><dt>Review status</dt><dd>{verified ? "verified row present" : product.verificationStatus ?? "needs review"}</dd></div>
        <div><dt>Source freshness</dt><dd>{product.sourceFreshness ? formatDate(product.sourceFreshness) : "Not imported yet"}</dd></div>
      </dl>
      <Link className="button secondary compact" href={`/drug-market/products/${product.id}`}>View variants</Link>
    </article>
  );
}

export function CountryBadge({ label }: { label: string }) {
  return <span className="badge accent">{label}</span>;
}

export function MarketVariantTable({ variants }: { variants: Array<Record<string, unknown>> }) {
  return (
    <div className="data-list">
      {variants.map((variant) => (
        <article className="data-row" key={String(variant.id)}>
          <div className="data-row-header">
            <span>{variant.isDemo ? <span className="badge warning">Demo</span> : <span className="badge accent">Official/source row</span>} <CountryBadge label={String(variant.countryCode ?? "Unknown")} /></span>
            <span className={variant.verificationStatus === "verified" ? "badge accent" : "badge warning"}>{variant.verificationStatus === "verified" ? "Verified" : "Needs review"}</span>
          </div>
          <strong>{String(variant.countryCode)} · {String(variant.strengthText ?? "variant")}</strong>
          <p className="muted">{[variant.dosageForm, variant.route, variant.packageText, variant.registrationNumber].filter(Boolean).join(" · ")}</p>
          <dl>
            <div><dt>Generic/scientific name</dt><dd>{String(variant.genericName ?? "Not listed")}</dd></div>
            <div><dt>Strength/form/pack</dt><dd>{[variant.strengthText, variant.dosageForm, variant.packageText].filter(Boolean).join(" / ") || "Not listed"}</dd></div>
            <div><dt>Manufacturer</dt><dd>{String(variant.manufacturer ?? "Not listed")}</dd></div>
            <div><dt>Marketing company</dt><dd>{String(variant.marketingCompany ?? "Not listed")}</dd></div>
            <div><dt>ATC/class</dt><dd>{String(variant.atcCode ?? "Not listed")}</dd></div>
            <div><dt>Official/source price</dt><dd>{formatPrice(variant)}</dd></div>
            <div><dt>Source</dt><dd>{String(variant.sourceCode ?? variant.sourceName ?? "Not listed")}</dd></div>
            <div><dt>Source file hash</dt><dd>{String(variant.sourceFileHash ?? "Not listed")}</dd></div>
            <div><dt>Source fetched</dt><dd>{formatDate(String(variant.sourceFetchedAt ?? ""))}</dd></div>
            <div><dt>Source published label/date</dt><dd>{String(variant.latestSourceLabel ?? "") || formatDate(String(variant.latestSourcePublishedAt ?? variant.sourcePublishedAt ?? ""))}</dd></div>
            <div><dt>Source freshness</dt><dd>{String(variant.sourceFreshnessStatus ?? "unknown")}</dd></div>
            <div><dt>Parser confidence</dt><dd>{formatConfidence(variant.parserConfidence)}</dd></div>
            <div><dt>Protected official fields</dt><dd>{variant.hasOfficialRowJson ? "Available in admin review details" : "Not captured"}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export function AvailabilitySummary({ availabilities }: { availabilities: Array<Record<string, unknown>> }) {
  return <p className="muted">{availabilities.map((item) => `${item.countryCode}: ${item.variantCount}`).join(" · ") || "No availability summary yet"}</p>;
}

export function StrengthVariantList({ variants }: { variants: Array<{ countryCode?: string; strengthText?: string | null; dosageForm?: string | null; officialPriceText?: string | null; currency?: string | null; verificationStatus?: string | null; sourceCode?: string | null }> }) {
  return <span>{variants.map((variant) => `${variant.countryCode} ${variant.strengthText ?? ""} ${variant.dosageForm ?? ""}${variant.officialPriceText ? ` - official/source price ${variant.officialPriceText} ${variant.currency ?? ""}` : ""} ${variant.verificationStatus === "verified" ? "Verified" : "Needs review"} ${variant.sourceCode ?? ""}`.trim()).join(", ") || "No variants listed"}</span>;
}

export function DrugMarketImportPanel() {
  return (
    <section className="panel">
      <div className="section-heading"><h2>Official File Import</h2><span className="badge warning">Admin only</span></div>
      <p className="muted">Upload official or licensed source files only. Do not upload pharmacy stock, checkout data, or patient data.</p>
      <div className="data-list">
        <article className="data-row">
          <strong>Workflow</strong>
          <p className="muted">Select country and source, add source URL, file date, source label, and official notes, preview the first 20 normalized rows with confidence, dry run, then commit rows into the review queue. Raw official fields stay in protected admin review details.</p>
        </article>
        <article className="data-row">
          <strong>Accepted formats</strong>
          <p className="muted">XLSX, CSV, and JSON are supported for owner-provided official files. PDF is accepted where a parser exists, including current Oman-style price-list parsing.</p>
        </article>
        <article className="data-row">
          <strong>Country/source intake</strong>
          <p className="muted">Qatar MOPH, Kuwait MOH, Saudi SFDA, Egypt EDA, UAE MOHAP, Bahrain NHRA, and Oman MOH use official public sources or owner-provided official file upload paths only.</p>
        </article>
      </div>
    </section>
  );
}

export function DrugMarketCoverageDashboard() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState("Loading coverage");
  useEffect(() => { void getDrugMarketCoverage().then((data) => { setRows(Array.isArray(data) ? data as Array<Record<string, unknown>> : []); setStatus(`${Array.isArray(data) ? data.length : 0} source coverage row(s)`); }).catch(() => setStatus("Coverage requires admin access")); }, []);
  return (
    <section className="panel">
      <div className="section-heading"><h2>Coverage Dashboard</h2><span className="badge">Demo excluded</span></div>
      <p className="muted">{status}</p>
      <div className="data-list">
        {rows.slice(0, 24).map((row) => (
          <article className="data-row" key={String(row.sourceCode)}>
            <div className="data-row-header"><strong>{String(row.countryCode ?? "ALL")} - {String(row.sourceCode)}</strong><span className="badge">{String(row.coverageStatus ?? "unknown")}</span></div>
            <dl>
              <div><dt>Access</dt><dd>{String(row.sourceAccessMode ?? "unknown")}</dd></div>
              <div><dt>Rows imported</dt><dd>{String(row.rowsImported ?? 0)}</dd></div>
              <div><dt>Needs review</dt><dd>{String(row.rowsNeedsReview ?? 0)}</dd></div>
              <div><dt>Review queue</dt><dd>{String(row.reviewItemCount ?? row.reviewItems ?? 0)}</dd></div>
              <div><dt>Verified</dt><dd>{String(row.rowsVerified ?? 0)}</dd></div>
              <div><dt>Rejected/retired</dt><dd>{String(row.rowsRejected ?? 0)} / {String(row.rowsRetired ?? 0)}</dd></div>
              <div><dt>Demo rows excluded</dt><dd>{String(row.demoRowsExcluded ?? 0)}</dd></div>
              <div><dt>Freshness</dt><dd>{String(row.sourceFreshnessStatus ?? "unknown")}</dd></div>
              <div><dt>Parser confidence</dt><dd>{formatConfidence(row.parserConfidenceAverage)}</dd></div>
              <div><dt>Confidence buckets</dt><dd>{formatConfidenceBuckets(row.parserConfidenceDistribution)}</dd></div>
              <div><dt>Next action</dt><dd>{String(row.requiredNextAction ?? "Review source status")}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SourceConnectorPanel() {
  const [status, setStatus] = useState("Loading connectors");
  useEffect(() => { void listDrugMarketConnectors().then((data) => setStatus(`${Array.isArray(data) ? data.length : 0} connector(s); retail template disabled by default`)).catch(() => setStatus("Connectors require admin access")); }, []);
  return <section className="panel"><h2>Source Connectors</h2><p className="muted">{status}</p></section>;
}

export function ReviewQueuePanel() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [sources, setSources] = useState<Array<Record<string, unknown>>>([]);
  const [reason, setReason] = useState("Reviewed against official source metadata");
  const [countryCode, setCountryCode] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [reviewStatus, setReviewStatus] = useState("open");
  const [confidence, setConfidence] = useState("");
  const [missing, setMissing] = useState("");
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);
  const [batchLimit, setBatchLimit] = useState(100);
  const [status, setStatus] = useState("Loading review queue");

  const load = useCallback(async () => {
    try {
      const data = await listDrugMarketReviewQueue({
        countryCode,
        sourceCode,
        status: reviewStatus,
        confidence,
        missing,
        highConfidence: highConfidenceOnly ? "true" : ""
      });
      const rows = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
      setItems(rows);
      setStatus(`${rows.filter((item) => item.status === "open").length} open review item(s)`);
    } catch {
      setStatus("Review queue requires admin access");
    }
  }, [confidence, countryCode, highConfidenceOnly, missing, reviewStatus, sourceCode]);

  async function verifyBatch() {
    if (!countryCode || !sourceCode || reason.trim().length < 3) {
      setStatus("Choose country, source, and reason before batch verification");
      return;
    }
    setStatus("Running high-confidence batch verification");
    try {
      const result = await verifyDrugMarketBatch({ countryCode, sourceCode, limit: batchLimit, reason });
      setStatus(`Batch verified ${String((result as Record<string, unknown>).verified ?? 0)} row(s)`);
      await load();
    } catch {
      setStatus("Batch verification was denied or found no eligible rows");
    }
  }

  async function decide(variantId: unknown, action: "verify" | "reject" | "retire") {
    if (!variantId || reason.trim().length < 3) {
      setStatus("Enter a review reason before deciding");
      return;
    }
    setStatus("Saving review decision");
    try {
      if (action === "verify") await verifyDrugMarketVariant(String(variantId), reason);
      if (action === "reject") await rejectDrugMarketVariant(String(variantId), reason);
      if (action === "retire") await retireDrugMarketVariant(String(variantId), reason);
      await load();
    } catch {
      setStatus("Review decision was denied or failed");
    }
  }

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void listDrugMarketSources().then((data) => setSources(Array.isArray(data) ? data as Array<Record<string, unknown>> : [])).catch(() => setSources([])); }, []);

  return (
    <section className="panel">
      <div className="section-heading"><h2>Review Queue</h2><span className="badge warning">Reason required</span></div>
      <p className="muted">{status}</p>
      <form className="inline-form" onSubmit={(event) => event.preventDefault()}>
        <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
          <option value="">All countries</option>
          <option value="BHR">Bahrain</option>
          <option value="OMN">Oman</option>
          <option value="QAT">Qatar</option>
          <option value="KWT">Kuwait</option>
          <option value="KSA">Saudi</option>
          <option value="EG">Egypt</option>
          <option value="UAE">UAE</option>
        </select>
        <select value={sourceCode} onChange={(event) => setSourceCode(event.target.value)}>
          <option value="">All sources</option>
          {sources.map((source) => <option key={String(source.code)} value={String(source.code)}>{String(source.countryCode ?? "ALL")} - {String(source.code)}</option>)}
        </select>
        <input value="" readOnly placeholder="Import run filter appears in row preview" />
        <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}>
          <option value="open">Open</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="retired">Retired</option>
        </select>
        <select value={confidence} onChange={(event) => setConfidence(event.target.value)}>
          <option value="">All confidence</option>
          <option value="high">High confidence</option>
          <option value="low">Low confidence</option>
        </select>
        <select value={missing} onChange={(event) => setMissing(event.target.value)}>
          <option value="">All fields</option>
          <option value="missing_generic">Missing generic</option>
          <option value="missing_strength">Missing strength</option>
          <option value="missing_dosage_form">Missing dosage form</option>
          <option value="missing_price">Missing price</option>
          <option value="registration_number_missing">Registration missing</option>
        </select>
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Review decision reason" />
        <label><input checked={highConfidenceOnly} onChange={(event) => setHighConfidenceOnly(event.target.checked)} type="checkbox" /> High-confidence candidates</label>
        <button className="button secondary compact" onClick={() => void load()} type="button">Apply</button>
      </form>
      <form className="inline-form" onSubmit={(event) => event.preventDefault()}>
        <input min={1} max={1000} type="number" value={batchLimit} onChange={(event) => setBatchLimit(Number(event.target.value) || 100)} />
        <button className="button compact" onClick={() => void verifyBatch()} type="button">Verify high-confidence batch</button>
      </form>
      <div className="data-list">
        {items.slice(0, 100).map((item) => {
          const variant = item.variant as Record<string, unknown> | null;
          return (
            <article className="data-row" key={String(item.id)}>
              <div className="data-row-header">
                <strong>{String(variant?.tradeName ?? variant?.productTradeName ?? item.queueType ?? "Review item")}</strong>
                <span className="badge">{String(item.status ?? "open")}</span>
              </div>
              <p className="muted">{String(item.reason ?? "Official row requires review")}</p>
              <p className="muted">{item.highConfidenceCandidate ? "High-confidence candidate" : "Low-confidence or incomplete candidate"} · Missing: {((item.missingFields as string[]) ?? []).join(", ") || "none flagged"}</p>
              <dl>
                <div><dt>Country</dt><dd>{String(variant?.countryCode ?? "Not listed")}</dd></div>
                <div><dt>Import run</dt><dd>{String(variant?.importRunId ?? "Not listed")}</dd></div>
                <div><dt>Generic</dt><dd>{String(variant?.genericName ?? "Not listed")}</dd></div>
                <div><dt>Strength/form</dt><dd>{[variant?.strengthText, variant?.dosageForm, variant?.route].filter(Boolean).join(" / ") || "Not listed"}</dd></div>
                <div><dt>Registration</dt><dd>{String(variant?.registrationNumber ?? "Not listed")}</dd></div>
                <div><dt>Official/source price</dt><dd>{formatPrice(variant ?? {})}</dd></div>
                <div><dt>Parser confidence</dt><dd>{formatConfidence(variant?.parserConfidence)}</dd></div>
                <div><dt>Official row fields</dt><dd>{variant?.hasOfficialRowJson ? "Protected admin drawer available" : "Not captured"}</dd></div>
                <div><dt>Row preview</dt><dd>{[variant?.countryCode, variant?.sourceRowHash ? "row hash captured" : "", variant?.sourceFetchedAt ? "source fetched" : ""].filter(Boolean).join(" / ") || "Not listed"}</dd></div>
              </dl>
              <div className="toolbar">
                {variant?.productId ? <Link className="button secondary compact" href={`/drug-market/products/${String(variant.productId)}`}>Open profile</Link> : null}
                <button className="button compact" type="button" onClick={() => void decide(variant?.id, "verify")}>Verify</button>
                <button className="button secondary compact" type="button" onClick={() => void decide(variant?.id, "reject")}>Reject</button>
                <button className="button secondary compact" type="button" onClick={() => void decide(variant?.id, "retire")}>Retire</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function MergeCandidatePanel() {
  return <section className="panel"><h2>Merge Candidates</h2><p className="muted">Potential duplicate product groups require manual review before merging.</p></section>;
}

export function SourceAndCountrySummary() {
  const [status, setStatus] = useState("Loading sources");
  useEffect(() => {
    Promise.all([listDrugMarketCountries(), listDrugMarketSources()])
      .then(([countries, sources]) => setStatus(`${Array.isArray(countries) ? countries.length : 0} countries · ${Array.isArray(sources) ? sources.length : 0} sources`))
      .catch(() => setStatus("Source summary requires access"));
  }, []);
  return <section className="panel"><h2>Countries and Sources</h2><p className="muted">{status}</p></section>;
}

function formatDate(value?: string | null) {
  if (!value) return "Not listed";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not listed" : date.toLocaleDateString();
}

function formatConfidence(value: unknown) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "Not scored";
}

function formatPrice(variant: Record<string, unknown>) {
  const text = variant.officialPriceText ?? variant.priceText;
  const amount = variant.officialPriceAmount;
  const currency = variant.currency;
  if (text) return `${String(text)}${currency ? ` ${String(currency)}` : ""}`;
  if (amount) return `${String(amount)}${currency ? ` ${String(currency)}` : ""}`;
  return "Not listed";
}

function formatConfidenceBuckets(value: unknown) {
  if (!value || typeof value !== "object") return "Not scored";
  const buckets = value as Record<string, unknown>;
  return `>=90 ${String(buckets.gte090 ?? 0)} / >=80 ${String(buckets.gte080 ?? 0)} / >=70 ${String(buckets.gte070 ?? 0)} / >=60 ${String(buckets.gte060 ?? 0)} / <60 ${String(buckets.lt060 ?? 0)}`;
}
