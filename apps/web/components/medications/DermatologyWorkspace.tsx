"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";

type Source = { title: string; organization: string; sourceUrl?: string | null; versionLabel?: string | null };
type GenericOption = { id: string; medication: { id: string; genericName: string }; bodyAreaSuitabilityJson: unknown; pregnancyLactationText?: string | null; reviewStatus: string; source: Source };
type TopicContent = { overview?: string; typicalClinicalPattern?: string[]; importantHistoryQuestions?: string[]; suggestedExaminationFields?: string[]; bodyAreaConsiderations?: string[]; relevantInvestigations?: string[]; medicationClasses?: string[]; pregnancyLactationConsiderations?: string[] };
type Topic = { id: string; stableCode: string; nameEn: string; nameAr?: string | null; reviewStatus: string; likelyCategoriesJson: TopicContent; differentialJson: { prompts?: string[]; whenToRefer?: string[]; relatedTopics?: string[] }; redFlagsJson: unknown; nonDrugCareJson: unknown; source?: Source | null; genericOptions: GenericOption[] };

export function DermatologyWorkspace() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("Loading governed dermatology topics…");
  const filtered = useMemo(() => { const needle = query.trim().toLocaleLowerCase(); return needle ? topics.filter((topic) => `${topic.nameEn} ${topic.nameAr ?? ""} ${topic.stableCode}`.toLocaleLowerCase().includes(needle)) : topics; }, [topics, query]);
  const selected = topics.find((topic) => topic.id === selectedId) ?? null;
  const selectedIndex = filtered.findIndex((topic) => topic.id === selectedId);

  useEffect(() => { void load(); }, []);
  async function load() {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/dermatology/atlas`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    if (!response?.ok) return setStatus("Dermatology knowledge is unavailable for this role. Retry from this page.");
    const body = await response.json() as { conditions?: Topic[]; total?: number };
    setTopics(body.conditions ?? []); setStatus(`${body.total ?? 0} source-linked topics. Local clinical review is still required.`);
  }

  function open(topic: Topic) { setSelectedId(topic.id); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function move(offset: number) { if (!filtered.length) return; const next = filtered[(selectedIndex + offset + filtered.length) % filtered.length]; if (next) open(next); }

  return <section className="dermatology-workspace" dir="auto">
    <div className="panel pharmacology-search-sticky"><label htmlFor="dermatology-search"><strong>Dermatology search · بحث الأمراض الجلدية</strong></label><div className="inline-form"><input id="dermatology-search" dir="auto" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(""); }} placeholder="Topic, symptom, or body area · الموضوع أو العرض أو المنطقة" /><button className="button secondary" type="button" onClick={() => { setQuery(""); setSelectedId(""); }}>Reset</button></div><p className="muted" role="status">{status}</p></div>
    <p className="notice safety-note"><strong>Assessment first.</strong> This workspace never diagnoses or selects treatment. Review red flags and escalation before medicine classes; external genital skin, mucosa, groin fold, axilla, inner thigh, and facial skin require distinct site safeguards, especially during pregnancy.</p>
    {selected ? <TopicDetail topic={selected} onBack={() => setSelectedId("")} onPrevious={() => move(-1)} onNext={() => move(1)} /> : <><div className="section-heading"><div><h2>Topics</h2><p className="muted">Choose a topic to open its source, review state, assessment prompts, safeguards, and navigation.</p></div><span className="badge">{filtered.length} of {topics.length}</span></div>{filtered.length ? <div className="dermatology-priority-grid">{filtered.map((topic) => <button key={topic.id} type="button" onClick={() => open(topic)}><strong>{topic.nameEn}</strong>{topic.nameAr ? <span lang="ar" dir="rtl">{topic.nameAr}</span> : null}<small>{topic.reviewStatus.replaceAll("_", " ")}</small></button>)}</div> : <p className="empty-state">No topic matches this search. Reset the search or retry loading the atlas.</p>}</>}
  </section>;
}

function TopicDetail({ topic, onBack, onPrevious, onNext }: { topic: Topic; onBack: () => void; onPrevious: () => void; onNext: () => void }) {
  const content = topic.likelyCategoriesJson ?? {};
  return <article className="dermatology-topic-detail">
    <nav className="form-actions dermatology-topic-nav" aria-label="Dermatology topic navigation"><button className="button secondary compact" type="button" onClick={onBack}>Back to topics</button><button className="button secondary compact" type="button" onClick={onPrevious}>Previous topic</button><button className="button secondary compact" type="button" onClick={onNext}>Next topic</button></nav>
    <header className="panel"><div className="section-heading"><div><p className="eyebrow">Dermatology knowledge topic</p><h2>{topic.nameEn}</h2>{topic.nameAr ? <p lang="ar" dir="rtl">{topic.nameAr}</p> : null}</div><span className="badge warning">{topic.reviewStatus.replaceAll("_", " ")}</span></div><p>{content.overview ?? "Overview awaiting local clinical review."}</p>{topic.source ? <p className="muted">Source: {topic.source.organization} · {topic.source.title} · {topic.source.versionLabel || "version not recorded"} {topic.source.sourceUrl ? <a href={topic.source.sourceUrl} target="_blank" rel="noreferrer">Open source</a> : null}</p> : <p className="warning-text">No source is linked; do not use this topic clinically.</p>}</header>
    <div className="dermatology-topic-grid">
      <TopicCard title="Red flags and escalation" value={topic.redFlagsJson} tone="danger" />
      <section className="panel"><h3>Assessment and differential</h3><h4>Typical clinical pattern</h4><Structured value={content.typicalClinicalPattern} empty="Pattern guidance is source-incomplete." /><h4>Important history questions</h4><Structured value={content.importantHistoryQuestions} empty="History prompts are source-incomplete." /><h4>Suggested examination fields</h4><Structured value={content.suggestedExaminationFields} empty="Examination prompts are source-incomplete." /><h4>Differential prompts</h4><Structured value={topic.differentialJson?.prompts} empty="Differential prompts are source-incomplete." /></section>
      <TopicCard title="Non-drug care" value={topic.nonDrugCareJson} />
      <section className="panel"><h3>Reviewed generic options</h3><p className="muted">No universal treatment is implied.</p><Structured value={content.medicationClasses} empty="No source-reviewed medication class is published." />{topic.genericOptions.length ? topic.genericOptions.map((option) => <article className="data-row" key={option.id}><strong>{option.medication.genericName}</strong><span className="badge">{option.reviewStatus.replaceAll("_", " ")}</span><small>Source: {option.source.title}</small><Link href={`/prescriptions?medicationGenericId=${encodeURIComponent(option.medication.id)}`}>Open in prescription draft</Link></article>) : <p className="muted">No medicine is approved from this topic. Browse the Drug Atlas and review the patient context manually.</p>}<Link className="button secondary compact" href="/medications/search">Open Drug Atlas search</Link></section>
      <TopicCard title="Body-area considerations" value={content.bodyAreaConsiderations} />
      <TopicCard title="Relevant investigations" value={content.relevantInvestigations} />
      <TopicCard title="Pregnancy and lactation" value={content.pregnancyLactationConsiderations} />
      <TopicCard title="When to refer" value={topic.differentialJson?.whenToRefer} />
      <TopicCard title="Related topics" value={topic.differentialJson?.relatedTopics} />
    </div>
  </article>;
}

function TopicCard({ title, value, tone }: { title: string; value: unknown; tone?: "danger" }) { return <section className={`panel dermatology-topic-card ${tone ?? ""}`}><h3>{title}</h3><Structured value={value} empty="This section is source-incomplete and must not be inferred." /></section>; }
function Structured({ value, empty }: { value: unknown; empty: string }) { const items = Array.isArray(value) ? value : typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value as Record<string, unknown>).flatMap((item) => Array.isArray(item) ? item : [item]) : []; return items.length ? <ul>{items.map((item, index) => <li key={index}>{typeof item === "string" ? item : JSON.stringify(item)}</li>)}</ul> : <p className="muted">{empty}</p>; }
