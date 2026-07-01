import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const reportDir = resolve(rootDir, "storage", "local-db-finalization");
const jsonPath = resolve(reportDir, "v096-finalization-report.json");
const mdPath = resolve(reportDir, "v096-finalization-report.md");
const applyCleanup = process.argv.includes("--apply-cleanup");
const allowedEnvs = new Set(["local", "dev", "test", "ci"]);
const productionLikeDatabasePattern = /(prod|production|primary|live|real|patient|phi)/i;
const demoPrefixes = ["QA", "Demo", "Test", "BrowserTest", "V093", "V094", "Local"];
const keyInvestigations = [
  "CBC",
  "Serum Beta-hCG",
  "AMH",
  "Pap Smear / Cervical Cytology",
  "Pelvic Ultrasound",
  "Transvaginal Ultrasound",
  "Dating Scan",
  "Anomaly Scan",
  "Fetal Growth Scan",
  "Doppler Ultrasound",
  "Mammography"
];

const prisma = new PrismaClient();
const report = {
  sprint: "v0.9.6 Local Demo Database Finalization",
  generatedAt: new Date().toISOString(),
  mode: applyCleanup ? "apply-cleanup" : "report-only",
  appEnv: process.env.APP_ENV || null,
  databaseSafety: checkDatabaseSafety(),
  commands: [],
  before: null,
  cleanupDryRun: null,
  cleanupApply: null,
  after: null,
  referenceVerification: null,
  accountAuthority: null,
  medication: null,
  investigationCatalog: null,
  preservation: null,
  warnings: [],
  failures: []
};

try {
  assertStorageIgnored();
  if (applyCleanup) validateApplySafety();

  report.before = await collectDbSnapshot("before cleanup");
  const auditBefore = runNpmScript("db:v095:audit");
  const dryRun = runNpmScript("db:v095:clean:dry-run");
  report.cleanupDryRun = parseCleanupOutput(dryRun.stdout);

  if (applyCleanup) {
    const apply = runNpmScript("db:v095:clean:apply");
    report.cleanupApply = {
      command: apply.command,
      exitCode: apply.status,
      applied: apply.status === 0,
      summary: parseCleanupOutput(apply.stdout)
    };
  }

  report.after = await collectDbSnapshot("after cleanup");
  const auditAfter = runNpmScript("db:v095:audit");
  const verify = runNpmScript("db:v095:verify-reference");
  report.referenceVerification = parseVerifyOutput(verify.stdout);
  report.accountAuthority = await collectAccountAuthority();
  report.medication = await collectMedicationPresence();
  report.investigationCatalog = await collectInvestigationCatalog();
  report.preservation = collectPreservationSummary();

  if (report.medication.realOfficialRows === 0) {
    report.warnings.push("Official medication rows are absent in this local DB; restore/import official data instead of faking rows.");
  }
  if (verify.status !== 0) {
    report.failures.push("Reference verification script failed.");
  }
  if (auditBefore.status !== 0 || auditAfter.status !== 0 || dryRun.status !== 0) {
    report.failures.push("One or more audit/dry-run commands failed.");
  }
  if (applyCleanup && report.cleanupApply?.exitCode !== 0) {
    report.failures.push("Cleanup apply failed or was refused by safety checks.");
  }

  writeReports();
  printConsoleSummary();
  if (report.failures.length > 0) process.exitCode = 1;
} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
  writeReports();
  printConsoleSummary();
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

