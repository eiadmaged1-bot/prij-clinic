import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [viewer, renderer, css, controller, guidelineService, protocolService, protocolPage, aiService] = await Promise.all([
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8"), readFile("apps/web/components/guidelines/PdfCanvasViewer.tsx", "utf8"), readFile("apps/web/app/globals.css", "utf8"), readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"), readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8"), readFile("apps/api/src/protocol-atlas/protocol-atlas.service.ts", "utf8"), readFile("apps/web/app/admin/protocol-atlas/page.tsx", "utf8"), readFile("apps/api/src/ai-drafts/ai-drafts.service.ts", "utf8")
]);

for (const contract of ["getDocument", "GlobalWorkerOptions", "/api/pdfjs/pdf.worker.mjs", "canvas", "getTextContent", "pdf-search-highlight", "PdfThumbnail", "withCredentials"]) assert.match(renderer, new RegExp(contract.replaceAll("/", "\\/").replaceAll(".", "\\.")));
assert.match(viewer, /PDF rendering unavailable — Text fallback mode/); assert.match(viewer, /Retry PDF/); assert.match(viewer, /Open Original/);
assert.match(controller, /accept-ranges["'], ["']bytes/); assert.match(controller, /content-range/); assert.match(controller, /status\(206\)/);
for (const guard of ["assertGuidelineFileSignature", "file signature does not match", "active content or embedded actions", "sanitizeRetrievedEvidence", "untrusted document instruction removed"]) assert.match(guidelineService, new RegExp(guard, "i"));
assert.match(guidelineService, /externalAiAccess: false/); assert.match(guidelineService, /Doctor review required/);
for (const field of ["completionQuestionnaireJson", "completionPercentage", "completionVersion"]) assert.match(protocolService, new RegExp(field));
assert.match(protocolPage, /Protocol Completion Studio/); assert.match(protocolPage, /do not invent medical content/);
assert.match(aiService, /hasPromptInjectionLikeText/); assert.match(aiService, /instructionIgnored: true/); assert.match(aiService, /externalAiAccess: false/);
assert.match(css, /\.pdfjs-text-layer/); assert.match(css, /\.pdfjs-thumbnails/);

console.log("v1.5.0 PDF.js, knowledge retrieval, protocol completion, and prompt-injection regressions PASS");
