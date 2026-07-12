"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";
import { HerbalSearchPanel, MedicationSafetyPanel, PatientAllergyList, PatientMedicationList, PrescriptionSafetyPanel } from "../../../components/medications/MedicationComponents";
import { PregnancyDatingCard } from "../../../components/patients/PregnancyDatingCard";
import { patientWorkspaceRegistry, visiblePatientWorkspaceItems } from "../../../components/patients/patient-workspace-registry";
import { DoctorMobilePatientHeader } from "../../../components/doctor/DoctorMobilePatientHeader";
import { DoctorMobileVisitFooter } from "../../../components/doctor/DoctorMobileVisitFooter";
import { AppShell, SafetyAlert } from "../../mvp-page";

import { getApiBaseUrl } from "@/lib/api-base-url";
import { visitTypeLabel } from "@/lib/visit-types";
import { useInterfaceMode } from "@/lib/interface-mode";
import type { PatientWorkspaceSummary } from "@prij-clinic/shared";
import { createDoctorVisitFollowUp, getCurrentDoctorVisit, getDoctorVisitPacket, startDoctorVisit, updateDoctorVisit, type DoctorVisitState } from "@/lib/doctor-visit";
import { searchMedications, type MedicationResult } from "@/lib/medications";
import { patientQrSvgDataUri } from "@/lib/patient-qr";
import { ageLabel as patientAgeLabel, patientTypeLabel, patientTypeOptions, phaseTypeLabel } from "@/lib/patient-labels";
import {
  caseBoards,
  conceptionMethodChips,
  currentPregnancyTags,
  feedItemTypes,
  importantPatientBannerItems,
  previousHistoryChips,
  smartClinicalTags
} from "@/lib/v1200-productivity";
import { AppActionButton } from "@/components/actions/AppActionButton";
import { Patient, PregnancyRecord, FetusRecord, GynecologyVisit, TabConfig, TimelineItem, ClinicalPhase, InfertilityWorkspace, ReferenceResult, ServiceItem, SafeAiAssistantPanel, ObDatingReviewPanel, CareAssistPanel, MedicationSafetyTerminal, smartHistoryGroups, gynecologyTemplateOptions, gynecologyTemplateFields, previousPregnancyOutcomeOptions, requestPatientWorkspaceRefresh, PatientQuickActions, ReceptionPatientProfile, doctorReviewedAllergyAlert, ImportantPatientBanner, PatientCaseFeed, CaseBoardsPanel, SmartHistoryOptionChips, SmartObHistoryTags, Overview, MiniCount, MedicationSafetyWorkspace, Metric, DoctorTemplateCards, ReferencePicker, PatientActionPanel, SelectedPatientSummary, PatientQrModal, MorePatientSections, ActionForm, SecretaryIntakePanel, DoctorClinicalNotePanel, values, numericPayload, submitVisitAction, formPayload, RelatedPanel, billingRowSummary, PrintPacketPanel, templateLabel, templateSummary, formatDate, SmartPatientEmptyState, formatDateTime } from "./patient-components";
import { WorkspaceModuleRenderer } from "./workspace-module-renderer";

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
  { key: "consents", label: "Consents", icon: "consent", endpoint: "/consents?patientId=:patientId", collectionKey: "consentRecords", empty: "No consent record yet.", permissions: ["patient.consent_read", "patient.consent_manage", "consent_template.read"] },
  { key: "referrals", label: "Referrals", icon: "reports", endpoint: "/patients/:patientId/referrals", collectionKey: "referrals", empty: "No referral tracked yet.", permissions: ["referral.read"] },
  { key: "tasks", label: "Tasks", icon: "queue", endpoint: "/patients/:patientId/tasks", collectionKey: "patientTasks", empty: "No open patient tasks.", permissions: ["patient_task.read"] },
  { key: "internal-notes", label: "Internal Notes", icon: "doctor", endpoint: "/patients/:patientId/internal-notes", collectionKey: "patientInternalNotes", empty: "No internal notes visible for your role.", permissions: ["patient_internal_note.read"] }
];

const patientWorkspaceTabs = new Set(["overview", "timeline", "visits", "prescriptions", "investigations", "pregnancy", "gynecology", "infertility", "documents", "billing", "consents"]);

const tabs: TabConfig[] = patientWorkspaceRegistry;
void legacyTabDefinitions;
void patientWorkspaceTabs;

