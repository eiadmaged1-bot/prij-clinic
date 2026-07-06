import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V131-NAV PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const registry = await readFile("apps/web/app/navigation-registry.ts", "utf8");
const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const sidebarRegistry = registry.slice(0, registry.indexOf("export type PatientTab"));

for (const item of ['label: "Home"', 'label: "New Patient"', 'label: "Returning Patient"', 'label: "Waiting Line"', 'label: "Messages"']) {
  assert(registry.includes(item), `receptionist nav missing ${item}`);
}
assert(shell.includes('"/reception/check-in"') && shell.includes('"/queue"') && shell.includes('"/staff-chat"'), "receptionist nav allowlist missing workflow items");
pass("receptionist nav is minimal and workflow focused");

for (const item of ['label: "Today / Waiting"', 'label: "Patients"', 'label: "Case Library"', 'label: "Guidelines"', 'label: "AI Tools"', 'label: "Medication Reference"']) {
  assert(registry.includes(item), `doctor nav missing ${item}`);
}
assert(shell.includes("doctorNav") && shell.includes('"/doctor/case-library"'), "doctor allowlist missing case library");
pass("doctor nav is clinical and case library remains available");

for (const group of ['group: "Clinic"', 'group: "Patients"', 'group: "Operations"', 'group: "Knowledge"', 'group: "Admin"']) {
  assert(registry.includes(group), `owner/admin group missing ${group}`);
}
assert(registry.includes('label: "Users & Roles"') && registry.includes('label: "Clinic Settings"') && registry.includes('label: "Audit"'), "admin group items missing");
pass("owner/admin nav is grouped");

assert(!/label:\s*"Reception Today"/.test(sidebarRegistry) && !/label:\s*"AI Drafts"/.test(sidebarRegistry), "duplicate top-level labels still active");
assert(shell.includes("canSeeNavItem") && shell.includes("adminOnly"), "role visibility guard missing");
pass("duplicate top-level clutter removed or grouped");

console.log(`V131-NAV SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
