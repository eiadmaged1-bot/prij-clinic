"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { calculateMedicationFormula, getPharmacologyProfile, searchPharmacology, type ApprovedDoseFormula, type MedicationFormulaResult, type PharmacologyProfile, type PharmacologySearchResult } from "@/lib/medications";

type SummaryLevel = "Quick" | "Clinical" | "Full source";
const profileSections = ["Clinical overview", "Mechanism", "Pharmacodynamics", "Pharmacokinetics", "Renal/Hepatic", "Common adverse effects", "Serious warnings", "Interactions", "Pregnancy/Lactation", "Monitoring", "Calculators", "Sources"] as const;

export function PharmacologyWorkspace() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PharmacologySearchResult[]>([]);
  const [selected, setSelected] = useState<PharmacologyProfile | null>(null);
  const [status, setStatus] = useState("Search generic medicine, family, mechanism, target, spectrum, indication, adverse effect, renal/hepatic property…");
  const [level, setLevel] = useState<SummaryLevel>("Quick");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = window.setTimeout(() => void searchPharmacology(query).then((data) => { setResults(data.results); setStatus(`${data.results.length} generic result(s). Trade names remain aliases only.`); }).catch(() => setStatus("Pharmacology search requires clinical access.")), 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function openProfile(result: PharmacologySearchResult) {
    const scrollY = window.scrollY;
    setStatus(`Opening ${result.genericName} profile…`);
    try { setSelected(await getPharmacologyProfile(result.id)); setOpenSection(null); setLevel("Quick"); setStatus("Profile opened. Doctor review required."); }
    catch { setStatus("This generic profile is unavailable for your role."); }
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
  }

  function closeProfile() { setSelected(null); setOpenSection(null); window.requestAnimationFrame(() => searchRef.current?.focus()); }
  const groupedResults = results.reduce<Record<string, PharmacologySearchResult[]>>((groups, result) => { (groups[result.family || "Other generics"] ??= []).push(result); return groups; }, {});

  return <section className="pharmacology-workspace">
    <form className="panel pharmacology-search-sticky" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="pharmacology-search"><strong>Pharmacology search</strong></label>
      <div className="inline-form"><input dir="auto" id="pharmacology-search" ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search generic medicine, family, mechanism, spectrum… · ابحث بالاسم العلمي أو العائلة أو الآلية…" /><button className="button" type="submit">Search · بحث</button></div>
      <p className="muted">{status}</p>
    </form>
    {results.length ? <p className="warning-text">Local susceptibility/culture review remains required. Spectrum terms never imply guaranteed susceptibility.</p> : null}
    <div className="pharmacology-result-list">{Object.entries(groupedResults).map(([family, generics]) => <section className="pharmacology-family-group" key={family}><h2>{family}</h2>{generics.map((result) => <article className="panel pharmacology-quick-card" key={result.id}>
      <div className="section-heading"><div><h2>{result.genericName}</h2><p className="muted">{result.family || "Family not linked"} · {result.pharmacologicClass || "Class not reviewed"}</p></div><span className="badge warning">{result.reviewStatus}</span></div>
      <dl><div><dt>Main use</dt><dd>{result.mainUse}</dd></div><div><dt>Key caution</dt><dd>{result.keyCaution}</dd></div><div><dt>Clearance</dt><dd>{result.clearance}</dd></div><div><dt>Why matched</dt><dd>{result.matchReason}</dd></div></dl>
      {result.spectrumMatches?.length ? <div className="spectrum-match-list">{result.spectrumMatches.map((match) => <span className="badge" key={match.label}>{match.label}: {match.coverage}</span>)}</div> : null}
      <button className="button secondary compact" type="button" onClick={() => void openProfile(result)}>Open profile</button>
    </article>)}</section>)}</div>
    {selected ? <div className="pharmacology-profile-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeProfile(); }}><aside className="pharmacology-profile-panel" role="dialog" aria-modal="true" aria-label={`${selected.genericName} pharmacology profile`}>
      <header><div><p className="eyebrow">Generic medication profile</p><h2>{selected.genericName}</h2><p className="muted">{selected.family || "Family not linked"} · {selected.pharmacologicClass || selected.className || "Class not reviewed"}</p></div><button className="button secondary compact" type="button" onClick={closeProfile} aria-label="Close profile">Close</button></header>
      <nav className="summary-level-switch" aria-label="Summary level">{(["Quick", "Clinical", "Full source"] as SummaryLevel[]).map((item) => <button className={level === item ? "active" : ""} key={item} type="button" onClick={() => setLevel(item)}>{item}</button>)}</nav>
      <p className="notice">Assistive reference only. Doctor review is required; this profile does not diagnose, select treatment, prescribe, or dose.</p>
      <div className="pharmacology-profile-actions"><Link href={`/clinical-tags?medication=${encodeURIComponent(selected.genericName)}`}>View patient cohort</Link><Link href={`/prescriptions?medicationGenericId=${selected.id}`}>Add generic to active prescription draft</Link><button type="button">Add to frequent medicines</button></div>
      <div className="pharmacology-accordion">{profileSections.map((section) => <section key={section}><button aria-expanded={openSection === section} type="button" onClick={() => setOpenSection((current) => current === section ? null : section)}>{section}<span>{openSection === section ? "−" : "+"}</span></button>{openSection === section ? <ProfileSectionContent profile={selected} section={section} level={level} /> : null}</section>)}</div>
    </aside></div> : null}
  </section>;
}

