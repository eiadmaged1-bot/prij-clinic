import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function reportDuplicates() {
  console.log('Finding duplicate queue tickets (same patient, same day)...');
  const duplicates = await prisma.queueTicket.groupBy({
    by: ['patientId', 'queueDate'],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } }
  });

  if (duplicates.length === 0) {
    console.log('No duplicate queue tickets found! Safe.');
  } else {
    console.warn(`Found ${duplicates.length} duplicate scenarios!`);
    console.table(duplicates.map(d => ({
      patientId: d.patientId,
      queueDate: d.queueDate,
      count: d._count.id
    })));
  }
}

reportDuplicates().finally(() => prisma.$disconnect());
