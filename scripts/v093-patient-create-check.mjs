import { readFile } from "node:fs/promises";
import { API_URL, apiJson, waitForApi } from "./security-route-manifest.mjs";

const WEB_URL = (process.env.WEB_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const ALLOW_ENV_SKIP = process.env.V093_ALLOW_ENV_SKIP === "1";
const results = [];

function record(status, label, detail = "") {
  results.push({ status, label, detail });
  const suffix = detail ? ` - ${detail}` : "";
  const writer = status === "FAIL" ? console.error : status === "WARN" ? console.warn : console.log;
  writer(`V093-PATIENT ${status} ${label}${suffix}`);
}

function isEnvironmentBlocker(error) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return /fetch failed|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|API did not become ready|P1001|P1002|PrismaClientInitializationError|database|postgres|postgresql|docker|connect/i.test(message);
}

function printEnvironmentBlocker(error) {
  const message = error instanceof Error ? error.message : String(error);
  const status = ALLOW_ENV_SKIP ? "WARN" : "FAIL";
  record(status, "ENVIRONMENT BLOCKER", message);
  console.error("");
  console.error("V093-PATIENT ENVIRONMENT BLOCKER");
  console.error(`API health must be reachable at ${API_URL}/health.`);
  console.error("Docker Desktop, PostgreSQL, Prisma client repair, seeded demo data, and the local API are required.");
  console.error("Run later from the repository root:");
  console.error("  docker compose up -d postgres");
  console.error("  npm run prisma:repair");
  console.error("  npm run prisma:seed");
  console.error("  npm run dev");
  console.error("  npm run test:v093:patient-create");
  if (ALLOW_ENV_SKIP) {
    console.warn("");
    console.warn("V093-PATIENT SKIP/WARN V093_ALLOW_ENV_SKIP=1 is set.");
    console.warn("This is not release-validating. The release tag is forbidden until this check passes without V093_ALLOW_ENV_SKIP.");
  }
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

async function fetchWorkspace(patientId) {
  const response = await fetch(`${WEB_URL}/patients/${patientId}`, { headers: { Accept: "text/html" } });
  const text = await response.text();
  if (response.status >= 500) throw new Error(`workspace returned ${response.status}`);
  if (response.status === 404) throw new Error("workspace route returned 404");
  return { status: response.status, text };
}

async function main() {
  await waitForApi();
  record("PASS", "API health is available");

  const login = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const token = login.token;
  if (!token) throw new Error("local demo owner login did not return token");
  record("PASS", "local demo owner login");

  const runId = Date.now();
  const patient = await apiJson("POST", "/patients", token, {
    medicalRecordNumber: `DEMO-V093-${runId}`,
    firstName: "Demo",
    lastName: "AutomatedQa",
    phone: "0000000000",
    email: `demo.v093.${runId}@example.local`,
    notes: "Fake local v0.9.3 automated QA patient only. Not real patient data."
  });
  if (!patient.id) throw new Error("patient create did not return id");
  record("PASS", "patient creation returned id", patient.id);

  const detail = await apiJson("GET", `/patients/${patient.id}`, token);
  if (detail.id !== patient.id) throw new Error("patient detail fetch did not return created patient");
  record("PASS", "patient detail fetch");

  const source = `${await readFile("apps/web/app/patients/[id]/page.tsx", "utf8")}\n${await readFile("apps/web/app/navigation-registry.ts", "utf8")}`;
  for (const label of ["Summary", "Medical", "Clinical", "Appointments", "Encounters", "Prescriptions", "Orders", "Reports", "Pregnancy", "Ultrasound", "Billing", "Consents", "AI Drafts", "Protocol Atlas", "Calculators", "Medications", "Allergies", "Medication Safety", "Timeline"]) {
    if (!source.includes(label)) throw new Error(`patient workspace tab source missing ${label}`);
  }
  record("PASS", "patient workspace tab visibility source check");

  try {
    const workspace = await fetchWorkspace(patient.id);
    const text = visibleText(workspace.text);
    if (!/Patient file|Loading patient details/i.test(text)) throw new Error("workspace did not render patient shell text");
    const conflictMarkerPattern = new RegExp(`Unhandled Runtime Error|PrismaClientKnownRequestError|<{7}|>{7}`, "i");
    if (conflictMarkerPattern.test(workspace.text)) throw new Error("workspace contains crash text");
    record("PASS", "patient workspace route exists", `/patients/${patient.id} status ${workspace.status}`);
  } catch (error) {
    record("FAIL", "patient workspace route", error instanceof Error ? error.message : String(error));
  }
}

await main().catch((error) => {
  if (isEnvironmentBlocker(error)) {
    printEnvironmentBlocker(error);
    return;
  }
  record("FAIL", "patient creation flow", error instanceof Error ? error.message : String(error));
});

const pass = results.filter((item) => item.status === "PASS").length;
const warn = results.filter((item) => item.status === "WARN").length;
const fail = results.filter((item) => item.status === "FAIL").length;
console.log(`V093-PATIENT SUMMARY PASS ${pass} WARN ${warn} FAIL ${fail}`);
if (fail > 0) process.exitCode = 1;
