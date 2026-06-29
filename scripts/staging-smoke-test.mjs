import { existsSync, readFileSync } from "node:fs";

const envFile = process.env.STAGING_ENV_FILE || ".env.staging";
loadEnvFile(envFile);

if ((process.env.STAGING_API_URL || process.env.STAGING_BASE_URL) && process.env.APP_ENV === undefined) {
  process.env.APP_ENV = "staging";
}

const API_URL = (process.env.STAGING_API_URL || process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const WEB_URL = (process.env.STAGING_BASE_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const ownerEmail =
  process.env.STAGING_DEMO_OWNER_LOGIN || process.env.DEMO_OWNER_EMAIL || "demo.owner@prij.local";
const staffPassword = process.env.STAGING_DEMO_TEST_PASSWORD || process.env.DEMO_TEST_PASSWORD;
const ownerPassword =
  process.env.STAGING_DEMO_OWNER_PASSWORD ||
  process.env.STAGING_OWNER_PASSWORD ||
  (ownerEmail === "demo.owner@prij.local" ? staffPassword : process.env.DEMO_OWNER_PASSWORD);
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const checks = [];

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  if (process.env.APP_ENV !== "staging") {
    throw new Error("Staging smoke test requires APP_ENV=staging.");
  }

  if (process.env.AI_FEATURES_ENABLED === "true" || process.env.AI_PROVIDER !== "disabled") {
    throw new Error("AI must remain disabled for staging smoke tests.");
  }

  if (!ownerPassword || !staffPassword) {
    throw new Error("Demo staging passwords are required in the local staging env file.");
  }

  await expectReachable(`${WEB_URL}/login`, "web login page");
  await expectJson(`${API_URL}/health`, "API health", (body) => body.status === "ok");
  await expectJson(`${API_URL}/health/db`, "API database health", (body) =>
    ["connected", "ok"].includes(body?.database)
  );

  const ownerToken = await login(ownerEmail, ownerPassword, "demo owner");
  checks.push("demo owner login");

  const receptionToken = await login("demo.reception@prij.local", staffPassword, "demo reception");
  const denied = await apiRequest("GET", "/admin/settings/appearance", receptionToken);
  if (![403, 404].includes(denied.status)) {
    throw new Error(`non-admin admin denial expected 403/404 but received ${denied.status}`);
  }
  checks.push("non-admin admin denial");

  const patient = await apiJson("POST", "/patients", ownerToken, {
    medicalRecordNumber: `STAGE-SMOKE-${runId}`,
    firstName: "Demo",
    lastName: "Staging",
    notes: "Local staging smoke test fake record only."
  });
  if (!patient.id) throw new Error("fake patient creation did not return an id.");
  checks.push("fake patient creation");

  await apiJson("GET", `/patients/${patient.id}`, ownerToken);
  checks.push("fake patient file read");

  await expectReachable(`${WEB_URL}/doctor`, "doctor mode page");
  await expectReachable(`${WEB_URL}/doctor/visit`, "doctor visit page");

  for (const check of checks) {
    console.log(`PASS ${check}`);
  }
  console.log("PASS staging smoke test");
}

async function expectReachable(url, label) {
  const response = await fetchWithRetry(url, { headers: { Accept: "text/html,application/json" } });
  if (!response.ok) {
    throw new Error(`${label} returned ${response.status}.`);
  }
  checks.push(label);
}

async function expectJson(url, label, predicate) {
  const response = await fetchWithRetry(url, { headers: { Accept: "application/json" } });
  const body = await parseBody(response);
  if (!response.ok || !predicate(body)) {
    throw new Error(`${label} failed with ${response.status}: ${JSON.stringify(body)}`);
  }
  checks.push(label);
}

async function fetchWithRetry(url, options, attempts = 12) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok || attempt === attempts) return response;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw lastError ?? new Error(`Unable to reach ${url}`);
}

async function login(email, password, label) {
  const body = await apiJson("POST", "/auth/login", null, { email, password });
  if (!body.token) throw new Error(`${label} did not return a token.`);
  return body.token;
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

await main().catch((error) => {
  console.error(`FAIL staging smoke test: ${error.message}`);
  process.exit(1);
});
