"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PatientPicker, SelectedPatientSummary, type PatientPickerPatient } from "../../../components/clinic/PatientPicker";
import { VisitTypeSelector } from "../../../components/clinic/VisitTypeSelector";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { useIdempotencyKey } from "@/lib/idempotency-key";
import { publishClinicDataChange } from "@/lib/clinic-data-events";
import { formatSafeApiError, readSafeApiError } from "@/lib/safe-api-error";
import type { VisitTypeValue } from "@/lib/visit-types";
import { AppShell, SafetyAlert } from "../../mvp-page";

type CameraCapability = "checking" | "ready" | "insecure" | "unavailable";
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => { detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>> };

export default function ReceptionQrScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopScanRef = useRef(false);
  const [patient, setPatient] = useState<PatientPickerPatient | null>(null);
  const [visitType, setVisitType] = useState<VisitTypeValue | "">("");
  const [status, setStatus] = useState("");
  const [scannerStatus, setScannerStatus] = useState("Checking camera capability");
  const [cameraCapability, setCameraCapability] = useState<CameraCapability>("checking");
  const [cameraActive, setCameraActive] = useState(false);
  const { key: idempotencyKey } = useIdempotencyKey();
  const { language } = useI18n();
  const copy = qrCopy[language];
  const token = useMemo(() => typeof window === "undefined" ? "" : sessionStorage.getItem("prijClinicToken") ?? "", []);
  const headers = useMemo(() => token ? { authorization: `Bearer ${token}` } : undefined, [token]);

  const stopCamera = useCallback(() => {
    stopScanRef.current = true;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!window.isSecureContext) { setCameraCapability("insecure"); setScannerStatus(copy.insecure); }
    else if (!navigator.mediaDevices?.getUserMedia) { setCameraCapability("unavailable"); setScannerStatus(copy.unavailable); }
    else { setCameraCapability("ready"); setScannerStatus(copy.permissionNotRequested); }
    return stopCamera;
  }, [copy, stopCamera]);

  const resolveQr = useCallback(async (rawValue: string) => {
    const lookup = rawValue.trim();
    if (!/^PRIJ-PATIENT:[0-9a-f-]{36}$/i.test(lookup)) { setPatient(null); setStatus(copy.invalidQr); return; }
    setStatus(copy.resolving);
    const response = await fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(lookup)}/qr`, { credentials: "include", headers }).catch(() => null);
    if (!response?.ok) { setPatient(null); setStatus(copy.invalidQr); return; }
    const resolved = await response.json() as { patientId: string; displayName: string; medicalRecordNumber?: string | null; phone?: string | null; status?: string | null };
    const [firstName, ...last] = resolved.displayName.trim().split(/\s+/);
    setPatient({ id: resolved.patientId, firstName, lastName: last.join(" "), medicalRecordNumber: resolved.medicalRecordNumber, phone: resolved.phone, status: resolved.status });
    setStatus(copy.found);
  }, [copy, headers]);

  async function startCameraScan() {
    if (cameraCapability !== "ready") return;
    stopCamera();
    stopScanRef.current = false;
    setScannerStatus(copy.requesting);
    try {
      const stream = await openCamera();
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const detectFrame = await createFrameDecoder(videoRef, canvasRef, () => setScannerStatus(copy.decoderLoading));
      setScannerStatus(copy.scanning);
      const scanOnce = async () => {
        if (stopScanRef.current) return;
        const value = await detectFrame().catch(() => undefined);
        if (value) { stopCamera(); await resolveQr(value); return; }
        window.setTimeout(scanOnce, 350);
      };
      void scanOnce();
    } catch (error) {
      stopCamera();
      setScannerStatus(cameraErrorMessage(error, copy));
    }
  }

  async function checkIn() {
    if (!patient || !visitType) return;
    setStatus(copy.adding);
    const response = await fetch(`${getApiBaseUrl()}/queue/check-in`, {
      method: "POST", credentials: "include",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey, ...(headers ?? {}) },
      body: JSON.stringify({ patientId: patient.id, priority: visitType === "urgent_kashf" ? "priority" : "routine", visitType, checkInMethod: "Permanent QR" })
    }).catch(() => null);
    const body = response ? await response.json().catch(() => null) as { alreadyQueued?: boolean; queueNumber?: number } | null : null;
    if (response?.ok) {
      setStatus(body?.alreadyQueued ? `${copy.already} #${body.queueNumber ?? "—"}` : `${copy.added} #${body?.queueNumber ?? "—"}`);
      publishClinicDataChange(["queue", "patient", "timeline", "owner-operations"], patient.id);
    } else setStatus(formatSafeApiError(await readSafeApiError(response, copy.failed)));
  }

  return <AppShell>
    <section className="page-header"><div className="header-row"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1></div><Link className="button secondary compact" href="/reception/check-in">{copy.back}</Link></div></section>
    <SafetyAlert />
    <section className="content-grid qr-lookup-grid">
      <article className="panel compact-panel">
        <div className="section-heading"><h2>{copy.camera}</h2><span className="badge">{scannerStatus}</span></div>
        <button className="button" type="button" onClick={() => void startCameraScan()} disabled={cameraCapability !== "ready"}>{cameraActive ? copy.scanning : copy.start}</button>
        {cameraCapability === "insecure" ? <p className="notice">{copy.insecure}</p> : null}
        {cameraCapability === "unavailable" ? <p className="notice">{copy.unavailable}</p> : null}
        <video className={`qr-video ${cameraActive ? "active" : ""}`} ref={videoRef} muted playsInline hidden={!cameraActive} />
        <canvas ref={canvasRef} hidden aria-hidden="true" />
        <p className="muted">{copy.safety}</p>
      </article>
      <article className="panel compact-panel">
        <div className="section-heading"><h2>{copy.manual}</h2><span className="badge">{status || copy.manualReady}</span></div>
        <PatientPicker patients={patient ? [patient] : []} selectedPatientId={patient?.id ?? ""} onSelect={(id) => { if (!id) setPatient(null); }} onPatientSelect={(selected) => { setPatient(selected); setStatus(selected ? copy.found : ""); }} required label={copy.select} storageKey="qr-manual-lookup" />
        {patient ? <div className="selected-patient-card"><SelectedPatientSummary patient={patient} /><VisitTypeSelector value={visitType} onChange={setVisitType} compact /><div className="form-actions"><Link className="button secondary compact" href={`/patients/${patient.id}`}>{copy.open}</Link><button className="button" type="button" onClick={() => void checkIn()} disabled={!visitType}>{copy.confirm}</button></div></div> : null}
      </article>
    </section>
  </AppShell>;
}

