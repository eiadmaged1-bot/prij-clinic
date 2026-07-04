import { readFileSync } from "node:fs";

const page = readFileSync("apps/web/app/admin/accounts/page.tsx", "utf8");
const dto = readFileSync("apps/api/src/rbac/admin.dto.ts", "utf8");
const service = readFileSync("apps/api/src/rbac/rbac.service.ts", "utf8");

const checks = [
  ["Account creation form disables native validation", page.includes("noValidate")],
  ["Email optional uses text input", page.includes('type="text" inputMode="email"')],
  ["Blank email is omitted", page.includes("email: createForm.email.trim() || undefined")],
  ["Demo accounts hidden by default", page.includes("showDemoAccounts") && page.includes("Demo/test accounts hidden")],
  ["Weak local password warning exists", page.includes("Weak local demo password")],
  ["Local password minimum relaxed", dto.includes("@MinLength(1)")],
  ["Production password remains guarded", service.includes("Production passwords must be at least 8 characters")],
  ["Local one-letter login IDs allowed outside production", service.includes("{1,80}") && service.includes("{3,80}")]
];

let failed = 0;
for (const [name, passed] of checks) {
  if (passed) console.log(`PASS ${name}`);
  else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

if (failed) process.exit(1);
