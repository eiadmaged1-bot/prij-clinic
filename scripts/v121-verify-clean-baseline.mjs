import {
  countModel,
  createPrisma,
  demoPatientWhere,
  medicationReadiness
} from "./v121-reference-utils.mjs";

const prisma = createPrisma();
const failures = [];
const warnings = [];
const passes = [];

try {
  await checkCleanOperationalState();
  await checkSecurityFoundation();
  await checkReferenceCatalogs();
  await checkMedication();
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}

for (const pass of passes) console.log(`V121-VERIFY PASS ${pass}`);
for (const warning of warnings) console.log(`V121-VERIFY WARN ${warning}`);
for (const failure of failures) console.log(`V121-VERIFY FAIL ${failure}`);
console.log(`V121-VERIFY SUMMARY PASS ${passes.length} WARN ${warnings.length} FAIL ${failures.length}`);
if (failures.length) process.exitCode = 1;

async function checkCleanOperationalState() {
  const demoPatients = await prisma.patient.count({ where: demoPatientWhere() });
  assert(demoPatients === 0, `zero fake/demo/test patients after apply; found ${demoPatients}`);
  passes.push("zero clearly fake/demo/test patients");

  const operationalCounts = {
    patients: await countModel(prisma, "patient"),
    appointments: await countModel(prisma, "appointment"),
    queueTickets: await countModel(prisma, "queueTicket"),
    encounters: await countModel(prisma, "encounter"),
    prescriptions: await countModel(prisma, "prescription"),
    investigationOrders: await countModel(prisma, "investigationOrder"),
    investigationResults: await countModel(prisma, "investigationResult"),
    invoices: await countModel(prisma, "invoice"),
    payments: await countModel(prisma, "payment")
  };
  const remaining = Object.entries(operationalCounts).filter(([, count]) => Number(count || 0) > 0);
  if (remaining.length) {
    warnings.push(`operational rows remain; this is acceptable unless --all-operational-local baseline was applied: ${remaining.map(([k, v]) => `${k}=${v}`).join(", ")}`);
  } else {
    passes.push("zero patient-linked operational rows after full local baseline");
  }
}

async function checkSecurityFoundation() {
  const users = await prisma.user.count();
  const roles = await prisma.role.count();
  const permissions = await prisma.permission.count();
  const branches = await prisma.branch.count();
  const auditLogs = await prisma.auditLog.count();
  assert(users > 0, "users exist");
  assert(roles > 0, "roles exist");
  assert(permissions > 0, "permissions exist");
  assert(branches > 0, "branch exists");
  assert(auditLogs > 0, "audit logs preserved");
  const owner = await prisma.user.findFirst({
    where: {
      status: "active",
      OR: [
        { protectedAccount: true },
        { loginId: "eyad" },
        { userRoles: { some: { role: { name: { in: ["Owner", "Admin"] } } } } }
      ]
    }
  });
  assert(owner, "active owner/admin account exists");
  passes.push(`security/system foundation preserved users=${users} roles=${roles} permissions=${permissions} branches=${branches} auditLogs=${auditLogs}`);
}

async function checkReferenceCatalogs() {
  const protocols = await countModel(prisma, "clinicalProtocol");
  const guidelineSources = await countModel(prisma, "guidelineSource");
  const guidelineDocuments = await countModel(prisma, "guidelineDocument");
  const investigations = await countModel(prisma, "investigationCatalogItem");
  const operations = await countModel(prisma, "operationCatalogItem");
  const services = await countModel(prisma, "serviceItem");
  assert(Number(investigations || 0) > 0, "investigation catalog exists");
  assert(Number(operations || 0) > 0, "operation catalog exists after seed");
  if (Number(services || 0) > 0) passes.push(`service catalog exists (${services})`);
  else warnings.push("service catalog has no rows");
  if (Number(protocols || 0) > 0 || Number(guidelineSources || 0) > 0 || Number(guidelineDocuments || 0) > 0) {
    passes.push(`guideline/protocol rows preserved protocols=${protocols} guidelineSources=${guidelineSources} guidelineDocuments=${guidelineDocuments}`);
  } else {
    warnings.push("guideline/protocol rows are currently zero in this local DB");
  }
  passes.push(`reference catalogs ready investigations=${investigations} operations=${operations}`);
}

async function checkMedication() {
  const readiness = await medicationReadiness(prisma);
  console.log(`V121-VERIFY medication official rows: ${readiness.officialRows}`);
  console.log(`V121-VERIFY medication verified rows: ${readiness.verifiedRows}`);
  if (readiness.officialRows === 0) warnings.push("official medication rows are zero; this is a WARN, not a fake PASS");
  else passes.push(`official medication rows preserved (${readiness.officialRows})`);
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
