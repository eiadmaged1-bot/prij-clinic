"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { PdfFirstPageThumbnail } from "../../components/guidelines/PdfFirstPageThumbnail";
import { useI18n } from "../../i18n/useI18n";
import { getApiBaseUrl } from "../../lib/api-base-url";
import { useSession } from "../session";
import { AppShell } from "../mvp-page";

type Tab = "documents" | "protocols" | "tools" | "favorites";
type Document = { id: string; title: string; organization: string; guidelineCode?: string | null; publicationDate?: string | null; versionLabel?: string | null; specialty: string; topic: string; tags?: string[] | null; language?: string; guidelineStatus: string; reviewStatus: string; ingestStatus: string; isFavorite?: boolean; pageCount?: number | null };
type Protocol = { id: string; code: string; title: string; sourceName: string; sourceVersion?: string | null; publicationState: string };
const clinicalAreas = ["Obstetrics", "Gynecology", "Fertility & ART", "Family Planning", "Gynecologic Oncology", "Menopause", "Emergency"];
const copy = {
  en: { title: "Guidelines Library", subtitle: "Protected, source-backed clinical documents", documents: "Documents", protocols: "Protocols", tools: "Decision Tools", favorites: "Favorites", search: "Search title, organization, code, tags or indexed PDF text", all: "All", more: "More", filters: "Filters", organization: "Organization", year: "Year", language: "Language", status: "Status", open: "Open", incomplete: "Metadata incomplete", empty: "No real PDF-backed documents match this view.", retry: "Retry", offline: "The clinic server is offline. Check the connection and retry.", denied: "You do not have permission to open the Guidelines Library.", review: "Review queue", upload: "Upload PDF", recent: "Recently opened", noProtocols: "No fully governed published protocols are available.", noTools: "No governed decision tools are published.", findTopic: "Find a topic" },
  ar: { title: "مكتبة الإرشادات", subtitle: "مستندات سريرية محمية ومرتبطة بمصادرها", documents: "المستندات", protocols: "البروتوكولات", tools: "أدوات القرار", favorites: "المفضلة", search: "ابحث بالعنوان أو الجهة أو الرمز أو الوسوم أو نص ملف PDF", all: "الكل", more: "المزيد", filters: "عوامل التصفية", organization: "الجهة", year: "السنة", language: "اللغة", status: "الحالة", open: "فتح", incomplete: "البيانات الوصفية غير مكتملة", empty: "لا توجد مستندات PDF حقيقية تطابق هذا العرض.", retry: "إعادة المحاولة", offline: "خادم العيادة غير متصل. تحقق من الاتصال ثم أعد المحاولة.", denied: "ليست لديك صلاحية لفتح مكتبة الإرشادات.", review: "قائمة المراجعة", upload: "رفع PDF", recent: "فُتحت مؤخراً", noProtocols: "لا توجد بروتوكولات منشورة ومستوفية للحوكمة.", noTools: "لا توجد أدوات قرار معتمدة ومنشورة.", findTopic: "ابحث عن موضوع" }
};

