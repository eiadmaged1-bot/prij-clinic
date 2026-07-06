const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const EMAIL = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_TEST_EMAIL || process.env.DEMO_OWNER_EMAIL || "eyad";
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_TEST_PASSWORD || process.env.DEMO_OWNER_PASSWORD || "eyad";
const TIMEOUT_MS = Number(process.env.API_WAIT_TIMEOUT_MS || 90_000);

const results = [];
let token = null;

function pass(label) {
  results.push({ status: "PASS", label });
  console.log(`PASS ${label}`);
}

function warn(label) {
  results.push({ status: "WARN", label });
  console.warn(`WARN ${label}`);
}

function fail(label, error) {
  const message = error instanceof Error ? error.message : String(error);
  results.push({ status: "FAIL", label, message });
  console.error(`FAIL ${label}: ${message}`);
}

function headers(extra = {}) {
  return {
    Accept: "application/json",
    ...extra
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: headers(options.headers)
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { response, body };
}

async function json(path, options = {}) {
  const { response, body } = await request(path, options);

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${formatBody(body)}`);
  }

  return body;
}

async function authedJson(path, options = {}) {
  return json(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}

async function status(path, options = {}) {
  const { response } = await request(path, options);
  return response.status;
}

async function authedStatus(path, options = {}) {
  return status(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
}

async function waitForApi() {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const body = await json("/health");
      if (body?.status === "ok") {
        pass("API /health became ready");
        return;
      }
      lastError = new Error(`/health returned unexpected body: ${formatBody(body)}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(2_000);
  }

  throw lastError || new Error(`API did not become ready within ${TIMEOUT_MS}ms`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectStatus(actual, expected, label) {
  const expectedValues = Array.isArray(expected) ? expected : [expected];
  assert(expectedValues.includes(actual), `${label} expected ${expectedValues.join("/")} but received ${actual}`);
}

function formatBody(body) {
  if (body === null || body === undefined) {
    return "<empty>";
  }

  if (typeof body === "string") {
    return body.slice(0, 300);
  }

  return JSON.stringify(body).slice(0, 300);
}

function firstArray(value, key) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value[key])) return value[key];
  return [];
}

async function runStep(label, fn) {
  try {
    await fn();
    pass(label);
  } catch (error) {
    fail(label, error);
  }
}

await runStep("wait for API health", waitForApi);

await runStep("GET /health", async () => {
  const body = await json("/health");
  assert(body?.status === "ok", "/health did not return ok");
});

await runStep("GET /health/db", async () => {
  const body = await json("/health/db");
  assert(body?.status === "ok", "/health/db did not return ok");
  assert(body?.database === "connected", "/health/db did not report connected database");
});

await runStep("protected endpoint rejects anonymous request", async () => {
  expectStatus(await status("/patients"), 401, "GET /patients without token");
});

