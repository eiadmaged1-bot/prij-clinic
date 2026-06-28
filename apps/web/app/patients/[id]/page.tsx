"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, SafetyAlert } from "../../mvp-page";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Patient = {
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
  notes?: string | null;
  createdAt?: string;
};

type UserContext = {
  roles: string[];
  permissions: string[];
};

type RelatedConfig = {
  key: string;
  label: string;
  endpoint?: string;
  collectionKey?: string;
  empty: string;
};

type ActionField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "datetime-local" | "date" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: Array<[string, string]>;
};

type PatientAction = {
  key: string;
  label: string;
  group: "Reception" | "Doctor" | "Reports" | "OB/GYN" | "Finance" | "Safety";
  permission: string;
  description: string;
  fields: ActionField[];
  submitLabel: string;
  buildPayload: (state: Record<string, string>, context: ActionContext) => { endpoint: string; method?: "POST" | "PATCH"; body: Record<string, unknown> };
};

type ActionContext = {
  patient: Patient;
  latestAppointmentId?: string;
  latestEncounterId?: string;
  latestPregnancyId?: string;
  latestInvoiceId?: string;
};

type TimelineItem = {
  id: string;
  at: string;
  type: string;
  title: string;
  description: string;
  status?: string;
  href?: string;
};

const relatedTabs: RelatedConfig[] = [
  { key: "summary", label: "Summary", empty: "Patient demographics and current workflow status." },
  { key: "timeline", label: "Timeline", empty: "Timeline will populate as records are created for this patient." },
  { key: "appointments", label: "Appointments", endpoint: "/appointments", collectionKey: "appointments", empty: "No appointments found for this patient." },
  { key: "queue", label: "Queue", endpoint: "/queue/today", collectionKey: "queueTickets", empty: "No active queue ticket found for this patient today." },
  { key: "encounters", label: "Encounters", endpoint: "/encounters", collectionKey: "encounters", empty: "No visit notes found for this patient." },
  { key: "prescriptions", label: "Prescriptions", endpoint: "/prescriptions", collectionKey: "prescriptions", empty: "No prescriptions found for this patient." },
  { key: "investigations", label: "Investigations", endpoint: "/investigations/orders", collectionKey: "investigationOrders", empty: "No investigation orders found for this patient." },
  { key: "reports", label: "Reports", endpoint: "/reports", collectionKey: "reports", empty: "No reports found for this patient." },
  { key: "pregnancy", label: "Pregnancy", endpoint: "/pregnancies", collectionKey: "pregnancies", empty: "No pregnancy episode found for this patient." },
  { key: "ultrasound", label: "Ultrasound", endpoint: "/ob-ultrasounds", collectionKey: "obUltrasounds", empty: "No ultrasound draft found for this patient." },
  { key: "billing", label: "Billing", endpoint: "/billing/invoices", collectionKey: "invoices", empty: "No invoices found for this patient." },
  { key: "consents", label: "Consents", endpoint: "/consents", collectionKey: "consentRecords", empty: "No consent record found for this patient." },
  { key: "ai", label: "AI Drafts", endpoint: "/ai-drafts", collectionKey: "aiDrafts", empty: "No disabled/mock AI draft found for this patient." },
  { key: "files", label: "Files / Attachments", endpoint: "/reports", collectionKey: "reports", empty: "No placeholder attachment metadata found. Real PHI upload is not enabled." }
];

