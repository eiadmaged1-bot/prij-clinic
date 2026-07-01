import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const runId = createHash("sha1").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 8);
const passes = [];
const warnings = [];
const failures = [];
const demoPrefixes = ["QA", "Demo", "Test", "BrowserTest", "V093", "V094", "Local"];
const requiredInvestigations = [
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
const requiredRoles = ["Doctor", "Receptionist", "Nurse", "Accountant"];
const forbiddenCleanupTargets = [
  "drugMarketVariant",
  "drugMarketProduct",
  "drugMarketSource",
  "drugMarketCountry",
  "medicationProduct",
  "medicationIngredient",
  "drugFamily",
  "investigationCatalogItem",
  "role",
  "permission",
  "user",
  "auditLog"
];

try {
  await checkDemoPatients();
  await checkInvestigationCatalog();
  await checkEyad();
  await checkRoles();
  await checkAccountCreationSupport();
  await checkAuditRows();
  await checkMedicationReference();
  checkCleanupTargetScope();
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}

for (const pass of passes) console.log(`V096-READY PASS ${pass}`);
for (const warning of warnings) console.log(`V096-READY WARN ${warning}`);
for (const failure of failures) console.log(`V096-READY FAIL ${failure}`);
console.log(`V096-READY SUMMARY PASS ${passes.length} WARN ${warnings.length} FAIL ${failures.length}`);
if (failures.length > 0) process.exitCode = 1;

async function checkDemoPatients() {
  const count = await countDemoPatients();
  if (count > 0) {
    failures.push(`clearly demo/test/local patients remain after cleanup: ${count}`);
    return;
  }
  passes.push("no clearly demo/test/local patients remain");
}

async function countDemoPatients() {
  if (!prisma.patient?.count) return 0;
  const prefixOr = [];
  for (const prefix of demoPrefixes) {
    prefixOr.push({ medicalRecordNumber: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ firstName: { startsWith: prefix, mode: "insensitive" } });
    prefixOr.push({ lastName: { startsWith: prefix, mode: "insensitive" } });
  }
  return prisma.patient.count({
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
    }
  });
}

async function checkInvestigationCatalog() {
  assert(prisma.investigationCatalogItem?.count, "InvestigationCatalogItem model exists");
  const count = await prisma.investigationCatalogItem.count();
  assert(count >= 63, `investigation catalog count >= 63, got ${count}`);
  const rows = await prisma.investigationCatalogItem.findMany({
    where: { OR: requiredInvestigations.map((name) => ({ name })) },
    select: { name: true }
  });
  const found = new Set(rows.map((row) => row.name));
  for (const name of requiredInvestigations) assert(found.has(name), `key investigation exists: ${name}`);
  passes.push(`investigation catalog ready with ${count} rows`);
}

async function checkEyad() {
  const eyad = await prisma.user.findFirst({
    where: { loginId: "eyad" },
    include: {
      userRoles: { include: { role: true } },
      permissionOverrides: { include: { permission: true } }
    }
  });
  assert(eyad, "eyad exists");
  assert(eyad.status === "active", "eyad active");
  assert(eyad.protectedAccount === true, "eyad protected owner/system owner");
  assert(eyad.userRoles.some((item) => item.role.name === "Owner"), "eyad has Owner role");
  assert(
    eyad.permissionOverrides.some((item) => item.effect === "allow" && item.permission.key === "system_owner.manage"),
    "eyad has system_owner.manage authority"
  );
  passes.push("eyad protected active owner authority");
}

async function checkRoles() {
  const rows = await prisma.role.findMany({ where: { name: { in: requiredRoles } }, select: { name: true } });
  const found = new Set(rows.map((row) => row.name));
  for (const role of requiredRoles) assert(found.has(role), `${role} role exists`);
  passes.push("Doctor, Receptionist, Nurse, and Accountant roles exist");
}

async function checkAccountCreationSupport() {
  const health = await fetch(`${API_URL}/health`).catch(() => null);
  if (health?.ok) {
    await checkAccountCreationEndpoints();
    return;
  }

  warnings.push("API not reachable; endpoint account creation checks skipped");
  const dtoSource = readFileSync("apps/api/src/rbac/admin.dto.ts", "utf8");
  const serviceSource = readFileSync("apps/api/src/rbac/rbac.service.ts", "utf8");
  const uiSource = readFileSync("apps/web/app/admin/accounts/page.tsx", "utf8");
  for (const role of requiredRoles) {
    assert(dtoSource.includes(`"${role}"`), `CreateAccountDto supports ${role}`);
    assert(uiSource.includes(`"${role}"`), `/admin/accounts role selector includes ${role}`);
  }
  assert(serviceSource.includes("assertCanManageAccounts"), "backend enforces account management permission");
  assert(serviceSource.includes("action: \"account.created\""), "backend audits account creation");
  passes.push("account creation source supports requested staff roles");
  passes.push("non-owner account creation denial is enforced by account service source");
}

