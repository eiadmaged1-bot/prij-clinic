import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("apps/web/app/mvp-page.tsx", "utf8");
const reception = fs.readFileSync("apps/web/app/reception/page.tsx", "utf8");
const copy = fs.readFileSync("apps/web/app/reception/reception-copy.ts", "utf8");
const operations = fs.readFileSync("apps/web/app/clinic-operations-page.tsx", "utf8");
const queue = fs.readFileSync("apps/api/src/queue/queue.service.ts", "utf8");

for (const needle of ["receptionist-shell no-sidebar", "receptionist-topbar-actions", "LanguageSwitcher", "!isReceptionistOnly ? <UniversalSearchBox /> : null"]) {
  assert.ok(shell.includes(needle), "Reception shell missing " + needle);
}
for (const needle of ["/patients/new", "/reception/check-in", "/queue", "data-next-to-doctor", "data-reception-live-status"]) {
  assert.ok(reception.includes(needle), "Reception workspace missing " + needle);
}
for (const needle of ["New Patient", "Returning Patient", "Waiting Line", "Next to doctor", "No patient with doctor"]) {
  assert.ok(copy.includes(needle), "Reception bilingual copy missing " + needle);
}
for (const needle of ["activateForDoctor", "DOCTOR_ROOM_OCCUPIED", "QUEUE_SELECTION_CONFLICT", "singleCalledPatient: true", "displacedCalledTicketIds", 'data: { status: "waiting", calledAt: null }']) {
  assert.ok(queue.includes(needle), "Queue reliability missing " + needle);
}
for (const needle of ["data-doctor-handoff-workspace", "Pick next", ">Open<", ">Continue<", ">Complete<", "Complete opens the signed finish workflow", 'moduleKey: "encounter" | "finish"']) {
  assert.ok(operations.includes(needle), "Doctor queue workflow missing " + needle);
}
assert.match(operations, /\["waiting", "called", "in_room"\]/);
assert.match(operations, /key=\{ticket\.id\}/);
assert.doesNotMatch(operations, /Complete[\s\S]{0,120}\/queue\/\$\{ticket\.id\}\/complete/);
console.log("Sprint 1 reception and queue core PASS");
