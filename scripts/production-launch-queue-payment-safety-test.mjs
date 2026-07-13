import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("[Test] Queue and Payment Safety");
  const prisma = new PrismaClient();
  try {
    const qCount = await prisma.queueDayCounter.count();
    console.log("QueueDayCounter ok", qCount);
    const qLock = await prisma.activeQueueTicketLock.count();
    console.log("ActiveQueueTicketLock ok", qLock);
    console.log("All safety models present.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();