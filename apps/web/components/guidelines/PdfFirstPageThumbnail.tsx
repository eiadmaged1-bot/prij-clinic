"use client";

import { useEffect, useRef, useState } from "react";
import { acquirePdfDocument } from "./pdf-document-cache";

export function PdfFirstPageThumbnail({ documentId, title }: { documentId: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"waiting" | "loading" | "ready" | "failed">("waiting");
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) setState("loading"); }, { rootMargin: "180px" });
    observer.observe(host); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (state !== "loading" || !canvasRef.current) return;
    let cancelled = false;
    let release: (() => void) | null = null;
    void (async () => {
      const token = sessionStorage.getItem("prijClinicToken");
      const acquired = await acquirePdfDocument(`/api/backend/guidelines/documents/${encodeURIComponent(documentId)}/view?thumbnail=1`, token);
      release = acquired.release;
      const page = await acquired.document.getPage(1); if (cancelled || !canvasRef.current) return;
      const base = page.getViewport({ scale: 1 }); const viewport = page.getViewport({ scale: 420 / base.width });
      const canvas = canvasRef.current; canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d"); if (!context) throw new Error("canvas unavailable");
      await page.render({ canvas, canvasContext: context, viewport }).promise; if (!cancelled) setState("ready");
    })().catch(() => { if (!cancelled) setState("failed"); });
    return () => { cancelled = true; release?.(); };
  }, [documentId, state]);
  const arabic = typeof document !== "undefined" && document.documentElement.lang === "ar";
  return <div className={`guideline-real-thumbnail ${state}`} ref={hostRef}>{state === "loading" ? <span>{arabic ? "جارٍ تحميل المعاينة…" : "Loading preview…"}</span> : null}{state === "failed" ? <span>{arabic ? "المعاينة غير متاحة" : "Preview unavailable"}</span> : null}<canvas ref={canvasRef} aria-label={`First page of ${title}`} /></div>;
}
