"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { acquirePdfDocument, loadPdfJs } from "./pdf-document-cache";

type Props = { url: string; page: number; zoom: number; rotation: number; fit: "width" | "page" | "custom"; search: string; token?: string | null; onLoaded: (pages: number) => void; onError: (reason: string) => void; onPageSelect: (page: number) => void; onSearchMatches?: (pages: number[]) => void };

export function PdfCanvasViewer({ url, page, zoom, rotation, fit, search, token, onLoaded, onError, onPageSelect, onSearchMatches }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [thumbnailOpen, setThumbnailOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);
  useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | null = null;
    void acquirePdfDocument(url, token).then((acquired) => {
      release = acquired.release;
      if (cancelled) return acquired.release();
      setPdf(acquired.document); onLoadedRef.current(acquired.document.numPages);
    }).catch((error) => {
      if (!cancelled && !(error instanceof Error && error.name === "AbortError")) onErrorRef.current(friendlyPdfError(error));
    });
    return () => { cancelled = true; release?.(); setPdf(null); };
  }, [token, url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !layerRef.current || !stageRef.current) return;
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;
    void pdf.getPage(Math.min(pdf.numPages, Math.max(1, page))).then(async (pdfPage) => {
      if (cancelled || !canvasRef.current || !layerRef.current || !stageRef.current) return;
      const base = pdfPage.getViewport({ scale: 1, rotation });
      const availableWidth = Math.max(320, stageRef.current.clientWidth - 24);
      const scale = fit === "width" ? availableWidth / base.width : fit === "page" ? Math.min(availableWidth / base.width, 760 / base.height) : zoom / 100;
      const viewport = pdfPage.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      canvas.width = Math.ceil(viewport.width * window.devicePixelRatio); canvas.height = Math.ceil(viewport.height * window.devicePixelRatio);
      canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      const context = canvas.getContext("2d"); if (!context) throw new Error("canvas_unavailable");
      renderTask = pdfPage.render({ canvasContext: context, viewport, transform: window.devicePixelRatio === 1 ? undefined : [window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0] });
      await renderTask.promise;
      if (!cancelled) await renderSelectableText(pdfPage, viewport, layerRef.current!, search);
    }).catch((error) => { if (!(error instanceof Error && error.name === "RenderingCancelledException")) onErrorRef.current(error instanceof Error ? error.message : "pdf_render_failed"); });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [fit, page, pdf, rotation, search, zoom]);

  useEffect(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!pdf || needle.length < 2 || !onSearchMatches) { onSearchMatches?.([]); return; }
    let cancelled = false;
    void (async () => {
      const pages: number[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages && !cancelled; pageNumber += 1) {
        const text = await (await pdf.getPage(pageNumber)).getTextContent();
        const joined = text.items.map((item) => "str" in item ? item.str : "").join(" ").toLocaleLowerCase();
        if (joined.includes(needle)) pages.push(pageNumber);
      }
      if (!cancelled) onSearchMatches(pages);
    })().catch(() => { if (!cancelled) onSearchMatches([]); });
    return () => { cancelled = true; };
  }, [onSearchMatches, pdf, search]);

  return <div className="pdfjs-viewer" ref={stageRef}><div className="pdfjs-page"><canvas ref={canvasRef} aria-label={`Rendered PDF page ${page}`} /><div className="pdfjs-text-layer" ref={layerRef} /></div><details open={thumbnailOpen} onToggle={(event) => setThumbnailOpen(event.currentTarget.open)}><summary>Thumbnails</summary>{thumbnailOpen && pdf ? <div className="pdfjs-thumbnails">{Array.from({ length: pdf.numPages }, (_, index) => <PdfThumbnail key={index + 1} pdf={pdf} page={index + 1} active={page === index + 1} onSelect={onPageSelect} />)}</div> : null}</details></div>;
}

async function renderSelectableText(pdfPage: PDFPageProxy, viewport: ReturnType<PDFPageProxy["getViewport"]>, layer: HTMLDivElement, search: string) {
  const pdfjs = await loadPdfJs();
  const text = await pdfPage.getTextContent();
  layer.replaceChildren(); layer.style.width = `${viewport.width}px`; layer.style.height = `${viewport.height}px`;
  const needle = search.trim().toLocaleLowerCase();
  for (const item of text.items) {
    if (!("str" in item) || !item.str) continue;
    const transform = pdfjs.Util.transform(viewport.transform, item.transform);
    const span = document.createElement("span"); span.textContent = item.str;
    span.style.left = `${transform[4]}px`; span.style.top = `${transform[5] - Math.hypot(transform[2], transform[3])}px`; span.style.fontSize = `${Math.hypot(transform[2], transform[3])}px`;
    if (needle && item.str.toLocaleLowerCase().includes(needle)) span.className = "pdf-search-highlight";
    layer.append(span);
  }
}

function PdfThumbnail({ pdf, page, active, onSelect }: { pdf: PDFDocumentProxy; page: number; active: boolean; onSelect: (page: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { let cancelled = false; let task: { cancel: () => void; promise: Promise<unknown> } | null = null; void pdf.getPage(page).then((pdfPage) => { if (cancelled || !ref.current) return; const viewport = pdfPage.getViewport({ scale: 0.18 }); const canvas = ref.current; canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d"); if (!context) return; task = pdfPage.render({ canvasContext: context, viewport }); return task.promise; }).catch(() => undefined); return () => { cancelled = true; task?.cancel(); }; }, [page, pdf]);
  return <button className={active ? "active" : ""} type="button" onClick={() => onSelect(page)}><canvas ref={ref} aria-hidden="true" /><span>Page {page}</span></button>;
}

function friendlyPdfError(error: unknown) {
  if (error instanceof Error && error.message === "pdf_rate_limited") return "The document server is busy. Please wait a moment or open the original.";
  return "This PDF could not be displayed. You can still open the original document.";
}
