import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const write = (relativePath, content) => fs.writeFileSync(path.join(root, relativePath), content, "utf8");

const receptionShellTest = String.raw`import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shell = await readFile("apps/web/app/mvp-page.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");
const reception = await readFile("apps/web/app/reception/page.tsx", "utf8");
const copy = await readFile("apps/web/app/reception/reception-copy.ts", "utf8");

assert.match(shell, /isReceptionistOnly \? \[\] : buildShellNavGroups/);
assert.match(shell, /user && !isReceptionistOnly[\s\S]*?aria-label="Close navigation"/);
assert.match(shell, /isReceptionistOnly \? "receptionist-shell no-sidebar"/);
assert.match(shell, /!isReceptionistOnly \? <UniversalSearchBox \/> : null/);
assert.match(shell, /receptionist-topbar-actions/);
assert.match(shell, /href="\/reception"[\s\S]*?LanguageSwitcher[\s\S]*?signOut\(\)/);
assert.doesNotMatch(shell, /interfaceMode === "MINIMALISTIC" && \(isDoctorOnly \|\| isReceptionistOnly\)/);
assert.match(css, /\.app-shell\.receptionist-shell\.no-sidebar[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
assert.match(css, /\.reception-primary-actions[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.reception-primary-actions[\s\S]*?minmax\(0, 1fr\)/);
for (const action of ["New Patient", "Returning Patient", "Waiting Line", "Next to doctor"]) {
  assert.ok(copy.includes(action), "Reception bilingual copy must expose " + action);
}
for (const route of ["/patients/new", "/reception/check-in", "/queue"]) {
  assert.ok(reception.includes(route), "Reception workspace must expose route " + route);
}
for (const forbidden of ["Doctor view", "New Encounter", "New Prescription", "Owner Control"]) {
  assert.equal(reception.includes(forbidden), false, "Reception workspace must not expose " + forbidden);
}
assert.match(reception, /data-next-to-doctor/);
assert.match(reception, /ticket\.status === "in_room"[\s\S]*?ticket\.status === "called"/);
assert.match(copy, /No patient with doctor/);
console.log("v1.4.4 receptionist single-workspace isolation PASS");
`;

const receptionQueueCoreTest = String.raw`import assert from "node:assert/strict";
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
`;

write("scripts/v1444-reception-shell-test.mjs", receptionShellTest);
write("scripts/sprint1-reception-queue-core-test.mjs", receptionQueueCoreTest);
console.log("Sprint 1 reception and queue contract tests aligned.");
