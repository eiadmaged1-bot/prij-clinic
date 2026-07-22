import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const [ui, viewer, thumbnail, service, controller, css] = await Promise.all([
  readFile("apps/web/app/guidelines/RealGuidelinesLibrary.tsx", "utf8"),
  readFile("apps/web/app/guidelines/[id]/page.tsx", "utf8"),
  readFile("apps/web/components/guidelines/PdfFirstPageThumbnail.tsx", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8"),
  readFile("apps/api/src/guidelines/guidelines.controller.ts", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);
assert(ui.includes("/guidelines/documents?limit=50") && !ui.includes("demoDocuments"), "library must use real API records");
assert(service.includes('documentType: "official_pdf"') && service.includes("fileSha256: { not: null }") && service.includes("localFilePath: { not: null }"), "clinical listing must require a real private PDF");
assert(thumbnail.includes("/api/backend/guidelines/documents/") && !thumbnail.includes("localFilePath"), "thumbnail must use protected same-origin streaming");
assert(viewer.includes("onSearchMatches") && viewer.includes("/favorite") && viewer.includes("/open"), "viewer must provide page search, favorites and recent tracking");
assert(controller.includes('Permissions("guidelines.read")') && controller.includes('documents/:id/favorite'), "preference routes must be RBAC protected");
assert(/min-width:\s*2200px/.test(css) && /grid-template-columns:\s*repeat\(4/.test(css) && /grid-template-columns:\s*1fr/.test(css), "responsive 4/3/1 card contracts must exist");
assert(ui.includes("مكتبة الإرشادات") && ui.includes('dir={language === "ar" ? "rtl" : "ltr"}'), "Arabic must be translated and RTL-aware");
assert.equal(execFileSync("git", ["ls-files", "*.pdf", "*.zip", "*.rar", "*.url"], { encoding: "utf8" }).trim(), "", "private document assets must not be tracked");

const prisma = new PrismaClient();
try {
  const realPdfCount = await prisma.guidelineDocument.count({ where: { documentType: "official_pdf", fileSha256: { not: null }, localFilePath: { not: null }, guidelineStatus: { notIn: ["ARCHIVED", "SUPERSEDED"] } } });
  const metadataClinicalCount = await prisma.guidelineDocument.count({ where: { documentType: { not: "official_pdf" }, fileSha256: null, guidelineStatus: "ACTIVE" } });
  const publishedProtocols = await prisma.clinicalProtocol.count({ where: { publicationState: "PUBLISHED", implementationStatus: "verified" } });
  assert.equal(metadataClinicalCount, 0, "metadata-only records cannot remain active clinical records");
  console.log(JSON.stringify({ result: "PASS", realPdfCount, publishedProtocols }));
} finally { await prisma.$disconnect(); }