export function RealGuidelinesLibrary() {
  const { language } = useI18n(); const t = copy[language]; const { user, status } = useSession();
  const canRead = Boolean(user?.permissions.some((permission) => ["guidelines.read", "guidelines.search"].includes(permission)));
  const canUpload = Boolean(user?.permissions.includes("guidelines.upload")); const canReview = Boolean(user?.roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role)));
  const [documents, setDocuments] = useState<Document[]>([]); const [recent, setRecent] = useState<Document[]>([]); const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [tab, setTab] = useState<Tab>("documents"); const [topic, setTopic] = useState("All"); const [query, setQuery] = useState(""); const [moreOpen, setMoreOpen] = useState(false); const [moreQuery, setMoreQuery] = useState("");
  const [organization, setOrganization] = useState(""); const [year, setYear] = useState(""); const [docLanguage, setDocLanguage] = useState(""); const [docStatus, setDocStatus] = useState("");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "offline" | "error">("loading"); const [notice, setNotice] = useState(""); const [searchIds, setSearchIds] = useState<string[] | null>(null);
  const load = useCallback(async () => {
    setLoadState("loading"); setNotice("");
    try {
      const [inventory, recentBody, protocolBody] = await Promise.all([api("/guidelines/documents?limit=50"), api("/guidelines/me/recent"), api("/protocol-atlas")]);
      setDocuments(inventory.documents ?? []); setRecent(recentBody.documents ?? []); setProtocols(protocolBody.protocols ?? []); setLoadState("ready");
    } catch (error) { setLoadState(error instanceof TypeError ? "offline" : "error"); }
  }, []);
  useEffect(() => { if (canRead) void load(); }, [canRead, load]);
  const organizations = useMemo(() => [...new Set(documents.map((item) => item.organization).filter(Boolean))].sort(), [documents]);
  const moreTopics = useMemo(() => [...new Set(documents.flatMap((item) => [item.topic, item.specialty, ...(Array.isArray(item.tags) ? item.tags : [])]).filter(Boolean))].sort().filter((item) => item.toLocaleLowerCase().includes(moreQuery.toLocaleLowerCase())), [documents, moreQuery]);
  const filtered = useMemo(() => documents.filter((document) => {
    if (tab === "favorites" && !document.isFavorite) return false;
    if (searchIds && !searchIds.includes(document.id)) return false;
    const haystack = `${document.title} ${document.organization} ${document.guidelineCode ?? ""} ${document.topic} ${(document.tags ?? []).join(" ")}`.toLowerCase();
    if (query && !searchIds && !haystack.includes(query.toLowerCase())) return false;
    if (topic !== "All" && !matchesArea(document, topic)) return false;
    if (organization && document.organization !== organization) return false;
    if (year && document.publicationDate?.slice(0, 4) !== year) return false;
    if (docLanguage && document.language !== docLanguage) return false;
    return !docStatus || document.ingestStatus === docStatus || document.guidelineStatus === docStatus;
  }), [documents, docLanguage, docStatus, organization, query, searchIds, tab, topic, year]);
  async function search(event: FormEvent) { event.preventDefault(); if (!query.trim()) return setSearchIds(null); setNotice(language === "ar" ? "جارٍ البحث في النص المفهرس…" : "Searching indexed PDF text…"); try { const body = await api(`/guidelines/search?q=${encodeURIComponent(query)}&limit=50`); const needle = query.trim().toLocaleLowerCase(); const metadataMatches = documents.filter((item) => `${item.title} ${item.organization} ${item.guidelineCode ?? ""} ${item.topic} ${(item.tags ?? []).join(" ")}`.toLocaleLowerCase().includes(needle)).map((item) => item.id); setSearchIds([...new Set([...(body.results ?? []).map((result: { documentId: string }) => result.documentId), ...metadataMatches])] as string[]); setNotice(""); } catch { setNotice(t.offline); } }
  async function toggleFavorite(document: Document) { const next = !document.isFavorite; setDocuments((items) => items.map((item) => item.id === document.id ? { ...item, isFavorite: next } : item)); try { await api(`/guidelines/documents/${document.id}/favorite`, { method: next ? "POST" : "DELETE" }); } catch { setDocuments((items) => items.map((item) => item.id === document.id ? { ...item, isFavorite: !next } : item)); setNotice(t.offline); } }
  if (status === "loading") return <AppShell><LibraryState text={language === "ar" ? "جارٍ تحميل المكتبة…" : "Loading library…"} /></AppShell>;
  if (!canRead) return <AppShell><LibraryState text={t.denied} /></AppShell>;
  return <AppShell><main className="real-guidelines" dir={language === "ar" ? "rtl" : "ltr"}>
    <header className="real-guidelines-header"><div><p className="eyebrow">{language === "ar" ? "المعرفة السريرية" : "Clinical knowledge"}</p><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className="real-guideline-header-actions">{canReview ? <Link className="button secondary" href="/guidelines/review">{t.review}</Link> : null}{canUpload ? <Link className="button" href="/guidelines/upload">{t.upload}</Link> : null}</div></header>
    <form className="real-guideline-search" onSubmit={search}><span aria-hidden>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setSearchIds(null); }} placeholder={t.search} /><button type="submit">{language === "ar" ? "بحث" : "Search"}</button></form>
    <nav className="real-guideline-tabs">{([['documents',t.documents],['protocols',t.protocols],['tools',t.tools],['favorites',t.favorites]] as [Tab,string][]).map(([key,label])=><button className={tab===key?'active':''} key={key} onClick={()=>setTab(key)} type="button">{label}</button>)}</nav>
    {tab === "documents" || tab === "favorites" ? <><div className="clinical-area-strip"><button className={topic==='All'?'active':''} onClick={()=>setTopic('All')} type="button">{t.all}</button>{clinicalAreas.map((area)=><button className={topic===area?'active':''} key={area} onClick={()=>setTopic(area)} type="button">{areaLabel(area,language)}</button>)}<button onClick={()=>setMoreOpen((value)=>!value)} type="button">{t.more} ···</button></div>
    {moreOpen ? <section className="topic-panel"><input aria-label={t.findTopic} placeholder={t.findTopic} value={moreQuery} onChange={(event)=>setMoreQuery(event.target.value)} /><div>{moreTopics.map((item)=><button key={item} type="button" onClick={()=>{setTopic(item);setMoreOpen(false);}}>{item}</button>)}</div></section>:null}
    <details className="real-guideline-filters"><summary>{t.filters}</summary><div><label>{t.organization}<select value={organization} onChange={(e)=>setOrganization(e.target.value)}><option value="">{t.all}</option>{organizations.map((item)=><option key={item}>{item}</option>)}</select></label><label>{t.year}<input inputMode="numeric" value={year} onChange={(e)=>setYear(e.target.value)} /></label><label>{t.language}<select value={docLanguage} onChange={(e)=>setDocLanguage(e.target.value)}><option value="">{t.all}</option><option value="en">English</option><option value="ar">العربية</option></select></label><label>{t.status}<select value={docStatus} onChange={(e)=>setDocStatus(e.target.value)}><option value="">{t.all}</option>{["NEEDS_METADATA","NEEDS_SUMMARY","NEEDS_CORRECTION_REVIEW","NEEDS_REVIEW","ACTIVE"].map((item)=><option key={item}>{item}</option>)}</select></label></div></details>
    {loadState === "loading" ? <LibraryState text={language === "ar" ? "جارٍ تحميل المستندات…" : "Loading documents…"} /> : loadState !== "ready" ? <LibraryState text={loadState === "offline" ? t.offline : "The library could not be loaded."} action={<button onClick={()=>void load()}>{t.retry}</button>} /> : <><section className="real-guideline-card-grid">{filtered.map((document)=><DocumentCard document={document} key={document.id} t={t} language={language} onFavorite={()=>void toggleFavorite(document)} />)}</section>{!filtered.length?<LibraryState text={t.empty}/>:null}{recent.length && tab==='documents'?<section className="recent-guidelines"><h2>{t.recent}</h2><div>{recent.slice(0,5).map((item)=><Link href={`/guidelines/${item.id}`} key={item.id}>{item.title}</Link>)}</div></section>:null}</>}
    </> : null}
    {tab === "protocols" ? <section>{protocols.length ? <div className="real-guideline-card-grid">{protocols.map((protocol)=><article className="real-protocol-card" key={protocol.id}><span>{protocol.code}</span><h2>{protocol.title}</h2><p>{protocol.sourceName} · {protocol.sourceVersion ?? t.incomplete}</p><Link href={`/protocol-atlas/${protocol.id}`}>{t.open}</Link></article>)}</div>:<LibraryState text={t.noProtocols}/>}</section>:null}
    {tab === "tools" ? <LibraryState text={t.noTools}/>:null}{notice?<p className="notice" role="status">{notice}</p>:null}
  </main></AppShell>;
}