export default function PatientFilePage() {
  void PrintPacketPanel;
  void PatientQuickActions;
  void PatientActionPanel;
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [actionStatus, setActionStatus] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshVersion((version) => version + 1);
    window.addEventListener("patient-workspace:refresh", refresh);
    return () => window.removeEventListener("patient-workspace:refresh", refresh);
  }, []);

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

  const active = useMemo(() => tabs.find((tab) => tab.key === activeTab) ?? tabs[0]!, [activeTab]);
  const visibleTabs = useMemo(
    () => visiblePatientWorkspaceItems({ mode: interfaceMode, mobile: false, permissions, roles }).filter((tab) => {
      if (tab.key === "infertility") {
        const hasInfertilityContext = patient?.patientType === "INFERTILITY" || clinicalPhases.some((phase) => phase.phaseType === "infertility") || (infertilityWorkspace.cycles?.length ?? 0) > 0;
        const canOpenClinical = roles.some((role) => ["Owner", "Admin", "Doctor"].includes(role));
        return hasInfertilityContext || canOpenClinical;
      }
      return true;
    }),
    [clinicalPhases, infertilityWorkspace.cycles?.length, interfaceMode, patient?.patientType, permissions, roles]
  );
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
    fetch(`${getApiBaseUrl()}/patients/${patientId}/workspace-summary`, {
      credentials: "include",
      signal: controller.signal,
      headers: token ? { authorization: `Bearer ${token}` } : undefined
    })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Please sign in before opening patient files.");
        if (!response.ok) throw new Error("Could not open this patient file.");
        const summary = await response.json() as PatientWorkspaceSummary;
        const names = summary.patient.displayName.trim().split(/\s+/);
        setPatient({ id: summary.patient.id, medicalRecordNumber: summary.patient.medicalRecordNumber, firstName: names.shift() ?? summary.patient.displayName, lastName: names.join(" "), dateOfBirth: summary.patient.dateOfBirth, phone: summary.patient.contactSummary, status: "active", patientType: summary.patient.patientType });
        setClinicalPhases(summary.activeClinicalPhase ? [{ id: "summary", status: "active", ...summary.activeClinicalPhase }] : []);
        setRelated({ appointments: [summary.todayAppointment, summary.nextAppointment].filter(Boolean) as unknown as Record<string, unknown>[], queue: summary.currentQueueTicket ? [summary.currentQueueTicket as unknown as Record<string, unknown>] : [], results: Array.from({ length: summary.pendingResultCount ?? 0 }, () => ({ reviewStatus: "pending_review" })), tasks: summary.pendingFollowUp ? [summary.pendingFollowUp as unknown as Record<string, unknown>] : [], billing: summary.balanceState ? [summary.balanceState as unknown as Record<string, unknown>] : [] });
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to open patient file."));

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
    return () => controller.abort();
  }, [patientId]);

  useEffect(() => {
    if (!roleContextReady || !visibleTabs.some((tab) => tab.key === activeTab)) return;
    if (activeTab === "overview" || activeTab === "more" || activeTab === "doctor-visit") return;
    const token = sessionStorage.getItem("prijClinicToken");
    const controller = new AbortController();
    const load = async () => {
      const pairs = await Promise.all(
        relatedLoaders
          .filter((tab) => tab.key === activeTab && tab.endpoint && !["infertility", "timeline"].includes(tab.key))
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
      if (activeTab === "timeline") try {
        const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/timeline?limit=25`, { credentials: "include", signal: controller.signal, headers: token ? { authorization: `Bearer ${token}` } : undefined });
        if (response.ok) { const data = await response.json() as { items?: TimelineItem[]; nextCursor?: string | null; hasMore?: boolean }; setTimelineItems(data.items ?? []); setTimelineNextCursor(data.nextCursor ?? null); setTimelineHasMore(Boolean(data.hasMore)); }
      } catch { setTimelineItems([]); setTimelineNextCursor(null); setTimelineHasMore(false); }
      if (["pregnancy", "infertility"].includes(activeTab)) try {
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
      if (activeTab === "infertility") try {
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
  }, [activeTab, patientId, refreshVersion, roleContextReady, visibleTabs]);

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

  async function updatePatientType(nextType: string) {
    if (!patient) return;
    const token = sessionStorage.getItem("prijClinicToken");
    await fetch(`${getApiBaseUrl()}/patients/${patient.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ patientType: nextType })
    });
    setPatient({ ...patient, patientType: nextType });
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
      {interfaceMode === "MINIMALISTIC" && patient ? <DoctorMobilePatientHeader name={`${patient.firstName} ${patient.lastName}`} summary={`${ageLabel} · ${patient.medicalRecordNumber}`} /> : null}
      <section className="patient-simple-hero">
        <div className="patient-avatar">
          <ThreeDMedicalIcon name="patients" size="lg" />
        </div>
        <div>
          <p className="eyebrow">Patient file workspace</p>
          <h1>{patient ? `${patient.firstName} ${patient.lastName}` : "Opening patient"}</h1>
          <p className="muted">{patient ? `${ageLabel} | File ${patient.medicalRecordNumber} | ${patient.phone || patient.email || "No contact saved"}` : "Loading patient details"}</p>
          <div className="workflow-band">
            <span>{patient?.status ? patient.status.replaceAll("_", " ") : "Opening"}</span>
            <span>{patientTypeLabel(patient?.patientType)}</span>
            <span>{currentPhase ? phaseTypeLabel(currentPhase.phaseType) : "No active phase"}</span>
            {patient?.sexualActivityStatus === "not_sexually_active" ? <span>Virgin / Not sexually active</span> : null}
            {activePregnancyCount ? <span>Pregnant</span> : null}
            {pendingResultCount ? <span>Pending results</span> : null}
            {openFollowUpCount ? <span>Follow-up due</span> : null}
            {unpaidInvoiceCount ? <span>Unpaid / balance</span> : null}
            <span>Allergy review</span>
            <span>Current medications</span>
            <span>Last visit: {timelineItems[0]?.dateTime ? formatDateTime(timelineItems[0].dateTime) : "Not recorded"}</span>
            <span>Next appointment: {String((related.appointments ?? [])[0]?.startAt ? formatDateTime(String((related.appointments ?? [])[0]?.startAt)) : "Not booked")}</span>
          </div>
          {permissions.includes("patient.update") ? (
            <label className="inline-edit-control">
              Patient type
              <select value={patient?.patientType ?? "GENERAL"} onChange={(event) => void updatePatientType(event.target.value)}>
                {patientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : null}
        </div>
        <div className="patient-primary-actions">
          <AppActionButton actionId="encounter.create" userPermissions={permissions} userRoles={roles} className="button large" type="button" onClick={() => setActiveTab("doctor-visit")} disabled={!patient}>
            <ThreeDMedicalIcon name="encounter" size="sm" />
            New Encounter
          </AppActionButton>
          <AppActionButton actionId="prescription.create" userPermissions={permissions} userRoles={roles} className="button secondary large" type="button" onClick={() => setActiveTab("prescriptions")} disabled={!patient}>
            <ThreeDMedicalIcon name="prescription" size="sm" tone="slate" />
            Prescription
          </AppActionButton>
          <AppActionButton actionId="investigation.create" userPermissions={permissions} userRoles={roles} className="button secondary large" type="button" onClick={() => setActiveTab("investigations")} disabled={!patient}>
            <ThreeDMedicalIcon name="investigations" size="sm" tone="slate" />
            Request Investigation
          </AppActionButton>
          <Link className="button secondary large" href="/calendar">
            <ThreeDMedicalIcon name="calendar" size="sm" tone="slate" />
            Book Follow-up
          </Link>
          <button className="button secondary large" type="button" onClick={() => setActiveTab("more")} disabled={!patient}>
            <ThreeDMedicalIcon name="settings" size="sm" tone="slate" />
            More
          </button>
          <button className="button secondary compact icon-only-button" type="button" onClick={() => setQrOpen(true)} disabled={!patient} aria-label="Show patient QR" title="Show patient QR">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
          </button>
        </div>
      </section>

      {isPreviewMode ? (
        <section className="alert preview-mode-banner" data-testid="doctor-queue-preview-mode">
          <div>
            <strong>Preview mode — visit not started</strong>
            <p className="muted" dir="rtl">وضع المعاينة — الزيارة لم تبدأ</p>
          </div>
          <Link className="button compact" href={`/doctor/visit?patientId=${patientId}`}>
            <ThreeDMedicalIcon name="encounter" size="sm" />
            Start Visit
          </Link>
        </section>
      ) : null}

      <SafetyAlert />

      {error ? (
        <section className="panel">
          <p className="form-error">{error}</p>
          <Link className="button" href="/login">
            <ThreeDMedicalIcon name="doctor" size="sm" />
            Go to login
          </Link>
        </section>
      ) : null}

      {patient ? (
        <>
          {qrOpen ? <PatientQrModal patient={patient} onClose={() => setQrOpen(false)} /> : null}
          <ImportantPatientBanner patient={patient} related={related} />
          <PregnancyDatingCard patient={patient} pregnancies={(related.pregnancy ?? []) as PregnancyRecord[]} compact />

          <section className="patient-tabs simple" aria-label="Patient file sections">
            {visibleTabs.map((tab) => (
              <button className={`tab-button ${activeTab === tab.key ? "active" : ""}`} data-tab-key={tab.key} key={tab.key} onClick={() => setActiveTab(tab.key)} type="button">
                <ThreeDMedicalIcon name={tab.icon} size="sm" />
                {interfaceMode === "MINIMALISTIC" && tab.key === "prescriptions" ? "Rx" : interfaceMode === "MINIMALISTIC" && tab.key === "investigations" ? "Requests" : tab.label}
              </button>
            ))}
          </section>

          <WorkspaceModuleRenderer
            active={active}
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
          />
        </>
      ) : !error ? (
        <div className="skeleton" />
      ) : null}
      {interfaceMode === "MINIMALISTIC" && patient && activeTab === "doctor-visit" ? <DoctorMobileVisitFooter status={actionStatus.startsWith("Saving") ? "Saving" : actionStatus.startsWith("Saved") ? "Saved" : "Saved"} onAction={(action) => { if (action === "rx") setActiveTab("prescriptions"); else if (action === "requests") setActiveTab("investigations"); else if (action === "finish" && window.confirm("Finish and sign this visit?")) setActionStatus("Saved"); else if (action === "save") setActionStatus("Saving"); }} /> : null}
    </AppShell>
  );
}
