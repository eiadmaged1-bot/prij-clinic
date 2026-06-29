"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import { AppShell, SafetyAlert } from "../mvp-page";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type QueueTicket = {
  id: string;
  patientId?: string;
  queueNumber?: string;
  status?: string;
  priority?: string;
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
      fetch(`${apiUrl}/queue/today`, { credentials: "include", headers }),
      fetch(`${apiUrl}/appointments`, { credentials: "include", headers })
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

  return (
    <AppShell>
      <section className="doctor-hero">
        <div>
          <p className="eyebrow">Doctor Mode</p>
          <h1>Today&apos;s visits, made simple</h1>
          <p className="muted">Open patient, start visit, write note, prescribe, order tests, finish, next patient.</p>
        </div>
        <div className="doctor-hero-actions">
          <Link className="button large" href="/patients">
            <ThreeDMedicalIcon name="patients" size="sm" />
            Open Patient
          </Link>
          <Link className="button secondary large" href="/doctor/visit">
            <ThreeDMedicalIcon name="encounter" size="sm" tone="navy" />
            Start Visit
          </Link>
        </div>
      </section>

      <SafetyAlert />

      <section className="doctor-today-grid">
        <article className="doctor-focus-card">
          <ThreeDMedicalIcon name="queue" size="lg" />
          <span className="eyebrow">Waiting queue</span>
          <strong>{queue.length}</strong>
          <p className="muted">Patients waiting or moving through the clinic flow.</p>
          <Link className="button compact" href="/queue">Open queue</Link>
        </article>
        <article className="doctor-focus-card">
          <ThreeDMedicalIcon name="calendar" size="lg" tone="navy" />
          <span className="eyebrow">Today&apos;s patients</span>
          <strong>{appointments.length}</strong>
          <p className="muted">Scheduled visits for today&apos;s clinical work.</p>
          <Link className="button compact secondary" href="/calendar">Open calendar</Link>
        </article>
        <article className="doctor-focus-card">
          <ThreeDMedicalIcon name="prescription" size="lg" tone="violet" />
          <span className="eyebrow">Next action</span>
          <strong>Write note</strong>
          <p className="muted">Use the guided visit flow for large, readable steps.</p>
          <Link className="button compact secondary" href="/doctor/visit">Guided visit</Link>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Waiting patients</h2>
            <p className="muted">Status: {status}</p>
          </div>
          <span className="badge accent">Simple list</span>
        </div>
        <div className="doctor-list">
          {queue.length === 0 ? (
            <p className="empty-state">
              <ThreeDMedicalIcon name="queue" size="sm" tone="slate" />
              <span>No waiting patient is loaded. Open Patients to start a demo visit.</span>
            </p>
          ) : null}
          {queue.map((ticket) => (
            <Link className="doctor-row" href={ticket.patientId ? `/patients/${ticket.patientId}` : "/queue"} key={ticket.id}>
              <ThreeDMedicalIcon name="queue" size="sm" />
              <div>
                <strong>Queue {ticket.queueNumber ?? "patient"}</strong>
                <span>{ticket.status ?? "Waiting"} - {ticket.priority ?? "Routine"}</span>
              </div>
              <span className="button compact secondary">
                <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
                Open
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="doctor-step-strip" aria-label="Doctor workflow">
        {["Open patient", "Start visit", "Write note", "Prescribe", "Order tests", "Finish", "Next patient"].map((step, index) => (
          <span key={step}><b>{index + 1}</b>{step}</span>
        ))}
      </section>
    </AppShell>
  );
}
