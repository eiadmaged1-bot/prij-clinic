import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env");
loadRootEnv();

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || "http://localhost:3001";
const password = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const createdEncounterIds = [];

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body };
}

async function apiJson(method, path, token, body) {
  const result = await request(path, token, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!result.response.ok) {
    throw new Error(`${method} ${path} returned ${result.response.status}: ${JSON.stringify(result.body).slice(0, 240)}`);
  }
  return result.body;
}

async function waitForHealth() {
  let lastError;
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`API is not running or not healthy at ${API_URL}. Start the API and rerun this script. Last error: ${lastError?.message ?? "health check failed"}`);
}

async function login(email) {
  const body = await apiJson("POST", "/auth/login", null, { email, password });
  assert.ok(body.token, `login returned token for ${email}`);
  return body.token;
}

async function me(token) {
  return (await apiJson("GET", "/auth/me", token)).user;
}

async function createPatient(ownerToken) {
  return apiJson("POST", "/patients", ownerToken, {
    medicalRecordNumber: `VOID-${runId}-${Math.floor(Math.random() * 10000)}`,
    firstName: "Demo",
    lastName: "EncounterVoid",
    notes: "Demo encounter void regression patient only."
  });
}

async function createAppointment(ownerToken, patientId, doctorId) {
  return apiJson("POST", "/appointments", ownerToken, {
    patientId,
    doctorId,
    startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    appointmentType: "Demo void encounter test"
  });
}

async function createEncounter(doctorToken, patientId, appointmentId) {
  const encounter = await apiJson("POST", "/encounters", doctorToken, {
    patientId,
    appointmentId,
    chiefComplaint: "Demo encounter void test only."
  });
  createdEncounterIds.push(encounter.id);
  return encounter;
}

async function main() {
  await waitForHealth();

  const ownerToken = await login("demo.owner@prij.local");
  const doctorToken = await login("demo.doctor@prij.local");
  const receptionToken = await login("demo.reception@prij.local");
  const doctor = await me(doctorToken);

  const patient = await createPatient(ownerToken);
  const appointment = await createAppointment(ownerToken, patient.id, doctor.id);
  const draft = await createEncounter(doctorToken, patient.id, appointment.id);

  const anonymous = await request(`/encounters/${draft.id}/void`, null, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Anonymous denied check." })
  });
  assert.equal(anonymous.response.status, 401, "anonymous void request denied");

  const lowerRole = await request(`/encounters/${draft.id}/void`, receptionToken, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Reception denied check." })
  });
  assert.equal(lowerRole.response.status, 403, "lower role void request denied");

  const emptyReason = await request(`/encounters/${draft.id}/void`, doctorToken, {
    method: "PATCH",
    body: JSON.stringify({ reason: "   " })
  });
  assert.equal(emptyReason.response.status, 400, "empty void reason rejected");

  const voided = await apiJson("PATCH", `/encounters/${draft.id}/void`, doctorToken, {
    reason: "Demo void reason for regression test."
  });
  assert.equal(voided.status, "voided", "draft encounter can be voided");
  assert.ok(voided.voidedAt, "voidedAt is set");
  assert.equal(voided.voidedByUserId, doctor.id, "voidedByUserId is set");
  assert.equal(voided.voidReason, "Demo void reason for regression test.", "void reason is trimmed and stored");

  const stillExists = await prisma.encounter.findUnique({ where: { id: draft.id } });
  assert.ok(stillExists, "voided record is not hard-deleted");

  const signedDraft = await createEncounter(doctorToken, patient.id, appointment.id);
  await apiJson("PATCH", `/encounters/${signedDraft.id}/sign`, doctorToken);
  const signedVoid = await request(`/encounters/${signedDraft.id}/void`, doctorToken, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Should not void signed encounter." })
  });
  assert.equal(signedVoid.response.status, 409, "signed encounter cannot be voided");

  const audit = await apiJson("GET", "/audit?limit=100", ownerToken);
  assert.ok(
    audit.auditLogs?.some((entry) => entry.action === "encounter.voided" && entry.resourceId === draft.id),
    "void audit event created"
  );

  const otherBranch = await prisma.branch.create({
    data: { name: `Encounter Void Branch ${runId}`, code: `EVB-${runId}` }
  });
  const otherPatient = await prisma.patient.create({
    data: {
      branchId: otherBranch.id,
      medicalRecordNumber: `VOID-SCOPE-${runId}`,
      firstName: "Demo",
      lastName: "BranchScope"
    }
  });
  const otherEncounter = await prisma.encounter.create({
    data: {
      branchId: otherBranch.id,
      patientId: otherPatient.id,
      doctorId: doctor.id,
      chiefComplaint: "Demo branch scope void test only."
    }
  });
  createdEncounterIds.push(otherEncounter.id);
  const branchScope = await request(`/encounters/${otherEncounter.id}/void`, doctorToken, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Branch scope should deny this." })
  });
  assert.equal(branchScope.response.status, 404, "branch scope enforced for voiding");

  await prisma.encounter.delete({ where: { id: otherEncounter.id } });
  await prisma.patient.delete({ where: { id: otherPatient.id } });
  await prisma.branch.delete({ where: { id: otherBranch.id } });

  console.log("ENCOUNTER-VOID PASS all checks");
}

main()
  .catch((error) => {
    console.error("ENCOUNTER-VOID FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
