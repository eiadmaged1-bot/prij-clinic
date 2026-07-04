"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { searchMedications, listDrugFamilies, runMedicationSafetyCheck, type MedicationResult } from "../../lib/medications";
import { PregnancyLactationSafetyProfile } from "./PregnancyLactationSafetyProfile";
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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search generic name, family, class, or listed trade name" />
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
        <strong>{result.genericName || result.tradeName || result.family || result.familyName || "Medication reference"}</strong>
        <span className="badge">{result.verificationStatus ?? "needs review"}</span>
      </div>
      <dl>
        <div><dt>Generic name</dt><dd>{result.genericName || "Not listed"}</dd></div>
        <div><dt>Brand or trade</dt><dd>{result.tradeName || result.brandName || "Not listed"}</dd></div>
        <div><dt>Drug family</dt><dd>{result.family || result.familyName || "Not listed"}</dd></div>
        <div><dt>Strength and form</dt><dd>{[result.strengthText, result.dosageForm, result.route].filter(Boolean).join(" · ") || "Market variant only when listed"}</dd></div>
      </dl>
      {result.type === "generic_medication" ? <PregnancyLactationSafetyProfile medicationGenericId={result.id} /> : null}
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
      <p className="warning-text">Pregnancy and lactation profile flags are reference metadata only. They never auto-fill dose, frequency, duration, or instructions.</p>
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
      <div className="section-heading"><h2>Official Medicine Search</h2><span className="badge">Strength/form variants only</span></div>
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
        <span>{product.isDemo ? <span className="badge warning">Demo</span> : <span className={verified ? "badge accent" : "badge warning"}>{verified ? "Verified" : "Needs review"}</span>} {product.badges?.map((badge) => <CountryBadge key={badge} label={badge} />)}</span>
      </div>
      <dl>
        <div><dt>Generic name</dt><dd>{product.genericName || "Not listed"}</dd></div>
        <div><dt>Drug family</dt><dd>{product.family || "Not listed"}</dd></div>
        <div><dt>Variants</dt><dd><StrengthVariantList variants={product.variantSummary ?? []} /></dd></div>
        <div><dt>Review status</dt><dd>{verified ? "Verified" : product.verificationStatus === "verified" ? "Verified" : "Needs review"}</dd></div>
        <div><dt>Updated</dt><dd>{product.sourceFreshness ? formatDate(product.sourceFreshness) : "Not listed"}</dd></div>
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
            <span>{variant.isDemo ? <span className="badge warning">Demo</span> : <span className="badge accent">Source-tracked</span>} <CountryBadge label={String(variant.countryCode ?? "Unknown")} /></span>
            <span className={variant.verificationStatus === "verified" ? "badge accent" : "badge warning"}>{variant.verificationStatus === "verified" ? "Verified" : "Needs review"}</span>
          </div>
          <strong>{String(variant.countryCode)} · {String(variant.strengthText ?? "variant")}</strong>
          <p className="muted">{[variant.dosageForm, variant.route, variant.packageText].filter(Boolean).join(" · ") || "Market reference metadata"}</p>
          <dl>
            <div><dt>Generic/scientific name</dt><dd>{String(variant.genericName ?? "Not listed")}</dd></div>
            <div><dt>Strength/form/pack</dt><dd>{[variant.strengthText, variant.dosageForm, variant.packageText].filter(Boolean).join(" / ") || "Not listed"}</dd></div>
            <div><dt>Manufacturer</dt><dd>{String(variant.manufacturer ?? "Not listed")}</dd></div>
            <div><dt>Marketing company</dt><dd>{String(variant.marketingCompany ?? "Not listed")}</dd></div>
            <div><dt>ATC/class</dt><dd>{String(variant.atcCode ?? "Not listed")}</dd></div>
            <div><dt>Source country</dt><dd>{sourceCountryLabel(String(variant.countryCode ?? ""))}</dd></div>
            <div><dt>Data status</dt><dd>{variant.hasOfficialRowJson ? "Official data available" : "Source-tracked"}</dd></div>
            <div><dt>Updated</dt><dd>{String(variant.latestSourceLabel ?? "") || formatDate(String(variant.latestSourcePublishedAt ?? variant.sourcePublishedAt ?? variant.sourceFetchedAt ?? ""))}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export function AvailabilitySummary({ availabilities }: { availabilities: Array<Record<string, unknown>> }) {
  return <p className="muted">{availabilities.map((item) => `${item.countryCode}: ${item.variantCount}`).join(" · ") || "No availability summary yet"}</p>;
}