function DocumentCard({document,t,language,onFavorite}:{document:Document;t:typeof copy.en;language:"en"|"ar";onFavorite:()=>void}) {
  const metadataComplete=Boolean(document.guidelineCode&&(document.publicationDate||document.versionLabel));
  return <article className={`real-guideline-card guideline-org-${organizationAccent(document.organization)}`}>
    <Link className="real-guideline-card-link" href={`/guidelines/${document.id}`} aria-label={`${t.open}: ${document.title}`} title={document.title}>
      <PdfFirstPageThumbnail documentId={document.id} title={document.title}/>
      <div className="real-guideline-card-body">
        <span className="guideline-card-organization">{document.organization}</span>
        <h2 title={document.title}>{document.title}</h2>
        <div className="guideline-card-desktop-details">
          <p>{document.guidelineCode || t.incomplete} · {document.publicationDate ? new Date(document.publicationDate).toLocaleDateString() : document.versionLabel || t.incomplete}</p>
          <p>{document.topic}</p>
          <div className="guideline-status-line"><span>{humanStatus(document.ingestStatus,language)}</span>{!metadataComplete?<span className="warning-text">{t.incomplete}</span>:null}</div>
          <span className="button">{t.open}</span>
        </div>
      </div>
    </Link>
    <button className="guideline-favorite-overlay" aria-label={document.isFavorite?'Remove favorite':'Add favorite'} aria-pressed={document.isFavorite} onClick={onFavorite} type="button">{document.isFavorite?'★':'☆'}</button>
  </article>;
}
function organizationAccent(organization:string){const value=organization.toLocaleUpperCase();if(value.includes("RCOG")||value.includes("ROYAL COLLEGE"))return"rcog";if(value.includes("NICE")||value.includes("NATIONAL INSTITUTE"))return"nice";if(value.includes("WHO")||value.includes("WORLD HEALTH"))return"who";if(value.includes("FIGO")||value.includes("INTERNATIONAL FEDERATION"))return"figo";if(value.includes("ESHRE")||value.includes("EUROPEAN SOCIETY"))return"eshre";return"other";}
function LibraryState({text,action}:{text:string;action?:ReactNode}) { return <section className="library-state"><span aria-hidden>□</span><p>{text}</p>{action}</section>; }
function humanStatus(value:string,language:"en"|"ar"){const ar:Record<string,string>={NEEDS_METADATA:"يحتاج بيانات وصفية",NEEDS_SOURCE_PDF:"يحتاج ملف المصدر",NEEDS_SUMMARY:"يحتاج ملخصًا",NEEDS_CORRECTION_REVIEW:"يحتاج مراجعة التصحيح",NEEDS_REVIEW:"يحتاج مراجعة سريرية",APPROVED:"معتمد",FAILED:"فشل",ARCHIVED:"مؤرشف",SUPERSEDED:"مستبدل"};return language==="ar"?(ar[value]??value):value.replaceAll('_',' ').toLowerCase().replace(/^./,(letter)=>letter.toUpperCase());}
function areaLabel(value:string,language:"en"|"ar"){if(language==="en")return value;return ({Obstetrics:"طب التوليد",Gynecology:"أمراض النساء","Fertility & ART":"الخصوبة وتقنيات الإخصاب","Family Planning":"تنظيم الأسرة","Gynecologic Oncology":"أورام النساء",Menopause:"سن اليأس",Emergency:"الطوارئ"} as Record<string,string>)[value]??value;}
function matchesArea(document:Document, area:string){const text=`${document.specialty} ${document.topic} ${(document.tags??[]).join(' ')}`.toLowerCase(); const map:Record<string,string[]>={Obstetrics:['obstetric','pregnancy','fetal','antenatal','postpartum'],Gynecology:['gynecology','menstrual','endometriosis'],"Fertility & ART":['fertility','art','ivf','pcos'],"Family Planning":['family planning','contraception'],"Gynecologic Oncology":['oncology','cancer'],Menopause:['menopause'],Emergency:['emergency','sepsis','haemorrhage','ectopic']}; return (map[area]??[area.toLowerCase()]).some((term)=>text.includes(term));}
async function api(path:string,init?:RequestInit){const response=await fetch(`${getApiBaseUrl()}${path}`,{credentials:'include',...init});if(!response.ok){const error=new Error(`Request failed ${response.status}`);(error as Error&{status?:number}).status=response.status;throw error;}return response.status===204?{}:response.json();}
