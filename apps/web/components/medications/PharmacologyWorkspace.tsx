"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { calculateMedicationFormula, getPharmacologyAtlas, getPharmacologyCoverage, getPharmacologyProfile, searchPharmacology, type ApprovedDoseFormula, type MedicationFormulaResult, type PharmacologyAtlas, type PharmacologyProfile, type PharmacologySearchResult } from "@/lib/medications";

type SummaryLevel = "Quick" | "Clinical" | "Full source";
type BrowseMode = "rooms" | "generics" | "families" | "unlinked" | "recent" | "favorites";
const profileSections = ["Quick overview", "Uses", "Mechanism", "Pharmacodynamics", "Pharmacokinetics", "Renal/hepatic", "Common adverse effects", "Serious warnings", "Interactions", "Pregnancy/lactation", "Monitoring", "Calculators", "Sources"] as const;

export function PharmacologyWorkspace() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PharmacologySearchResult[]>([]);
  const [selected, setSelected] = useState<PharmacologyProfile | null>(null);
  const [status, setStatus] = useState("Loading clinical rooms…");
  const [atlas, setAtlas] = useState<PharmacologyAtlas | null>(null);
  const [coverage, setCoverage] = useState<Record<string, number> | null>(null);
  const [roomName, setRoomName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [level, setLevel] = useState<SummaryLevel>("Quick");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [browseMode, setBrowseMode] = useState<BrowseMode>("rooms");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setFavoriteIds(JSON.parse(localStorage.getItem("prij:pharmacology:favorites") ?? "[]") as string[]); } catch { setFavoriteIds([]); }
    void Promise.all([getPharmacologyAtlas(), getPharmacologyCoverage()]).then(([atlasData, coverageData]) => {
      setAtlas(atlasData);
      setCoverage(coverageData.profiles);
      setStatus(`${atlasData.totals.generics} generics across ${atlasData.totals.families} preserved families. Content coverage is incomplete.`);
    }).catch(() => setStatus("Clinical rooms could not be loaded. Retry by reopening Pharmacology Atlas."));
  }, []);

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

  function closeProfile() { setSelected(null); setOpenSection(null); window.requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true })); }
  function toggleFavorite(id: string) { setFavoriteIds((current) => { const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]; localStorage.setItem("prij:pharmacology:favorites", JSON.stringify(next)); return next; }); }
  const groupedResults = results.reduce<Record<string, PharmacologySearchResult[]>>((groups, result) => { (groups[result.family || "Other generics"] ??= []).push(result); return groups; }, {});

  return <section className="pharmacology-workspace">
    <form className="panel pharmacology-search-sticky" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="pharmacology-search"><strong>Universal pharmacology search</strong></label>
      <div className="inline-form"><input dir="auto" id="pharmacology-search" ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search generic medicine, family, mechanism, spectrum… · ابحث بالاسم العلمي أو العائلة أو الآلية…" /><button className="button" type="submit">Search · بحث</button></div>
      <small className="muted">Search generic medicine, family, mechanism or target text, spectrum, indication where recorded, adverse effect, and renal/hepatic property.</small>
      <p className="muted">{status}</p>
    </form>
    {atlas ? <section className="panel pharmacology-coverage" aria-label="Pharmacology content coverage"><div className="section-heading"><div><h2>Content coverage</h2><p className="muted">Preserved catalog; not a complete or fully verified formulary.</p></div><span className="badge">{atlas.totals.generics} generics · {atlas.totals.families} families</span></div><p className="muted">Linked generics: {atlas.totals.linkedGenerics} · Unlinked: {atlas.totals.unlinkedGenerics} ({atlas.totals.unlinkedRate}%){coverage ? ` · Mechanism: ${coverage.mechanism ?? 0} · Pregnancy/lactation: ${coverage.pregnancyLactation ?? 0} · Renal: ${coverage.renal ?? 0}` : ""}</p></section> : null}
    {atlas ? <nav className="pharmacology-directory-tabs" aria-label="Pharmacology directory views">{([['rooms', 'Clinical rooms'], ['generics', 'Browse all generics'], ['families', 'Browse all families'], ['unlinked', 'Unlinked generics'], ['recent', 'Recently reviewed'], ['favorites', 'Favorites']] as Array<[BrowseMode, string]>).map(([mode, label]) => <button className={browseMode === mode ? "active" : ""} type="button" key={mode} onClick={() => { setBrowseMode(mode); setRoomName(""); setFamilyId(""); }}>{label}</button>)}</nav> : null}
    {atlas ? <section className="pharmacology-browse-lenses" aria-label="Alternative browse views"><strong>Browse by:</strong>{atlas.browseViews.map((view) => <button className="badge clickable-chip" key={view} type="button" onClick={() => { setQuery(view); setRoomName(""); setFamilyId(""); }}>{view}</button>)}</section> : null}
    {!query.trim() && atlas && browseMode === "rooms" ? <AtlasBrowser atlas={atlas} roomName={roomName} familyId={familyId} onRoom={(name) => { setRoomName(name); setFamilyId(""); }} onFamily={setFamilyId} onGeneric={(generic) => void openProfile(generic)} /> : null}
    {!query.trim() && atlas && browseMode !== "rooms" ? <AtlasDirectory atlas={atlas} mode={browseMode} favoriteIds={favoriteIds} onGeneric={(generic) => void openProfile(generic)} /> : null}
    {results.length ? <p className="warning-text">Local susceptibility/culture review remains required. Spectrum terms never imply guaranteed susceptibility.</p> : null}
    {query.trim() ? <div className="pharmacology-result-list">{Object.entries(groupedResults).map(([family, generics]) => <section className="pharmacology-family-group" key={family}><h2>{family}</h2>{generics.map((result) => <article className="panel pharmacology-quick-card" key={result.id}>
      <div><h2>{result.genericName}</h2><p className="muted">{result.family || "Family not linked"} · {result.pharmacologicClass || "Class being completed"}</p></div>
      <p>{result.profileCompleteness > 0 ? "Source-linked profile sections are available for doctor review." : "Profile sections being completed"}</p><p className="muted">Why matched: {result.matchReason}</p>
      {result.spectrumMatches?.length ? <div className="spectrum-match-list">{result.spectrumMatches.map((match) => <span className="badge" key={match.label}>{match.label}: {match.coverage}</span>)}</div> : null}
      <button className="button secondary compact" type="button" onClick={() => void openProfile(result)}>Open profile</button>
    </article>)}</section>)}</div> : null}
    {selected ? <div className="pharmacology-profile-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeProfile(); }}><aside className="pharmacology-profile-panel" role="dialog" aria-modal="true" aria-label={`${selected.genericName} pharmacology profile`}>
      <header><div><p className="eyebrow">Generic medication profile</p><h2>{selected.genericName}</h2><p className="muted">{selected.family || "Family not linked"} · {selected.pharmacologicClass || selected.className || "Class not reviewed"}</p></div><button className="button secondary compact" type="button" onClick={closeProfile} aria-label="Close profile">Close</button></header>
      <nav className="summary-level-switch" aria-label="Summary level">{(["Quick", "Clinical", "Full source"] as SummaryLevel[]).map((item) => <button className={level === item ? "active" : ""} key={item} type="button" onClick={() => setLevel(item)}>{item}</button>)}</nav>
      <p className="notice">Assistive reference only. Doctor review is required; this profile does not diagnose, select treatment, prescribe, or dose.</p>
      <div className="pharmacology-profile-actions"><Link href={`/clinical-tags?medication=${encodeURIComponent(selected.genericName)}`}>View patient cohort</Link><Link href={`/prescriptions?medicationGenericId=${selected.id}`}>Add generic to active prescription draft</Link><button type="button" onClick={() => toggleFavorite(selected.id)}>{favoriteIds.includes(selected.id) ? "Remove from favorites" : "Add to favorites"}</button></div>
      <div className="pharmacology-accordion">{profileSections.map((section) => <section key={section}><button aria-expanded={openSection === section} type="button" onClick={() => setOpenSection((current) => current === section ? null : section)}>{section}<span className="badge">{selected.sectionStatuses?.[section] ?? "Source incomplete"}</span><span>{openSection === section ? "−" : "+"}</span></button>{openSection === section ? <ProfileSectionContent profile={selected} section={section} level={level} /> : null}</section>)}</div>
    </aside></div> : null}
  </section>;
}