export function StrengthVariantList({ variants }: { variants: Array<{ countryCode?: string; strengthText?: string | null; dosageForm?: string | null; verificationStatus?: string | null }> }) {
  return <span>{variants.map((variant) => `${variant.countryCode ?? ""} ${variant.strengthText ?? ""} ${variant.dosageForm ?? ""} ${variant.verificationStatus === "verified" ? "Verified" : "Needs review"}`.trim()).join(", ") || "No variants listed"}</span>;
}

export function DrugMarketImportPanel() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState("Loading official medication status");
  useEffect(() => {
    void getDrugMarketCoverage()
      .then((data) => {
        const coverageRows = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
        setRows(coverageRows);
        setStatus(`${coverageRows.length} source coverage row(s) available`);
      })
      .catch(() => setStatus("Coverage requires admin access"));
  }, []);
  const bahrain = rows.find((row) => row.countryCode === "BHR" && String(row.sourceCode ?? "").includes("BAHRAIN_NHRA"));
  const oman = rows.find((row) => row.countryCode === "OMN" && String(row.sourceCode ?? "").includes("OMAN_MOH_REGISTERED"));
  const registryRows = [bahrain, oman];
  const officialRows = registryRows.reduce((sum, row) => sum + Number(row?.rowsImported ?? 0), 0);
  const verifiedRows = registryRows.reduce((sum, row) => sum + Number(row?.rowsVerified ?? 0), 0);
  const needsReviewRows = registryRows.reduce((sum, row) => sum + Number(row?.rowsNeedsReview ?? 0), 0);
  return (
    <section className="panel">
      <div className="section-heading"><h2>Official File Import</h2><span className="badge warning">Admin only</span></div>
      <p className="muted">Upload official or licensed source files only. Retail, fulfillment, and patient data uploads are blocked.</p>
      <p className="warning-text">{officialRows > 0 ? "Official medication rows are present and remain review-gated until verified." : "No official medication rows are available until official files are acquired and imported."}</p>
      <div className="data-list">
        <article className="data-row">
          <strong>v0.10.0 re-import status</strong>
          <dl>
            <div><dt>Coverage</dt><dd>{status}</dd></div>
            <div><dt>Current official rows</dt><dd>{String(officialRows)}</dd></div>
            <div><dt>Verified rows</dt><dd>{String(verifiedRows)}</dd></div>
            <div><dt>Needs review rows</dt><dd>{String(needsReviewRows)}</dd></div>
            <div><dt>Bahrain NHRA</dt><dd>{String(bahrain?.coverageStatus ?? "needs re-import")}</dd></div>
            <div><dt>Oman MOH</dt><dd>{String(oman?.coverageStatus ?? "needs re-import")}</dd></div>
            <div><dt>Acquisition manifest</dt><dd>Stored locally under ignored storage; check with the source-list command.</dd></div>
          </dl>
        </article>
        <article className="data-row">
          <strong>Owner import tools</strong>
          <p className="muted">Use the controlled local operator scripts from project documentation. Do not upload patient data, secrets, or unapproved source files.</p>
        </article>
        <article className="data-row">
          <strong>Workflow</strong>
          <p className="muted">Select country and source, add source URL, file date, source label, and official notes, preview the first 20 normalized rows with confidence, dry run, then commit rows into the review queue. Original official details stay protected for admin review.</p>
        </article>
        <article className="data-row">
          <strong>Accepted formats</strong>
          <p className="muted">Spreadsheet and structured text files are supported for owner-provided official source files. Document uploads are accepted only where a reviewed importer exists.</p>
        </article>
        <article className="data-row">
          <strong>Country/source intake</strong>
          <p className="muted">Egypt EDA, UAE MOHAP, Qatar MOPH, Kuwait MOH, Saudi SFDA, Bahrain NHRA, and Oman MOH use official public sources, approved integrations, or owner-provided official files only.</p>
        </article>
        <article className="data-row">
          <strong>Blocked fallback</strong>
          <p className="muted">No placeholder fallback rows are created when a public source fails or requires approval. Egypt remains official upload plus targeted lookup only; UAE remains approved integration or official upload only.</p>
        </article>
      </div>
    </section>
  );
}

