import { PrismaClient } from '@prisma/client';

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--apply')) {
    console.error('ERROR: --apply is strictly forbidden. This script is read-only.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Isolated' } },
          { firstName: { contains: 'Test' } },
          { firstName: { contains: 'Synthetic' } },
          { medicalRecordNumber: { startsWith: 'PAY-' } },
          { medicalRecordNumber: { startsWith: 'QC-' } },
          { medicalRecordNumber: { startsWith: 'QTR-' } }
        ]
      },
      include: {
        _count: { select: { queueTickets: true, encounters: true, invoices: true, patientDocuments: true } }
      }
    });

    console.log(`Found ${patients.length} synthetic patient records.`);
    let idx = 1;
    for (const p of patients) {
      console.log(`${idx}. ID: ***${p.id.substring(p.id.length - 8)} | MRN: ***${p.medicalRecordNumber ? p.medicalRecordNumber.substring(p.medicalRecordNumber.length - 4) : 'N/A'} | Related: Q(${p._count.queueTickets}) E(${p._count.encounters}) I(${p._count.invoices}) D(${p._count.patientDocuments})`);
      idx++;
    }
    console.log('Cleanup Action: None performed.');
  } catch (e) {
    console.error('Error executing read-only incident check:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