function AtlasDirectory({ atlas, mode, favoriteIds, onGeneric }: { atlas: PharmacologyAtlas; mode: Exclude<BrowseMode, "rooms">; favoriteIds: string[]; onGeneric: (generic: PharmacologySearchResult) => void }) {
  if (mode === "families") return <section className="panel atlas-level"><div className="section-heading"><h2>All medication families</h2><span className="badge">{atlas.familyDirectory.length}</span></div><div className="atlas-family-grid">{atlas.familyDirectory.filter((family) => family.genericCount > 0).map((family) => <article className="data-row" key={family.id}><strong>{family.name}</strong><span>{family.genericCount} linked generics</span></article>)}</div>{atlas.totals.familiesBeingCompleted ? <details><summary>Content being completed ({atlas.totals.familiesBeingCompleted} zero-member families)</summary><div className="clinical-chip-row">{atlas.familyDirectory.filter((family) => family.genericCount === 0).map((family) => <span className="badge" key={family.id}>{family.name}</span>)}</div></details> : null}</section>;
  const generics = mode === "unlinked" ? atlas.unlinkedGenerics : mode === "recent" ? atlas.recentlyReviewed : mode === "favorites" ? atlas.allGenerics.filter((generic) => favoriteIds.includes(generic.id)) : atlas.allGenerics;
  const title = mode === "unlinked" ? "Unlinked generics" : mode === "recent" ? "Recently reviewed" : mode === "favorites" ? "Favorite generics" : "All generics";
  return <section className="panel atlas-level"><div className="section-heading"><h2>{title}</h2><span className="badge">{generics.length}</span></div>{generics.length ? <div className="atlas-generic-grid">{generics.map((generic) => <article className="data-row" key={generic.id}><strong>{generic.genericName}</strong><span className="muted">{generic.family || "Family not linked"} · {generic.pharmacologicClass || "Class being completed"}</span><p>{generic.profileCompleteness > 0 ? "Source-linked sections available" : "Profile sections being completed"}</p><button className="button secondary compact" type="button" onClick={() => onGeneric(generic)}>Open profile</button></article>)}</div> : <p className="empty-state compact">No records in this view.</p>}</section>;
}

