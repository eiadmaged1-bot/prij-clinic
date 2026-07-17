import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const gs = await prisma.guidelineDocument.findMany({
    where: { title: { contains: 'NG192' } },
    include: { _count: { select: { chunks: true } } }
  });
  console.log(gs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
