"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PatientPicker, patientLabel, type PatientPickerPatient } from "../../components/clinic/PatientPicker";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { expandSearchShortcut } from "@/lib/search-shortcuts";
import { AppShell, SafetyAlert } from "../mvp-page";
import styles from "./investigation-station.module.css";

type CatalogItem = {
  id: string;
  code?: string | null;
  name: string;
  category: string;
  subcategory?: string | null;
  modality?: string | null;
  sampleType?: string | null;
  aliasesJson?: unknown;
  favorite?: boolean;
};

type FavoriteSet = {
  id: string;
  name: string;
  nameAr?: string | null;
  scope?: string;
  publicationState?: string;
  actionable?: boolean;
  editable?: boolean;
  guidanceText?: string | null;
  items: Array<{
    required?: boolean;
    rationale?: string | null;
    investigationCatalogItem: CatalogItem;
  }>;
};

type ClinicalRequest = {
  id: string;
  title: string;
  status: string;
  patientId: string;
  createdAt?: string;
  followUpHintActive?: boolean;
  items?: Array<{ testName?: string }>;
  patient?: PatientPickerPatient | null;
};

type InvestigationOrder = {
  id: string;
  requestedAt?: string;
  createdAt?: string;
  items?: Array<{ testName?: string }>;
};

type Workspace = {
  investigationCatalog?: CatalogItem[];
  favorites?: CatalogItem[];
  highPriority?: CatalogItem[];
  favoriteSets?: FavoriteSet[];
};

type StationTab = "library" | "lists" | "favorites" | "recent" | "followup";

type CategoryNode = {
  name: string;
  count: number;
  subcategories: Array<{ name: string; count: number }>;
};

const followUpStatuses: Array<[string, string]> = [
  ["needs_review", "Needs review"],
  ["overdue", "Overdue"],
  ["result_received", "Received"],
  ["reviewed", "Reviewed"],
  ["patient_informed", "Patient informed"],
  ["closed", "Closed"]
];

