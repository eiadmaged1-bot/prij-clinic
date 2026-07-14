import Link from "next/link";
import Image from "next/image";
import { AppActionButton } from "@/components/actions/AppActionButton";
import { AppActionLink } from "@/components/actions/AppActionLink";
import { FormEvent, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";
import { HerbalSearchPanel, MedicationSafetyPanel, PatientAllergyList, PatientMedicationList, PrescriptionSafetyPanel } from "../../../components/medications/MedicationComponents";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { visitTypeLabel } from "@/lib/visit-types";
import { patientQrSvgDataUri } from "@/lib/patient-qr";
import { patientTypeLabel } from "@/lib/patient-labels";
import { caseBoards, conceptionMethodChips, currentPregnancyTags, feedItemTypes, importantPatientBannerItems, previousHistoryChips, smartClinicalTags } from "@/lib/v1200-productivity";
import { DoctorSignatureBadge, timelineIcon } from "./timeline-components";
export { formatDateTime } from "./workspace-formatters";
import { formatDateTime } from "./workspace-formatters";

export type Patient = {
      id: string;
      branchId?: string | null;
      medicalRecordNumber: string;
      firstName: string;
      lastName: string;
      dateOfBirth?: string | null;
      sex?: string | null;
      phone?: string | null;
      email?: string | null;
      status: string;
      patientType?: string | null;
      sexualActivityStatus?: string | null;
      notes?: string | null;
    };
export type PregnancyRecord = {
      id?: string;
      gravida?: number | string | null;
      para?: number | string | null;
      living?: number | string | null;
      abortions?: number | string | null;
      lmp?: string | null;
      lmpDate?: string | null;
      edd?: string | null;
      estimatedDueDate?: string | null;
      datingMethod?: string | null;
      datingScanDate?: string | null;
      status?: string | null;
      notes?: string | null;
      fetuses?: FetusRecord[];
      previousPregnancies?: Record<string, unknown>[];
      antenatalVisits?: Record<string, unknown>[];
      obUltrasounds?: Record<string, unknown>[];
    };
export type FetusRecord = {
      id?: string;
      label?: string | null;
      chorionicity?: string | null;
      amnionicity?: string | null;
      status?: string | null;
      notes?: string | null;
    };
export type GynecologyVisit = {
      id?: string;
      templateType?: string | null;
      visitDate?: string | null;
      reasonForVisit?: string | null;
      menstrualHistory?: string | null;
      bleedingPattern?: string | null;
      painSymptoms?: string | null;
      dischargeSymptoms?: string | null;
      contraceptionHistory?: string | null;
      examinationNotes?: string | null;
      doctorImpression?: string | null;
      doctorPlan?: string | null;
      followUpDate?: string | null;
      createdByUser?: { displayName?: string | null } | null;
    };
export type TabConfig = {
      key: string;
      label: string;
      icon: IconName;
      endpoint?: string;
      collectionKey?: string;
      empty: string;
      permissions?: string[];
      roles?: string[];
    };
export type TimelineItem = {
      id?: string;
      sourceId?: string;
      dateTime: string;
      type: string;
      title: string;
      status: string;
      description: string;
      actor?: string;
      href?: string;
      doctorSignature?: {
        doctorName?: string;
        doctorColor?: string;
        doctorShortLabel?: string | null;
        startedAt?: string;
      };
    };
export type ClinicalPhase = { id: string; phaseType: string; title: string; status: string; startDate?: string; outcome?: string | null; notes?: string | null };
export type InfertilityWorkspace = {
      phases?: ClinicalPhase[];
      episodes?: Record<string, unknown>[];
      cycles?: Record<string, unknown>[];
      monitoringVisits?: Record<string, unknown>[];
      estradiolResults?: Record<string, unknown>[];
    };
export type ReferenceResult = {
      id: string;
      label: string;
      type: string;
      genericName?: string;
      familyName?: string | null;
      category?: string;
      specialty?: string;
    };
export type ServiceItem = {
      id: string;
      code: string;
      name: string;
      category: string;
      price: string | null;
      currency: string;
    };

export const SafeAiAssistantPanel = dynamic(() => import("../../../components/ai-assistant/SafeAiAssistantPanel").then((module) => module.SafeAiAssistantPanel), { loading: () => <div className="skeleton" aria-label="Loading review hints" /> });
export const ObDatingReviewPanel = dynamic(() => import("../../../components/calculators/ObDatingReviewPanel").then((module) => module.ObDatingReviewPanel), { loading: () => <div className="skeleton" aria-label="Loading calculator" /> });
export const CareAssistPanel = dynamic(() => import("../../../components/care-assist/CareAssistPanel").then((module) => module.CareAssistPanel), { loading: () => <div className="skeleton" aria-label="Loading care review" /> });
export const MedicationSafetyTerminal = dynamic(() => import("../../../components/medications/MedicationSafetyTerminal").then((module) => module.MedicationSafetyTerminal), { loading: () => <div className="skeleton" aria-label="Loading medication safety" /> });
export const smartHistoryGroups = [
  {
    title: "Presenting complaint",
    sourceType: "manual",
    items: [["aub", "AUB"], ["pelvic_pain", "Pelvic pain"], ["amenorrhea", "Amenorrhea"], ["vaginal_discharge", "Vaginal discharge"]]
  },
  {
    title: "Gynecology symptoms",
    sourceType: "manual",
    items: [["heavy_menstrual_bleeding", "Heavy menstrual bleeding"], ["intermenstrual_bleeding", "Intermenstrual bleeding"], ["postcoital_bleeding", "Postcoital bleeding"], ["postmenopausal_bleeding", "Postmenopausal bleeding"], ["dysmenorrhea", "Dysmenorrhea"], ["dyspareunia", "Dyspareunia"], ["oligomenorrhea", "Oligomenorrhea"]]
  },
  {
    title: "Gynecology diagnoses",
    sourceType: "manual",
    items: [["pcos", "PCOS"], ["fibroid", "Fibroid"], ["endometriosis", "Endometriosis"], ["adenomyosis", "Adenomyosis"], ["ovarian_cyst", "Ovarian cyst"], ["pid", "PID"], ["infertility", "Infertility"]]
  },
  {
    title: "Medical history",
    sourceType: "history_sheet",
    items: [["diabetes", "Diabetes"], ["hypertension", "Hypertension"], ["thyroid_disease", "Thyroid disease"], ["lupus", "Lupus"], ["anticoagulant_use", "Anticoagulant use"], ["medication_class", "Medication class"], ["asthma", "Asthma"], ["anemia", "Anemia"], ["pcos", "PCOS"], ["endometriosis", "Endometriosis"], ["recurrent_pregnancy_loss", "Recurrent pregnancy loss"]]
  },
  {
    title: "Operations / procedures",
    sourceType: "operation_history",
    items: [["cesarean_section", "Cesarean section"], ["dilation_and_curettage", "D&C / Dilation and curettage"], ["hysteroscopy", "Hysteroscopy"], ["laparoscopy", "Laparoscopy"], ["ovarian_cystectomy", "Ovarian cystectomy"], ["myomectomy", "Myomectomy"], ["hysterectomy", "Hysterectomy"], ["salpingectomy", "Salpingectomy"], ["oophorectomy", "Oophorectomy"], ["endometrial_ablation", "Endometrial ablation"], ["cervical_cerclage", "Cervical cerclage"], ["ivf_icsi_procedure", "IVF/ICSI procedure"], ["mastectomy", "Mastectomy"]]
  },
  {
    title: "Obstetric history",
    sourceType: "previous_pregnancy",
    items: [["normal_vaginal_delivery", "NVD"], ["previous_cesarean_section", "Previous CS"], ["instrumental_delivery", "Instrumental delivery"], ["miscarriage_abortion", "Miscarriage / abortion"], ["ectopic_pregnancy", "Ectopic"], ["molar_pregnancy", "Molar pregnancy"], ["iufd_stillbirth", "IUFD / stillbirth"]]
  }
] as const;
export const gynecologyTemplateOptions = [
      ["general", "Gynecology visit"],
      ["abnormal_uterine_bleeding", "Abnormal bleeding"],
      ["pelvic_pain", "Pelvic pain"],
      ["pcos", "PCOS"],
      ["fibroid_ovarian_cyst", "Fibroid or ovarian cyst"],
      ["contraception", "Contraception counseling"]
    ] as const;
export const gynecologyTemplateFields: Record<string, Array<[string, string, "text" | "textarea" | "date"]>> = {
      general: [
        ["reasonForVisit", "Reason for visit", "textarea"],
        ["menstrualHistory", "Menstrual history", "textarea"],
        ["bleedingPattern", "Bleeding pattern", "textarea"],
        ["painSymptoms", "Pain symptoms", "textarea"],
        ["dischargeSymptoms", "Discharge or infection symptoms", "textarea"],
        ["obstetricHistorySummary", "Obstetric history summary", "textarea"],
        ["contraceptionHistory", "Contraception history", "textarea"],
        ["medicalSurgicalHistory", "Relevant medical or surgical history", "textarea"],
        ["examinationNotes", "Examination notes", "textarea"],
        ["doctorImpression", "Doctor-written impression", "textarea"],
        ["doctorPlan", "Doctor-written plan", "textarea"],
        ["followUpDate", "Follow-up date", "date"]
      ],
      abnormal_uterine_bleeding: [
        ["cycleRegularity", "Cycle regularity", "text"],
        ["bleedingDuration", "Duration", "text"],
        ["bleedingAmount", "Amount", "text"],
        ["clots", "Clots", "text"],
        ["intermenstrualBleeding", "Intermenstrual bleeding", "text"],
        ["postcoitalBleeding", "Postcoital bleeding", "text"],
        ["associatedSymptoms", "Associated symptoms", "textarea"],
        ["pregnancyTestNote", "Pregnancy test note", "textarea"],
        ["doctorImpression", "Doctor-written impression", "textarea"]
      ],
      pelvic_pain: [
        ["painOnset", "Onset", "text"],
        ["painDuration", "Duration", "text"],
        ["painSite", "Site", "text"],
        ["relationToCycle", "Relation to cycle", "text"],
        ["painSeverity", "Severity", "text"],
        ["urinaryBowelSymptoms", "Urinary or bowel symptoms", "textarea"],
        ["associatedSymptoms", "Associated symptoms", "textarea"],
        ["doctorImpression", "Doctor-written impression", "textarea"]
      ],
      pcos: [
        ["cyclePattern", "Cycle pattern", "text"],
        ["acneHirsutismNote", "Acne or hirsutism note", "textarea"],
        ["weightMetabolicRiskNote", "Weight or metabolic risk note", "textarea"],
        ["ultrasoundNote", "Ultrasound note field", "textarea"],
        ["labsNote", "Labs note field", "textarea"],
        ["doctorImpression", "Doctor-written impression", "textarea"]
      ],
      fibroid_ovarian_cyst: [
        ["findingSource", "Finding source", "text"],
        ["sizeLocationNote", "Size or location note", "textarea"],
        ["symptoms", "Symptoms", "textarea"],
        ["followUpPlan", "Follow-up plan", "textarea"],
        ["doctorImpression", "Doctor-written impression", "textarea"]
      ],
      contraception: [
        ["currentMethod", "Current method", "text"],
        ["previousMethods", "Previous methods", "textarea"],
        ["contraindicationChecklist", "Contraindication checklist", "textarea"],
        ["counselingNotes", "Counseling notes", "textarea"],
        ["chosenMethod", "Chosen method", "text"],
        ["followUpPlan", "Follow-up plan", "textarea"]
      ]
    };
export const previousPregnancyOutcomeOptions = [
      "Normal vaginal delivery",
      "Cesarean section",
      "Instrumental delivery",
      "Preterm delivery",
      "Miscarriage / abortion",
      "Ectopic pregnancy",
      "Molar pregnancy",
      "Stillbirth / IUFD",
      "Ongoing pregnancy",
      "Other"
    ];

export function requestPatientWorkspaceRefresh() {
    window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
}

export function PatientQuickActions({ patient, setActiveTab, onShowQr, permissions = [], roles = [] }: { patient: Patient; setActiveTab(tab: string): void; onShowQr(): void; permissions?: string[]; roles?: string[] }) {
    const actions: Array<{ actionId?: string; label: string; tab?: string; href?: string; onClick?: () => void; icon: IconName }> = [
            { actionId: "encounter.create", label: "Add visit", tab: "doctor-visit", icon: "encounter" },
            { actionId: "prescription.create", label: "Add prescription", tab: "prescriptions", icon: "prescription" },
            { actionId: "investigation.create", label: "Request investigation", tab: "investigations", icon: "investigations" },
            { label: "Add payment", tab: "billing", icon: "billing" },
            { label: "Upload document", tab: "documents", icon: "files" },
            { label: "Print packet", href: `/patients/${patient.id}/print/packet`, icon: "reports" },
            { label: "Book follow-up", href: "/calendar", icon: "calendar" },
            { label: "Show QR", onClick: onShowQr, icon: "search" },
            { label: "Add consent", tab: "documents", icon: "consent" }
          ];
    return (
    <section className="panel compact-panel patient-quick-actions" aria-label="Patient quick actions">
      <div className="section-heading">
        <h2>Quick actions</h2>
        <span className="badge">Role-aware workflow</span>
      </div>
      <div className="toolbar compact-toolbar">
        {actions.map((action) => action.href ? (
          action.actionId ? (
            <AppActionLink actionId={action.actionId} userPermissions={permissions} userRoles={roles} className="button secondary compact" href={action.href} key={action.label}>
              <ThreeDMedicalIcon name={action.icon} size="sm" tone="slate" />
              {action.label}
            </AppActionLink>
          ) : (
            <Link className="button secondary compact" href={action.href} key={action.label}>
              <ThreeDMedicalIcon name={action.icon} size="sm" tone="slate" />
              {action.label}
            </Link>
          )
        ) : (
          action.actionId ? (
            <AppActionButton actionId={action.actionId} userPermissions={permissions} userRoles={roles} className="button secondary compact" key={action.label} type="button" onClick={action.onClick ?? (() => action.tab && setActiveTab(action.tab))}>
              <ThreeDMedicalIcon name={action.icon} size="sm" tone="slate" />
              {action.label}
            </AppActionButton>
          ) : (
            <button className="button secondary compact" key={action.label} type="button" onClick={action.onClick ?? (() => action.tab && setActiveTab(action.tab))}>
              <ThreeDMedicalIcon name={action.icon} size="sm" tone="slate" />
              {action.label}
            </button>
          )
        ))}
      </div>
    </section>
    );
}

export function ReceptionPatientProfile({
      patient,
      ageLabel,
      related,
      queueRows,
      appointmentRows,
      openFollowUpCount,
      unpaidInvoiceCount,
      onShowQr
    }: {
          patient: Patient;
          ageLabel: string;
          related: Record<string, Record<string, unknown>[]>;
          queueRows: Record<string, unknown>[];
          appointmentRows: Record<string, unknown>[];
          openFollowUpCount: number;
          unpaidInvoiceCount: number;
          onShowQr(): void;
        }) {
    const activeQueue = queueRows.find((row) => ["waiting", "called", "checked_in"].includes(String(row.status ?? "")));
    const nextAppointment = appointmentRows
            .filter((row) => row.startAt)
            .sort((left, right) => String(left.startAt).localeCompare(String(right.startAt)))[0];
    const consentRows = related.consents ?? [];
    const alerts = [
            consentRows.length === 0 ? "Needs consent" : "",
            patient.phone || patient.email ? "" : "No contact saved",
            openFollowUpCount > 0 ? "Follow-up due" : "",
            unpaidInvoiceCount > 0 ? "Payment pending" : "",
            doctorReviewedAllergyAlert(related.allergies ?? []) ? "Doctor-reviewed alert" : ""
          ].filter(Boolean);
    return (
    <>
      <section className="patient-simple-hero reception-profile-hero">
        <div className="patient-avatar">
          <ThreeDMedicalIcon name="reception" size="lg" />
        </div>
        <div>
          <p className="eyebrow">Reception Profile</p>
          <h1>{patient.firstName} {patient.lastName}</h1>
          <p className="muted">{ageLabel} | File {patient.medicalRecordNumber} | {patient.phone || patient.email || "No contact saved"}</p>
          <div className="workflow-band operational-alerts">
            <span>{patient.status.replaceAll("_", " ")}</span>
            <span>{patientTypeLabel(patient.patientType)}</span>
            {alerts.length ? alerts.map((alert) => <span key={alert}>{alert}</span>) : <span>No operational alerts</span>}
          </div>
        </div>
        <div className="patient-primary-actions">
          <Link className="button secondary large" href="/reception">
            <ThreeDMedicalIcon name="reception" size="sm" tone="slate" />
            Reception
          </Link>
          <Link className="button large" href="/queue">
            <ThreeDMedicalIcon name="queue" size="sm" />
            Queue
          </Link>
          <button className="button secondary compact icon-only-button" type="button" onClick={onShowQr} aria-label="Show patient QR" title="Show patient QR">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
          </button>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel compact-panel">
          <div className="section-heading"><h2>Patient identity</h2><span className="badge">Reception</span></div>
          <dl className="profile-grid">
            <div><dt>File number</dt><dd>{patient.medicalRecordNumber}</dd></div>
            <div><dt>Phone/contact</dt><dd>{patient.phone || patient.email || "No contact saved"}</dd></div>
            <div><dt>Age</dt><dd>{ageLabel}</dd></div>
            <div><dt>Patient type</dt><dd>{patientTypeLabel(patient.patientType)}</dd></div>
          </dl>
        </article>

        <article className="panel compact-panel">
          <div className="section-heading"><h2>Queue status</h2><span className="badge">{activeQueue ? String(activeQueue.status).replaceAll("_", " ") : "Not queued"}</span></div>
          {activeQueue ? (
            <dl className="profile-grid">
              <div><dt>Visit type</dt><dd>{visitTypeLabel(String(activeQueue.visitType ?? ""))}</dd></div>
              <div><dt>Added</dt><dd>{activeQueue.checkedInAt ? formatDateTime(String(activeQueue.checkedInAt)) : "Today"}</dd></div>
              <div><dt>Added by</dt><dd>{String(activeQueue.receptionistDisplayNameSnapshot ?? "Reception")}</dd></div>
            </dl>
          ) : <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No active queue ticket.</span></p>}
          <div className="form-actions">
            <Link className="button secondary compact" href="/queue">Manage queue</Link>
          </div>
        </article>

        <article className="panel compact-panel">
          <div className="section-heading"><h2>Appointments</h2><span className="badge">{appointmentRows.length}</span></div>
          {nextAppointment ? <p className="muted">Next: {formatDateTime(String(nextAppointment.startAt))} | {String(nextAppointment.status ?? "scheduled").replaceAll("_", " ")}</p> : <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="calendar" size="sm" tone="slate" /><span>No appointment booked.</span></p>}
          <div className="form-actions">
            <Link className="button secondary compact" href="/calendar">Open schedule</Link>
          </div>
        </article>

        <article className="panel compact-panel">
          <div className="section-heading"><h2>Documents, consent, payments</h2><span className="badge">Basics</span></div>
          <dl className="profile-grid">
            <div><dt>Consents</dt><dd>{consentRows.length}</dd></div>
            <div><dt>Documents</dt><dd>{(related.documents ?? []).length}</dd></div>
            <div><dt>Open balances</dt><dd>{unpaidInvoiceCount}</dd></div>
            <div><dt>Follow-up items</dt><dd>{openFollowUpCount}</dd></div>
          </dl>
        </article>
      </section>
    </>
    );
}

export function doctorReviewedAllergyAlert(rows: Record<string, unknown>[]) {
    return rows.some((row) => ["reviewed", "doctor_reviewed", "confirmed"].includes(String(row.reviewStatus ?? row.status ?? "").toLowerCase()));
}

export function ImportantPatientBanner({ patient, related }: { patient: Patient; related: Record<string, Record<string, unknown>[]> }) {
    const pendingResults = (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "pending_review").length;
    const unpaid = (related.billing ?? []).filter((row) => ["issued", "partially_paid"].includes(String(row.status ?? ""))).length;
    const activePregnancy = (related.pregnancy ?? []).some((row) => String(row.status ?? "").toLowerCase() === "active");
    const items = importantPatientBannerItems.filter((item) => {
            if (item === "Pregnant") return activePregnancy;
            if (item === "Pending result") return pendingResults > 0;
            if (item === "Outstanding payment") return unpaid > 0;
            return true;
          });
    return (
    <section className="important-patient-banner" aria-label="Important patient banner">
      <ThreeDMedicalIcon name="consent" size="sm" tone="rose" />
      <div>
        <strong>{patient.firstName} {patient.lastName}</strong>
        <span>Internal alerts only. Doctor confirms clinical meaning before record changes.</span>
      </div>
      <div className="workflow-band compact">
        {items.map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
    );
}

export function PatientCaseFeed({ patient, related, timelineItems }: { patient: Patient; related: Record<string, Record<string, unknown>[]>; timelineItems: TimelineItem[] }) {
    const pregnancies = related.pregnancy ?? [];
    const currentPregnancy = pregnancies.find((row) => String(row.status ?? "").toLowerCase() === "active");
    const rows: Array<{ title: string; status: string; text: string; type: string; doctorSignature?: TimelineItem["doctorSignature"] }> = [
            ...timelineItems.slice(0, 8).map((item) => ({ title: item.title, status: item.status, text: item.description, type: item.type, doctorSignature: item.doctorSignature })),
            ...feedItemTypes.map((type) => ({ title: type, status: "Available type", text: "Patient-linked internal feed item. Role-based access applies.", type }))
          ].slice(0, 16);
    return (
    <section className="panel case-feed-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Patient Case Feed</p>
          <h2>Internal medical thread</h2>
          <p className="muted">Private patient-file feed only. It is not Facebook, social posting, or external sharing.</p>
        </div>
        <span className="badge accent">Role-aware</span>
      </div>
      <article className="data-row case-feed-summary-card">
        <div className="data-row-header">
          <strong>{patient.firstName} {patient.lastName}</strong>
          <span className="badge">MRN {patient.medicalRecordNumber}</span>
        </div>
        <dl className="profile-grid">
          <div><dt>Age</dt><dd>{patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "Not set"}</dd></div>
          <div><dt>QR</dt><dd>Patient ID only</dd></div>
          <div><dt>Visit type</dt><dd>كشف / إعادة / استشارة / مستعجل</dd></div>
          <div><dt>Pregnancy status</dt><dd>{currentPregnancy ? "Active pregnancy" : "Not recorded"}</dd></div>
          <div><dt>Important tags</dt><dd>{smartClinicalTags.slice(0, 4).map(([, label]) => label).join(", ")}</dd></div>
          <div><dt>Important alerts</dt><dd>{importantPatientBannerItems.join(", ")}</dd></div>
        </dl>
      </article>
      <div className="timeline-list lazy-feed-list">
        {rows.map((row, index) => (
          <article className="timeline-item" key={`${row.title}-${index}`}>
            <ThreeDMedicalIcon name={timelineIcon(String(row.type))} size="sm" />
            <div>
              <div className="data-row-header">
                <strong>{row.title}</strong>
                <span className="badge">{row.status}</span>
              </div>
              <p className="muted">{row.text}</p>
              {row.doctorSignature?.doctorName ? <DoctorSignatureBadge signature={row.doctorSignature} /> : null}
              <p className="muted">Visit item can show visit number, date, visit type, pregnancy week, mother summary, Baby A/B summary, attachments, prescription, investigations, and follow-up.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
    );
}

export function CaseBoardsPanel({ patient, related }: { patient: Patient; related: Record<string, Record<string, unknown>[]> }) {
    const pendingActions = (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "pending_review").length;
    const lastVisit = String((related.visits ?? [])[0]?.createdAt ?? (related.visits ?? [])[0]?.visitDate ?? "No visit yet");
    return (
    <section className="panel case-board-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Smart Clinical Tags and Case Boards</p>
          <h2>Searchable patient cohorts</h2>
          <p className="muted">Doctors see clinical boards. Reception sees allowed operational boards. Accountants do not see clinical boards.</p>
        </div>
        <span className="badge warning">No global data leakage</span>
      </div>
      <div className="clinical-chip-cloud" aria-label="Smart tags">
        {smartClinicalTags.map(([tag, label]) => (
          <Link className="clinical-chip" href={`/patients?tag=${encodeURIComponent(tag)}`} key={tag}>
            <strong>{label}</strong>
            <span>{tag} - opens matching patients</span>
          </Link>
        ))}
      </div>
      <div className="case-board-grid">
        {caseBoards.map((board) => (
          <article className="data-row case-board-card" key={board}>
            <div className="data-row-header">
              <strong>{board}</strong>
              <span className="badge">{board.includes("Pending") ? "Operational" : "Clinical"}</span>
            </div>
            <dl className="profile-grid">
              <div><dt>Patient name</dt><dd>{patient.firstName} {patient.lastName}</dd></div>
              <div><dt>Age</dt><dd>{patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "Not set"}</dd></div>
              <div><dt>Last visit</dt><dd>{lastVisit}</dd></div>
              <div><dt>Main tag</dt><dd>{board.replace(" Board", "")}</dd></div>
              <div><dt>Pregnancy week</dt><dd>Record-linked when pregnant</dd></div>
              <div><dt>Pending actions</dt><dd>{pendingActions}</dd></div>
              <div><dt>Next follow-up</dt><dd>From follow-up tasks</dd></div>
            </dl>
            <Link className="button compact secondary" href={`/patients/${patient.id}`}>Open file</Link>
          </article>
        ))}
      </div>
    </section>
    );
}

export function SmartHistoryOptionChips({ patient }: { patient: Patient }) {
  type TagRow = { id: string; tagCode: string; label: string; historyStatus: string; tagDate?: string | null; tagYear?: number | null; detailJson?: { details?: string } | null; manualNote?: string | null; isRemoved?: boolean; sourceEncounterId?: string | null; removalReason?: string | null };
  type PendingTag = { code: string; label: string; sourceType: string };
  const [tags, setTags] = useState<TagRow[]>([]);
  const [pending, setPending] = useState<PendingTag | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>(smartHistoryGroups[0].title);
  const [historyStatus, setHistoryStatus] = useState<"current" | "historical" | "resolved">("current");
  const [tagDate, setTagDate] = useState("");
  const [tagYear, setTagYear] = useState("");
  const [details, setDetails] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [status, setStatus] = useState("");

  async function loadTags() {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/clinical-tags`, { credentials: "include", headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
    if (response?.ok) setTags(((await response.json()) as { tags?: TagRow[] }).tags ?? []);
  }

  useEffect(() => { void loadTags(); }, [patient.id]);

  function resetEditor() {
    setPending(null); setEditingId(null); setHistoryStatus("current"); setTagDate(""); setTagYear(""); setDetails(""); setManualNote(""); setCorrectionReason("");
  }

  function chooseTag(code: string, label: string, sourceType: string) {
    setPending({ code, label, sourceType });
    setEditingId(null);
    setStatus(`${label} selected. Review details, then choose Add.`);
  }

  async function addTag() {
    if (!pending) return;
    setStatus("Saving tag…");
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/clinical-tags`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        tagCode: pending.code,
        label: pending.label,
        category: pending.sourceType === "operation_history" ? "surgical_history" : pending.sourceType === "previous_pregnancy" ? "obstetric_history" : "medical_history",
        historyStatus,
        tagDate: tagDate || undefined,
        tagYear: tagYear ? Number(tagYear) : undefined,
        detailJson: details ? { details } : undefined,
        manualNote: manualNote || undefined
      })
    }).catch(() => null);
    if (response?.ok) { setStatus(`${pending.label} added for doctor review.`); resetEditor(); await loadTags(); }
    else setStatus("Could not add this tag. Check role permissions and validation.");
  }

  function editTag(tag: TagRow) {
    setEditingId(tag.id); setPending(null); setHistoryStatus((tag.historyStatus as typeof historyStatus) || "current"); setTagDate(tag.tagDate?.slice(0, 10) ?? ""); setTagYear(tag.tagYear ? String(tag.tagYear) : ""); setDetails(tag.detailJson?.details ?? ""); setManualNote(tag.manualNote ?? ""); setCorrectionReason(""); setStatus(`Editing ${tag.label}.`);
  }

  async function updateTag() {
    if (!editingId) return;
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/clinical-tags/${editingId}`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ historyStatus, tagDate: tagDate || undefined, tagYear: tagYear ? Number(tagYear) : undefined, detailJson: details ? { details } : undefined, manualNote: manualNote || undefined, correctionReason: correctionReason || undefined }) }).catch(() => null);
    if (response?.ok) { setStatus("Clinical history updated with an audit record."); resetEditor(); await loadTags(); return; }
    const message = response ? String(((await response.json().catch(() => ({}))) as { message?: string }).message ?? "") : "";
    setStatus(message || "Could not update this clinical history item.");
  }

  async function removeTag(tag: TagRow) {
    const reason = tag.sourceEncounterId ? window.prompt("Reason for correcting finalized clinical history:")?.trim() : correctionReason.trim();
    if (tag.sourceEncounterId && !reason) return;
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/clinical-tags/${tag.id}`, { method: "DELETE", credentials: "include", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ reason: reason || undefined }) }).catch(() => null);
    if (response?.ok) { setStatus(`${tag.label} removed. Undo remains available.`); await loadTags(); }
    else setStatus("Could not remove this clinical history item.");
  }

  async function undoRemove(tag: TagRow) {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/clinical-tags/${tag.id}`, { method: "PATCH", credentials: "include", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ isRemoved: false, correctionReason: `Undo removal: ${tag.removalReason || "restored by clinician"}` }) }).catch(() => null);
    if (response?.ok) { setStatus(`${tag.label} restored.`); await loadTags(); }
    else setStatus("Could not restore this clinical history item.");
  }

  return (
    <section className="panel smart-ob-tags" aria-label="Smart history option chips">
      <div className="section-heading">
        <div>
          <h2>Smart history option chips</h2>
          <p className="muted">Select, review, then add. Draft items can be edited, removed, or restored. Finalized corrections require a reason and preserve the original audit record.</p>
        </div>
        <span className="badge warning">Doctor review</span>
      </div>
      <div className="clinical-history-layout">
        <nav className="history-category-list" aria-label="History categories">
          {smartHistoryGroups.map((group) => <button className={activeGroup === group.title ? "active" : ""} key={group.title} onClick={() => setActiveGroup(group.title)} type="button">{group.title}</button>)}
        </nav>
        <div>
          {smartHistoryGroups.filter((group) => group.title === activeGroup).map((group) => <div key={group.title}><h3>{group.title}</h3><div className="clinical-tag-grid">{group.items.map(([code, label]) => <button className={`clinical-tag-card ${pending?.code === code ? "selected" : ""}`} key={code} type="button" onClick={() => chooseTag(code, label, group.sourceType)}><span>{group.title}</span><strong>{label}</strong></button>)}</div></div>)}
        </div>
      </div>
      <div className="selected-history-list" aria-label="Selected clinical history">
        <h3>Selected history</h3>
        {tags.filter((tag) => !tag.isRemoved).map((tag) => <article className="data-row" key={tag.id}><div><strong>{tag.label}</strong><span>{tag.tagYear ? ` — ${tag.tagYear}` : ""} — {tag.historyStatus}</span></div><div className="form-actions"><button className="button secondary compact" type="button" onClick={() => editTag(tag)}>Edit</button><button className="button secondary compact danger" type="button" onClick={() => void removeTag(tag)}>Remove</button></div></article>)}
        {tags.filter((tag) => tag.isRemoved).map((tag) => <article className="data-row removed" key={tag.id}><div><strong>{tag.label}</strong><span>Removed — {tag.removalReason}</span></div><button className="button secondary compact" type="button" onClick={() => void undoRemove(tag)}>Undo</button></article>)}
      </div>
      <div className="form-grid compact-history-details">
        <label>Status<select value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value as typeof historyStatus)}><option value="current">Current</option><option value="historical">Historical</option><option value="resolved">Resolved</option></select></label>
        <label>Date<input type="date" value={tagDate} onChange={(event) => setTagDate(event.target.value)} /></label>
        <label>Year<input type="number" min="1900" max="2200" value={tagYear} onChange={(event) => setTagYear(event.target.value)} /></label>
        <label className="wide">Relevant details<input value={details} onChange={(event) => setDetails(event.target.value)} placeholder={pending?.code === "hysterectomy" ? "Type, indication, ovaries, complications, pathology, follow-up" : pending?.code === "postmenopausal_bleeding" ? "Onset, episodes, current/resolved, imaging, sampling, concern, next action" : "Optional structured detail"} /></label>
        <label className="wide">Manual note<textarea value={manualNote} onChange={(event) => setManualNote(event.target.value)} /></label>
        {editingId ? <label className="wide">Correction reason<input value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} placeholder="Required after the source encounter is finalized" /></label> : null}
        <label>Custom tag<input value={customTag} onChange={(event) => setCustomTag(event.target.value)} /></label>
        <button className="button secondary" disabled={!customTag.trim()} type="button" onClick={() => chooseTag(customTag, customTag, "manual")}>Select custom tag</button>
        {pending ? <button className="button" type="button" onClick={() => void addTag()}>Add {pending.label}</button> : null}
        {editingId ? <button className="button" type="button" onClick={() => void updateTag()}>Save edit</button> : null}
        {pending || editingId ? <button className="button secondary" type="button" onClick={resetEditor}>Cancel</button> : null}
      </div>
      {status ? <p className="notice">{status}</p> : null}
    </section>
  );
}

export function SmartObHistoryTags() {
    const [current, setCurrent] = useState("twins");
    const [conception, setConception] = useState("حقن مجهري ICSI");
    const [selectedHistory, setSelectedHistory] = useState<string[]>(["Previous C-section", "Previous normal delivery", "ولد", "بنت"]);
    const currentTag = currentPregnancyTags.find((tag) => tag.value === current);

    function toggleHistory(label: string) {
        setSelectedHistory((items) => items.includes(label) ? items.filter((item) => item !== label) : [...items, label]);
    }

    return (
    <section className="panel smart-ob-tags" aria-label="Smart OB History Tags">
      <div className="section-heading">
        <div>
          <h2>Smart OB History Tags</h2>
          <p className="muted">Reception may collect basic history only if policy allows. Doctor confirmation remains required for clinical history.</p>
        </div>
        <span className="badge warning">Doctor confirmation</span>
      </div>
      <div className="doctor-friendly-grid">
        <div>
          <h3>Current pregnancy</h3>
          <div className="clinical-chip-cloud">
            {currentPregnancyTags.map((tag) => (
              <button className={`clinical-chip ${current === tag.value ? "active" : ""}`} key={tag.value} type="button" onClick={() => setCurrent(tag.value)}>
                <strong>{tag.label}</strong>
                <span>{tag.arabicLabel}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3>Conception method tags</h3>
          <div className="clinical-chip-cloud">
            {conceptionMethodChips.map((label) => (
              <button className={`clinical-chip ${conception === label ? "active" : ""}`} key={label} type="button" onClick={() => setConception(label)}>
                <strong>{label}</strong>
                <span>Click/select chip</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <h3>Previous history chips</h3>
      <div className="clinical-chip-cloud">
        {previousHistoryChips.map((label) => (
          <button className={`clinical-chip ${selectedHistory.includes(label) ? "active" : ""}`} key={label} type="button" onClick={() => toggleHistory(label)}>
            <strong>{label}</strong>
            <span>Structured history</span>
          </button>
        ))}
      </div>
      <article className="notice">
        Current pregnancy: {conception}<br />
        Fetus: {currentTag?.label ?? "Not selected"}<br />
        Previous: 1 قيصري, 1 طبيعي<br />
        Children: ولد + بنت
      </article>
    </section>
    );
}
export function Overview({ patient, related, timelineItems }: { patient: Patient; related: Record<string, Record<string, unknown>[]>; timelineItems: TimelineItem[] }) {
    const pendingResults = (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "pending_review").length;
    const criticalResults = (related.results ?? []).filter((row) => row.criticalFlag === true && String(row.reviewStatus ?? "") !== "reviewed").length;
    const missingConsents = (related.consents ?? []).filter((row) => ["unknown", "declined"].includes(String(row.status ?? ""))).length;
    const openTasks = (related.tasks ?? []).filter((row) => ["open", "in_progress"].includes(String(row.status ?? ""))).length;
    const unreviewedDocuments = (related.documents ?? []).filter((row) => ["draft_metadata", "active"].includes(String(row.status ?? ""))).length;
    const urgentCount = pendingResults + criticalResults + missingConsents + openTasks + unreviewedDocuments;
    const recentTimeline = timelineItems.slice(0, 5);
    return (
    <section className="doctor-friendly-grid patient-summary-grid">
      <article className="panel compact-panel">
        <div className="section-heading">
          <div>
            <h2>At a glance</h2>
            <p className="muted">Simple patient summary for daily clinic use.</p>
          </div>
          <ThreeDMedicalIcon name="patients" size="sm" />
        </div>
        <dl className="profile-grid">
          <div><dt>Name</dt><dd>{patient.firstName} {patient.lastName}</dd></div>
          <div><dt>File number</dt><dd>{patient.medicalRecordNumber}</dd></div>
          <div><dt>Contact</dt><dd>{patient.phone || patient.email || "Not saved"}</dd></div>
          <div><dt>Status</dt><dd>{patient.status}</dd></div>
          <div className="wide"><dt>Notes</dt><dd>{patient.notes || "No notes recorded."}</dd></div>
        </dl>
      </article>
      <article className="panel compact-panel">
        <div className="section-heading"><h2>Clinical badges</h2><span className="badge">Review</span></div>
        <div className="workflow-band">
          <span>{patient.patientType ?? "General"}</span>
          <span>{patient.sexualActivityStatus ? String(patient.sexualActivityStatus).replaceAll("_", " ") : "Privacy not asked"}</span>
          <span>{(related.pregnancy ?? []).length ? "Pregnancy context" : "No pregnancy record"}</span>
          <span>Allergy review</span>
        </div>
      </article>
      <article className="panel compact-panel">
        <div className="section-heading"><h2>Today status</h2><span className="badge">{patient.status}</span></div>
        <dl className="profile-grid">
          <div><dt>Open tasks</dt><dd>{openTasks}</dd></div>
          <div><dt>Pending results</dt><dd>{pendingResults}</dd></div>
          <div><dt>Documents to review</dt><dd>{unreviewedDocuments}</dd></div>
        </dl>
      </article>
      <article className="panel compact-panel next-step-card">
        <ThreeDMedicalIcon name="doctor" size="lg" />
        <h2>Next best step</h2>
        <p className="muted">Start or continue the visit. The doctor writes the note; the app does not diagnose or prescribe automatically.</p>
        <Link className="button large" href={`/doctor/visit?patientId=${patient.id}`}>
          <ThreeDMedicalIcon name="encounter" size="sm" />
          New Encounter
        </Link>
      </article>
      <article className="panel compact-panel">
        <div className="section-heading">
          <h2>Recent activity</h2>
          <span className="badge">{recentTimeline.length} items</span>
        </div>
        {urgentCount === 0 && recentTimeline.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="timeline" size="sm" tone="slate" /><span>No urgent activity.</span></p> : null}
        {urgentCount > 0 ? <div className="compact-metric-grid"><MiniCount label="Needs attention" value={urgentCount} tone="warning" /><MiniCount label="Pending results" value={pendingResults} /><MiniCount label="Open tasks" value={openTasks} /><MiniCount label="Documents" value={unreviewedDocuments} /></div> : null}
        {recentTimeline.length ? <div className="dense-card-list">{recentTimeline.map((item) => <article className="data-row dense" key={`${item.type}-${item.dateTime}-${item.title}`}><div className="data-row-header"><strong>{item.title}</strong><span className="badge">{item.status}</span></div><p className="muted">{item.description}</p></article>)}</div> : null}
      </article>
    </section>
    );
}

export function MiniCount({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
    return (
    <div className={`mini-metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
    );
}
export function MedicationSafetyWorkspace({ patientId }: { patientId: string }) {
    return (
    <section className="dashboard-grid">
      <MedicationSafetyPanel patientId={patientId} />
      <PrescriptionSafetyPanel patientId={patientId} />
      <PatientMedicationList />
      <PatientAllergyList />
      <HerbalSearchPanel />
    </section>
    );
}