function runNpmScript(scriptName) {
  const command = `npm run ${scriptName}`;
  const result = process.platform === "win32"
    ? spawnSync(command, {
      cwd: rootDir,
      encoding: "utf8",
      env: { ...process.env },
      shell: true
    })
    : spawnSync("npm", ["run", scriptName], {
    cwd: rootDir,
    encoding: "utf8",
    env: { ...process.env },
      shell: false
    });
  const entry = {
    command,
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
  report.commands.push(entry);
  return entry;
}

async function collectDbSnapshot(label) {
  const demoPatients = await findDemoPatients();
  return {
    label,
    demoPatientCount: demoPatients.length,
    operationalCounts: await countModels({
      patients: "patient",
      appointments: "appointment",
      queueTickets: "queueTicket",
      encounters: "encounter",
      prescriptions: "prescription",
      investigationOrders: "investigationOrder",
      reports: "report",
      pregnancies: "pregnancy",
      obUltrasounds: "obUltrasound",
      invoices: "invoice",
      payments: "payment",
      auditLogs: "auditLog"
    }),
    referenceCounts: await countModels({
      users: "user",
      roles: "role",
      permissions: "permission",
      serviceCatalog: "serviceItem",
      investigationCatalog: "investigationCatalogItem",
      drugFamilies: "drugFamily",
      medicationIngredients: "medicationIngredient",
      medicationProducts: "medicationProduct",
      drugMarketProducts: "drugMarketProduct",
      drugMarketVariants: "drugMarketVariant"
    })
  };
}

async function countModels(models) {
  const counts = {};
  for (const [label, model] of Object.entries(models)) {
    counts[label] = prisma[model]?.count ? await prisma[model].count() : null;
  }
  return counts;
}

async function findDemoPatients() {
  if (!prisma.patient?.findMany) return [];
  const prefixOr = [];
  for (const prefix of demoPrefixes) {
    prefixOr.push({ medicalRecordNumber: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ firstName: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ lastName: { startsWith: prefix, mode: "insensitive" } });
  }

  return prisma.patient.findMany({
    where: {
      OR: [
        ...prefixOr,
        { notes: { contains: "Local demo", mode: "insensitive" } },
        { notes: { contains: "demo patient", mode: "insensitive" } },
        {
          createdByUser: {
            OR: [
              { loginId: { startsWith: "demo", mode: "insensitive" } },
              { email: { startsWith: "demo.", mode: "insensitive" } }
            ]
          }
        }
      ]
    },
    select: { id: true }
  });
}

function parseCleanupOutput(output) {
  const targeted = Number((output.match(/demo patients targeted: (\d+)/) || [])[1] || 0);
  const plannedDeletes = {};
  for (const match of output.matchAll(/(?:would delete|delete) ([^:]+): (\d+)/g)) {
    plannedDeletes[match[1]] = Number(match[2]);
  }
  return {
    demoPatientsTargeted: targeted,
    plannedDeletes,
    preservesReferenceData: output.includes("preserved reference data"),
    warnsMedicationReferenceDelete: /drugMarketVariant|medicationProduct|investigationCatalogItem|rolePermission/.test(output)
  };
}

function parseVerifyOutput(output) {
  return {
    pass: Number((output.match(/SUMMARY PASS (\d+)/) || [])[1] || 0),
    warn: Number((output.match(/WARN (\d+)/) || [])[1] || 0),
    fail: Number((output.match(/FAIL (\d+)/) || [])[1] || 0),
    warnings: [...output.matchAll(/V095-VERIFY WARN (.+)/g)].map((match) => match[1])
  };
}

async function collectAccountAuthority() {
  const eyad = await prisma.user.findFirst({
    where: { loginId: "eyad" },
    include: {
      userRoles: { include: { role: true } },
      permissionOverrides: { include: { permission: true } }
    }
  });
  const roles = await prisma.role.findMany({
    where: { name: { in: ["Doctor", "Receptionist", "Nurse", "Accountant"] } },
    select: { name: true }
  });
  const roleNames = roles.map((role) => role.name).sort();
  const auditRows = prisma.auditLog?.count
    ? await prisma.auditLog.count({ where: { action: { in: ["account.created", "account.updated", "account.password_reset"] } } })
    : null;

  return {
    eyadExists: Boolean(eyad),
    eyadActive: eyad?.status === "active",
    eyadProtected: eyad?.protectedAccount === true,
    eyadRoles: eyad?.userRoles.map((item) => item.role.name).sort() || [],
    eyadReservedPermissions:
      eyad?.permissionOverrides
        .filter((item) => item.effect === "allow" && ["system_owner.manage", "developer_owner.manage"].includes(item.permission.key))
        .map((item) => item.permission.key)
        .sort() || [],
    staffRolesPresent: roleNames,
    requestedStaffRolesSupported: ["Doctor", "Receptionist", "Nurse", "Accountant"].every((role) => roleNames.includes(role)),
    accountAuditRows: auditRows
  };
}

async function collectMedicationPresence() {
  const counts = await countModels({
    drugFamilies: "drugFamily",
    medicationIngredients: "medicationIngredient",
    medicationProducts: "medicationProduct",
    drugMarketCountries: "drugMarketCountry",
    drugMarketSources: "drugMarketSource",
    drugMarketProducts: "drugMarketProduct",
    drugMarketVariants: "drugMarketVariant"
  });
  const realOfficialRows = prisma.drugMarketVariant?.count
    ? await prisma.drugMarketVariant.count({ where: { isDemo: false } })
    : null;
  return {
    counts,
    realOfficialRows,
    status: realOfficialRows === 0 ? "WARN_OFFICIAL_ROWS_ABSENT" : "PRESENT"
  };
}

async function collectInvestigationCatalog() {
  if (!prisma.investigationCatalogItem?.findMany) {
    return { count: null, keyInvestigationsFound: [], keyInvestigationsMissing: keyInvestigations };
  }
  const rows = await prisma.investigationCatalogItem.findMany({
    where: { OR: keyInvestigations.map((name) => ({ name })) },
    select: { name: true }
  });
  const found = rows.map((row) => row.name).sort();
  return {
    count: await prisma.investigationCatalogItem.count(),
    keyInvestigationsFound: found,
    keyInvestigationsMissing: keyInvestigations.filter((name) => !found.includes(name))
  };
}

function collectPreservationSummary() {
  return {
    preserved: [
      "users, roles, and permissions",
      "protected eyad account",
      "audit logs",
      "investigation catalog",
      "medication reference and drug-market tables when present",
      "service catalog and setup/reference data"
    ],
    cleanupTargetsOnly: "clearly demo/test/local patient-linked operational rows"
  };
}

function checkDatabaseSafety() {
  const databaseUrl = process.env.DATABASE_URL || "";
  return {
    appEnvAllowed: allowedEnvs.has(process.env.APP_ENV || ""),
    databaseUrlPresent: Boolean(databaseUrl),
    databaseUrlProductionLike: productionLikeDatabasePattern.test(databaseUrl),
    nodeEnvProduction: process.env.NODE_ENV === "production" || process.env.PRODUCTION === "true"
  };
}

function validateApplySafety() {
  const safety = report.databaseSafety;
  if (!process.env.APP_ENV) {
    throw new Error("Apply mode requires APP_ENV to be explicitly set to local, dev, test, or ci.");
  }
  if (!safety.appEnvAllowed) {
    throw new Error(`Apply mode refused for APP_ENV=${process.env.APP_ENV}.`);
  }
  if (!safety.databaseUrlPresent) {
    throw new Error("Apply mode requires DATABASE_URL.");
  }
  if (safety.databaseUrlProductionLike || safety.nodeEnvProduction) {
    throw new Error("Apply mode refused because the environment or DATABASE_URL looks production-like.");
  }
}

function assertStorageIgnored() {
  const ignore = readFileSync(resolve(rootDir, ".gitignore"), "utf8");
  if (!ignore.includes("storage/*")) {
    throw new Error("storage/* must be ignored before local DB finalization reports are generated.");
  }
}

function writeReports() {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(report));
}

