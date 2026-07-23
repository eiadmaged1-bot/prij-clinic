import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { BATCH_DOCUMENTS, BATCH_ID } from "./guidelines-batch-01-manifest.mjs";

export const APPLY_CONFIRMATION = "IMPORT_GUIDELINES_BATCH_01";
export const ROLLBACK_CONFIRMATION = "ROLLBACK_GUIDELINES_BATCH_01";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

export function canPublishProtocol(protocol, sourceDocument) {
  return Boolean(sourceDocument?.fileSha256 && sourceDocument?.localFilePath && sourceDocument?.documentType === "official_pdf"
    && sourceDocument?.guidelineStatus === "ACTIVE"
    && protocol?.sourceOrganization?.trim() && protocol?.guidelineCode?.trim() && protocol?.sourcePublicationDate
    && (protocol?.sourceVersion?.trim() || protocol?.sourceEdition?.trim())
    && !/^(unknown|current|latest|draft|n\/a)$/i.test(protocol?.sourceVersion?.trim() || protocol?.sourceEdition?.trim())
    && (protocol?.sourceUrl?.trim() || (protocol?.provenanceNote?.trim().length ?? 0) >= 20)
    && Array.isArray(protocol?.exactPageCitationsJson)
    && protocol.exactPageCitationsJson.length && protocol?.publicationApprovedByUserId && protocol?.publicationApprovedAt);
}

export async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

export function isDemoOrTestDocument(document) {
  return /\b(demo|test|qa)\b/i.test(document.title) || /^demo[-_]/i.test(document.fileName || "");
}

export async function planBatch({ prisma, inbox }) {
  const prepared = [];
  const seen = new Set();
  for (const item of BATCH_DOCUMENTS) {
    const sourcePath = join(inbox, "01_PDFs_Ready", item.fileName);
    let size = null;
    try { size = (await stat(sourcePath)).size; } catch {}
    if (!size) { prepared.push({ ...item, sourcePath, outcome: "MISSING_PDF" }); continue; }
    const hash = await sha256(sourcePath);
    const duplicateInBatch = seen.has(hash);
    seen.add(hash);
    const existing = await prisma.guidelineDocument.findUnique({ where: { fileSha256: hash }, select: { id: true, title: true } });
    prepared.push({ ...item, sourcePath, hash, size, outcome: duplicateInBatch || existing ? "DUPLICATE" : item.ingestStatus === "PENDING_SOURCE_PDF" ? "PENDING_SOURCE_PDF" : "IMPORT", existing });
  }
  const archiveCandidates = await prisma.guidelineDocument.findMany({
    where: { guidelineStatus: { not: "ARCHIVED" } }, select: { id: true, title: true, fileName: true }
  });
  return { documents: prepared, archiveCandidates: archiveCandidates.filter(isDemoOrTestDocument) };
}

