import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("DOCTOR-UX");
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

async function main() {
  await waitForApi();

  const iconSource = await readFile("apps/web/components/ThreeDMedicalIcon.tsx", "utf8");
  for (const icon of ["dashboard", "patients", "queue", "encounter", "prescription", "investigations", "reports", "pregnancy", "ultrasound", "billing", "consent", "doctor"]) {
    if (!iconSource.includes(`${icon}:`)) throw new Error(`3D medical icon missing: ${icon}`);
  }
  record.pass("3D medical icon system includes required modules");

  const doctorSource = await readFile("apps/web/app/doctor/page.tsx", "utf8");
  for (const label of ["Doctor Mode", "Today&apos;s visits", "Open Patient", "Start Visit", "Waiting patients"]) {
    if (!doctorSource.includes(label)) throw new Error(`Doctor dashboard missing label: ${label}`);
  }
  record.pass("doctor-friendly simple mode is implemented");

  const visitSource = await readFile("apps/web/app/doctor/visit/page.tsx", "utf8");
  for (const step of ["Complaint", "History", "Examination", "Impression", "Prescription", "Orders", "Follow-up", "Finish Visit"]) {
    if (!visitSource.includes(step)) throw new Error(`Guided visit step missing: ${step}`);
  }
  record.pass("guided visit workflow steps are implemented");

  const patientSource = await readFile("apps/web/app/patients/[id]/page.tsx", "utf8");
  for (const label of ["Overview", "Visits", "Prescriptions", "Orders & Reports", "Pregnancy", "Billing", "Files", "Timeline", "Start Visit"]) {
    if (!patientSource.includes(label)) throw new Error(`Simplified patient file label missing: ${label}`);
  }
  record.pass("patient file simplified tabs and actions are implemented");

  const shellSource = await readFile("apps/web/app/mvp-page.tsx", "utf8");
  for (const label of ["Comfort", "Large", "Compact", "Doctor Mode"]) {
    if (!shellSource.includes(label)) throw new Error(`Comfort or role navigation label missing: ${label}`);
  }
  record.pass("elder-friendly visual preferences are present");

  const adminLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const admin = adminLogin.token;
  if (!admin) throw new Error("eyad login did not return token.");
  const reception = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/settings/appearance", reception), 403, "non-admin appearance settings");
  record.pass("admin tools remain protected from non-admin users");

  const patient = await apiJson("POST", "/patients", admin, {
    medicalRecordNumber: `DEMO-UX-${Date.now()}`,
    firstName: "Demo",
    lastName: "DoctorUX",
    notes: "Doctor-friendly UI test patient only."
  });

  const pages = ["/login", "/dashboard", "/doctor", "/doctor/visit", "/patients", "/patients/new", `/patients/${patient.id}`, "/admin", "/admin/appearance"];
  for (const page of pages) {
    const response = await fetch(`${webUrl}${page}`);
    if (response.status !== 200) throw new Error(`${page} returned ${response.status}`);
    const html = await response.text();
    if (!page.startsWith("/admin") && /(stack trace|mock response|Prisma|\bJWT\b|\bRBAC\b|schema|database error|raw JSON|\bAPI\b|localhost)/i.test(html)) {
      throw new Error(`${page} contains technical wording.`);
    }
  }
  record.pass("doctor-friendly pages return 200 without obvious technical text");
}

await main().catch((error) => record.fail("doctor-friendly UI", error));
record.summary();