export function Metric({ label, value }: { label: string; value: string }) {
    return (
    <div className="obgyn-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
    );
}

export function DoctorTemplateCards() {
    const templates: Array<[string, IconName, string]> = [
            ["New pregnancy booking", "pregnancy", "Open pregnancy overview, obstetric history, dating details, and first plan."],
            ["Routine antenatal follow-up", "calendar", "Record symptoms, BP, weight, fetal heart, plan, and next visit."],
            ["Ultrasound visit", "ultrasound", "Record scan type, indication, measurements, and doctor-written impression."],
            ["Gynecology visit", "doctor", "Use the guided visit flow for complaint, history, examination, impression, and plan."],
            ["Follow-up visit", "timeline", "Review timeline, prior orders, reports, prescriptions, and follow-up plan."],
            ["Procedure visit", "reports", "Prepare a clinician-authored note without automatic recommendations."]
          ];
    return (
    <article className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Doctor Templates</p>
          <h2>OB/GYN workflow templates</h2>
        </div>
        <ThreeDMedicalIcon name="files" size="sm" tone="amber" />
      </div>
      <div className="obgyn-template-grid">
        {templates.map(([title, icon, text]) => (
          <div className="obgyn-template-card" key={title}>
            <ThreeDMedicalIcon name={icon} size="sm" />
            <strong>{title}</strong>
            <p className="muted">{text}</p>
          </div>
        ))}
      </div>
    </article>
    );
}

