import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env.js");
loadRootEnv();

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const password = process.env.DEMO_TEST_PASSWORD;
if (!password) throw new Error("DEMO_TEST_PASSWORD is required.");

const doctor = await login("runtime.doctor@prij.local", password);
const owner = await login(process.env.DEMO_ADMIN_LOGIN || "runtime.owner@prij.local", password);
const reception = await login("runtime.reception@prij.local", password);

const [concurrentPreference, concurrentAppearance] = await Promise.all([
  request(doctor, "GET", "/users/me/preferences"),
  request(doctor, "GET", "/users/me/preferences/appearance")
]);
assert.equal(concurrentPreference.response.status, 200, "Concurrent general preference read must succeed");
assert.equal(concurrentAppearance.response.status, 200, "Concurrent appearance preference read must succeed");
const initialPreference = concurrentPreference.body;
assert.equal(initialPreference.doctorWorkspaceMode, "CLASSIC", "Classic must be the migrated default");

const patientSearch = await json(doctor, "GET", "/patients?q=Demo&limit=50");
const candidates = (patientSearch.patients ?? []).filter((patient) => {
  const type = String(patient.patientType ?? "").toLowerCase();
  return !type.includes("pregnan") && !type.includes("obstetric");
});
assert.ok(candidates.length, "An existing non-pregnancy demo patient is required");

let patient;
for (const candidate of candidates) {
  const current = await json(doctor, "GET", `/patients/${candidate.id}/doctor-visit/current`);
  if (!current.encounter) {
    patient = candidate;
    break;
  }
}
assert.ok(patient, "A demo patient without an existing doctor draft is required");

const encountersBefore = await json(doctor, "GET", "/encounters");
const marker = `Runtime smoke ${Date.now()}`;
const firstStart = await json(doctor, "POST", `/patients/${patient.id}/doctor-visit/start`, {});
const secondStart = await json(doctor, "POST", `/patients/${patient.id}/doctor-visit/start`, {});
const encounterId = firstStart.encounter?.id;
assert.ok(encounterId, "Starting the doctor visit must return an encounter");
assert.equal(secondStart.encounter?.id, encounterId, "Starting twice must reuse the same draft encounter");

let revision = firstStart.encounter.updatedAt;
const classicValue = `${marker} classic note`;
const classicSave = await json(doctor, "PATCH", `/patients/${patient.id}/doctor-visit/${encounterId}`, {
  revision,
  chiefComplaint: classicValue
});
revision = classicSave.updatedAt;

await json(doctor, "PATCH", "/users/me/preferences", { doctorWorkspaceMode: "COCKPIT" });
const cockpitPacket = await json(doctor, "GET", `/patients/${patient.id}/doctor-visit/${encounterId}/packet`);
assert.equal(cockpitPacket.encounter.id, encounterId);
assert.equal(cockpitPacket.encounter.chiefComplaint, classicValue);

const cockpitValue = `${marker} cockpit note`;
const cockpitSave = await json(doctor, "PATCH", `/patients/${patient.id}/doctor-visit/${encounterId}`, {
  revision,
  planText: cockpitValue
});
const staleRevision = revision;
revision = cockpitSave.updatedAt;

await json(doctor, "PATCH", "/users/me/preferences", { doctorWorkspaceMode: "CLASSIC" });
const classicPacket = await json(doctor, "GET", `/patients/${patient.id}/doctor-visit/${encounterId}/packet`);
assert.equal(classicPacket.encounter.chiefComplaint, classicValue);
assert.equal(classicPacket.encounter.planText, cockpitValue);

const encountersAfter = await json(doctor, "GET", "/encounters");
const beforeCount = (encountersBefore.encounters ?? []).filter((row) => row.patientId === patient.id).length;
const afterRows = (encountersAfter.encounters ?? []).filter((row) => row.patientId === patient.id);
assert.equal(afterRows.length, beforeCount + 1, "Exactly one encounter must be added");
assert.equal(afterRows.filter((row) => row.id === encounterId).length, 1, "The encounter ID must remain unique");

await json(doctor, "PATCH", "/users/me/preferences", { doctorWorkspaceMode: "COCKPIT" });
const persistedPreference = await json(doctor, "GET", "/users/me/preferences");
assert.equal(persistedPreference.doctorWorkspaceMode, "COCKPIT");
await json(owner, "PATCH", "/users/me/preferences", { doctorWorkspaceMode: "COCKPIT" });
const deniedPreference = await request(reception, "PATCH", "/users/me/preferences", { doctorWorkspaceMode: "COCKPIT" });
assert.equal(deniedPreference.response.status, 403, "Receptionist preference update must be rejected");

