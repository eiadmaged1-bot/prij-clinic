import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const query = { q: "NG192" };
  const q = "NG192";
  const terms = ["ng192"];
  
  const chunks = await prisma.guidelineChunk.findMany({
      where: {
        document: {
          guidelineStatus: { notIn: ["SUPERSEDED", "ARCHIVED"] }
        },
        ...(terms.length ? {
          OR: terms.flatMap((term) => [
            { text: { contains: term, mode: "insensitive" } },
            { document: { title: { contains: term, mode: "insensitive" } } },
            { document: { topic: { contains: term, mode: "insensitive" } } },
            { document: { specialty: { contains: term, mode: "insensitive" } } },
            { document: { organization: { contains: term, mode: "insensitive" } } },
            { section: { heading: { contains: term, mode: "insensitive" } } }
          ])
        } : {})
      },
      include: { document: true },
      take: 500,
      orderBy: { createdAt: "desc" }
  });

  console.log("Chunks found:", chunks.length);
  if (chunks.length > 0) {
    console.log(chunks[0].document.title);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
