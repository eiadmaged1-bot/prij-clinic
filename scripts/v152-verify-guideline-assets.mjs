import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const prisma = new PrismaClient();

try {
  const documents = await prisma.guidelineDocument.findMany({
    where: { localFilePath: { not: null } },
    select: { id: true, localFilePath: true, fileMimeType: true, fileSha256: true }
  });
  const results = [];
  for (const document of documents) {
    try {
      const bytes = await readFile(document.localFilePath);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const hashMatches = sha256 === document.fileSha256;
      if (document.fileMimeType === "application/pdf") {
        const pdfHeader = bytes.subarray(0, 5).toString("ascii") === "%PDF-";
        const pdf = await getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
        results.push({ id: document.id, kind: "pdf", bytes: bytes.length, hashMatches, pdfHeader, pages: pdf.numPages, valid: hashMatches && pdfHeader && pdf.numPages > 0 });
        await pdf.destroy();
      } else {
        results.push({ id: document.id, kind: document.fileMimeType ?? "unknown", bytes: bytes.length, hashMatches, valid: hashMatches && bytes.length > 0 });
      }
    } catch (error) {
      results.push({ id: document.id, kind: document.fileMimeType ?? "unknown", valid: false, error: error instanceof Error ? error.message : "unknown error" });
    }
  }
  const summary = { storedAssets: results.length, pdfAssets: results.filter((item) => item.kind === "pdf").length, validAssets: results.filter((item) => item.valid).length, invalidAssets: results.filter((item) => !item.valid).map((item) => item.id), pdfPages: results.filter((item) => item.kind === "pdf").map((item) => ({ id: item.id, pages: item.pages, valid: item.valid })) };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.invalidAssets.length) process.exitCode = 1;
} finally { await prisma.$disconnect(); }
