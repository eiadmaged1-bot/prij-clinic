import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const confirmation = value("--confirm");
if (apply && confirmation !== "INDEX_MISSING_GUIDELINE_PDFS") throw new Error("Apply requires --confirm INDEX_MISSING_GUIDELINE_PDFS");

try {
  const documents = await prisma.guidelineDocument.findMany({
    where: { documentType: "official_pdf", fileSha256: { not: null }, localFilePath: { not: null }, guidelineStatus: { notIn: ["ARCHIVED", "SUPERSEDED"] }, OR: [{ pageCount: null }, { sections: { none: {} } }, { chunks: { none: {} } }] },
    orderBy: { title: "asc" }, select: { id: true, title: true, organization: true, versionLabel: true, localFilePath: true, fileEncrypted: true }
  });
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", documents: documents.map(({ localFilePath: _path, ...document }) => document) }, null, 2));
  if (!apply) process.exit(0);
  for (const document of documents) {
    if (document.fileEncrypted) throw new Error(`${document.id} is encrypted; use the vault decryption service.`);
    const bytes = await readFile(document.localFilePath);
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const content = await (await pdf.getPage(pageNumber)).getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim());
    }
    await pdf.destroy();
    await prisma.$transaction(async (tx) => {
      await tx.guidelineSection.deleteMany({ where: { documentId: document.id } });
      let chunkIndex = 0;
      for (let index = 0; index < pages.length; index += 1) {
        const pageNumber = index + 1; const text = pages[index];
        const section = await tx.guidelineSection.create({ data: { documentId: document.id, heading: `Page ${pageNumber}`, sectionPath: `Page ${pageNumber}`, pageStart: pageNumber, pageEnd: pageNumber, orderIndex: index, sortOrder: index, text } });
        for (const chunk of split(text)) {
          await tx.guidelineChunk.create({ data: { documentId: document.id, sectionId: section.id, chunkIndex, text: chunk, normalizedText: normalize(chunk), tokenEstimate: Math.ceil(chunk.split(/\s+/).length * 1.3), pageStart: pageNumber, pageEnd: pageNumber, citationLabel: `${document.organization}. ${document.title}${document.versionLabel ? ` (${document.versionLabel})` : ""}. Page ${pageNumber}.`, searchVectorText: normalize(chunk) } });
          chunkIndex += 1;
        }
      }
      await tx.guidelineDocument.update({ where: { id: document.id }, data: { pageCount: pages.length } });
      await tx.auditLog.create({ data: { action: "guideline.missing_pdf_indexed", resourceType: "guideline_document", resourceId: document.id, severity: "high", metadataJson: { pageCount: pages.length, chunkCount: chunkIndex, scope: "missing_index_only", externalAiAccess: false } } });
    }, { timeout: 120000 });
    console.log(JSON.stringify({ indexed: document.id, pages: pages.length, textPages: pages.filter(Boolean).length }));
  }
} finally { await prisma.$disconnect(); }

function split(text) { const words = text.split(/\s+/).filter(Boolean); const result = []; for (let index = 0; index < words.length; index += 160) result.push(words.slice(index, index + 180).join(" ")); return result; }
function normalize(text) { return text.toLocaleLowerCase().normalize("NFKC").replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ").replace(/\s+/g, " ").trim(); }
function value(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
