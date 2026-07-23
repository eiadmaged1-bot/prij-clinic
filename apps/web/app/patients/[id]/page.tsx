"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { PregnancyDatingCard } from "../../../components/patients/PregnancyDatingCard";
import { patientWorkspaceRegistry, visiblePatientWorkspaceItems } from "../../../components/patients/patient-workspace-registry";
import { DoctorMobileVisitFooter } from "../../../components/doctor/DoctorMobileVisitFooter";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { useSession } from "../../session";
import { ActiveVisitLauncher } from "../../../components/clinic/ActiveVisitWorkspace";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { useInterfaceMode } from "@/lib/interface-mode";
import type { PatientWorkspaceSummary } from "@prij-clinic/shared";
import { ageLabel as patientAgeLabel, phaseTypeLabel } from "@/lib/patient-labels";
import { AppActionButton } from "@/components/actions/AppActionButton";
import { autosaveLabel, loadLocalDraft, useAutosaveDraft } from "@/lib/autosave-draft";
import { Patient, PregnancyRecord, TabConfig, TimelineItem, ClinicalPhase, InfertilityWorkspace, requestPatientWorkspaceRefresh, PatientQuickActions, ReceptionPatientProfile, ImportantPatientBanner, PatientActionPanel, PatientQrModal, PrintPacketPanel } from "./patient-components";
import { WorkspaceModuleRenderer } from "./workspace-module-renderer";
import type { WorkspacePanelPlacement } from "../../../components/patients/PatientWorkspaceEditor";
import { PatientPanelErrorBoundary } from "../../../components/patients/PatientPanelErrorBoundary";
import { PatientSmartIdentityBar } from "../../../components/patients/PatientSmartIdentityBar";
import { MissingInformationCenter } from "../../../components/patients/MissingInformationCenter";

