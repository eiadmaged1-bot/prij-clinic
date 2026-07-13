import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const isApply = args.includes("--apply");

async function main() {
  console.log("Starting Auth Sessions Cleanup...");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // We find sessions that have expired or been revoked > 30 days ago
  const filter = {
    OR: [
      { expiresAt: { lt: thirtyDaysAgo } },
      { revokedAt: { lt: thirtyDaysAgo } }
    ]
  };

  const count = await prisma.authSession.count({
    where: filter
  });

  console.log(`Found ${count} expired or revoked sessions older than 30 days.`);

  if (!isApply) {
    console.log("DRY RUN. Pass --apply to actually delete these sessions.");
    process.exit(0);
  }

  const result = await prisma.authSession.deleteMany({
    where: filter
  });

  console.log(`Deleted ${result.count} sessions successfully.`);
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
