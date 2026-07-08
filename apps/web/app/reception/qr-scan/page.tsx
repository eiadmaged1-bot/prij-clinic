"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { getApiBaseUrl } from "@/lib/api-base-url";
import type { VisitTypeValue } from "@/lib/visit-types";
import { AppShell, SafetyAlert } from "../../mvp-page";

type ResolvedPatient = {
  patientId: string;
  displayName: string;
  medicalRecordNumber?: string | null;
  phone?: string | null;
  status?: string | null;
  lastVisitAt?: string | null;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

export default function ReceptionQrScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualId, setManualId] = useState("");
  const [resolved, setResolved] = useState<ResolvedPatient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("Manual lookup ready");
  const [scannerStatus, setScannerStatus] = useState("Camera scanner optional");
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const resolvePatient = useCallback(async (rawValue: string, source: "scan" | "manual") => {
    const lookup = rawValue.trim();
    if (!lookup) return;
    setManualId(lookup);
    setStatus(source === "scan" ? "QR scanned. Resolving patient." : "Resolving patient.");
    const response = await fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(lookup)}/qr`, {
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
      setStatus("No patient found. Try QR token, MRN/file number, phone, or name.");
      return;
    }
    setResolved(await response.json() as ResolvedPatient);
    setStatus("Patient found. Confirm next action.");
  }, [headers]);

  async function startCameraScan() {
    const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setScannerStatus("Camera scanning is unavailable. Use manual lookup below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });
      setScannerStatus("Camera scanner active");
      const scanOnce = async () => {
        if (resolved) return;
        const codes = videoRef.current ? await detector.detect(videoRef.current).catch(() => []) : [];
        const value = codes[0]?.rawValue;
        if (value) await resolvePatient(value, "scan");
        else window.setTimeout(scanOnce, 400);
      };
      void scanOnce();
    } catch {
      setScannerStatus("Camera permission or HTTPS is required. Use manual lookup below.");
    }
  }

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
    setStatus(response?.ok ? "Patient added to today's queue." : "Could not add to queue. Check your role.");
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Reception</p>
            <h1>Patient QR Check-in</h1>
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
            <h2>Permanent Patient QR</h2>
            <span className="badge">{scannerStatus}</span>
          </div>
          <button className="button" type="button" onClick={() => void startCameraScan()}>
            <ThreeDMedicalIcon name="search" size="sm" />
            Start camera scan
          </button>
          <video className="qr-video" ref={videoRef} muted playsInline />
          <p className="muted">QR must not contain sensitive medical data. Camera scanning needs HTTPS and browser support.</p>
        </article>
        <article className="panel compact-panel">
          <div className="section-heading">
            <h2>Manual fallback</h2>
            <span className="badge">{status}</span>
          </div>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void resolvePatient(manualId, "manual"); }}>
            <label>
              QR token, MRN/file number, phone, or name
              <input value={manualId} onChange={(event) => setManualId(event.target.value)} placeholder="QR token, MRN, phone, or name" />
            </label>
            <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />Resolve patient</button>
          </form>
          {resolved ? (
            <div className="selected-patient-card">
              <strong>{resolved.displayName || "Patient found"}</strong>
              <span>MRN {resolved.medicalRecordNumber ?? "not shown"} · {resolved.phone ? `Phone ${resolved.phone}` : "Phone hidden/not saved"} · status {resolved.status ?? "active"} · last visit {resolved.lastVisitAt ? resolved.lastVisitAt.slice(0, 10) : "not recorded"}</span>
              <VisitTypeSelector value={visitType} onChange={setVisitType} compact />
              <div className="form-actions">
                <button className="button secondary compact" type="button" onClick={() => void checkIn()} disabled={!visitType}>Add to today&apos;s queue</button>
                <Link className="button compact" href={`/patients/${resolved.patientId}`}>Open file</Link>
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </AppShell>
  );
}
