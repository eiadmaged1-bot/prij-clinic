import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("DOCTOR-UX");
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

async function main() {
  await waitForApi();

  const iconSource = `${await readFile("apps/web/components/ThreeDMedicalIcon.tsx", "utf8")}\n${await readFile("apps/web/lib/app-icons.ts", "utf8")}`;
  for (const icon of ["dashboard", "patients", "queue", "encounters", "prescriptions", "investigations", "reports", "pregnancy", "ultrasound", "billing", "consents", "doctor-mode", "backup-restore", "security"]) {
    if (!iconSource.includes(icon)) throw new Error(`3D medical icon missing: ${icon}`);
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

  const patientSource = `${await readFile("apps/web/app/patients/[id]/page.tsx", "utf8")}\n${await readFile("apps/web/app/navigation-registry.ts", "utf8")}`;
  for (const label of ["Summary", "Medical", "Clinical", "Appointments", "Queue", "Encounters", "Prescriptions", "Investigations", "Reports", "Pregnancy", "Ultrasound", "Gynecology", "Billing", "Consents", "Files", "AI Snapshot", "Protocol Atlas", "Calculators", "Medications", "Allergies", "Herbal/Supplements", "Medication Safety", "Prescription Safety", "Timeline", "Start Visit"]) {
    if (!patientSource.includes(label)) throw new Error(`Simplified patient file label missing: ${label}`);
  }
  record.pass("patient file simplified tabs and actions are implemented");

  for (const label of [
    "Pregnancy Overview",
    "Obstetric History",
    "Antenatal Visits",
    "Visit details",
    "Maternal observations",
    "Fetal observations",
    "Next follow-up",
    "OB ultrasound report builder",
    "Scan details",
    "Pregnancy and fetus context",
    "Biometry recording",
    "Doppler note placeholder",
    "Measurements are recorded for clinician review. Interpretation must be completed by the doctor.",
    "Doctor Templates",
    "Print patient summary",
    "Print antenatal summary",
    "Print ultrasound report"
  ]) {
    if (!patientSource.includes(label)) throw new Error(`OB/GYN workspace label missing: ${label}`);
  }
  record.pass("OB/GYN patient workspace and report builder are implemented");

  for (const forbidden of ["FGR", "fetal growth restriction", "percentile engine"]) {
    if (patientSource.includes(forbidden)) throw new Error(`Patient OB/GYN workspace includes forbidden wording: ${forbidden}`);
  }
  record.pass("OB/GYN patient workspace avoids fetal growth automation wording");

  const shellSource = `${await readFile("apps/web/app/mvp-page.tsx", "utf8")}\n${await readFile("apps/web/app/navigation-registry.ts", "utf8")}`;
  for (const label of ["Comfort", "Large", "Compact", "Magnify", "Doctor Mode"]) {
    if (!shellSource.includes(label)) throw new Error(`Comfort or role navigation label missing: ${label}`);
  }
  record.pass("elder-friendly visual preferences are present");

  const protocolAdminSource = await readFile("apps/web/app/admin/protocol-atlas/page.tsx", "utf8");
  for (const label of ["Structured Protocol Editor", "Source metadata", "Aliases", "Structured content", "Doctor preview after verification", "Verify protocol"]) {
    if (!protocolAdminSource.includes(label)) throw new Error(`Protocol editor missing label: ${label}`);
  }
  for (const forbidden of ["contentJson", "Prisma", "raw JSON editor"]) {
    if (protocolAdminSource.includes(forbidden)) throw new Error(`Protocol editor exposes technical wording: ${forbidden}`);
  }
  if (!protocolAdminSource.includes("disabled={!canVerify}")) throw new Error("Verify button is not gated by requirements.");
  record.pass("admin structured protocol editor renders safely");

  const protocolBrowserSource = await readFile("apps/web/components/protocol-atlas/ProtocolAtlasBrowser.tsx", "utf8");
  for (const label of ["Verified only", "Verified snapshot available", "Listed in the atlas, but management snapshot is not verified yet", "status-count-row"]) {
    if (!protocolBrowserSource.includes(label)) throw new Error(`Protocol atlas browser missing safety/filter label: ${label}`);
  }
  record.pass("protocol atlas browser includes counts filters and safety messages");

  const aiPanelSource = await readFile("apps/web/components/ai-management/ManagementSnapshotPanel.tsx", "utf8");
  if (!aiPanelSource.includes("Draft support only") || !aiPanelSource.includes("doctor must verify and approve")) {
    throw new Error("AI Snapshot panel safety wording missing.");
  }
  record.pass("AI Snapshot panel safety wording remains visible");

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

  const pages = ["/login", "/dashboard", "/doctor", "/doctor/visit", "/patients", "/patients/new", `/patients/${patient.id}`, "/protocol-atlas", "/admin", "/admin/appearance", "/admin/protocol-atlas"];
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