export function ReferencePicker({ title, endpoint, placeholder, selected, onSelect }: { title: string; endpoint: string; placeholder: string; selected: ReferenceResult | null; onSelect: (result: ReferenceResult | null) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ReferenceResult[]>([]);
    useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const token = sessionStorage.getItem("prijClinicToken");
    const timeout = window.setTimeout(() => {
      fetch(`${getApiBaseUrl()}${endpoint}?q=${encodeURIComponent(query)}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      })
        .then(async (response) => response.ok ? response.json() : { results: [] })
        .then((data: { results?: ReferenceResult[] }) => setResults(data.results ?? []))
        .catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(timeout);
    }, [endpoint, query]);
    return (
    <article className="panel">
      <h3>{title}</h3>
      <label>
        Search
        <input value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {selected ? <p className="notice">Selected: {selected.label}</p> : null}
      <div className="data-list">
        {results.slice(0, 6).map((result) => (
          <button className="data-row" key={`${result.type}-${result.id}`} type="button" onClick={() => onSelect(result)}>
            <strong>{result.label}</strong>
            <span className="badge">{result.type.replaceAll("_", " ")}</span>
          </button>
        ))}
      </div>
    </article>
    );
}

export function PatientActionPanel({
      patient,
      onSubmit,
      status,
      related,
      services
    }: {
          patient: Patient;
          onSubmit: (endpoint: string, payload: Record<string, unknown>) => Promise<void>;
          status: string;
          related: Record<string, Record<string, unknown>[]>;
          services: ServiceItem[];
        }) {
    const [open, setOpen] = useState("appointment");
    const [selectedGeneric, setSelectedGeneric] = useState<ReferenceResult | null>(null);
    const invoices = related.billing ?? [];
    const actions: Array<[string, string, IconName]> = [
            ["appointment", "Appointment", "calendar"],
            ["queue", "Check In", "queue"],
            ["prescription", "Prescription", "prescription"],
            ["request", "Request investigations", "investigations"],
            ["report", "Report", "reports"],
            ["ultrasound", "Ultrasound", "ultrasound"],
            ["invoice", "Invoice", "billing"],
            ["payment", "Payment", "billing"],
            ["consent", "Consent", "consent"]
          ];

    function handleSubmit(endpoint: string, buildPayload: (form: HTMLFormElement) => Record<string, unknown>) {
        return (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void onSubmit(endpoint, buildPayload(event.currentTarget));
        };
    }

    return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Patient actions</h2>
          <p className="muted">These actions save directly to this patient file. No patient re-selection is needed.</p>
        </div>
        {status ? <span className="badge">{status}</span> : null}
      </div>
      <SelectedPatientSummary patient={patient} />
      <div className="patient-action-strip" aria-label="Patient actions">
        {actions.map(([key, label, icon]) => (
          <button className={`patient-action ${open === key ? "active" : ""}`} data-action-key={key} key={key} onClick={() => setOpen(key)} type="button">
            <ThreeDMedicalIcon name={icon as IconName} size="sm" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {open === "appointment" ? (
        <ActionForm
          fields={[
            ["date", "Date", "date", true],
            ["startTime", "Start time", "time", true],
            ["endTime", "End time", "time", true],
            ["doctorId", "Doctor", "text", false],
            ["room", "Room", "text", false],
            ["appointmentType", "Visit type", "text", false]
          ]}
          onSubmit={handleSubmit("appointments", (form) => {
            const item = values(form, ["date", "startTime", "endTime", "doctorId", "appointmentType", "room"]);
            return {
              startAt: `${item.date}T${item.startTime}:00`,
              endAt: `${item.date}T${item.endTime}:00`,
              doctorId: item.doctorId || undefined,
              appointmentType: item.appointmentType || "Clinic visit",
              notes: item.room ? `Room: ${item.room}` : undefined
            };
          })}
          submitLabel="Book appointment"
        />
      ) : null}

      {open === "queue" ? (
        <form className="form-grid compact-panel" onSubmit={handleSubmit("queue-check-in", () => ({}))}>
          <label>Priority note<input name="priority" placeholder="Routine unless reception flags priority" /></label>
          <p className="muted">Walk-in / no appointment. This patient is already selected.</p>
          <button className="button" type="submit">Send to doctor queue</button>
        </form>
      ) : null}

      {open === "prescription" ? (
        <form className="form-grid" onSubmit={handleSubmit("prescriptions", (form) => {
          const item = values(form, ["medicationName", "dose", "frequency", "instructions"]);
          return {
            items: [{
              ...item,
              medicationName: selectedGeneric?.genericName ?? selectedGeneric?.label ?? String(item.medicationName ?? ""),
              medicationGenericId: selectedGeneric?.type === "generic_medication" ? selectedGeneric.id : undefined
            }]
          };
        })}>
          <ReferencePicker title="Generic medication lookup" endpoint="/reference/medications/search" placeholder="Search generic name, class, or function" selected={selectedGeneric} onSelect={setSelectedGeneric} />
          <label>Manual generic name<input name="medicationName" required={!selectedGeneric} placeholder="Generic name only" /></label>
          <p className="badge warning">Draft only - doctor review required</p>
          <label>Doctor instructions<textarea name="instructions" placeholder="Doctor-written instructions only" /></label>
          <button className="button" type="submit">Add prescription</button>
        </form>
      ) : null}

      {open === "request" ? (
        <ActionForm
          fields={[
            ["testName", "Requested test or service", "text", true],
            ["instructions", "Clinical reason", "text", false]
          ]}
          onSubmit={handleSubmit("investigations", (form) => ({ priority: "routine", items: [{ category: "laboratory", ...values(form, ["testName", "instructions"]) }] }))}
          submitLabel="Request investigation"
        />
      ) : null}

      {open === "report" ? (
        <ActionForm
          fields={[
            ["title", "Report title", "text", true],
            ["resultSummary", "Summary", "text", false]
          ]}
          onSubmit={handleSubmit("reports", (form) => ({ category: "other", ...values(form, ["title", "resultSummary"]) }))}
          submitLabel="Create report"
        />
      ) : null}

      {open === "ultrasound" ? (
        <ActionForm
          fields={[["impressionText", "Doctor-written impression", "text", false]]}
          note="Recording only. The app does not diagnose fetal growth or risk."
          onSubmit={handleSubmit("ultrasounds", (form) => values(form, ["impressionText"]))}
          submitLabel="Create ultrasound draft"
        />
      ) : null}

      {open === "invoice" ? (
        <form className="form-grid" onSubmit={handleSubmit("invoices", (form) => {
          const formData = new FormData(form);
          const serviceItemId = String(formData.get("serviceItemId") ?? "");
          const quantity = Number(formData.get("quantity") || 1);
          const manual = values(form, ["description", "unitAmount"]);
          return {
            notes: "Draft invoice from patient billing context. Manual payment only.",
            items: [
              serviceItemId
                ? { serviceItemId, quantity }
                : { description: manual.description, unitAmount: Number(manual.unitAmount || 0), quantity }
            ]
          };
        })}>
          <label>
            Owner service catalog
            <select name="serviceItemId">
              <option value="">Manual billing service</option>
              {services.map((service) => (
                <option disabled={service.price === null} key={service.id} value={service.id}>
                  {service.name} - {service.price === null ? "price review required" : `${service.price} ${service.currency}`}
                </option>
              ))}
            </select>
          </label>
          <label>Manual service<input name="description" placeholder="Only if no catalog service is selected" /></label>
          <label>Manual price<input name="unitAmount" type="number" min="0" step="0.01" /></label>
          <label>Quantity<input name="quantity" type="number" min="1" defaultValue="1" /></label>
          <p className="muted">Service selection is billing-only and does not change clinical catalogs.</p>
          <button className="button" type="submit">Create draft invoice</button>
        </form>
      ) : null}

      {open === "payment" ? (
        <form className="form-grid" onSubmit={handleSubmit("payments", (form) => {
          const formData = new FormData(form);
          return {
            ...values(form, ["invoiceId", "referenceNote", "note"]),
            method: String(formData.get("method") || "cash"),
            amount: Number(formData.get("amount") || 0)
          };
        })}>
          <label>
            Invoice
            <select name="invoiceId" required>
              <option value="">Select invoice</option>
              {invoices.filter((invoice) => !["paid", "voided", "cancelled"].includes(String(invoice.status))).map((invoice) => (
                <option key={String(invoice.id)} value={String(invoice.id)}>{String(invoice.invoiceNumber ?? "Invoice")}</option>
              ))}
            </select>
          </label>
          <label>
            Method
            <select name="method" defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>Amount<input name="amount" required type="number" min="0" step="0.01" /></label>
          <label>Reference<input name="referenceNote" placeholder="Optional receipt or transfer reference" /></label>
          <label className="wide">Note<input name="note" placeholder="Optional internal payment note" /></label>
          <p className="muted">Manual recording only. Do not enter card numbers, tokens, passwords, or patient secrets.</p>
          <button className="button" type="submit">Record payment</button>
        </form>
      ) : null}

      {open === "consent" ? (
        <form className="form-grid" onSubmit={handleSubmit("consents", () => ({ consentType: "treatment", status: "granted", notes: "Local consent workflow note. Legal text is not included." }))}>
          <p className="muted">Record local treatment consent status. Real legal text is not included.</p>
          <button className="button" type="submit">Record consent</button>
        </form>
      ) : null}
    </section>
    );
}

export function SelectedPatientSummary({ patient }: { patient: Patient }) {
    return <div className="selected-patient-card"><strong>{patient.firstName} {patient.lastName}</strong><span>File {patient.medicalRecordNumber} | {patient.phone || patient.email || "No contact saved"} | {patient.status}</span></div>;
}

export function PatientQrModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
    const [payload, setPayload] = useState("");
    const [status, setStatus] = useState("Preparing secure QR");
    useEffect(() => {
      const controller = new AbortController();
      fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(patient.id)}/qr-token`, { credentials: "include", signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("QR access denied");
          return response.json() as Promise<{ payload: string }>;
        })
        .then((result) => { setPayload(result.payload); setStatus("Permanent QR ready"); })
        .catch((error) => { if (error instanceof DOMException && error.name === "AbortError") return; setStatus("QR is unavailable. Try again."); });
      return () => controller.abort();
    }, [patient.id]);
    const qrSource = payload ? patientQrSvgDataUri(payload) : "";
    return (
    <div className="patient-qr-backdrop" role="dialog" aria-modal="true" aria-label="Patient QR">
      <section className="patient-qr-modal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Patient QR</p>
            <h2>{patient.firstName} {patient.lastName}</h2>
            <p className="muted">File {patient.medicalRecordNumber}</p>
          </div>
          <button className="button secondary compact no-print" type="button" onClick={onClose}>Close</button>
        </div>
        {qrSource ? <Image className="patient-qr-image" src={qrSource} alt="Patient QR" width={280} height={280} unoptimized /> : <div className="skeleton" aria-label={status} />}
        <p className="muted">{status}. QR contains an opaque lookup token only; login and role access are still required.</p>
        <div className="form-actions no-print">
          <button className="button" type="button" onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" />
            Print QR
          </button>
          <Link className="button secondary" href="/reception/qr-scan">
            <ThreeDMedicalIcon name="search" size="sm" tone="slate" />
            Scan workflow
          </Link>
        </div>
      </section>
    </div>
    );
}

export function MorePatientSections({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
    const sections: Array<[string, string]> = [
            ["pregnancy", "Women’s Health"],
            ["documents", "Documents"],
            ["prescriptions", "Previous Prescriptions"],
            ["investigations", "Results"],
            ["billing", "Administrative details"]
          ];
    return <section className="panel compact-panel"><div className="section-heading"><h2>More patient sections</h2><span className="badge">Comfort tabs</span></div><div className="dense-card-list">{sections.map(([key, label]) => <button className="picker-row" key={key} type="button" onClick={() => setActiveTab(key)}><strong>{label}</strong><span>Open {label.toLowerCase()}</span></button>)}</div></section>;
}

export function ActionForm({
      fields,
      note,
      onSubmit,
      submitLabel
    }: {
          fields: Array<[string, string, "text" | "date" | "time" | "number", boolean]>;
          note?: string;
          onSubmit: (event: FormEvent<HTMLFormElement>) => void;
          submitLabel: string;
        }) {
    return (
    <form className="form-grid" onSubmit={onSubmit}>
      {note ? <p className="muted">{note}</p> : null}
      {fields.map(([name, label, type, required]) => (
        <label key={name}>
          {label}
          <input name={name} required={required} type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} />
        </label>
      ))}
      <button className="button" type="submit">{submitLabel}</button>
    </form>
    );
}

export function SecretaryIntakePanel({ rows }: { rows: Record<string, unknown>[] }) {
    return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Secretary Intake</h2>
          <p className="muted">Patient-reported / entered by reception. Doctor review is required before clinical use.</p>
        </div>
        <span className="badge">Patient-reported</span>
      </div>
      {rows.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="files" size="sm" tone="slate" /><span>No intake submitted yet.</span></p> : null}
      <div className="data-list">{rows.map((row, index) => <article className="data-row" key={String(row.id ?? index)}><div className="data-row-header"><strong>{String(row.intakeType ?? "Intake")}</strong><span className="badge">{String(row.status ?? "draft")}</span></div><p className="muted">Patient-reported / entered by reception until doctor review.</p></article>)}</div>
    </section>
    );
}

