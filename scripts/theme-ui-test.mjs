import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("THEME-UI");
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

async function main() {
  await waitForApi();

  const themeSource = await readFile("apps/web/app/theme.tsx", "utf8");
  for (const theme of ["prij-heritage", "clinic-premium", "lavender", "rose", "minimal-clean", "compact-operations", "high-contrast"]) {
    if (!themeSource.includes(`"${theme}"`)) throw new Error(`Theme ${theme} is missing from registry.`);
  }
  record.pass("theme registry includes required appearances");

  const loginSource = await readFile("apps/web/app/login/page.tsx", "utf8");
  if (!loginSource.includes('autoComplete="username"') || !loginSource.includes('autoComplete="current-password"')) {
    throw new Error("Login page does not expose the normal secure credential form.");
  }
  if (/owner(?:LoginId|Password)\s*=|Use Owner Login|Fill owner login/.test(loginSource)) {
    throw new Error("Login page embeds an owner credential shortcut.");
  }
  record.pass("login page uses normal credentials without an embedded owner shortcut");

  const dashboardSource = await readFile("apps/web/app/dashboard/page.tsx", "utf8");
  for (const label of ["My Apps", "All Apps", "Patients", "Appointments", "Queue", "AI Draft Review", "Owner portal", "Clinic Command"]) {
    if (!dashboardSource.includes(label)) throw new Error(`Portal dashboard label missing: ${label}`);
  }
  record.pass("Clinic Portal and Incision portal dashboard cards are implemented");

  const registrySource = await readFile("apps/web/app/navigation-registry.ts", "utf8");
  for (const label of ["/admin", "/admin/appearance", "/admin/accounts", "Owner Control", "Appearance", "Users and Roles", "Guidelines", "Medications", "Medicine Data"]) {
    if (!registrySource.includes(label)) throw new Error(`Navigation registry label missing: ${label}`);
  }
  record.pass("canonical navigation registry includes clinical and admin modules");

  const shellSource = await readFile("apps/web/app/mvp-page.tsx", "utf8");
  if (shellSource.includes('theme === "medicolize-portal"')) throw new Error("Theme-specific shell navigation branch is still present.");
  for (const label of ["navigationRegistry", "data-density", "useInterfaceMode"]) {
    if (!shellSource.includes(label)) throw new Error(`Shell density/navigation implementation missing ${label}`);
  }
  record.pass("themes share one shell and density persists per browser");

  const cssSource = await readFile("apps/web/app/globals.css", "utf8");
  for (const token of ["--pc-ink", "--pc-paper", "--pc-teal", "--pc-terracotta", "--density-font-scale", "--density-control-height", "--density-card-padding", "--density-sidebar-width", ':root[data-density="large"]', ':root[data-density="compact"]']) {
    if (!cssSource.includes(token)) throw new Error(`Density token missing: ${token}`);
  }
  record.pass("comfort large compact density tokens are implemented");

  for (const label of ["Summary", "Medical", "Clinical", "Appointments", "Encounters", "Medications", "Allergies", "Medication Safety", "Timeline"]) {
    if (!registrySource.includes(label)) throw new Error(`Patient tab registry missing: ${label}`);
  }
  record.pass("patient tabs are registered independently of theme");

  const admin = await login(demoUsers.owner);

  const reception = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/settings/appearance", reception), 403, "non-admin appearance settings");
  assertStatus(await apiStatus("GET", "/admin/accounts", reception), 403, "non-admin accounts settings");
  record.pass("non-admin cannot access appearance or accounts APIs");

  const appearance = await apiJson("GET", "/admin/settings/appearance", admin);
  if (!appearance.defaultTheme) throw new Error("Appearance settings did not return a default theme.");
  const changed = await apiJson("PATCH", "/admin/settings/appearance", admin, {
    defaultTheme: "clinic-premium",
    allowUserThemeOverride: true
  });
  if (changed.defaultTheme !== "clinic-premium") throw new Error("Theme change did not persist.");
  await apiJson("PATCH", "/admin/settings/appearance", admin, {
    defaultTheme: appearance.defaultTheme,
    allowUserThemeOverride: appearance.allowUserThemeOverride !== false
  });
  record.pass("admin can change and restore appearance settings");

  const pages = [
    "/",
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
    "/admin",
    "/admin/appearance",
    "/admin/accounts"
  ];
  for (const page of pages) {
    const response = await fetch(`${webUrl}${page}`);
    if (response.status !== 200) throw new Error(`${page} returned ${response.status}`);
  }
  record.pass("theme-aware pages return 200");
}

await main().catch((error) => record.fail("theme UI setup", error));
record.summary();

