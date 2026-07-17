"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useI18n } from "@/i18n/useI18n";

type Source = { title: string; organization: string; sourceUrl?: string | null; versionLabel?: string | null; publicationState?: string | null; retrievedAt?: string | null };
type GenericOption = { id: string; medication: { id: string; genericName: string }; bodyAreaSuitabilityJson: unknown; pregnancyLactationText?: string | null; reviewStatus: string; source: Source };
type TopicContent = { overview?: string; typicalClinicalPattern?: string[]; importantHistoryQuestions?: string[]; suggestedExaminationFields?: string[]; bodyAreaConsiderations?: string[]; relevantInvestigations?: string[]; medicationClasses?: string[]; pregnancyLactationConsiderations?: string[] };
type Topic = { id: string; stableCode: string; nameEn: string; nameAr?: string | null; reviewStatus: string; likelyCategoriesJson: TopicContent; differentialJson: { prompts?: string[]; whenToRefer?: string[]; relatedTopics?: string[] }; redFlagsJson: unknown; nonDrugCareJson: unknown; source?: Source | null; genericOptions: GenericOption[] };

export function DermatologyWorkspace() {
  const { t, language, direction } = useI18n(); 
  const [topics, setTopics] = useState<Topic[]>([]); 
  const [query, setQuery] = useState(""); 
  const [category, setCategory] = useState("All"); 
  const [bodyZone, setBodyZone] = useState("All");
  const [selectedId, setSelectedId] = useState(""); 
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => { 
    const needle = query.trim().toLocaleLowerCase(); 
    return topics.filter((topic) => {
      const matchCategory = category === "All" || topicCategory(topic.stableCode) === category;
      const matchZone = bodyZone === "All" || matchesBodyZone(topic, bodyZone);
      const matchSearch = !needle || `${topic.nameEn} ${topic.nameAr ?? ""} ${topic.stableCode}`.toLocaleLowerCase().includes(needle);
      return matchCategory && matchZone && matchSearch;
    }); 
  }, [topics, query, category, bodyZone]);
  const selected = topics.find((topic) => topic.id === selectedId) ?? null; const selectedIndex = filtered.findIndex((topic) => topic.id === selectedId);
  useEffect(() => { void load(); }, []);
  async function load() { const token = sessionStorage.getItem("prijClinicToken"); const response = await fetch(`${getApiBaseUrl()}/dermatology/atlas`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null); if (!response?.ok) return setStatus(t("noDermatologyTopicMatches")); const body = await response.json() as { conditions?: Topic[]; total?: number }; setTopics(body.conditions ?? []); setStatus(`${body.total ?? 0} ${t("localClinicalReviewRequired")}`); }
  function open(topic: Topic) { setSelectedId(topic.id); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function move(offset: number) { if (!filtered.length) return; const next = filtered[(selectedIndex + offset + filtered.length) % filtered.length]; if (next) open(next); }
  return <section className="dermatology-workspace" dir={direction}>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/dermatology">Dermatology home</Link>{selected ? <><span>/</span><span>{selected.nameEn}</span></> : null}</nav>
    <div className="panel pharmacology-search-sticky">
      <label htmlFor="dermatology-search"><strong>{t("dermatologySearch")}</strong></label>
      <div className="inline-form">
        <input id="dermatology-search" dir="auto" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(""); }} placeholder={t("dermatologySearch")} />
        <button className="button secondary" type="button" onClick={() => { setQuery(""); setCategory("All"); setBodyZone("All"); setSelectedId(""); }}>{t("reset")}</button>
      </div>
      <div className="clinical-chip-row" aria-label="Body map zones">
        {["All", "Face", "Scalp", "Trunk", "Arms", "Legs", "Hands/Feet", "Intertriginous/Folds", "Genital"].map((item) => <button className={`badge clickable-chip ${bodyZone === item ? "active" : ""}`} type="button" key={`zone-${item}`} onClick={() => { setBodyZone(item); setSelectedId(""); }}>{item}</button>)}
      </div>
      <div className="clinical-chip-row" aria-label="Dermatology categories">
        {["All", "Inflammatory", "Infection", "Hair and pigment", "Vulvar", "Pregnancy", "Urgent safety", "Autoimmune", "Neoplastic/Malignant", "Pediatric", "Systemic manifestations", "Mucosal/Oral"].map((item) => <button className={`badge clickable-chip ${category === item ? "active" : ""}`} type="button" key={item} onClick={() => { setCategory(item); setSelectedId(""); }}>{item}</button>)}
      </div>
      <p className="muted" role="status">{status}</p>
    </div>
    <p className="notice safety-note"><strong>{t("assessmentFirst")}.</strong> {t("dermatologySafety")}</p>
    {selected ? <TopicDetail topic={selected} onBack={() => setSelectedId("")} onPrevious={() => move(-1)} onNext={() => move(1)} /> : <><div className="section-heading"><div><h2>{t("topics")}</h2><p className="muted">{t("chooseDermatologyTopic")}</p></div><span className="badge">{filtered.length} / {topics.length}</span></div>{filtered.length ? <div className="dermatology-priority-grid">{filtered.map((topic) => <button key={topic.id} type="button" onClick={() => open(topic)}><strong>{language === "ar" && topic.nameAr ? topic.nameAr : topic.nameEn}</strong>{language !== "ar" && topic.nameAr ? <span lang="ar" dir="rtl">{topic.nameAr}</span> : null}<small>{topic.reviewStatus.replaceAll("_", " ")}</small></button>)}</div> : <p className="empty-state">{t("noDermatologyTopicMatches")}</p>}</>}
  </section>;
}

