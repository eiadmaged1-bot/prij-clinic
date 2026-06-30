import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("PREMIUM-UI");
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

const themes = ["luxury-clinic", "medicolize-portal", "incision-clean", "compact-operations", "senior-doctor-large", "dark-navy"];
const densities = ["compact", "comfortable", "large", "magnified"];
const patientTabs = [
  "Summary",
  "Medical",
  "Clinical",
  "Appointments",
  "Queue",
  "Encounters",
  "Prescriptions",
  "Medications",
  "Allergies",
  "Investigations",
  "Reports",
  "Pregnancy",
  "Ultrasound",
  "Gynecology",
  "Protocol Atlas",
  "AI Snapshot",
  "Billing",
  "Consents",
  "Files",
  "Timeline"
];

async function main() {
  await waitForApi();

  const registry = await readFile("apps/web/lib/theme-registry.ts", "utf8");
  for (const theme of themes) {
    if (!registry.includes(`"${theme}"`)) throw new Error(`Missing premium theme ${theme}`);
  }
  record.pass("all premium themes are registered");

  const css = `${await readFile("apps/web/styles/design-tokens.css", "utf8")}\n${await readFile("apps/web/app/globals.css", "utf8")}`;
  for (const density of densities) {
    if (!css.includes(`data-density="${density}"`)) throw new Error(`Missing density ${density}`);
  }
  record.pass("all density modes are CSS-variable driven");

  const nav = await readFile("apps/web/app/navigation-registry.ts", "utf8");
  for (const tab of patientTabs) {
    if (!nav.includes(tab)) throw new Error(`Patient tab is missing from registry: ${tab}`);
  }
  record.pass("patient tabs are theme-independent and complete");

  const iconSource = `${await readFile("apps/web/lib/app-icons.ts", "utf8")}\n${await readFile("apps/web/components/ui/AppIcon.tsx", "utf8")}\n${await readFile("apps/web/components/ui/IconBadge3D.tsx", "utf8")}`;
  for (const icon of ["dashboard", "new-patient", "medication-safety", "protocol-atlas", "backup-restore", "security", "whatsapp", "inventory", "analytics"]) {
    if (!iconSource.includes(icon)) throw new Error(`App icon mapping missing: ${icon}`);
  }
  record.pass("premium 3D icon mappings cover active and placeholder modules");

  const shellSource = `${await readFile("apps/web/app/mvp-page.tsx", "utf8")}\n${await readFile("apps/web/components/shell/PremiumShellParts.tsx", "utf8")}`;
  for (const component of ["PremiumSidebar", "PremiumTopbar", "PatientSearchCommand", "RoleAwareNav", "ThemeDensityControls", "UserSessionBadge"]) {
    if (!shellSource.includes(component)) throw new Error(`Shell component missing: ${component}`);
  }
  record.pass("premium shell component boundaries exist");

  const patientSource = `${await readFile("apps/web/app/patients/[id]/page.tsx", "utf8")}\n${await readFile("apps/web/components/patients/PatientWorkspaceShell.tsx", "utf8")}`;
  for (const component of ["PatientWorkspaceShell", "PatientHeader", "PatientTabs", "PatientTimelineRail", "PatientQuickActions", "PatientContextBar"]) {
    if (!patientSource.includes(component)) throw new Error(`Patient workspace component missing: ${component}`);
  }
  record.pass("patient workspace component boundaries exist");

  const admin = (await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" })).token;
  const reception = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/settings/appearance", reception), 403, "non-admin appearance settings");
  record.pass("appearance settings remain admin-only");

  const patient = await apiJson("POST", "/patients", admin, {
    medicalRecordNumber: `DEMO-PREMIUM-${Date.now()}`,
    firstName: "Demo",
    lastName: "PremiumUI",
    notes: "Premium UI regression test patient only."
  });

  for (const page of ["/dashboard", "/patients", "/patients/new", `/patients/${patient.id}`, "/admin/appearance"]) {
    const response = await fetch(`${webUrl}${page}`);
    if (response.status !== 200) throw new Error(`${page} returned ${response.status}`);
    const html = await response.text();
    if (/raw JSON|stack trace|Prisma|\bJWT\b|\bRBAC\b|endpoint/i.test(html)) {
      throw new Error(`${page} exposes developer wording`);
    }
  }
  record.pass("main premium UI routes render without developer wording");
}

await main().catch((error) => record.fail("premium UI regression", error));
record.summary();
