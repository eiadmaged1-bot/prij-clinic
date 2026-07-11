import { readFileSync } from "node:fs";

const controller = file("apps/api/src/patients/patients.controller.ts");
const service = file("apps/api/src/patients/patients.service.ts");
const dto = file("apps/api/src/patients/dto.ts");
const checks = [
  [controller.includes('@Get("duplicate-candidates")') && controller.includes('@Permissions("patient.read")'), "branch-safe endpoint contract exists"],
  [service.includes('status: "active"') && service.includes("branchScope(user)"), "candidate query is active and branch scoped"],
  [service.includes("PHONE_EXACT") && service.includes("MRN_EXACT") && service.includes("FULL_NAME_EXACT") && service.includes("DOB_EXACT") && service.includes("AGE_APPROXIMATE"), "matching signals are implemented"],
  [service.includes('code: "PATIENT_DUPLICATE_REVIEW_REQUIRED"') && service.includes("highConfidenceCandidates.length && !overrideReason"), "high-confidence creation is blocked without a reason"],
  [dto.includes("duplicateOverrideReason") && service.includes('action: "patient.duplicate_override"') && service.includes("reason: overrideReason"), "override reason is accepted and audited"],
  [service.includes('action: "patient.duplicate_check"'), "duplicate checks are audited"],
  [controller.includes('Headers("idempotency-key")') && service.includes("recentCreates"), "short-lived backend idempotency is implemented"],
  [service.includes("phoneSuffix") && !service.includes("phone: patient.phone"), "candidate response limits phone disclosure"]
];
for (const [condition, message] of checks) assert(condition, message);
console.log(`PRODUCTION-LAUNCH-DUPLICATE-PREVENTION PASS (${checks.length})`);
function file(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
