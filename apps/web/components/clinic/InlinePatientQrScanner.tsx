"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import { getApiBaseUrl } from "@/lib/api-base-url";
import type { PatientPickerPatient } from "./PatientPicker";

type CameraCapability = "checking" | "ready" | "insecure" | "unavailable";
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => { detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>> };

export function InlinePatientQrScanner({ onPatientResolved }: { onPatientResolved(patient: PatientPickerPatient): void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopScanRef = useRef(false);
  const [cameraCapability, setCameraCapability] = useState<CameraCapability>("checking");
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState("");
  const { language } = useI18n();
  const copy = inlineQrCopy[language];
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
    if (!window.isSecureContext) {
      setCameraCapability("insecure");
      setStatus(copy.insecure);
    } else if (!navigator.mediaDevices?.getUserMedia) {
      setCameraCapability("unavailable");
      setStatus(copy.unavailable);
    } else {
      setCameraCapability("ready");
      setStatus(copy.ready);
    }
    return stopCamera;
  }, [copy, stopCamera]);

  const resolveQr = useCallback(async (rawValue: string) => {
    const lookup = rawValue.trim();
    if (!/^PRIJ-PATIENT:[0-9a-f-]{36}$/i.test(lookup)) {
      setStatus(copy.invalid);
      return;
    }
    setStatus(copy.resolving);
    const response = await fetch(`${getApiBaseUrl()}/patients/${encodeURIComponent(lookup)}/qr`, {
      credentials: "include",
      headers
    }).catch(() => null);
    if (!response?.ok) {
      setStatus(copy.invalid);
      return;
    }
    const resolved = await response.json() as {
      patientId: string;
      displayName: string;
      medicalRecordNumber?: string | null;
      phone?: string | null;
      status?: string | null;
    };
    const [firstName, ...last] = resolved.displayName.trim().split(/\s+/);
    onPatientResolved({
      id: resolved.patientId,
      firstName,
      lastName: last.join(" "),
      medicalRecordNumber: resolved.medicalRecordNumber,
      phone: resolved.phone,
      status: resolved.status
    });
    setStatus(copy.found);
  }, [copy, headers, onPatientResolved]);

  async function startCameraScan() {
    if (cameraCapability !== "ready") return;
    stopCamera();
    stopScanRef.current = false;
    setStatus(copy.requesting);
    try {
      const stream = await openCamera();
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detectFrame = await createFrameDecoder(videoRef, canvasRef, () => setStatus(copy.loading));
      setStatus(copy.scanning);
      const scanOnce = async () => {
        if (stopScanRef.current) return;
        const value = await detectFrame().catch(() => undefined);
        if (value) {
          stopCamera();
          await resolveQr(value);
          return;
        }
        window.setTimeout(scanOnce, 350);
      };
      void scanOnce();
    } catch (error) {
      stopCamera();
      setStatus(cameraErrorMessage(error, copy));
    }
  }

  return (
    <section className="inline-patient-qr-scanner" aria-label={copy.title}>
      <div className="section-heading compact-section-heading">
        <div>
          <h2>{copy.title}</h2>
          <p className="muted">{copy.help}</p>
        </div>
        <span className="badge">{status}</span>
      </div>
      <button className="button" type="button" onClick={() => void startCameraScan()} disabled={cameraCapability !== "ready"}>
        {cameraActive ? copy.scanning : copy.start}
      </button>
      <video className={`qr-video ${cameraActive ? "active" : ""}`} ref={videoRef} muted playsInline hidden={!cameraActive} />
      <canvas ref={canvasRef} hidden aria-hidden="true" />
      {cameraCapability === "insecure" || cameraCapability === "unavailable" ? <p className="notice">{status}</p> : null}
    </section>
  );
}

async function openCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (["NotFoundError", "DevicesNotFoundError", "NotAllowedError", "PermissionDeniedError"].includes(name)) throw error;
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }
}

async function createFrameDecoder(
  videoRef: { current: HTMLVideoElement | null },
  canvasRef: { current: HTMLCanvasElement | null },
  loading: () => void
) {
  const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (Detector) {
    try {
      const detector = new Detector({ formats: ["qr_code"] });
      return async () => videoRef.current ? (await detector.detect(videoRef.current))[0]?.rawValue : undefined;
    } catch {
      // Partial browser implementations fall back to jsQR.
    }
  }
  loading();
  const { default: jsQR } = await import("jsqr");
  return async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return undefined;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return undefined;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "attemptBoth" })?.data;
  };
}

type InlineQrCopy = { [K in keyof typeof english]: string };

function cameraErrorMessage(error: unknown, copy: InlineQrCopy) {
  const name = error instanceof DOMException ? error.name : "";
  if (["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(name)) return copy.denied;
  if (["NotFoundError", "DevicesNotFoundError"].includes(name)) return copy.noCamera;
  return copy.failed;
}

const english = {
  title: "Scan permanent QR",
  help: "Scan here without leaving Check-in.",
  start: "Start camera scan",
  scanning: "Scanning",
  requesting: "Requesting camera permission",
  loading: "Loading QR reader",
  ready: "Ready",
  insecure: "Camera scanning requires HTTPS. Manual patient search remains available below.",
  unavailable: "Camera unavailable. Use manual patient search below.",
  denied: "Camera permission denied. Retry or use manual patient search.",
  noCamera: "No camera was found. Use manual patient search.",
  failed: "Scanner failed. Retry or use manual patient search.",
  invalid: "Invalid patient QR",
  resolving: "Finding patient",
  found: "Patient selected"
} as const;

const inlineQrCopy = {
  en: english,
  ar: {
    ...english,
    title: "مسح رمز المريضة الدائم",
    help: "امسح الرمز هنا دون مغادرة صفحة تسجيل الحضور.",
    start: "بدء المسح بالكاميرا",
    scanning: "جارٍ المسح",
    requesting: "جارٍ طلب إذن الكاميرا",
    loading: "جارٍ تحميل قارئ QR",
    ready: "جاهز",
    insecure: "المسح بالكاميرا يتطلب HTTPS. البحث اليدوي عن المريضة متاح بالأسفل.",
    unavailable: "الكاميرا غير متاحة. استخدمي البحث اليدوي بالأسفل.",
    denied: "تم رفض إذن الكاميرا. أعيدي المحاولة أو استخدمي البحث اليدوي.",
    noCamera: "لم يتم العثور على كاميرا. استخدمي البحث اليدوي.",
    failed: "تعذر المسح. أعيدي المحاولة أو استخدمي البحث اليدوي.",
    invalid: "رمز المريضة غير صالح",
    resolving: "جارٍ تحديد المريضة",
    found: "تم تحديد المريضة"
  }
} as const;
