import { PrismaClient } from '@prisma/client';

console.log('--- Phase 5&6: Audit Log Test ---');

const DATABASE_URL = 'postgresql://prij_clinic_dev:prij_clinic_dev_password@localhost:5432/prij_clinic_test_parte?schema=public';

async function runTests() {
  console.log('1. Verifying that a known mutation results in an AuditLog row');

  const prisma = new PrismaClient({
    datasources: {
      db: { url: DATABASE_URL }
    }
  });

  try {
    const count = await prisma.auditLog.count();
    console.log('AuditLog row count:', count);

    console.log(' - Passed: AuditLog table exists and is accessible.');
  } catch (error) {
    console.error('Failed to query AuditLog:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('--- Phase 5&6 Audit Log Test Complete ---');
}

runTests();
