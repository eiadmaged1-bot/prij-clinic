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
  keywordsJson?: unknown;
  tagsJson?: unknown;
  favorite?: boolean;
};

type FavoriteSet = {
  id: string;
  name: string;
  nameAr?: string | null;
  scope?: string;
  actionable?: boolean;
  editable?: boolean;
  guidanceText?: string | null;
  items: Array<{
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
  favoriteSets?: FavoriteSet[];
};

type StationTab = "library" | "lists" | "favorites" | "recent" | "followup" | "templates";

type CategoryNode = {
  name: string;
  count: number;
  subcategories: Array<{ name: string; count: number }>;
};

type SavedBasket = {
  selected: CatalogItem[];
  indications: Record<string, string>;
  priority: string;
  requestNote: string;
  followUpDate: string;
  internalExternal: "internal" | "external";
  followUpOwner: string;
};

const followUpStatuses: Array<[string, string]> = [
  ["needs_review", "Needs review"],
  ["overdue", "Overdue"],
  ["result_received", "Received"],
  ["reviewed", "Reviewed"],
  ["patient_informed", "Patient informed"],
  ["closed", "Closed"]
];

const copy = {
  en: {
    eyebrow: "Doctor clinical workspace",
    title: "Investigation Station",
    subtitle: "Select a patient or work inside an encounter, build the order, and follow results without unnecessary navigation.",
    library: "Investigation library",
    lists: "My lists",
    favorites: "Favorites",
    recent: "Recent",
    followup: "Results follow-up",
    templates: "Templates",
    catalogue: "Catalogue items",
    recentlyUsed: "Recently used",
    categories: "Categories",
    categoryHelp: "Use + to expand a medical department and show its subcategories.",
    search: "Search investigation, abbreviation, alias, or Arabic term",
    all: "All",
    allInCategory: "All in this category",
    noItems: "No active catalogue items match this view.",
    build: "Build your order",
    basketHelp: "Select, reorder, review, and submit without leaving the current workflow.",
    clear: "Clear all",
    selectedItems: "Selected items",
    emptyBasket: "No investigations selected.",
    listName: "List name",
    listNameAr: "Arabic name (optional)",
    saveList: "Save as my list",
    saving: "Saving…",
    overall: "Overall indication / request note",
    priority: "Priority",
    destination: "Destination",
    followUpOwner: "Follow-up owner",
    expectedDate: "Expected result / follow-up date",
    routine: "Routine",
    urgent: "Urgent",
    internal: "Internal",
    external: "External",
    submit: "Review and submit order",
    confirm: "Confirm order",
    patientRequired: "Select a patient before submitting this order.",
    orderSaved: "Investigation order saved and added to the patient record.",
    orderFailed: "The order could not be saved. The patient and basket were kept.",
    directMode: "Direct patient order",
    encounterMode: "Encounter-linked order",
    libraryMode: "Library mode",
    selectPatientHelp: "Search and select a patient to order directly without opening an encounter.",
    activeVisitHelp: "This order is locked to the active patient encounter.",
    clearPatient: "Clear patient",
    openPatient: "Open patient file",
    add: "+ Add",
    added: "Added",
    addSelected: "Add selected",
    lastOrder: "Prior record",
    noPrior: "No matching prior order",
    print: "Print saved request",
    newOrder: "Create another order",
    openTimeline: "Open patient timeline",
    ready: "Investigation database ready.",
    loadFailed: "Could not load the investigation database.",
    templateHelp: "Templates only fill the editable basket. They never submit automatically.",
    guidance: "Guidance-only entries",
    noLists: "No personal lists yet. Build a basket and save it.",
    noTemplates: "No actionable clinic templates are available.",
    duplicateWarning: "An active duplicate request exists. ",
    priorWarning: "A previous reviewed result exists. ",
    confirmAgain: "Review the patient record, then press Confirm order.",
    favoriteAdded: "Favorite updated.",
    favoriteFailed: "Could not update the favorite.",
    listSaved: "Reusable investigation list saved to the database.",
    listFailed: "Could not save the reusable list.",
    statusUpdated: "Result follow-up status updated.",
    statusFailed: "Could not update result follow-up status."
  },
  ar: {
    eyebrow: "مساحة العمل السريرية للطبيب",
    title: "محطة الفحوصات",
    subtitle: "اختر المريضة أو اعمل داخل الزيارة، جهز الطلب، وتابع النتائج بدون تنقل غير ضروري.",
    library: "مكتبة الفحوصات",
    lists: "قوائمي",
    favorites: "المفضلة",
    recent: "المستخدمة حديثاً",
    followup: "متابعة النتائج",
    templates: "القوالب",
    catalogue: "عناصر الكتالوج",
    recentlyUsed: "المستخدمة حديثاً",
    categories: "التصنيفات",
    categoryHelp: "اضغط + لفتح القسم الطبي وإظهار التصنيفات الفرعية.",
    search: "ابحث باسم الفحص أو الاختصار أو الاسم البديل",
    all: "الكل",
    allInCategory: "كل عناصر هذا القسم",
    noItems: "لا توجد فحوصات نشطة تطابق هذا العرض.",
    build: "تجهيز طلب الفحوصات",
    basketHelp: "اختر ورتب وراجع وأرسل بدون مغادرة مسار العمل.",
    clear: "مسح الكل",
    selectedItems: "الفحوصات المختارة",
    emptyBasket: "لم يتم اختيار فحوصات.",
    listName: "اسم القائمة",
    listNameAr: "الاسم بالعربية (اختياري)",
    saveList: "حفظ في قوائمي",
    saving: "جارٍ الحفظ…",
    overall: "السبب السريري / ملاحظة الطلب",
    priority: "الأولوية",
    destination: "الجهة",
    followUpOwner: "مسؤول المتابعة",
    expectedDate: "تاريخ النتيجة أو المتابعة المتوقع",
    routine: "عادي",
    urgent: "عاجل",
    internal: "داخلي",
    external: "خارجي",
    submit: "مراجعة وإرسال الطلب",
    confirm: "تأكيد الطلب",
    patientRequired: "اختر المريضة قبل إرسال الطلب.",
    orderSaved: "تم حفظ طلب الفحوصات وإضافته إلى ملف المريضة.",
    orderFailed: "تعذر حفظ الطلب. تم الاحتفاظ بالمريضة والقائمة.",
    directMode: "طلب مباشر للمريضة",
    encounterMode: "طلب مرتبط بالزيارة",
    libraryMode: "وضع المكتبة",
    selectPatientHelp: "ابحث واختر المريضة لعمل طلب مباشر بدون فتح زيارة.",
    activeVisitHelp: "هذا الطلب مرتبط بزيارة المريضة الحالية.",
    clearPatient: "إلغاء اختيار المريضة",
    openPatient: "فتح ملف المريضة",
    add: "+ إضافة",
    added: "تمت الإضافة",
    addSelected: "إضافة المختار",
    lastOrder: "طلب سابق",
    noPrior: "لا يوجد طلب سابق مطابق",
    print: "طباعة الطلب المحفوظ",
    newOrder: "طلب جديد",
    openTimeline: "فتح الخط الزمني",
    ready: "قاعدة بيانات الفحوصات جاهزة.",
    loadFailed: "تعذر تحميل قاعدة بيانات الفحوصات.",
    templateHelp: "القالب يملأ القائمة القابلة للتعديل فقط ولا يرسل طلباً تلقائياً.",
    guidance: "إرشادات غير قابلة للطلب",
    noLists: "لا توجد قوائم شخصية بعد.",
    noTemplates: "لا توجد قوالب قابلة للاستخدام حالياً.",
    duplicateWarning: "يوجد طلب نشط مماثل. ",
    priorWarning: "توجد نتيجة سابقة تمت مراجعتها. ",
    confirmAgain: "راجع ملف المريضة ثم اضغط تأكيد الطلب.",
    favoriteAdded: "تم تحديث المفضلة.",
    favoriteFailed: "تعذر تحديث المفضلة.",
    listSaved: "تم حفظ قائمة الفحوصات في قاعدة البيانات.",
    listFailed: "تعذر حفظ القائمة.",
    statusUpdated: "تم تحديث حالة متابعة النتيجة.",
    statusFailed: "تعذر تحديث حالة متابعة النتيجة."
  }
} as const;

export default function InvestigationsPage() {
  const { language } = useI18n();
  const t = copy[language];
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
  const [markedIds, setMarkedIds] = useState<Set<string>>(() => new Set());
  const [indications, setIndications] = useState<Record<string, string>>({});
  const [listName, setListName] = useState("");
  const [listNameAr, setListNameAr] = useState("");
  const [priority, setPriority] = useState("routine");
  const [requestNote, setRequestNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [internalExternal, setInternalExternal] = useState<"internal" | "external">("internal");
  const [followUpOwner, setFollowUpOwner] = useState("");
  const [warningsConfirmed, setWarningsConfirmed] = useState(false);
  const [status, setStatus] = useState<string>(t.ready);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRequestId, setSavedRequestId] = useState("");
  const [requestStatus, setRequestStatus] = useState("");

  const hasPatient = Boolean(patientId);
  const hasEncounter = Boolean(patientId && encounterId);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [nextWorkspace, ordersBody] = await Promise.all([
        apiGet("/investigations/catalog") as Promise<Workspace>,
        apiGet("/investigations/orders") as Promise<{ investigationOrders?: InvestigationOrder[] }>
      ]);
      const normalized = dedupeCatalogue((nextWorkspace.investigationCatalog ?? []).map(canonicalizeItem));
      const favoriteIds = new Set((nextWorkspace.favorites ?? []).map((item) => item.id));
      const normalizedWorkspace: Workspace = {
        ...nextWorkspace,
        investigationCatalog: normalized.map((item) => ({ ...item, favorite: favoriteIds.has(item.id) })),
        favorites: normalized.filter((item) => favoriteIds.has(item.id))
      };
      setWorkspace(normalizedWorkspace);
      setRecentItems(deriveRecentItems(ordersBody.investigationOrders ?? [], normalized));
      setStatus(t.ready);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.loadFailed, t.ready]);

  const loadPatientRequests = useCallback(async (nextPatientId: string) => {
    if (!nextPatientId) {
      setPatientRequests([]);
      return;
    }
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
    } catch {
      setStatus(t.statusFailed);
    }
  }, [requestStatus, t.statusFailed]);

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

    const storage = basketStorageKey(nextPatientId, nextEncounterId);
    try {
      const saved = JSON.parse(sessionStorage.getItem(storage) ?? "null") as SavedBasket | null;
      if (Array.isArray(saved?.selected)) setSelected(dedupeCatalogue(saved.selected.map(canonicalizeItem)));
      if (saved?.indications) setIndications(saved.indications);
      if (saved?.priority) setPriority(saved.priority);
      if (typeof saved?.requestNote === "string") setRequestNote(saved.requestNote);
      if (saved?.internalExternal) setInternalExternal(saved.internalExternal);
      if (typeof saved?.followUpOwner === "string") setFollowUpOwner(saved.followUpOwner);
      if (typeof saved?.followUpDate === "string") setFollowUpDate(saved.followUpDate);
    } catch {
      sessionStorage.removeItem(storage);
    }

    void loadWorkspace();
    void loadFollowUp("");
  }, [loadFollowUp, loadPatientRequests, loadWorkspace]);

  useEffect(() => {
    const basket: SavedBasket = { selected, indications, priority, requestNote, followUpDate, internalExternal, followUpOwner };
    sessionStorage.setItem(basketStorageKey(patientId, encounterId), JSON.stringify(basket));
    if (!hasEncounter) return;
    const timer = window.setTimeout(() => {
      void apiRequest("/investigations/order-draft", "PUT", { patientId, encounterId, basket });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [encounterId, followUpDate, followUpOwner, hasEncounter, indications, internalExternal, patientId, priority, requestNote, selected]);

  useEffect(() => setWarningsConfirmed(false), [patientId, selected]);

  const catalogue = useMemo(() => workspace.investigationCatalog ?? [], [workspace.investigationCatalog]);
  const categoryTree = useMemo(() => buildCategoryTree(catalogue), [catalogue]);
  const myLists = useMemo(() => (workspace.favoriteSets ?? []).filter((set) => set.editable), [workspace.favoriteSets]);
  const sharedTemplates = useMemo(() => (workspace.favoriteSets ?? []).filter((set) => !set.editable), [workspace.favoriteSets]);
  const actionableTemplates = sharedTemplates.filter((set) => set.actionable !== false && set.items.length > 0);
  const guidanceOnly = sharedTemplates.filter((set) => set.actionable === false || set.items.length === 0);

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

  function choosePatient(nextPatient: PatientPickerPatient) {
    if (nextPatient.id === patientId) return;
    if (selected.length && patientId && !window.confirm("Change patient and keep the current investigation basket? Cancel to remain on the current patient.")) return;
    setPatient(nextPatient);
    setPatientId(nextPatient.id);
    setEncounterId("");
    setSavedRequestId("");
    setWarningsConfirmed(false);
    void loadPatientRequests(nextPatient.id);
    const params = new URLSearchParams();
    params.set("patientId", nextPatient.id);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    setStatus(t.directMode);
  }

  function clearPatientContext() {
    if (selected.length && !window.confirm("Clear the patient while keeping the basket? The basket cannot be submitted until another patient is selected.")) return;
    setPatient(null);
    setPatientId("");
    setEncounterId("");
    setPatientRequests([]);
    setSavedRequestId("");
    window.history.replaceState(null, "", window.location.pathname);
    setStatus(t.libraryMode);
  }

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

  function add(item: CatalogItem) {
    setSelected((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
    setMarkedIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
  }

  function addMarked() {
    const marked = visibleItems.filter((item) => markedIds.has(item.id));
    setSelected((current) => dedupeCatalogue([...current, ...marked]));
    setMarkedIds(new Set());
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
    setMarkedIds(new Set());
    setIndications({});
    setWarningsConfirmed(false);
    sessionStorage.removeItem(basketStorageKey(patientId, encounterId));
    if (hasEncounter) {
      void apiRequest(`/investigations/order-draft?patientId=${encodeURIComponent(patientId)}&encounterId=${encodeURIComponent(encounterId)}`, "DELETE");
    }
  }

  async function toggleFavorite(item: CatalogItem) {
    const endpoint = item.favorite ? `/investigations/catalog/${item.id}/unfavorite` : `/investigations/catalog/${item.id}/favorite`;
    const response = await apiRequest(endpoint, "POST", {});
    if (!response.ok) {
      setStatus(t.favoriteFailed);
      return;
    }
    await loadWorkspace();
    setStatus(t.favoriteAdded);
  }

  function applySet(set: FavoriteSet) {
    if (set.actionable === false || !set.items.length) {
      setStatus(set.guidanceText || t.guidance);
      return;
    }
    setSelected((current) => dedupeCatalogue([...current, ...set.items.map((entry) => canonicalizeItem(entry.investigationCatalogItem))]));
    setListName(set.name);
    setListNameAr(set.nameAr ?? "");
    setStatus(t.templateHelp);
    basketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveList() {
    if (!listName.trim() || !selected.length) {
      setStatus(t.listFailed);
      return;
    }
    setSaving(true);
    const response = await apiRequest("/investigations/favorite-sets", "POST", {
      name: listName.trim(),
      nameAr: listNameAr.trim() || undefined,
      scope: "personal",
      investigationCatalogItemIds: selected.map((item) => item.id)
    });
    setSaving(false);
    if (!response.ok) {
      setStatus(t.listFailed);
      return;
    }
    setListName("");
    setListNameAr("");
    await loadWorkspace();
    setActiveTab("lists");
    setStatus(t.listSaved);
  }

  async function archiveList(id: string) {
    const response = await apiRequest(`/investigations/favorite-sets/${id}`, "DELETE");
    if (!response.ok) return setStatus(t.listFailed);
    await loadWorkspace();
  }

  async function duplicateList(id: string) {
    const response = await apiRequest(`/investigations/favorite-sets/${id}/duplicate`, "POST", {});
    if (!response.ok) return setStatus(t.listFailed);
    await loadWorkspace();
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!hasPatient || !selected.length) {
      setStatus(t.patientRequired);
      return;
    }

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
      setStatus(`${duplicateActive ? t.duplicateWarning : ""}${priorResult ? t.priorWarning : ""}${t.confirmAgain}`);
      return;
    }

    const payload = {
      patientId,
      priority,
      requestedFollowUpDate: followUpDate || undefined,
      expectedResultDate: followUpDate || undefined,
      requestNote: requestNote || undefined,
      internalExternal,
      responsibilityJson: { followUpOwner: followUpOwner || "unassigned" },
      items: selected.map((item) => ({
        title: item.name,
        catalogItemId: item.id,
        requestType: item.category,
        requestNote: indications[item.id] || requestNote || undefined
      }))
    };

    setSaving(true);
    const response = hasEncounter
      ? await apiRequest("/clinical-requests", "POST", { ...payload, encounterId })
      : await apiRequest("/investigations/standalone-orders", "POST", payload);
    setSaving(false);
    if (!response.ok) {
      setStatus(t.orderFailed);
      return;
    }
    const saved = await response.json() as { id: string };
    setSavedRequestId(saved.id);
    clearBasket();
    await Promise.all([loadPatientRequests(patientId), loadFollowUp("")]);
    setStatus(t.orderSaved);
  }

  async function followUp(id: string, action: "mark-result-received" | "review") {
    const response = await apiRequest(`/clinical-requests/${id}/${action}`, "POST", {});
    if (!response.ok) return setStatus(t.statusFailed);
    await loadFollowUp(requestStatus);
    setStatus(t.statusUpdated);
  }

  async function transition(id: string, target: string) {
    const response = await apiRequest(`/investigations/orders/${id}/status`, "PATCH", { status: target });
    if (!response.ok) return setStatus(t.statusFailed);
    await loadFollowUp(requestStatus);
    setStatus(t.statusUpdated);
  }

  const tabCounts = {
    library: catalogue.length,
    lists: myLists.length,
    favorites: workspace.favorites?.length ?? 0,
    recent: recentItems.length
  };

  return (
    <AppShell>
      <section className={styles.pageHeader}>
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="muted">{t.subtitle}</p>
        </div>
        <div className={styles.headerActions}>
          <Link className="button secondary compact" href="/admin/investigations">Import / manage catalogue</Link>
          <button className="button compact" type="button" onClick={() => { clearBasket(); setActiveTab("library"); }}>{t.newOrder}</button>
        </div>
      </section>

      <SafetyAlert />

      <section className={styles.metrics}>
        <MetricButton active={activeTab === "library"} label={t.catalogue} value={tabCounts.library} onClick={() => setActiveTab("library")} />
        <MetricButton active={activeTab === "lists"} label={t.lists} value={tabCounts.lists} onClick={() => setActiveTab("lists")} />
        <MetricButton active={activeTab === "favorites"} label={t.favorites} value={tabCounts.favorites} onClick={() => setActiveTab("favorites")} />
        <MetricButton active={activeTab === "recent"} label={t.recentlyUsed} value={tabCounts.recent} onClick={() => setActiveTab("recent")} />
      </section>

      <nav className={styles.tabs} aria-label="Investigation station sections">
        <TabButton active={activeTab === "library"} label={t.library} onClick={() => setActiveTab("library")} />
        <TabButton active={activeTab === "lists"} label={t.lists} onClick={() => setActiveTab("lists")} />
        <TabButton active={activeTab === "favorites"} label={t.favorites} onClick={() => setActiveTab("favorites")} />
        <TabButton active={activeTab === "recent"} label={t.recent} onClick={() => setActiveTab("recent")} />
        <TabButton active={activeTab === "followup"} label={t.followup} onClick={() => { setActiveTab("followup"); void loadFollowUp(requestStatus); }} />
        <TabButton active={activeTab === "templates"} label={t.templates} onClick={() => setActiveTab("templates")} />
      </nav>

      <p className={styles.status} role="status">{status}</p>

      {savedRequestId ? (
        <section className={styles.successPanel}>
          <div><strong>{t.orderSaved}</strong><span>{patient ? patientLabel(patient) : patientId}</span></div>
          <div className={styles.successActions}>
            <button className="button secondary compact" type="button" onClick={() => window.open(`/clinical-requests/${encodeURIComponent(savedRequestId)}/print`, "_blank", "noopener,noreferrer")}>{t.print}</button>
            {patientId ? <Link className="button secondary compact" href={`/patients/${encodeURIComponent(patientId)}?tab=timeline`}>{t.openTimeline}</Link> : null}
            <button className="button compact" type="button" onClick={() => setSavedRequestId("")}>{t.newOrder}</button>
          </div>
        </section>
      ) : null}

      {activeTab === "followup" ? (
        <FollowUpPanel
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
              <div><h2>{t.categories}</h2><p className="muted">{t.categoryHelp}</p></div>
              <button className="button secondary compact" type="button" onClick={() => { setSelectedCategory(""); setSelectedSubcategory(""); }}>{t.all}</button>
            </div>
            <input className={styles.categorySearch} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
            <div className={styles.accordionList}>
              {categoryTree.map((node) => {
                const open = openCategories.has(node.name);
                return (
                  <section className={styles.accordionSection} key={node.name}>
                    <button aria-expanded={open} className={`${styles.accordionHeader} ${selectedCategory === node.name && !selectedSubcategory ? styles.selected : ""}`} type="button" onClick={() => toggleCategory(node.name)}>
                      <span className={styles.expandSymbol}>{open ? "−" : "+"}</span>
                      <strong>{node.name}</strong>
                      <span>{node.count}</span>
                    </button>
                    {open ? (
                      <div className={styles.subcategoryList}>
                        <button className={!selectedSubcategory && selectedCategory === node.name ? styles.activeSubcategory : ""} type="button" onClick={() => { setSelectedCategory(node.name); setSelectedSubcategory(""); }}>{t.allInCategory}</button>
                        {node.subcategories.map((subcategory) => (
                          <button className={selectedSubcategory === subcategory.name ? styles.activeSubcategory : ""} key={subcategory.name} type="button" onClick={() => { setSelectedCategory(node.name); setSelectedSubcategory(subcategory.name); }}>
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
              <ListLibrary lists={myLists} emptyText={t.noLists} onApply={applySet} onArchive={archiveList} onDuplicate={duplicateList} />
            ) : activeTab === "templates" ? (
              <TemplateLibrary templates={actionableTemplates} guidance={guidanceOnly} emptyText={t.noTemplates} help={t.templateHelp} guidanceLabel={t.guidance} onApply={applySet} />
            ) : (
              <section className={`panel ${styles.catalogPanel}`}>
                <div className="section-heading">
                  <div>
                    <h2>{activeTab === "favorites" ? t.favorites : activeTab === "recent" ? t.recentlyUsed : t.library}</h2>
                    <p className="muted">{selectedSubcategory || selectedCategory || t.all}</p>
                  </div>
                  <div className={styles.catalogTools}>
                    <span className="badge">{visibleItems.length}</span>
                    <button className="button secondary compact" type="button" disabled={!markedIds.size} onClick={addMarked}>{t.addSelected} ({markedIds.size})</button>
                  </div>
                </div>

                {activeTab === "library" && ((workspace.favorites?.length ?? 0) > 0 || recentItems.length > 0) ? (
                  <div className={styles.quickChips}>
                    {(workspace.favorites ?? []).slice(0, 6).map((item) => <button key={`favorite-${item.id}`} type="button" onClick={() => add(item)}>★ {item.name}</button>)}
                    {recentItems.slice(0, 4).map((item) => <button key={`recent-${item.id}`} type="button" onClick={() => add(item)}>↻ {item.name}</button>)}
                  </div>
                ) : null}

                {loading ? <div className={`skeleton ${styles.loading}`} /> : null}
                {!loading && !visibleItems.length ? <p className="empty-state compact smart-empty-state">{t.noItems}</p> : null}
                <div className={styles.catalogTable}>
                  {visibleItems.map((item) => {
                    const prior = priorOrderFor(item, patientRequests);
                    const alreadyAdded = selected.some((entry) => entry.id === item.id);
                    return (
                      <article className={styles.catalogRow} key={item.id}>
                        <input className={styles.rowCheckbox} type="checkbox" aria-label={`Select ${item.name}`} checked={markedIds.has(item.id)} onChange={(event) => setMarkedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next; })} />
                        <button className={styles.favoriteButton} aria-label={`${item.favorite ? "Unfavorite" : "Favorite"} ${item.name}`} type="button" onClick={() => void toggleFavorite(item)}>{item.favorite ? "★" : "☆"}</button>
                        <div className={styles.catalogIdentity}>
                          <strong>{item.name}</strong>
                          <span>{[item.subcategory, item.sampleType || item.modality].filter(Boolean).join(" · ")}</span>
                          {hasPatient ? <small className={prior ? styles.priorActive : styles.priorNone}>{prior ? `${t.lastOrder}: ${prior}` : t.noPrior}</small> : null}
                        </div>
                        <span className={styles.categoryBadge}>{item.category}</span>
                        <button className="button secondary compact" type="button" disabled={alreadyAdded} onClick={() => add(item)}>{alreadyAdded ? t.added : t.add}</button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </main>

          <aside className={`panel ${styles.basketPanel}`} ref={basketRef}>
            <div className="section-heading">
              <div><h2>{t.build}</h2><p className="muted">{t.basketHelp}</p></div>
              <button className="button secondary compact" type="button" disabled={!selected.length} onClick={clearBasket}>{t.clear}</button>
            </div>

            <PatientPicker
              patients={patient ? [patient] : []}
              selectedPatientId={patientId}
              onSelect={() => undefined}
              onPatientSelect={(nextPatient) => { if (nextPatient) choosePatient(nextPatient); }}
              label={hasEncounter ? t.encounterMode : t.directMode}
              required={false}
              liveSearch
              storageKey="investigation-station-patient"
            />

            {hasPatient ? (
              <div className={styles.patientContext}>
                <strong>{patient ? patientLabel(patient) : patientId}</strong>
                <span>{patient?.medicalRecordNumber ? `MRN ${patient.medicalRecordNumber}` : hasEncounter ? t.activeVisitHelp : t.directMode}</span>
                <div className={styles.patientActions}>
                  <Link className="button secondary compact" href={`/patients/${encodeURIComponent(patientId)}`}>{t.openPatient}</Link>
                  <button className="button secondary compact" type="button" onClick={clearPatientContext}>{t.clearPatient}</button>
                </div>
              </div>
            ) : (
              <div className={styles.managementNotice}><strong>{t.libraryMode}</strong><span>{t.selectPatientHelp}</span></div>
            )}

            <label className={styles.field}>{t.listName}<input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="Example: Early pregnancy routine" /></label>
            <label className={styles.field}>{t.listNameAr}<input dir="rtl" value={listNameAr} onChange={(event) => setListNameAr(event.target.value)} placeholder="اسم القائمة" /></label>

            <div className={styles.basketCount}><span>{t.selectedItems}</span><strong>{selected.length}</strong></div>
            <div className={styles.basketList}>
              {selected.map((item, index) => (
                <article className={styles.basketRow} key={item.id}>
                  <div><strong>{item.name}</strong><span>{item.subcategory || item.category}</span></div>
                  <div className={styles.basketActions}>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.name} up`}>↑</button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === selected.length - 1} aria-label={`Move ${item.name} down`}>↓</button>
                    <button type="button" onClick={() => remove(index)} aria-label={`Remove ${item.name}`}>×</button>
                  </div>
                  {hasPatient ? <input value={indications[item.id] ?? ""} onChange={(event) => setIndications((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Clinical indication" /> : null}
                </article>
              ))}
              {!selected.length ? <p className="empty-state compact smart-empty-state">{t.emptyBasket}</p> : null}
            </div>

            <button className="button secondary" type="button" disabled={!selected.length || saving} onClick={() => void saveList()}>{saving ? t.saving : t.saveList}</button>

            {hasPatient ? (
              <form className={styles.orderForm} onSubmit={submitOrder}>
                <label className={styles.field}>{t.overall}<textarea value={requestNote} onChange={(event) => setRequestNote(event.target.value)} /></label>
                <div className={styles.twoFields}>
                  <label className={styles.field}>{t.priority}<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="routine">{t.routine}</option><option value="urgent">{t.urgent}</option><option value="stat">STAT</option></select></label>
                  <label className={styles.field}>{t.destination}<select value={internalExternal} onChange={(event) => setInternalExternal(event.target.value as "internal" | "external")}><option value="internal">{t.internal}</option><option value="external">{t.external}</option></select></label>
                </div>
                <label className={styles.field}>{t.followUpOwner}<input value={followUpOwner} onChange={(event) => setFollowUpOwner(event.target.value)} placeholder="Doctor, staff member, branch, or provider" /></label>
                <label className={styles.field}>{t.expectedDate}<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
                <button className="button" type="submit" disabled={!selected.length || saving}>{saving ? t.saving : warningsConfirmed ? t.confirm : t.submit}</button>
              </form>
            ) : null}
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

function ListLibrary({ lists, emptyText, onApply, onArchive, onDuplicate }: { lists: FavoriteSet[]; emptyText: string; onApply(set: FavoriteSet): void; onArchive(id: string): Promise<void>; onDuplicate(id: string): Promise<void> }) {
  return (
    <section className={styles.listLibrary}>
      {!lists.length ? <p className="empty-state compact smart-empty-state">{emptyText}</p> : null}
      <div className={styles.listGrid}>
        {lists.map((set) => (
          <article className={`panel ${styles.listCard}`} key={set.id}>
            <button className={styles.listOpen} type="button" onClick={() => onApply(set)}><strong>{set.name}</strong><span>{set.items.length} items</span></button>
            <div className={styles.listCardActions}>
              <button className="button secondary compact" type="button" onClick={() => void onDuplicate(set.id)}>Duplicate</button>
              <button className="button secondary compact" type="button" onClick={() => void onArchive(set.id)}>Archive</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TemplateLibrary({ templates, guidance, emptyText, help, guidanceLabel, onApply }: { templates: FavoriteSet[]; guidance: FavoriteSet[]; emptyText: string; help: string; guidanceLabel: string; onApply(set: FavoriteSet): void }) {
  return (
    <section className={styles.listLibrary}>
      <div className={styles.sectionTitle}><h2>Investigation templates</h2><span>{help}</span></div>
      {!templates.length ? <p className="empty-state compact smart-empty-state">{emptyText}</p> : null}
      <div className={styles.templateGrid}>
        {templates.map((set) => <button className={styles.templateCard} key={set.id} type="button" onClick={() => onApply(set)}><strong>{set.name}</strong>{set.nameAr ? <span dir="rtl">{set.nameAr}</span> : null}<small>{set.items.length} items · {set.items.slice(0, 3).map((entry) => entry.investigationCatalogItem.name).join(", ")}</small></button>)}
      </div>
      {guidance.length ? <details className={styles.guidanceDetails}><summary>{guidanceLabel}</summary><div className={styles.listGrid}>{guidance.map((set) => <article className={`panel ${styles.listCard}`} key={set.id}><strong>{set.name}</strong>{set.nameAr ? <span dir="rtl">{set.nameAr}</span> : null}<p className="muted">{set.guidanceText || "Clinician selection is required."}</p></article>)}</div></details> : null}
    </section>
  );
}

function FollowUpPanel({ counts, requests, requestStatus, onFilter, onReceive, onReview, onTransition }: { counts: Record<string, number>; requests: ClinicalRequest[]; requestStatus: string; onFilter(value: string): void; onReceive(id: string): void; onReview(id: string): void; onTransition(id: string, target: string): void }) {
  return (
    <section className={`panel ${styles.followUpPanel}`}>
      <div className={styles.followUpMetrics}>
        <button className={!requestStatus ? styles.followUpActive : ""} type="button" onClick={() => onFilter("")}><strong>{Object.values(counts).reduce((sum, value) => sum + value, 0)}</strong><span>All</span></button>
        {followUpStatuses.map(([value, label]) => <button className={requestStatus === value ? styles.followUpActive : ""} key={value} type="button" onClick={() => onFilter(value)}><strong>{counts[value] ?? 0}</strong><span>{label}</span></button>)}
      </div>
      <div className={styles.followUpList}>
        {requests.map((request) => (
          <article className={styles.followUpRow} key={request.id}>
            <div><strong>{request.patient ? patientLabel(request.patient) : request.patientId}</strong><span>{request.title}</span><span>{request.status} · {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "date unavailable"}</span></div>
            <div className={styles.followUpActions}>
              {request.status === "requested" || request.status === "result_ready" ? <button type="button" onClick={() => onReceive(request.id)}>Mark received</button> : null}
              {request.status === "result_received" || request.status === "needs_review" ? <button type="button" onClick={() => onReview(request.id)}>Review</button> : null}
              {request.status === "reviewed" ? <button type="button" onClick={() => onTransition(request.id, "patient_informed")}>Patient informed</button> : null}
              {request.status === "patient_informed" ? <button type="button" onClick={() => onTransition(request.id, "closed")}>Close</button> : null}
              <button type="button" onClick={() => window.open(`/clinical-requests/${encodeURIComponent(request.id)}/print`, "_blank", "noopener,noreferrer")}>Print</button>
            </div>
          </article>
        ))}
        {!requests.length ? <p className="empty-state compact smart-empty-state">No investigation requests match this filter.</p> : null}
      </div>
    </section>
  );
}

function buildCategoryTree(items: CatalogItem[]): CategoryNode[] {
  const categories = new Map<string, Map<string, number>>();
  for (const item of items) {
    const category = item.category || "Other";
    const subcategory = item.subcategory || "Uncategorized";
    const subcategories = categories.get(category) ?? new Map<string, number>();
    subcategories.set(subcategory, (subcategories.get(subcategory) ?? 0) + 1);
    categories.set(category, subcategories);
  }
  const order = ["Laboratory", "Imaging", "Pathology", "Cardiac and Functional Tests", "Procedures and Referrals", "Other"];
  return [...categories.entries()]
    .map(([name, subcategories]) => ({ name, count: [...subcategories.values()].reduce((sum, value) => sum + value, 0), subcategories: [...subcategories.entries()].map(([subName, count]) => ({ name: subName, count })).sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => (order.indexOf(a.name) === -1 ? 99 : order.indexOf(a.name)) - (order.indexOf(b.name) === -1 ? 99 : order.indexOf(b.name)) || a.name.localeCompare(b.name));
}

function canonicalizeItem(item: CatalogItem): CatalogItem {
  const key = normalize([item.category, item.subcategory, item.name, item.modality].filter(Boolean).join(" "));
  if (/cytology|histopath|pathology|pap|hpv/.test(key)) return { ...item, category: "Pathology", subcategory: /histopath|biopsy|tissue/.test(key) ? "Histopathology" : /molecular|hpv/.test(key) ? "Molecular Pathology" : "Cytology" };
  if (/ultrasound|sonograph|radiology|imaging|mri|ct |x ray|xray|mammograph|fluoroscop|hsg/.test(key)) {
    if (/obstetric|pregnancy|fetal|nuchal|anomaly|growth|cervical length/.test(key)) return { ...item, category: "Imaging", subcategory: "Obstetric Ultrasound" };
    if (/fertility|infertil|follic/.test(key)) return { ...item, category: "Imaging", subcategory: "Fertility Ultrasound" };
    if (/gynec|pelvic ultrasound|transvaginal|uterine|sonohyst/.test(key)) return { ...item, category: "Imaging", subcategory: "Gynecologic Ultrasound" };
    if (/breast|mammograph/.test(key)) return { ...item, category: "Imaging", subcategory: "Breast Imaging" };
    if (/mri/.test(key)) return { ...item, category: "Imaging", subcategory: "MRI" };
    if (/ct /.test(`${key} `)) return { ...item, category: "Imaging", subcategory: "CT" };
    if (/x ray|xray|fluoroscop|hsg/.test(key)) return { ...item, category: "Imaging", subcategory: "X-ray and Fluoroscopy" };
    return { ...item, category: "Imaging", subcategory: item.subcategory || "General Imaging" };
  }
  if (/cardiac|cardio|ecg|echo/.test(key)) return { ...item, category: "Cardiac and Functional Tests", subcategory: item.subcategory || "Cardiac Testing" };
  if (/referral|specialist|assessment|preoperative|anaesth|anesth/.test(key)) return { ...item, category: "Procedures and Referrals", subcategory: item.subcategory || "Specialist Assessment" };
  if (/microbiology|culture|swab|naat|pcr/.test(key)) return { ...item, category: "Laboratory", subcategory: "Microbiology" };
  if (/prenatal|nipt|karyotype|genetic|quad screen/.test(key)) return { ...item, category: "Laboratory", subcategory: "Genetics and Prenatal Screening" };
  if (/serology|infectious|antenatal screening|immunology|antibody|hiv|hbsag|hcv|rubella|toxoplas|cmv|vdrl|rpr/.test(key)) return { ...item, category: "Laboratory", subcategory: "Serology and Immunology" };
  if (/coag|inr|aptt|fibrin|d dimer/.test(key)) return { ...item, category: "Laboratory", subcategory: "Coagulation" };
  if (/hormone|endocr|tsh|prolact|amh|testosterone|estradiol|progesterone|fsh|lh/.test(key)) return { ...item, category: "Laboratory", subcategory: "Endocrinology and Reproductive Hormones" };
  if (/urine|urinal/.test(key)) return { ...item, category: "Laboratory", subcategory: "Urine Analysis" };
  if (/hemat|blood count|cbc|platelet|ferritin|iron/.test(key)) return { ...item, category: "Laboratory", subcategory: "Hematology" };
  if (/tumor|ca 125|cea|afp|he4/.test(key)) return { ...item, category: "Laboratory", subcategory: "Tumor Markers" };
  if (/andrology|semen/.test(key)) return { ...item, category: "Laboratory", subcategory: "Andrology" };
  if (/laboratory| lab |biochem|chemistry|glucose|liver|kidney|electrolyte|vitamin/.test(` ${key} `)) return { ...item, category: "Laboratory", subcategory: item.subcategory && !/general|laboratory general|prenatal ob tests/.test(normalize(item.subcategory)) ? item.subcategory : "Clinical Chemistry" };
  return item.category === "Other" ? { ...item, category: "Procedures and Referrals", subcategory: item.subcategory || "Specialist Assessment" } : item;
}

function dedupeCatalogue(items: CatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.code ? normalize(item.code) : normalize(item.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchableText(item: CatalogItem) {
  return normalize([item.name, item.code, item.category, item.subcategory, item.modality, item.sampleType, ...jsonStrings(item.aliasesJson), ...jsonStrings(item.keywordsJson), ...jsonStrings(item.tagsJson)].filter(Boolean).join(" "));
}

function jsonStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  return [];
}

function deriveRecentItems(orders: InvestigationOrder[], catalogue: CatalogItem[]) {
  const byName = new Map(catalogue.map((item) => [normalize(item.name), item]));
  const result: CatalogItem[] = [];
  for (const order of orders) {
    for (const item of order.items ?? []) {
      const match = byName.get(normalize(item.testName ?? ""));
      if (match && !result.some((entry) => entry.id === match.id)) result.push(match);
      if (result.length >= 30) return result;
    }
  }
  return result;
}

function priorOrderFor(item: CatalogItem, requests: ClinicalRequest[]) {
  const name = normalize(item.name);
  const request = requests.find((entry) => (entry.items ?? []).some((row) => normalize(row.testName ?? "") === name));
  if (!request) return "";
  const date = request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "date unavailable";
  return `${request.status} · ${date}`;
}

function basketStorageKey(patientId: string, encounterId: string) {
  return `prij:investigation-basket:${patientId || "library"}:${encounterId || "standalone"}`;
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

async function apiGet(endpoint: string) {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, { credentials: "include", headers: authHeaders() });
  if (!response.ok) throw new Error("The investigation service is temporarily unavailable.");
  return response.json();
}

async function apiRequest(endpoint: string, method: string, payload?: Record<string, unknown>) {
  return fetch(`${getApiBaseUrl()}${endpoint}`, {
    method,
    credentials: "include",
    headers: { "content-type": "application/json", ...authHeaders(), ...csrfHeaders() },
    body: payload ? JSON.stringify(payload) : undefined
  }).catch(() => new Response(null, { status: 500 }));
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("prijClinicToken");
  return token ? { authorization: `Bearer ${token}` } : {};
}

function csrfHeaders(): Record<string, string> {
  const token = /(?:^|;\s*)csrf-token=([^;]+)/.exec(document.cookie)?.[1];
  return token ? { "x-csrf-token": decodeURIComponent(token) } : {};
}
