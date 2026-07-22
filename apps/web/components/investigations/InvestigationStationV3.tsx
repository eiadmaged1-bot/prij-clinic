"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PatientPicker, patientLabel, type PatientPickerPatient } from "../clinic/PatientPicker";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useI18n } from "@/i18n/useI18n";
import { AppShell, SafetyAlert } from "@/app/mvp-page";
import styles from "./investigation-station-v3.module.css";

type CatalogItem = {
  id: string;
  code?: string | null;
  name: string;
  category: string;
  subcategory?: string | null;
  modality?: string | null;
  sampleType?: string | null;
  aliasesJson?: unknown;
  keywordsJson?: unknown;
  tagsJson?: unknown;
  favorite?: boolean;
};

type InvestigationSet = {
  id: string;
  name: string;
  nameAr?: string | null;
  scope?: string;
  actionable?: boolean;
  editable?: boolean;
  guidanceText?: string | null;
  items: Array<{ investigationCatalogItem: CatalogItem }>;
};

type OrderRecord = {
  id: string;
  patientId: string;
  status?: string;
  createdAt?: string;
  requestedAt?: string;
  items?: Array<{ testName?: string }>;
};

type Workspace = {
  investigationCatalog?: CatalogItem[];
  favorites?: CatalogItem[];
  favoriteSets?: InvestigationSet[];
};

type Tab = "library" | "favorites" | "recent" | "lists" | "templates";
type Mode = "order" | "list";
type BasketSnapshot = { items: CatalogItem[]; itemNotes: Record<string, string> };

const categoryOrder = [
  "Laboratory",
  "Imaging",
  "Pathology",
  "Cardiac and Functional Tests",
  "Procedures and Referrals",
  "Other"
];