function TopicDetail({ topic, onBack, onPrevious, onNext }: { topic: Topic; onBack: () => void; onPrevious: () => void; onNext: () => void }) {
  const { t, language } = useI18n(); const content = topic.likelyCategoriesJson ?? {};
  return <article className="dermatology-topic-detail"><nav className="form-actions dermatology-topic-nav" aria-label={t("dermatologyKnowledgeTopic")}><button className="button secondary compact" type="button" onClick={onBack}>{t("backToTopics")}</button><button className="button secondary compact" type="button" onClick={onPrevious}>{t("previousTopic")}</button><button className="button secondary compact" type="button" onClick={onNext}>{t("nextTopic")}</button></nav>
    <header className="panel"><div className="section-heading"><div><p className="eyebrow">{t("dermatologyKnowledgeTopic")}</p><h2>{language === "ar" && topic.nameAr ? topic.nameAr : topic.nameEn}</h2>{language !== "ar" && topic.nameAr ? <p lang="ar" dir="rtl">{topic.nameAr}</p> : null}</div><span className="badge">{publicationLabel(topic.reviewStatus)}</span></div><p>{content.overview ?? t("sourceIncomplete")}</p>{topic.source ? <p className="muted">{t("sourceLabel")}: {topic.source.organization} · {topic.source.title} · {topic.source.versionLabel || "—"}{topic.source.retrievedAt ? ` · retrieved ${new Date(topic.source.retrievedAt).toLocaleDateString()}` : ""} {topic.source.sourceUrl ? <a href={topic.source.sourceUrl} target="_blank" rel="noreferrer">{t("openSource")}</a> : null}</p> : <p className="warning-text">{t("noSourceLinked")}</p>}</header>
    <div className="dermatology-topic-grid">
      <RedFlagsCard redFlagsJson={topic.redFlagsJson} />
      <section className="panel"><h3>{t("assessmentDifferential")}</h3><h4>{t("typicalClinicalPattern")}</h4><Structured value={content.typicalClinicalPattern} empty={t("sourceIncomplete")} /><h4>{t("importantHistoryQuestions")}</h4><Structured value={content.importantHistoryQuestions} empty={t("sourceIncomplete")} /><h4>{t("suggestedExaminationFields")}</h4><Structured value={content.suggestedExaminationFields} empty={t("sourceIncomplete")} /><h4>{t("differentialPrompts")}</h4><Structured value={topic.differentialJson?.prompts} empty={t("sourceIncomplete")} /></section>
      
      <NonDrugCareCard nonDrugCareJson={topic.nonDrugCareJson} />

      <TreatmentClassesCard content={content} genericOptions={topic.genericOptions} />
      
      <TopicCard title={t("bodyAreaConsiderations")} value={content.bodyAreaConsiderations} />
      <TopicCard title={t("relevantInvestigations")} value={content.relevantInvestigations} />
      <TopicCard title={t("pregnancyLactation")} value={content.pregnancyLactationConsiderations} />
      <TopicCard title={t("whenToRefer")} value={topic.differentialJson?.whenToRefer} />
      <TopicCard title={t("relatedTopics")} value={topic.differentialJson?.relatedTopics} />
    </div></article>;
}

