import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("CONSENT-PRIVACY");

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const reception = await login(demoUsers.reception);
  const nurse = await login(demoUsers.nurse);

  const patients = (await apiJson("GET", "/patients", owner)).patients ?? [];
  const patientA = patients.find((patient) => patient.medicalRecordNumber === "DEMO-MRN-001");
  const patientB = patients.find((patient) => patient.medicalRecordNumber === "DEMO-MRN-002");

  if (!patientA || !patientB) throw new Error("Seeded demo consent patients are unavailable.");
  if (patientA.branchId === patientB.branchId) throw new Error("Seeded demo consent patients must be in different branches.");
  record.pass("seeded consent fixtures are available and branch-separated");

  assertStatus(await apiStatus("GET", `/consents?patientId=${patientA.id}`), 401, "anonymous consent read");
  assertStatus(await apiStatus("POST", "/consents", null, {
    patientId: patientA.id,
    consentType: "treatment",
    status: "granted",
    notes: "Demo anonymous consent check only."
  }), 401, "anonymous consent create");
  record.pass("consent routes require authentication");

  const consent = await apiJson("POST", "/consents", owner, {
    patientId: patientA.id,
    consentType: "treatment",
    status: "granted",
    notes: "Demo consent privacy test only. Not production legal text."
  });
  if (consent.patientId !== patientA.id || consent.status !== "granted") {
    throw new Error("Consent create did not return expected demo consent status.");
  }
  record.pass("owner can create demo treatment consent");

  const consentRecords = (await apiJson("GET", `/consents?patientId=${patientA.id}`, owner)).consentRecords ?? [];
  if (!consentRecords.some((item) => item.id === consent.id)) {
    throw new Error("Consent read did not return created demo consent.");
  }
  record.pass("owner can read demo consent records");

  assertStatus(await apiStatus("GET", `/consents?patientId=${patientA.id}`, nurse), 403, "nurse consent read permission");
  record.pass("lower-role without consent read permission is denied");

  assertStatus(await apiStatus("POST", "/consents", reception, {
    patientId: patientB.id,
    consentType: "treatment",
    status: "granted",
    notes: "Demo out-of-branch consent check only."
  }), [400, 403, 404], "out-of-branch consent create");
  record.pass("out-of-branch consent patient reference fails safely");

  const audit = (await apiJson("GET", "/audit?limit=100", owner)).auditLogs ?? [];
  const consentAudit = audit.find((entry) => entry.action === "consent.created" && entry.resourceId === consent.id);
  if (!consentAudit || consentAudit.metadataJson?.patientId !== patientA.id) {
    throw new Error("Consent create audit metadata missing expected patient reference.");
  }
  const serialized = JSON.stringify(audit);
  if (/Bearer\s+[A-Za-z0-9._-]+|LocalDev123!|password|token/i.test(serialized)) {
    throw new Error("Consent audit output appears to expose credential material.");
  }
  record.pass("consent audit metadata exists without credential material");

  record.warn("V0.1 consent records are a foundation only; production legal text, signature capture, override workflow, and full workflow blocking remain future work.");
}

await main().catch((error) => record.fail("consent privacy setup", error));
record.summary();
