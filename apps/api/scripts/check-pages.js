const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function r() {
  const s = await prisma.guidelineSection.count({
    where: { documentId: 'd62dcde4-5fd6-4e65-90ed-999898f9df4b', pageStart: { not: null } }
  });
  console.log('Sections with page:', s);
  
  const chunks = await prisma.guidelineChunk.count({
    where: { documentId: 'd62dcde4-5fd6-4e65-90ed-999898f9df4b', pageStart: { not: null } }
  });
  console.log('Chunks with page:', chunks);
  await prisma.$disconnect();
}
r().catch(console.error);