function TopicCard({ title, value, tone }: { title: string; value: unknown; tone?: "danger" }) { const { t } = useI18n(); return <section className={`panel dermatology-topic-card ${tone ?? ""}`}><h3>{title}</h3><Structured value={value} empty={t("sourceIncomplete")} /></section>; }
function Structured({ value, empty }: { value: unknown; empty: string }) { const items = Array.isArray(value) ? value : typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value as Record<string, unknown>).flatMap((item) => Array.isArray(item) ? item : [item]) : []; return items.length ? <ul>{items.map((item, index) => <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>)}</ul> : <p className="muted">{empty}</p>; }
function publicationLabel(value: string) { return ({ SOURCE_VERIFIED: "Source verified", SOURCE_CONFLICT: "Source conflict", SOURCE_INCOMPLETE: "Source incomplete", CLINIC_DRAFT: "Clinic draft" } as Record<string, string>)[value] ?? "Needs clinical review"; }

function topicCategory(code: string) { 
  if (/vulvar|lichen|sensitive/.test(code)) return "Vulvar"; 
  if (/pregnancy/.test(code)) return "Pregnancy"; 
  if (/fungal|tinea|candida|scabies|bacterial|viral|infection/.test(code)) return "Infection"; 
  if (/pigment|melasma|alopecia|hirsutism|hair/.test(code)) return "Hair and pigment"; 
  if (/drug_eruptions|urticaria|anaphylaxis/.test(code)) return "Urgent safety"; 
  if (/autoimmune|lupus|sclerosis/.test(code)) return "Autoimmune";
  if (/neoplastic|malignant|melanoma|carcinoma/.test(code)) return "Neoplastic/Malignant";
  if (/pediatric|child/.test(code)) return "Pediatric";
  if (/systemic/.test(code)) return "Systemic manifestations";
  if (/mucosal|oral/.test(code)) return "Mucosal/Oral";
  return "Inflammatory"; 
}

function matchesBodyZone(topic: Topic, zone: string) {
  const content = topic.likelyCategoriesJson;
  const searchStr = `${topic.stableCode} ${JSON.stringify(content.bodyAreaConsiderations)} ${JSON.stringify(content.typicalClinicalPattern)}`.toLowerCase();
  const z = zone.toLowerCase();
  if (z === "intertriginous/folds") return searchStr.includes("intertriginous") || searchStr.includes("fold") || searchStr.includes("axill") || searchStr.includes("groin");
  if (z === "hands/feet") return searchStr.includes("hand") || searchStr.includes("feet") || searchStr.includes("foot") || searchStr.includes("palm") || searchStr.includes("sole") || searchStr.includes("plantar") || searchStr.includes("palmar");
  return searchStr.includes(z);
}

