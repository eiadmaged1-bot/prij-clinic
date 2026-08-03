import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [shell, registry, layoutService, classicWorkspace, cockpitWorkspace, packageJson, designSystem] = await Promise.all([
  readFile("apps/web/app/mvp-page.tsx", "utf8"),
  readFile("apps/web/components/patients/patient-workspace-registry.ts", "utf8"),
  readFile("apps/api/src/patients/services/patient-workspace-layout.service.ts", "utf8"),
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/components/clinic/VisitCockpitWorkspace.tsx", "utf8"),
  readFile("package.json", "utf8"),
  readFile("apps/web/DESIGN.md", "utf8")
]);

const doctorAllowlist = shell.match(/const doctorNav = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
const navBuilder = shell.slice(shell.indexOf("function buildShellNavGroups"), shell.indexOf("function hasRole"));
const ownerGroups = navBuilder.slice(navBuilder.indexOf("if (isOwnerAdmin)"), navBuilder.indexOf("if (isDoctorOnly)"));
const doctorGroups = navBuilder.slice(navBuilder.indexOf("if (isDoctorOnly)"), navBuilder.indexOf("if (isReceptionistOnly)"));

assert.ok(doctorAllowlist.includes('"/settings/doctor-workspace"'), "Doctor Workspace must pass the Doctor navigation allowlist.");
assert.ok(doctorGroups.includes('link("/settings/doctor-workspace", "Doctor Workspace"'), "Doctor Workspace must be visible in the Doctor shell.");
assert.ok(ownerGroups.includes('link("/settings/doctor-workspace", "Doctor Workspace"'), "Doctor Workspace must be visible in the Owner shell.");
assert.ok(ownerGroups.includes('link("/billing", "Billing"'), "Billing must be visible in the Owner shell through the permission-aware link helper.");

const minimalVisit = layoutService.match(/MINIMAL_VISIT:\s*\[([^\]]+)\]/)?.[1] ?? "";
for (const panel of ["investigations", "prescriptions", "medications"]) {
  assert.ok(minimalVisit.includes(`"${panel}"`), `${panel} must remain in the built-in patient workspace.`);
  assert.match(registry, new RegExp(`item\\("${panel}"[\\s\\S]*?true, true,`), `${panel} must remain in the client fallback in both interface modes.`);
}

assert.ok(classicWorkspace.includes("ClassicDoctorWorkspace"), "Classic workspace implementation must remain present.");
assert.ok(cockpitWorkspace.includes("Standard view"), "Cockpit must retain its route back to Classic.");

const impeccableGate = JSON.parse(packageJson).scripts["test:impeccable:cockpit"];
assert.ok(!impeccableGate.includes("--no-advisory"), "Cockpit Impeccable gate must enforce advisory findings.");
assert.ok(!impeccableGate.includes("--no-design-system"), "Cockpit Impeccable gate must enforce design-system findings.");
assert.ok(designSystem.includes("cockpit-terracotta-soft"), "Cockpit semantic colors must remain documented in the design system.");
assert.ok(designSystem.includes("cockpit-micro"), "Cockpit compact type steps must remain documented in the design system.");

console.log("Workspace discoverability regression PASS (16 assertions)");
