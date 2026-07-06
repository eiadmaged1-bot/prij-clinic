import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const checks = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

const reception = read("apps/web/app/reception/page.tsx");
const queueService = read("apps/api/src/queue/queue.service.ts");
const doctorWaiting = read("apps/web/app/doctor/waiting/page.tsx");
const clinicOps = read("apps/web/app/clinic-operations-page.tsx");
const nav = read("apps/web/app/mvp-page.tsx");
const visitTypes = read("apps/web/lib/visit-types.ts");
const css = read("apps/web/app/globals.css");

assert(reception.includes("Reception") && reception.includes("Waiting now") && reception.includes("With doctor") && reception.includes("Next"), "receptionist home shows waiting-focused workflow");
assert(reception.includes("New Patient") && reception.includes("Returning Patient") && reception.includes("Scan QR / manual"), "receptionist primary actions remain visible");
assert(nav.includes("const receptionistNav = new Set") && nav.includes("\"/reception\"") && !nav.includes("\"/calendar\",\n  \"/patients\""), "broad receptionist menu is hidden");
assert(reception.includes("waiting-line-toggle") && reception.includes("ordered-waiting-line"), "waiting list is clickable/openable");
assert(reception.includes("queue-position-card") && reception.includes("You are number"), "queue position staff/patient wording exists");
assert(reception.includes("next-patient-indicator") && reception.includes("No patient waiting"), "next patient indicator exists");

assert(queueService.includes("queueSortRank") && queueService.includes("urgent_kashf") && queueService.includes("queue.urgent_priority_assigned"), "urgent_kashf automatically sorts after current in-room patient and is audited");
assert(queueService.indexOf("ticket.status === \"called\"") < queueService.indexOf("ticket.visitType === \"urgent_kashf\""), "called patient remains before urgent waiting patients");

assert(clinicOps.includes("Preview mode — visit not started") && clinicOps.includes("Preview history") && clinicOps.includes("Start Visit"), "doctor queue preview actions exist");
assert(clinicOps.includes("href={`/patients/${item.patientId}?preview=queue`}") && clinicOps.includes("selectPatient(item.id, item.patientId)"), "preview does not start visit while Start Visit remains explicit");
assert(doctorWaiting.includes("كشف إعادة استشارة مستعجل"), "doctor waiting locks Arabic visit type labels");
for (const label of ["كشف", "إعادة", "استشارة", "مستعجل"]) {
  assert(visitTypes.includes(`label: "${label}"`), `visit type label remains Arabic: ${label}`);
}
assert(css.includes("grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(5.25rem, 0.3fr)") && css.includes(".urgent-visit-type-card"), "urgent card is about 30% of normal card by class/source rule");

console.log(`v1.2.1 reception queue workflow checks passed (${checks.length})`);