const text = {
  en: {
    title: "Investigation Station",
    manage: "Manage investigations",
    createList: "Create list",
    cancelList: "Cancel list builder",
    library: "Library",
    favorites: "Favorites",
    recent: "Recently used",
    lists: "My lists",
    templates: "Templates",
    categories: "Categories",
    all: "All",
    searchTests: "Search investigation, abbreviation, or alias",
    searchPatient: "Search patient — type at least 2 characters",
    build: "Build your order",
    listBuilder: "Create reusable list",
    selected: "Selected",
    empty: "Choose investigations from the library.",
    add: "+ Add",
    added: "Added",
    addNote: "+ Note",
    hideNote: "Hide note",
    overall: "Clinical indication / request note",
    priority: "Priority",
    destination: "Destination",
    routine: "Routine",
    urgent: "Urgent",
    internal: "Internal",
    external: "External",
    more: "More options",
    followOwner: "Follow-up owner",
    expectedDate: "Expected result / follow-up date",
    review: "Review order",
    saveList: "Save list",
    listName: "List name",
    listNameAr: "Arabic name — optional",
    undo: "↶ Undo",
    clear: "Clear",
    openFile: "Open patient file",
    changePatient: "Change patient",
    selectedPatient: "Selected patient",
    noResults: "No active investigations match this view.",
    selectList: "Select list",
    duplicate: "Duplicate",
    archive: "Archive",
    replaceTitle: "Replace current basket?",
    replaceMessage: "Selecting a list replaces the current basket. Continue?",
    reviewTitle: "Review investigation order",
    back: "Back to edit",
    submit: "Submit order",
    saving: "Saving…",
    success: "Order submitted successfully.",
    failed: "The order could not be saved.",
    another: "Create another order",
    print: "Print request",
    listSaved: "List saved.",
    duplicateList: "A personal list with this name already exists.",
    patientRequired: "Select a patient before reviewing the order.",
    basketRequired: "Add at least one investigation.",
    templatesEmpty: "No active templates are available.",
    listsEmpty: "No personal lists yet.",
    prior: "Prior order",
    listModeNotice: "Build the reusable basket, then name and save it. No patient is attached."
  },
  ar: {
    title: "محطة الفحوصات",
    manage: "إدارة الفحوصات",
    createList: "إنشاء قائمة",
    cancelList: "إلغاء إنشاء القائمة",
    library: "المكتبة",
    favorites: "المفضلة",
    recent: "المستخدمة حديثاً",
    lists: "قوائمي",
    templates: "القوالب",
    categories: "التصنيفات",
    all: "الكل",
    searchTests: "ابحث باسم الفحص أو الاختصار أو الاسم البديل",
    searchPatient: "ابحث عن المريضة — اكتب حرفين على الأقل",
    build: "تجهيز الطلب",
    listBuilder: "إنشاء قائمة قابلة لإعادة الاستخدام",
    selected: "المختار",
    empty: "اختر الفحوصات من المكتبة.",
    add: "+ إضافة",
    added: "تمت الإضافة",
    addNote: "+ ملاحظة",
    hideNote: "إخفاء الملاحظة",
    overall: "السبب السريري / ملاحظة الطلب",
    priority: "الأولوية",
    destination: "الجهة",
    routine: "عادي",
    urgent: "عاجل",
    internal: "داخلي",
    external: "خارجي",
    more: "خيارات إضافية",
    followOwner: "مسؤول المتابعة",
    expectedDate: "تاريخ النتيجة أو المتابعة المتوقع",
    review: "مراجعة الطلب",
    saveList: "حفظ القائمة",
    listName: "اسم القائمة",
    listNameAr: "الاسم بالعربية — اختياري",
    undo: "↶ تراجع",
    clear: "مسح",
    openFile: "فتح ملف المريضة",
    changePatient: "تغيير المريضة",
    selectedPatient: "المريضة المختارة",
    noResults: "لا توجد فحوصات نشطة تطابق هذا العرض.",
    selectList: "اختيار القائمة",
    duplicate: "نسخ",
    archive: "أرشفة",
    replaceTitle: "استبدال السلة الحالية؟",
    replaceMessage: "اختيار قائمة يستبدل محتويات السلة الحالية. متابعة؟",
    reviewTitle: "مراجعة طلب الفحوصات",
    back: "العودة للتعديل",
    submit: "إرسال الطلب",
    saving: "جارٍ الحفظ…",
    success: "تم إرسال الطلب بنجاح.",
    failed: "تعذر حفظ الطلب.",
    another: "إنشاء طلب آخر",
    print: "طباعة الطلب",
    listSaved: "تم حفظ القائمة.",
    duplicateList: "توجد قائمة شخصية بهذا الاسم بالفعل.",
    patientRequired: "اختر المريضة قبل مراجعة الطلب.",
    basketRequired: "أضف فحصاً واحداً على الأقل.",
    templatesEmpty: "لا توجد قوالب نشطة.",
    listsEmpty: "لا توجد قوائم شخصية بعد.",
    prior: "طلب سابق",
    listModeNotice: "كوّن القائمة ثم اكتب اسمها واحفظها. لا يتم ربط مريضة بهذا الوضع."
  }
} as const;

