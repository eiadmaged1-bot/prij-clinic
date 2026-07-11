"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconName, ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../mvp-page";
import { visitTypeCounts, visitTypeLabel, type VisitTypeValue } from "@/lib/visit-types";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { DoctorQuickPatientCreate } from "@/components/patients/DoctorQuickPatientCreate";
import { PatientSearchMobile } from "@/components/patients/PatientSearchMobile";

type QueueTicket = {
  id: string;
  patientId?: string;
  queueNumber?: string;
  status?: string;
  priority?: string;
  visitType?: VisitTypeValue | null;
};

type Appointment = {
  id: string;
  patientId?: string;
  appointmentType?: string;
  status?: string;
  startAt?: string;
};

export default function DoctorModePage() {
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("Loading");

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;

    Promise.all([
      fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }),
      fetch(`${getApiBaseUrl()}/appointments`, { credentials: "include", headers })
    ])
      .then(async ([queueResponse, appointmentResponse]) => {
        const queueData = queueResponse.ok ? await queueResponse.json() : { queueTickets: [] };
        const appointmentData = appointmentResponse.ok ? await appointmentResponse.json() : { appointments: [] };
        setQueue((queueData.queueTickets ?? []).slice(0, 6));
        setAppointments((appointmentData.appointments ?? []).slice(0, 6));
        setStatus("Ready");
      })
      .catch(() => setStatus("Could not load today's work"));
  }, []);

  const current = queue.find((ticket) => ticket.status === "called");
  const counts = visitTypeCounts(queue);

  return (
    <AppShell>
      <section className="doctor-hero">
        <div>
          <p className="eyebrow">Doctor Mode</p>
          <h1>Today&apos;s visits, made simple</h1>
          <p className="muted">Open patient, start visit, write note, prescribe, order tests, finish, next patient.</p>
        </div>
        <div className="doctor-hero-actions">
          <a className="button large" data-action-id="patient.search" href="#doctor-patient-search"><ThreeDMedicalIcon name="patients" size="sm" />Search Patient</a>
          <a className="button secondary large" data-action-id="patient.create" href="#doctor-new-patient">New Patient</a>
          <Link className="button secondary large" href="/doctor/visit"><ThreeDMedicalIcon name="encounter" size="sm" tone="navy" />Start Visit</Link>
        </div>
      </section>

      <SafetyAlert />

      <nav className="doctor-mobile-fallback-nav" aria-label="Doctor mobile workflow">
        <a href="#doctor-today">Today</a><a href="#doctor-patient-search">Search</a><a href="#doctor-new-patient">New Patient</a><Link href="/doctor/visit">Current Visit</Link><Link href="/profile">Account</Link>
      </nav>

      <PatientSearchMobile />
      <DoctorQuickPatientCreate />

      <section className="doctor-today-grid" id="doctor-today">
        <FocusCard icon="queue" eyebrow="Waiting patients" value={queue.length} text="Patients waiting or moving through the clinic flow." href="/doctor/waiting" action="Open waiting list" />
        <FocusCard icon="calendar" eyebrow="Today&apos;s patients" value={appointments.length} text="Scheduled visits for today&apos;s clinical work." href="/calendar" action="Open calendar" />
        <FocusCard icon="prescription" eyebrow="Next action" value="Write note" text="Use the doctor visit flow for large, readable steps." href="/doctor/visit" action="Open visit" />
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <h2>Visit type counts</h2>
          <span className="badge">Doctor waiting list</span>
        </div>
        <div className="visit-type-counts" aria-label="Doctor visit type counts">
          <span>كشف {counts.kashf}</span>
          <span>إعادة {counts.recheck}</span>
          <span>استشارة {counts.consultation}</span>
          <span>مستعجل {counts.urgent_kashf}</span>
        </div>
      </section>

      <section className="panel compact-panel current-patient-panel">
        <div className="section-heading"><h2>Current in-room patient</h2><span className="badge">{current ? current.status : "None"}</span></div>
        {current ? (
          <article className="data-row dense">
            <div className="data-row-header"><strong>Queue {current.queueNumber ?? "patient"}</strong><span className="badge">{visitTypeLabel(current.visitType)}</span></div>
            <p className="muted">Follow-up hints and visit context stay inside the patient file.</p>
            <div className="form-actions">
              <Link className="button compact" href={current.patientId ? `/patients/${current.patientId}` : "/queue"}>Open file</Link>
              <Link className="button secondary compact" href={current.patientId ? `/doctor/visit?patientId=${current.patientId}` : "/doctor/visit"}>Continue visit</Link>
              <Link className="button secondary compact" href="/doctor/waiting">Complete</Link>
            </div>
          </article>
        ) : (
          <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No current patient in room.</span><Link className="button secondary compact" href="/doctor/waiting">Open doctor waiting list</Link></p>
        )}
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <h2>Patients waiting for doctor</h2>
            <p className="muted">Status: {status}</p>
          </div>
          <span className="badge accent">Simple list</span>
        </div>
        <div className="doctor-list">
          {queue.length === 0 ? (
            <p className="empty-state"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" /><span>No waiting patient is loaded. Open Patients to start a visit.</span></p>
          ) : null}
          {queue.map((ticket) => (
            <Link className="doctor-row" href={ticket.patientId ? `/patients/${ticket.patientId}` : "/queue"} key={ticket.id}>
              <ThreeDMedicalIcon name="queue" size="sm" />
              <div>
                <strong>Queue {ticket.queueNumber ?? "patient"}</strong>
                <span>{ticket.status ?? "Waiting"} - {visitTypeLabel(ticket.visitType)} - Start or resume visit</span>
              </div>
              <span className="button compact secondary"><ThreeDMedicalIcon name="files" size="sm" tone="slate" />Open</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="doctor-step-strip" aria-label="Doctor workflow">
        {["Open patient", "Start visit", "Write note", "Prescribe", "Order tests", "Finish", "Next patient"].map((step, index) => (
          <span key={step}><b>{index + 1}</b>{step}</span>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OB/GYN Templates</p>
            <h2>Choose the visit type</h2>
            <p className="muted">Templates guide the doctor to the right patient-file section. They do not diagnose, prescribe, or complete records automatically.</p>
          </div>
          <ThreeDMedicalIcon name="pregnancy" size="sm" tone="rose" />
        </div>
        <div className="obgyn-template-grid">
          {[
            ["New pregnancy booking", "Pregnancy overview and obstetric history", "pregnancy"],
            ["Routine antenatal follow-up", "BP, weight, symptoms, fetal heart, plan", "calendar"],
            ["Ultrasound visit", "Measurements and doctor-written impression", "ultrasound"],
            ["Gynecology visit", "Complaint, history, examination, impression", "doctor"],
            ["Follow-up visit", "Timeline, reports, orders, and next step", "timeline"],
            ["Procedure visit", "Clinician-authored procedure note", "reports"]
          ].map(([title, text, icon]) => (
            <Link className="obgyn-template-card" href="/patients" key={title}>
              <ThreeDMedicalIcon name={icon as IconName} size="sm" />
              <strong>{title}</strong>
              <p className="muted">{text}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function FocusCard({ icon, eyebrow, value, text, href, action }: { icon: IconName; eyebrow: string; value: string | number; text: string; href: string; action: string }) {
  return (
    <article className="doctor-focus-card">
      <ThreeDMedicalIcon name={icon} size="lg" />
      <span className="eyebrow">{eyebrow}</span>
      <strong>{value}</strong>
      <p className="muted">{text}</p>
      <Link className="button compact secondary" href={href}>{action}</Link>
    </article>
  );
}
