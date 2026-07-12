import { PrismaClient } from '@prisma/client';

const LOST_COLUMNS = {
  GuidelineChunk: ['reviewStatus'],
  GuidelineDocument: ['archivedAt', 'citationLabel', 'documentType', 'reviewStatus'],
  GuidelineImportJob: ['createdByUserId', 'importType', 'summary'],
  GuidelineQueryLog: ['actorUserId', 'mode', 'queryText'],
  GuidelineReviewDecision: ['reviewerUserId'],
  GuidelineSection: ['reviewStatus', 'sortOrder'],
  GuidelineSource: ['abbreviation']
};

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--expected-database' || !/^[a-zA-Z0-9_]+$/.test(args[1] ?? '')) {
  console.error('Usage: node scripts/part-h-dev-database-incident-report.mjs --expected-database <database_name>');
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required; configuration is ambiguous.');
  process.exit(2);
}

const expectedDatabase = args[1];
const configured = new URL(process.env.DATABASE_URL);
const configuredDatabase = decodeURIComponent(configured.pathname.replace(/^\//, ''));
if (configuredDatabase !== expectedDatabase) {
  console.error(`Database classification mismatch. Expected ${expectedDatabase}; resolved ${configuredDatabase || 'unknown'}.`);
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  const identity = await prisma.$queryRaw`SELECT current_database() AS database_name, current_schema() AS schema_name`;
  if (identity[0]?.database_name !== expectedDatabase) throw new Error('Connected database identity does not match the expected database.');

  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name LIKE 'Guideline%'
    ORDER BY table_name`;
  const columns = await prisma.$queryRaw`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name LIKE 'Guideline%'
    ORDER BY table_name, ordinal_position`;
  const indexes = await prisma.$queryRaw`
    SELECT tablename AS table_name, indexname AS index_name, indexdef AS definition
    FROM pg_catalog.pg_indexes
    WHERE schemaname = current_schema() AND tablename LIKE 'Guideline%'
    ORDER BY tablename, indexname`;
  const constraints = await prisma.$queryRaw`
    SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
           COALESCE(string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position), '') AS columns
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_schema = tc.constraint_schema AND kcu.constraint_name = tc.constraint_name
    WHERE tc.table_schema = current_schema() AND tc.table_name LIKE 'Guideline%'
    GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
    ORDER BY tc.table_name, tc.constraint_name`;
  const databases = await prisma.$queryRaw`
    SELECT datname AS database_name
    FROM pg_catalog.pg_database
    WHERE datistemplate = false
    ORDER BY datname`;

  const present = new Set(columns.map(row => `${row.table_name}.${row.column_name}`));
  const historicalColumnsMissing = Object.entries(LOST_COLUMNS).flatMap(([table, names]) =>
    names.filter(column => !present.has(`${table}.${column}`)).map(column => ({ table, column }))
  );
  const databaseNames = databases.map(row => row.database_name);
  const classification = expectedDatabase === 'prij_clinic_dev' ? 'persistent development' : expectedDatabase.includes('_test_part_h_') ? 'disposable Part H test' : 'unknown';

  console.log(JSON.stringify({
    databaseName: identity[0].database_name,
    classification,
    schema: identity[0].schema_name,
    hostClassification: ['localhost', '127.0.0.1', '::1'].includes(configured.hostname) ? 'local' : 'remote-or-unknown',
    guidelineTables: tables.map(row => row.table_name),
    guidelineColumns: columns,
    guidelineIndexes: indexes,
    guidelineConstraints: constraints,
    historicalColumnsMissing,
    databaseNames,
    activeNamedDatabasePresent: databaseNames.includes('prij_clinic_active')
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Incident report failed.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