export async function applyBatch({ prisma, inbox, storageRoot }) {
  const plan = await planBatch({ prisma, inbox });
  const toImport = plan.documents.filter((d) => d.outcome === "IMPORT");
  const pendingSources = plan.documents.filter((d) => d.outcome === "PENDING_SOURCE_PDF");
  const staged = [];
  await mkdir(storageRoot, { recursive: true });
  try {
    for (const item of toImport) {
      const temp = join(storageRoot, `.${item.hash}.tmp`);
      const final = join(storageRoot, `${item.hash}.pdf`);
      await copyFile(item.sourcePath, temp);
      await rename(temp, final);
      staged.push({ temp, final });
    }
    const result = await prisma.$transaction(async (tx) => {
      const sourceIds = new Map();
      for (const organization of [...new Set([...toImport, ...pendingSources].map((d) => d.organization))]) {
        const source = await tx.guidelineSource.upsert({ where: { name: organization }, update: {}, create: {
          name: organization, abbreviation: organization, organization, sourceType: "LICENSED_UPLOAD",
          defaultAccessLevel: "OWNER_DOCTOR", notes: `${BATCH_ID} private source; governance review required.`
        }});
        sourceIds.set(organization, source.id);
      }
      const now = new Date();
      if (plan.archiveCandidates.length) {
        await tx.guidelineDocument.updateMany({ where: { id: { in: plan.archiveCandidates.map((d) => d.id) } }, data: { guidelineStatus: "ARCHIVED", archivedAt: now, reviewStatus: "archived_demo_or_test" } });
        await tx.auditLog.createMany({ data: plan.archiveCandidates.map((d) => ({ action: "guideline.demo_archived", resourceType: "GuidelineDocument", resourceId: d.id, severity: "medium", reason: `${BATCH_ID} cleanup; retained for audit/history`, metadataJson: { title: d.title, batch: BATCH_ID } })) });
      }
      const imported = [];
      for (const item of pendingSources) {
        const existing = await tx.guidelineDocument.findFirst({ where: { importBatch: BATCH_ID, title: item.title } });
        if (existing) continue;
        const document = await tx.guidelineDocument.create({ data: {
          sourceId: sourceIds.get(item.organization), title: item.title, specialty: item.specialty, topic: item.topic,
          organization: item.organization, versionLabel: item.versionLabel, guidelineStatus: "NEEDS_REVIEW",
          documentType: "source_pending", licenseStatus: "CHECK_REQUIRED", accessLevel: "OWNER_DOCTOR",
          downloadsAllowed: false, ingestStatus: "PENDING_SOURCE_PDF", importBatch: BATCH_ID, reviewStatus: "PENDING_SOURCE_PDF"
        }});
        await tx.guidelineImportJob.create({ data: { jobType: "PRIVATE_UPLOAD", status: "NEEDS_REVIEW", sourceId: document.sourceId, documentId: document.id, importType: "source_pending", inputFileName: item.fileName, summary: `${BATCH_ID}: source PDF not accepted`, resultJson: { ingestStatus: "PENDING_SOURCE_PDF" } } });
        await tx.auditLog.create({ data: { action: "guideline.source_pdf_pending", resourceType: "GuidelineDocument", resourceId: document.id, severity: "medium", reason: `${BATCH_ID} source PDF pending`, metadataJson: { batch: BATCH_ID, ingestStatus: "PENDING_SOURCE_PDF" } } });
      }
      for (const item of toImport) {
        const storagePath = join(storageRoot, `${item.hash}.pdf`);
        const document = await tx.guidelineDocument.create({ data: {
          sourceId: sourceIds.get(item.organization), title: item.title, specialty: item.specialty, topic: item.topic,
          organization: item.organization, versionLabel: item.versionLabel, guidelineStatus: "NEEDS_REVIEW",
          documentType: "official_pdf", licenseStatus: "LICENSED_PRIVATE", localFilePath: storagePath,
          storageRef: `private-guidelines/${item.hash}.pdf`, fileName: basename(storagePath), fileMimeType: "application/pdf",
          fileSha256: item.hash, accessLevel: "OWNER_DOCTOR", downloadsAllowed: false, ingestStatus: item.ingestStatus,
          importBatch: BATCH_ID, reviewStatus: item.ingestStatus
        }});
        await tx.guidelineVersion.create({ data: { documentId: document.id, versionLabel: item.versionLabel, status: "NEEDS_REVIEW", fileSha256: item.hash } });
        await tx.guidelineImportJob.create({ data: { jobType: "PRIVATE_UPLOAD", status: "SUCCEEDED", sourceId: document.sourceId, documentId: document.id, importType: "official_pdf", inputFileName: item.fileName, summary: `${BATCH_ID}: ${item.ingestStatus}`, resultJson: { sha256: item.hash, ingestStatus: item.ingestStatus } } });
        await tx.auditLog.create({ data: { action: "guideline.batch_imported", resourceType: "GuidelineDocument", resourceId: document.id, severity: "medium", reason: `${BATCH_ID} controlled private import`, metadataJson: { batch: BATCH_ID, sha256: item.hash, ingestStatus: item.ingestStatus } } });
        imported.push(document.id);
      }
      return { imported: imported.length, archived: plan.archiveCandidates.length };
    }, { timeout: 30000 });
    return { ...plan, ...result };
  } catch (error) {
    await Promise.all(staged.flatMap(({ temp, final }) => [rm(temp, { force: true }), rm(final, { force: true })]));
    throw error;
  }
}

export async function planRollback({ prisma }) {
  const batchDocuments = await prisma.guidelineDocument.findMany({ where: { importBatch: BATCH_ID, ingestStatus: { not: "BATCH_ROLLED_BACK" } }, select: { id: true, title: true, guidelineStatus: true, ingestStatus: true, localFilePath: true, fileSha256: true } });
  const archiveAudits = await prisma.auditLog.findMany({ where: { action: "guideline.demo_archived", reason: { contains: BATCH_ID } }, select: { resourceId: true } });
  return { batchDocuments, restorableDemoIds: archiveAudits.map((entry) => entry.resourceId).filter(Boolean) };
}

