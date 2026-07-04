import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const checks = [];
const failures = [];

await checkRoutes();
await checkPatientCreationCoverage();
await checkPatientWorkspace();
await checkClinicOperationsNavigation();
await checkNoCodeLikeUi();
await checkClinicalSafetyWording();

if (failures.length) {
  throw new Error(failures.join("\n"));
}

console.log(`V141-MEGA-MANUAL-QA-SMOKE PASS ${JSON.stringify({ checks })}`);

async function checkRoutes() {
  for (const route of [
    ["login route/page", "apps/web/app/login/page.tsx", true],
    ["patients page", "apps/web/app/patients/page.tsx", true],
    ["reception page", "apps/web/app/reception/page.tsx", true],
    ["reception today page", "apps/web/app/reception/today/page.tsx", false],
    ["reception check-in page", "apps/web/app/reception/check-in/page.tsx", false],
    ["doctor waiting page", "apps/web/app/doctor/waiting/page.tsx", true]
  ]) {
    const [label, path, required] = route;
    if (existsSync(path)) {
      assert((await read(path)).trim().length > 0, `${label} is empty`);
      checks.push(`${label} exists`);
    } else if (required) {
      fail(`${label} missing at ${path}`);
    } else {
      checks.push(`${label} not implemented`);
    }
  }

  const adminServicesPage = existsSync("apps/web/app/admin/services/page.tsx");
  const routeManifest = existsSync("scripts/security-route-manifest.mjs")
    ? await read("scripts/security-route-manifest.mjs")
    : "";
  assert(adminServicesPage || routeManifest.includes("/admin/services"), "admin services page is not present or represented in route manifest");
  checks.push("admin services route is present or manifest-covered");
}

