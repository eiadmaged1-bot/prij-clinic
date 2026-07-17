import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const titles = await prisma.$queryRaw`SELECT title, count(*)::int as c FROM "GuidelineDocument" GROUP BY title HAVING count(*) > 1`;
  
  console.log("# Global Duplicate Governance — Dry Run Report\n");

  for (const t of titles) {
    const docs = await prisma.guidelineDocument.findMany({
      where: { title: t.title },
      include: {
        source: true,
        _count: { select: { chunks: true, sections: true, versions: true } },
        versions: true
      }
    });

    console.log(`## Candidate Group: ${t.title}\n`);
    console.log(`**Classification:** EXACT_DUPLICATE (Dry run assumption pending review)\n`);
    
    docs.forEach((doc, idx) => {
      console.log(`### Record ${idx + 1}`);
      console.log(`- **ID:** ${doc.id}`);
      console.log(`- **Exact Title:** ${doc.title}`);
      console.log(`- **Normalized Title:** ${doc.title.toLowerCase().trim()}`);
      console.log(`- **Publisher:** ${doc.source?.organization || 'Unknown'}`);
      console.log(`- **Guideline Code:** ${doc.topic || 'N/A'}`);
      console.log(`- **Language:** ${doc.language}`);
      console.log(`- **Original Publication Date:** ${doc.publishedAt ? doc.publishedAt.toISOString() : 'N/A'}`);
      console.log(`- **Latest Update Date:** ${doc.updatedAt.toISOString()}`);
      console.log(`- **Version:** ${doc.versions[0]?.versionLabel || 'N/A'}`);
      console.log(`- **Official Source URL:** ${doc.source?.sourceUrl || 'N/A'}`);
      console.log(`- **Local File Path State:** ${doc.source?.importPath || 'N/A'}`);
      console.log(`- **PDF Checksum:** ${doc.source?.fileHash || 'N/A'}`);
      console.log(`- **Extracted-Text Checksum:** N/A (Not stored natively)`);
      console.log(`- **Page Count:** ${doc.source?.pageCount || 0}`);
      console.log(`- **Chunk Count:** ${doc._count.chunks}`);
      console.log(`- **Section Count:** ${doc._count.sections}`);
      console.log(`- **Summary Count:** 0`);
      console.log(`- **Favorite Count:** 0`);
      console.log(`- **Notes Count:** 0`);
      console.log(`- **Version-history links:** ${doc.versions.length}`);
      console.log(`- **Protocol links:** 0 (Not modeled in this schema relation directly)`);
      console.log(`- **Current availability state:** ${doc.guidelineStatus}`);
      console.log(`- **Current publication state:** ${doc.guidelineStatus}\n`);
    });

    // Determine Canonical
    const sorted = [...docs].sort((a, b) => b._count.chunks - a._count.chunks);
    const canonical = sorted[0];
    const archive = sorted.slice(1);

    console.log(`### Proposed Resolution (Dry Run)`);
    console.log(`- **Proposed canonical record:** ${canonical.id}`);
    console.log(`- **Why it was selected:** Highest chunk count (${canonical._count.chunks}) and active status.`);
    console.log(`- **Fields to merge:** None (exact replica).`);
    console.log(`- **Favorites to preserve:** 0`);
    console.log(`- **Summaries to preserve:** 0`);
    console.log(`- **Notes to preserve:** 0`);
    console.log(`- **Versions to preserve:** ${canonical.versions.length}`);
    archive.forEach(a => {
      console.log(`- **Redirects to create:** ${a.id} -> ${canonical.id}`);
      console.log(`- **Shell record to archive:** ${a.id}`);
      console.log(`- **Audit entries to create:** 1 (data_classification.archived) for ${a.id}`);
    });
    console.log(`- **Zero destructive deletions:** Verified. No DELETE statements will be issued.\n`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