await runStep("login with seeded demo owner", async () => {
  const body = await json("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  assert(body?.token, "login did not return a token");
  token = body.token;
});

const today = new Date().toISOString().slice(0, 10);
const protectedEndpoints = [
  ["/auth/me", "user"],
  ["/patients", "patients"],
  ["/appointments", "appointments"],
  [`/appointments/calendar?date=${today}`, "appointments"],
  ["/queue/today", "queue"],
  ["/encounters", "encounters"],
  ["/prescriptions", "prescriptions"],
  ["/investigations/orders", "investigationOrders"],
  ["/reports", "reports"],
  ["/pregnancies", "pregnancies"],
  ["/ob-ultrasounds", "obUltrasounds"],
  ["/billing/invoices", "invoices"],
  ["/billing/payments", "payments"],
  ["/dashboard/summary", null],
  ["/ai-drafts", "aiDrafts"]
];

for (const [endpoint] of protectedEndpoints) {
  await runStep(`GET ${endpoint}`, async () => {
    await authedJson(endpoint);
  });
}

await runStep("AI safety metadata stays disabled/mock-only", async () => {
  assert(process.env.AI_FEATURES_ENABLED !== "true", "AI_FEATURES_ENABLED must not be true for this test");
  assert(!process.env.AI_PROVIDER || process.env.AI_PROVIDER === "disabled", "AI_PROVIDER must be unset or disabled");

  const summary = await authedJson("/dashboard/summary");
  assert(summary?.safety?.aiEnabled === false, "dashboard did not report AI disabled");
  assert(summary?.safety?.clinicalDraftsRequireDoctorReview === true, "dashboard did not require doctor review");

  const draftsBody = await authedJson("/ai-drafts");
  const unsafeDrafts = firstArray(draftsBody, "aiDrafts").filter(
    (draft) => draft.modelProvider !== "disabled_mock" || draft.modelName !== "no_external_ai"
  );
  assert(unsafeDrafts.length === 0, "one or more AI drafts are not disabled/mock-only");
});

let createdDraftId = null;

await runStep("AI draft creation is mock-only and demo-safe", async () => {
  const patientsBody = await authedJson("/patients");
  let patient = firstArray(patientsBody, "patients").find((item) => item.medicalRecordNumber === "DEMO-MRN-001");
  if (!patient) {
    patient = await authedJson("/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicalRecordNumber: `DEMO-CI-AI-${Date.now()}`,
        firstName: "Demo",
        lastName: "CiAi",
        notes: "Fake local CI patient for AI safety integration test only."
      })
    });
    warn("Seeded Demo Patient A was outside the current API list window; created a fake local CI patient.");
  }
  assert(patient?.id, "seeded Demo Patient A was not available");

  const draft = await authedJson("/ai-drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draftType: "encounter_summary",
      patientId: patient.id,
      inputSourceSummary: "CI demo-only AI safety test. No external AI request."
    })
  });

  assert(draft?.id, "AI draft create did not return an id");
  assert(draft.modelProvider === "disabled_mock", "AI draft provider was not disabled_mock");
  assert(draft.modelName === "no_external_ai", "AI draft model was not no_external_ai");
  assert(/External AI access is disabled/.test(draft.generatedText || ""), "AI draft did not state external AI is disabled");
  createdDraftId = draft.id;
});

await runStep("AI cannot sign or insert final clinical records", async () => {
  assert(createdDraftId, "AI draft id was not available");
  expectStatus(await authedStatus(`/ai-drafts/${createdDraftId}/sign`, { method: "POST" }), 404, "AI sign route");
  expectStatus(
    await authedStatus(`/ai-drafts/${createdDraftId}/insert-approved`, { method: "POST" }),
    404,
    "AI insert route"
  );
});

await runStep("AI review audit confirms no clinical insertion", async () => {
  assert(createdDraftId, "AI draft id was not available");
  const reviewed = await authedJson(`/ai-drafts/${createdDraftId}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "rejected",
      reviewNote: "CI demo safety test rejection."
    })
  });
  assert(reviewed?.status === "rejected", "review did not update the AI draft artifact");

  const audit = await authedJson("/audit?limit=100");
  const reviewAudit = firstArray(audit, "auditLogs").find(
    (item) => item.resourceId === createdDraftId && item.action === "ai_draft.rejected"
  );
  assert(reviewAudit, "AI review audit entry was not found");
  assert(
    reviewAudit.metadataJson?.insertedIntoClinicalRecord === false,
    "AI review audit did not confirm no clinical insertion"
  );
});

if (!protectedEndpoints.some(([endpoint]) => endpoint === "/ai/drafts")) {
  warn("Actual implemented AI endpoint is /ai-drafts, not /ai/drafts.");
}

const failed = results.filter((item) => item.status === "FAIL");
const warnings = results.filter((item) => item.status === "WARN");
const passed = results.filter((item) => item.status === "PASS");

console.log("");
console.log("Security integration summary");
console.log(`PASS ${passed.length}`);
console.log(`WARN ${warnings.length}`);
console.log(`FAIL ${failed.length}`);

if (failed.length > 0) {
  process.exitCode = 1;
}
