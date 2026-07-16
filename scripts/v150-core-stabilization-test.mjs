import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [repair, search, queue, directory, qr, theme, appearance, boundary, cases] = await Promise.all([
  readFile("scripts/v150-reconcile-operational-patients.mjs", "utf8"),
  readFile("apps/api/src/patients/services/patient-search.service.ts", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8"),
  readFile("apps/web/app/patients/page.tsx", "utf8"),
  readFile("apps/web/app/reception/qr-scan/page.tsx", "utf8"),
  readFile("apps/web/app/theme.tsx", "utf8"),
  readFile("apps/web/app/admin/appearance/page.tsx", "utf8"),
  readFile("apps/web/components/patients/PatientPanelErrorBoundary.tsx", "utf8"),
  readFile("apps/api/src/case-library/case-library.service.ts", "utf8")
]);

assert.match(repair, /status: \{ in: \["inactive", "archived"\] \}, dataClassification: "REAL"/);
assert.match(repair, /mode=.*dry-run/);
assert.match(repair, /ACTIVATE_REAL_OPERATIONAL_PATIENTS/);
assert.match(repair, /patient\.operational_status_reconciled/);
for (const token of ["batchId", "previousState", "newState", "reason", "SYSTEM_RECONCILIATION", "appliedAt"]) assert.match(repair, new RegExp(token));
assert.doesNotMatch(repair, /deleteMany|DELETE FROM|TRUNCATE/);
assert.match(search, /requestedStatus = hygieneCandidateView[\s\S]*PatientStatus\.active/);
assert.match(search, /dataClassification = \{ notIn: \["TEST", "QUARANTINED"\] \}/);
assert.doesNotMatch(directory, /Include archived|Restore patient|Reactivate|value="archived"|value="inactive"/);
assert.doesNotMatch(qr, /Archived patient|restored before Check-in|archived:|restore:/);
for (const token of ["waiting", "called", "in_room", "completed", "branchId_patientId_queueDate"]) assert.match(queue, new RegExp(token));
assert.match(queue, /dataClassification[\s\S]*notIn: \["TEST", "QUARANTINED"\]/);
for (const token of ["legacyThemeIds", "resolveThemeId", "sanitizeThemeConfiguration", "prij-heritage"]) assert.match(theme, new RegExp(token));
assert.match(theme, /removeItem\("prijClinicTheme"\)/);
assert.match(appearance, /Retry appearance settings/);
assert.match(appearance, /Reset corrupted device state/);
assert.match(appearance, /Prepare safe shared reset/);
for (const token of ["requestId", "failedAt", "Retry panel", "Owner diagnostics", "No patient data or stack trace"]) assert.match(boundary, new RegExp(token));
assert.match(cases, /dataClassification: \{ notIn: \["TEST", "QUARANTINED"\] \}/);

console.log("v1.5.0 operational patient, appearance, panel isolation, queue, and Case Library regressions PASS");
