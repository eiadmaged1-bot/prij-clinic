const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function r() {
  const doc = await prisma.guidelineDocument.findUnique({
    where: { id: 'd62dcde4-5fd6-4e65-90ed-999898f9df4b' },
    include: { sections: { take: 20, orderBy: { orderIndex: 'asc' } } }
  });
  console.log(doc.sections.map(s => ({ h: s.heading, p: s.pageStart })));
  await prisma.$disconnect();
}
r().catch(console.error);
