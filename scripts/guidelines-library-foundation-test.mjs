import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { BATCH_DOCUMENTS } from "./guidelines-batch-01-manifest.mjs";
import { applyRollback, canPublishProtocol, isDemoOrTestDocument, planBatch, sha256 } from "./guidelines-library-foundation.mjs";

const temp = await mkdtemp(join(tmpdir(), "prij-guidelines-"));
try {
  const pdfRoot = join(temp, "01_PDFs_Ready");
  await mkdir(pdfRoot);
  for (const item of BATCH_DOCUMENTS.filter((d) => !d.fileName.startsWith("09_"))) await writeFile(join(pdfRoot, item.fileName), `%PDF-1.7\n${item.fileName}`);
  const duplicateHash = await sha256(join(pdfRoot, BATCH_DOCUMENTS[0].fileName));
  const dbHashes = new Set([duplicateHash]);
  const fakePrisma = { guidelineDocument: {
    findUnique: async ({ where }) => dbHashes.has(where.fileSha256) ? { id: "existing", title: "existing" } : null,
    findMany: async () => [
      { id: "1", title: "Demo guideline sample", fileName: "demo.txt" },
      { id: "2", title: "NICE real guideline", fileName: "real.pdf" }
    ]
  }};
  const first = await planBatch({ prisma: fakePrisma, inbox: temp });
  assert.equal(first.documents[0].outcome, "DUPLICATE", "SHA-256 duplicate must be detected");
  assert.equal(first.documents.find((d) => d.fileName.startsWith("09_")).outcome, "MISSING_PDF", "missing PDF must be reported");
  assert.deepEqual(first.archiveCandidates.map((d) => d.id), ["1"], "only demo/test records are archived");
  assert.equal(first.documents.find((d) => d.fileName.startsWith("10_")).ingestStatus, "NEEDS_CORRECTION_REVIEW");
  assert.equal(first.documents.find((d) => d.fileName.startsWith("11_")).ingestStatus, "NEEDS_CORRECTION_REVIEW");
  assert.equal(isDemoOrTestDocument({ title: "Clinical guideline", fileName: "real.pdf" }), false);

  const validSource = { fileSha256: "a".repeat(64), localFilePath: "private/a.pdf", documentType: "official_pdf", guidelineStatus: "ACTIVE" };
  const validProtocol = { sourceOrganization: "RCOG", guidelineCode: "GTG-52", sourcePublicationDate: "2026-01-12", sourceVersion: "2026.1", sourceUrl: "https://www.rcog.org.uk/guidance/gtg52", exactPageCitationsJson: [{ pageStart: 4, pageEnd: 5 }], publicationApprovedByUserId: "reviewer", publicationApprovedAt: new Date() };
  assert.equal(canPublishProtocol(validProtocol, validSource), true);
  for (const key of ["sourceOrganization", "guidelineCode", "sourcePublicationDate", "sourceVersion", "sourceUrl", "exactPageCitationsJson", "publicationApprovedByUserId", "publicationApprovedAt"]) assert.equal(canPublishProtocol({ ...validProtocol, [key]: null }, validSource), false, `protocol must block without ${key}`);
  assert.equal(canPublishProtocol(validProtocol, { ...validSource, localFilePath: null }), false, "protocol must block without real PDF");

  for (const item of first.documents.filter((d) => d.hash)) dbHashes.add(item.hash);
  const second = await planBatch({ prisma: fakePrisma, inbox: temp });
  assert.equal(second.documents.filter((d) => d.outcome === "IMPORT").length, 0, "second run must create no duplicates");

  const rollbackFile = join(temp, "private.pdf");
  await writeFile(rollbackFile, "%PDF rollback fixture");
  const rollbackDocuments = [{ id: "batch-1", title: "Batch fixture", guidelineStatus: "NEEDS_REVIEW", ingestStatus: "NEEDS_SUMMARY", localFilePath: rollbackFile, fileSha256: "b".repeat(64), importBatch: "Batch-01" }];
  const rollbackAudits = [];
  const rollbackPrisma = {
    guidelineDocument: { findMany: async () => rollbackDocuments.filter((d) => d.ingestStatus !== "BATCH_ROLLED_BACK") },
    auditLog: { findMany: async () => [{ resourceId: "demo-1" }] },
    $transaction: async (callback) => callback({
      guidelineDocument: {
        update: async ({ where, data }) => Object.assign(rollbackDocuments.find((d) => d.id === where.id), data),
        updateMany: async () => ({ count: 1 })
      },
      auditLog: { create: async ({ data }) => { rollbackAudits.push(data); return data; } }
    })
  };
  const rollback = await applyRollback({ prisma: rollbackPrisma, quarantineRoot: join(temp, "quarantine") });
  assert.equal(rollback.archivedBatchCount, 1, "isolated rollback must soft-archive the batch record");
  assert.equal(rollback.quarantinedFileCount, 1, "isolated rollback must quarantine its PDF");
  assert.equal(rollbackDocuments[0].fileSha256, "b".repeat(64), "rollback must retain SHA-256 history");
  assert.equal(rollbackDocuments[0].localFilePath, null, "rollback must remove the live private path");
  assert.equal((await applyRollback({ prisma: rollbackPrisma, quarantineRoot: join(temp, "quarantine") })).archivedBatchCount, 0, "second rollback must be idempotent");

  const require = createRequire(import.meta.url);
  require("../apps/api/prisma/env.js").loadRootEnv();
  const databaseName = `guidelines_foundation_test_${Date.now()}`;
  const testUrl = new URL(process.env.DATABASE_URL);
  testUrl.pathname = `/${databaseName}`;
  testUrl.searchParams.delete("schema");
  execFileSync("docker", ["exec", "prij-clinic-postgres", "createdb", "-U", "prij_clinic_dev", databaseName], { stdio: "ignore" });
  execFileSync(process.execPath, ["scripts/prisma.cjs", "migrate", "deploy"], { cwd: "apps/api", env: { ...process.env, DATABASE_URL: testUrl.toString() }, stdio: "ignore" });
  const isolatedPrisma = new PrismaClient({ datasources: { db: { url: testUrl.toString() } } });
  try {
    const source = await isolatedPrisma.guidelineSource.create({ data: { name: "Isolated rollback source", organization: "TEST", sourceType: "LICENSED_UPLOAD" } });
    const isolatedFile = join(temp, "isolated-private.pdf");
    await writeFile(isolatedFile, "%PDF isolated rollback database fixture");
    await isolatedPrisma.guidelineDocument.create({ data: { sourceId: source.id, title: "Isolated Batch-01 rollback", specialty: "test", topic: "test", organization: "TEST", documentType: "official_pdf", licenseStatus: "LICENSED_PRIVATE", guidelineStatus: "NEEDS_REVIEW", fileSha256: "c".repeat(64), localFilePath: isolatedFile, importBatch: "Batch-01" } });
    const publicationSource = await isolatedPrisma.guidelineDocument.create({ data: { sourceId: source.id, title: "Isolated publication source", specialty: "test", topic: "test", organization: "TEST", documentType: "official_pdf", licenseStatus: "LICENSED_PRIVATE", guidelineStatus: "ACTIVE", versionLabel: "2026.1", fileSha256: "d".repeat(64), localFilePath: isolatedFile } });
    const validPublished = await isolatedPrisma.clinicalProtocol.create({ data: { code: "ISOLATED_VALID_PUBLISHED", title: "Isolated valid published protocol", specialtyGroup: "test", condition: "test", aliases: [], implementationStatus: "verified", publicationState: "PUBLISHED", sourceName: "Test source", sourceOrganization: "Test Organization", guidelineCode: "TEST-2026-1", sourcePublicationDate: new Date("2026-01-02"), sourceVersion: "2026.1", sourceUrl: "https://example.test/guideline/2026-1", sourceDocumentId: publicationSource.id, exactPageCitationsJson: [{ pageStart: 1, pageEnd: 2 }], publicationApprovedByUserId: "00000000-0000-0000-0000-000000000001", publicationApprovedAt: new Date(), contentJson: { summary: "Doctor review required.", verifiedManagementAvailable: true, options: ["Doctor review required before use."] } } });
    assert.equal(validPublished.publicationState, "PUBLISHED", "valid evidence-backed publication must succeed in the database");
    await assert.rejects(() => isolatedPrisma.clinicalProtocol.create({ data: { code: "ISOLATED_INVALID_PUBLISHED", title: "Isolated invalid published protocol", specialtyGroup: "test", condition: "test", aliases: [], implementationStatus: "verified", publicationState: "PUBLISHED", sourceName: "Test source", contentJson: {} } }), /structured provenance|publication requires/i, "database must block publication without evidence");
    const isolatedResult = await applyRollback({ prisma: isolatedPrisma, quarantineRoot: join(temp, "isolated-quarantine") });
    assert.equal(isolatedResult.archivedBatchCount, 1, "isolated database rollback must archive Batch-01");
    assert.equal(await isolatedPrisma.guidelineDocument.count({ where: { ingestStatus: "BATCH_ROLLED_BACK", localFilePath: null } }), 1, "isolated database must retain rolled-back history without a live path");
    assert.equal(await isolatedPrisma.auditLog.count({ where: { action: "guideline.batch_rollback_archived" } }), 1, "isolated database rollback must audit the change");
  } finally {
    await isolatedPrisma.$disconnect();
    execFileSync("docker", ["exec", "prij-clinic-postgres", "dropdb", "-U", "prij_clinic_dev", "--force", databaseName], { stdio: "ignore" });
  }

  const protocolService = await readFile("apps/api/src/protocol-atlas/protocol-atlas.service.ts", "utf8");
  const guidelineService = await readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8");
  const migration = await readFile("apps/api/prisma/migrations/20260722143000_guideline_governance_corrections/migration.sql", "utf8");
  assert(protocolService.includes('implementationStatus: "verified", publicationState: "PUBLISHED"'), "normal protocol results must be publication-gated");
  assert(protocolService.includes("reviewQueue(user: AuthUser)"), "legacy protocol review queue must exist");
  assert(guidelineService.includes('guidelineStatus: "ACTIVE"') && guidelineService.includes('documentType: "official_pdf"'), "Doctor guideline visibility must require canonical PDFs");
  assert(migration.includes("enforce_protocol_publication_governance") && migration.includes("sourcePublicationDate") && migration.includes("exactPageCitationsJson"), "database publication governance must require structured evidence");
  const backupNames = await readdir("backups");
  assert(backupNames.some((name) => /^prij-clinic-local-20260722-\d{6}\.backup\.sql$/.test(name)), "post-correction backup must exist");
  const trackedPrivateFiles = execFileSync("git", ["ls-files", "*.pdf", "*.zip", "*.rar", "*.url"], { encoding: "utf8" }).trim();
  assert.equal(trackedPrivateFiles, "", "PDF/ZIP/RAR/URL files must not be tracked by Git");
  console.log("Guidelines foundation PASS duplicate archive missing-PDF correction-review publication-blocking valid-publication-contract rollback-dry-run rollback-isolated-apply second-run-idempotency doctor-visibility backup-created no-private-files-tracked");
} finally { await rm(temp, { recursive: true, force: true }); }
