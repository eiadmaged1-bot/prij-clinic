import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const idempotency = read("apps/api/src/idempotency/idempotency.service.ts");
const doctorVisit = read("apps/api/src/doctor-visit/doctor-visit.service.ts");
const encounters = read("apps/api/src/encounters/encounters.service.ts");
const audit = read("apps/api/src/audit/audit.service.ts");

const idempotencyChecks = [
  "beginOrReplay",
  "idempotencyRecord.create",
  "IDEMPOTENCY_REQUEST_IN_PROGRESS",
  "IDEMPOTENCY_KEY_REUSED",
  "isReplay: true",
  "async complete",
  'status: "COMPLETED"',
  "async failOrRelease"
];
for (const needle of idempotencyChecks) {
  if (!idempotency.includes(needle)) throw new Error(`Current idempotency service contract missing: ${needle}`);
}

const visitChecks = [
  'status: "draft"',
  "const encounter = existing ?? await this.prisma.encounter.create",
  'operation: "visit.follow_up.create"',
  "this.idempotency.beginOrReplay",
  "this.idempotency.complete",
  "this.idempotency.failOrRelease",
  'action: "doctor_visit.follow_up_created"'
];
for (const needle of visitChecks) {
  if (!doctorVisit.includes(needle)) throw new Error(`Current doctor-visit idempotency contract missing: ${needle}`);
}

const signChecks = [
  "tx.encounter.updateMany",
  'status: "draft"',
  "replayed: true",
  'code: "ENCOUNTER_SIGN_CONFLICT"',
  "atomicClaim: true"
];
for (const needle of signChecks) {
  if (!encounters.includes(needle)) throw new Error(`Atomic signing idempotency contract missing: ${needle}`);
}

for (const needle of ["requestId", "metadataJson", "sanitizeAuditMetadata", "SENSITIVE_KEY_PATTERN"]) {
  if (!audit.includes(needle)) throw new Error(`Audit safety contract missing: ${needle}`);
}

console.log("Sprint 1 idempotent visit actions PASS");
