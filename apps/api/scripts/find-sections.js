const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function r() {
  const docs = await prisma.guidelineDocument.findMany({
    where: { sections: { some: { pageStart: { not: null, gt: 0 } } } },
    select: { id: true, title: true }
  });
  console.log('Docs with valid sections:', docs);
  await prisma.$disconnect();
}
r().catch(console.error);
