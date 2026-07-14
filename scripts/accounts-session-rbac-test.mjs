import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";

async function loadLocalEnv() {
  if (process.env.DATABASE_URL) return;

  try {
    const envFile = await readFile(".env", "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Keep the original Prisma error if DATABASE_URL is still unavailable.
  }
}

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const WEB_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
await loadLocalEnv();
const prisma = new PrismaClient();
const runId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const checks = [];
const adminLogin = process.env.DEMO_ADMIN_LOGIN || "eyad";
const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
const testPassword = process.env.DEMO_TEST_PASSWORD;
if (!adminPassword || !testPassword) throw new Error("DEMO_ADMIN_PASSWORD and DEMO_TEST_PASSWORD are required.");

async function main() {
  await expectReachable(`${WEB_URL}/login`, "login page reachable");
  await expectReachable(`${WEB_URL}/admin/accounts`, "accounts page reachable");

  const loginSource = await readFile("apps/web/app/login/page.tsx", "utf8");
  for (const label of ["Already logged in as", "Go to Dashboard", "Go to Accounts", "Log out and switch account"]) {
    assert(loginSource.includes(label), `login page missing already-logged-in label: ${label}`);
  }
  checks.push("login while authenticated shows current-session actions");

  const shellSource = await readFile("apps/web/app/mvp-page.tsx", "utf8");
  for (const label of ["user?.displayName", "primaryRole", "Owner", "Logout"]) {
    assert(shellSource.includes(label), `app shell missing session/topbar label: ${label}`);
  }
  checks.push("account session topbar source remains visible");

  const owner = await login(adminLogin, adminPassword);
  checks.push("login as eyad");
  const me = await apiJson("GET", "/auth/me", owner.session);
  assert(me.user?.displayName === "Eyad Admin", "auth/me returns Eyad identity");
  assert(me.user?.isSystemOwner === true, "auth/me marks Eyad as system owner");
  checks.push("auth/me identity");

  const refreshed = await apiJson("GET", "/auth/me", owner.session);
  assert(refreshed.user?.id === me.user.id, "same session survives refresh-style auth/me");
  checks.push("refresh keeps session");

  const invalid = await apiRequest("GET", "/auth/me", "invalid.token.value");
  assert(invalid.status === 401, "invalid token is rejected");
  checks.push("invalid token rejected");

  const logout = await apiRequest("POST", "/auth/logout", owner.session);
  assert([200, 201].includes(logout.status), "logout succeeds");
  checks.push("logout endpoint");

  const relogin = await login(adminLogin, adminPassword);
  const accountsBody = await apiJson("GET", "/admin/accounts", relogin.session);
  const eyad = accountsBody.accounts.find((account) => account.loginId === "eyad");
  assert(eyad, "eyad exists after seed");
  assert(eyad.protectedAccount === true, "eyad protected flag");
  assert(eyad.isSystemOwner === true, "eyad system owner flag");
  assert(eyad.reservedPermissions.includes("system_owner.manage"), "eyad reserved permission");
  checks.push("eyad protected seed");

  const doctor = await createAccount(relogin.session, {
    loginId: `acctdoctor${runId}`,
    displayName: "Demo Account Doctor",
    role: "Doctor",
    permissionPreset: "standard",
    temporaryPassword: testPassword,
    reason: "Accounts RBAC test doctor."
  });
  const reception = await createAccount(relogin.session, {
    loginId: `acctreception${runId}`,
    displayName: "Demo Account Reception",
    role: "Receptionist",
    permissionPreset: "minimum",
    temporaryPassword: testPassword,
    reason: "Accounts RBAC test receptionist."
  });
  checks.push("owner creates doctor and receptionist");

  const doctorDb = await prisma.user.findUnique({ where: { id: doctor.id } });
  assert(doctorDb?.passwordHash && doctorDb.passwordHash !== testPassword, "password is hashed");
  checks.push("password hashed");

  const rolePreset = await apiJson("PATCH", `/admin/accounts/${doctor.id}/permissions`, relogin.session, {
    permissionPreset: "custom",
    allowedPermissions: ["patient.read", "encounter.read", "prescription.read"],
    reason: "Accounts RBAC test custom permission."
  });
  assert(rolePreset.account.permissionPreset === "custom", "custom preset applied");
  assert(rolePreset.account.customAllowedPermissions.includes("patient.read"), "custom allowed permission saved");
  checks.push("owner sets role preset and allowed toggles");

  const secondSystemOwner = await apiRequest("POST", "/admin/accounts", relogin.session, {
    loginId: "eyad",
    displayName: "Second Eyad",
    role: "Owner",
    permissionPreset: "advanced",
    temporaryPassword: testPassword,
    reason: "Should be blocked."
  });
  assert([400, 403].includes(secondSystemOwner.status), "second System Owner blocked");
  checks.push("cannot create second Developer Owner");

  const grantReserved = await apiRequest("PATCH", `/admin/accounts/${doctor.id}/permissions`, relogin.session, {
    permissionPreset: "custom",
    allowedPermissions: ["system_owner.manage"],
    reason: "Should be blocked."
  });
  assert([400, 403].includes(grantReserved.status), "reserved permission grant blocked");
  checks.push("cannot grant Developer Owner permission");

  const demoteEyad = await apiRequest("PATCH", `/admin/accounts/${eyad.id}`, relogin.session, {
    role: "Doctor",
    reason: "Should be blocked."
  });
  assert([400, 403].includes(demoteEyad.status), "eyad demotion blocked");
  const deactivateEyad = await apiRequest("POST", `/admin/accounts/${eyad.id}/deactivate`, relogin.session, {
    reason: "Should be blocked."
  });
  assert([400, 403].includes(deactivateEyad.status), "eyad deactivation blocked");
  checks.push("cannot demote or deactivate eyad");

  const doctorLogin = await login(doctor.loginId, testPassword);
  const doctorDenied = await apiRequest("GET", "/admin/accounts", doctorLogin.session);
  assert(doctorDenied.status === 403, "doctor direct accounts access denied");
  const receptionLogin = await login(reception.loginId, testPassword);
  const receptionDenied = await apiRequest("GET", "/admin/accounts", receptionLogin.session);
  assert(receptionDenied.status === 403, "reception direct accounts access denied");
  checks.push("non-admin direct admin/accounts denied");

  const auditActions = await prisma.auditLog.findMany({
    where: {
      action: {
        in: ["account.created", "account.permissions_updated"]
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  assert(auditActions.some((entry) => entry.resourceId === doctor.id), "account changes audited");
  checks.push("account changes audited");

  for (const check of checks) console.log(`ACCOUNTS-RBAC PASS ${check}`);
  console.log(`ACCOUNTS-RBAC SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

async function createAccount(token, body) {
  const response = await apiJson("POST", "/admin/accounts", token, body);
  return response.account;
}

async function login(identifier, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });
  const body = await parseBody(response);
  if (!response.ok) throw new Error(`POST /auth/login returned ${response.status}: ${JSON.stringify(body)}`);
  const session = (response.headers.getSetCookie?.() ?? []).map((value) => value.split(";", 1)[0]).join("; ");
  assert(session.includes("prij_clinic_session="), "login established session cookie");
  return { body, session };
}

async function expectReachable(url, label) {
  const response = await fetch(url);
  assert(response.ok, `${label} returned ${response.status}`);
  checks.push(label);
}

async function apiJson(method, path, token, body) {
  const response = await apiRequest(method, path, token, body);
  if (!response.ok) {
    throw new Error(`${method} ${path} returned ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

async function apiRequest(method, path, token, body) {
  const headers = { Accept: "application/json" };
  if (token?.includes("prij_clinic_session=")) {
    headers.Cookie = token;
    const csrf = /(?:^|;\s*)csrf-token=([^;]+)/.exec(token)?.[1];
    if (csrf) headers["x-csrf-token"] = csrf;
  } else if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await parseBody(response)
  };
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
  if (!condition) {
    throw new Error(message);
  }
}

await main()
  .catch((error) => {
    console.error(`ACCOUNTS-RBAC FAIL ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