async function openCamera() {
  try { return await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); }
  catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (["NotFoundError", "DevicesNotFoundError", "NotAllowedError", "PermissionDeniedError"].includes(name)) throw error;
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}

async function createFrameDecoder(videoRef: { current: HTMLVideoElement | null }, canvasRef: { current: HTMLCanvasElement | null }, loading: () => void) {
  const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (Detector) try { const detector = new Detector({ formats: ["qr_code"] }); return async () => (videoRef.current ? (await detector.detect(videoRef.current))[0]?.rawValue : undefined); } catch { /* Safari and partial implementations use jsQR. */ }
  loading();
  const { default: jsQR } = await import("jsqr");
  return async () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return undefined;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true }); if (!context) return undefined;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "attemptBoth" })?.data;
  };
}

type QrCopy = { [K in keyof typeof english]: string };
function cameraErrorMessage(error: unknown, copy: QrCopy) {
  const name = error instanceof DOMException ? error.name : "";
  if (["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(name)) return copy.denied;
  if (["NotFoundError", "DevicesNotFoundError"].includes(name)) return copy.noCamera;
  return copy.scannerFailed;
}

const english = { eyebrow: "Reception", title: "Permanent patient QR", back: "Back to Check-in", camera: "Camera scanner", start: "Start camera scan", scanning: "Scanning", requesting: "Requesting camera permission", permissionNotRequested: "Camera permission not requested", decoderLoading: "Loading QR decoder", insecure: "Camera scanning requires HTTPS. Manual lookup remains available.", unavailable: "Camera unavailable. Use manual lookup.", denied: "Camera permission denied. Retry or use manual lookup.", noCamera: "No rear camera was found. Use manual lookup.", scannerFailed: "Scanner failed. Retry or use manual lookup.", invalidQr: "Invalid patient QR", resolving: "Resolving exact patient", found: "Patient found. Confirm the patient before Check-in.", safety: "The permanent QR contains only an opaque token and no PHI.", manual: "Manual lookup", manualReady: "Manual lookup ready", select: "Select patient", open: "Open patient file", confirm: "Confirm Check-in", adding: "Adding to waiting line", added: "Patient added to waiting line", already: "Patient is already waiting today", failed: "Could not add patient to the waiting line. Retry." } as const;
const qrCopy = { en: english, ar: { ...english, eyebrow: "الاستقبال", title: "رمز QR الدائم للمريضة", back: "العودة لتسجيل الحضور", camera: "ماسح الكاميرا", start: "بدء المسح بالكاميرا", scanning: "جارٍ المسح", requesting: "جارٍ طلب إذن الكاميرا", permissionNotRequested: "لم يتم طلب إذن الكاميرا", decoderLoading: "جارٍ تحميل قارئ QR", insecure: "المسح بالكاميرا يتطلب HTTPS. البحث اليدوي متاح.", unavailable: "الكاميرا غير متاحة. استخدمي البحث اليدوي.", denied: "تم رفض إذن الكاميرا. أعيدي المحاولة أو استخدمي البحث اليدوي.", noCamera: "لم يتم العثور على كاميرا خلفية. استخدمي البحث اليدوي.", scannerFailed: "تعذر المسح. أعيدي المحاولة أو استخدمي البحث اليدوي.", invalidQr: "رمز QR غير صالح", resolving: "جارٍ تحديد المريضة", found: "تم العثور على المريضة. أكدي قبل تسجيل الحضور.", safety: "يحتوي الرمز الدائم على معرف عشوائي فقط ولا يحتوي على بيانات صحية.", manual: "البحث اليدوي", manualReady: "البحث اليدوي جاهز", select: "اختيار المريضة", open: "فتح ملف المريضة", confirm: "تأكيد تسجيل الحضور", adding: "جارٍ الإضافة للانتظار", added: "تمت إضافة المريضة للانتظار", already: "المريضة موجودة بالفعل في انتظار اليوم", failed: "تعذرت إضافة المريضة للانتظار. أعيدي المحاولة." } } as const;