function toMarkdown(data) {
  const beforeDemo = data.before?.demoPatientCount ?? "unknown";
  const afterDemo = data.after?.demoPatientCount ?? "unknown";
  const investigationCount = data.investigationCatalog?.count ?? "unknown";
  const medicationRows = data.medication?.realOfficialRows ?? "unknown";
  const keyMissing = data.investigationCatalog?.keyInvestigationsMissing ?? [];
  const lines = [
    "# v0.9.6 Local Demo Database Finalization Report",
    "",
    `Generated: ${data.generatedAt}`,
    `Mode: ${data.mode}`,
    `APP_ENV: ${data.appEnv || "not set"}`,
    "",
    "## Summary",
    "",
    `- Demo patients before cleanup: ${beforeDemo}`,
    `- Demo patients after cleanup: ${afterDemo}`,
    `- Cleanup dry-run targeted demo patients: ${data.cleanupDryRun?.demoPatientsTargeted ?? "unknown"}`,
    `- Cleanup apply: ${data.cleanupApply ? (data.cleanupApply.applied ? "applied" : "failed/refused") : "not requested"}`,
    `- Investigation catalog count: ${investigationCount}`,
    `- Key investigations missing: ${keyMissing.length ? keyMissing.join(", ") : "none"}`,
    `- Official medication rows: ${medicationRows}`,
    `- Medication status: ${data.medication?.status ?? "unknown"}`,
    `- Eyad protected/active: ${Boolean(data.accountAuthority?.eyadProtected)}/${Boolean(data.accountAuthority?.eyadActive)}`,
    `- Staff roles supported: ${data.accountAuthority?.staffRolesPresent?.join(", ") || "unknown"}`,
    "",
    "## Preservation",
    "",
    ...(data.preservation?.preserved ?? []).map((item) => `- ${item}`),
    "",
    "## Warnings",
    "",
    ...(data.warnings.length ? data.warnings.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Failures",
    "",
    ...(data.failures.length ? data.failures.map((item) => `- ${item}`) : ["- none"]),
    "",
    "## Commands",
    "",
    ...data.commands.map((item) => `- ${item.command}: exit ${item.status}`),
    ""
  ];
  return `${lines.join("\n")}\n`;
}

function printConsoleSummary() {
  console.log("V096 LOCAL DB FINALIZATION REPORT");
  console.log(`mode: ${report.mode}`);
  console.log(`report json: ${jsonPath}`);
  console.log(`report markdown: ${mdPath}`);
  console.log(`demo patients before: ${report.before?.demoPatientCount ?? "unknown"}`);
  console.log(`demo patients after: ${report.after?.demoPatientCount ?? "unknown"}`);
  console.log(`cleanup dry-run targeted: ${report.cleanupDryRun?.demoPatientsTargeted ?? "unknown"}`);
  console.log(`cleanup apply: ${report.cleanupApply ? (report.cleanupApply.applied ? "applied" : "failed/refused") : "not requested"}`);
  console.log(`investigation catalog: ${report.investigationCatalog?.count ?? "unknown"}`);
  console.log(`official medication rows: ${report.medication?.realOfficialRows ?? "unknown"}`);
  console.log(`eyad protected active: ${Boolean(report.accountAuthority?.eyadProtected)} ${Boolean(report.accountAuthority?.eyadActive)}`);
  console.log(`warnings: ${report.warnings.length}`);
  for (const warning of report.warnings) console.log(`WARN ${warning}`);
  console.log(`failures: ${report.failures.length}`);
  for (const failure of report.failures) console.log(`FAIL ${failure}`);
}
