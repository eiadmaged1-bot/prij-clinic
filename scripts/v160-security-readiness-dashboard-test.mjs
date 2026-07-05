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
const page = read("apps/web/app/admin/security-readiness/page.tsx");
const nav = read("apps/web/app/navigation-registry.ts");
const adminHome = read("apps/web/app/admin/page.tsx");

assert(packageJson.scripts["test:v160:security-readiness-dashboard"] === "node scripts/v160-security-readiness-dashboard-test.mjs", "security readiness dashboard test script is registered");
assert(adminController.includes('@Get("security-readiness")'), "backend security readiness endpoint exists");
assert(adminController.includes('@Permissions("clinic_settings.manage")'), "security readiness endpoint uses backend admin permission guard");
assert(adminController.includes("admin.security_readiness.read"), "security readiness reads are audited");
assert(!adminController.includes("process.env.") || !adminController.includes("security-readiness") || !/process\.env\.[A-Z_]+/.test(adminController.split('@Get("security-readiness")')[1].split('@Get("services")')[0]), "security readiness endpoint does not return raw environment values");

for (const label of [
  "Authentication readiness",
  "RBAC readiness",
  "Audit readiness",
  "Document upload safety",
  "Backup readiness",
  "Consent readiness",
  "Production environment readiness",
  "Seed/data safety",
  "PHI/PII protection",
  "AI safety status",
  "Remaining blockers before real patient data"
]) {
  assert(page.includes(label) || adminController.includes(label), `dashboard includes ${label}`);
}

assert(page.includes("Owner/Admin access is required"), "dashboard blocks non-admin users with clean wording");
assert(page.includes("Security readiness is unavailable right now."), "dashboard avoids stack traces and developer internals on errors");
assert(!/(stack trace|Prisma|JWT_SECRET|DATABASE_URL|process\.env|localhost:5432)/i.test(page), "dashboard UI does not expose stack traces, secrets, or raw internals");
assert(nav.includes('href: "/admin/security-readiness"') && nav.includes("adminOnly: true"), "security readiness is registered as admin-only navigation");
assert(adminHome.includes("/admin/security-readiness"), "admin home links to security readiness dashboard");

console.log(`v0.16.0 security readiness dashboard checks passed (${checks.length})`);
