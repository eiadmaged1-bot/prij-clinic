import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("THEME-UI");
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

async function main() {
  await waitForApi();

  const themeSource = await readFile("apps/web/app/theme.tsx", "utf8");
  for (const theme of ["clinic-premium", "incision-portal", "minimal-clean", "compact-operations", "dark-navy"]) {
    if (!themeSource.includes(`"${theme}"`)) throw new Error(`Theme ${theme} is missing from registry.`);
  }
  record.pass("theme registry includes required appearances");

  const loginSource = await readFile("apps/web/app/login/page.tsx", "utf8");
  if (!loginSource.includes('demoEmail = "eyad"') || !loginSource.includes('demoPassword = "eyad"')) {
    throw new Error("Login page does not expose local demo admin credentials.");
  }
  record.pass("login page renders local demo admin credentials");

  const dashboardSource = await readFile("apps/web/app/dashboard/page.tsx", "utf8");
  for (const label of ["My Apps", "All Apps", "Patients", "Appointments", "Queue", "AI Draft Review"]) {
    if (!dashboardSource.includes(label)) throw new Error(`Portal dashboard label missing: ${label}`);
  }
  record.pass("Incision portal dashboard cards are implemented");

  const adminLogin = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const admin = adminLogin.token;
  if (!admin) throw new Error("eyad login did not return token.");

  const reception = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/settings/appearance", reception), 403, "non-admin appearance settings");
  record.pass("non-admin cannot access appearance settings API");

  const appearance = await apiJson("GET", "/admin/settings/appearance", admin);
  if (!appearance.defaultTheme) throw new Error("Appearance settings did not return a default theme.");
  const changed = await apiJson("PATCH", "/admin/settings/appearance", admin, {
    defaultTheme: "incision-portal",
    allowUserThemeOverride: true
  });
  if (changed.defaultTheme !== "incision-portal") throw new Error("Theme change did not persist.");
  await apiJson("PATCH", "/admin/settings/appearance", admin, {
    defaultTheme: appearance.defaultTheme,
    allowUserThemeOverride: appearance.allowUserThemeOverride !== false
  });
  record.pass("admin can change and restore appearance settings");

  const pages = [
    "/",
    "/login",
    "/dashboard",
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
    "/admin/appearance"
  ];
  for (const page of pages) {
    const response = await fetch(`${webUrl}${page}`);
    if (response.status !== 200) throw new Error(`${page} returned ${response.status}`);
  }
  record.pass("theme-aware pages return 200");
}

await main().catch((error) => record.fail("theme UI setup", error));
record.summary();