export default function InvestigationsPage() {
  const { language } = useI18n();
  const copy = stationCopy[language];
  const basketRef = useRef<HTMLElement | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>({});
  const [recentItems, setRecentItems] = useState<CatalogItem[]>([]);
  const [patientRequests, setPatientRequests] = useState<ClinicalRequest[]>([]);
  const [followUpRequests, setFollowUpRequests] = useState<ClinicalRequest[]>([]);
  const [followUpCounts, setFollowUpCounts] = useState<Record<string, number>>({});
  const [patient, setPatient] = useState<PatientPickerPatient | null>(null);
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [activeTab, setActiveTab] = useState<StationTab>("library");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(["Laboratory"]));
  const [selected, setSelected] = useState<CatalogItem[]>([]);
  const [indications, setIndications] = useState<Record<string, string>>({});
  const [listName, setListName] = useState("");
  const [listNameAr, setListNameAr] = useState("");
  const [priority, setPriority] = useState("routine");
  const [requestNote, setRequestNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [internalExternal, setInternalExternal] = useState<"internal" | "external">("internal");
  const [followUpOwner, setFollowUpOwner] = useState("");
  const [warningsConfirmed, setWarningsConfirmed] = useState(false);
  const [status, setStatus] = useState(copy.loading);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [basketReady, setBasketReady] = useState(false);
  const [savedRequestId, setSavedRequestId] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const hasPatientContext = Boolean(patientId && encounterId);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setStatus(copy.loading);
    try {
      const nextWorkspace = await apiGet("/investigations/catalog") as Workspace;
      const ordersBody = await apiGet("/investigations/orders") as { investigationOrders?: InvestigationOrder[] };
      const catalogue = nextWorkspace.investigationCatalog ?? [];
      setWorkspace(nextWorkspace);
      setRecentItems(deriveRecentItems(ordersBody.investigationOrders ?? [], catalogue));
      setStatus(copy.ready);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed, copy.loading, copy.ready]);

  const loadPatientRequests = useCallback(async (nextPatientId: string) => {
    if (!nextPatientId) return setPatientRequests([]);
    try {
      const body = await apiGet(`/clinical-requests?patientId=${encodeURIComponent(nextPatientId)}&page=1&limit=50`) as { clinicalRequests?: ClinicalRequest[] };
      setPatientRequests(body.clinicalRequests ?? []);
    } catch {
      setPatientRequests([]);
    }
  }, []);

  const loadFollowUp = useCallback(async (statusFilter = requestStatus) => {
    const params = new URLSearchParams({ page: "1", limit: "50" });
    if (statusFilter) params.set("status", statusFilter);
    try {
      const body = await apiGet(`/clinical-requests?${params.toString()}`) as { clinicalRequests?: ClinicalRequest[]; counts?: Record<string, number> };
      setFollowUpRequests(body.clinicalRequests ?? []);
      setFollowUpCounts(body.counts ?? {});
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.loadFailed);
    }
  }, [copy.loadFailed, requestStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPatientId = params.get("patientId") ?? "";
    const nextEncounterId = params.get("encounterId") ?? params.get("visitId") ?? "";
    setPatientId(nextPatientId);
    setEncounterId(nextEncounterId);

    if (nextPatientId) {
      void apiGet(`/patients/${encodeURIComponent(nextPatientId)}`)
        .then((value) => setPatient(value as PatientPickerPatient))
        .catch(() => setPatient(null));
      void loadPatientRequests(nextPatientId);
    }

    if (nextPatientId && nextEncounterId) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(basketStorageKey(nextPatientId, nextEncounterId)) ?? "null") as SavedBasket | null;
        if (Array.isArray(saved?.selected)) setSelected(uniqueCatalogItems(saved.selected));
        if (saved?.indications && typeof saved.indications === "object") setIndications(saved.indications);
        if (typeof saved?.priority === "string") setPriority(saved.priority);
        if (typeof saved?.requestNote === "string") setRequestNote(saved.requestNote);
        if (saved?.internalExternal === "internal" || saved?.internalExternal === "external") setInternalExternal(saved.internalExternal);
        if (typeof saved?.followUpOwner === "string") setFollowUpOwner(saved.followUpOwner);
        if (typeof saved?.followUpDate === "string") setFollowUpDate(saved.followUpDate);
      } catch {
        sessionStorage.removeItem(basketStorageKey(nextPatientId, nextEncounterId));
      }

      void apiGet(`/investigations/order-draft?patientId=${encodeURIComponent(nextPatientId)}&encounterId=${encodeURIComponent(nextEncounterId)}`)
        .then((value) => {
          const draft = (value as { draft?: SavedBasket | null }).draft;
          if (!draft) return;
          if (Array.isArray(draft.selected)) setSelected(uniqueCatalogItems(draft.selected));
          if (draft.indications && typeof draft.indications === "object") setIndications(draft.indications);
          if (typeof draft.priority === "string") setPriority(draft.priority);
          if (typeof draft.requestNote === "string") setRequestNote(draft.requestNote);
          if (draft.internalExternal === "internal" || draft.internalExternal === "external") setInternalExternal(draft.internalExternal);
          if (typeof draft.followUpOwner === "string") setFollowUpOwner(draft.followUpOwner);
          if (typeof draft.followUpDate === "string") setFollowUpDate(draft.followUpDate);
        })
        .catch(() => undefined);
    }

    setBasketReady(true);
    void loadWorkspace();
    void loadFollowUp("");
  }, [loadFollowUp, loadPatientRequests, loadWorkspace]);

  useEffect(() => {
    if (!basketReady || !hasPatientContext) return;
    const basket: SavedBasket = { selected, indications, priority, requestNote, followUpDate, internalExternal, followUpOwner };
    sessionStorage.setItem(basketStorageKey(patientId, encounterId), JSON.stringify(basket));
    const timer = window.setTimeout(() => {
      void apiRequest("/investigations/order-draft", "PUT", { patientId, encounterId, basket });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [basketReady, encounterId, followUpDate, followUpOwner, hasPatientContext, indications, internalExternal, patientId, priority, requestNote, selected]);

  useEffect(() => setWarningsConfirmed(false), [selected]);

  const catalogue = workspace.investigationCatalog ?? [];
  const categoryTree = useMemo(() => buildCategoryTree(catalogue), [catalogue]);
  const myLists = useMemo(() => (workspace.favoriteSets ?? []).filter((set) => set.editable), [workspace.favoriteSets]);
  const sharedTemplates = useMemo(() => (workspace.favoriteSets ?? []).filter((set) => !set.editable), [workspace.favoriteSets]);

  const visibleItems = useMemo(() => {
    const source = activeTab === "favorites" ? workspace.favorites ?? [] : activeTab === "recent" ? recentItems : catalogue;
    const expandedQuery = normalize(expandSearchShortcut(query));
    return source.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (selectedSubcategory && item.subcategory !== selectedSubcategory) return false;
      if (!expandedQuery) return true;
      return searchableText(item).includes(expandedQuery);
    });
  }, [activeTab, catalogue, query, recentItems, selectedCategory, selectedSubcategory, workspace.favorites]);

  function toggleCategory(name: string) {
    setOpenCategories((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setSelectedCategory(name);
    setSelectedSubcategory("");
  }

  function selectSubcategory(category: string, subcategory: string) {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
  }

  function add(item: CatalogItem) {
    setSelected((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
    setStatus(`${item.name} ${copy.added}`);
  }

  function remove(index: number) {
    setSelected((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function move(index: number, offset: -1 | 1) {
    setSelected((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function clearBasket() {
    setSelected([]);
    setIndications({});
    setWarningsConfirmed(false);
    if (hasPatientContext) {
      sessionStorage.removeItem(basketStorageKey(patientId, encounterId));
      void apiRequest(`/investigations/order-draft?patientId=${encodeURIComponent(patientId)}&encounterId=${encodeURIComponent(encounterId)}`, "DELETE");
    }
  }

  async function toggleFavorite(item: CatalogItem) {
    const endpoint = item.favorite ? `/investigations/catalog/${item.id}/unfavorite` : `/investigations/catalog/${item.id}/favorite`;
    const response = await apiRequest(endpoint, "POST", {});
    if (!response.ok) return setStatus(copy.favoriteFailed);
    await loadWorkspace();
    setStatus(item.favorite ? copy.favoriteRemoved : copy.favoriteAdded);
  }

  function applySet(set: FavoriteSet) {
    if (set.actionable === false || !set.items.length) {
      setStatus(set.guidanceText || copy.nonActionable);
      return;
    }
    setSelected((current) => uniqueCatalogItems([...current, ...set.items.map((entry) => entry.investigationCatalogItem)]));
    setListName(set.name);
    setListNameAr(set.nameAr ?? "");
    setStatus(copy.templateLoaded);
    basketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveList() {
    const ids = selected.map((item) => item.id);
    if (!listName.trim() || !ids.length) return setStatus(copy.listNameRequired);
    setSaving(true);
    const response = await apiRequest("/investigations/favorite-sets", "POST", {
      name: listName.trim(),
      nameAr: listNameAr.trim() || undefined,
      scope: "personal",
      investigationCatalogItemIds: ids
    });
    setSaving(false);
    if (!response.ok) return setStatus(copy.listSaveFailed);
    setListName("");
    setListNameAr("");
    await loadWorkspace();
    setActiveTab("lists");
    setStatus(copy.listSaved);
  }

  async function archiveList(id: string) {
    const response = await apiRequest(`/investigations/favorite-sets/${id}`, "DELETE");
    if (!response.ok) return setStatus(copy.listSaveFailed);
    await loadWorkspace();
    setStatus(copy.listArchived);
  }

  async function duplicateList(id: string) {
    const response = await apiRequest(`/investigations/favorite-sets/${id}/duplicate`, "POST", {});
    if (!response.ok) return setStatus(copy.listSaveFailed);
    await loadWorkspace();
    setStatus(copy.listDuplicated);
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!hasPatientContext || !selected.length) return setStatus(copy.patientRequired);
    const selectedNames = new Set(selected.map((item) => normalize(item.name)));
    const duplicateActive = patientRequests
      .filter((request) => !["reviewed", "closed", "cancelled", "voided", "not_completed"].includes(request.status))
      .flatMap((request) => request.items ?? [])
      .some((item) => selectedNames.has(normalize(item.testName ?? "")));
    const priorResult = patientRequests
      .filter((request) => ["reviewed", "closed"].includes(request.status))
      .flatMap((request) => request.items ?? [])
      .some((item) => selectedNames.has(normalize(item.testName ?? "")));

    if ((duplicateActive || priorResult) && !warningsConfirmed) {
      setWarningsConfirmed(true);
      setStatus(`${duplicateActive ? copy.duplicateWarning : ""}${priorResult ? copy.priorResultWarning : ""}${copy.confirmAgain}`);
      return;
    }

    setSaving(true);
    const response = await apiRequest("/clinical-requests", "POST", {
      patientId,
      encounterId,
      priority,
      requestedFollowUpDate: followUpDate || undefined,
      expectedResultDate: followUpDate || undefined,
      requestNote,
      internalExternal,
      responsibilityJson: { followUpOwner: followUpOwner || "unassigned" },
      items: selected.map((item) => ({
        title: item.name,
        catalogItemId: item.id,
        requestType: item.category,
        requestNote: indications[item.id] || requestNote
      }))
    });
    setSaving(false);
    if (!response.ok) return setStatus(copy.orderFailed);
    const saved = await response.json() as ClinicalRequest;
    setSavedRequestId(saved.id);
    clearBasket();
    await Promise.all([loadPatientRequests(patientId), loadFollowUp("")]);
    setStatus(copy.orderSaved);
  }

  async function followUp(id: string, action: "mark-result-received" | "review") {
    const response = await apiRequest(`/clinical-requests/${id}/${action}`, "POST", {});
    if (!response.ok) return setStatus(copy.followUpFailed);
    await loadFollowUp(requestStatus);
    setStatus(copy.followUpUpdated);
  }

  async function transition(id: string, target: string) {
    const response = await apiRequest(`/investigations/orders/${id}/status`, "PATCH", { status: target });
    if (!response.ok) return setStatus(copy.followUpFailed);
    await loadFollowUp(requestStatus);
    setStatus(copy.followUpUpdated);
  }

  function showAll() {
    setSelectedCategory("");
    setSelectedSubcategory("");
  }

  const tabCounts: Record<Exclude<StationTab, "followup">, number> = {
    library: catalogue.length,
    lists: myLists.length,
    favorites: workspace.favorites?.length ?? 0,
    recent: recentItems.length
  };

  return (
    <AppShell>
      <section className={styles.pageHeader}>
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="muted">{copy.subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          {savedRequestId ? <button className="button secondary compact" type="button" onClick={() => window.open(`/clinical-requests/${encodeURIComponent(savedRequestId)}/print`, "_blank", "noopener,noreferrer")}>{copy.printSaved}</button> : null}
          <Link className="button secondary compact" href="/admin/investigations">{copy.importManage}</Link>
          <button className="button compact" type="button" onClick={() => { clearBasket(); setActiveTab("library"); basketRef.current?.scrollIntoView({ behavior: "smooth" }); }}>{copy.newList}</button>
        </div>
      </section>

      <SafetyAlert />

      <section className={styles.metrics} aria-label={copy.metricsLabel}>
        <MetricButton active={activeTab === "library"} label={copy.catalogueItems} value={tabCounts.library} onClick={() => setActiveTab("library")} />
        <MetricButton active={activeTab === "lists"} label={copy.myLists} value={tabCounts.lists} onClick={() => setActiveTab("lists")} />
        <MetricButton active={activeTab === "favorites"} label={copy.favorites} value={tabCounts.favorites} onClick={() => setActiveTab("favorites")} />
        <MetricButton active={activeTab === "recent"} label={copy.recentlyUsed} value={tabCounts.recent} onClick={() => setActiveTab("recent")} />
      </section>

      <nav className={styles.tabs} aria-label={copy.tabsLabel}>
        <TabButton active={activeTab === "library"} label={copy.library} onClick={() => setActiveTab("library")} />
        <TabButton active={activeTab === "lists"} label={copy.myLists} onClick={() => setActiveTab("lists")} />
        <TabButton active={activeTab === "favorites"} label={copy.favorites} onClick={() => setActiveTab("favorites")} />
        <TabButton active={activeTab === "recent"} label={copy.recent} onClick={() => setActiveTab("recent")} />
        <TabButton active={activeTab === "followup"} label={copy.resultFollowUp} onClick={() => { setActiveTab("followup"); void loadFollowUp(requestStatus); }} />
      </nav>

      <p className={styles.status} role="status">{status}</p>

      {activeTab === "followup" ? (
        <FollowUpPanel
          copy={copy}
          counts={followUpCounts}
          requests={followUpRequests}
          requestStatus={requestStatus}
          onFilter={(value) => { setRequestStatus(value); void loadFollowUp(value); }}
          onReceive={(id) => void followUp(id, "mark-result-received")}
          onReview={(id) => void followUp(id, "review")}
          onTransition={(id, target) => void transition(id, target)}
        />
      ) : (
        <section className={styles.stationGrid}>
          <aside className={`panel ${styles.categoryPanel}`}>
            <div className="section-heading">
              <div>
                <h2>{copy.categories}</h2>
                <p className="muted">{copy.accordionHelp}</p>
              </div>
              <button className="button secondary compact" type="button" onClick={showAll}>{copy.all}</button>
            </div>
            <input className={styles.categorySearch} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} />
            <div className={styles.accordionList}>
              {categoryTree.map((node) => {
                const open = openCategories.has(node.name);
                return (
                  <section className={styles.accordionSection} key={node.name}>
                    <button
                      aria-expanded={open}
                      className={`${styles.accordionHeader} ${selectedCategory === node.name && !selectedSubcategory ? styles.selected : ""}`}
                      type="button"
                      onClick={() => toggleCategory(node.name)}
                    >
                      <span className={styles.expandSymbol} aria-hidden="true">{open ? "−" : "+"}</span>
                      <strong>{node.name}</strong>
                      <span>{node.count}</span>
                    </button>
                    {open ? (
                      <div className={styles.subcategoryList}>
                        <button className={!selectedSubcategory && selectedCategory === node.name ? styles.activeSubcategory : ""} type="button" onClick={() => { setSelectedCategory(node.name); setSelectedSubcategory(""); }}>{copy.allInCategory}</button>
                        {node.subcategories.map((subcategory) => (
                          <button className={selectedSubcategory === subcategory.name ? styles.activeSubcategory : ""} key={subcategory.name} type="button" onClick={() => selectSubcategory(node.name, subcategory.name)}>
                            <span>{subcategory.name}</span><em>{subcategory.count}</em>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </aside>

          <main className={styles.mainColumn}>
            {activeTab === "lists" ? (
              <ListLibrary copy={copy} myLists={myLists} sharedTemplates={sharedTemplates} onApply={applySet} onArchive={archiveList} onDuplicate={duplicateList} />
            ) : (
              <>
                <section className={`panel ${styles.catalogPanel}`}>
                  <div className="section-heading">
                    <div>
                      <h2>{activeTab === "favorites" ? copy.favorites : activeTab === "recent" ? copy.recentlyUsed : copy.library}</h2>
                      <p className="muted">{selectedSubcategory || selectedCategory || copy.allInvestigations}</p>
                    </div>
                    <span className="badge">{visibleItems.length}</span>
                  </div>
                  {loading ? <div className={`skeleton ${styles.loading}`} /> : null}
                  {!loading && !visibleItems.length ? <p className="empty-state compact smart-empty-state">{copy.noItems}</p> : null}
                  <div className={styles.catalogTable}>
                    {visibleItems.map((item) => (
                      <article className={styles.catalogRow} key={item.id}>
                        <button className={styles.favoriteButton} aria-label={`${item.favorite ? copy.unfavorite : copy.favorite} ${item.name}`} type="button" onClick={() => void toggleFavorite(item)}>{item.favorite ? "★" : "☆"}</button>
                        <div className={styles.catalogIdentity}>
                          <strong>{item.name}</strong>
                          <span>{[item.subcategory, item.sampleType || item.modality].filter(Boolean).join(" · ")}</span>
                        </div>
                        <span className={styles.categoryBadge}>{item.category}</span>
                        <button className="button secondary compact" type="button" disabled={selected.some((entry) => entry.id === item.id)} onClick={() => add(item)}>{selected.some((entry) => entry.id === item.id) ? copy.addedLabel : copy.add}</button>
                      </article>
                    ))}
                  </div>
                </section>

                {activeTab === "library" && sharedTemplates.length ? (
                  <section className={styles.quickTemplates}>
                    <div className={styles.sectionTitle}><h2>{copy.quickTemplates}</h2><span>{copy.templateHelp}</span></div>
                    <div className={styles.templateGrid}>
                      {sharedTemplates.slice(0, 8).map((set) => <TemplateCard key={set.id} set={set} onApply={applySet} />)}
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </main>

          <aside className={`panel ${styles.basketPanel}`} ref={basketRef}>
            <div className="section-heading">
              <div>
                <h2>{copy.buildList}</h2>
                <p className="muted">{copy.basketHelp}</p>
              </div>
              <button className="button secondary compact" type="button" disabled={!selected.length} onClick={clearBasket}>{copy.clear}</button>
            </div>

            {hasPatientContext ? (
              <div className={styles.patientContext}>
                <strong>{patient ? patientLabel(patient) : copy.selectedPatient}</strong>
                <span>{patient?.medicalRecordNumber ? `MRN ${patient.medicalRecordNumber}` : copy.activeVisit}</span>
              </div>
            ) : (
              <div className={styles.managementNotice}>
                <strong>{copy.libraryMode}</strong>
                <span>{copy.openVisitMessage}</span>
              </div>
            )}

            <label className={styles.field}>{copy.listName}<input value={listName} onChange={(event) => setListName(event.target.value)} placeholder={copy.listNamePlaceholder} /></label>
            <label className={styles.field}>{copy.listNameAr}<input dir="rtl" value={listNameAr} onChange={(event) => setListNameAr(event.target.value)} placeholder="اسم القائمة" /></label>

            <div className={styles.basketCount}><span>{copy.selectedItems}</span><strong>{selected.length}</strong></div>
            <div className={styles.basketList}>
              {selected.map((item, index) => (
                <article className={styles.basketRow} key={item.id}>
                  <div><strong>{item.name}</strong><span>{item.subcategory || item.category}</span></div>
                  <div className={styles.basketActions}>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`${copy.moveUp} ${item.name}`}>↑</button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === selected.length - 1} aria-label={`${copy.moveDown} ${item.name}`}>↓</button>
                    <button type="button" onClick={() => remove(index)} aria-label={`${copy.remove} ${item.name}`}>×</button>
                  </div>
                  {hasPatientContext ? <input aria-label={`${copy.indication} ${item.name}`} value={indications[item.id] ?? ""} onChange={(event) => setIndications((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={copy.indication} /> : null}
                </article>
              ))}
              {!selected.length ? <p className="empty-state compact smart-empty-state">{copy.emptyBasket}</p> : null}
            </div>

            <button className="button secondary" type="button" disabled={!selected.length || saving} onClick={() => void saveList()}>{saving ? copy.saving : copy.saveList}</button>

            {hasPatientContext ? (
              <form className={styles.orderForm} onSubmit={submitOrder}>
                <label className={styles.field}>{copy.overallIndication}<input value={requestNote} onChange={(event) => setRequestNote(event.target.value)} /></label>
                <div className={styles.twoFields}>
                  <label className={styles.field}>{copy.priority}<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="routine">{copy.routine}</option><option value="urgent">{copy.urgent}</option><option value="stat">STAT</option></select></label>
                  <label className={styles.field}>{copy.destination}<select value={internalExternal} onChange={(event) => setInternalExternal(event.target.value as "internal" | "external")}><option value="internal">{copy.internal}</option><option value="external">{copy.external}</option></select></label>
                </div>
                <label className={styles.field}>{copy.followUpOwner}<input value={followUpOwner} onChange={(event) => setFollowUpOwner(event.target.value)} placeholder={copy.followUpOwnerPlaceholder} /></label>
                <label className={styles.field}>{copy.expectedDate}<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
                <button className="button" type="submit" disabled={!selected.length || saving}>{saving ? copy.saving : warningsConfirmed ? copy.confirmOrder : copy.reviewOrder}</button>
              </form>
            ) : (
              <Link className="button" href="/patients">{copy.openPatientVisit}</Link>
            )}
          </aside>
        </section>
      )}
    </AppShell>
  );
}

function MetricButton({ active, label, value, onClick }: { active: boolean; label: string; value: number; onClick(): void }) {
  return <button className={`${styles.metric} ${active ? styles.metricActive : ""}`} type="button" onClick={onClick}><strong>{value}</strong><span>{label}</span></button>;
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick(): void }) {
  return <button className={active ? styles.activeTab : ""} type="button" onClick={onClick}>{label}</button>;
}

function TemplateCard({ set, onApply }: { set: FavoriteSet; onApply(set: FavoriteSet): void }) {
  return (
    <button className={styles.templateCard} type="button" onClick={() => onApply(set)}>
      <strong>{set.name}</strong>
      {set.nameAr ? <span dir="rtl">{set.nameAr}</span> : null}
      <small>{set.items.length} items · {set.items.slice(0, 3).map((entry) => entry.investigationCatalogItem.name).join(", ")}</small>
    </button>
  );
}

function ListLibrary({ copy, myLists, sharedTemplates, onApply, onArchive, onDuplicate }: {
  copy: StationCopy;
  myLists: FavoriteSet[];
  sharedTemplates: FavoriteSet[];
  onApply(set: FavoriteSet): void;
  onArchive(id: string): Promise<void>;
  onDuplicate(id: string): Promise<void>;
}) {
  return (
    <section className={styles.listLibrary}>
      <div className={styles.sectionTitle}><h2>{copy.myLists}</h2><span>{copy.personalListsHelp}</span></div>
      <div className={styles.listGrid}>
        {myLists.map((set) => (
          <article className={`panel ${styles.listCard}`} key={set.id}>
            <button className={styles.listOpen} type="button" onClick={() => onApply(set)}><strong>{set.name}</strong><span>{set.items.length} {copy.items}</span></button>
            <div className={styles.listCardActions}><button className="button secondary compact" type="button" onClick={() => void onDuplicate(set.id)}>{copy.duplicate}</button><button className="button secondary compact" type="button" onClick={() => void onArchive(set.id)}>{copy.archive}</button></div>
          </article>
        ))}
        {!myLists.length ? <p className="empty-state compact smart-empty-state">{copy.noLists}</p> : null}
      </div>
      <div className={styles.sectionTitle}><h2>{copy.sharedTemplates}</h2><span>{copy.templateHelp}</span></div>
      <div className={styles.templateGrid}>{sharedTemplates.map((set) => <TemplateCard key={set.id} set={set} onApply={onApply} />)}</div>
    </section>
  );
}

function FollowUpPanel({ copy, counts, requests, requestStatus, onFilter, onReceive, onReview, onTransition }: {
  copy: StationCopy;
  counts: Record<string, number>;
  requests: ClinicalRequest[];
  requestStatus: string;
  onFilter(value: string): void;
  onReceive(id: string): void;
  onReview(id: string): void;
  onTransition(id: string, target: string): void;
}) {
  return (
    <section className={styles.followUpWorkspace}>
      <div className={styles.followUpMetrics}>{followUpStatuses.map(([key, label]) => <button className={requestStatus === key ? styles.followUpActive : ""} key={key} type="button" onClick={() => onFilter(requestStatus === key ? "" : key)}><strong>{counts[key] ?? 0}</strong><span>{label}</span></button>)}</div>
      <section className={`panel ${styles.followUpPanel}`}>
        <div className="section-heading"><div><h2>{copy.resultFollowUp}</h2><p className="muted">{copy.followUpHelp}</p></div><span className="badge">{requests.length}</span></div>
        <div className={styles.followUpList}>
          {requests.map((request) => (
            <article className={styles.followUpRow} key={request.id}>
              <div><strong>{request.title}</strong><span>{request.patient ? patientLabel(request.patient) : copy.patientRecord} · {request.status.replaceAll("_", " ")}</span></div>
              <div className={styles.followUpActions}>
                <button type="button" onClick={() => window.open(`/clinical-requests/${encodeURIComponent(request.id)}/print`, "_blank", "noopener,noreferrer")}>{copy.print}</button>
                <button type="button" onClick={() => onTransition(request.id, "booked")}>{copy.booked}</button>
                <button type="button" onClick={() => onReceive(request.id)}>{copy.resultReceived}</button>
                <button type="button" onClick={() => onReview(request.id)}>{copy.doctorReviewed}</button>
                <button type="button" onClick={() => onTransition(request.id, "patient_informed")}>{copy.patientInformed}</button>
                <button type="button" onClick={() => onTransition(request.id, "closed")}>{copy.close}</button>
              </div>
            </article>
          ))}
          {!requests.length ? <p className="empty-state compact smart-empty-state">{copy.noRequests}</p> : null}
        </div>
      </section>
    </section>
  );
}

function buildCategoryTree(items: CatalogItem[]): CategoryNode[] {
  const categories = new Map<string, Map<string, number>>();
  for (const item of items) {
    const category = item.category || "Other";
    const subcategory = item.subcategory || "General";
    const children = categories.get(category) ?? new Map<string, number>();
    children.set(subcategory, (children.get(subcategory) ?? 0) + 1);
    categories.set(category, children);
  }
  return [...categories.entries()]
    .map(([name, children]) => ({
      name,
      count: [...children.values()].reduce((sum, value) => sum + value, 0),
      subcategories: [...children.entries()].map(([childName, count]) => ({ name: childName, count })).sort((left, right) => left.name.localeCompare(right.name))
    }))
    .sort((left, right) => categoryRank(left.name) - categoryRank(right.name) || left.name.localeCompare(right.name));
}

function categoryRank(name: string) {
  return ["Laboratory", "Radiology", "Ultrasound", "Pathology", "Cardiology", "Other"].indexOf(name) === -1 ? 99 : ["Laboratory", "Radiology", "Ultrasound", "Pathology", "Cardiology", "Other"].indexOf(name);
}

function deriveRecentItems(orders: InvestigationOrder[], catalogue: CatalogItem[]) {
  const byName = new Map(catalogue.map((item) => [normalize(item.name), item]));
  const seen = new Set<string>();
  const recent: CatalogItem[] = [];
  for (const order of [...orders].sort((left, right) => new Date(right.requestedAt ?? right.createdAt ?? 0).getTime() - new Date(left.requestedAt ?? left.createdAt ?? 0).getTime())) {
    for (const orderItem of order.items ?? []) {
      const item = byName.get(normalize(orderItem.testName ?? ""));
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        recent.push(item);
      }
    }
  }
  return recent.slice(0, 30);
}

function searchableText(item: CatalogItem) {
  const aliases = Array.isArray(item.aliasesJson) ? item.aliasesJson : [];
  return normalize([item.code, item.name, item.category, item.subcategory, item.modality, item.sampleType, ...aliases.map(String)].filter(Boolean).join(" "));
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();
}

function basketStorageKey(patientId: string, encounterId: string) {
  return `prij-investigation-basket:${patientId}:${encounterId}`;
}

function uniqueCatalogItems(items: CatalogItem[]) {
  return items.filter((item, index) => Boolean(item?.id) && items.findIndex((candidate) => candidate.id === item.id) === index);
}

type SavedBasket = {
  selected?: CatalogItem[];
  indications?: Record<string, string>;
  priority?: string;
  requestNote?: string;
  followUpDate?: string;
  internalExternal?: "internal" | "external";
  followUpOwner?: string;
};

async function apiGet(endpoint: string) {
  const response = await apiRequest(endpoint, "GET");
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string; requestId?: string } } | null;
    throw new Error(`${body?.error?.message ?? "Investigation request failed."}${body?.error?.requestId ? ` Request ${body.error.requestId}.` : ""}`);
  }
  return response.json();
}

async function apiRequest(endpoint: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", payload?: Record<string, unknown>) {
  const token = sessionStorage.getItem("prijClinicToken");
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: {
      ...(payload ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 500 }));
}

const english = {
  eyebrow: "Doctor clinical workspace",
  title: "Investigation Station",
  subtitle: "Browse the real catalogue, build reusable lists, attach requests to an active visit, and follow results through review.",
  loading: "Loading investigation database…",
  ready: "Investigation database ready.",
  loadFailed: "The investigation database could not be loaded.",
  printSaved: "Print saved request",
  importManage: "Import / manage catalogue",
  newList: "+ New list",
  metricsLabel: "Investigation Station metrics",
  catalogueItems: "Catalogue items",
  myLists: "My lists",
  favorites: "Favorites",
  recentlyUsed: "Recently used",
  tabsLabel: "Investigation Station sections",
  library: "Investigation library",
  recent: "Recent",
  resultFollowUp: "Results follow-up",
  categories: "Categories",
  accordionHelp: "Press + to expand a category and show its subcategories.",
  all: "All",
  allInCategory: "All in this category",
  searchPlaceholder: "Search investigation, abbreviation, or alias…",
  allInvestigations: "All active investigations",
  noItems: "No active catalogue items match this view.",
  favorite: "Favorite",
  unfavorite: "Remove favorite",
  add: "+ Add",
  addedLabel: "Added",
  added: "added to the basket.",
  favoriteFailed: "Favorite status could not be updated.",
  favoriteAdded: "Investigation added to favorites.",
  favoriteRemoved: "Investigation removed from favorites.",
  quickTemplates: "Quick templates",
  templateHelp: "Templates fill the basket only; every item remains editable before ordering.",
  templateLoaded: "Template loaded into the editable basket.",
  nonActionable: "This reference does not define a universal bundle. Select investigations individually.",
  buildList: "Build your list",
  basketHelp: "Add, remove, and reorder before saving or using it for a patient.",
  clear: "Clear all",
  selectedPatient: "Selected patient",
  activeVisit: "Active visit",
  libraryMode: "Library mode",
  openVisitMessage: "Open an active patient visit to create a real investigation request.",
  listName: "List name",
  listNameAr: "Arabic name (optional)",
  listNamePlaceholder: "Example: Early pregnancy routine",
  selectedItems: "Selected items",
  emptyBasket: "No investigations selected.",
  moveUp: "Move up",
  moveDown: "Move down",
  remove: "Remove",
  indication: "Clinical indication",
  saving: "Saving…",
  saveList: "Save as my list",
  listNameRequired: "Add at least one investigation and enter a list name.",
  listSaveFailed: "The reusable list could not be saved.",
  listSaved: "Reusable investigation list saved to the database.",
  listArchived: "Investigation list archived.",
  listDuplicated: "Investigation list duplicated.",
  personalListsHelp: "Personal lists are stored in the database and remain editable by their owner.",
  sharedTemplates: "Shared clinic templates",
  items: "items",
  duplicate: "Duplicate",
  archive: "Archive",
  noLists: "No personal lists yet. Build a basket and save it.",
  overallIndication: "Overall indication / request note",
  priority: "Priority",
  routine: "Routine",
  urgent: "Urgent",
  destination: "Destination",
  internal: "Internal",
  external: "External",
  followUpOwner: "Follow-up owner",
  followUpOwnerPlaceholder: "Doctor, staff member, branch, or provider",
  expectedDate: "Expected result / follow-up date",
  reviewOrder: "Review and submit order",
  confirmOrder: "Confirm warning and submit",
  openPatientVisit: "Open patient file to use this list",
  patientRequired: "Open an active patient visit and select at least one investigation.",
  duplicateWarning: "An active order already contains one or more selected investigations. ",
  priorResultWarning: "A prior reviewed result exists for one or more selected investigations. ",
  confirmAgain: "Review the basket and submit again to confirm.",
  orderFailed: "The investigation request could not be saved.",
  orderSaved: "Investigation request saved to the active visit and follow-up workflow.",
  followUpHelp: "Database-backed request lifecycle across the doctor’s permitted patient scope.",
  followUpFailed: "The result follow-up could not be updated.",
  followUpUpdated: "Investigation follow-up updated.",
  patientRecord: "Patient record",
  print: "Print",
  booked: "Booked",
  resultReceived: "Result received",
  doctorReviewed: "Doctor reviewed",
  patientInformed: "Patient informed",
  close: "Close",
  noRequests: "No requests are visible in your permitted scope."
} as const;

type StationCopy = { [K in keyof typeof english]: string };

const stationCopy: Record<"en" | "ar", StationCopy> = {
  en: english,
  ar: {
    ...english,
    eyebrow: "مساحة العمل السريرية للطبيب",
    title: "محطة الفحوصات",
    subtitle: "تصفح كتالوج الفحوصات الحقيقي، وأنشئ قوائم قابلة لإعادة الاستخدام، واربط الطلب بالزيارة النشطة، وتابع النتائج حتى المراجعة.",
    loading: "جارٍ تحميل قاعدة بيانات الفحوصات…",
    ready: "قاعدة بيانات الفحوصات جاهزة.",
    loadFailed: "تعذر تحميل قاعدة بيانات الفحوصات.",
    printSaved: "طباعة الطلب المحفوظ",
    importManage: "استيراد / إدارة الكتالوج",
    newList: "+ قائمة جديدة",
    metricsLabel: "مؤشرات محطة الفحوصات",
    catalogueItems: "عناصر الكتالوج",
    myLists: "قوائمي",
    favorites: "المفضلة",
    recentlyUsed: "المستخدمة مؤخراً",
    tabsLabel: "أقسام محطة الفحوصات",
    library: "مكتبة الفحوصات",
    recent: "الأخيرة",
    resultFollowUp: "متابعة النتائج",
    categories: "التصنيفات",
    accordionHelp: "اضغط + لفتح التصنيف وعرض التصنيفات الفرعية.",
    all: "الكل",
    allInCategory: "كل عناصر هذا التصنيف",
    searchPlaceholder: "ابحث باسم الفحص أو الاختصار أو الاسم البديل…",
    allInvestigations: "كل الفحوصات النشطة",
    noItems: "لا توجد فحوصات نشطة مطابقة.",
    favorite: "إضافة للمفضلة",
    unfavorite: "إزالة من المفضلة",
    add: "+ إضافة",
    addedLabel: "تمت الإضافة",
    added: "تمت إضافته إلى السلة.",
    favoriteFailed: "تعذر تحديث المفضلة.",
    favoriteAdded: "تمت إضافة الفحص للمفضلة.",
    favoriteRemoved: "تمت إزالة الفحص من المفضلة.",
    quickTemplates: "القوالب السريعة",
    templateHelp: "القالب يملأ السلة فقط، ويمكن تعديل كل عنصر قبل الطلب.",
    templateLoaded: "تم تحميل القالب إلى السلة القابلة للتعديل.",
    nonActionable: "لا يحدد هذا المرجع حزمة فحوصات ثابتة. اختر الفحوصات بشكل فردي.",
    buildList: "إنشاء القائمة",
    basketHelp: "أضف واحذف ورتب قبل الحفظ أو الاستخدام للمريضة.",
    clear: "مسح الكل",
    selectedPatient: "المريضة المحددة",
    activeVisit: "زيارة نشطة",
    libraryMode: "وضع المكتبة",
    openVisitMessage: "افتح زيارة نشطة لإنشاء طلب فحوصات حقيقي.",
    listName: "اسم القائمة",
    listNameAr: "الاسم العربي (اختياري)",
    listNamePlaceholder: "مثال: فحوصات الحمل المبكر",
    selectedItems: "العناصر المحددة",
    emptyBasket: "لم يتم اختيار فحوصات.",
    moveUp: "تحريك لأعلى",
    moveDown: "تحريك لأسفل",
    remove: "حذف",
    indication: "السبب السريري",
    saving: "جارٍ الحفظ…",
    saveList: "حفظ ضمن قوائمي",
    listNameRequired: "اختر فحصاً واحداً على الأقل وأدخل اسم القائمة.",
    listSaveFailed: "تعذر حفظ القائمة.",
    listSaved: "تم حفظ قائمة الفحوصات في قاعدة البيانات.",
    listArchived: "تمت أرشفة القائمة.",
    listDuplicated: "تم إنشاء نسخة من القائمة.",
    personalListsHelp: "القوائم الشخصية محفوظة في قاعدة البيانات ويمكن لمالكها تعديلها.",
    sharedTemplates: "قوالب العيادة المشتركة",
    items: "عناصر",
    duplicate: "نسخ",
    archive: "أرشفة",
    noLists: "لا توجد قوائم شخصية بعد.",
    overallIndication: "السبب العام / ملاحظة الطلب",
    priority: "الأولوية",
    routine: "عادي",
    urgent: "مستعجل",
    destination: "الجهة",
    internal: "داخلي",
    external: "خارجي",
    followUpOwner: "مسؤول المتابعة",
    followUpOwnerPlaceholder: "طبيب أو موظف أو فرع أو مقدم خدمة",
    expectedDate: "تاريخ النتيجة المتوقع / المتابعة",
    reviewOrder: "مراجعة وحفظ الطلب",
    confirmOrder: "تأكيد التحذير والحفظ",
    openPatientVisit: "فتح ملف المريضة لاستخدام القائمة",
    patientRequired: "افتح زيارة نشطة واختر فحصاً واحداً على الأقل.",
    duplicateWarning: "يوجد طلب نشط يحتوي على فحص أو أكثر من المحدد. ",
    priorResultWarning: "توجد نتيجة سابقة تمت مراجعتها لفحص أو أكثر من المحدد. ",
    confirmAgain: "راجع السلة واضغط الحفظ مرة أخرى للتأكيد.",
    orderFailed: "تعذر حفظ طلب الفحوصات.",
    orderSaved: "تم حفظ طلب الفحوصات وربطه بالزيارة ومسار المتابعة.",
    followUpHelp: "دورة طلب حقيقية من قاعدة البيانات ضمن نطاق المرضى المسموح للطبيب.",
    followUpFailed: "تعذر تحديث متابعة النتيجة.",
    followUpUpdated: "تم تحديث متابعة الفحص.",
    patientRecord: "ملف المريضة",
    print: "طباعة",
    booked: "تم الحجز",
    resultReceived: "تم استلام النتيجة",
    doctorReviewed: "تمت مراجعة الطبيب",
    patientInformed: "تم إبلاغ المريضة",
    close: "إغلاق",
    noRequests: "لا توجد طلبات ظاهرة ضمن نطاق الصلاحيات."
  }
};