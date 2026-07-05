"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { getApiBaseUrl } from "@/lib/api-base-url";
import type { VisitTypeValue } from "@/lib/visit-types";
import { AppShell, SafetyAlert } from "../../mvp-page";

type ResolvedPatient = { patientId: string; displayName: string; medicalRecordNumber?: string | null; status?: string | null };

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

export default function ReceptionQrScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualId, setManualId] = useState("");
  const [resolved, setResolved] = useState<ResolvedPatient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("Ready");
  const [scannerStatus, setScannerStatus] = useState("Camera scanner optional");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const resolvePatient = useCallback(async (rawValue: string, source: "scan" | "manual") => {
    const patientId = rawValue.trim();
    if (!patientId) return;
    setManualId(patientId);
    setStatus(source === "scan" ? "QR scanned" : "Checking patient ID");
    const response = await fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(patientId)}/qr`, {
      credentials: "include",
      headers
    }).catch(() => null);
    if (!response || response.status === 401) {
      setResolved(null);
      setStatus("Please sign in before scanning patient QR.");
      return;
    }
    if (!response.ok) {
      setResolved(null);
      setStatus("No patient found for this QR.");
      return;
    }
    const patient = await response.json() as ResolvedPatient;
    setResolved(patient);
    setStatus("Patient found. Opening file.");
    window.setTimeout(() => router.push(`/patients/${encodeURIComponent(patient.patientId)}`), 900);
  }, [headers, router]);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    async function startScanner() {
      const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setScannerStatus("Camera scanning is unavailable here. Enter the patient ID from the QR.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new Detector({ formats: ["qr_code"] });
        setScannerStatus("Camera scanner active");
        const scan = async () => {
          if (cancelled || resolved) return;
          if (videoRef.current?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
            const codes = await detector.detect(videoRef.current).catch(() => []);
            const value = codes[0]?.rawValue;
            if (value) {
              await resolvePatient(value, "scan");
              return;
            }
          }
          frame = window.setTimeout(scan, 400);
        };
        void scan();
      } catch {
        setScannerStatus("Camera permission or HTTPS is required. Enter the patient ID from the QR.");
      }
    }

    void startScanner();
    return () => {
      cancelled = true;
      window.clearTimeout(frame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [resolvePatient, resolved]);

  async function checkIn() {
    if (!resolved) return;
    if (!visitType) {
      setStatus("Select visit type first");
      return;
    }
    setStatus("Adding to queue");
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify({ patientId: resolved.patientId, priority: "routine", visitType })
    }).catch(() => null);
    setStatus(response?.ok ? "Patient added to queue." : "Could not add to queue. Check your role.");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Patient QR Scan</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button secondary compact" href="/reception"><ThreeDMedicalIcon name="reception" size="sm" tone="slate" />Reception</Link>
            <Link className="button secondary compact" href="/reception/check-in"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" />Check-in</Link>
          </div>
        </div>
      </section>
      <SafetyAlert />
      <section className="content-grid">
        <article className="panel compact-panel">
          <div className="section-heading">
            <h2>Scan QR</h2>
            <span className="badge">{scannerStatus}</span>
          </div>
          <video className="qr-video" ref={videoRef} muted playsInline />
          <p className="muted">Phone camera scanning may require HTTPS. Manual entry is always available.</p>
        </article>
        <article className="panel compact-panel">
          <div className="section-heading">
            <h2>Manual QR Input</h2>
            <span className="badge">{status}</span>
          </div>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void resolvePatient(manualId, "manual"); }}>
            <label>
              Patient ID from QR
              <input value={manualId} onChange={(event) => setManualId(event.target.value)} placeholder="Enter patient ID" />
            </label>
            <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Resolve patient</button>
          </form>
          {resolved ? (
            <div className="selected-patient-card">
              <strong>{resolved.displayName || "Patient found"}</strong>
              <span>{resolved.medicalRecordNumber ? `File ${resolved.medicalRecordNumber}` : "Patient file ready"}</span>
              <VisitTypeSelector value={visitType} onChange={setVisitType} compact />
              <div className="form-actions">
                <Link className="button compact" href={`/patients/${resolved.patientId}`}>Open file</Link>
                <button className="button secondary compact" type="button" onClick={() => void checkIn()} disabled={!visitType}>Check in / Add to queue</button>
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </AppShell>
  );
}
