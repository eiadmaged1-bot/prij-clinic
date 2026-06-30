"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function PatientVisitPacketPrintPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [patient, setPatient] = useState<Record<string, unknown> | null>(null);
  const [timeline, setTimeline] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem("prijClinicToken");
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;
    void Promise.all([
      fetch(`${apiUrl}/patients/${patientId}`, { credentials: "include", headers }).then((response) => response.ok ? response.json() : null),
      fetch(`${apiUrl}/patients/${patientId}/timeline`, { credentials: "include", headers }).then((response) => response.ok ? response.json() : { items: [] })
    ]).then(([patientData, timelineData]) => {
      setPatient(patientData);
      setTimeline(timelineData.items ?? []);
    });
  }, [patientId]);

  return (
    <main className="print-page">
      <button className="button no-print" type="button" onClick={() => window.print()}>Print packet</button>
      <h1>Patient Visit Packet</h1>
      <p>Demo/local browser print. No PDF generation. Doctor review required.</p>
      {patient ? (
        <section>
          <h2>{String(patient.firstName)} {String(patient.lastName)}</h2>
          <p>File {String(patient.medicalRecordNumber)} | {String(patient.patientType ?? "General")}</p>
        </section>
      ) : <p>Loading patient packet.</p>}
      <section>
        <h2>Timeline</h2>
        {timeline.slice(0, 30).map((item, index) => (
          <p key={index}><strong>{String(item.title)}</strong>: {String(item.description)} {String(item.status ?? "")}</p>
        ))}
      </section>
    </main>
  );
}