export async function applyRollback({ prisma, quarantineRoot, restoreDemo = false }) {
  const plan = await planRollback({ prisma });
  await mkdir(quarantineRoot, { recursive: true });
  const moved = [];
  try {
    for (const document of plan.batchDocuments) {
      if (!document.localFilePath || !document.fileSha256) continue;
      const destination = join(quarantineRoot, `${document.fileSha256}.pdf`);
      try {
        await rename(document.localFilePath, destination);
        moved.push({ source: document.localFilePath, destination });
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      for (const document of plan.batchDocuments) {
        await tx.guidelineDocument.update({ where: { id: document.id }, data: { guidelineStatus: "ARCHIVED", archivedAt: now, ingestStatus: "BATCH_ROLLED_BACK", reviewStatus: "BATCH_ROLLED_BACK", localFilePath: null, storageRef: null } });
        await tx.auditLog.create({ data: { action: "guideline.batch_rollback_archived", resourceType: "GuidelineDocument", resourceId: document.id, severity: "high", reason: `${BATCH_ID} explicit rollback; source hash retained and file quarantined`, metadataJson: { batch: BATCH_ID, sha256: document.fileSha256, previousStatus: document.guidelineStatus } } });
      }
      let restoredDemoCount = 0;
      if (restoreDemo && plan.restorableDemoIds.length) {
        const restored = await tx.guidelineDocument.updateMany({ where: { id: { in: plan.restorableDemoIds }, guidelineStatus: "ARCHIVED", reviewStatus: "archived_demo_or_test" }, data: { guidelineStatus: "NEEDS_REVIEW", archivedAt: null, reviewStatus: "restored_demo_test_nonclinical" } });
        restoredDemoCount = restored.count;
        await tx.auditLog.create({ data: { action: "guideline.demo_restore_requested", resourceType: "GuidelineDocument", severity: "high", reason: `${BATCH_ID} rollback explicitly requested demo/test restoration`, metadataJson: { batch: BATCH_ID, restoredCount: restoredDemoCount } } });
      }
      return { archivedBatchCount: plan.batchDocuments.length, quarantinedFileCount: moved.length, restoredDemoCount };
    }, { timeout: 30000 });
    return { ...plan, ...result };
  } catch (error) {
    for (const file of moved.reverse()) await rename(file.destination, file.source).catch(() => undefined);
    throw error;
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const rollback = process.argv.includes("--rollback");
  const confirmAt = process.argv.indexOf("--confirm");
  const expectedConfirmation = rollback ? ROLLBACK_CONFIRMATION : APPLY_CONFIRMATION;
  if (apply && process.argv[confirmAt + 1] !== expectedConfirmation) throw new Error(`Apply requires --confirm ${expectedConfirmation}`);
  const inboxAt = process.argv.indexOf("--inbox");
  const inbox = resolve(inboxAt >= 0 ? process.argv[inboxAt + 1] : "C:/Newfolder/prij-guidelines-inbox/Batch-01");
  const storageRoot = join(root, "storage", "guidelines", "private", BATCH_ID.toLowerCase());
  const prisma = new PrismaClient();
  try {
    if (rollback) {
      const result = apply ? await applyRollback({ prisma, quarantineRoot: join(root, "storage", "guidelines", "rollback-quarantine", BATCH_ID.toLowerCase()), restoreDemo: process.argv.includes("--restore-demo") }) : await planRollback({ prisma });
      console.log(JSON.stringify({ mode: apply ? "rollback-apply" : "rollback-dry-run", batch: BATCH_ID, batchRecordCount: result.batchDocuments.length, fileCount: result.batchDocuments.filter((d) => d.localFilePath).length, restorableDemoCount: result.restorableDemoIds.length, archivedBatchCount: result.archivedBatchCount || 0, restoredDemoCount: result.restoredDemoCount || 0 }, null, 2));
      return;
    }
    const result = apply ? await applyBatch({ prisma, inbox, storageRoot }) : await planBatch({ prisma, inbox });
    const duplicate = result.documents.filter((d) => d.outcome === "DUPLICATE").length;
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", batch: BATCH_ID, archiveCount: result.archiveCandidates.length, importedCount: result.imported || 0, duplicateCount: duplicate, documents: result.documents.map(({ fileName, title, ingestStatus, outcome, hash }) => ({ fileName, title, status: outcome === "IMPORT" && apply ? ingestStatus : outcome, sha256: hash })) }, null, 2));
  } finally { await prisma.$disconnect(); }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
