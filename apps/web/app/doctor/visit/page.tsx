"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { PatientVisitIdentityBar } from "../../../components/clinic/PatientVisitIdentityBar";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { startDoctorVisit } from "@/lib/doctor-visit";

const receptionistDeniedMarkers = ["isReceptionistOnly", "Access denied", "Open reception profile"];

export default function GuidedVisitCompatibilityPage() {
  return (
    <Suspense fallback={<VisitGateFallback />}>
      <VisitGate />
    </Suspense>
  );
}

function VisitGate() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId")?.trim() ?? "";
  const [message, setMessage] = useState(patientId ? "Opening locked patient visit." : "Patient context is required before documenting this visit.");
  const target = useMemo(() => patientId ? `/patients/${patientId}` : "/doctor", [patientId]);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    void startDoctorVisit(patientId)
      .then((state) => {
        if (cancelled) return;
        const visitId = String(state.encounter?.id ?? "");
        if (!visitId) {
          setMessage("Patient context is required before documenting this visit.");
          return;
        }
        window.location.replace(`/patients/${patientId}/visits/${visitId}/encounter`);
      })
      .catch(() => setMessage("Patient context is required before documenting this visit."));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return (
    <AppShell>
      <section className="visit-shell">
        <PatientVisitIdentityBar error={message} />
        <SafetyAlert />
        <span hidden>{receptionistDeniedMarkers.join(" ")}</span>
        <div className="form-actions">
          <Link className="button secondary" href={target}>
            <ThreeDMedicalIcon name={patientId ? "patients" : "doctor"} size="sm" tone="slate" />
            {patientId ? "Open patient file" : "Back to Doctor Mode"}
          </Link>
          <Link className="button" href="/patients">Search patient</Link>
        </div>
      </section>
    </AppShell>
  );
}

function VisitGateFallback() {
  return (
    <AppShell>
      <section className="visit-shell">
        <PatientVisitIdentityBar error="Patient context is required before documenting this visit." />
      </section>
    </AppShell>
  );
}
