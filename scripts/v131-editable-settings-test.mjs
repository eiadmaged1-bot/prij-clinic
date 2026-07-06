import { readFile } from "node:fs/promises";

const checks = [];
function pass(message) { checks.push(message); console.log(`V131-SETTINGS PASS ${message}`); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const page = await readFile("apps/web/app/admin/settings/page.tsx", "utf8");
const controller = await readFile("apps/api/src/rbac/admin.controller.ts", "utf8");
const service = await readFile("apps/api/src/rbac/rbac.service.ts", "utf8");
const dto = await readFile("apps/api/src/rbac/admin.dto.ts", "utf8");

for (const label of ["Clinic name", "Phone", "Address", "Working hours", "Default appointment duration", "Currency", "Invoice prefix", "Receipt footer note", "Density"]) {
  assert(page.includes(label), `editable field missing: ${label}`);
}
assert(page.includes("Save settings") && page.includes("Cancel") && page.includes("Edit"), "save/cancel/edit workflow missing");
pass("owner/admin settings form is editable");

assert(controller.includes('@Get("settings/clinic-profile")') && controller.includes('@Patch("settings/clinic-profile")'), "clinic profile routes missing");
assert(controller.match(/@Permissions\("clinic_settings\.manage"\)/g)?.length >= 3, "settings routes must be permission guarded");
assert(service.includes("system_setting.clinic_profile_updated") && service.includes("assertReasonForSensitiveChange(dto.reason)"), "settings audit/reason missing");
pass("settings persistence, RBAC, and audit are wired");

for (const token of ["@MaxLength(120)", "@MaxLength(40)", "@MaxLength(240)", "@Min(5)", "@IsIn([\"EGP\", \"USD\", \"EUR\", \"SAR\", \"AED\"])"]) {
  assert(dto.includes(token), `validation token missing: ${token}`);
}
assert(service.includes("cleanText") && service.includes("cleanCode"), "settings sanitization missing");
pass("settings validation and sanitization exist");

console.log(`V131-SETTINGS SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