function RedFlagsCard({ redFlagsJson }: { redFlagsJson: unknown }) {
  const items = Array.isArray(redFlagsJson) ? redFlagsJson : typeof redFlagsJson === "string" ? [redFlagsJson] : redFlagsJson && typeof redFlagsJson === "object" ? Object.values(redFlagsJson as Record<string, unknown>).flatMap((item) => Array.isArray(item) ? item : [item]) : [];
  return <section className="panel dermatology-topic-card danger">
    <h3>Red Flags & Escalation</h3>
    {items.length ? <ul>{items.map((item, index) => {
      const text = typeof item === "string" ? item : JSON.stringify(item);
      const is2WW = text.toLowerCase().includes("2ww") || text.toLowerCase().includes("two week") || text.toLowerCase().includes("urgent cancer") || text.toLowerCase().includes("malignancy");
      const isSystemic = text.toLowerCase().includes("systemic") || text.toLowerCase().includes("fever") || text.toLowerCase().includes("anaphylaxis");
      return <li key={index}>
        {is2WW && <span className="badge danger">2WW Referral</span>}
        {isSystemic && <span className="badge warning">Systemic Alert</span>}
        {text}
      </li>;
    })}</ul> : <p className="muted">No source red flags recorded</p>}
  </section>;
}

function NonDrugCareCard({ nonDrugCareJson }: { nonDrugCareJson: unknown }) {
  const items = Array.isArray(nonDrugCareJson) ? nonDrugCareJson : typeof nonDrugCareJson === "string" ? [nonDrugCareJson] : nonDrugCareJson && typeof nonDrugCareJson === "object" ? Object.values(nonDrugCareJson as Record<string, unknown>).flatMap((item) => Array.isArray(item) ? item : [item]) : [];
  return <section className="panel">
    <h3>Non-Drug Care & Physical Avoidance</h3>
    <p className="muted">Moisturisers, soap substitutes, physical avoidance strategies</p>
    {items.length ? <ul>{items.map((item, index) => <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>)}</ul> : <p className="muted">No non-drug care guidelines available</p>}
  </section>;
}

function TreatmentClassesCard({ content, genericOptions }: { content: TopicContent, genericOptions: GenericOption[] }) {
  const { t } = useI18n();
  const topicals = genericOptions.filter(o => o.medication.genericName.toLowerCase().includes("topical") || o.medication.genericName.toLowerCase().includes("cream") || o.medication.genericName.toLowerCase().includes("ointment") || JSON.stringify(o.bodyAreaSuitabilityJson).includes("topical"));
  const systemic = genericOptions.filter(o => !topicals.includes(o));

  return <section className="panel">
    <h3>Reviewed Treatment Classes</h3>
    {content.medicationClasses?.length ? <div className="clinical-chip-row">{content.medicationClasses.map((value) => {
      const isPhototherapy = value.toLowerCase().includes("photo") || value.toLowerCase().includes("puvu") || value.toLowerCase().includes("uvb");
      const isSurgical = value.toLowerCase().includes("surg") || value.toLowerCase().includes("excision") || value.toLowerCase().includes("cryo");
      return <Link className={`badge clickable-chip ${isPhototherapy ? "warning" : ""} ${isSurgical ? "danger" : ""}`} key={value} href={`/medications?query=${encodeURIComponent(value.split(" — ")[0] ?? value)}`}>
        {isPhototherapy && "☀ "}
        {isSurgical && "🔪 "}
        {value}
      </Link>;
    })}</div> : <p className="muted">{t("noReviewedMedicationClass")}</p>}

    {genericOptions.length ? <>
      {topicals.length > 0 && <>
        <h4>Topicals</h4>
        {topicals.map(option => <article className="data-row" key={option.id}><strong>{option.medication.genericName}</strong><span className="badge">{publicationLabel(option.reviewStatus)}</span><Link href={`/medications?query=${encodeURIComponent(option.medication.genericName)}`}>{t("openDrugAtlas")}</Link></article>)}
      </>}
      {systemic.length > 0 && <>
        <h4>Systemic</h4>
        {systemic.map(option => <article className="data-row" key={option.id}><strong>{option.medication.genericName}</strong><span className="badge">{publicationLabel(option.reviewStatus)}</span><Link href={`/medications?query=${encodeURIComponent(option.medication.genericName)}`}>{t("openDrugAtlas")}</Link></article>)}
      </>}
    </> : <p className="muted">{t("noMedicineApproved")}</p>}
    <div style={{ marginTop: "1rem" }}><Link className="button secondary compact" href="/medications">{t("openDrugAtlas")}</Link></div>
  </section>;
}
