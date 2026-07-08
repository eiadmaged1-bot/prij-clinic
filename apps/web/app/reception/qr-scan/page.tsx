"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { useI18n } from "@/i18n/useI18n";
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
      headers: { "content-type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify({ patientId: resolved.patientId, priority: visitType === "urgent_kashf" ? "priority" : "routine", visitType })
    }).catch(() => null);
    setStatus(response?.ok ? copy.patientAddedToQueue : copy.couldNotAddToQueue);
    if (response?.ok) await loadQueue();
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
    eyebrow: "الاستقبال",
    title: "تسجيل الحضور بالـ QR",
    reception: "الاستقبال",
    queue: "قائمة الانتظار",
    permanentPatientQr: "QR دائم للمريضة",
    startCameraScan: "بدء مسح الكاميرا",
    requestingCamera: "جار طلب إذن الكاميرا",
    cameraActive: "ماسح الكاميرا يعمل",
    qrSafety: "يجب ألا يحتوي QR على بيانات طبية حساسة. البحث اليدوي متاح دائما.",
    manualLookup: "البحث اليدوي",
    lookupLabel: "QR أو رقم الملف أو الهاتف أو الاسم",
    lookupPlaceholder: "QR أو رقم الملف أو الهاتف أو الاسم",
    findPatient: "البحث عن المريضة",
    qrScanned: "تم مسح QR. جار البحث عن المريضة.",
    resolvingPatient: "جار البحث عن المريضة.",
    signInRequired: "يرجى تسجيل الدخول قبل مسح QR.",
    noPatientFound: "لم يتم العثور على مريضة. جرب QR أو رقم الملف أو الهاتف أو الاسم.",
    patientFound: "تم العثور على المريضة. أكد الإجراء التالي.",
    patientFoundTitle: "تم العثور على المريضة",
    fileNumber: "رقم الملف",
    phone: "الهاتف",
    phoneHidden: "لا يوجد رقم هاتف",
    status: "الحالة",
    queueStatus: "حالة الانتظار",
    alreadyInQueue: "موجودة بالفعل في الانتظار",
    notInQueue: "غير موجودة في الانتظار",
    selectVisitTypeFirst: "اختر نوع الزيارة أولا",
    addingToQueue: "جار الإضافة للانتظار",
    patientAddedToQueue: "تمت إضافة المريضة إلى انتظار اليوم.",
    couldNotAddToQueue: "تعذرت الإضافة للانتظار. تحقق من الصلاحيات.",
    openReceptionProfile: "فتح ملف الاستقبال",
    openQueue: "فتح الانتظار",
    addToQueue: "إضافة لانتظار اليوم",
    permissionDenied: "تم رفض إذن الكاميرا",
    browserUnsupported: "المتصفح لا يدعم المسح بالكاميرا. استخدم البحث اليدوي.",
    decoderUnsupported: "قراءة QR التلقائية غير متاحة. استخدم البحث اليدوي.",
    cameraAlreadyInUse: "الكاميرا مستخدمة حاليا. استخدم البحث اليدوي.",
    noCameraFound: "لا توجد كاميرا. استخدم البحث اليدوي.",
    cameraUnavailable: "الكاميرا غير متاحة. استخدم البحث اليدوي."
  }
} as const;
