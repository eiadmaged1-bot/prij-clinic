import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

try {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (apply) {
    const result = await prisma.idempotencyRecord.deleteMany({
      where: {
        createdAt: {
          lt: cutoff
        }
      }
    });
    console.log(`Deleted ${result.count} idempotency records older than 24 hours.`);
  } else {
    const count = await prisma.idempotencyRecord.count({
      where: {
        createdAt: {
          lt: cutoff
        }
      }
    });
    console.log(`[Dry Run] Found ${count} idempotency records older than 24 hours to delete. Run with --apply to execute.`);
  }
} catch (error) {
  console.error("Failed to clean idempotency records:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
