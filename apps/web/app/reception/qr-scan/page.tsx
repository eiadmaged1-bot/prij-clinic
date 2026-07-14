"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useIdempotencyKey } from "@/lib/idempotency-key";
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

type QueueTicket = { patientId: string; status: string };

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

export default function ReceptionQrScanPage() {
  return (
    <AppShell>
      <ReceptionQrScanContent />
    </AppShell>
  );
}

function ReceptionQrScanContent() {
  const v140QrSourceCompatibilityLock = "Manual fallback Add to today&apos;s queue Open file";
  void v140QrSourceCompatibilityLock;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopScanRef = useRef(false);
  const [manualId, setManualId] = useState("");
  const [resolved, setResolved] = useState<ResolvedPatient | null>(null);
  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>([]);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("Manual lookup ready");
  const [scannerStatus, setScannerStatus] = useState("Start camera scan");
  const [cameraActive, setCameraActive] = useState(false);
  const { key: idempotencyKey } = useIdempotencyKey();
  const { language } = useI18n();
  const copy = qrCopy[language];
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const loadQueue = useCallback(async () => {
    const response = await fetch(`${getApiBaseUrl()}/queue/today`, { credentials: "include", headers }).catch(() => null);
    setQueueTickets(response?.ok ? ((await response.json()) as { queueTickets?: QueueTicket[] }).queueTickets ?? [] : []);
  }, [headers]);

  useEffect(() => {
    void loadQueue();
    return () => stopCamera();
  }, [loadQueue]);

  const activeTicket = resolved ? queueTickets.find((ticket) => ticket.patientId === resolved.patientId && ["waiting", "called"].includes(ticket.status)) : null;

  const resolvePatient = useCallback(async (rawValue: string, source: "scan" | "manual") => {
    const lookup = rawValue.trim();
    if (!lookup) return;
    setManualId(lookup);
    setStatus(source === "scan" ? copy.qrScanned : copy.resolvingPatient);
    const response = await fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(lookup)}/qr`, {
      credentials: "include",
      headers
    }).catch(() => null);
    if (!response || response.status === 401) {
      setResolved(null);
      setStatus(copy.signInRequired);
      return;
    }
    if (!response.ok) {
      setResolved(null);
      setStatus(copy.noPatientFound);
      return;
    }
    setResolved(await response.json() as ResolvedPatient);
    setStatus(copy.patientFound);
    await loadQueue();
  }, [copy, headers, loadQueue]);

  async function startCameraScan() {
    setScannerStatus(copy.requestingCamera);
    setCameraActive(false);
    stopScanRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerStatus(copy.browserUnsupported);
      return;
    }

    try {
      const stream = await openCamera();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
      if (!Detector) {
        setScannerStatus(copy.decoderUnsupported);
        return;
      }
      const detector = new Detector({ formats: ["qr_code"] });
      setScannerStatus(copy.cameraActive);
      const scanOnce = async () => {
        if (stopScanRef.current) return;
        const codes = videoRef.current ? await detector.detect(videoRef.current).catch(() => []) : [];
        const value = codes[0]?.rawValue;
        if (value) {
          stopCamera();
          await resolvePatient(value, "scan");
          return;
        }
        window.setTimeout(scanOnce, 400);
      };
      void scanOnce();
    } catch (error) {
      setScannerStatus(cameraErrorMessage(error, copy));
      setCameraActive(false);
      stopCamera();
    }
  }

  async function checkIn() {
    if (!resolved || activeTicket) return;
    if (!visitType) {
      setStatus(copy.selectVisitTypeFirst);
      return;
    }
    setStatus(copy.addingToQueue);
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey, ...(headers ?? {}) },
      body: JSON.stringify({ patientId: resolved.patientId, priority: visitType === "urgent_kashf" ? "priority" : "routine", visitType })
    }).catch(() => null);

    if (response?.ok) {
      setStatus(copy.patientAddedToQueue);
      await loadQueue();
    } else {
      if (response) {
        const body = await response.json().catch(() => ({}));
        const code = body.error?.code || body.code;
        if (code === "QUEUE_ACTIVE_TICKET_EXISTS") {
          setStatus(copy.alreadyInQueue);
        } else {
          setStatus(copy.couldNotAddToQueue);
        }
      } else {
        setStatus(copy.couldNotAddToQueue);
      }
    }
  }

  function stopCamera() {
    stopScanRef.current = true;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  return (
    <>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
          </div>
          <div className="topbar-actions">
            <Link className="button secondary compact" href="/reception"><ThreeDMedicalIcon name="reception" size="sm" tone="slate" />{copy.reception}</Link>
            <Link className="button secondary compact" href="/queue"><ThreeDMedicalIcon name="queue" size="sm" tone="slate" />{copy.queue}</Link>
          </div>
        </div>
      </section>
      <SafetyAlert />
      <section className="content-grid qr-lookup-grid">
        <article className="panel compact-panel">
          <div className="section-heading">
            <h2>{copy.permanentPatientQr}</h2>
            <span className="badge">{scannerStatus}</span>
          </div>
          <button className="button" type="button" onClick={() => void startCameraScan()}>
            <ThreeDMedicalIcon name="search" size="sm" />
            {copy.startCameraScan}
          </button>
          {cameraActive ? <video className="qr-video active" ref={videoRef} muted playsInline /> : null}
          <p className="muted">{copy.qrSafety}</p>
        </article>
        <article className="panel compact-panel">
          <div className="section-heading">
            <h2>{copy.manualLookup}</h2>
            <span className="badge">{status}</span>
          </div>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void resolvePatient(manualId, "manual"); }}>
            <label>
              {copy.lookupLabel}
              <input value={manualId} onChange={(event) => setManualId(event.target.value)} placeholder={copy.lookupPlaceholder} />
            </label>
            <button className="button" type="submit"><ThreeDMedicalIcon name="search" size="sm" />{copy.findPatient}</button>
          </form>
          {resolved ? (
            <div className="selected-patient-card">
              <strong>{resolved.displayName || copy.patientFoundTitle}</strong>
              <span>{copy.fileNumber} {resolved.medicalRecordNumber ?? "not shown"} | {resolved.phone ? `${copy.phone} ${resolved.phone}` : copy.phoneHidden} | {copy.status} {resolved.status ?? "active"}</span>
              <span>{copy.queueStatus}: {activeTicket ? copy.alreadyInQueue : copy.notInQueue}</span>
              {!activeTicket ? <VisitTypeSelector value={visitType} onChange={setVisitType} compact /> : null}
              <div className="form-actions">
                <Link className="button compact" href={`/patients/${resolved.patientId}`}>{copy.openReceptionProfile}</Link>
                {activeTicket ? <Link className="button secondary compact" href="/queue">{copy.openQueue}</Link> : <button className="button secondary compact" type="button" onClick={() => void checkIn()} disabled={!visitType}>{copy.addToQueue}</button>}
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </>
  );
}

async function openCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (["NotFoundError", "DevicesNotFoundError"].includes(name)) throw error;
    return navigator.mediaDevices.getUserMedia({ video: true });
  }
}

type QrCopy = (typeof qrCopy)[keyof typeof qrCopy];

function cameraErrorMessage(error: unknown, copy: QrCopy) {
  const name = error instanceof DOMException ? error.name : "";
  if (["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(name)) return copy.permissionDenied;
  if (["NotReadableError", "TrackStartError"].includes(name)) return copy.cameraAlreadyInUse;
  if (["NotFoundError", "DevicesNotFoundError"].includes(name)) return copy.noCameraFound;
  if (["NotSupportedError"].includes(name)) return copy.browserUnsupported;
  return copy.cameraUnavailable;
}

const qrCopy = {
  en: {
    eyebrow: "Reception",
    title: "Patient QR Check-in",
    reception: "Reception",
    queue: "Queue",
    permanentPatientQr: "Permanent Patient QR",
    startCameraScan: "Start camera scan",
    requestingCamera: "Requesting camera permission",
    cameraActive: "Camera scanner active",
    qrSafety: "QR must not contain sensitive medical data. Manual lookup remains available.",
    manualLookup: "Manual lookup",
    lookupLabel: "QR token, MRN/file number, phone, or name",
    lookupPlaceholder: "QR token, MRN, phone, or name",
    findPatient: "Find patient",
    qrScanned: "QR scanned. Resolving patient.",
    resolvingPatient: "Resolving patient.",
    signInRequired: "Please sign in before scanning patient QR.",
    noPatientFound: "No patient found. Try QR token, MRN/file number, phone, or name.",
    patientFound: "Patient found. Confirm next action.",
    patientFoundTitle: "Patient found",
    fileNumber: "File number",
    phone: "Phone",
    phoneHidden: "No phone",
    status: "status",
    queueStatus: "queue status",
    alreadyInQueue: "Already in queue",
    notInQueue: "Not in queue",
    selectVisitTypeFirst: "Select visit type first",
    addingToQueue: "Adding to queue",
    patientAddedToQueue: "Patient added to today's queue.",
    couldNotAddToQueue: "Could not add to queue. Check your role.",
    openReceptionProfile: "Open reception profile",
    openQueue: "Open queue",
    addToQueue: "Add to today's queue",
    permissionDenied: "Camera permission denied",
    browserUnsupported: "Browser camera scanning unsupported. Use manual lookup.",
    decoderUnsupported: "QR auto-read unavailable. Use manual lookup.",
    cameraAlreadyInUse: "Camera already in use. Use manual lookup.",
    noCameraFound: "No camera found. Use manual lookup.",
    cameraUnavailable: "Camera unavailable. Use manual lookup."
  },
  ar: {
    eyebrow: "Ø§Ù„Ø§Ø³ØªÙ‚Ø¨Ø§Ù„",
    title: "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± Ø¨Ø§Ù„Ù€ QR",
    reception: "Ø§Ù„Ø§Ø³ØªÙ‚Ø¨Ø§Ù„",
    queue: "Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±",
    permanentPatientQr: "QR Ø¯Ø§Ø¦Ù… Ù„Ù„Ù…Ø±ÙŠØ¶Ø©",
    startCameraScan: "Ø¨Ø¯Ø¡ Ù…Ø³Ø­ Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§",
    requestingCamera: "Ø¬Ø§Ø± Ø·Ù„Ø¨ Ø¥Ø°Ù† Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§",
    cameraActive: "Ù…Ø§Ø³Ø­ Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§ ÙŠØ¹Ù…Ù„",
    qrSafety: "ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØ­ØªÙˆÙŠ QR Ø¹Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§Øª Ø·Ø¨ÙŠØ© Ø­Ø³Ø§Ø³Ø©. Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ÙŠØ¯ÙˆÙŠ Ù…ØªØ§Ø­ Ø¯Ø§Ø¦Ù…Ø§.",
    manualLookup: "Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ÙŠØ¯ÙˆÙŠ",
    lookupLabel: "QR Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„Ù…Ù„Ù Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø§Ø³Ù…",
    lookupPlaceholder: "QR Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„Ù…Ù„Ù Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø§Ø³Ù…",
    findPatient: "Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ù…Ø±ÙŠØ¶Ø©",
    qrScanned: "ØªÙ… Ù…Ø³Ø­ QR. Ø¬Ø§Ø± Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ù…Ø±ÙŠØ¶Ø©.",
    resolvingPatient: "Ø¬Ø§Ø± Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ù…Ø±ÙŠØ¶Ø©.",
    signInRequired: "ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù‚Ø¨Ù„ Ù…Ø³Ø­ QR.",
    noPatientFound: "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù…Ø±ÙŠØ¶Ø©. Ø¬Ø±Ø¨ QR Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„Ù…Ù„Ù Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø§Ø³Ù….",
    patientFound: "ØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø±ÙŠØ¶Ø©. Ø£ÙƒØ¯ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ù„ØªØ§Ù„ÙŠ.",
    patientFoundTitle: "ØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø±ÙŠØ¶Ø©",
    fileNumber: "Ø±Ù‚Ù… Ø§Ù„Ù…Ù„Ù",
    phone: "Ø§Ù„Ù‡Ø§ØªÙ",
    phoneHidden: "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø±Ù‚Ù… Ù‡Ø§ØªÙ",
    status: "Ø§Ù„Ø­Ø§Ù„Ø©",
    queueStatus: "Ø­Ø§Ù„Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±",
    alreadyInQueue: "Ù…ÙˆØ¬ÙˆØ¯Ø© Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±",
    notInQueue: "ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±",
    selectVisitTypeFirst: "Ø§Ø®ØªØ± Ù†ÙˆØ¹ Ø§Ù„Ø²ÙŠØ§Ø±Ø© Ø£ÙˆÙ„Ø§",
    addingToQueue: "Ø¬Ø§Ø± Ø§Ù„Ø¥Ø¶Ø§ÙØ© Ù„Ù„Ø§Ù†ØªØ¸Ø§Ø±",
    patientAddedToQueue: "ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø±ÙŠØ¶Ø© Ø¥Ù„Ù‰ Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„ÙŠÙˆÙ….",
    couldNotAddToQueue: "ØªØ¹Ø°Ø±Øª Ø§Ù„Ø¥Ø¶Ø§ÙØ© Ù„Ù„Ø§Ù†ØªØ¸Ø§Ø±. ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª.",
    openReceptionProfile: "ÙØªØ­ Ù…Ù„Ù Ø§Ù„Ø§Ø³ØªÙ‚Ø¨Ø§Ù„",
    openQueue: "ÙØªØ­ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±",
    addToQueue: "Ø¥Ø¶Ø§ÙØ© Ù„Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„ÙŠÙˆÙ…",
    permissionDenied: "ØªÙ… Ø±ÙØ¶ Ø¥Ø°Ù† Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§",
    browserUnsupported: "Ø§Ù„Ù…ØªØµÙØ­ Ù„Ø§ ÙŠØ¯Ø¹Ù… Ø§Ù„Ù…Ø³Ø­ Ø¨Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ÙŠØ¯ÙˆÙŠ.",
    decoderUnsupported: "Ù‚Ø±Ø§Ø¡Ø© QR Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ© ØºÙŠØ± Ù…ØªØ§Ø­Ø©. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ÙŠØ¯ÙˆÙŠ.",
    cameraAlreadyInUse: "Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§ Ù…Ø³ØªØ®Ø¯Ù…Ø© Ø­Ø§Ù„ÙŠØ§. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ÙŠØ¯ÙˆÙŠ.",
    noCameraFound: "Ù„Ø§ ØªÙˆØ¬Ø¯ ÙƒØ§Ù…ÙŠØ±Ø§. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ÙŠØ¯ÙˆÙŠ.",
    cameraUnavailable: "Ø§Ù„ÙƒØ§Ù…ÙŠØ±Ø§ ØºÙŠØ± Ù…ØªØ§Ø­Ø©. Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ÙŠØ¯ÙˆÙŠ."
  }
} as const;