const patientActions: PatientAction[] = [
  {
    key: "appointment",
    label: "New Appointment",
    group: "Reception",
    permission: "appointment.manage",
    description: "Book a demo appointment from this patient file.",
    submitLabel: "Book appointment",
    fields: [
      { name: "startAt", label: "Start time", type: "datetime-local", required: true },
      { name: "appointmentType", label: "Visit type", required: true, defaultValue: "Demo consultation" },
      { name: "notes", label: "Scheduling note", type: "textarea", defaultValue: "Local demo appointment only." }
    ],
    buildPayload: (state, { patient }) => {
      const start = state.startAt ? new Date(state.startAt) : new Date(Date.now() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      return {
        endpoint: "/appointments",
        body: {
          patientId: patient.id,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          appointmentType: state.appointmentType || "Demo consultation",
          notes: state.notes || "Local demo appointment only."
        }
      };
    }
  },
  {
    key: "queue",
    label: "Check In",
    group: "Reception",
    permission: "queue.manage",
    description: "Send this patient to today's queue.",
    submitLabel: "Check in patient",
    fields: [{ name: "priority", label: "Queue priority", type: "select", defaultValue: "routine", options: [["routine", "Routine"], ["priority", "Priority"]] }],
    buildPayload: (state, { patient, latestAppointmentId }) => ({
      endpoint: "/queue/check-in",
      body: { patientId: patient.id, appointmentId: latestAppointmentId, priority: state.priority || "routine" }
    })
  },
  {
    key: "encounter",
    label: "Start Visit",
    group: "Doctor",
    permission: "encounter.create",
    description: "Create a doctor-authored visit draft. No automatic diagnosis is generated.",
    submitLabel: "Create visit note",
    fields: [
      { name: "chiefComplaint", label: "Chief complaint", type: "textarea", defaultValue: "Demo visit reason only." },
      { name: "historyText", label: "History", type: "textarea", defaultValue: "Demo history placeholder only." },
      { name: "examText", label: "Examination", type: "textarea", defaultValue: "Demo examination placeholder only." },
      { name: "assessmentText", label: "Assessment", type: "textarea", defaultValue: "Clinician-written assessment placeholder. No automatic diagnosis." },
      { name: "planText", label: "Plan", type: "textarea", defaultValue: "Demo plan placeholder only. Doctor review required." }
    ],
    buildPayload: (state, { patient, latestAppointmentId }) => ({
      endpoint: "/encounters",
      body: {
        patientId: patient.id,
        appointmentId: latestAppointmentId,
        chiefComplaint: state.chiefComplaint,
        historyText: state.historyText,
        examText: state.examText,
        assessmentText: state.assessmentText,
        planText: state.planText
      }
    })
  },
  {
    key: "prescription",
    label: "Add Prescription",
    group: "Doctor",
    permission: "prescription.create",
    description: "Create a manual prescription placeholder for doctor review/signing.",
    submitLabel: "Create prescription",
    fields: [
      { name: "medicationName", label: "Medicine name", required: true, defaultValue: "Demo medication placeholder" },
      { name: "dose", label: "Dose", defaultValue: "Demo dose" },
      { name: "frequency", label: "Frequency", defaultValue: "Demo frequency" },
      { name: "duration", label: "Duration", defaultValue: "Demo duration" },
      { name: "instructions", label: "Instructions", type: "textarea", defaultValue: "Demo instructions only." },
      { name: "notes", label: "Prescription note", type: "textarea", defaultValue: "Manual demo prescription only. No AI prescribing." }
    ],
    buildPayload: (state, { patient, latestEncounterId }) => ({
      endpoint: "/prescriptions",
      body: {
        patientId: patient.id,
        encounterId: latestEncounterId,
        notes: state.notes,
        items: [{ medicationName: state.medicationName, dose: state.dose, frequency: state.frequency, duration: state.duration, instructions: state.instructions }]
      }
    })
  },
  {
    key: "sign-encounter",
    label: "Sign Visit",
    group: "Doctor",
    permission: "encounter.sign",
    description: "Sign the latest visit note when it is ready. Signed records are not silently edited.",
    submitLabel: "Sign latest visit",
    fields: [{ name: "confirmation", label: "Confirmation note", defaultValue: "Doctor-reviewed demo visit note." }],
    buildPayload: (_state, { latestEncounterId }) => {
      if (!latestEncounterId) throw new Error("Create a visit note before signing.");
      return { endpoint: `/encounters/${latestEncounterId}/sign`, method: "PATCH", body: {} };
    }
  },
  {
    key: "investigation",
    label: "Order Lab / Radiology",
    group: "Reports",
    permission: "investigation.create",
    description: "Create an investigation order linked to this patient.",
    submitLabel: "Create order",
    fields: [
      { name: "category", label: "Order type", type: "select", defaultValue: "laboratory", options: [["laboratory", "Lab"], ["radiology", "Radiology"], ["ultrasound", "Ultrasound"], ["other", "Service"]] },
      { name: "testName", label: "Test or service name", required: true, defaultValue: "Demo lab test placeholder" },
      { name: "priority", label: "Priority", type: "select", defaultValue: "routine", options: [["routine", "Routine"], ["urgent", "Urgent"]] },
      { name: "notes", label: "Clinical reason", type: "textarea", defaultValue: "Demo investigation order only." }
    ],
    buildPayload: (state, { patient, latestEncounterId }) => ({
      endpoint: "/investigations/orders",
      body: { patientId: patient.id, encounterId: latestEncounterId, priority: state.priority || "routine", notes: state.notes, items: [{ category: state.category || "laboratory", testName: state.testName }] }
    })
  },
  {
    key: "report",
    label: "Create Report",
    group: "Reports",
    permission: "report.upload",
    description: "Create report metadata only. No real file upload.",
    submitLabel: "Create report",
    fields: [
      { name: "category", label: "Report type", type: "select", defaultValue: "laboratory", options: [["laboratory", "Lab"], ["radiology", "Radiology"], ["ultrasound", "Ultrasound"], ["external", "External"], ["other", "Other"]] },
      { name: "title", label: "Report title", required: true, defaultValue: "Demo report metadata placeholder" },
      { name: "resultSummary", label: "Summary", type: "textarea", defaultValue: "Demo report metadata only. Doctor review required." }
    ],
    buildPayload: (state, { patient, latestEncounterId }) => ({
      endpoint: "/reports",
      body: { patientId: patient.id, encounterId: latestEncounterId, category: state.category || "laboratory", title: state.title, source: "local_demo", resultSummary: state.resultSummary }
    })
  },
  {
    key: "pregnancy",
    label: "Create Pregnancy Episode",
    group: "OB/GYN",
    permission: "pregnancy.manage",
    description: "Record basic pregnancy episode details without automated diagnosis.",
    submitLabel: "Create pregnancy episode",
    fields: [
      { name: "gravida", label: "Gravida", type: "number", defaultValue: "1" },
      { name: "para", label: "Para", type: "number", defaultValue: "0" },
      { name: "lmpDate", label: "LMP", type: "date" },
      { name: "estimatedDueDate", label: "EDD", type: "date" },
      { name: "notes", label: "Notes", type: "textarea", defaultValue: "Recording only. Clinician interpretation required." }
    ],
    buildPayload: (state, { patient }) => ({
      endpoint: "/pregnancies",
      body: { patientId: patient.id, status: "active", gravida: numberOrUndefined(state.gravida), para: numberOrUndefined(state.para), lmpDate: dateOrUndefined(state.lmpDate), estimatedDueDate: dateOrUndefined(state.estimatedDueDate), riskLevel: "routine", notes: state.notes }
    })
  },
  {
    key: "ultrasound",
    label: "Create Ultrasound Draft",
    group: "OB/GYN",
    permission: "ob_ultrasound.manage",
    description: "Record OB ultrasound draft fields. No FGR or risk interpretation is automated.",
    submitLabel: "Create ultrasound draft",
    fields: [
      { name: "gestationalAgeWeeks", label: "Gestational age weeks", type: "number", defaultValue: "12" },
      { name: "gestationalAgeDays", label: "Days", type: "number", defaultValue: "0" },
      { name: "fetalHeartRateBpm", label: "Fetal heart placeholder", type: "number", defaultValue: "150" },
      { name: "impressionText", label: "Doctor impression", type: "textarea", defaultValue: "Recording only. Physician interpretation required. No diagnostic automation." }
    ],
    buildPayload: (state, { patient, latestPregnancyId, latestEncounterId }) => ({
      endpoint: "/ob-ultrasounds",
      body: { patientId: patient.id, pregnancyId: latestPregnancyId, encounterId: latestEncounterId, gestationalAgeWeeks: numberOrUndefined(state.gestationalAgeWeeks), gestationalAgeDays: numberOrUndefined(state.gestationalAgeDays), fetalHeartRateBpm: numberOrUndefined(state.fetalHeartRateBpm), impressionText: state.impressionText }
    })
  },
  {
    key: "antenatal",
    label: "Record Antenatal Visit",
    group: "OB/GYN",
    permission: "pregnancy.manage",
    description: "Append antenatal visit observations to the pregnancy episode. Recording only; no risk interpretation.",
    submitLabel: "Save antenatal note",
    fields: [
      { name: "bloodPressure", label: "BP", defaultValue: "Demo BP placeholder" },
      { name: "weight", label: "Weight", defaultValue: "Demo weight placeholder" },
      { name: "symptoms", label: "Symptoms / complaints", type: "textarea", defaultValue: "Demo antenatal symptoms placeholder." },
      { name: "fetalHeart", label: "Fetal heart placeholder", defaultValue: "Demo fetal heart placeholder" },
      { name: "plan", label: "Plan", type: "textarea", defaultValue: "Clinician-authored plan placeholder." },
      { name: "nextFollowUp", label: "Next follow-up", type: "date" }
    ],
    buildPayload: (state, { latestPregnancyId }) => {
      if (!latestPregnancyId) throw new Error("Create a pregnancy episode before recording an antenatal visit.");
      return {
        endpoint: `/pregnancies/${latestPregnancyId}`,
        method: "PATCH",
        body: {
          notes: [
            "Antenatal visit recording only.",
            `BP: ${state.bloodPressure || "not recorded"}`,
            `Weight: ${state.weight || "not recorded"}`,
            `Symptoms: ${state.symptoms || "not recorded"}`,
            `Fetal heart: ${state.fetalHeart || "not recorded"}`,
            `Plan: ${state.plan || "not recorded"}`,
            state.nextFollowUp ? `Next follow-up: ${state.nextFollowUp}` : "Next follow-up: not recorded"
          ].join("\n")
        }
      };
    }
  },
  {
    key: "invoice",
    label: "Create Invoice",
    group: "Finance",
    permission: "billing.manage",
    description: "Create a demo invoice. No payment gateway is connected.",
    submitLabel: "Create invoice",
    fields: [
      { name: "description", label: "Service", required: true, defaultValue: "Demo consultation service" },
      { name: "quantity", label: "Quantity", type: "number", defaultValue: "1" },
      { name: "unitAmount", label: "Unit price", type: "number", defaultValue: "120" },
      { name: "discountAmount", label: "Discount", type: "number", defaultValue: "0" },
      { name: "notes", label: "Billing note", type: "textarea", defaultValue: "Demo invoice only. No payment gateway." }
    ],
    buildPayload: (state, { patient }) => ({
      endpoint: "/billing/invoices",
      body: {
        patientId: patient.id,
        invoiceNumber: `DEMO-INV-${Date.now()}`,
        discountAmount: numberOrUndefined(state.discountAmount) ?? 0,
        notes: state.notes,
        items: [{ description: state.description, quantity: numberOrUndefined(state.quantity) ?? 1, unitAmount: numberOrUndefined(state.unitAmount) ?? 0 }]
      }
    })
  },
  {
    key: "payment",
    label: "Record Payment",
    group: "Finance",
    permission: "payment.manage",
    description: "Record a demo payment against the latest invoice for this patient.",
    submitLabel: "Record payment",
    fields: [
      { name: "method", label: "Payment method", type: "select", defaultValue: "cash", options: [["cash", "Cash"], ["bank_transfer", "Bank transfer"], ["mobile_wallet", "Mobile wallet"], ["other", "Other"]] },
      { name: "amount", label: "Amount", type: "number", required: true, defaultValue: "20" },
      { name: "referenceNote", label: "Reference note", type: "textarea", defaultValue: "Demo payment only. No card data." }
    ],
    buildPayload: (state, { latestInvoiceId }) => ({
      endpoint: "/billing/payments",
      body: { invoiceId: latestInvoiceId, method: state.method || "cash", amount: numberOrUndefined(state.amount) ?? 0, referenceNote: state.referenceNote }
    })
  },
  {
    key: "consent",
    label: "Add Consent",
    group: "Safety",
    permission: "patient.consent_manage",
    description: "Record a demo consent status. This is not production legal text.",
    submitLabel: "Record consent",
    fields: [
      { name: "consentType", label: "Consent type", type: "select", defaultValue: "treatment", options: [["treatment", "Treatment"], ["communication", "Communication"], ["report_storage", "Report storage"], ["ai_processing", "AI processing"], ["data_sharing", "Data sharing"]] },
      { name: "status", label: "Status", type: "select", defaultValue: "granted", options: [["granted", "Granted"], ["declined", "Declined"], ["withdrawn", "Withdrawn"], ["unknown", "Unknown"]] },
      { name: "notes", label: "Consent note", type: "textarea", defaultValue: "Demo consent foundation only. Legal review required before real patient use." }
    ],
    buildPayload: (state, { patient }) => ({
      endpoint: "/consents",
      body: { patientId: patient.id, consentType: state.consentType || "treatment", status: state.status || "granted", notes: state.notes }
    })
  },
  {
    key: "note",
    label: "Add Note",
    group: "Safety",
    permission: "patient.update",
    description: "Append a local demo administrative note to the patient file.",
    submitLabel: "Save note",
    fields: [{ name: "note", label: "Patient file note", type: "textarea", required: true, defaultValue: "Demo administrative note only." }],
    buildPayload: (state, { patient }) => ({
      endpoint: `/patients/${patient.id}`,
      method: "PATCH",
      body: { notes: `${patient.notes ? `${patient.notes}\n` : ""}${state.note}`.slice(0, 2000) }
    })
  },
  {
    key: "attachment",
    label: "Add Attachment Placeholder",
    group: "Safety",
    permission: "report.upload",
    description: "Create attachment metadata only. Real PHI file upload remains disabled.",
    submitLabel: "Create placeholder",
    fields: [
      { name: "title", label: "Placeholder title", required: true, defaultValue: "Demo attachment placeholder" },
      { name: "resultSummary", label: "Description", type: "textarea", defaultValue: "Metadata placeholder only. No real file uploaded." }
    ],
    buildPayload: (state, { patient }) => ({
      endpoint: "/reports",
      body: { patientId: patient.id, category: "external", title: state.title, source: "local_demo_placeholder", fileReference: "placeholder-only-no-file", resultSummary: state.resultSummary }
    })
  },
  {
    key: "ai",
    label: "AI Draft Placeholder",
    group: "Safety",
    permission: "ai_draft.request",
    description: "Create a disabled/mock AI draft placeholder. It cannot update final records.",
    submitLabel: "Create AI placeholder",
    fields: [{ name: "inputSourceSummary", label: "Source summary", type: "textarea", defaultValue: "Local demo AI draft placeholder only. No external AI request." }],
    buildPayload: (state, { patient, latestEncounterId }) => ({
      endpoint: "/ai-drafts",
      body: { draftType: "encounter_summary", patientId: patient.id, encounterId: latestEncounterId, inputSourceSummary: state.inputSourceSummary }
    })
  }
];

export default function PatientFilePage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [user, setUser] = useState<UserContext>({ roles: [], permissions: [] });
  const [activeTab, setActiveTab] = useState("summary");
  const [activeAction, setActiveAction] = useState("appointment");
  const [related, setRelated] = useState<Record<string, Record<string, unknown>[]>>({});
  const [status, setStatus] = useState("Opening patient file");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const active = useMemo(() => relatedTabs.find((tab) => tab.key === activeTab) ?? relatedTabs[0]!, [activeTab]);
  const allowedActions = useMemo(() => patientActions.filter((action) => canUse(user, action.permission)), [user]);
  const selectedAction = allowedActions.find((action) => action.key === activeAction) ?? allowedActions[0];
  const timeline = useMemo(() => buildTimeline(patient, related), [patient, related]);
  const context = useMemo<ActionContext | null>(() => {
    if (!patient) return null;
    return {
      patient,
      latestAppointmentId: latestId(related.appointments),
      latestEncounterId: latestId(related.encounters),
      latestPregnancyId: latestId(related.pregnancy),
      latestInvoiceId: latestId(related.billing)
    };
  }, [patient, related]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    setError("");
    Promise.all([
      fetch(`${apiUrl}/auth/me`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      }),
      fetch(`${apiUrl}/patients/${patientId}`, {
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : undefined
      })
    ])
      .then(async ([meResponse, patientResponse]) => {
        if (patientResponse.status === 401) throw new Error("Please sign in before opening patient files.");
        if (!patientResponse.ok) throw new Error("Could not open this patient file.");
        if (meResponse.ok) {
          const me = (await meResponse.json()) as { user?: UserContext };
          setUser({ roles: me.user?.roles ?? [], permissions: me.user?.permissions ?? [] });
        }
        setPatient((await patientResponse.json()) as Patient);
        setStatus("Loaded");
      })
      .catch((loadError) => {
        setStatus("Unavailable");
        setError(loadError instanceof Error ? loadError.message : "Unable to open patient file.");
      });
  }, [patientId, refreshKey]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const load = async () => {
      const entries = await Promise.all(
        relatedTabs
          .filter((tab) => tab.endpoint)
          .map(async (tab) => {
            try {
              const response = await fetch(`${apiUrl}${tab.endpoint}`, {
                credentials: "include",
                headers: token ? { authorization: `Bearer ${token}` } : undefined
              });
              if (!response.ok) return [tab.key, []] as const;
              const data = (await response.json()) as Record<string, unknown>;
              const collection = tab.collectionKey ? data[tab.collectionKey] : data;
              const rows = Array.isArray(collection) ? (collection as Record<string, unknown>[]) : [];
              return [tab.key, rows.filter((row) => row.patientId === patientId)] as const;
            } catch {
              return [tab.key, []] as const;
            }
          })
      );
      setRelated(Object.fromEntries(entries));
    };
    void load();
  }, [patientId, refreshKey]);

  useEffect(() => {
    if (selectedAction && !allowedActions.some((action) => action.key === activeAction)) {
      setActiveAction(selectedAction.key);
    }
  }, [activeAction, allowedActions, selectedAction]);

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Patient file</p>
            <h1>{patient ? `${patient.firstName} ${patient.lastName}` : "Opening patient file"}</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button secondary compact" href="/patients">
              Back to patients
            </Link>
            <span className="badge">{patient?.status ?? status}</span>
          </div>
        </div>
        <p className="muted">This is the working center for one patient. Actions below carry this patient automatically.</p>
      </section>

      <SafetyAlert />

      {error ? (
        <section className="panel">
          <p className="form-error">{error}</p>
          <Link className="button" href="/login">Go to login</Link>
        </section>
      ) : null}

      {patient ? (
        <>
          <PatientHeader patient={patient} timelineCount={timeline.length} />
          {message ? <section className="notice success">{message}</section> : null}
          <WorkflowActions
            actions={allowedActions}
            context={context}
            onChanged={(text) => {
              setMessage(text);
              setRefreshKey((current) => current + 1);
              setActiveTab("timeline");
            }}
            selectedAction={selectedAction}
            setSelectedAction={setActiveAction}
          />

          <section className="patient-tabs" aria-label="Patient file sections">
            {relatedTabs.map((tab) => (
              <button
                className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </section>

          {active.key === "summary" ? <Overview patient={patient} context={context} related={related} /> : null}
          {active.key === "timeline" ? <TimelinePanel items={timeline} /> : null}
          {active.key !== "summary" && active.key !== "timeline" ? <RelatedPanel config={active} rows={related[active.key] ?? []} /> : null}
        </>
      ) : !error ? (
        <div className="skeleton" />
      ) : null}
    </AppShell>
  );
}

function PatientHeader({ patient, timelineCount }: { patient: Patient; timelineCount: number }) {
  return (
    <section className="patient-hero panel">
      <div>
        <p className="eyebrow">MRN</p>
        <strong>{patient.medicalRecordNumber}</strong>
      </div>
      <div>
        <p className="eyebrow">DOB / age</p>
        <strong>{patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "Not set"}</strong>
      </div>
      <div>
        <p className="eyebrow">Sex</p>
        <strong>{patient.sex || "Not set"}</strong>
      </div>
      <div>
        <p className="eyebrow">Contact</p>
        <strong>{patient.phone || patient.email || "Not saved"}</strong>
      </div>
      <div>
        <p className="eyebrow">Timeline</p>
        <strong>{timelineCount} events</strong>
      </div>
    </section>
  );
}

function WorkflowActions({
  actions,
  context,
  onChanged,
  selectedAction,
  setSelectedAction
}: {
  actions: PatientAction[];
  context: ActionContext | null;
  onChanged: (message: string) => void;
  selectedAction?: PatientAction;
  setSelectedAction: (key: string) => void;
}) {
  if (!context) return null;
  if (actions.length === 0) {
    return <section className="panel"><div className="empty-state">No patient actions are available for this role.</div></section>;
  }

  return (
    <section className="panel workflow-actions">
      <div className="section-heading">
        <div>
          <h2>Patient workflow actions</h2>
          <p className="muted">Choose an allowed action. The patient file is already selected.</p>
        </div>
        <span className="badge accent">Patient centered</span>
      </div>
      <div className="action-layout">
        <div className="action-list" aria-label="Patient quick actions">
          {actions.map((action) => (
            <button className={`action-card ${selectedAction?.key === action.key ? "active" : ""}`} key={action.key} onClick={() => setSelectedAction(action.key)} type="button">
              <span className="eyebrow">{action.group}</span>
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </button>
          ))}
        </div>
        {selectedAction ? <ActionForm action={selectedAction} context={context} onChanged={onChanged} /> : null}
      </div>
    </section>
  );
}

function ActionForm({ action, context, onChanged }: { action: PatientAction; context: ActionContext; onChanged: (message: string) => void }) {
  const [state, setState] = useState<Record<string, string>>(() => defaultState(action));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setState(defaultState(action));
    setError("");
  }, [action]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const request = action.buildPayload(state, context);
      if (action.key === "payment" && !request.body.invoiceId) {
        throw new Error("Create an invoice for this patient before recording a payment.");
      }

      const token = sessionStorage.getItem("prijClinicToken");
      const response = await fetch(`${apiUrl}${request.endpoint}`, {
        method: request.method ?? "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(stripUndefined(request.body))
      });

      if (!response.ok) {
        throw new Error("This action could not be completed for your role or current patient context.");
      }

      onChanged(`${action.label} completed for this patient file.`);
      setState(defaultState(action));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete this action.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="action-form" onSubmit={submit}>
      <div>
        <p className="eyebrow">{action.group}</p>
        <h3>{action.label}</h3>
        <p className="muted">{action.description}</p>
      </div>
      {action.fields.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              onChange={(event) => setState((current) => ({ ...current, [field.name]: event.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
              value={state[field.name] ?? ""}
            />
          ) : field.type === "select" ? (
            <select
              name={field.name}
              onChange={(event) => setState((current) => ({ ...current, [field.name]: event.target.value }))}
              required={field.required}
              value={state[field.name] ?? ""}
            >
              {(field.options ?? []).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          ) : (
            <input
              name={field.name}
              onChange={(event) => setState((current) => ({ ...current, [field.name]: event.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
              type={field.type ?? "text"}
              value={state[field.name] ?? ""}
            />
          )}
        </label>
      ))}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving" : action.submitLabel}
      </button>
    </form>
  );
}

function Overview({ patient, context, related }: { patient: Patient; context: ActionContext | null; related: Record<string, Record<string, unknown>[]> }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Patient summary</h2>
          <p className="muted">Only minimum demographics and workflow status are shown. No clinical decision support is implemented.</p>
        </div>
        <span className="badge warning">Demo file</span>
      </div>
      <dl className="profile-grid">
        <div>
          <dt>Name</dt>
          <dd>{patient.firstName} {patient.lastName}</dd>
        </div>
        <div>
          <dt>MRN</dt>
          <dd>{patient.medicalRecordNumber}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{patient.branchId ? "Assigned branch" : "Current branch scope"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{patient.status}</dd>
        </div>
        <div>
          <dt>Latest appointment</dt>
          <dd>{context?.latestAppointmentId ? "Available" : "Not booked yet"}</dd>
        </div>
        <div>
          <dt>Latest invoice</dt>
          <dd>{context?.latestInvoiceId ? "Available" : "No invoice yet"}</dd>
        </div>
        <div className="wide">
          <dt>Workflow counts</dt>
          <dd>{Object.entries(related).map(([key, rows]) => `${labelize(key)}: ${rows.length}`).join(" | ") || "No related records yet."}</dd>
        </div>
        <div className="wide">
          <dt>Notes</dt>
          <dd>{patient.notes || "No notes saved."}</dd>
        </div>
      </dl>
    </section>
  );
}

function TimelinePanel({ items }: { items: TimelineItem[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Patient timeline</h2>
          <p className="muted">Patient-specific journey across reception, clinical, reporting, finance, consent, and safety actions.</p>
        </div>
        <span className="badge">{items.length} events</span>
      </div>
      {items.length === 0 ? <div className="empty-state">No patient timeline events yet.</div> : null}
      <div className="timeline-list">
        {items.map((item) => (
          <article className="timeline-item" key={item.id}>
            <div>
              <span className="timeline-dot" />
            </div>
            <div>
              <p className="eyebrow">{formatDate(item.at)} | {item.type}</p>
              <h3>{item.href ? <Link href={item.href}>{item.title}</Link> : item.title}</h3>
              <p className="muted">{item.description}</p>
            </div>
            {item.status ? <span className="badge">{item.status}</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function RelatedPanel({ config, rows }: { config: RelatedConfig; rows: Record<string, unknown>[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{config.label}</h2>
          <p className="muted">Patient-scoped view only.</p>
        </div>
        <span className="badge">{rows.length} records</span>
      </div>
      {rows.length === 0 ? <div className="empty-state">{config.empty}</div> : null}
      {rows.length > 0 ? (
        <div className="data-list">
          {rows.map((row, index) => (
            <article className="data-row" key={String(row.id ?? index)}>
              <div className="data-row-header">
                <strong>{recordTitle(row)}</strong>
                <span className="badge">{String(row.status ?? row.reviewStatus ?? row.category ?? "demo")}</span>
              </div>
              <p className="muted">{recordDescription(row)}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function buildTimeline(patient: Patient | null, related: Record<string, Record<string, unknown>[]>): TimelineItem[] {
  const items: TimelineItem[] = [];
  if (patient?.createdAt) {
    items.push({ id: `patient-${patient.id}`, at: patient.createdAt, type: "Patient file", title: "Patient file created", description: `${patient.firstName} ${patient.lastName} opened as a demo patient file.`, status: patient.status, href: `/patients/${patient.id}` });
  }
  addRows(items, related.appointments, "Appointment", "/appointments", (row) => String(row.appointmentType ?? "Appointment booked"), (row) => String(row.notes ?? "Appointment linked to this patient."));
  addRows(items, related.queue, "Queue", "/queue", (row) => `Queue ${String(row.queueNumber ?? "check-in")}`, () => "Patient checked into the clinic queue.");
  addRows(items, related.encounters, "Visit note", "/encounters", (row) => String(row.chiefComplaint ?? "Encounter created"), (row) => String(row.planText ?? "Doctor-authored encounter draft."));
  addRows(items, related.prescriptions, "Prescription", "/prescriptions", () => "Prescription created", (row) => String(row.notes ?? "Manual prescription placeholder."));
  addRows(items, related.investigations, "Investigation", "/investigations", () => "Investigation ordered", (row) => String(row.notes ?? "Investigation request linked to this patient."));
  addRows(items, related.reports, "Report", "/reports", (row) => String(row.title ?? "Report created"), (row) => String(row.resultSummary ?? "Report metadata linked to this patient."));
  addRows(items, related.pregnancy, "Pregnancy", "/pregnancies", () => "Pregnancy episode recorded", (row) => String(row.notes ?? "OB/GYN recording only."));
  addRows(items, related.ultrasound, "Ultrasound", "/ultrasound", () => "Ultrasound draft recorded", (row) => String(row.impressionText ?? "Recording only. Clinician interpretation required."));
  addRows(items, related.billing, "Billing", "/billing", (row) => String(row.invoiceNumber ?? "Invoice created"), (row) => `Total ${String(row.totalAmount ?? "recorded")}`);
  addRows(items, related.consents, "Consent", "/consents", (row) => `${labelize(String(row.consentType ?? "Consent"))} consent`, (row) => String(row.notes ?? "Consent foundation record."));
  addRows(items, related.ai, "AI Draft Review", "/ai-drafts", () => "Disabled/mock AI draft", (row) => String(row.inputSourceSummary ?? "No external AI request."));
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function addRows(items: TimelineItem[], rows: Record<string, unknown>[] | undefined, type: string, href: string, title: (row: Record<string, unknown>) => string, description: (row: Record<string, unknown>) => string) {
  for (const row of rows ?? []) {
    items.push({
      id: `${type}-${String(row.id ?? Math.random())}`,
      at: String(row.createdAt ?? row.updatedAt ?? row.startAt ?? row.performedAt ?? new Date().toISOString()),
      type,
      title: title(row),
      description: description(row),
      status: String(row.status ?? row.reviewStatus ?? row.priority ?? ""),
      href
    });
  }
}

function canUse(user: UserContext, permission: string) {
  return user.roles.some((role) => ["Owner", "Admin", "Super Admin"].includes(role)) || user.permissions.includes(permission);
}

function defaultState(action: PatientAction) {
  return Object.fromEntries(action.fields.map((field) => [field.name, field.defaultValue ?? ""]));
}

function latestId(rows: Record<string, unknown>[] | undefined) {
  return [...(rows ?? [])].sort((a, b) => new Date(String(b.createdAt ?? b.updatedAt ?? 0)).getTime() - new Date(String(a.createdAt ?? a.updatedAt ?? 0)).getTime())[0]?.id as string | undefined;
}

function recordTitle(row: Record<string, unknown>) {
  return String(row.title ?? row.invoiceNumber ?? row.appointmentType ?? row.draftType ?? row.medicalRecordNumber ?? "Patient-linked record");
}

function recordDescription(row: Record<string, unknown>) {
  return String(row.notes ?? row.resultSummary ?? row.inputSourceSummary ?? row.impressionText ?? row.chiefComplaint ?? "Patient-linked demo record.");
}

function numberOrUndefined(value?: string) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function dateOrUndefined(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function stripUndefined(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ""));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