export default function InvestigationStationV3() {
  const { language } = useI18n();
  const t = text[language];
  const [workspace, setWorkspace] = useState<Workspace>({});
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [patientOrders, setPatientOrders] = useState<OrderRecord[]>([]);
  const [patient, setPatient] = useState<PatientPickerPatient | null>(null);
  const [patientId, setPatientId] = useState("");
  const [encounterId, setEncounterId] = useState("");
  const [pickerVersion, setPickerVersion] = useState(0);
  const [mode, setMode] = useState<Mode>("order");
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(["Laboratory"]));
  const [basket, setBasket] = useState<CatalogItem[]>([]);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [openItemNotes, setOpenItemNotes] = useState<Set<string>>(() => new Set());
  const [undo, setUndo] = useState<BasketSnapshot | null>(null);
  const [overallNote, setOverallNote] = useState("");
  const [listName, setListName] = useState("");
  const [listNameAr, setListNameAr] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [savedId, setSavedId] = useState("");
  const [savedPrintPath, setSavedPrintPath] = useState("");

  const loadWorkspace = useCallback(async () => {
    const [workspaceBody, orderBody] = await Promise.all([
      apiJson<Workspace>("/investigations/station/workspace"),
      apiJson<{ investigationOrders?: OrderRecord[] }>("/investigations/orders")
    ]);
    setWorkspace(workspaceBody);
    setOrders(orderBody.investigationOrders ?? []);
  }, []);

  const loadPatientOrders = useCallback(async (id: string) => {
    if (!id) return setPatientOrders([]);
    const body = await apiJson<{ clinicalRequests?: OrderRecord[] }>(`/clinical-requests?patientId=${encodeURIComponent(id)}&page=1&limit=50`);
    setPatientOrders(body.clinicalRequests ?? []);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPatientId = params.get("patientId") ?? "";
    const initialEncounterId = params.get("encounterId") ?? params.get("visitId") ?? "";
    setPatientId(initialPatientId);
    setEncounterId(initialEncounterId);
    if (initialPatientId) {
      void apiJson<PatientPickerPatient>(`/patients/${encodeURIComponent(initialPatientId)}`)
        .then((value) => setPatient(value))
        .catch(() => setPatient(null));
      void loadPatientOrders(initialPatientId);
    }
    void loadWorkspace().catch((error: Error) => setStatus(error.message));
  }, [loadPatientOrders, loadWorkspace]);

  const catalogue = workspace.investigationCatalog ?? [];
  const favorites = workspace.favorites ?? [];
  const recent = useMemo(() => deriveRecent(orders, catalogue), [orders, catalogue]);
  const personalLists = useMemo(() => (workspace.favoriteSets ?? []).filter((set) => set.editable), [workspace.favoriteSets]);
  const templates = useMemo(() => (workspace.favoriteSets ?? []).filter((set) => !set.editable && set.actionable !== false && set.items.length), [workspace.favoriteSets]);
  const categoryTree = useMemo(() => buildCategoryTree(catalogue), [catalogue]);

  const visibleItems = useMemo(() => {
    const source = activeTab === "favorites" ? favorites : activeTab === "recent" ? recent : catalogue;
    const normalizedQuery = normalize(query);
    return source.filter((item) => {
      if (activeTab === "library") {
        if (category && item.category !== category) return false;
        if (subcategory && item.subcategory !== subcategory) return false;
      }
      return !normalizedQuery || searchable(item).includes(normalizedQuery);
    });
  }, [activeTab, catalogue, category, favorites, query, recent, subcategory]);

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    if (tab !== "library") {
      setCategory("");
      setSubcategory("");
    }
  }

  function remember() {
    setUndo({ items: basket, itemNotes });
  }

  function addItem(item: CatalogItem) {
    if (basket.some((entry) => entry.id === item.id)) return;
    remember();
    setBasket((current) => [...current, item]);
  }

  function removeItem(index: number) {
    remember();
    const removed = basket[index];
    setBasket((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (removed) {
      setItemNotes((current) => {
        const next = { ...current };
        delete next[removed.id];
        return next;
      });
    }
  }

  function moveItem(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= basket.length) return;
    remember();
    setBasket((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function clearBasket() {
    if (!basket.length) return;
    remember();
    setBasket([]);
    setItemNotes({});
    setOpenItemNotes(new Set());
  }

  function undoLast() {
    if (!undo) return;
    const current = { items: basket, itemNotes };
    setBasket(undo.items);
    setItemNotes(undo.itemNotes);
    setUndo(current);
  }

  function choosePatient(nextPatient: PatientPickerPatient) {
    setPatient(nextPatient);
    setPatientId(nextPatient.id);
    setSavedId("");
    setSavedPrintPath("");
    setPickerVersion((value) => value + 1);
    const params = new URLSearchParams();
    params.set("patientId", nextPatient.id);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    void loadPatientOrders(nextPatient.id).catch(() => setPatientOrders([]));
  }

  function changePatient() {
    if (encounterId) return;
    setPatient(null);
    setPatientId("");
    setPatientOrders([]);
    setSavedId("");
    setSavedPrintPath("");
    sessionStorage.removeItem("prij:investigation-station-v3:query");
    sessionStorage.removeItem("prij:investigation-station-v3:scroll");
    setPickerVersion((value) => value + 1);
    window.history.replaceState(null, "", window.location.pathname);
  }

  function applySet(set: InvestigationSet) {
    if (!set.items.length) return;
    if (basket.length && !window.confirm(`${t.replaceTitle}\n${t.replaceMessage}`)) return;
    remember();
    setBasket(dedupe(set.items.map((entry) => entry.investigationCatalogItem)));
    setItemNotes({});
    setStatus("");
  }

  async function toggleFavorite(item: CatalogItem) {
    const endpoint = item.favorite ? `/investigations/catalog/${item.id}/unfavorite` : `/investigations/catalog/${item.id}/favorite`;
    const response = await apiRequest(endpoint, "POST", {});
    if (!response.ok) return setStatus(await responseMessage(response, "Could not update favorite."));
    await loadWorkspace();
  }

  async function saveList(event: FormEvent) {
    event.preventDefault();
    if (!listName.trim() || !basket.length) return setStatus(t.basketRequired);
    setSaving(true);
    const response = await apiRequest("/investigations/station/lists", "POST", {
      name: listName.trim(),
      nameAr: listNameAr.trim() || undefined,
      investigationCatalogItemIds: basket.map((item) => item.id)
    });
    setSaving(false);
    if (!response.ok) {
      const message = await responseMessage(response, t.failed);
      return setStatus(response.status === 400 && message.toLowerCase().includes("already exists") ? t.duplicateList : message);
    }
    setListName("");
    setListNameAr("");
    setBasket([]);
    setItemNotes({});
    setMode("order");
    selectTab("lists");
    await loadWorkspace();
    setStatus(t.listSaved);
  }

  async function duplicateList(id: string) {
    const response = await apiRequest(`/investigations/station/lists/${id}/duplicate`, "POST", {});
    if (!response.ok) return setStatus(await responseMessage(response, t.failed));
    await loadWorkspace();
  }

  async function archiveList(id: string) {
    const response = await apiRequest(`/investigations/station/lists/${id}`, "DELETE");
    if (!response.ok) return setStatus(await responseMessage(response, t.failed));
    await loadWorkspace();
  }

  function openReview() {
    if (!basket.length) return setStatus(t.basketRequired);
    if (mode === "order" && !patientId) return setStatus(t.patientRequired);
    setStatus("");
    setReviewOpen(true);
  }

  async function submitOrder() {
    if (!patientId || !basket.length) return;
    const payload = {
      patientId,
      requestNote: overallNote.trim() || undefined,
      items: basket.map((item) => ({
        title: item.name,
        catalogItemId: item.id,
        requestType: item.category,
        requestNote: itemNotes[item.id]?.trim() || overallNote.trim() || undefined
      }))
    };
    setSaving(true);
    const response = encounterId
      ? await apiRequest("/clinical-requests", "POST", { ...payload, encounterId })
      : await apiRequest("/investigations/standalone-orders", "POST", payload);
    setSaving(false);
    if (!response.ok) {
      setReviewOpen(false);
      return setStatus(await responseMessage(response, t.failed));
    }
    const saved = await response.json() as { id: string };
    setSavedId(saved.id);
    setSavedPrintPath(encounterId ? `/clinical-requests/${encodeURIComponent(saved.id)}/print` : `/investigations/orders/${encodeURIComponent(saved.id)}/print`);
    setReviewOpen(false);
    setBasket([]);
    setItemNotes({});
    setOpenItemNotes(new Set());
    setUndo(null);
    await Promise.all([loadWorkspace(), loadPatientOrders(patientId)]);
    setStatus(t.success);
  }

  function createAnotherOrder() {
    setSavedId("");
    setSavedPrintPath("");
    setOverallNote("");
    setStatus("");
    if (!encounterId) changePatient();
  }

  return (
    <AppShell>
      <header className={styles.header}>
        <h1>{t.title}</h1>
        <div className={styles.headerActions}>
          <Link className="button secondary compact" href="/investigations/manage">{t.manage}</Link>
          <button className="button secondary compact" type="button" onClick={() => {
            setMode((current) => current === "order" ? "list" : "order");
            setStatus("");
            setListName("");
            setListNameAr("");
            setBasket([]);
            setItemNotes({});
            setUndo(null);
          }}>{mode === "order" ? t.createList : t.cancelList}</button>
        </div>
      </header>

      <SafetyAlert />

      <nav className={styles.tabs} aria-label="Investigation views">
        <TabButton active={activeTab === "library"} onClick={() => selectTab("library")}>{t.library} <b>{catalogue.length}</b></TabButton>
        <TabButton active={activeTab === "favorites"} onClick={() => selectTab("favorites")}>{t.favorites} <b>{favorites.length}</b></TabButton>
        <TabButton active={activeTab === "recent"} onClick={() => selectTab("recent")}>{t.recent} <b>{recent.length}</b></TabButton>
        <TabButton active={activeTab === "lists"} onClick={() => selectTab("lists")}>{t.lists} <b>{personalLists.length}</b></TabButton>
        <TabButton active={activeTab === "templates"} onClick={() => selectTab("templates")}>{t.templates} <b>{templates.length}</b></TabButton>
      </nav>

      {status ? <p className={styles.status} role="status">{status}</p> : null}

      {savedId ? (
        <section className={styles.success}>
          <strong>{t.success}</strong>
          <div>
            <Link className="button secondary compact" href={`/patients/${encodeURIComponent(patientId)}?module=investigations`}>{t.openFile}</Link>
            <button className="button secondary compact" type="button" onClick={() => savedPrintPath && window.open(savedPrintPath, "_blank", "noopener,noreferrer")}>{t.print}</button>
            <button className="button compact" type="button" onClick={createAnotherOrder}>{t.another}</button>
          </div>
        </section>
      ) : null}

      <section className={styles.grid}>
        <aside className={`panel ${styles.leftColumn}`}>
          {activeTab === "library" ? (
            <>
              <div className={styles.columnTitle}><h2>{t.categories}</h2><button type="button" onClick={() => { setCategory(""); setSubcategory(""); }}>{t.all}</button></div>
              <input className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchTests} />
              <div className={styles.categories}>
                {categoryTree.map((node) => {
                  const open = openCategories.has(node.name);
                  return (
                    <section key={node.name}>
                      <button className={`${styles.categoryButton} ${category === node.name && !subcategory ? styles.active : ""}`} type="button" onClick={() => {
                        setOpenCategories((current) => {
                          const next = new Set(current);
                          if (next.has(node.name)) next.delete(node.name); else next.add(node.name);
                          return next;
                        });
                        setCategory(node.name);
                        setSubcategory("");
                      }}><span>{open ? "−" : "+"}</span><strong>{node.name}</strong><em>{node.count}</em></button>
                      {open ? <div className={styles.subcategories}>
                        <button className={category === node.name && !subcategory ? styles.activeSubcategory : ""} type="button" onClick={() => { setCategory(node.name); setSubcategory(""); }}>{t.all}</button>
                        {node.subcategories.map((entry) => <button className={subcategory === entry.name ? styles.activeSubcategory : ""} type="button" key={entry.name} onClick={() => { setCategory(node.name); setSubcategory(entry.name); }}><span>{entry.name}</span><em>{entry.count}</em></button>)}
                      </div> : null}
                    </section>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={styles.viewSelector}>
              <button className={activeTab === "favorites" ? styles.activeView : ""} type="button" onClick={() => selectTab("favorites")}>{t.favorites}<b>{favorites.length}</b></button>
              <button className={activeTab === "recent" ? styles.activeView : ""} type="button" onClick={() => selectTab("recent")}>{t.recent}<b>{recent.length}</b></button>
              <button className={activeTab === "lists" ? styles.activeView : ""} type="button" onClick={() => selectTab("lists")}>{t.lists}<b>{personalLists.length}</b></button>
              <button className={activeTab === "templates" ? styles.activeView : ""} type="button" onClick={() => selectTab("templates")}>{t.templates}<b>{templates.length}</b></button>
            </div>
          )}
        </aside>

        <main className={styles.middleColumn}>
          {activeTab === "lists" ? (
            <SetGrid sets={personalLists} empty={t.listsEmpty} selectLabel={t.selectList} duplicateLabel={t.duplicate} archiveLabel={t.archive} onSelect={applySet} onDuplicate={duplicateList} onArchive={archiveList} />
          ) : activeTab === "templates" ? (
            <SetGrid sets={templates} empty={t.templatesEmpty} selectLabel={t.selectList} onSelect={applySet} />
          ) : (
            <section className={`panel ${styles.catalogue}`}>
              <div className={styles.catalogueHeader}>
                <h2>{activeTab === "favorites" ? t.favorites : activeTab === "recent" ? t.recent : subcategory || category || t.library}</h2>
                <span>{visibleItems.length}</span>
              </div>
              {activeTab !== "library" ? <input className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchTests} /> : null}
              <div className={styles.catalogueRows}>
                {visibleItems.map((item) => {
                  const already = basket.some((entry) => entry.id === item.id);
                  const prior = findPrior(item, patientOrders);
                  return (
                    <article className={styles.catalogueRow} key={item.id}>
                      <button className={styles.star} aria-label={`${item.favorite ? "Unfavorite" : "Favorite"} ${item.name}`} type="button" onClick={() => void toggleFavorite(item)}>{item.favorite ? "★" : "☆"}</button>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{[item.subcategory, item.sampleType || item.modality].filter(Boolean).join(" · ")}</span>
                        {prior ? <small>{t.prior}: {prior}</small> : null}
                      </div>
                      <button className="button secondary compact" type="button" disabled={already} onClick={() => addItem(item)}>{already ? t.added : t.add}</button>
                    </article>
                  );
                })}
                {!visibleItems.length ? <p className="empty-state compact smart-empty-state">{t.noResults}</p> : null}
              </div>
            </section>
          )}
        </main>

        <aside className={`panel ${styles.basket}`}>
          <div className={styles.basketHeader}>
            <h2>{mode === "order" ? t.build : t.listBuilder}</h2>
            <div><button className={styles.undo} type="button" disabled={!undo} onClick={undoLast}>{t.undo}</button><button className={styles.clear} type="button" disabled={!basket.length} onClick={clearBasket}>{t.clear}</button></div>
          </div>

          {mode === "order" ? (
            patient ? (
              <section className={styles.patientCard}>
                <div><strong>{patientLabel(patient)}</strong><span>{patient.medicalRecordNumber ? `MRN ${patient.medicalRecordNumber}` : t.selectedPatient}</span></div>
                <div><Link className="button secondary compact" href={`/patients/${encodeURIComponent(patient.id)}`}>{t.openFile}</Link>{!encounterId ? <button className="button secondary compact" type="button" onClick={changePatient}>{t.changePatient}</button> : null}</div>
              </section>
            ) : (
              <PatientPicker key={pickerVersion} patients={[]} selectedPatientId="" onSelect={() => undefined} onPatientSelect={(next) => { if (next) choosePatient(next); }} label={t.searchPatient} required liveSearch minSearchLength={2} storageKey="investigation-station-v3" />
            )
          ) : <p className={styles.listNotice}>{t.listModeNotice}</p>}

          <div className={styles.basketCount}><span>{t.selected}</span><strong>{basket.length}</strong></div>
          <div className={styles.basketRows}>
            {basket.map((item, index) => {
              const noteOpen = openItemNotes.has(item.id);
              return (
                <article className={styles.basketRow} key={item.id}>
                  <div className={styles.basketRowTop}>
                    <div><strong>{item.name}</strong><span>{item.subcategory || item.category}</span></div>
                    <div><button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)}>↑</button><button type="button" disabled={index === basket.length - 1} onClick={() => moveItem(index, 1)}>↓</button><button type="button" onClick={() => removeItem(index)}>×</button></div>
                  </div>
                  {mode === "order" ? <button className={styles.noteToggle} type="button" onClick={() => setOpenItemNotes((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })}>{noteOpen ? t.hideNote : t.addNote}</button> : null}
                  {noteOpen ? <input value={itemNotes[item.id] ?? ""} onChange={(event) => setItemNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={t.overall} /> : null}
                </article>
              );
            })}
            {!basket.length ? <p className="empty-state compact smart-empty-state">{t.empty}</p> : null}
          </div>

          {mode === "list" ? (
            <form className={styles.form} onSubmit={saveList}>
              <label>{t.listName}<input value={listName} onChange={(event) => setListName(event.target.value)} /></label>
              <label>{t.listNameAr}<input dir="rtl" value={listNameAr} onChange={(event) => setListNameAr(event.target.value)} /></label>
              <button className="button" type="submit" disabled={!basket.length || !listName.trim() || saving}>{saving ? t.saving : t.saveList}</button>
            </form>
          ) : (
            <div className={styles.form}>
              <label>{t.overall}<textarea value={overallNote} onChange={(event) => setOverallNote(event.target.value)} /></label>
              <button className="button" type="button" disabled={!patientId || !basket.length || saving} onClick={openReview}>{t.review}</button>
            </div>
          )}
        </aside>
      </section>

      {reviewOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setReviewOpen(false); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="investigation-review-title">
            <h2 id="investigation-review-title">{t.reviewTitle}</h2>
            <dl><div><dt>{t.selectedPatient}</dt><dd>{patient ? patientLabel(patient) : patientId}</dd></div><div><dt>{t.selected}</dt><dd>{basket.length}</dd></div></dl>
            <ol>{basket.map((item) => <li key={item.id}>{item.name}</li>)}</ol>
            {overallNote ? <p>{overallNote}</p> : null}
            <div className={styles.modalActions}><button className="button secondary" type="button" onClick={() => setReviewOpen(false)}>{t.back}</button><button className="button" type="button" disabled={saving} onClick={() => void submitOrder()}>{saving ? t.saving : t.submit}</button></div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick(): void; children: React.ReactNode }) {
  return <button className={active ? styles.activeTab : ""} type="button" onClick={onClick}>{children}</button>;
}

function SetGrid({ sets, empty, selectLabel, duplicateLabel, archiveLabel, onSelect, onDuplicate, onArchive }: { sets: InvestigationSet[]; empty: string; selectLabel: string; duplicateLabel?: string; archiveLabel?: string; onSelect(set: InvestigationSet): void; onDuplicate?(id: string): Promise<void>; onArchive?(id: string): Promise<void> }) {
  return <section className={styles.setGrid}>{sets.map((set) => <article className={`panel ${styles.setCard}`} key={set.id}><div><strong>{displaySetName(set.name)}</strong>{set.nameAr ? <span dir="rtl">{set.nameAr}</span> : null}<small>{set.items.length} items</small></div><div><button className="button compact" type="button" onClick={() => onSelect(set)}>{selectLabel}</button>{onDuplicate && duplicateLabel ? <button className="button secondary compact" type="button" onClick={() => void onDuplicate(set.id)}>{duplicateLabel}</button> : null}{onArchive && archiveLabel ? <button className="button secondary compact" type="button" onClick={() => void onArchive(set.id)}>{archiveLabel}</button> : null}</div></article>)}{!sets.length ? <p className="empty-state compact smart-empty-state">{empty}</p> : null}</section>;
}

function buildCategoryTree(items: CatalogItem[]) {
  const map = new Map<string, Map<string, number>>();
  for (const item of items) {
    const category = item.category || "Other";
    const subcategory = item.subcategory || "Uncategorized";
    const subMap = map.get(category) ?? new Map<string, number>();
    subMap.set(subcategory, (subMap.get(subcategory) ?? 0) + 1);
    map.set(category, subMap);
  }
  return [...map.entries()].map(([name, subMap]) => ({ name, count: [...subMap.values()].reduce((sum, value) => sum + value, 0), subcategories: [...subMap.entries()].map(([subName, count]) => ({ name: subName, count })).sort((a, b) => a.name.localeCompare(b.name)) })).sort((a, b) => (categoryOrder.indexOf(a.name) === -1 ? 99 : categoryOrder.indexOf(a.name)) - (categoryOrder.indexOf(b.name) === -1 ? 99 : categoryOrder.indexOf(b.name)) || a.name.localeCompare(b.name));
}

function deriveRecent(orders: OrderRecord[], catalogue: CatalogItem[]) {
  const byName = new Map(catalogue.map((item) => [normalize(item.name), item]));
  const recent: CatalogItem[] = [];
  for (const order of orders) {
    for (const row of order.items ?? []) {
      const match = byName.get(normalize(row.testName ?? ""));
      if (match && !recent.some((item) => item.id === match.id)) recent.push(match);
      if (recent.length >= 30) return recent;
    }
  }
  return recent;
}

function findPrior(item: CatalogItem, orders: OrderRecord[]) {
  const key = normalize(item.name);
  const match = orders.find((order) => (order.items ?? []).some((entry) => normalize(entry.testName ?? "") === key));
  if (!match) return "";
  const date = match.createdAt || match.requestedAt;
  return `${match.status ?? "requested"}${date ? ` · ${new Date(date).toLocaleDateString()}` : ""}`;
}

function searchable(item: CatalogItem) {
  return normalize([item.name, item.code, item.category, item.subcategory, item.modality, item.sampleType, ...jsonStrings(item.aliasesJson), ...jsonStrings(item.keywordsJson), ...jsonStrings(item.tagsJson)].filter(Boolean).join(" "));
}

function jsonStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function dedupe(items: CatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
}

function displaySetName(value: string) {
  return value.replace(/\s+(review|assessment|workup|visit) candidates$/i, "").replace(/\s+candidates$/i, "");
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

async function apiJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, { credentials: "include", headers: authHeaders() });
  if (!response.ok) throw new Error(await responseMessage(response, "The investigation service is temporarily unavailable."));
  return response.json() as Promise<T>;
}

async function apiRequest(endpoint: string, method: string, payload?: Record<string, unknown>) {
  return fetch(`${getApiBaseUrl()}${endpoint}`, { method, credentials: "include", headers: { "content-type": "application/json", ...authHeaders(), ...csrfHeaders() }, body: payload ? JSON.stringify(payload) : undefined }).catch(() => new Response(null, { status: 500 }));
}

async function responseMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string; error?: { message?: string } } | null;
  return body?.message || body?.error?.message || fallback;
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("prijClinicToken");
  return token ? { authorization: `Bearer ${token}` } : {};
}

function csrfHeaders(): Record<string, string> {
  const token = /(?:^|;\s*)csrf-token=([^;]+)/.exec(document.cookie)?.[1];
  return token ? { "x-csrf-token": decodeURIComponent(token) } : {};
}
