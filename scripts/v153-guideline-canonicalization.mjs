import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const isApply = process.argv.includes("--apply");
  console.log(`Starting Guideline Canonicalization (Dry Run: ${!isApply})\n`);

  // We are specifically looking for NG201 and NG192 duplicates
  const targetCodes = ["NG201", "NG192"];

  for (const code of targetCodes) {
    console.log(`\n============================================================`);
    console.log(`Analyzing duplicates for: ${code}`);
    console.log(`============================================================`);

    const documents = await prisma.guidelineDocument.findMany({
      where: {
        OR: [
          { title: { contains: code, mode: "insensitive" } },
          { topic: { contains: code, mode: "insensitive" } }
        ]
      },
      include: {
        source: true,
        _count: { select: { chunks: true, sections: true } },
        versions: true
      },
      orderBy: { updatedAt: "desc" }
    });

    if (documents.length === 0) {
      console.log(`No documents found for ${code}`);
      continue;
    }

    console.log(`Found ${documents.length} matching records.\n`);
    
    // Sort logic to find the canonical document
    // We prioritize ACTIVE status, then highest chunk count, then latest update
    const sorted = [...documents].sort((a, b) => {
      if (a.guidelineStatus === "ACTIVE" && b.guidelineStatus !== "ACTIVE") return -1;
      if (b.guidelineStatus === "ACTIVE" && a.guidelineStatus !== "ACTIVE") return 1;
      
      const aChunks = a._count.chunks;
      const bChunks = b._count.chunks;
      if (aChunks !== bChunks) return bChunks - aChunks;
      
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    const canonical = sorted[0];
    const duplicates = sorted.slice(1);

    console.log(`[CANONICAL SELECTION]`);
    console.log(`ID: ${canonical.id}`);
    console.log(`Title: ${canonical.title}`);
    console.log(`Status: ${canonical.guidelineStatus}`);
    console.log(`Chunks: ${canonical._count.chunks}`);
    console.log(`Updated: ${canonical.updatedAt.toISOString()}\n`);

    if (duplicates.length > 0) {
      console.log(`[DUPLICATES TO ARCHIVE/REDIRECT]`);
      for (const dup of duplicates) {
        console.log(`- ID: ${dup.id} | Title: ${dup.title} | Status: ${dup.guidelineStatus} | Chunks: ${dup._count.chunks}`);
        if (isApply && dup.guidelineStatus !== "ARCHIVED") {
          await prisma.guidelineDocument.update({
            where: { id: dup.id },
            data: {
              guidelineStatus: "ARCHIVED",
              archivedAt: new Date(),
              citationLabel: `Superseded by canonical ${code}`
            }
          });
          console.log(`  -> Marked as ARCHIVED`);
        } else if (!isApply && dup.guidelineStatus !== "ARCHIVED") {
          console.log(`  -> (Dry Run) Will mark as ARCHIVED and create redirect logic in UI.`);
        } else {
          console.log(`  -> Already ARCHIVED`);
        }
      }
    } else {
      console.log(`No duplicates to archive.`);
    }

    // Ensure the canonical is ACTIVE
    if (isApply && canonical.guidelineStatus !== "ACTIVE") {
      await prisma.guidelineDocument.update({
        where: { id: canonical.id },
        data: { guidelineStatus: "ACTIVE" }
      });
      console.log(`\nUpdated canonical status to ACTIVE.`);
    } else if (!isApply && canonical.guidelineStatus !== "ACTIVE") {
      console.log(`\n(Dry Run) Will update canonical status to ACTIVE.`);
    }
  }

  console.log(`\n============================================================`);
  console.log(`Report generated successfully.`);
  if (!isApply) console.log(`Run with --apply to execute these changes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