const missingRevision = await request(doctor, "PATCH", `/encounters/${encounterId}/sign`, {});
assert.equal(missingRevision.response.status, 400, "Signing without expectedRevision must be rejected");

const readiness = await json(doctor, "GET", `/encounters/${encounterId}/readiness`);
assert.equal(readiness.ready, false, "Incomplete encounter must not be ready");
assert.ok(readiness.issues.some((issue) => issue.severity === "blocking"), "Readiness must include blocking issues");

const incompleteSign = await request(doctor, "PATCH", `/encounters/${encounterId}/sign`, { expectedRevision: revision });
assert.equal(incompleteSign.response.status, 400, "Incomplete signing must be rejected");
assert.equal(errorCode(incompleteSign.body), "ENCOUNTER_NOT_READY");

const staleSign = await request(doctor, "PATCH", `/encounters/${encounterId}/sign`, { expectedRevision: staleRevision });
assert.equal(staleSign.response.status, 409, "A stale revision must produce a conflict");
assert.equal(errorCode(staleSign.body), "ENCOUNTER_VERSION_CONFLICT");

const readySave = await json(doctor, "PATCH", `/patients/${patient.id}/doctor-visit/${encounterId}`, {
  revision,
  chiefComplaint: classicValue,
  historyText: `${marker} test history`,
  examText: `${marker} test examination`,
  assessmentText: `${marker} test assessment`,
  planText: cockpitValue,
  examinationJson: {
    version: 2,
    complaints: [],
    history: [],
    examination: {},
    reproductiveSnapshot: {
      context: "pregnancy",
      changeStatus: "reviewed",
      lmp: "2026-01-01",
      lmpCertainty: "certain",
      edd: "2026-10-08",
      datingMethod: "LMP",
      datingConfirmationDate: "2026-01-01"
    }
  }
});
revision = readySave.updatedAt;
const ready = await json(doctor, "GET", `/encounters/${encounterId}/readiness`);
assert.equal(ready.ready, true, `Encounter should be ready: ${JSON.stringify(ready.issues)}`);

const signed = await json(doctor, "PATCH", `/encounters/${encounterId}/sign`, { expectedRevision: revision });
assert.equal(signed.status, "signed");
const readOnlyUpdate = await request(doctor, "PATCH", `/patients/${patient.id}/doctor-visit/${encounterId}`, {
  revision: signed.updatedAt,
  planText: `${marker} prohibited signed edit`
});
assert.equal(readOnlyUpdate.response.status, 400, "Signed encounter must be read-only");

const signedPacket = await json(doctor, "GET", `/patients/${patient.id}/doctor-visit/${encounterId}/packet`);
assert.equal(signedPacket.encounter.id, encounterId);
assert.equal(signedPacket.encounter.status, "signed");
assert.equal(signedPacket.encounter.chiefComplaint, classicValue);
assert.equal(signedPacket.encounter.planText, cockpitValue);

console.log(JSON.stringify({
  result: "pass",
  patientId: patient.id,
  encounterId,
  defaultMode: initialPreference.doctorWorkspaceMode,
  persistedMode: persistedPreference.doctorWorkspaceMode,
  duplicateEncounterCount: afterRows.filter((row) => row.id === encounterId).length,
  readinessIssueCount: readiness.issues.length,
  signedStatus: signed.status
}));

async function login(identifier, passwordValue) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password: passwordValue })
  });
  const body = await parse(response);
  assert.equal(response.status, 201, `${identifier} login failed`);
  const cookie = response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
  assert.ok(cookie.includes("prij_clinic_session="), `${identifier} login did not establish a session`);
  return { cookie, csrfToken: body.csrfToken };
}

async function json(session, method, path, body) {
  const result = await request(session, method, path, body);
  assert.ok(result.response.ok, `${method} ${path} returned ${result.response.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function request(session, method, path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      accept: "application/json",
      cookie: session.cookie,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(session.csrfToken ? { "x-csrf-token": session.csrfToken } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { response, body: await parse(response) };
}

function errorCode(body) {
  return body?.error?.code ?? body?.message?.code ?? body?.code;
}

async function parse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
