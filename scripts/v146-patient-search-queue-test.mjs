import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [controller, search, picker, reception, queueService, operations] = await Promise.all([
  readFile("apps/api/src/patients/patients.controller.ts", "utf8"),
  readFile("apps/api/src/patients/services/patient-search.service.ts", "utf8"),
  readFile("apps/web/components/clinic/PatientPicker.tsx", "utf8"),
  readFile("apps/web/app/reception/page.tsx", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8"),
  readFile("apps/web/app/clinic-operations-page.tsx", "utf8")
]);

assert.match(controller, /@Query\("page"\) page/);
assert.match(controller, /@Query\("limit"\) limit/);
assert.match(search, /pageInfo: \{ page, limit, hasMore:/, "search must return pagination metadata");
assert.match(search, /medicalRecordNumber[\s\S]*firstName[\s\S]*lastName[\s\S]*phone/, "MRN, names, and phone must be searchable");
assert.match(search, /queryTokens[\s\S]*AND: queryTokens/, "multi-part names must match across first and last name");
assert.match(search, /qrToken/, "permanent QR token lookup must be supported");
assert.match(search, /patientSearchScore/, "results must use explicit ranking");
assert.match(search, /return 1000/, "exact MRN matches must rank first");
assert.match(search, /return 950/, "exact full-name matches must outrank partial names");
assert.doesNotMatch(search, /notes: \{ contains: query/, "patient notes must not be searched or echoed into search metadata");
assert.match(search, /phoneSuffix/, "search response must provide a privacy-conscious phone suffix");
assert.match(search, /queueTickets: \{ where: \{ queueDate, status:/, "queue state must be scoped to the current clinic date");
for (const field of ["dateOfBirth", "branch", "latestVisitDate", "queueState"]) {
  assert.ok(picker.includes(field) || search.includes(field), `disambiguation field missing: ${field}`);
}
assert.doesNotMatch(picker, /setSelectedPatientId\(matches\[0\]/, "the first match must never be auto-selected");
assert.match(picker, /Load more patients/, "shared patient picker must expose load more");
assert.match(reception, /Load more patients/, "Reception search must expose load more");
assert.match(reception, /setSelectedPatient\(null\)/, "editing a search must clear stale selection");
assert.match(queueService, /activeQueueTicketLock\.create/, "queue must keep an authoritative active-ticket lock");
assert.match(queueService, /status: \{ in: \["waiting", "called", "in_room"\] \}/, "only active non-cancelled queue states prevent duplicates");
assert.match(queueService, /queueResponse\(activeTicket, true\)/, "concurrent duplicate queue attempts must resolve to the authoritative active ticket");
assert.match(queueService, /QUEUE_NUMBER_CONFLICT/, "non-patient uniqueness collisions must not be reported as already queued");
assert.match(reception, /clinic-queue:changed/, "successful check-in must notify queue consumers");
assert.match(operations, /addEventListener\("clinic-queue:changed"/, "queue and doctor waiting screens must refresh after check-in");
assert.doesNotMatch(reception, /Already in queue[\s\S]{0,80}Not in queue/, "contradictory queue states must not be rendered together");

console.log("v1.4.6 patient lookup and queue synchronization PASS (25 assertions)");
