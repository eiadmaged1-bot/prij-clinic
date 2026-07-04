import { PrismaClient } from "@prisma/client";
import { spawn, spawnSync } from "node:child_process";
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
let devProcess = null;

async function main() {
  await ensureLocalAppReady();

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

  const owner = await login("eyad", "eyad");
  checks.push("login as eyad");
  const me = await apiJson("GET", "/auth/me", owner.token);
  assert(me.user?.displayName === "Eyad Admin", "auth/me returns Eyad identity");
  assert(me.user?.isSystemOwner === true, "auth/me marks Eyad as system owner");
  checks.push("auth/me identity");

  const refreshed = await apiJson("GET", "/auth/me", owner.token);
  assert(refreshed.user?.id === me.user.id, "same token survives refresh-style auth/me");
  checks.push("refresh keeps session token");

  const invalid = await apiRequest("GET", "/auth/me", "invalid.token.value");
  assert(invalid.status === 401, "invalid token is rejected");
  checks.push("invalid token rejected");

  const logout = await apiRequest("POST", "/auth/logout", owner.token);
  assert([200, 201].includes(logout.status), "logout succeeds");
  checks.push("logout endpoint");

  const relogin = await login("eyad", "eyad");
  const accountsBody = await apiJson("GET", "/admin/accounts", relogin.token);
  const eyad = accountsBody.accounts.find((account) => account.loginId === "eyad");
  assert(eyad, "eyad exists after seed");
  assert(eyad.protectedAccount === true, "eyad protected flag");
  assert(eyad.isSystemOwner === true, "eyad system owner flag");
  assert(eyad.reservedPermissions.includes("system_owner.manage"), "eyad reserved permission");
  checks.push("eyad protected seed");

  const doctor = await createAccount(relogin.token, {
    loginId: `acctdoctor${runId}`,
    displayName: "Demo Account Doctor",
    role: "Doctor",
    permissionPreset: "standard",
    temporaryPassword: "LocalDev123!",
    reason: "Accounts RBAC test doctor."
  });
  const reception = await createAccount(relogin.token, {
    loginId: `acctreception${runId}`,
    displayName: "Demo Account Reception",
    role: "Receptionist",
    permissionPreset: "minimum",
    temporaryPassword: "LocalDev123!",
    reason: "Accounts RBAC test receptionist."
  });
  checks.push("owner creates doctor and receptionist");

  const doctorDb = await prisma.user.findUnique({ where: { id: doctor.id } });
  assert(doctorDb?.passwordHash && doctorDb.passwordHash !== "LocalDev123!", "password is hashed");
  checks.push("password hashed");

  const rolePreset = await apiJson("PATCH", `/admin/accounts/${doctor.id}/permissions`, relogin.token, {
    permissionPreset: "custom",
    allowedPermissions: ["patient.read", "encounter.read", "prescription.read"],
    reason: "Accounts RBAC test custom permission."
  });
  assert(rolePreset.account.permissionPreset === "custom", "custom preset applied");
  assert(rolePreset.account.customAllowedPermissions.includes("patient.read"), "custom allowed permission saved");
  checks.push("owner sets role preset and allowed toggles");

  const secondSystemOwner = await apiRequest("POST", "/admin/accounts", relogin.token, {
    loginId: "eyad",
    displayName: "Second Eyad",
    role: "Owner",
    permissionPreset: "advanced",
    temporaryPassword: "LocalDev123!",
    reason: "Should be blocked."
  });
  assert([400, 403].includes(secondSystemOwner.status), "second System Owner blocked");
  checks.push("cannot create second Developer Owner");

  const grantReserved = await apiRequest("PATCH", `/admin/accounts/${doctor.id}/permissions`, relogin.token, {
    permissionPreset: "custom",
    allowedPermissions: ["system_owner.manage"],
    reason: "Should be blocked."
  });
  assert([400, 403].includes(grantReserved.status), "reserved permission grant blocked");
  checks.push("cannot grant Developer Owner permission");

  const demoteEyad = await apiRequest("PATCH", `/admin/accounts/${eyad.id}`, relogin.token, {
    role: "Doctor",
    reason: "Should be blocked."
  });
  assert([400, 403].includes(demoteEyad.status), "eyad demotion blocked");
  const deactivateEyad = await apiRequest("POST", `/admin/accounts/${eyad.id}/deactivate`, relogin.token, {
    reason: "Should be blocked."
  });
  assert([400, 403].includes(deactivateEyad.status), "eyad deactivation blocked");
  checks.push("cannot demote or deactivate eyad");

  const doctorLogin = await login(doctor.loginId, "LocalDev123!");
  const doctorDenied = await apiRequest("GET", "/admin/accounts", doctorLogin.token);
  assert(doctorDenied.status === 403, "doctor direct accounts access denied");
  const receptionLogin = await login(reception.loginId, "LocalDev123!");
  const receptionDenied = await apiRequest("GET", "/admin/accounts", receptionLogin.token);
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
  const body = await apiJson("POST", "/auth/login", null, { identifier, password });
  assert(body.token, "login returned token");
  return body;
}

