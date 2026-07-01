import { API_URL, apiJson, apiStatus, demoUsers, login, waitForApi } from "./security-route-manifest.mjs";

const ALLOW_ENV_SKIP = process.env.V093_ALLOW_ENV_SKIP === "1";
const results = [];

function record(status, label, detail = "") {
  results.push({ status, label, detail });
  const suffix = detail ? ` - ${detail}` : "";
  const writer = status === "FAIL" ? console.error : status === "WARN" ? console.warn : console.log;
  writer(`V093-ROLES ${status} ${label}${suffix}`);
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
  console.error("V093-ROLES ENVIRONMENT BLOCKER");
  console.error(`API health must be reachable at ${API_URL}/health.`);
  console.error("Docker Desktop, PostgreSQL, Prisma client repair, seeded demo data, and the local API are required.");
  console.error("Run later from the repository root:");
  console.error("  docker compose up -d postgres");
  console.error("  npm run prisma:repair");
  console.error("  npm run prisma:seed");
  console.error("  npm run dev");
  console.error("  npm run test:v093:roles");
  if (ALLOW_ENV_SKIP) {
    console.warn("");
    console.warn("V093-ROLES SKIP/WARN V093_ALLOW_ENV_SKIP=1 is set.");
    console.warn("This is not release-validating. The release tag is forbidden until this check passes without V093_ALLOW_ENV_SKIP.");
  }
}

function expect(actual, expected, label) {
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (!expectedList.includes(actual)) {
    throw new Error(`${label} expected ${expectedList.join("/")} but received ${actual}`);
  }
}

async function main() {
  await waitForApi();
  record("PASS", "API health is available");

  const ownerLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const owner = ownerLogin.token;
  if (!owner) throw new Error("owner login did not return token");
  record("PASS", "owner/admin login");

  const doctor = await login(demoUsers.doctor);
  const reception = await login(demoUsers.reception);
  const accountant = await login(demoUsers.accountant);
  record("PASS", "seeded doctor/reception/accountant logins");

  expect(await apiStatus("GET", "/admin/accounts", owner), [200], "owner /admin/accounts");
  expect(await apiStatus("GET", "/drug-market/review-queue", owner), [200], "owner drug market review queue");
  record("PASS", "owner/admin can access admin account and drug-market review APIs");

  for (const [path, expected] of [
    ["/protocol-atlas/groups", [200]],
    ["/calculators/formulas", [200]],
    ["/medications/families", [200]],
    ["/ai-drafts", [200, 403]]
  ]) {
    expect(await apiStatus("GET", path, doctor), expected, `doctor ${path}`);
  }
  record("PASS", "doctor can access feasible clinical reference APIs");

  const deniedReadPaths = [
    "/admin/accounts",
    "/admin/roles",
    "/admin/permissions",
    "/drug-market/review-queue",
    "/drug-market/automation/coverage",
    "/drug-market/import/jobs",
    "/guidelines/query-logs",
    "/protocol-atlas/groups",
    "/ai-drafts"
  ];
  for (const token of [reception, accountant]) {
    for (const path of deniedReadPaths) {
      expect(await apiStatus("GET", path, token), [403, 404], `non-clinical ${path}`);
    }
  }
  record("PASS", "receptionist/accountant denied sensitive admin, guideline, protocol, and AI APIs");

  const medicationSafetyBody = {
    patientId: "demo-denied",
    medications: [{ displayName: "Demo reference item", family: "demo" }]
  };
  for (const token of [reception, accountant]) {
    expect(await apiStatus("POST", "/medications/safety-check", token, medicationSafetyBody), [403, 404], "non-clinical medication safety");
  }
  record("PASS", "receptionist/accountant denied medication safety endpoint");

  const calculatorBody = { formulaCode: "BMI", input: { weightKg: 70, heightCm: 170 }, sourceContext: "v093-role-check" };
  expect(await apiStatus("POST", "/calculators/calculate", accountant, calculatorBody), [403, 404], "accountant calculator calculate");
  record("PASS", "accountant denied clinical calculator execution");
}

await main().catch((error) => {
  if (isEnvironmentBlocker(error)) {
    printEnvironmentBlocker(error);
    return;
  }
  record("FAIL", "role visibility regression", error instanceof Error ? error.message : String(error));
});

const pass = results.filter((item) => item.status === "PASS").length;
const warn = results.filter((item) => item.status === "WARN").length;
const fail = results.filter((item) => item.status === "FAIL").length;
console.log(`V093-ROLES SUMMARY PASS ${pass} WARN ${warn} FAIL ${fail}`);
if (fail > 0) process.exitCode = 1;