export function DoctorClinicalNotePanel({ rows }: { rows: Record<string, unknown>[] }) {
    return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Doctor Clinical Note</h2>
          <p className="muted">Doctor-only examination, clinical impression, diagnosis wording, risk classification, and plan.</p>
        </div>
        <span className="badge">Doctor review</span>
      </div>
      {rows.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="encounter" size="sm" tone="slate" /><span>No doctor clinical note yet.</span></p> : null}
      <div className="data-list">{rows.map((row, index) => <article className="data-row" key={String(row.id ?? index)}><div className="data-row-header"><strong>{String(row.chiefComplaint ?? "Clinical note")}</strong><span className="badge">{String(row.status ?? "draft")}</span></div><p className="muted">{String(row.clinicalImpression ?? row.assessmentText ?? "Doctor-authored clinical fields only.")}</p></article>)}</div>
    </section>
    );
}

export function values(form: HTMLFormElement, keys: string[]) {
    const formData = new FormData(form);
    return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "").trim()]).filter(([, value]) => value));
}

export function numericPayload(raw: Record<string, string>, numericKeys: string[]) {
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, numericKeys.includes(key) ? Number(value) : value]));
}

export async function submitVisitAction(patientId: string, endpoint: string, payload: Record<string, unknown>) {
    const token = sessionStorage.getItem("prijClinicToken");
    const response = await fetch(`${getApiBaseUrl()}/patients/${patientId}/${endpoint}`, {
            method: "POST",
            credentials: "include",
            headers: {
              "content-type": "application/json",
              ...(token ? { authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload)
          });
    if (!response.ok) throw new Error("Could not save visit action.");
    return response.json() as Promise<Record<string, unknown>>;
}

export function formPayload(form: HTMLFormElement, numericFields: Record<string, "number"> = {}) {
    const formData = new FormData(form);
    const payload: Record<string, unknown> = {};
    for (const [key, raw] of formData.entries()) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    if (numericFields[key]) {
      const numberValue = Number(value);
      if (!Number.isNaN(numberValue)) payload[key] = numberValue;
      continue;
    }
    payload[key] = key === "performedAt" && value.includes("T") ? new Date(value).toISOString() : value;
    }

    return payload;
}

export function RelatedPanel({ config, rows }: { config: TabConfig; rows: Record<string, unknown>[] }) {
    const isBilling = config.key === "billing";
    const statementTotal = isBilling ? rows.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0) : 0;
    const statementPaid = isBilling ? rows.reduce((sum, row) => sum + Number(row.amountPaid ?? 0), 0) : 0;
    const statementBalance = isBilling ? rows.reduce((sum, row) => sum + Number(row.balanceAmount ?? 0), 0) : 0;
    return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{config.label}</h2>
          <p className="muted">Only this patient&apos;s records are shown here.</p>
        </div>
        {isBilling ? (
          <button className="button secondary compact" type="button" onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print statement
          </button>
        ) : (
          <ThreeDMedicalIcon name={config.icon} size="sm" />
        )}
      </div>
      {isBilling ? (
        <dl className="profile-grid printable-summary">
          <div><dt>Invoices</dt><dd>{rows.length}</dd></div>
          <div><dt>Total</dt><dd>{statementTotal.toFixed(2)}</dd></div>
          <div><dt>Paid</dt><dd>{statementPaid.toFixed(2)}</dd></div>
          <div><dt>Balance</dt><dd>{statementBalance.toFixed(2)}</dd></div>
        </dl>
      ) : null}
      {rows.length === 0 ? <SmartPatientEmptyState config={config} /> : null}
      <div className="data-list">
        {rows.map((row, index) => (
          <article className="data-row" key={String(row.id ?? index)}>
            <div className="data-row-header">
              <strong>{String(row.title ?? row.invoiceNumber ?? row.appointmentType ?? row.draftType ?? "Patient record")}</strong>
              <span className="badge">{String(row.status ?? row.reviewStatus ?? row.category ?? "Draft")}</span>
            </div>
            <p className="muted">
              {isBilling
                ? billingRowSummary(row)
                : String(row.notes ?? row.resultSummary ?? row.inputSourceSummary ?? row.chiefComplaint ?? "Patient-linked record.")}
            </p>
          </article>
        ))}
      </div>
    </section>
    );
}

