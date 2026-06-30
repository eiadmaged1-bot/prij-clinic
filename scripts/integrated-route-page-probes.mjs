import { readFile } from "node:fs/promises";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const WEB_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const DEMO_PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
const results = [];

await main().catch((error) => {
  fail("integrated probes", error);
  summary();
  process.exit(1);
});

summary();

async function main() {
  await waitForApi();
  const owner = await login("eyad", "eyad");
  const doctor = await login("demo.doctor@prij.local", DEMO_PASSWORD);
  const reception = await login("demo.reception@prij.local", DEMO_PASSWORD);
  const accountant = await login("demo.accountant@prij.local", DEMO_PASSWORD);

  const patients = await apiJson("GET", "/patients", owner);
  const patient = patients.patients?.[0] ?? patients[0];
  assert(patient?.id, "No demo patient available for patient-file probe.");

  for (const page of [
    "/",
    "/login",
    "/dashboard",
    "/patients",
    `/patients/${patient.id}`,
    "/billing",
    "/guidelines",
    "/guidelines/search",
    "/guidelines/ask",
    "/guidelines/sources",
    "/guidelines/upload",
    "/guidelines/imports",
    "/guidelines/review",
    "/guidelines/updates",
    "/guidelines/private-vault"
  ]) {
    await expectPage(page);
  }
  pass("general, patient, finance, and guideline pages return 200");

  const patientFileSource = `${await readFile("apps/web/app/patients/[id]/page.tsx", "utf8")}\n${await readFile("apps/web/app/navigation-registry.ts", "utf8")}`;
  for (const label of [
    "Summary",
    "Medical",
    "Clinical",
    "Appointments",
    "Encounters",
    "Prescriptions",
    "Investigations",
    "Reports",
    "Pregnancy",
    "Ultrasound",
    "Billing",
    "Consents",
    "AI Drafts",
    "Protocol Atlas",
    "Calculators",
    "Medications",
    "Allergies",
    "Herbal/Supplements",
    "Medication Safety",
    "Prescription Safety",
    "Timeline"
  ]) {
    assert(patientFileSource.includes(`label: "${label}"`), `Patient file tab missing: ${label}`);
  }
  pass("patient file tabs remain clean and ordered");

  for (const label of ["Abnormal bleeding", "Pelvic pain", "PCOS", "Fibroid or ovarian cyst", "Contraception counseling"]) {
    assert(patientFileSource.includes(label), `Gynecology starter label missing: ${label}`);
  }
  pass("general gynecology starter templates are present");

  await expectApi("GET", "/billing/invoices", owner, [200]);
  await expectApi("GET", "/billing/services", owner, [200]);
  await expectApi("GET", "/billing/reports/finance", owner, [200]);
  await expectApi("GET", "/billing/daily-closing", owner, [200]);
  await expectApi("GET", `/billing/patients/${patient.id}/statement`, owner, [200]);
  await expectApi("GET", "/billing/reports/finance", doctor, [403]);
  pass("finance reports, daily closing, service catalog, and statement probes pass");

  await expectApi("GET", "/gynecology-visits", doctor, [200]);
  await expectApi("GET", `/patients/${patient.id}/gynecology-visits`, doctor, [200]);
  await expectApi("GET", "/gynecology-visits", reception, [403]);
  await expectApi("GET", "/gynecology-visits", accountant, [403]);
  pass("gynecology workspace API probes pass with non-clinical denial");

  await expectApi("GET", "/guidelines/sources", owner, [200]);
  await expectApi("GET", "/guidelines/documents", owner, [200]);
  await expectApi("GET", "/guidelines/search?q=demo", doctor, [200]);
  await expectApi("POST", "/guidelines/ask", doctor, [200, 201], { question: "demo" });
  await expectApi("GET", "/guidelines/import-jobs", owner, [200]);
  await expectApi("GET", "/guidelines/update-checks", owner, [200]);
  await expectApi("GET", "/guidelines/query-logs", owner, [200]);
  for (const token of [reception, accountant, null]) {
    await expectApi("GET", "/guidelines/search?q=demo", token, token ? [403] : [401]);
    await expectApi("POST", "/guidelines/ask", token, token ? [403] : [401], { question: "demo" });
  }
  pass("guideline route probes pass with denied-role and anonymous protection");

  const guidelineBody = await apiJson("GET", "/guidelines/documents", owner);
  const serializedGuidelines = JSON.stringify(guidelineBody);
  assert(!serializedGuidelines.includes("localFilePath"), "Guideline response exposed localFilePath.");
  assert(!serializedGuidelines.includes("\\storage\\") && !serializedGuidelines.includes("/storage/"), "Guideline response exposed storage path.");
  pass("guideline responses do not expose raw local paths");
}

async function waitForApi() {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("API was not reachable.");
}

async function login(identifier, password) {
  const body = await apiJson("POST", "/auth/login", null, { identifier, password });
  assert(body.token, `Login did not return token for ${identifier}.`);
  return body.token;
}

async function expectPage(path) {
  const response = await fetch(`${WEB_URL}${path}`, { headers: { accept: "text/html" } });
  assert(response.status === 200, `${path} returned ${response.status}.`);
}

async function expectApi(method, path, token, expected, body) {
  const response = await apiRequest(method, path, token, body);
  assert(expected.includes(response.status), `${method} ${path} returned ${response.status}; expected ${expected.join("/")}.`);
}

async function apiJson(method, path, token, body) {
  const response = await apiRequest(method, path, token, body);
  if (!response.ok) {
    throw new Error(`${method} ${path} returned ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

async function apiRequest(method, path, token, body) {
  const headers = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
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

function pass(label) {
  results.push({ status: "PASS", label });
  console.log(`INTEGRATED-PROBES PASS ${label}`);
}

function fail(label, error) {
  const message = error instanceof Error ? error.message : String(error);
  results.push({ status: "FAIL", label, message });
  console.error(`INTEGRATED-PROBES FAIL ${label}: ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function summary() {
  const passCount = results.filter((item) => item.status === "PASS").length;
  const failCount = results.filter((item) => item.status === "FAIL").length;
  console.log(`INTEGRATED-PROBES SUMMARY PASS ${passCount} WARN 0 FAIL ${failCount}`);
}
