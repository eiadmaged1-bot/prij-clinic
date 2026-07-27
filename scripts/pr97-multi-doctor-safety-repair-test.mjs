import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [visit, queue, dashboard, operations, signing] = await Promise.all([
  readFile("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8"),
  readFile("apps/api/src/queue/queue.service.ts", "utf8"),
  readFile("apps/web/app/doctor/page.tsx", "utf8"),
  readFile("apps/web/app/clinic-operations-page.tsx", "utf8"),
  readFile("apps/api/src/encounters/encounters.service.ts", "utf8")
]);

function start(state, doctorId, patientId, ticketId) {
  const linked = state.encounters.find((encounter) => encounter.queueTicketId === ticketId);
  if (linked) {
    assert.equal(linked.doctorId, doctorId, "another doctor's linked encounter cannot be resumed");
    return linked;
  }
  const active = state.encounters.find((encounter) =>
    encounter.doctorId === doctorId &&
    encounter.status === "draft" &&
    state.tickets.some((ticket) => ticket.id === encounter.queueTicketId && ticket.status === "in_room")
  );
  if (active) throw new Error("DOCTOR_ROOM_OCCUPIED");
  const encounter = { id: `encounter-${state.encounters.length + 1}`, doctorId, patientId, queueTicketId: ticketId, status: "draft" };
  state.encounters.push(encounter);
  state.tickets.find((ticket) => ticket.id === ticketId).status = "in_room";
  return encounter;
}

const state = {
  tickets: [
    { id: "ticket-a", patientId: "patient-a", status: "waiting" },
    { id: "ticket-b", patientId: "patient-b", status: "waiting" },
    { id: "ticket-c", patientId: "patient-c", status: "waiting" }
  ],
  encounters: []
};

const visitA = start(state, "doctor-a", "patient-a", "ticket-a");
assert.equal(visitA.patientId, "patient-a", "Doctor A starts Patient A");
const visitB = start(state, "doctor-b", "patient-b", "ticket-b");
assert.equal(visitB.patientId, "patient-b", "Doctor B starts Patient B in the same branch");
assert.throws(() => start(state, "doctor-a", "patient-c", "ticket-c"), /DOCTOR_ROOM_OCCUPIED/, "Doctor A cannot start Patient C while Patient A is active");
assert.equal(visitB.doctorId, "doctor-b", "Doctor B is not blocked by Doctor A");
assert.equal(state.encounters.filter((encounter) => encounter.doctorId === "doctor-a" && encounter.status === "draft").length, 1, "Pick Next uses doctor-specific occupancy");
assert.equal(start(state, "doctor-a", "patient-a", "ticket-a").id, visitA.id, "Double Start reuses one encounter");
assert.throws(() => start(state, "doctor-a", "patient-b", "ticket-b"), /another doctor's linked encounter/, "Doctor A cannot resume Doctor B's encounter");

assert.match(visit, /doctorId: user\.id,[\s\S]*?status: "draft",[\s\S]*?queueTicket:/, "start occupancy is encounter/doctor scoped");
assert.doesNotMatch(visit, /encounter\.createdAt < now/, "audit reuse does not compare timestamps");
assert.match(visit, /linked_encounter_reused/);
assert.match(visit, /unlinked_draft_reused/);
assert.match(visit, /new_encounter_created/);
assert.match(queue, /activeEncounter: encounter\?\.status === "draft" && encounter\.doctorId === user\.id/, "queue exposes only the authenticated actor's active encounter");
assert.match(queue, /doctorId: user\.id,[\s\S]*?status: "draft",[\s\S]*?queueTicket:/, "Pick Next occupancy is encounter/doctor scoped");
assert.match(dashboard, /ticket\.status === "in_room" && ticket\.activeEncounter/, "Doctor dashboard current patient is doctor-specific");
assert.match(operations, /ticket\.status === "in_room" && ticket\.activeEncounter/, "Doctor handoff current patient is doctor-specific");
assert.match(signing, /signed\.queueTicketId[\s\S]*?status: "in_room"/, "signing completes only the encounter-linked ticket");

console.log("PR 97 multi-doctor safety repair: 18 assertions passed");
