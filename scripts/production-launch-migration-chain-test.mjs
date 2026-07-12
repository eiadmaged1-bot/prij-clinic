import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const prismaCli = require.resolve('prisma/build/index.js');
const schemaPath = resolve('apps/api/prisma/schema.prisma');

if (process.argv.length !== 2) {
  console.error('This test accepts no command-line flags.');
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(2);
}
const url = new URL(process.env.DATABASE_URL);
const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
const schema = url.searchParams.get('schema') || 'public';
if (!databaseName.includes('_test_part_h_')) {
  console.error(`Refusing migration test for non-Part-H database: ${databaseName || 'unknown'}.`);
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  const identity = await prisma.$queryRaw`SELECT current_database() AS database_name, current_schema() AS schema_name`;
  assert.equal(identity[0]?.database_name, databaseName, 'resolved database must match connected database');
  const existing = await prisma.$queryRaw`
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = ${schema} AND tablename <> '_prisma_migrations'`;
  assert.equal(existing.length, 0, 'migration-chain database must be fresh and empty');

  console.log(`database name: ${databaseName}`);
  console.log(`host classification: ${['localhost', '127.0.0.1', '::1'].includes(url.hostname) ? 'local isolated test host' : 'remote or unknown test host'}`);
  console.log(`schema: ${schema}`);
  console.log('disposable: yes');

  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schemaPath], {
    cwd: tmpdir(), env: process.env, stdio: 'inherit'
  });

  const migrationDirectories = readdirSync('apps/api/prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).length;
  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at, rolled_back_at, logs
    FROM public._prisma_migrations ORDER BY started_at`;
  assert.equal(migrations.length, migrationDirectories, 'every migration directory must be recorded');
  assert.ok(migrations.every(row => row.finished_at && !row.rolled_back_at && !row.logs), 'no migration may be failed or rolled back');

  const requiredTables = ['AuthSession', 'IdempotencyRecord', 'QueueDayCounter', 'ActiveQueueTicketLock', 'PatientDocument'];
  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = ${schema} AND table_name = ANY(${requiredTables})`;
  assert.deepEqual(new Set(tables.map(row => row.table_name)), new Set(requiredTables));
  const documentColumns = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = 'PatientDocument'
      AND column_name = ANY(ARRAY['storageKey','encryptionVersion','scanStatus','quarantineStatus']::text[])`;
  assert.equal(documentColumns.length, 4, 'document-security columns must exist');
  const indexes = await prisma.$queryRaw`
    SELECT indexname FROM pg_catalog.pg_indexes
    WHERE schemaname = ${schema} AND indexname = ANY(ARRAY['Patient_phone_idx','AuditLog_branchId_createdAt_idx']::text[])`;
  assert.deepEqual(new Set(indexes.map(row => row.indexname)), new Set(['Patient_phone_idx', 'AuditLog_branchId_createdAt_idx']));
  assert.ok(!indexes.some(row => row.indexname === 'Appointment_status_startAt_idx'));

  const drift = execFileSync(process.execPath, [prismaCli,
    'migrate', 'diff', '--from-schema-datasource', schemaPath,
    '--to-schema-datamodel', schemaPath, '--exit-code'
  ], { cwd: tmpdir(), env: process.env, encoding: 'utf8' });
  assert.match(drift, /No difference detected/i, 'deployed migration chain must match Prisma schema');
  console.log(JSON.stringify({ migrationCount: migrations.length, result: 'pass' }));
} finally {
  await prisma.$disconnect();
}
