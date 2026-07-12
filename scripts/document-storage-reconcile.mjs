import { PrismaClient } from '@prisma/client';
import { createDecipheriv, createHash, randomUUID } from 'node:crypto';
import { access, mkdir, readdir, readFile, rename } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const allowed = new Set(['--apply']);
for (const flag of process.argv.slice(2)) if (!allowed.has(flag)) { console.error('Unknown flag.'); process.exit(2); }
const apply = process.argv.includes('--apply');
const root = resolve(process.env.PATIENT_DOCUMENT_STORAGE_ROOT || join(process.cwd(), 'storage', 'patient-documents-secure'));
const prisma = new PrismaClient();
const counts = { oldQuarantine: 0, promotedWithoutRecord: 0, recordsWithoutFile: 0, checksumMismatch: 0, stuckScan: 0, movedToOrphan: 0 };

try {
  if (!process.env.DATABASE_URL) throw new Error('Database configuration is required.');
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const records = await prisma.patientDocument.findMany({
    where: { storageKey: { not: null } },
    select: { id: true, storageKey: true, sha256: true, encryptionKeyId: true, scanStatus: true, scanCompletedAt: true, createdAt: true }
  });
  const known = new Set(records.map(record => record.storageKey).filter(Boolean));
  const quarantine = await safeList(join(root, 'quarantine'));
  const promoted = await safeList(join(root, 'promoted'));
  for (const name of quarantine) {
    const path = join(root, 'quarantine', name); const stat = await import('node:fs/promises').then(fs => fs.stat(path));
    if (stat.mtime < cutoff) { counts.oldQuarantine += 1; if (apply) await orphan(path); }
  }
  for (const name of promoted) {
    const key = `promoted/${name}`;
    if (!known.has(key)) { counts.promotedWithoutRecord += 1; if (apply) await orphan(join(root, key)); }
  }
  for (const record of records) {
    if (!record.storageKey || !(await exists(join(root, record.storageKey)))) { counts.recordsWithoutFile += 1; continue; }
    if (record.scanStatus === 'PENDING' && record.createdAt < cutoff) counts.stuckScan += 1;
    if (record.storageKey.startsWith('promoted/') && record.sha256) {
      try { if (createHash('sha256').update(await decrypt(join(root, record.storageKey), record.encryptionKeyId)).digest('hex') !== record.sha256) counts.checksumMismatch += 1; }
      catch { counts.checksumMismatch += 1; }
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', counts }));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Reconciliation configuration failed.'); process.exitCode = 1;
} finally { await prisma.$disconnect(); }

async function safeList(path) { try { return (await readdir(path)).filter(name => /^[0-9a-f-]+\.pdoc$/i.test(name)); } catch { return []; } }
async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function orphan(path) { const dir = join(root, 'orphan'); await mkdir(dir, { recursive: true }); await rename(path, join(dir, `${randomUUID()}.pdoc`)); counts.movedToOrphan += 1; }
async function decrypt(path, keyId) {
  const envelope = await readFile(path); const currentId = process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY_ID;
  let encoded = process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY;
  if (keyId && keyId !== currentId) encoded = JSON.parse(process.env.PATIENT_DOCUMENT_DECRYPTION_KEYS_JSON || '{}')[keyId];
  const key = Buffer.from(encoded || '', 'base64'); if (key.length !== 32 || envelope.subarray(0, 8).toString('ascii') !== 'PRIJDOC1') throw new Error('integrity');
  const decipher = createDecipheriv('aes-256-gcm', key, envelope.subarray(9, 21)); decipher.setAuthTag(envelope.subarray(21, 37));
  return Buffer.concat([decipher.update(envelope.subarray(37)), decipher.final()]);
}