export function billingRowSummary(row: Record<string, unknown>) {
    const items = Array.isArray(row.items) ? row.items as Record<string, unknown>[] : [];
    const services = items.map((item) => {
            const serviceItem = item.serviceItem as { name?: string } | undefined;
            return String(item.description ?? serviceItem?.name ?? "");
          }).filter(Boolean).join(", ");
    const total = String(row.totalAmount ?? "0.00");
    const paid = String(row.amountPaid ?? "0.00");
    const balance = String(row.balanceAmount ?? "0.00");
    return `${services || "Billing service"} | total ${total} | paid ${paid} | balance ${balance}`;
}

export function PrintPacketPanel({ patient, related, timelineItems }: { patient: Patient; related: Record<string, Record<string, unknown>[]>; timelineItems: TimelineItem[] }) {
    const sections: Array<[string, Record<string, unknown>[]]> = [
            ["Investigation orders", related.orders ?? []],
            ["Reviewed results", (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "reviewed")],
            ["Documents index", related.documents ?? []],
            ["Consents", related.consents ?? []],
            ["Referrals", related.referrals ?? []],
            ["Follow-up tasks", related.tasks ?? []],
            ["Pregnancy and OB summary", related.pregnancy ?? []]
          ];
    return (
    <section className="panel printable-summary">
      <div className="section-heading no-print">
        <div>
          <h2>Patient visit packet</h2>
          <p className="muted">Browser print only. No PDF generation and no production stationery claim.</p>
        </div>
        <button className="button" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="reports" size="sm" />
          Print packet
        </button>
      </div>
      <div className="print-packet">
        <h2>{patient.firstName} {patient.lastName}</h2>
        <p>File {patient.medicalRecordNumber} | {patient.patientType ?? "General"} | Visit packet</p>
        <p>Document archive is metadata-only here. Doctor review required. No automatic interpretation.</p>
        {sections.map(([title, rows]) => (
          <section key={title}>
            <h3>{title}</h3>
            {rows.length ? rows.slice(0, 12).map((row, index) => (
              <p key={String(row.id ?? index)}>
                <strong>{String(row.title ?? row.reason ?? row.testName ?? row.status ?? "Record")}</strong>{" "}
                <span>{String(row.reviewStatus ?? row.status ?? row.category ?? "")}</span>
              </p>
            )) : <p>No records in this section.</p>}
          </section>
        ))}
        <section>
          <h3>Timeline</h3>
          {timelineItems.slice(0, 20).map((item, index) => (
            <p key={`${item.title}-${index}`}>{item.title}: {item.description}</p>
          ))}
        </section>
      </div>
    </section>
    );
}

