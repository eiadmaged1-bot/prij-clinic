import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const secret = randomBytes(32).toString("hex");
const port = 3197;
const baseUrl = `http://127.0.0.1:${port}`;
const runId = randomUUID().slice(0, 8);
const submissionPrefix = `AUTO-INTAKE-${runId}`;
const testPhone = `+2011${String(Date.now()).slice(-7)}`;
const startedAt = new Date();
let timestampOffset = 0;
let child;
let patient;
let childOutput = "";

try {
  patient = await prisma.patient.create({ data: { medicalRecordNumber: `AUTO-${runId}`, firstName: "Automated", lastName: "Intake Test", sex: "female", phone: testPhone, notes: "Automated integration test record; removed after test." } });
  child = spawn(process.execPath, ["apps/api/dist/main.js"], {
    cwd: process.cwd(),
    env: { ...process.env, API_PORT: String(port), API_HOST: "127.0.0.1", PRIJ_EXTERNAL_INTAKE_SECRET: secret, PRIJ_EXTERNAL_INTAKE_RATE_LIMIT_PER_MINUTE: "100" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout?.on("data", (chunk) => { childOutput = `${childOutput}${chunk}`.slice(-4000); });
  child.stderr?.on("data", (chunk) => { childOutput = `${childOutput}${chunk}`.slice(-4000); });
  await waitForHealth();

  const dryReplayPayload = payload(`${submissionPrefix}-REPLAY`, "+201000000001");
  const replayTimestamp = nextTimestamp();
  const firstDryRun = await send(dryReplayPayload, { timestamp: replayTimestamp, dryRun: true });
  assert.equal(firstDryRun.status, 200, "valid signed dry run");
  const replay = await send(dryReplayPayload, { timestamp: replayTimestamp, dryRun: true });
  assert.equal(replay.status, 403, "replay rejected");

  const invalidSignature = await send(payload(`${submissionPrefix}-BADSIG`, "+201000000002"), { timestamp: nextTimestamp(), signature: "0".repeat(64) });
  assert.equal(invalidSignature.status, 403, "invalid signature rejected");

  const expiredTimestamp = String(Math.floor(Date.now() / 1000) - 1000);
  const expired = await send(payload(`${submissionPrefix}-EXPIRED`, "+201000000003"), { timestamp: expiredTimestamp });
  assert.equal(expired.status, 401, "expired timestamp rejected");

  const invalidPhone = await send(payload(`${submissionPrefix}-PHONE`, "person@example.test"), { timestamp: nextTimestamp() });
  assert.equal(invalidPhone.status, 400, "invalid phone rejected");
  const invalidPhoneBody = await invalidPhone.json();
  assert(invalidPhoneBody.error?.fieldErrors?.primaryPhone ?? invalidPhoneBody.fieldErrors?.primaryPhone, "phone validation returns a safe field error envelope");

  const validPayload = payload(`${submissionPrefix}-VALID`, testPhone);
  const created = await send(validPayload, { timestamp: nextTimestamp() });
  const createdBody = await created.json();
  assert.equal(created.status, 201, `valid signature and payload accepted: ${JSON.stringify(createdBody)} ${childOutput.replace(/\s+/g, " ").trim()}`);
  assert(createdBody.intakeId && createdBody.status === "pending_review" && createdBody.duplicate === false, "success response contract");
  assert(!JSON.stringify(createdBody).includes(secret), "response never exposes the secret");

  const stored = await prisma.externalPatientSubmission.findUnique({ where: { id: createdBody.intakeId } });
  const candidates = Array.isArray(stored?.duplicateCandidatesJson) ? stored.duplicateCandidatesJson : [];
  assert(candidates.some((candidate) => candidate && typeof candidate === "object" && candidate.id === patient.id), "patient match candidate recorded without auto-merge");

  const duplicate = await send(validPayload, { timestamp: nextTimestamp() });
  assert.equal(duplicate.status, 200, "idempotent duplicate accepted");
  assert.equal((await duplicate.json()).duplicate, true, "duplicate response contract");

  const conflictingPayload = { ...validPayload, addressText: "Changed only for automated conflict test" };
  const conflict = await send(conflictingPayload, { timestamp: nextTimestamp() });
  assert.equal(conflict.status, 409, "conflicting duplicate rejected");

  const dryRunPayload = payload(`${submissionPrefix}-DRY`, "+201000000004");
  const dryRun = await send(dryRunPayload, { timestamp: nextTimestamp(), dryRun: true });
  assert.equal(dryRun.status, 200, "dry run succeeds");
  assert.equal(await prisma.externalPatientSubmission.count({ where: { externalSubmissionId: dryRunPayload.submissionId } }), 0, "dry run creates no intake");

  const unauthorized = await fetch(`${baseUrl}/external-intake`);
  assert.equal(unauthorized.status, 401, "review inbox rejects unauthorized access");
  assert(await prisma.auditLog.count({ where: { action: "external_intake.received", resourceId: createdBody.intakeId } }) >= 1, "success audit event recorded");

  console.log("External intake HMAC, validation, replay, idempotency, match candidate, dry run, RBAC, and audit PASS");
} finally {
  if (child && !child.killed) child.kill();
  await prisma.externalPatientSubmission.deleteMany({ where: { externalSubmissionId: { startsWith: submissionPrefix } } });
  if (patient) await prisma.patient.deleteMany({ where: { id: patient.id } });
  await prisma.externalIntakeReplayNonce.deleteMany({ where: { createdAt: { gte: startedAt } } });
  await prisma.$disconnect();
}

function payload(submissionId, primaryPhone) {
  return {
    submissionId,
    submittedAt: new Date().toISOString(),
    fullName: "Automated Intake Test",
    primaryPhone,
    addressText: "Automated test only",
    spouseName: "",
    birthValue: "1990",
    followUpType: "gynecology",
    secondaryPhone: ""
  };
}

function nextTimestamp() { timestampOffset += 1; return String(Math.floor(Date.now() / 1000) + timestampOffset); }

async function send(value, options) {
  const rawBody = JSON.stringify(value);
  const timestamp = options.timestamp;
  const signature = options.signature ?? createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return fetch(`${baseUrl}/external-intake/google-form`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-prij-timestamp": timestamp, "x-prij-signature": `sha256=${signature}`, ...(options.dryRun ? { "x-prij-dry-run": "true" } : {}) },
    body: rawBody
  });
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child?.exitCode !== null) throw new Error("API exited before integration tests started.");
    try { const response = await fetch(`${baseUrl}/health/live`); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`API did not become healthy for external intake tests. ${childOutput.replace(/\s+/g, " ").trim()}`);
}
