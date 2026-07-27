import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const shell = read("apps/web/app/mvp-page.tsx");
const reception = read("apps/web/app/reception/page.tsx");
const receptionCopy = read("apps/web/app/reception/reception-copy.ts");
const operations = read("apps/web/app/clinic-operations-page.tsx");
const operationsCopy = read("apps/web/i18n/operations-copy.ts");
const queue = read("apps/api/src/queue/queue.service.ts");

for (const needle of ["receptionist-shell no-sidebar", "receptionist-topbar-actions", "LanguageSwitcher", "!isReceptionistOnly ? <UniversalSearchBox /> : null"]) assert.ok(shell.includes(needle), "Reception shell missing " + needle);
for (const needle of ["/patients/new", "/reception/check-in", "/queue", "data-next-to-doctor", "data-reception-live-status"]) assert.ok(reception.includes(needle), "Reception workspace missing " + needle);
for (const needle of ["New Patient", "Returning Patient", "Waiting Line", "Next to doctor", "No patient with doctor", "مريضة جديدة", "مريضة مسجلة", "قائمة الانتظار"]) assert.ok(receptionCopy.includes(needle), "Reception bilingual copy missing " + needle);
for (const needle of ["activateForDoctor", "DOCTOR_ROOM_OCCUPIED", "QUEUE_SELECTION_CONFLICT", "singleCalledPatient: true", "displacedCalledTicketIds", 'data: { status: "waiting", calledAt: null }']) assert.ok(queue.includes(needle), "Queue reliability missing " + needle);
for (const needle of ["data-doctor-handoff-workspace", "ui.pickNext", "ui.open", "ui.continue", "ui.complete", "ui.completeSignedFlow", 'moduleKey: "encounter" | "finish"']) assert.ok(operations.includes(needle), "Bilingual doctor queue workflow missing " + needle);
for (const needle of ['pickNext: "Pick next"', 'pickNext: "اختيار التالية"', 'open: "Open"', 'open: "فتح"', 'continue: "Continue"', 'continue: "متابعة"', 'complete: "Complete"', 'complete: "إنهاء"', 'completeSignedFlow: "Complete opens the signed finish workflow', 'completeSignedFlow: "الإنهاء يفتح مسار الإنهاء والتوقيع']) assert.ok(operationsCopy.includes(needle), "Doctor queue bilingual copy missing " + needle);
assert.match(operations, /\["waiting", "called", "in_room"\]/);
assert.match(operations, /key=\{ticket\.id\}/);
assert.doesNotMatch(operations, /Complete[\s\S]{0,120}\/queue\/\$\{ticket\.id\}\/complete/);
console.log("Sprint 1 bilingual reception and queue core PASS");