export function templateLabel(value?: string | null) {
    const found = gynecologyTemplateOptions.find(([key]) => key === value);
    return found?.[1] ?? "Not recorded";
}

export function templateSummary(value: string) {
    if (value === "abnormal_uterine_bleeding") return "Cycle pattern, amount, clots, related bleeding, and doctor impression.";
    if (value === "pelvic_pain") return "Onset, site, relation to cycle, urinary or bowel symptoms, and doctor impression.";
    if (value === "pcos") return "Cycle pattern, acne or hirsutism note, ultrasound note, labs note, and doctor impression.";
    if (value === "fibroid_ovarian_cyst") return "Finding source, size or location note, symptoms, follow-up plan, and impression.";
    if (value === "contraception") return "Current method, previous methods, checklist, counseling notes, chosen method.";
    return "General gynecology visit recording.";
}

export function formatDate(value?: string | null) {
    if (!value) return "Not recorded";
    return value.slice(0, 10);
}

export function SmartPatientEmptyState({ config }: { config: TabConfig }) {
    const actionByKey: Record<string, [string, string]> = {
            visits: ["doctor-visit", "Start visit"],
            "doctor-note": ["doctor-visit", "Start visit"],
            prescriptions: ["doctor-visit", "Open visit flow"],
            investigations: ["doctor-visit", "Request during visit"],
            results: ["investigations", "Open investigations"],
            documents: ["documents", "Open documents"],
            files: ["documents", "Open reports"],
            billing: ["billing", "Create invoice"],
            consents: ["documents", "Record consent"],
            pregnancy: ["pregnancy", "Open pregnancy"],
            referrals: ["referrals", "Create referral"],
            tasks: ["timeline", "Open timeline"]
          };
    const action = actionByKey[config.key];
    return (
    <div className="empty-state smart-empty-state">
      <ThreeDMedicalIcon name={config.icon} size="sm" tone="slate" />
      <span>{config.empty}</span>
      {action ? (
        <button className="button secondary compact" type="button" onClick={() => document.querySelector<HTMLButtonElement>(`[data-tab-key="${action[0]}"]`)?.click()}>
          {action[1]}
        </button>
      ) : null}
    </div>
    );
}
