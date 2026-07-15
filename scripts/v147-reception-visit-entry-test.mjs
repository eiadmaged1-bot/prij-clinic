import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [checkIn, doctorVisit, encounters, queue] = await Promise.all([
  readFile("apps/web/app/reception/check-in/page.tsx", "utf8"),
  readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8"),
  readFile("apps/api/src/encounters/encounters.service.ts", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8")
]);

assert.match(checkIn, /Step 1[\s\S]*PatientPicker/);
assert.match(checkIn, /Step 2[\s\S]*VisitTypeSelector/);
assert.match(checkIn, /Step 3[\s\S]*Add to waiting line/);
assert.doesNotMatch(checkIn, /Appointment or walk-in|Routine|Priority note/);
assert.match(checkIn, /visitType === "urgent_kashf" \? "priority" : "routine"/);
assert.match(checkIn, /Patient added to waiting line/);
assert.match(checkIn, /Patient is already waiting today/);
assert.match(checkIn, /Could not add patient to the waiting line\. Retry/);
assert.match(doctorVisit, /status: "in_room"/);
assert.match(doctorVisit, /queue\.patient_entered_room/);
assert.match(encounters, /queue\.completed_with_encounter/);
assert.match(encounters, /activeQueueTicketLock\.deleteMany/);
assert.match(queue, /\["called", "in_room"\]/);

console.log("v1.4.7 unified clinic visit entry PASS (13 assertions)");
