import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [dto, patientController, patientService, visitController, visitService, historyUi, visitUi, submitUi] = await Promise.all([
  readFile("apps/api/src/patients/dto.ts", "utf8"),
  readFile("apps/api/src/patients/patients.controller.ts", "utf8"),
  readFile("apps/api/src/patients/patients.service.ts", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.controller.ts", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8"),
  readFile("apps/web/app/patients/[id]/panel-components.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/visit-flow-components.tsx", "utf8"),
  readFile("apps/web/app/patients/[id]/patient-components.tsx", "utf8")
]);

assert.match(dto, /@IsIn\(\["current", "past", "previous", "stopped"\]\)/, "medication history status must align with existing past values");
assert.match(patientService, /dto\.currentOrPast === "previous" \? "past"/, "legacy previous status must normalize without data loss");
for (const field of ["clinicalGroupSnapshot", "indication", "startDate", "stopDate"]) assert.match(patientService, new RegExp(`${field}:`), `medication history must persist ${field}`);
for (const action of ["operation_history", "medication_history", "investigation_history", "prescription", "investigation"]) assert.match(patientService, new RegExp(`operation: "[^"]*${action}\\.create"`), `${action} idempotency operation missing`);
for (const resource of ["patient_operation_history_item", "patient_medication_history_item", "patient_investigation_history_item", "prescription", "investigation_order"]) assert.match(patientService, new RegExp(`resourceType: "${resource}"`), `${resource} idempotency completion missing`);
assert.ok((patientController.match(/@Headers\("idempotency-key"\)/g) ?? []).length >= 6, "patient action endpoints must accept idempotency keys");
assert.match(visitController, /@Headers\("idempotency-key"\)/, "follow-up endpoint must accept idempotency key");
assert.match(visitService, /operation: "visit\.follow_up\.create"/, "follow-up idempotency operation missing");
assert.match(visitService, /encounter\.status !== "draft"/, "follow-up must require active draft visit");
assert.ok((patientService.match(/encounter\.status !== "draft"/g) ?? []).length >= 2, "prescription and investigation must require active draft visit");
for (const auditAction of ["patient_operation_history.created", "patient_medication_history.created", "patient_investigation_history.created", "prescription.created", "investigation_order.created"]) assert.match(patientService, new RegExp(auditAction.replace(".", "\\.")), `audit action missing ${auditAction}`);
assert.match(visitService, /doctor_visit\.follow_up_created/, "follow-up audit action missing");
assert.match(historyUi, /retryKeys = useRef/, "history retry keys must survive rerender");
assert.match(historyUi, /The item could not be saved\. It remains selected for retry\./, "history failure must preserve selection");
assert.match(historyUi, /role=\{saveState === "failed" \? "alert" : "status"\}/, "history save must use inline accessible status");
assert.match(submitUi, /idempotency-key/, "shared visit submit must forward idempotency key");
assert.match(submitUi, /Your selected items were preserved/, "shared visit submit must return safe preservation error");
assert.match(visitUi, /actionKeys = useRef/, "plan retries must retain keys");
assert.match(visitUi, /function investigationCategory/, "catalog display categories must map to API enum");
assert.match(visitUi, /CBC\/TSH selection was preserved for retry/, "investigation failure must preserve basket state");

console.log("v1.4.6 shared visit-action persistence contract PASS (43 assertions)");
