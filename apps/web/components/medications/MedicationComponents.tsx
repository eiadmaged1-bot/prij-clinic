"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { searchMedications, listDrugFamilies, runMedicationSafetyCheck, type MedicationResult } from "../../lib/medications";
import { searchDrugMarket, listDrugMarketCountries, listDrugMarketSources, listDrugMarketConnectors, getDrugMarketCoverage, type DrugMarketProduct } from "../../lib/drug-market";

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
  return (
    <article className="data-row">
      <div className="data-row-header">
        <strong>{product.tradeName}</strong>
        <span>{product.isDemo ? <span className="badge warning">Demo</span> : <span className="badge accent">Official/source metadata</span>} {product.badges?.map((badge) => <CountryBadge key={badge} label={badge} />)}</span>
      </div>
      <dl>
        <div><dt>Generic name</dt><dd>{product.genericName || "Not listed"}</dd></div>
        <div><dt>Drug family</dt><dd>{product.family || "Not listed"}</dd></div>
        <div><dt>Variants</dt><dd><StrengthVariantList variants={product.variantSummary ?? []} /></dd></div>
        <div><dt>Review status</dt><dd>{product.verificationStatus ?? "needs review"}</dd></div>
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
            <span>{variant.isDemo ? <span className="badge warning">Demo</span> : <span className="badge accent">Official/source row</span>}</span>
            <span className="badge">{String(variant.verificationStatus ?? "needs_review")}</span>
          </div>
          <strong>{String(variant.countryCode)} · {String(variant.strengthText ?? "variant")}</strong>
          <p className="muted">{[variant.dosageForm, variant.route, variant.packageText, variant.registrationNumber].filter(Boolean).join(" · ")}</p>
          <dl>
            <div><dt>Manufacturer</dt><dd>{String(variant.manufacturer ?? "Not listed")}</dd></div>
            <div><dt>Marketing company</dt><dd>{String(variant.marketingCompany ?? "Not listed")}</dd></div>
            <div><dt>ATC/class</dt><dd>{String(variant.atcCode ?? "Not listed")}</dd></div>
            <div><dt>Official listed price</dt><dd>{formatPrice(variant)}</dd></div>
            <div><dt>Source date</dt><dd>{formatDate(String(variant.sourcePublishedAt ?? variant.sourceFetchedAt ?? ""))}</dd></div>
            <div><dt>Parser confidence</dt><dd>{formatConfidence(variant.parserConfidence)}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export function AvailabilitySummary({ availabilities }: { availabilities: Array<Record<string, unknown>> }) {
  return <p className="muted">{availabilities.map((item) => `${item.countryCode}: ${item.variantCount}`).join(" · ") || "No availability summary yet"}</p>;
}

export function StrengthVariantList({ variants }: { variants: Array<{ countryCode?: string; strengthText?: string | null; dosageForm?: string | null; officialPriceText?: string | null; currency?: string | null }> }) {
  return <span>{variants.map((variant) => `${variant.countryCode} ${variant.strengthText ?? ""} ${variant.dosageForm ?? ""}${variant.officialPriceText ? ` - source price ${variant.officialPriceText} ${variant.currency ?? ""}` : ""}`.trim()).join(", ") || "No variants listed"}</span>;
}

export function DrugMarketImportPanel() {
  return (
    <section className="panel">
      <div className="section-heading"><h2>Official File Import</h2><span className="badge warning">Admin only</span></div>
      <p className="muted">Only official or licensed files. Do not upload pharmacy stock, checkout, or patient data.</p>
      <div className="data-list">
        <article className="data-row">
          <strong>Workflow</strong>
          <p className="muted">Select country and source, preview mapped columns, dry run, then commit rows as imported or needs review. Raw official fields stay in protected admin review details.</p>
        </article>
        <article className="data-row">
          <strong>Accepted formats</strong>
          <p className="muted">CSV and JSON are supported now. XLSX and PDF sources are tracked and require an approved parser path or official conversion before import.</p>
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
              <div><dt>Verified</dt><dd>{String(row.rowsVerified ?? 0)}</dd></div>
              <div><dt>Demo rows excluded</dt><dd>{String(row.demoRowsExcluded ?? 0)}</dd></div>
              <div><dt>Freshness</dt><dd>{String(row.sourceFreshnessStatus ?? "unknown")}</dd></div>
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
  return <section className="panel"><h2>Review Queue</h2><p className="muted">Conflicts, duplicate candidates, low-confidence parses, and unverified imports stay visible until an authorized reviewer resolves them with a reason.</p></section>;
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
