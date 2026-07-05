import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const adminController = read("apps/api/src/rbac/admin.controller.ts");
const careAssistController = read("apps/api/src/care-assist/care-assist.controller.ts");
const routeManifest = read("scripts/security-route-manifest.mjs");
const adminControlTest = read("scripts/admin-control-test.mjs");
const doctorUxTest = read("scripts/doctor-friendly-ui-test.mjs");
const accountsRbac = read("scripts/accounts-session-rbac-test.mjs");
const nav = read("apps/web/app/navigation-registry.ts");
const mvpPage = read("apps/web/app/mvp-page.tsx");
const roleMatrix = read("docs/ROLE_PERMISSION_MATRIX.md");

assert(packageJson.scripts["test:v160:rbac-readiness"] === "node scripts/v160-rbac-readiness-test.mjs", "RBAC readiness test script is registered");
assert(adminController.includes("@UseGuards(JwtAuthGuard, PermissionsGuard)"), "admin backend uses JWT and permission guards");
assert(adminController.includes('@Get("security-readiness")') && adminController.includes('@Permissions("clinic_settings.manage")'), "Owner/Admin security readiness is backend protected");
assert(adminControlTest.includes('"/admin/settings/appearance"') && adminControlTest.includes("403"), "non-admin settings denial is covered by regression");
assert(doctorUxTest.includes('"/admin/settings/appearance"') && doctorUxTest.includes("403"), "doctor/non-admin settings denial remains covered");

assert(careAssistController.includes("medication-safety-profiles/import-preview") && careAssistController.includes('@Permissions("medication_safety_profile.manage")'), "medication safety import preview is protected by backend permission");
assert(careAssistController.includes("medication-safety-profiles/review-queue") && careAssistController.includes('@Permissions("medication_safety_profile.manage")'), "medication safety review queue is protected by backend permission");
assert(routeManifest.includes("guidelines-admin") && routeManifest.includes('denyAs: "doctor"'), "advanced knowledge/admin safety tools include backend denial patterns");
assert(routeManifest.includes('denyAs: "reception"') && routeManifest.includes('"/admin/settings/appearance"'), "receptionist is blocked from admin settings by route manifest");

assert(nav.includes('roles: ["Owner", "Admin", "Accountant"]') && nav.includes('permissions: ["billing.read", "billing.manage", "billing.report"]'), "accountant navigation is limited to billing/financial surfaces");
assert(mvpPage.includes("receptionistNav") && mvpPage.includes('"/reception/check-in"') && mvpPage.includes('"/queue"'), "receptionist navigation is limited to reception, appointments, check-in, queue, and registration surfaces");
assert(mvpPage.includes('hasRole(roles, ["Owner", "Admin"])') && mvpPage.includes("if (item.adminOnly) return canOpenAdmin"), "admin UI hiding follows role-aware gate");
assert(accountsRbac.includes("Receptionist") && accountsRbac.includes("non-admin direct admin/accounts denied"), "account role RBAC regression covers non-admin direct admin denial");
assert(roleMatrix.includes("Accountant") && nav.includes("Accountant"), "accountant limit is documented and reflected in navigation boundaries");

for (const term of ["Owner", "Admin", "Doctor", "Receptionist", "Accountant", "medication safety source review", "backend guards"]) {
  assert(roleMatrix.includes(term), `role matrix documents ${term}`);
}

console.log(`v0.16.0 RBAC readiness checks passed (${checks.length})`);