export function DrugMarketCoverageDashboard() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState("Loading coverage");
  useEffect(() => { void getDrugMarketCoverage().then((data) => { setRows(Array.isArray(data) ? data as Array<Record<string, unknown>> : []); setStatus(`${Array.isArray(data) ? data.length : 0} source coverage row(s)`); }).catch(() => setStatus("Coverage requires admin access")); }, []);
  const bahrain = rows.find((row) => row.countryCode === "BHR" && String(row.sourceCode ?? "").includes("BAHRAIN_NHRA"));
  const oman = rows.find((row) => row.countryCode === "OMN" && String(row.sourceCode ?? "").includes("OMAN_MOH_REGISTERED"));
  const realRows = [bahrain, oman].reduce((sum, row) => sum + Number(row?.realRows ?? 0), 0);
  const verifiedRows = [bahrain, oman].reduce((sum, row) => sum + Number(row?.verifiedRows ?? 0), 0);
  const reviewRemaining = [bahrain, oman].reduce((sum, row) => sum + Number(row?.reviewItems ?? 0), 0);
  const highConfidenceRemaining = [bahrain, oman].reduce((sum, row) => sum + Number(row?.highConfidenceCandidates ?? 0), 0);
  const lowConfidenceBlocked = [bahrain, oman].reduce((sum, row) => sum + Number(row?.lowConfidenceBlocked ?? 0), 0);
  return (
    <section className="panel">
      <div className="section-heading"><h2>Coverage Dashboard</h2><span className="badge">Placeholders excluded</span></div>
      <p className="muted">{status}</p>
      <div className="data-list two-column">
        <article className="data-row">
          <div className="data-row-header"><strong>Export and restore</strong><span className="badge">Local CLI</span></div>
          <dl>
            <div><dt>Export status</dt><dd>Latest local export verified before handoff</dd></div>
            <div><dt>Last restore drill</dt><dd>Stored under ignored local restore-drill reports</dd></div>
            <div><dt>Placeholder rows</dt><dd>Excluded from reviewed coverage</dd></div>
          </dl>
        </article>
        <article className="data-row">
          <div className="data-row-header"><strong>Verification progress</strong><span className="badge">{String(verifiedRows)} verified</span></div>
          <dl>
            <div><dt>Real rows</dt><dd>{String(realRows)}</dd></div>
            <div><dt>Review remaining</dt><dd>{String(reviewRemaining)}</dd></div>
            <div><dt>High-confidence remaining</dt><dd>{String(highConfidenceRemaining)}</dd></div>
            <div><dt>Low-confidence blocked</dt><dd>{String(lowConfidenceBlocked)}</dd></div>
            <div><dt>Next action</dt><dd>Continue reason-required admin verification batches</dd></div>
          </dl>
        </article>
      </div>
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
              <div><dt>Placeholder rows excluded</dt><dd>{String(row.demoRowsExcluded ?? 0)}</dd></div>
              <div><dt>Freshness</dt><dd>{String(row.sourceFreshnessStatus ?? "unknown")}</dd></div>
              <div><dt>Trust level</dt><dd>{confidenceBucket(row.parserConfidenceAverage)}</dd></div>
              <div><dt>Review mix</dt><dd>{formatConfidenceBuckets(row.parserConfidenceDistribution)}</dd></div>
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
      <div className="toolbar">
        <button className={reviewStatus === "open" ? "button compact" : "button secondary compact"} onClick={() => setReviewStatus("open")} type="button">Needs review</button>
        <button className={reviewStatus === "verified" ? "button compact" : "button secondary compact"} onClick={() => setReviewStatus("verified")} type="button">Verified</button>
        <button className={reviewStatus === "" ? "button compact" : "button secondary compact"} onClick={() => setReviewStatus("")} type="button">Imported</button>
        <button className={confidence === "high" ? "button compact" : "button secondary compact"} onClick={() => setConfidence(confidence === "high" ? "" : "high")} type="button">High confidence</button>
        <button className={confidence === "low" ? "button compact" : "button secondary compact"} onClick={() => setConfidence(confidence === "low" ? "" : "low")} type="button">Low-confidence blocked</button>
      </div>
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
        <input value="" readOnly placeholder="Filter by country or source" />
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
          <option value="missing_source_metadata">Needs source check</option>
        </select>
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Review decision reason" />
        <label><input checked={highConfidenceOnly} onChange={(event) => setHighConfidenceOnly(event.target.checked)} type="checkbox" /> High-confidence candidates</label>
        <button className="button secondary compact" onClick={() => void load()} type="button">Apply</button>
      </form>
      <form className="inline-form" onSubmit={(event) => event.preventDefault()}>
        <input min={1} max={1000} type="number" value={batchLimit} onChange={(event) => setBatchLimit(Number(event.target.value) || 100)} />
        <button className="button compact" onClick={() => void verifyBatch()} type="button">Verify high-confidence batch</button>
      </form>
      <article className="data-row">
        <div className="data-row-header"><strong>Batch 4 summary</strong><span className="badge">Bahrain 300 / Oman 300</span></div>
        <p className="muted">Batch verification remains admin-only, reason-required, high-confidence only, and audited. Raw official JSON stays out of normal queue cards.</p>
      </article>
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
              <p className="muted">{item.highConfidenceCandidate ? "High confidence" : "Manual review needed"} · {friendlyMissingFields(item.missingFields)}</p>
              <dl>
                <div><dt>Country</dt><dd>{String(variant?.countryCode ?? "Not listed")}</dd></div>
                <div><dt>Generic</dt><dd>{String(variant?.genericName ?? "Not listed")}</dd></div>
                <div><dt>Strength/form</dt><dd>{[variant?.strengthText, variant?.dosageForm, variant?.route].filter(Boolean).join(" / ") || "Not listed"}</dd></div>
                <div><dt>Trust level</dt><dd>{confidenceBucket(variant?.parserConfidence)}</dd></div>
                <div><dt>Data status</dt><dd>{variant?.hasOfficialRowJson ? "Official data available" : "Source-tracked"}</dd></div>
              </dl>
              <details className="notice">
                <summary>Advanced source audit</summary>
                <p className="muted">Owner/Admin source tracking is preserved for verification, export, restore, and audit workflows.</p>
              </details>
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

function formatConfidenceBuckets(value: unknown) {
  if (!value || typeof value !== "object") return "Manual review needed";
  const buckets = value as Record<string, unknown>;
  return `High confidence ${String(buckets.gte090 ?? 0)} / Manual review needed ${String(buckets.lt060 ?? 0)}`;
}

function confidenceBucket(value: unknown) {
  const score = typeof value === "number" ? value : Number(value ?? 0);
  if (score >= 0.8) return "High confidence";
  if (score >= 0.65) return "Source-tracked";
  return "Manual review needed";
}

function friendlyMissingFields(value: unknown) {
  const fields = Array.isArray(value) ? value : [];
  if (fields.length === 0) return "No visible issues flagged";
  if (fields.some((field) => String(field).includes("generic"))) return "Needs generic name review";
  if (fields.some((field) => String(field).includes("strength") || String(field).includes("dosage_form"))) return "Needs strength/form review";
  if (fields.some((field) => String(field).includes("source"))) return "Needs source review";
  return "Manual review needed";
}

function sourceCountryLabel(countryCode: string) {
  const labels: Record<string, string> = {
    BHR: "Bahrain data",
    OMN: "Oman data",
    QAT: "Qatar data",
    KWT: "Kuwait data",
    KSA: "Saudi data",
    EG: "Egypt data",
    UAE: "UAE data"
  };
  return labels[countryCode] ?? (countryCode || "Source-tracked");
}
