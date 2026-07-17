const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
Promise.all([
  prisma.patient.count().catch(() => 0),
  prisma.encounter.count().catch(() => 0),
  prisma.prescription.count().catch(() => 0),
  prisma.user.count().catch(() => 0)
]).then(counts => {
  console.log("Patients:", counts[0]);
  console.log("Encounters:", counts[1]);
  console.log("Prescriptions:", counts[2]);
  console.log("Users:", counts[3]);
  prisma.$disconnect();
}).catch(console.error);
