import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";
import { readFile } from "node:fs/promises";

const record = makeRecorder("VISUAL-QA");
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

const normalPages = [
  "/login",
  "/dashboard",
  "/doctor",
  "/doctor/visit",
  "/patients",
  "/patients/new",
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
  "/protocol-atlas"
];

const blockedWords = [
  /\bRBAC\b/i,
  /\bJWT\b/i,
  /\bPrisma\b/i,
  /\bschema\b/i,
  /\bpayload\b/i,
  /\bendpoint\b/i,
  /API route/i,
  /\bmock\b/i,
  /\bseed(?:ed)?\b/i,
  /stack trace/i,
  /raw JSON/i,
  /permission matrix/i,
  /\btsbuild\b/i
];

const requiredText = {
  "/login": ["Dr Maged Attia Clinics", "Sign in", "Use Owner Login"],
  "/dashboard": ["Clinic Home", "Quick actions"],
  "/doctor": ["Doctor Mode", "Open Patient", "Start Visit", "Waiting patients"],
  "/doctor/visit": ["Guided Visit", "Save Draft"],
  "/patients": ["Patient files", "New Patient File", "Search patient files"],
  "/patients/new": ["New patient file", "Save and open patient file"],
  "/admin": ["Owner Control Center", "Access Overview"],
  "/admin/appearance": ["Appearance", "Set as default"],
  "/admin/accounts": ["Accounts", "Create account", "Permission"],
  "/admin/protocol-atlas": ["Structured Protocol Editor", "Use structured fields only"]
};

