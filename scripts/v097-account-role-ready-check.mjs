import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const prisma = new PrismaClient();
const runId = createHash("sha1").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 8);
const roles = ["Doctor", "Receptionist", "Nurse", "Accountant"];
const passes = [];
const failures = [];

try {
  await waitForApi();
  await checkEyad();
  const owner = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: process.env.DEMO_ADMIN_PASSWORD || "eyad" });
  assert(owner.user?.isSystemOwner === true, "eyad logs in as protected system owner");
  const password = `V097Local${runId}!`;
  const created = [];
  for (const role of roles) {
    const loginId = `v097${role.toLowerCase()}${runId}`;
    const response = await apiJson("POST", "/admin/accounts", owner.token, {
      loginId,
      displayName: `V097 Local Demo ${role}`,
      role,
      permissionPreset: "standard",
      temporaryPassword: password,
      reason: "v0.9.7 account role readiness check."
    });
    assert(response.account?.role === role, `eyad can create ${role}`);
    created.push({ id: response.account.id, loginId, role });
  }
  const reception = created.find((item) => item.role === "Receptionist");
  const receptionLogin = await apiJson("POST", "/auth/login", null, { identifier: reception.loginId, password });
  assert(receptionLogin.user?.roles?.includes("Receptionist"), "created Receptionist can login");

  for (const path of ["/patients", "/appointments", "/queue/today"]) {
    await expectStatus("GET", path, receptionLogin.token, undefined, [200]);
  }
  for (const path of [
    "/admin/accounts",
    "/admin/roles",
    "/drug-market/review-queue",
    "/drug-market/automation/coverage",
    "/guidelines/query-logs",
    "/protocol-atlas/groups",
    "/ai-management/snapshots"
  ]) {
    await expectStatus("GET", path, receptionLogin.token, undefined, [403, 404]);
  }
  const auditCount = await prisma.auditLog.count({ where: { action: "account.created", resourceId: { in: created.map((item) => item.id) } } });
  assert(auditCount >= roles.length, "account creation audit rows exist");
  const stored = await prisma.user.findMany({ where: { id: { in: created.map((item) => item.id) } }, select: { passwordHash: true } });
  assert(stored.every((row) => row.passwordHash && row.passwordHash !== password), "no plaintext password is stored");
  passes.push("eyad creates Doctor, Receptionist, Nurse, and Accountant; Receptionist login and denials verified");
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}

for (const item of passes) console.log(`V097-ACCOUNT-READY PASS ${item}`);
for (const item of failures) console.log(`V097-ACCOUNT-READY FAIL ${item}`);
console.log(`V097-ACCOUNT-READY SUMMARY PASS ${passes.length} WARN 0 FAIL ${failures.length}`);
if (failures.length) process.exitCode = 1;

async function checkEyad() {
  const eyad = await prisma.user.findFirst({
    where: { loginId: "eyad" },
    include: { userRoles: { include: { role: true } }, permissionOverrides: { include: { permission: true } } }
  });
  assert(eyad?.protectedAccount === true && eyad.status === "active", "eyad exists, active, and protected");
  assert(eyad.userRoles.some((item) => item.role.name === "Owner"), "eyad has Owner role");
  assert(eyad.permissionOverrides.some((item) => item.effect === "allow" && item.permission.key === "system_owner.manage"), "eyad has system owner authority");
}

async function waitForApi() {
  const response = await fetch(`${API_URL}/health`).catch(() => null);
  if (!response?.ok) throw new Error(`API unavailable at ${API_URL}/health`);
}

async function expectStatus(method, path, token, body, expected) {
  const response = await apiRequest(method, path, token, body);
  if (!expected.includes(response.status)) throw new Error(`${method} ${path} expected ${expected.join("/")} but got ${response.status}: ${JSON.stringify(response.body)}`);
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
  const response = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let parsed = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { ok: response.ok, status: response.status, body: parsed };
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
