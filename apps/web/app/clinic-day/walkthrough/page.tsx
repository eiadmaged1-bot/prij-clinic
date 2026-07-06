import Link from "next/link";
import { ThreeDMedicalIcon, type IconName } from "../../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../../mvp-page";

type WalkthroughStep = {
  title: string;
  status: "Ready" | "Locked" | "Review";
  href: string;
  action: string;
  description: string;
  icon: IconName;
  detectable: string;
};

const steps: WalkthroughStep[] = [
  {
    title: "Reception",
    status: "Ready",
    href: "/dashboard",
    action: "Start from dashboard",
    description: "Owner signs in, opens the daily workspace, and creates the receptionist account from Owner Control when needed.",
    icon: "reception",
    detectable: "Dashboard and owner tools are available"
  },
  {
    title: "Patient creation",
    status: "Locked",
    href: "/patients/new",
    action: "Create patient",
    description: "Register a local training patient, then continue directly into the patient profile.",
    icon: "patients",
    detectable: "Saves and opens patient file"
  },
  {
    title: "Check-in",
    status: "Locked",
    href: "/reception/check-in",
    action: "Check in walk-in",
    description: "Use the compact patient picker, choose walk-in or appointment, then send the patient to the queue.",
    icon: "queue",
    detectable: "PatientPicker and compact wizard"
  },
  {
    title: "Doctor waiting",
    status: "Locked",
    href: "/doctor/waiting",
    action: "Open waiting list",
    description: "Review current in-room and waiting patients with open file and continue visit actions.",
    icon: "doctor",
    detectable: "Compact doctor handoff cards"
  },
  {
    title: "Patient profile",
    status: "Locked",
    href: "/patients",
    action: "Open patient file",
    description: "Continue from the selected patient profile; all action drawers already know the current patient.",
    icon: "files",
    detectable: "Selected patient card in actions"
  },
  {
    title: "Doctor visit",
    status: "Locked",
    href: "/doctor/visit",
    action: "Start doctor visit",
    description: "Select complaint cards, move through visit steps, and save a doctor-authored draft.",
    icon: "encounter",
    detectable: "Complaint cards and autosave label"
  },
  {
    title: "Prescription draft",
    status: "Locked",
    href: "/prescriptions",
    action: "Create prescription draft",
    description: "Attach a manual prescription draft to the patient. No automatic dosing or prescribing is added.",
    icon: "prescription",
    detectable: "PatientPicker and manual fields"
  },
  {
    title: "Investigation request",
    status: "Locked",
    href: "/investigations",
    action: "Request investigation",
    description: "Search the catalog, select compact request chips, and attach the request to the patient.",
    icon: "investigations",
    detectable: "Selected request chips"
  },
  {
    title: "Follow-up",
    status: "Review",
    href: "/patients",
    action: "Open follow-up",
    description: "Add or review follow-up from the patient file visit flow. Follow-up remains manual and doctor-reviewed.",
    icon: "timeline",
    detectable: "Follow-up tab and visit task"
  },
  {
    title: "Print packet",
    status: "Ready",
    href: "/patients",
    action: "Print patient packet",
    description: "Open a patient profile and use the print packet action or route after selecting the training patient.",
    icon: "reports",
    detectable: "/patients/[id]/print/packet source exists"
  }
];

export default function ClinicDayWalkthroughPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Clinic walkthrough</p>
            <h1>Clinic day walkthrough</h1>
          </div>
          <div className="topbar-actions">
            <span className="badge warning">Guided review</span>
            <span className="badge accent">Doctor review</span>
            <span className="badge">AI draft-only</span>
          </div>
        </div>
        <p className="muted">
          One connected daily clinic path for local training: owner setup, reception, queue, doctor visit, drafts, requests, follow-up, and packet print.
        </p>
      </section>

      <SafetyAlert />

      <section className="workflow-band" aria-label="Clinic day walkthrough steps">
        {steps.map((step, index) => (
          <span key={step.title}>{index + 1}. {step.title}</span>
        ))}
      </section>

      <section className="module-grid clinic-walkthrough-grid">
        {steps.map((step, index) => (
          <article className="module-card clinic-walkthrough-card" key={step.title}>
            <div className="data-row-header">
              <ThreeDMedicalIcon name={step.icon} size="sm" />
              <span className={step.status === "Locked" ? "badge accent" : step.status === "Review" ? "badge warning" : "badge"}>
                {step.status}
              </span>
            </div>
            <strong>{index + 1}. {step.title}</strong>
            <p className="muted">{step.description}</p>
            <p className="badge compact-safety-badge">{step.detectable}</p>
            <Link className="button compact" href={step.href}>
              {step.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <h2>Safety boundaries</h2>
          <span className="badge warning">Training only</span>
        </div>
        <ul className="feature-list">
          <li>No external AI calls, WhatsApp, DICOM/PACS, payment gateway, or readiness claim is made here.</li>
          <li>AI and Care Assist remain draft-only support and require doctor review.</li>
          <li>Medication reference strength and form stay metadata only; patient instructions are doctor-written.</li>
          <li>Signed clinical records are not silently changed by autosave.</li>
        </ul>
      </section>
    </AppShell>
  );
}
