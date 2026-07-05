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
const gitignore = read(".gitignore");
const env = read("apps/api/src/config/env.ts");
const main = read("apps/api/src/main.ts");
const headers = read("apps/api/src/config/security-headers.ts");
const audit = read("apps/api/src/audit/audit.service.ts");
const investigations = read("apps/api/src/investigations/investigations.service.ts");
const investigationDto = read("apps/api/src/investigations/dto.ts");
const fileStorage = read("apps/api/src/files/file-storage-policy.ts");
const routeManifest = read("scripts/security-route-manifest.mjs");
const v144 = read("scripts/v144-clinic-walkthrough-test.mjs");
const v150 = read("scripts/v150-mvp-business-walkthrough-test.mjs");
const doctorVisit = read("apps/web/app/doctor/visit/page.tsx");
const prescriptions = read("apps/web/app/prescriptions/page.tsx");

assert(packageJson.scripts["test:v160:real-data-readiness"] === "node scripts/v160-real-data-readiness-test.mjs", "v0.16.0 real-data readiness test script is registered");
assert(packageJson.scripts["test:v144:clinic-walkthrough"] && packageJson.scripts["test:v150:mvp-business-walkthrough"], "v0.14.4 and v0.15.0 preservation tests remain registered");
assert(v144.includes("walkthrough checks passed") && v150.includes("MVP business walkthrough checks passed"), "preservation tests remain intact");

for (const pattern of [".env", "storage/*", "uploads/", "backups/", "*.pdf", "*.tsbuildinfo", "playwright-report/", "test-results/"]) {
  assert(gitignore.includes(pattern), `.gitignore excludes ${pattern}`);
}

assert(env.includes("DEMO_MODE is forbidden") && env.includes("PATIENT_FILE_STORAGE_MODE=local_demo_file is forbidden"), "strict env blocks demo mode and local file storage");
assert(env.includes("APP_URL must use HTTPS") && env.includes("JWT_EXPIRES_IN must be a short"), "strict env enforces HTTPS app URL and bounded JWT expiry");
assert(fileStorage.includes("local_demo_file storage is forbidden in production"), "patient file storage forbids local demo bytes in production");

for (const header of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Cache-Control"]) {
  assert(headers.includes(header), `API security header configured: ${header}`);
}
assert(main.includes("securityHeadersMiddleware"), "API bootstrap applies security headers");

assert(audit.includes("SENSITIVE_KEY_PATTERN") && audit.includes("sanitizeAuditMetadata") && audit.includes("Bearer [redacted]"), "audit metadata redacts credential-like values");
assert(investigationDto.includes("CancelClinicalRequestDto") && investigations.includes("A reason is required to cancel or void"), "cancel or void investigation transitions require a reason");
assert(investigations.includes("reasonCaptured") && investigations.includes("cancellationReason") && investigations.includes("voidReason"), "investigation cancel/void reasons are audited and persisted");

assert(routeManifest.includes("expectedStatusWithoutToken") && routeManifest.includes("requiredPermission"), "route authorization manifest keeps anonymous and permission assertions");
assert(doctorVisit.includes("does not diagnose automatically") && doctorVisit.includes("No automatic prescribing"), "doctor visit keeps AI/clinical automation safety wording");
assert(prescriptions.includes("doctor must manually review") && !/auto.?dose|auto.?prescrib/i.test(prescriptions), "prescription UI remains manual review only");

console.log(`v0.16.0 real patient data readiness checks passed (${checks.length})`);