async function checkPatientCreationCoverage() {
  const newPatient = await read("apps/web/app/patients/new/page.tsx");
  const helperCoverage = await readIfExists("tests/v094/helpers.ts");
  const previousSmoke = await readIfExists("scripts/v093-patient-create-check.mjs");
  const premiumSmoke = await readIfExists("scripts/premium-workflow-test.mjs");
  const combined = [newPatient, helperCoverage, previousSmoke, premiumSmoke].join("\n");

  assertIncludes(newPatient, "router.push(`/patients/${patient.id}`)", "patient creation opens workspace");
  assert(/POST["'`)]?,?\s*["'`]\/patients|fetch\(`\$\{getApiBaseUrl\(\)\}\/patients`/.test(newPatient), "new patient page does not post to patients API");
  assert(/create.*patient|patient.*creation|patients\/new|patient-create/i.test(combined), "patient creation flow is not covered by existing helpers or smoke scripts");
  checks.push("patient creation flow remains covered without creating runtime data");
}

async function checkPatientWorkspace() {
  const patientPage = await read("apps/web/app/patients/[id]/page.tsx");
  for (const label of ["Doctor Visit", "Gynecology", "Pregnancy", "Documents", "Timeline", "Billing"]) {
    assertIncludes(patientPage, `label: "${label}"`, `patient workspace tab ${label}`);
  }
  checks.push("patient workspace includes required clinical, document, timeline, and billing tabs");
}

async function checkClinicOperationsNavigation() {
  const nav = await readIfExists("apps/web/app/navigation-registry.ts");
  const dashboard = await readIfExists("apps/web/app/dashboard/page.tsx");
  const home = await readIfExists("apps/web/app/page.tsx");
  const doctor = await readIfExists("apps/web/app/doctor/page.tsx");
  const receptionToday = await readIfExists("apps/web/app/reception/today/page.tsx");
  const combined = [nav, dashboard, home, doctor, receptionToday].join("\n");

  for (const route of ["/reception", "/reception/today", "/reception/check-in", "/queue", "/calendar", "/doctor/waiting"]) {
    assert(combined.includes(route), `clinic operations route missing from navigation or linked route surfaces: ${route}`);
  }
  checks.push("new clinic operations routes are linked from navigation or route surfaces");
}

async function checkNoCodeLikeUi() {
  const files = [
    "apps/web/app/login/page.tsx",
    "apps/web/app/patients/page.tsx",
    "apps/web/app/patients/new/page.tsx",
    "apps/web/app/patients/[id]/page.tsx",
    "apps/web/app/reception/page.tsx",
    "apps/web/app/reception/today/page.tsx",
    "apps/web/app/reception/check-in/page.tsx",
    "apps/web/app/queue/page.tsx",
    "apps/web/app/calendar/page.tsx",
    "apps/web/app/doctor/page.tsx",
    "apps/web/app/doctor/waiting/page.tsx",
    "apps/web/app/doctor/visit/page.tsx",
    "apps/web/app/documents/page.tsx",
    "apps/web/app/billing/page.tsx",
    "apps/web/app/admin/services/page.tsx"
  ];
  const forbidden = [
    /raw JSON/i,
    /\bPrisma\b/,
    /schema\.prisma/i,
    /\bJWT\b/,
    /stack trace/i,
    /API route/i,
    /developer label/i,
    /<pre><code>/i
  ];

  for (const file of files) {
    if (!existsSync(file)) continue;
    const text = await read(file);
    for (const pattern of forbidden) {
      assert(!pattern.test(text), `${file} has code-like UI text matching ${pattern}`);
    }
  }
  checks.push("normal UI surfaces avoid raw JSON and code-like wording");
}

async function checkClinicalSafetyWording() {
  const scannedFiles = [
    "apps/web/app/patients/[id]/page.tsx",
    "apps/web/app/doctor/visit/page.tsx",
    "apps/web/app/pregnancy/page.tsx",
    "apps/web/app/pregnancies/page.tsx",
    "apps/web/app/ob-ultrasounds/page.tsx",
    "apps/web/app/ultrasound/page.tsx",
    "apps/web/app/prescriptions/page.tsx",
    "apps/web/app/medications/page.tsx",
    "apps/web/app/medications/search/page.tsx",
    "apps/web/app/medications/safety/page.tsx",
    "apps/web/components/care-assist/MedicationSafetyProfileSearch.tsx",
    "apps/web/components/medications/MedicationComponents.tsx",
    "apps/web/components/medications/MedicationSafetyTerminal.tsx",
    "apps/web/components/medications/PregnancyLactationSafetyProfile.tsx"
  ];

  const unsafeClinical = [
    /safe in pregnancy/i,
    /recommended drug/i,
    /prescribe this/i,
    /automatic diagnosis/i,
    /automatic FGR/i,
    /fetal image diagnosis/i
  ];
  const doseAutofill = [
    /auto[-\s]?fill.{0,80}\bdose\b/i,
    /auto[-\s]?fill.{0,80}\bfrequency\b/i,
    /auto[-\s]?fill.{0,80}\bduration\b/i,
    /\bdose\/frequency\/duration\s+auto/i,
    /automatically.{0,80}\bdose\b/i
  ];
  const commerceWording = [/\bstock\b/i, /\bcart\b/i, /\bcheckout\b/i, /\bsales\b/i, /pharmacy stock/i];

  for (const file of scannedFiles) {
    if (!existsSync(file)) continue;
    const text = await read(file);
    for (const pattern of [...unsafeClinical, ...doseAutofill]) {
      assert(!pattern.test(text), `${file} has unsafe clinical wording matching ${pattern}`);
    }
    if (/medication|prescription|safety|care-assist/i.test(file)) {
      for (const pattern of commerceWording) {
        assert(!pattern.test(text), `${file} has pharmacy commerce wording matching ${pattern}`);
      }
    }
  }
  checks.push("clinical safety wording avoids unsafe automation, dosing, and pharmacy commerce language");
}

async function read(path) {
  return readFile(path, "utf8");
}

async function readIfExists(path) {
  return existsSync(path) ? read(path) : "";
}

function assertIncludes(source, needle, message) {
  assert(source.includes(needle), `${message}: missing ${needle}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function fail(message) {
  failures.push(message);
}
