import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [importPage, importService, intakePage, intakeService, accounts, rbac, security, en, ar] = await Promise.all([readFile("apps/web/app/patients/import/page.tsx", "utf8"), readFile("apps/api/src/patient-import/patient-import.service.ts", "utf8"), readFile("apps/web/app/external-intake/page.tsx", "utf8"), readFile("apps/api/src/external-intake/external-intake.service.ts", "utf8"), readFile("apps/web/app/admin/accounts/page.tsx", "utf8"), readFile("apps/api/src/rbac/rbac.service.ts", "utf8"), readFile("apps/web/app/admin/security-readiness/page.tsx", "utf8"), readFile("apps/web/i18n/en.ts", "utf8"), readFile("apps/web/i18n/ar.ts", "utf8")]);

assert.match(importPage, /import\("xlsx"\)/); assert.match(importPage, /cellFormula: false/); assert.match(importPage, /CONFIRM_CREATE/); assert.match(importPage, /RESOLVE_EXISTING/);
assert.match(importService, /selected: true/); assert.match(importService, /decision: "BLOCKED", selected: false/); assert.match(importService, /missing review decision cannot silently become Skip/);
for (const tab of ["google-forms", "google-sheets", "excel-csv", "manual", "history", "corrections", "quarantined"]) assert.match(intakePage, new RegExp(tab));
assert.match(intakePage, /Open Excel\/CSV review center/); assert.match(intakePage, /Open Data Hygiene/);
for (const guard of ["constantTimeTextEqual", "enforceRateLimit", "idempotencyKey", "rowHash", "stagingOnly: true"]) assert.match(intakeService, new RegExp(guard));
for (const action of ["revoke-sessions", "lock", "unlock", "2fa-reset/prepare", "2fa-reset/confirm"]) assert.match(accounts, new RegExp(action));
assert.match(rbac, /The final active Owner cannot be deactivated or assigned another role/);
for (const column of ["automatedManual", "evidence", "owner", "lastChecked", "blocker", "action"]) assert.match(security, new RegExp(`t\\(\"${column}\"\\)`));
const keys = (source) => [...source.matchAll(/^  ([A-Za-z][A-Za-z0-9]*):/gm)].map((match) => match[1]).sort(); assert.deepEqual(keys(en), keys(ar));
assert.doesNotMatch(`${en}\n${ar}\n${intakePage}\n${security}`, /\?\?\?\?/);

console.log("v1.5.0 intake staging, account governance, security matrix, and localization regressions PASS");
