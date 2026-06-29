import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("THEME-UI");
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

async function main() {
  await waitForApi();

  const themeSource = await readFile("apps/web/app/theme.tsx", "utf8");
  for (const theme of ["clinic-premium", "medicolize-portal", "incision-portal", "minimal-clean", "compact-operations"]) {
    if (!themeSource.includes(`"${theme}"`)) throw new Error(`Theme ${theme} is missing from registry.`);
  }
  record.pass("theme registry includes required appearances");

  const loginSource = await readFile("apps/web/app/login/page.tsx", "utf8");
  if (!loginSource.includes('demoEmail = "eyad"') || !loginSource.includes('demoPassword = "eyad"')) {
    throw new Error("Login page does not expose local demo admin credentials.");
  }
  record.pass("login page renders local demo admin credentials");

  const dashboardSource = await readFile("apps/web/app/dashboard/page.tsx", "utf8");
  for (const label of ["My Apps", "All Apps", "Patients", "Appointments", "Queue", "AI Draft Review", "Owner portal", "Clinic Command"]) {
    if (!dashboardSource.includes(label)) throw new Error(`Portal dashboard label missing: ${label}`);
  }
  record.pass("Clinic Portal and Incision portal dashboard cards are implemented");

  const shellSource = await readFile("apps/web/app/mvp-page.tsx", "utf8");
  for (const label of ["/admin", "/admin/appearance", "/admin/accounts", "Control Center", "Appearance", "Accounts"]) {
    if (!shellSource.includes(label)) throw new Error(`Admin navigation label missing from shell source: ${label}`);
  }
  record.pass("owner admin navigation includes control center appearance and accounts");

  const adminLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const admin = adminLogin.token;
  if (!admin) throw new Error("eyad login did not return token.");

  const reception = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/settings/appearance", reception), 403, "non-admin appearance settings");
  assertStatus(await apiStatus("GET", "/admin/accounts", reception), 403, "non-admin accounts settings");
  record.pass("non-admin cannot access appearance or accounts APIs");

  const appearance = await apiJson("GET", "/admin/settings/appearance", admin);
  if (!appearance.defaultTheme) throw new Error("Appearance settings did not return a default theme.");
  const changed = await apiJson("PATCH", "/admin/settings/appearance", admin, {
    defaultTheme: "medicolize-portal",
    allowUserThemeOverride: true
  });
  if (changed.defaultTheme !== "medicolize-portal") throw new Error("Theme change did not persist.");
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