function AtlasBrowser({ atlas, roomName, familyId, onRoom, onFamily, onGeneric }: { atlas: PharmacologyAtlas; roomName: string; familyId: string; onRoom: (name: string) => void; onFamily: (id: string) => void; onGeneric: (generic: PharmacologySearchResult) => void }) {
  const room = atlas.rooms.find((item) => item.name === roomName);
  const family = room?.families.find((item) => item.id === familyId);
  if (family) return <section className="panel atlas-level"><button className="button secondary compact" type="button" onClick={() => onFamily("")}>← {room?.name}</button><div className="section-heading"><h2>{family.name}</h2><span className="badge">{family.generics.length} generics</span></div><div className="atlas-generic-grid">{family.generics.map((generic) => <article className="data-row" key={generic.id}><strong>{generic.genericName}</strong><span className="muted">{generic.family} · {generic.pharmacologicClass || "Class being completed"}</span><p>Profile sections being completed</p><button className="button secondary compact" type="button" onClick={() => onGeneric(generic)}>Open profile</button></article>)}</div></section>;
  if (room) return <section className="panel atlas-level"><button className="button secondary compact" type="button" onClick={() => onRoom("")}>← Clinical rooms</button><div className="section-heading"><h2>{room.name}</h2><span className="badge">{room.familyCount} families · {room.genericCount} linked generics</span></div><div className="atlas-family-grid">{room.families.map((item) => <button className="data-row" key={item.id} type="button" onClick={() => onFamily(item.id)}><strong>{item.name}</strong><span>{item.generics.length} generics</span><small>{item.generics.slice(0, 3).map((generic) => generic.genericName).join(" · ") || "Membership being completed"}</small><small>{item.coverageState === "identity-linked-clinical-sections-may-be-incomplete" ? "Identity linked; clinical sections may be incomplete" : "Coverage incomplete"}</small></button>)}</div>{room.incompleteFamilies.length ? <details><summary>Incomplete families ({room.incompleteFamilies.length})</summary><div className="clinical-chip-row">{room.incompleteFamilies.map((item) => <span className="badge" key={item.id}>{item.name}</span>)}</div></details> : null}</section>;
  return <section><div className="section-heading"><div><p className="eyebrow">Explore clinical rooms</p><h2>Browse the preserved generic catalog</h2></div></div><div className="atlas-room-grid">{atlas.rooms.filter((item) => item.genericCount > 0).map((item) => <article className="panel atlas-room-card" key={item.name}><span className="atlas-room-icon" aria-hidden="true">{item.icon}</span><h3>{item.name}</h3><p>{item.familyCount} families · {item.genericCount} linked generics</p><small>{item.exampleFamilies.join(" · ") || "Families being mapped"}</small><button className="button secondary compact" type="button" onClick={() => onRoom(item.name)}>Enter room</button></article>)}</div></section>;
}