const legacyTabDefinitions: TabConfig[] = [
  { key: "overview", label: "Overview", icon: "patients", empty: "Start with the patient summary and next best action." },
  { key: "case-feed", label: "Case Feed", icon: "timeline", empty: "No case feed items yet.", permissions: ["patient.read", "encounter.read"] },
  { key: "case-boards", label: "Case Boards", icon: "queue", empty: "No case boards yet.", permissions: ["patient.read"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "timeline", label: "Timeline", icon: "timeline", empty: "The patient story appears here as records are created." },
  { key: "visits", label: "Visits", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready.", permissions: ["encounter.read"] },
  { key: "secretary-intake", label: "Secretary Intake", icon: "files", endpoint: "/patient-intake?patientId=:patientId", collectionKey: "patientIntakes", empty: "No patient-reported intake yet.", permissions: ["patient_intake.read"] },
  { key: "doctor-note", label: "Doctor Clinical Note", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No doctor clinical note yet.", permissions: ["encounter.read"] },
  { key: "doctor-visit", label: "Doctor Visit", icon: "encounter", empty: "Guided doctor visit workflow.", permissions: ["encounter.read", "encounter.create", "care_assist.read"] },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescription yet. Add one during or after the visit.", permissions: ["prescription.read"] },
  { key: "investigations", label: "Investigations", icon: "investigations", endpoint: "/clinical-requests?patientId=:patientId", collectionKey: "clinicalRequests", empty: "No requested investigation yet.", permissions: ["clinical_requests.read", "investigation.read"] },
  { key: "ultrasound", label: "Ultrasound", icon: "ultrasound", endpoint: "/ob-ultrasounds", collectionKey: "obUltrasounds", empty: "No ultrasound record yet.", permissions: ["ob_ultrasound.read", "ob_ultrasound.manage"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet.", permissions: ["pregnancy.read", "pregnancy.manage"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "mother-baby", label: "Mother-Baby", icon: "pregnancy", empty: "No mother-baby workspace yet.", permissions: ["pregnancy.read", "pregnancy.manage"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "gynecology", label: "Gynecology", icon: "doctor", endpoint: "/patients/:patientId/gynecology-visits", collectionKey: "gynecologyVisits", empty: "No gynecology visit yet.", permissions: ["encounter.read", "encounter.create"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "infertility", label: "Infertility", icon: "doctor", endpoint: "/patients/:patientId/infertility", collectionKey: "cycles", empty: "No infertility induction cycle yet.", permissions: ["encounter.read", "encounter.create"], roles: ["Owner", "Admin", "Doctor"] },
  { key: "documents", label: "Documents", icon: "files", endpoint: "/patients/:patientId/documents", collectionKey: "patientDocuments", empty: "No document metadata yet.", permissions: ["patient_document.read"] },
  { key: "billing", label: "Invoices", icon: "billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoice yet.", permissions: ["billing.read", "billing.manage", "billing.report"], roles: ["Owner", "Admin", "Accountant"] },
  { key: "consents", label: "Consents", icon: "consent", endpoint: "/consents?patientId=:patientId", collectionKey: "consentRecords", empty: "No consent record yet.", permissions: ["patient.consent_read", "patient.consent_manage", "consent_template.read"] },
  { key: "follow-up-hints", label: "Follow-up", icon: "timeline", endpoint: "/patients/:patientId/follow-up-hints", collectionKey: "hints", empty: "No active follow-up hints.", permissions: ["follow_up_hints.read"] },
  { key: "medications", label: "Medications", icon: "prescription", empty: "No active medication list entry yet.", permissions: ["patient_medications.read", "medications.search"] },
  { key: "allergies", label: "Allergies", icon: "consent", empty: "No allergy entry yet.", permissions: ["patient_allergies.read"] },
  { key: "medication-safety", label: "Medication Safety", icon: "ai", empty: "Run a medication safety review when clinically needed.", permissions: ["medications.safety_check"] },
  { key: "ai-snapshot", label: "AI Drafts / Care Assist", icon: "ai", empty: "No management snapshot yet. Doctor review is required.", permissions: ["ai_management.request", "ai_management.read", "care_assist.read"] },
  { key: "history", label: "Audit / History", icon: "doctor", endpoint: "/patients/:patientId/history-sheets", collectionKey: "historySheets", empty: "No structured history sheet yet.", permissions: ["patient.read", "encounter.read"] },
  { key: "more", label: "More", icon: "settings", empty: "More patient file sections." }
];

const relatedLoaders: TabConfig[] = [
  ...patientWorkspaceRegistry,
  { key: "appointments", label: "Appointments", icon: "calendar", endpoint: "/appointments", collectionKey: "appointments", empty: "No appointment recorded yet.", permissions: ["appointment.read", "appointments.read"] },
  { key: "queue", label: "Queue", icon: "queue", endpoint: "/queue/today", collectionKey: "queueTickets", empty: "No active queue ticket.", permissions: ["queue.read"] },
  { key: "visits", label: "Encounters", icon: "encounter", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit note yet. Start a visit when the doctor is ready.", permissions: ["encounter.read"] },
  { key: "results", label: "Results", icon: "reports", endpoint: "/patients/:patientId/investigation-results", collectionKey: "investigationResults", empty: "No result metadata yet. Doctor review required.", permissions: ["investigation.result_read"] },
  { key: "files", label: "Reports", icon: "reports", endpoint: "/reports", collectionKey: "reports", empty: "No report record yet. Add report metadata only after doctor review.", permissions: ["report.read"] },
  { key: "pregnancy", label: "Pregnancy", icon: "pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode recorded yet.", permissions: ["pregnancy.read", "pregnancy.manage"] },
  { key: "gynecology", label: "Gynecology", icon: "doctor", endpoint: "/patients/:patientId/gynecology-visits", collectionKey: "gynecologyVisits", empty: "No gynecology visit yet.", permissions: ["encounter.read", "encounter.create"] },
  { key: "consents", label: "Consents", icon: "consent", endpoint: "/consents?patientId=:patientId", collectionKey: "consentRecords", empty: "No consent record yet.", permissions: ["patient.consent_read", "patient.consent_manage", "consent_template.read"] },
  { key: "referrals", label: "Referrals", icon: "reports", endpoint: "/patients/:patientId/referrals", collectionKey: "referrals", empty: "No referral tracked yet.", permissions: ["referral.read"] },
  { key: "tasks", label: "Tasks", icon: "queue", endpoint: "/patients/:patientId/tasks", collectionKey: "patientTasks", empty: "No open patient tasks.", permissions: ["patient_task.read"] },
  { key: "internal-notes", label: "Internal Notes", icon: "doctor", endpoint: "/patients/:patientId/internal-notes", collectionKey: "patientInternalNotes", empty: "No internal notes visible for your role.", permissions: ["patient_internal_note.read"] }
];

const patientWorkspaceTabs = new Set(["overview", "timeline", "visits", "prescriptions", "investigations", "pregnancy", "gynecology", "infertility", "documents", "billing", "consents"]);
const hybridWorkspaceGroups = [
  { key: "overview", label: "Overview", icon: "patients" as const, modules: ["overview", "allergies", "documents", "consents", "tasks", "referrals", "billing", "more"] },
  { key: "visits", label: "Visits", icon: "encounter" as const, modules: ["doctor-visit", "history", "timeline", "pregnancy", "infertility", "ultrasound", "files", "internal-notes", "ai-snapshot"] },
  { key: "investigations", label: "Investigations", icon: "investigations" as const, modules: ["investigations"] },
  { key: "prescriptions", label: "Prescriptions", icon: "prescription" as const, modules: ["prescriptions", "medications"] },
  { key: "guidelines", label: "Guidelines", icon: "files" as const, modules: [] }
] as const;

void legacyTabDefinitions;
void patientWorkspaceTabs;

export default function PatientFilePage() {
  void PrintPacketPanel;
  void PatientQuickActions;
  void PatientActionPanel;
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { expire } = useSession();
  const patientId = params.id;
  const isPreviewMode = searchParams.get("preview") === "queue" || searchParams.get("preview") === "history";
  const { interfaceMode } = useInterfaceMode();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTabState] = useState("overview");
  const [related, setRelated] = useState<Record<string, Record<string, unknown>[]>>({});
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineNextCursor, setTimelineNextCursor] = useState<string | null>(null);
  const [timelineHasMore, setTimelineHasMore] = useState(false);
  const [clinicalPhases, setClinicalPhases] = useState<ClinicalPhase[]>([]);
  const [infertilityWorkspace, setInfertilityWorkspace] = useState<InfertilityWorkspace>({});
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<"none" | "network" | "timeout" | "session">("none");
  const [actionStatus, setActionStatus] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});
  const [workspacePanels, setWorkspacePanels] = useState<WorkspacePanelPlacement[]>([]);
  const draftKey = `patient-visit:${patientId}`;
  const autosave = useAutosaveDraft({ key: draftKey, entityType: "patient_visit_draft", patientId, payload: draftFields, enabled: activeTab === "doctor-visit" && Object.keys(draftFields).length > 0 });
  const autosaveStatus = autosave.state === "saved-local" && autosave.updatedAt ? `Saved at ${new Date(autosave.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : autosaveLabel(autosave.state);

  useEffect(() => {
    const refresh = (event: Event) => {
      const dependencies = (event as CustomEvent<{ refreshDependencies?: string[] }>).detail?.refreshDependencies;
      const activeDependencies = patientWorkspaceRegistry.find((entry) => entry.key === activeTab)?.refreshDependencies ?? [];
      if (!dependencies?.length || dependencies.some((dependency) => activeDependencies.includes(dependency))) setRefreshVersion((version) => version + 1);
    };
    window.addEventListener("patient-workspace:refresh", refresh);
    return () => window.removeEventListener("patient-workspace:refresh", refresh);
  }, [activeTab]);

  useEffect(() => {
    void loadLocalDraft<Record<string, string>>(draftKey).then((record) => { if (record?.payload) setDraftFields(record.payload); });
  }, [draftKey]);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("prijClinicToken");
    void fetch(`${getApiBaseUrl()}/patients/${patientId}/workspace-layout`, {
      credentials: "include",
      signal: controller.signal,
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    }).then(async (response) => {
      if (!response.ok) throw new Error("layout");
      const data = await response.json() as { layout?: { panels?: WorkspacePanelPlacement[] } };
      setWorkspacePanels(data.layout?.panels ?? []);
    }).catch((error) => {
      if ((error as Error).name !== "AbortError") setWorkspacePanels([]);
    });
    return () => controller.abort();
  }, [patientId]);

  useEffect(() => {
    if (activeTab !== "doctor-visit") return;
    const restore = window.setTimeout(() => {
      Object.entries(draftFields).forEach(([name, value]) => {
        const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`.doctor-visit-flow [name="${CSS.escape(name)}"]`);
        if (field && !field.value) field.value = value;
      });
    }, 0);
    const capture = (event: Event) => {
      const field = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!field.name || !field.closest(".doctor-visit-flow")) return;
      setDraftFields((current) => ({ ...current, [field.name]: field.value }));
    };
    document.addEventListener("input", capture);
    document.addEventListener("change", capture);
    return () => { window.clearTimeout(restore); document.removeEventListener("input", capture); document.removeEventListener("change", capture); };
  }, [activeTab, draftFields]);

  useEffect(() => {
    const requested = searchParams.get("module") ?? searchParams.get("tab");
    if (requested && patientWorkspaceRegistry.some((entry) => entry.key === requested)) setActiveTabState(requested);
  }, [searchParams]);

  function setActiveTab(nextTab: string) {
    setActiveTabState(nextTab);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("module", nextTab);
    nextParams.delete("tab");
    router.push(`?${nextParams.toString()}`, { scroll: false });
  }

  const visibleTabs = useMemo(
    () => (workspacePanels.length ? patientWorkspaceRegistry.filter((entry) => {
      const placement = workspacePanels.find((panel) => panel.panelKey === entry.key);
      return placement && !placement.hidden && (!entry.requiredPermissions.length || entry.requiredPermissions.some((permission) => permissions.includes(permission))) && (!entry.roles?.length || entry.roles.some((role) => roles.includes(role)));
    }).sort((a, b) => (workspacePanels.find((panel) => panel.panelKey === a.key)?.order ?? 999) - (workspacePanels.find((panel) => panel.panelKey === b.key)?.order ?? 999)) : visiblePatientWorkspaceItems({ mode: interfaceMode, mobile: false, permissions, roles })).filter((tab) => {
      if (tab.key === "infertility") {
        const hasInfertilityContext = patient?.patientType === "INFERTILITY" || clinicalPhases.some((phase) => phase.phaseType === "infertility") || (infertilityWorkspace.cycles?.length ?? 0) > 0;
        const canOpenClinical = roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
        return hasInfertilityContext || canOpenClinical;
      }
      return true;
    }),
    [clinicalPhases, infertilityWorkspace.cycles?.length, interfaceMode, patient?.patientType, permissions, roles, workspacePanels]
  );
  const visiblePanelKeys = useMemo(() => visibleTabs.map((tab) => tab.key).join(","), [visibleTabs]);
  const activeGroup = useMemo(() => hybridWorkspaceGroups.find((group) => group.key === activeTab || group.modules.some((module) => module === activeTab)) ?? hybridWorkspaceGroups[0], [activeTab]);
  const visibleGroups = useMemo(() => hybridWorkspaceGroups.filter((group) => group.key === "guidelines" ? permissions.some((permission) => ["guidelines.read", "guidelines.search"].includes(permission)) : group.modules.some((module) => visibleTabs.some((tab) => tab.key === module))), [permissions, visibleTabs]);
  const activeGroupTabs = useMemo(() => visibleTabs.filter((tab) => activeGroup.modules.some((module) => module === tab.key)), [activeGroup, visibleTabs]);
  const ageLabel = patientAgeLabel(patient?.dateOfBirth);
  const activePregnancyCount = (related.pregnancy ?? []).filter((row) => String(row.status ?? "").toLowerCase() === "active").length;
  const pendingResultCount = (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "pending_review").length;
  const openFollowUpCount = (related.tasks ?? []).filter((row) => String(row.taskType ?? "") === "schedule_follow_up" && ["open", "in_progress"].includes(String(row.status ?? ""))).length;
  const unpaidInvoiceCount = (related.billing ?? related.invoices ?? []).filter((row) => ["draft", "issued", "partially_paid"].includes(String(row.status ?? ""))).length;
  const currentPhase = clinicalPhases.find((phase) => phase.status === "active") ?? null;
  const roleContextReady = roles.length > 0 || permissions.length > 0;
  const isReceptionistOnly = roles.some((role) => ["Reception", "Receptionist"].includes(role)) && !roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const controller = new AbortController();
    let disposed = false;
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
    setError("");
    setErrorKind("none");
    fetch(`${getApiBaseUrl()}/patients/${patientId}/workspace-summary`, {
      credentials: "include",
      signal: controller.signal,
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (response.status === 401) {
          setPatient(null);
          setRelated({});
          setTimelineItems([]);
          setDraftFields({});
          setErrorKind("session");
          expire(pathname);
          return;
        }
        if (!response.ok) throw new Error("Could not open this patient file.");
        const summary = await response.json() as PatientWorkspaceSummary;
        const names = summary.patient.displayName.trim().split(/\s+/);
        setPatient({ id: summary.patient.id, medicalRecordNumber: summary.patient.medicalRecordNumber, firstName: names.shift() ?? summary.patient.displayName, lastName: names.join(" "), dateOfBirth: summary.patient.dateOfBirth, phone: summary.patient.contactSummary, status: "active", patientType: summary.patient.patientType });
        setClinicalPhases(summary.activeClinicalPhase ? [{ id: "summary", status: "active", ...summary.activeClinicalPhase }] : []);
        setRelated({ appointments: [summary.todayAppointment, summary.nextAppointment].filter(Boolean) as unknown as Record<string, unknown>[], queue: summary.currentQueueTicket ? [summary.currentQueueTicket as unknown as Record<string, unknown>] : [], results: Array.from({ length: summary.pendingResultCount ?? 0 }, () => ({ reviewStatus: "pending_review" })), tasks: summary.pendingFollowUp ? [summary.pendingFollowUp as unknown as Record<string, unknown>] : [], billing: summary.balanceState ? [summary.balanceState as unknown as Record<string, unknown>] : [] });
      })
      .catch((loadError) => {
        if (disposed) return;
        if (loadError instanceof Error && loadError.name === "AbortError" && !timedOut) return;
        setErrorKind(timedOut ? "timeout" : "network");
        setError(timedOut ? "The patient file took too long to respond." : "The patient file is temporarily unavailable.");
      });

    fetch(`${getApiBaseUrl()}/auth/me`, {
      credentials: "include",
      signal: controller.signal,
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (!response.ok) return;
        const session = await response.json() as { user?: { permissions?: string[]; roles?: string[] } };
        setPermissions(session.user?.permissions ?? []);
        setRoles(session.user?.roles ?? []);
      })
      .catch(() => {
        setPermissions([]);
        setRoles([]);
      });
    return () => { disposed = true; window.clearTimeout(timeout); controller.abort(); };
  }, [draftKey, expire, patientId, pathname, refreshVersion]);

  useEffect(() => {
    if (!roleContextReady) return;
    const visibleKeys = new Set(visiblePanelKeys.split(",").filter(Boolean));
    const token = sessionStorage.getItem("prijClinicToken");
    const controller = new AbortController();
    const load = async () => {
      const pairs = await Promise.all(
        relatedLoaders
          .filter((tab) => visibleKeys.has(tab.key) && tab.endpoint && !["infertility", "timeline"].includes(tab.key))
          .map(async (tab) => {
            try {
              const endpoint = (tab.endpoint ?? "").replace(":patientId", encodeURIComponent(patientId));
              const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                credentials: "include",
                signal: controller.signal,
                headers: token ? { authorization: `Bearer ${token}` } : undefined
              });
              if (!response.ok) return [tab.key, []] as const;
              const data = await response.json() as Record<string, unknown>;
              const collection = tab.collectionKey ? data[tab.collectionKey] : data;
              const list = Array.isArray(collection) ? collection as Record<string, unknown>[] : [];
              return [tab.key, endpoint.includes(`/patients/${encodeURIComponent(patientId)}`) || endpoint.includes(`patientId=${encodeURIComponent(patientId)}`) ? list : list.filter((row) => row.patientId === patientId)] as const;
            } catch {
              return [tab.key, []] as const;
            }
          })
      );
      setRelated((current) => ({ ...current, ...Object.fromEntries(pairs) }));
      if (visibleKeys.has("timeline")) try {
        const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/timeline?limit=25`, { credentials: "include", signal: controller.signal, headers: token ? { authorization: `Bearer ${token}` } : undefined });
        if (response.ok) { const data = await response.json() as { items?: TimelineItem[]; nextCursor?: string | null; hasMore?: boolean }; setTimelineItems(data.items ?? []); setTimelineNextCursor(data.nextCursor ?? null); setTimelineHasMore(Boolean(data.hasMore)); }
      } catch { setTimelineItems([]); setTimelineNextCursor(null); setTimelineHasMore(false); }
      if (visibleKeys.has("pregnancy") || visibleKeys.has("infertility")) try {
        const phasesResponse = await fetch(`${getApiBaseUrl()}/patients/${patientId}/phases`, {
          credentials: "include",
          signal: controller.signal,
          headers: token ? { authorization: `Bearer ${token}` } : undefined
        });
        if (phasesResponse.ok) {
          const phaseData = await phasesResponse.json() as { phases?: ClinicalPhase[] };
          setClinicalPhases(phaseData.phases ?? []);
        }
      } catch {
        setClinicalPhases([]);
      }
      if (visibleKeys.has("pregnancy") || visibleKeys.has("infertility")) try {
        const infertilityResponse = await fetch(`${getApiBaseUrl()}/patients/${patientId}/infertility`, {
          credentials: "include",
          signal: controller.signal,
          headers: token ? { authorization: `Bearer ${token}` } : undefined
        });
        if (infertilityResponse.ok) setInfertilityWorkspace(await infertilityResponse.json() as InfertilityWorkspace);
      } catch {
        setInfertilityWorkspace({});
      }
    };
    void load();
    return () => controller.abort();
  }, [patientId, refreshVersion, roleContextReady, visiblePanelKeys]);

  async function loadMoreTimeline() {
    if (!timelineNextCursor) return;
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/timeline?limit=25&cursor=${encodeURIComponent(timelineNextCursor)}`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : undefined });
    if (!response.ok) return;
    const data = await response.json() as { items?: TimelineItem[]; nextCursor?: string | null; hasMore?: boolean };
    setTimelineItems((current) => [...current, ...(data.items ?? []).filter((item) => !current.some((existing) => item.id ? existing.id === item.id : existing.type === item.type && existing.dateTime === item.dateTime && existing.title === item.title))]);
    setTimelineNextCursor(data.nextCursor ?? null); setTimelineHasMore(Boolean(data.hasMore));
  }

  async function submitPatientAction(endpoint: string, payload: Record<string, unknown>) {
    const token = sessionStorage.getItem("prijClinicToken");
    setActionStatus("Saving");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }).catch(() => null);

    if (!response || !response.ok) {
      setActionStatus("Could not save this patient action. Check your role and try again.");
      return;
    }

    setActionStatus("Saved to this patient file.");
    requestPatientWorkspaceRefresh();
  }

  if (patient && !roleContextReady) {
    return (
      <AppShell>
        <section className="panel">
          <div className="skeleton" aria-label="Loading role-safe patient view" />
        </section>
      </AppShell>
    );
  }

  if (patient && isReceptionistOnly) {
    return (
      <AppShell>
        {qrOpen ? <PatientQrModal patient={patient} onClose={() => setQrOpen(false)} /> : null}
        <ReceptionPatientProfile
          patient={patient}
          ageLabel={ageLabel}
          related={related}
          queueRows={(related.queue ?? []) as Record<string, unknown>[]}
          appointmentRows={(related.appointments ?? []) as Record<string, unknown>[]}
          openFollowUpCount={openFollowUpCount}
          unpaidInvoiceCount={unpaidInvoiceCount}
          onShowQr={() => setQrOpen(true)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="patient-context-bar legacy-patient-context-bar" aria-hidden="true">
        <div className="patient-context-identity">
          <strong>{patient ? `${patient.firstName} ${patient.lastName}` : "Opening patient"}</strong>
          <span>{patient ? `MRN ${patient.medicalRecordNumber} · ${ageLabel}` : "Loading patient details"}</span>
        </div>
        <div className="patient-context-signals" aria-label="Patient safety context">
          <span className={currentPhase ? "" : "warning"}>{currentPhase ? `Confirmed phase: ${phaseTypeLabel(currentPhase.phaseType)}` : activePregnancyCount ? "Pregnancy record present · phase needs review" : "Clinical phase missing"}</span>
          <span className={(related.allergies?.length ?? 0) > 0 ? "" : "warning"}>{related.allergies ? `Allergies: ${related.allergies.length ? `${related.allergies.length} recorded` : "none recorded"}` : "Allergies: needs review"}</span>
          {activePregnancyCount ? <span>Confirmed active pregnancy</span> : null}
          {pendingResultCount ? <span>Results pending</span> : null}
          <span data-autosave-state={autosave.state}>{autosaveStatus}</span>
          {autosave.state === "failed" ? <button className="button secondary compact" type="button" onClick={() => void autosave.retry()}>Retry save</button> : null}
        </div>
        <div className="patient-context-actions">
          <AppActionButton actionId="encounter.create" userPermissions={permissions} userRoles={roles} className="button compact" type="button" onClick={() => setActiveTab("doctor-visit")} disabled={!patient}>Start / Resume Visit</AppActionButton>
          <button className="button secondary compact" type="button" onClick={() => setActiveTab("more")} disabled={!patient}>More</button>
        </div>
      </section>

      {isPreviewMode ? (
        <section className="alert preview-mode-banner" data-testid="doctor-queue-preview-mode">
          <div>
            <strong>Preview mode — visit not started</strong>
            <p className="muted" dir="rtl">وضع المعاينة — الزيارة لم تبدأ</p>
          </div>
          <ActiveVisitLauncher className="button compact" patientId={patientId}>
            <><ThreeDMedicalIcon name="encounter" size="sm" />Start Visit</>
          </ActiveVisitLauncher>
        </section>
      ) : null}

      <SafetyAlert />

      {error ? (
        <section className="panel">
          <p className="form-error">{error}</p>
          <div className="form-actions">
            {errorKind !== "session" ? <button className="button" type="button" onClick={() => setRefreshVersion((version) => version + 1)}>Retry</button> : null}
            {errorKind === "session" ? <Link className="button" href={`/login?returnUrl=${encodeURIComponent(pathname)}`}><ThreeDMedicalIcon name="doctor" size="sm" />Reauthenticate</Link> : null}
          </div>
        </section>
      ) : null}

      {patient ? (
        <>
          {qrOpen ? <PatientQrModal patient={patient} onClose={() => setQrOpen(false)} /> : null}
          <ImportantPatientBanner patient={patient} related={related} />
          <PregnancyDatingCard patient={patient} pregnancies={(related.pregnancy ?? []) as PregnancyRecord[]} compact />
          <PatientSmartIdentityBar patient={patient} currentPhase={currentPhase} related={related} infertility={infertilityWorkspace} autosaveStatus={autosaveStatus} onOpenVisit={() => setActiveTab("doctor-visit")} onOpenMore={() => setActiveTab("more")} />
          <MissingInformationCenter patientId={patientId} canUpdate={permissions.includes("patient.update")} />

          <section className="patient-tabs simple hybrid-workspace-tabs" aria-label="Patient file sections">
            {visibleGroups.map((group) => (
              <button className={`tab-button ${activeGroup.key === group.key ? "active" : ""}`} data-tab-key={group.key} key={group.key} onClick={() => {
                const firstModule = visibleTabs.find((tab) => group.modules.some((module) => module === tab.key));
                setActiveTab(firstModule?.key ?? group.key);
              }} type="button">
                <ThreeDMedicalIcon name={group.icon} size="sm" />
                {group.label}
              </button>
            ))}
          </section>

          {activeGroup.key === "guidelines" ? <section className="patient-workspace-grid" aria-label="Guideline evidence workspace">
            <article className="patient-workspace-panel workspace-panel-size-full">
              <div className="patient-workspace-panel-body guideline-patient-workspace">
                <div><h2>Guidelines</h2><p className="muted">Open source-backed evidence and protocols in the governed library. Clinical application remains a separate Doctor-reviewed action.</p></div>
                <div className="form-actions"><Link className="button" href="/guidelines">Open Guidelines Library</Link><Link className="button secondary" href="/protocol-atlas">Open Protocol Atlas</Link></div>
              </div>
            </article>
          </section> : <section className="patient-workspace-grid hybrid-workspace-accordions" aria-label={`${activeGroup.label} workspace`}>
            {activeGroupTabs.map((tab, index) => {
              const placement = workspacePanels.find((panel) => panel.panelKey === tab.key);
              const size = placement?.size ?? "FULL";
              const commonlyNeeded = index === 0 || tab.key === activeTab || ["overview", "doctor-visit", "investigations", "prescriptions"].includes(tab.key);
              return <article className={`patient-workspace-panel workspace-panel-size-${size.toLowerCase()} ${placement?.pinned ? "is-pinned" : ""}`} id={`patient-panel-${tab.key}`} key={tab.key}>
                <PatientPanelErrorBoundary panelKey={tab.key} ownerDiagnostics={roles.some((role) => ["Owner", "Admin"].includes(role))}>
                  <details open={commonlyNeeded && !placement?.collapsed} onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open && activeTab !== tab.key) setActiveTab(tab.key); }}>
                    <summary className="workspace-panel-collapse-summary"><span><ThreeDMedicalIcon name={tab.icon} size="sm" />{tab.label}</span>{placement?.pinned ? <span className="badge">Pinned</span> : null}</summary>
                    <div className="patient-workspace-panel-body"><WorkspaceModuleRenderer
                      active={tab}
                      patient={patient}
                      related={related}
                      timelineItems={timelineItems}
                      timelineHasMore={timelineHasMore}
                      loadMoreTimeline={loadMoreTimeline}
                      clinicalPhases={clinicalPhases}
                      infertilityWorkspace={infertilityWorkspace}
                      actionStatus={actionStatus}
                      submitPatientAction={submitPatientAction}
                      requestPatientWorkspaceRefresh={requestPatientWorkspaceRefresh}
                      setActiveTab={setActiveTab}
                      permissions={permissions}
                      roles={roles}
                    /></div>
                  </details>
                </PatientPanelErrorBoundary>
              </article>;
            })}
          </section>}
        </>
      ) : !error ? (
        <div className="skeleton" />
      ) : null}
      {interfaceMode === "MINIMALISTIC" && patient && activeTab === "doctor-visit" ? <DoctorMobileVisitFooter status={autosave.state === "saving" ? "Saving" : autosave.state === "offline-local" ? "Offline draft" : autosave.state === "failed" ? "Sync failed" : autosave.state === "saved-local" ? "Sync pending" : "Saved"} onAction={(action) => {
        window.dispatchEvent(new CustomEvent("patient-visit:navigate", { detail: action }));
        if (action === "save") {
          document.querySelector<HTMLFormElement>(".doctor-visit-flow .active-visit-step form, .doctor-visit-flow form.active-visit-step")?.requestSubmit();
          setActionStatus("Saving…");
        }
      }} /> : null}
    </AppShell>
  );
}

function workspaceGridColumn(placement?: WorkspacePanelPlacement) {
  if (!placement || placement.size === "FULL" || placement.column <= 1) return undefined;
  const span = placement.size === "SMALL" ? 4 : placement.size === "MEDIUM" ? 6 : 8;
  const start = Math.min(placement.column, 13 - span);
  return `${start} / span ${span}`;
}
