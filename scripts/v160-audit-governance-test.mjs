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
const auditService = read("apps/api/src/audit/audit.service.ts");
const auditController = read("apps/api/src/audit/audit.controller.ts");
const billing = read("apps/api/src/billing/billing.service.ts");
const rbac = read("apps/api/src/rbac/rbac.service.ts");
const appointments = read("apps/api/src/appointments/appointments.service.ts");
const queue = read("apps/api/src/queue/queue.service.ts");
const investigations = read("apps/api/src/investigations/investigations.service.ts");
const medicationSafety = read("apps/api/src/care-assist/medication-pregnancy-lactation-safety.service.ts");
const docs = read("docs/AUDIT_GOVERNANCE.md");

assert(packageJson.scripts["test:v160:audit-governance"] === "node scripts/v160-audit-governance-test.mjs", "audit governance test script is registered");
assert(auditService.includes("sanitizeAuditMetadata") && auditService.includes("SENSITIVE_KEY_PATTERN"), "audit metadata redaction exists");
assert(auditService.includes("maxLength = 500") && auditService.includes("slice(0, maxLength)") && auditService.includes("value.slice(0, 50)"), "large audit metadata strings and arrays are bounded");
assert(auditService.includes("Bearer [redacted]") && auditService.includes("sk-proj-"), "audit redacts bearer and API-key-like values");

assert(billing.includes("invoice.created") && billing.includes("invoice.issued") && (billing.includes("invoice.voided") || rbac.includes("admin_invoice_voided")), "invoice issue/void audit strings exist");
assert(billing.includes("payment.recorded"), "payment record audit string exists");
if (/voidPayment|payment\.voided/.test(billing)) {
  assert(billing.includes("payment.voided"), "payment void audit string exists where payment void is supported");
} else {
  assert(billing.includes("payment.reversed") && billing.includes("payment.refunded"), "payment reverse/refund audit strings exist where payment void is not supported");
}
assert(appointments.includes("appointment.status_updated") && appointments.includes("cancellationReason") && appointments.includes("noShowReason"), "appointment cancel/no-show reason and audit exist");
assert(queue.includes("queue.called") && queue.includes("queue.completed") && queue.includes("queue.cancelled") && queue.includes("reasonCaptured"), "queue status audit exists where supported");
assert(investigations.includes("A reason is required to cancel or void") && investigations.includes("investigation_order.status_updated") && investigations.includes("cancellationReason") && investigations.includes("voidReason"), "investigation cancel/void reason is required and audited");
assert(medicationSafety.includes("medication_safety_profile.import_committed") && medicationSafety.includes("medication_safety_profile.${decision}"), "medication safety import/review audit remains present");

assert(!/@Delete|\.deleteMany\(|deleteAudit|auditLog\.delete/i.test(auditController), "no audit log deletion route exists in the audit controller");
assert(!/auditLog\.delete|auditLog\.deleteMany/.test(rbac + billing + appointments + queue + investigations), "normal app services do not delete audit logs");
assert(docs.includes("Audit logs must not be deletable") && docs.includes("redact"), "audit governance documentation records deletion and redaction rules");

console.log(`v0.16.0 audit governance checks passed (${checks.length})`);