function ProfileSectionContent({ profile, section, level }: { profile: PharmacologyProfile; section: typeof profileSections[number]; level: SummaryLevel }) {
  if (section === "Calculators") return <MedicationCalculators formulas={profile.calculators ?? []} />;
  const limit = level === "Quick" ? 6 : level === "Clinical" ? 12 : 50;
  const items = sectionItems(profile, section).slice(0, limit);
  if (!items.length) return <p className="muted">No source-reviewed content is available for this section. Profile sections are being completed.</p>;
  return <div className="profile-section-content"><ul>{items.map((item, index) => <li key={`${section}-${index}`}>{item}</li>)}</ul>{profile.spectrum?.length && section === "Quick overview" ? <p className="warning-text">Local susceptibility/culture review remains required.</p> : null}</div>;
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
  if (section === "Quick overview") return [`Family: ${profile.family || "Not linked"}`, `Class: ${profile.pharmacologicClass || profile.className || "Being completed"}`];
  if (section === "Uses") return [];
  if (section === "Mechanism") return profile.mechanism ?? [];
  if (section === "Pharmacodynamics") return profile.pharmacodynamics ?? [];
  if (section === "Pharmacokinetics") return flattenRecords(profile.pharmacokinetics);
  if (section === "Renal/hepatic") return [...flattenRecords(profile.renal), ...flattenRecords(profile.hepatic)];
  if (section === "Common adverse effects") return (profile.adverseEffects ?? []).filter((item) => String(item.severity ?? "").toLowerCase() !== "serious").map(namedRecord);
  if (section === "Serious warnings") return [...(profile.adverseEffects ?? []).filter((item) => String(item.severity ?? "").toLowerCase() === "serious").map(namedRecord), ...(profile.contraindications ?? []).map(namedRecord), ...(profile.cautions ?? []).map(namedRecord)];
  if (section === "Interactions") return flattenRecords(profile.interactions);
  if (section === "Pregnancy/lactation") return flattenRecords(profile.pregnancyLactation);
  if (section === "Monitoring") return flattenRecords(profile.monitoring);
  if (section === "Calculators") return [];
  if (section === "Sources") return flattenRecords(profile.sources);
  return [];
}

function namedRecord(item: Record<string, unknown>) { return [item.name ?? item.riskGroup ?? item.parameter ?? "Reviewed item", item.summaryText ?? item.classification ?? item.severity].filter(Boolean).join(" — "); }
function flattenRecords(items: Array<Record<string, unknown>> | undefined) { return (items ?? []).flatMap((item) => Object.entries(item).filter(([key, value]) => !["id", "sourceId", "medicationGenericId", "createdAt", "updatedAt"].includes(key) && value !== null && typeof value !== "object").map(([key, value]) => `${label(key)}: ${String(value)}`)); }
function label(value: string) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
