const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function r() {
  await prisma.guidelineSection.updateMany({
    where: { documentId: 'd62dcde4-5fd6-4e65-90ed-999898f9df4b', heading: 'Section 3' },
    data: { pageStart: 3, pageEnd: 5 }
  });
  console.log('Updated Section 3 for NG201 to pageStart: 3');
  await prisma.$disconnect();
}
r().catch(console.error);
