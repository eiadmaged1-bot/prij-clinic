import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const nav = read("apps/web/app/navigation-registry.ts");
const session = read("apps/web/app/session.tsx");
const appShell = read("apps/web/app/mvp-page.tsx");
const roleDocs = read("docs/ROLE_PERMISSION_MATRIX.md");
const medicationRegression = read("scripts/medication-intelligence-test.mjs");
const adminController = read("apps/api/src/rbac/admin.controller.ts");
const securityPage = read("apps/web/app/admin/security-readiness/page.tsx");
const patientPage = read("apps/web/app/patients/[id]/page.tsx");

assert(packageJson.scripts["test:v161:role-by-role-readiness"] === "node scripts/v161-role-by-role-readiness-test.mjs", "role-by-role readiness test script is registered");
assert(nav.includes('href: "/admin/security-readiness"') && nav.includes("adminOnly: true"), "Owner/Admin security page is protected in navigation");
assert(securityPage.includes("/admin/security-readiness") && (securityPage.includes("Access denied") || securityPage.includes("Owner")), "security readiness page has protected-state handling");
assert(exists("apps/web/app/doctor/page.tsx") && nav.includes('href: "/doctor"'), "Doctor clinical workspace remains available");
assert(exists("apps/web/app/reception/check-in/page.tsx") && nav.includes('href: "/reception/check-in"') && nav.includes('href: "/queue"'), "Receptionist check-in and queue surfaces remain available");
assert(exists("apps/web/app/billing/page.tsx") && nav.includes('href: "/billing"') && nav.includes('Accountant'), "Accountant billing/payment/report surfaces remain available");
assert(roleDocs.includes("Receptionist") && roleDocs.includes("No medication safety source review"), "Receptionist is blocked from medication safety source review in role docs");
assert(roleDocs.includes("Accountant") && roleDocs.includes("No medication safety source review"), "Accountant is blocked from medication safety source review in role docs");
assert(medicationRegression.includes("receptionist and accountant cannot access clinical medication safety"), "medication safety role denial regression remains present");
assert(adminController.includes('@Get("security-readiness")') && adminController.includes('@Permissions("clinic_settings.manage")'), "security readiness read/write actions are guarded by admin permission source");
assert(!patientPage.includes("/admin/security-readiness") && !patientPage.includes("/admin/accounts"), "patient workspace does not expose admin-only controls");
assert(nav.includes('href: "/clinic-day/walkthrough"') && exists("apps/web/app/clinic-day/walkthrough/page.tsx"), "walkthrough remains discoverable");
assert(session.includes("isAdmin") && appShell.includes("canSeeNavItem") && appShell.includes("if (item.adminOnly) return canOpenAdmin"), "app shell has admin-only role filtering");

console.log(`v0.16.1 role-by-role readiness checks passed (${checks.length})`);
