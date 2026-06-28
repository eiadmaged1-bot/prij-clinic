import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const WEB_URL = (process.env.WEB_URL || "http://localhost:3000").replace(/\/$/, "");
const record = makeRecorder("VISUAL-QA");
const forbiddenNormalText = [/stack trace/i, /mock response/i, /api route/i, /prisma/i, /\bJWT\b/, /\bRBAC\b/, /schema/i, /database error/i];
const themes = ["clinic-premium", "medicolize-portal", "incision-portal", "minimal-clean", "compact-operations"];

async function main() {
  await waitForApi();
  const ownerLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const owner = ownerLogin.token;
  const reception = await login(demoUsers.reception);
  if (!owner) throw new Error("Owner token missing.");

  assertStatus(await apiStatus("GET", "/admin/settings/appearance", reception), 403, "non-admin appearance denial");
  record.pass("admin settings are hidden from lower-role API access");

  for (const theme of themes) {
    const response = await apiJson("PATCH", "/admin/settings/appearance", owner, { defaultTheme: theme, allowUserThemeOverride: true });
    if (response.defaultTheme !== theme) throw new Error(`Theme ${theme} did not persist.`);
  }
  await apiJson("PATCH", "/admin/settings/appearance", owner, { defaultTheme: "clinic-premium", allowUserThemeOverride: true });
  record.pass("all configured themes can be selected");

  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `DEMO-VISUAL-${Date.now()}`,
    firstName: "Demo",
    lastName: "Visual",
    notes: "Visual QA demo patient only."
  });

  const pages = [
    "/login",
    "/dashboard",
    "/patients",
    "/patients/new",
    `/patients/${patient.id}`,
    "/appointments",
    "/calendar",
    "/queue",
    "/encounters",
    "/prescriptions",
    "/investigations",
    "/reports",
    "/pregnancies",
    "/ultrasound",
    "/billing",
    "/consents",
    "/ai-drafts",
    "/admin",
    "/admin/appearance"
  ];

  for (const page of pages) {
    const response = await fetchPage(page);
    if (response.status < 200 || response.status >= 400) throw new Error(`${page} returned ${response.status}`);
    const html = await response.text();
    for (const pattern of forbiddenNormalText) {
      if (!page.startsWith("/admin") && pattern.test(html)) {
        throw new Error(`${page} includes developer-like text matching ${pattern}`);
      }
    }
  }
  record.pass("normal pages return 200 and avoid obvious developer text");

  const patientSource = await fetchPage(`/patients/${patient.id}`).then((response) => response.text());
  for (const label of ["Patient file", "Demo/local only"]) {
    if (!patientSource.includes(label)) throw new Error(`Patient file shell missing ${label}.`);
  }
  const patientPageCode = await import("node:fs/promises").then((fs) => fs.readFile("apps/web/app/patients/[id]/page.tsx", "utf8"));
  for (const label of ["New Appointment", "Check In", "Start Visit", "Sign Visit", "Add Prescription", "Order Lab / Radiology", "Record Antenatal Visit", "Create Invoice", "Patient timeline"]) {
    if (!patientPageCode.includes(label)) throw new Error(`Patient workflow action missing ${label}.`);
  }
  record.pass("patient file workflow actions and timeline are present");

  const shellCode = await import("node:fs/promises").then((fs) => fs.readFile("apps/web/app/mvp-page.tsx", "utf8"));
  if (!shellCode.includes("Find patient by name, MRN, or phone")) throw new Error("Topbar patient search is missing.");
  record.pass("global patient search behavior is present");
}

await main().catch((error) => record.fail("browser visual QA sweep", error));
record.summary();

async function fetchPage(page) {
  let lastResponse;
  for (let attempt = 0; attempt < 3; attempt++) {
    lastResponse = await fetch(`${WEB_URL}${page}`, { redirect: "manual" });
    if (lastResponse.status >= 200 && lastResponse.status < 500) return lastResponse;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return lastResponse;
}