async function fetchHtml(page) {
  const response = await fetch(`${webUrl}${page}`);
  if (response.status !== 200) throw new Error(`${page} returned ${response.status}`);

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (contentType.includes("application/json") || /^\s*[{[]/.test(text)) {
    throw new Error(`${page} returned data instead of the app page.`);
  }
  return text;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function assertNoTechnicalText(page, html) {
  const text = visibleText(html);
  for (const pattern of blockedWords) {
    if (pattern.test(text)) throw new Error(`${page} contains technical wording matching ${pattern}.`);
  }
}

function assertLayout(page, html) {
  const text = visibleText(html);
  const hasMainLayout = /app-shell|login-shell|hero-shell|page centered/.test(html);
  if (!hasMainLayout) throw new Error(`${page} did not render the expected main layout.`);

  if (page !== "/login" && !/nav-item|Doctor Mode|Patient files/.test(html)) {
    throw new Error(`${page} did not render visible navigation.`);
  }

  for (const expected of requiredText[page] ?? []) {
    if (!text.includes(expected)) throw new Error(`${page} is missing "${expected}".`);
  }
}

async function main() {
  await waitForApi();

  const adminLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const adminToken = adminLogin.token;
  if (!adminToken) throw new Error("Local owner login did not return a token.");

  const reception = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/settings/appearance", reception), 403, "non-admin appearance settings");
  assertStatus(await apiStatus("GET", "/admin/accounts", reception), 403, "non-admin accounts settings");
  record.pass("appearance and accounts settings remain protected from non-admin staff");

  const patient = await apiJson("POST", "/patients", adminToken, {
    medicalRecordNumber: `QA-VISUAL-${Date.now()}`,
    firstName: "QA",
    lastName: "VisualQA",
    notes: "Visual QA patient only."
  });

  const createdFromPage = await apiJson("POST", "/patients", adminToken, {
    medicalRecordNumber: `QA-CREATE-${Date.now()}`,
    firstName: "QA",
    lastName: "CreatedFromWorkflow",
    notes: "Patient creation workflow test only."
  });
  const createdPatientHtml = await fetchHtml(`/patients/${createdFromPage.id}`);
  if (!visibleText(createdPatientHtml).includes("Patient file")) {
    throw new Error("Created patient did not open as a patient workspace page.");
  }
  const newPatientSource = await readFile("apps/web/app/patients/new/page.tsx", "utf8");
  if (!newPatientSource.includes("router.push(`/patients/${patient.id}`)")) throw new Error("New patient form does not redirect to the patient workspace.");
  record.pass("patient creation opens the patient workspace");

  const pages = [...normalPages, `/patients/${patient.id}`, "/admin", "/admin/appearance", "/admin/accounts", "/admin/protocol-atlas"];
  for (const page of pages) {
    const html = await fetchHtml(page);
    assertLayout(page, html);
    if (!page.startsWith("/admin")) assertNoTechnicalText(page, html);
  }
  record.pass("normal pages return 200 with app layout and friendly visible wording");

  const protocolHtml = await fetchHtml("/protocol-atlas");
  for (const label of ["Protocol Atlas", "Verified only", "Catalog-only", "Doctor review required"]) {
    if (!visibleText(protocolHtml).includes(label)) throw new Error(`Protocol atlas page missing ${label}.`);
  }
  assertNoTechnicalText("/protocol-atlas", protocolHtml);
  const adminProtocolHtml = await fetchHtml("/admin/protocol-atlas");
  for (const forbidden of ["contentJson", "Prisma", "endpoint", "model"]) {
    if (visibleText(adminProtocolHtml).includes(forbidden)) throw new Error(`Admin protocol editor shows technical wording: ${forbidden}.`);
  }
  record.pass("protocol and AI safety screens avoid code-like text");

  const doctorHtml = await fetchHtml("/doctor");
  for (const label of ["Open Patient", "Start Visit", "Waiting patients"]) {
    if (!visibleText(doctorHtml).includes(label)) throw new Error(`Doctor Mode missing ${label}.`);
  }
  if (!/medical-icon/.test(doctorHtml)) throw new Error("Doctor Mode did not render medical icons.");
  for (const label of ["OB/GYN Templates", "New pregnancy booking", "Ultrasound visit"]) {
    if (!visibleText(doctorHtml).includes(label)) throw new Error(`Doctor Mode missing OB/GYN template label ${label}.`);
  }
  record.pass("doctor mode cards and icon labels are visible");

  const patientHtml = await fetchHtml(`/patients/${patient.id}`);
  for (const label of ["Patient file", "New Encounter"]) {
    if (!visibleText(patientHtml).includes(label)) throw new Error(`Patient file missing ${label}.`);
  }
  const patientSource = `${await readFile("apps/web/app/patients/[id]/page.tsx", "utf8")}\n${await readFile("apps/web/app/navigation-registry.ts", "utf8")}`;
  for (const label of [
    "Summary",
    "Medical",
    "Clinical",
    "Appointments",
    "Encounters",
    "Prescriptions",
    "Orders",
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
    "Medication Safety",
    "Timeline",
    "Pregnancy Overview",
    "Antenatal Visits",
    "Visit details",
    "Save Visit",
    "OB ultrasound report builder",
    "Scan details",
    "Biometry recording",
    "Print patient summary",
    "Print antenatal summary",
    "Print ultrasound report"
  ]) {
    if (!patientSource.includes(label)) throw new Error(`Patient file tab source missing ${label}.`);
  }
  for (const forbidden of ["FGR", "fetal growth restriction", "percentile engine"]) {
    if (patientSource.includes(forbidden)) throw new Error(`Patient file source includes forbidden automation wording: ${forbidden}.`);
  }
  record.pass("patient file tabs and primary actions are visible");

  for (const forbidden of ["Pregnancy/OB", "General Gynecology", "AI Snapshot", "Billing/Finance", "Raw JSON", "Prisma", "JWT", "RBAC"]) {
    if (patientSource.includes(forbidden)) throw new Error(`Patient workspace contains outdated or technical wording: ${forbidden}.`);
  }
  record.pass("patient workspace avoids outdated and code-like labels");

  const shellSource = await readFile("apps/web/app/mvp-page.tsx", "utf8");
  for (const adminHref of ["/admin/medications", "/admin/drug-market", "/admin/protocol-atlas"]) {
    if (!shellSource.includes("navigationRegistry")) throw new Error("App shell is not using the canonical navigation registry.");
    if (!shellSource.includes("adminOnly")) throw new Error("Admin navigation visibility is not driven by admin-only metadata.");
    if (!adminHref.includes("/admin/")) throw new Error("admin visibility check setup failed");
  }
  const medicationSource = await readFile("scripts/medication-intelligence-test.mjs", "utf8");
  if (!medicationSource.includes("receptionist and accountant cannot access clinical medication safety")) {
    throw new Error("Medication safety role-visibility regression is missing.");
  }
  record.pass("admin and medication safety visibility checks are covered");
}

await main().catch((error) => record.fail("visual QA sweep", error));
record.summary();