function ProfileSectionContent({ profile, section, level }: { profile: PharmacologyProfile; section: typeof profileSections[number]; level: SummaryLevel }) {
  if (section === "Calculators") return <MedicationCalculators formulas={profile.calculators ?? []} />;
  const limit = level === "Quick" ? 6 : level === "Clinical" ? 12 : 50;
  const items = sectionItems(profile, section).slice(0, limit);
  if (!items.length) return <p className="muted">No source-reviewed {section.toLowerCase()} content is available.</p>;
  return <div className="profile-section-content"><ul>{items.map((item, index) => <li key={`${section}-${index}`}>{item}</li>)}</ul>{profile.spectrum?.length && section === "Clinical overview" ? <p className="warning-text">Local susceptibility/culture review remains required.</p> : null}</div>;
}

function MedicationCalculators({ formulas }: { formulas: ApprovedDoseFormula[] }) {
  const [openFormula, setOpenFormula] = useState<string | null>(null);
  if (!formulas.length) return <p className="muted">No source-approved calculator is available for this generic medicine.</p>;
  return <div className="profile-section-content medication-calculator-list">
    <p className="warning-text">Calculation support only. Verify every input and source; doctor confirmation is required. Results never auto-prescribe.</p>
    {formulas.map((formula) => <section className="medication-calculator" key={formula.stableId}>
      <button aria-expanded={openFormula === formula.stableId} type="button" onClick={() => setOpenFormula((current) => current === formula.stableId ? null : formula.stableId)}><span>{formula.name}</span><span>{openFormula === formula.stableId ? "−" : "+"}</span></button>
      {openFormula === formula.stableId ? <MedicationCalculatorForm formula={formula} /> : null}
    </section>)}
  </div>;
}

