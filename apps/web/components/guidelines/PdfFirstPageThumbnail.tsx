"use client";

import { useEffect, useRef, useState } from "react";

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
    let loaded: { destroy: () => Promise<void> } | null = null;
    const moduleUrl = "/api/pdfjs/pdf.mjs";
    void import(/* webpackIgnore: true */ moduleUrl).then(async (pdfjs: typeof import("pdfjs-dist")) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/api/pdfjs/pdf.worker.mjs";
      const token = sessionStorage.getItem("prijClinicToken");
      const pdf = await pdfjs.getDocument({ url: `/api/backend/guidelines/documents/${encodeURIComponent(documentId)}/view?thumbnail=1`, withCredentials: true, httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined }).promise;
      loaded = pdf; const page = await pdf.getPage(1); if (cancelled || !canvasRef.current) return;
      const base = page.getViewport({ scale: 1 }); const viewport = page.getViewport({ scale: 260 / base.width });
      const canvas = canvasRef.current; canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d"); if (!context) throw new Error("canvas unavailable");
      await page.render({ canvasContext: context, viewport }).promise; if (!cancelled) setState("ready");
    }).catch(() => { if (!cancelled) setState("failed"); });
    return () => { cancelled = true; if (loaded) void loaded.destroy(); };
  }, [documentId, state]);
  const arabic = typeof document !== "undefined" && document.documentElement.lang === "ar";
  return <div className={`guideline-real-thumbnail ${state}`} ref={hostRef}>{state === "loading" ? <span>{arabic ? "جارٍ تحميل المعاينة…" : "Loading preview…"}</span> : null}{state === "failed" ? <span>{arabic ? "المعاينة غير متاحة" : "Preview unavailable"}</span> : null}<canvas ref={canvasRef} aria-label={`First page of ${title}`} /></div>;
}
