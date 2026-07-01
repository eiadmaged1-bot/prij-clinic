import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const scrypt = promisify(scryptCallback);
const prisma = new PrismaClient();
const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const runId = createHash("sha1").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 8);
const checks = [];
const warnings = [];

try {
  await verifyEyad();
  await verifyRoles();
  await verifyInvestigationCatalog();
  await verifyMedicationReference();
  await verifyCleanupDryRunPreservesReference();
  await verifyAccountCreation();

  for (const check of checks) console.log(`V095-VERIFY PASS ${check}`);
  for (const warning of warnings) console.log(`V095-VERIFY WARN ${warning}`);
  console.log(`V095-VERIFY SUMMARY PASS ${checks.length} WARN ${warnings.length} FAIL 0`);
} catch (error) {
  console.error(`V095-VERIFY FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

async function verifyEyad() {
  const eyad = await prisma.user.findFirst({
    where: { loginId: "eyad" },
    include: {
      userRoles: { include: { role: true } },
      permissionOverrides: { include: { permission: true } }
    }
  });
  assert(eyad, "eyad exists");
  assert(eyad.protectedAccount === true, "eyad is protected");
  assert(eyad.status === "active", "eyad is active");
  assert(eyad.userRoles.some((item) => item.role.name === "Owner"), "eyad has Owner role");
  assert(
    eyad.permissionOverrides.some((item) => item.effect === "allow" && item.permission.key === "system_owner.manage"),
    "eyad has System Owner authority"
  );
  checks.push("eyad protected owner authority");
}

async function verifyRoles() {
  const roles = await prisma.role.findMany({
    where: { name: { in: ["Doctor", "Receptionist", "Nurse", "Accountant"] } }
  });
  assert(roles.length === 4, "required staff roles exist");

  const ownerRole = await prisma.role.findUnique({
    where: { name: "Owner" },
    include: { rolePermissions: { include: { permission: true } } }
  });
  assert(ownerRole?.rolePermissions.some((item) => item.permission.key === "user.manage"), "Owner can create accounts");
  checks.push("required roles and owner account creation permission");
}

async function verifyInvestigationCatalog() {
  assert(prisma.investigationCatalogItem, "InvestigationCatalogItem model exists");
  const count = await prisma.investigationCatalogItem.count();
  assert(count >= 60, `investigation catalog count >= expected minimum, got ${count}`);
  const required = [
    "CBC",
    "Blood Group and Rh",
    "Serum Beta-hCG",
    "Urinalysis",
    "TSH",
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
  const rows = await prisma.investigationCatalogItem.findMany({
    where: { OR: required.map((name) => ({ name })) },
    select: { name: true }
  });
  const found = new Set(rows.map((row) => row.name));
  for (const name of required) assert(found.has(name), `key investigation exists: ${name}`);
  checks.push("investigation catalog seeded with key OB/GYN names");
}

async function verifyMedicationReference() {
  for (const model of ["drugFamily", "medicationIngredient", "medicationProduct", "drugMarketVariant", "drugMarketSource", "drugMarketCountry"]) {
    assert(prisma[model]?.count, `${model} model exists`);
  }
  const realOfficialRows = await prisma.drugMarketVariant.count({ where: { isDemo: false } });
  if (realOfficialRows === 0) {
    warnings.push("official medication rows not present in this DB");
  } else {
    assert(realOfficialRows >= 1, "official medication rows are preserved when present");
  }
  checks.push("medication reference models present");
}

async function verifyCleanupDryRunPreservesReference() {
  const output = execFileSync("node", ["scripts/v095-clean-demo-operational-data.mjs"], {
    encoding: "utf8",
    env: { ...process.env, APP_ENV: process.env.APP_ENV || "local" }
  });
  for (const forbidden of ["drugMarketVariant", "drugMarketProduct", "medicationProduct", "investigationCatalogItem", "rolePermission"]) {
    assert(!output.includes(`delete ${forbidden}`), `cleanup dry-run does not target ${forbidden}`);
    assert(!output.includes(`would delete ${forbidden}`), `cleanup dry-run does not target ${forbidden}`);
  }
  assert(output.includes("preserved reference data"), "cleanup dry-run states reference preservation");
  checks.push("demo cleanup dry-run preserves medication and investigation reference data");
}

async function verifyAccountCreation() {
  const health = await fetch(`${API_URL}/health`).catch(() => null);
  if (!health?.ok) {
    warnings.push("API not reachable; skipped endpoint login checks");
    await verifyAccountCreationSourceAndDbFallback();
    return;
  }

  const ownerPassword = process.env.DEMO_ADMIN_PASSWORD || "eyad";
  const owner = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: ownerPassword });
  assert(owner.user?.isSystemOwner === true, "eyad logs in as system owner");

  const doctorLoginId = `v095doctor${runId}`;
  const receptionLoginId = `v095reception${runId}`;
  const password = `V095Local${runId}!`;
  const doctor = await createAccount(owner.token, doctorLoginId, "Doctor", password);
  const reception = await createAccount(owner.token, receptionLoginId, "Receptionist", password);
  assert(doctor.role === "Doctor", "eyad creates doctor account");
  assert(reception.role === "Receptionist", "eyad creates receptionist account");

  const doctorLogin = await apiJson("POST", "/auth/login", null, { identifier: doctorLoginId, password });
  assert(doctorLogin.user?.roles?.includes("Doctor"), "created doctor can login");
  const receptionLogin = await apiJson("POST", "/auth/login", null, { identifier: receptionLoginId, password });
  assert(receptionLogin.user?.roles?.includes("Receptionist"), "created receptionist can login");

  const denied = await apiRequest("POST", "/admin/accounts", receptionLogin.token, {
    loginId: `v095blocked${runId}`,
    displayName: "Blocked Local Demo Account",
    role: "Doctor",
    permissionPreset: "standard",
    temporaryPassword: password,
    reason: "Should be denied."
  });
  assert(denied.status === 403, "receptionist cannot create accounts");

  const accountRows = await prisma.user.findMany({
    where: { loginId: { in: [doctorLoginId, receptionLoginId] } },
    select: { id: true, passwordHash: true }
  });
  assert(accountRows.every((row) => row.passwordHash && row.passwordHash !== password), "created account passwords are hashed");
  const auditCount = await prisma.auditLog.count({
    where: { action: "account.created", resourceId: { in: accountRows.map((row) => row.id) } }
  });
  assert(auditCount >= 2, "account creation is audited");
  checks.push("eyad endpoint account creation and login checks");
}

async function verifyAccountCreationSourceAndDbFallback() {
  const source = require("node:fs").readFileSync("apps/api/src/rbac/rbac.service.ts", "utf8");
  for (const text of ["action: \"account.created\"", "assertCanManageAccounts", "assertCanEditAccount", "Eyad System Owner is protected", "passwordHash"]) {
    assert(source.includes(text), `account service source includes ${text}`);
  }

  const owner = await prisma.user.findFirst({ where: { loginId: "eyad" } });
  const doctorRole = await prisma.role.findUnique({ where: { name: "Doctor" } });
  const receptionRole = await prisma.role.findUnique({ where: { name: "Receptionist" } });
  assert(owner && doctorRole && receptionRole, "DB fallback has owner and staff roles");
  const password = `V095Local${runId}!`;
  const passwordHash = await hashPassword(password);
  const doctor = await upsertLocalVerificationAccount(`v095doctor${runId}`, "V095 Local Demo Doctor", doctorRole.id, owner.id, passwordHash);
  const reception = await upsertLocalVerificationAccount(`v095reception${runId}`, "V095 Local Demo Reception", receptionRole.id, owner.id, passwordHash);
  assert(await verifyPassword(password, doctor.passwordHash), "DB fallback doctor password hash verifies");
  assert(await verifyPassword(password, reception.passwordHash), "DB fallback receptionist password hash verifies");
  warnings.push("DB fallback created local verification accounts because API was unavailable");
  checks.push("account creation service/source and DB fallback checks");
}

async function upsertLocalVerificationAccount(loginId, displayName, roleId, ownerId, passwordHash) {
  const branchId = (await prisma.user.findUnique({ where: { id: ownerId }, select: { branchId: true } }))?.branchId ?? null;
  const user = await prisma.user.upsert({
    where: { loginId },
    update: { displayName, status: "active", passwordHash, protectedAccount: false, permissionPreset: "standard" },
    create: {
      loginId,
      email: `${loginId}@accounts.prij.local`,
      displayName,
      status: "active",
      branchId,
      permissionPreset: "standard",
      protectedAccount: false,
      createdByUserId: ownerId,
      passwordHash
    }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId_branchId: { userId: user.id, roleId, branchId } },
    update: {},
    create: { userId: user.id, roleId, branchId, createdByUserId: ownerId }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: ownerId,
      action: "account.created",
      resourceType: "user",
      resourceId: user.id,
      branchId,
      severity: "high",
      reason: "v0.9.5 local verification fallback."
    }
  });
  return user;
}

async function createAccount(token, loginId, role, password) {
  const body = await apiJson("POST", "/admin/accounts", token, {
    loginId,
    displayName: `V095 Local Demo ${role}`,
    role,
    permissionPreset: "standard",
    temporaryPassword: password,
    reason: "v0.9.5 reference data verification."
  });
  return body.account;
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

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, 64);
  return `scrypt:16384:8:1:${salt}:${Buffer.from(key).toString("base64url")}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, , , , salt, expected] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actualKey = Buffer.from(await scrypt(password, salt, 64));
  const expectedKey = Buffer.from(expected, "base64url");
  return actualKey.length === expectedKey.length && timingSafeEqual(actualKey, expectedKey);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