function MedicationCalculatorForm({ formula }: { formula: ApprovedDoseFormula }) {
  const version = formula.versions[0];
  const fields = version?.inputSchemaJson.fields ?? [];
  const [result, setResult] = useState<MedicationFormulaResult | null>(null);
  const [status, setStatus] = useState("");
  if (!version) return <p className="muted">No approved version is available.</p>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setResult(null); setStatus("Calculating with the approved formula version…");
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = Object.fromEntries(fields.flatMap((field) => {
      const raw = String(data.get(field.name) ?? "").trim();
      const entries: Array<[string, unknown]> = raw ? [[field.name, field.type === "number" ? Number(raw) : raw]] : [];
      if (field.observedAtField) { const observedAt = String(data.get(field.observedAtField) ?? "").trim(); if (observedAt) entries.push([field.observedAtField, observedAt]); }
      return entries;
    }));
    try { setResult(await calculateMedicationFormula(formula.stableId, input)); setStatus("Calculated. Review the formula, rounding, limitations, and source before use."); }
    catch { setStatus("Calculation was not completed. Check all required inputs and approved ranges, then retry."); }
  }

  return <form className="medication-calculator-form" onSubmit={(event) => void submit(event)}>
    <div className="form-grid">{fields.map((field) => <label key={field.name}>{field.label ?? label(field.name)} {field.unit ? `(${field.unit})` : ""}
      {field.type === "select" ? <select name={field.name} required={field.required !== false} defaultValue=""><option value="" disabled>Select</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input name={field.name} type="number" required={field.required !== false} min={field.min} max={field.max} step="any" />}
      {field.observedAtField ? <span className="calculator-observed-at"><span>Observed at</span><input name={field.observedAtField} type="datetime-local" required /></span> : null}
    </label>)}</div>
    <button className="button compact" type="submit">Calculate draft result</button>
    <p className="muted" role="status">{status}</p>
    {result ? <dl className="calculator-governance-result">
      <div><dt>Result</dt><dd>{result.finalValue} {result.outputUnit}</dd></div><div><dt>Pre-rounding</dt><dd>{result.preRoundingValue}</dd></div><div><dt>Rounding</dt><dd>{result.roundingMethod}</dd></div><div><dt>Formula</dt><dd>{result.formula}</dd></div>
      <div><dt>Version</dt><dd>{result.version} · {result.approvalStatus}</dd></div><div><dt>Reviewed by</dt><dd>{result.reviewer.displayName}</dd></div><div className="wide"><dt>Validated population</dt><dd>{result.population}</dd></div><div className="wide"><dt>Exclusions</dt><dd>{displayStructured(result.exclusions)}</dd></div><div className="wide"><dt>Limitations</dt><dd>{result.limitations}</dd></div><div className="wide"><dt>Source</dt><dd>{result.source.organization} · {result.source.title} {result.source.versionLabel ?? ""}</dd></div>
      {result.warnings.length ? <div className="wide"><dt>Warnings</dt><dd>{result.warnings.join(" ")}</dd></div> : null}
    </dl> : null}
  </form>;
}

function displayStructured(value: unknown) { if (Array.isArray(value)) return value.map(String).join("; "); if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${label(key)}: ${String(item)}`).join("; "); return String(value || "None recorded"); }

function sectionItems(profile: PharmacologyProfile, section: typeof profileSections[number]) {
  if (section === "Clinical overview") return [`Review status: ${profile.reviewStatus}`, `Family: ${profile.family || "Not linked"}`, `Class: ${profile.pharmacologicClass || profile.className || "Not reviewed"}`];
  if (section === "Mechanism") return profile.mechanism ?? [];
  if (section === "Pharmacodynamics") return profile.pharmacodynamics ?? [];
  if (section === "Pharmacokinetics") return flattenRecords(profile.pharmacokinetics);
  if (section === "Renal/Hepatic") return [...flattenRecords(profile.renal), ...flattenRecords(profile.hepatic)];
  if (section === "Common adverse effects") return (profile.adverseEffects ?? []).filter((item) => String(item.severity ?? "").toLowerCase() !== "serious").map(namedRecord);
  if (section === "Serious warnings") return [...(profile.adverseEffects ?? []).filter((item) => String(item.severity ?? "").toLowerCase() === "serious").map(namedRecord), ...(profile.contraindications ?? []).map(namedRecord), ...(profile.cautions ?? []).map(namedRecord)];
  if (section === "Interactions") return flattenRecords(profile.interactions);
  if (section === "Pregnancy/Lactation") return flattenRecords(profile.pregnancyLactation);
  if (section === "Monitoring") return flattenRecords(profile.monitoring);
  if (section === "Calculators") return [];
  if (section === "Sources") return flattenRecords(profile.sources);
  return [];
}

function namedRecord(item: Record<string, unknown>) { return [item.name ?? item.riskGroup ?? item.parameter ?? "Reviewed item", item.summaryText ?? item.classification ?? item.severity].filter(Boolean).join(" — "); }
function flattenRecords(items: Array<Record<string, unknown>> | undefined) { return (items ?? []).flatMap((item) => Object.entries(item).filter(([key, value]) => !["id", "sourceId", "medicationGenericId", "createdAt", "updatedAt"].includes(key) && value !== null && typeof value !== "object").map(([key, value]) => `${label(key)}: ${String(value)}`)); }
function label(value: string) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