async function expectReachable(url, label) {
  const response = await fetchWithContext(url, { headers: { Accept: "text/html,application/json" } }, label);
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
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetchWithContext(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  }, `${method} ${path}`);

  return {
    ok: response.ok,
    status: response.status,
    body: await parseBody(response)
  };
}

async function ensureLocalAppReady() {
  const timeoutMs = Number(process.env.ACCOUNTS_RBAC_WAIT_TIMEOUT_MS || 120_000);
  const autoStart = process.env.ACCOUNTS_RBAC_AUTO_START !== "false";

  if (await localAppReady()) {
    checks.push("local app already reachable");
    return;
  }

  if (!autoStart) {
    throw new Error(
      `Local web/API are not reachable. Start them with npm run dev, or set APP_URL/API_URL. Checked ${WEB_URL}/login and ${API_URL}/health.`
    );
  }

  console.log("ACCOUNTS-RBAC INFO starting local app with npm run dev");
  devProcess = spawnDev();
  const deadline = Date.now() + timeoutMs;
  let lastError = "not checked";

  while (Date.now() < deadline) {
    try {
      if (await localAppReady()) {
        checks.push("local app auto-started");
        return;
      }
      lastError = "web/API not ready yet";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(2_000);
  }

  throw new Error(
    `Local app did not become ready within ${timeoutMs}ms: ${lastError}. Ensure PostgreSQL is running, then retry npm run test:accounts:rbac.`
  );
}

async function localAppReady() {
  const [web, api, db] = await Promise.allSettled([
    fetch(`${WEB_URL}/login`, { headers: { Accept: "text/html" } }),
    fetch(`${API_URL}/health`, { headers: { Accept: "application/json" } }),
    fetch(`${API_URL}/health/db`, { headers: { Accept: "application/json" } })
  ]);

  if (web.status !== "fulfilled" || api.status !== "fulfilled" || db.status !== "fulfilled") return false;
  if (!web.value.ok || !api.value.ok || !db.value.ok) return false;

  const apiText = await api.value.text();
  const dbText = await db.value.text();
  return /"ok"|ok/i.test(apiText) && /connected|ok/i.test(dbText);
}

function spawnDev() {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
      stdio: "ignore",
      windowsHide: true
    });
  }
  return spawn("npm", ["run", "dev"], { stdio: "ignore" });
}

function stopDevProcess() {
  if (!devProcess || devProcess.killed) return;
  if (process.platform === "win32" && devProcess.pid) {
    spawnSync("taskkill", ["/pid", String(devProcess.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }
  devProcess.kill("SIGTERM");
}

async function fetchWithContext(url, options, label) {
  try {
    return await fetch(url, options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} could not reach ${url}: ${detail}. Ensure npm run dev is running and PostgreSQL is reachable.`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    stopDevProcess();
    await prisma.$disconnect();
  });
