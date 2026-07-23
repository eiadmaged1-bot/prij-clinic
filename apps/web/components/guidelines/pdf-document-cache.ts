import type { PDFDocumentProxy } from "pdfjs-dist";

type PdfJs = typeof import("pdfjs-dist");
type CacheEntry = {
  controller: AbortController;
  promise: Promise<PDFDocumentProxy>;
  refs: number;
  document?: PDFDocumentProxy;
  disposeTimer?: ReturnType<typeof setTimeout>;
};

const documents = new Map<string, CacheEntry>();
let pdfJsPromise: Promise<PdfJs> | null = null;

export async function acquirePdfDocument(url: string, token?: string | null) {
  const key = `${url}\u0000${token ?? ""}`;
  let entry = documents.get(key);
  if (!entry) {
    const controller = new AbortController();
    entry = {
      controller,
      refs: 0,
      promise: loadPdfDocument(url, token, controller.signal)
    };
    documents.set(key, entry);
    entry.promise
      .then((document) => { entry!.document = document; })
      .catch(() => { if (documents.get(key) === entry) documents.delete(key); });
  }
  if (entry.disposeTimer) clearTimeout(entry.disposeTimer);
  entry.refs += 1;
  const document = await entry.promise;
  let released = false;
  return {
    document,
    release() {
      if (released) return;
      released = true;
      entry!.refs = Math.max(0, entry!.refs - 1);
      if (entry!.refs) return;
      entry!.disposeTimer = setTimeout(() => {
        if (entry!.refs || documents.get(key) !== entry) return;
        documents.delete(key);
        entry!.controller.abort();
        void entry!.document?.destroy();
      }, 15_000);
    }
  };
}

export function loadPdfJs() {
  if (!pdfJsPromise) {
    const moduleUrl = "/api/pdfjs/pdf.mjs";
    pdfJsPromise = import(/* webpackIgnore: true */ moduleUrl).then((pdfjs: PdfJs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/api/pdfjs/pdf.worker.mjs";
      return pdfjs;
    });
  }
  return pdfJsPromise;
}

async function loadPdfDocument(url: string, token: string | null | undefined, signal: AbortSignal) {
  const bytes = await fetchPdfWithBackoff(url, token, signal);
  const pdfjs = await loadPdfJs();
  return pdfjs.getDocument({ data: bytes }).promise;
}

async function fetchPdfWithBackoff(url: string, token: string | null | undefined, signal: AbortSignal) {
  const delays = [0, 400, 900];
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    if (delays[attempt]) await abortableDelay(delays[attempt]!, signal);
    const response = await fetch(url, {
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      signal
    });
    if (response.ok) return new Uint8Array(await response.arrayBuffer());
    if (response.status !== 429 || attempt === delays.length - 1) {
      throw new Error(response.status === 429 ? "pdf_rate_limited" : "pdf_unavailable");
    }
  }
  throw new Error("pdf_unavailable");
}

function abortableDelay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}