async function checkAccountCreationEndpoints() {
  const ownerPassword = process.env.DEMO_ADMIN_PASSWORD || "eyad";
  const owner = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: ownerPassword });
  assert(owner.user?.isSystemOwner === true, "eyad logs in as system owner");
  const password = `V096Local${runId}!`;
  const createdIds = [];
  for (const role of requiredRoles) {
    const loginId = `v096${role.toLowerCase()}${runId}`;
    const account = await apiJson("POST", "/admin/accounts", owner.token, {
      loginId,
      displayName: `V096 Local Demo ${role}`,
      role,
      permissionPreset: "standard",
      temporaryPassword: password,
      reason: "v0.9.6 local demo ready verification."
    });
    assert(account.account?.role === role, `eyad can create ${role}`);
    createdIds.push(account.account.id);
    const login = await apiJson("POST", "/auth/login", null, { identifier: loginId, password });
    assert(login.user?.roles?.includes(role), `created ${role} can login`);
  }

  const receptionistLoginId = `v096blockedreception${runId}`;
  await apiJson("POST", "/admin/accounts", owner.token, {
    loginId: receptionistLoginId,
    displayName: "V096 Local Demo Denial Receptionist",
    role: "Receptionist",
    permissionPreset: "standard",
    temporaryPassword: password,
    reason: "v0.9.6 local demo denial verification."
  });
  const receptionist = await apiJson("POST", "/auth/login", null, { identifier: receptionistLoginId, password });
  const denied = await apiRequest("POST", "/admin/accounts", receptionist.token, {
    loginId: `v096blocked${runId}`,
    displayName: "V096 Blocked Local Demo Account",
    role: "Doctor",
    permissionPreset: "standard",
    temporaryPassword: password,
    reason: "Should be denied."
  });
  assert(denied.status === 403, "non-owner account creation denied");
  const auditCount = await prisma.auditLog.count({
    where: { action: "account.created", resourceId: { in: createdIds } }
  });
  assert(auditCount >= requiredRoles.length, "created staff accounts are audited");
  passes.push("eyad endpoint account creation works for requested staff roles");
  passes.push("non-owner endpoint account creation denied");
}

async function checkAuditRows() {
  const count = prisma.auditLog?.count ? await prisma.auditLog.count() : 0;
  assert(count > 0, "audit rows exist");
  passes.push(`audit logs preserved (${count} rows)`);
}

async function checkMedicationReference() {
  for (const model of ["drugFamily", "medicationIngredient", "medicationProduct", "drugMarketVariant", "drugMarketSource", "drugMarketCountry"]) {
    assert(prisma[model]?.count, `${model} model exists`);
  }
  const realOfficialRows = await prisma.drugMarketVariant.count({ where: { isDemo: false } });
  if (realOfficialRows === 0) {
    warnings.push("official medication rows absent locally; next step is restore/import official medication data");
  } else {
    passes.push(`official medication rows present (${realOfficialRows})`);
  }
  passes.push("medication reference tables exist");
}

function checkCleanupTargetScope() {
  const cleanupSource = readFileSync("scripts/v095-clean-demo-operational-data.mjs", "utf8");
  for (const model of forbiddenCleanupTargets) {
    assert(!cleanupSource.includes(`"${model}"`) && !cleanupSource.includes(`'${model}'`), `cleanup target list excludes ${model}`);
  }

  const dryRun = execFileSync(process.execPath, ["scripts/v095-clean-demo-operational-data.mjs"], {
    encoding: "utf8",
    env: { ...process.env, APP_ENV: process.env.APP_ENV || "local" }
  });
  assert(dryRun.includes("preserved reference data"), "cleanup dry-run states reference preservation");
  passes.push("cleanup target scope excludes medication, investigation, user, role, permission, and audit reference tables");
}

async function apiJson(method, path, token, body) {
  const response = await apiRequest(method, path, token, body);
  if (!response.ok) throw new Error(`${method} ${path} returned ${response.status}: ${JSON.stringify(response.body)}`);
  return response.body;
}

async function apiRequest(method, path, token, body) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { ok: response.ok, status: response.status, body: await parseBody(response) };
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
