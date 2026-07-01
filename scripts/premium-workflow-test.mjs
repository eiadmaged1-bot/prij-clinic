import { readFile } from "node:fs/promises";
import { apiJson, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("PREMIUM-WORKFLOW");

function includesAll(source, labels, context) {
  for (const label of labels) {
    if (!source.includes(label)) throw new Error(`${context} missing ${label}`);
  }
}

function excludesAll(source, labels, context) {
  for (const label of labels) {
    if (source.toLowerCase().includes(label.toLowerCase())) throw new Error(`${context} includes forbidden wording: ${label}`);
  }
}

async function main() {
  await waitForApi();

  const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
  includesAll(shell, ["Dashboard", "Doctor workflow", "Medications", "Admin / Owner Control", "Local Demo", "New Patient", "Patient search"], "premium shell");
  excludesAll(shell, ["Prisma", "JWT", "RBAC", "raw JSON", "stack trace"], "premium shell");
  record.pass("premium shell and navigation wording are visible");

  const login = await readFile("apps/web/app/login/page.tsx", "utf8");
  includesAll(login, ["Prij Clinic", "Use Owner Demo Login", "Local demo only", 'demoEmail = "eyad"'], "login page");
  record.pass("premium login and owner demo shortcut are visible");

  const dashboard = await readFile("apps/web/app/dashboard/page.tsx", "utf8");
  includesAll(dashboard, ["Clinic Home", "Front desk home", "Daily finance", "Official rows", "8,269", "1,200", "7,069", "Restore drill"], "dashboard");
  record.pass("role-aware dashboard source includes clinic operations cards");

  const patientNew = await readFile("apps/web/app/patients/new/page.tsx", "utf8");
  includesAll(patientNew, ["Full name", "Age if DOB unknown", "Address", "National ID", "Source / referral", "router.push(`/patients/${patient.id}`)"], "patient create page");
  record.pass("patient creation flow fields and redirect are present");

  const patientFile = await readFile("apps/web/app/patients/[id]/page.tsx", "utf8");
  includesAll(patientFile, ["Patient file workspace", "New Encounter", "New Appointment", "New Order", "New Invoice", "Summary", "Medical", "Clinical", "Orders", "Consents", "Medication Safety", "Timeline"], "patient workspace");
  record.pass("central patient workspace tabs and actions are present");

  const admin = await readFile("apps/web/app/admin/page.tsx", "utf8");
  includesAll(admin, ["Owner Control Center", "Medication Data Operations", "Backup and Export Status", "Safe Force Actions", "Service Catalog and Prices", "Audit Log Viewer"], "owner control");
  record.pass("owner control center includes visible control sections");

  const medication = `${await readFile("apps/web/app/medications/page.tsx", "utf8")}\n${await readFile("apps/web/app/drug-market/page.tsx", "utf8")}\n${await readFile("apps/web/components/medications/MedicationComponents.tsx", "utf8")}`;
  includesAll(medication, ["Official medication reference", "Official Medicine Data", "8,269", "1,200", "7,069", "Official Medicine Search", "Verified", "Needs review"], "medication reference");
  excludesAll(medication, ["Official/source price", "Official listed price", "Source price", "Import run", "Parser confidence", "Official row fields", "Row preview", "how-to-take", "checkout", "purchase", "Pharmacy stock"], "medication reference");
  record.pass("medication UI shows official status without patient-use or commerce wording");

  const orders = await readFile("apps/web/app/orders/page.tsx", "utf8");
  includesAll(orders, ["Orders Workspace", "Lab orders", "radiology orders", "service orders", "pending result"], "orders page");
  record.pass("orders skeleton route is visible");

  const consents = await readFile("apps/web/app/consents/page.tsx", "utf8");
  includesAll(consents, ["Consent Workspace", "draft", "signed", "voided", "signature", "print-friendly"], "consent page");
  record.pass("consent legal document skeleton is visible");

  const adminLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const patient = await apiJson("POST", "/patients", adminLogin.token, {
    medicalRecordNumber: `DEMO-PREMIUM-${Date.now()}`,
    firstName: "Demo",
    lastName: "PremiumWorkflow",
    notes: "Premium workflow test patient only."
  });
  if (!patient.id) throw new Error("Patient creation did not return an id.");
  record.pass("API patient creation remains functional for the UI flow");
}

await main().catch((error) => record.fail("premium workflow", error));
record.summary();
