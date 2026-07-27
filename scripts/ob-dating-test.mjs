const API_URL = process.env.API_URL || "http://localhost:3001";
const password = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
const results = [];

async function main() {
  const owner = await login("eyad", process.env.DEMO_ADMIN_PASSWORD || "eyad");
  const doctor = owner;

  const obPatient = await api("POST", "/patients", fakePatient("OB", "OB"), owner.session);
  const pregnancy = await api("POST", "/pregnancies", { patientId: obPatient.id, status: "active", gravida: 1, para: 0, notes: "Fake OB dating test pregnancy." }, doctor.session);

  const lmp = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "LMP",
    lmpDate: "2026-01-01"
  }, doctor.session);
  assert("OB LMP calculates EDD", lmp.calculatedEdd?.slice(0, 10) === "2026-10-08");

  const cycle = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "LMP_CYCLE_ADJUSTED",
    lmpDate: "2026-01-01",
    cycleLengthDays: 35
  }, doctor.session);
  assert("LMP cycle length adjusts EDD", cycle.calculatedEdd?.slice(0, 10) === "2026-10-15");

  const known = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "KNOWN_EDD",
    knownEdd: "2026-10-08"
  }, doctor.session);
  assert("known EDD saves dating candidate", known.confidenceStatus === "confirmed");

  const ga = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "GA_ON_DATE",
    assessmentDate: "2026-06-01",
    gaWeeks: 10,
    gaDays: 0
  }, doctor.session);
  assert("GA on date calculates EDD", Boolean(ga.calculatedEdd));

  const us = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "ULTRASOUND_GA",
    scanDate: "2026-06-01",
    gaWeeks: 10,
    gaDays: 0
  }, doctor.session);
  assert("ultrasound GA on date calculates EDD", Boolean(us.calculatedEdd));

  const ivfDay3 = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "IVF",
    embryoTransferDate: "2026-01-01",
    embryoAgeDays: 3
  }, doctor.session);
  assert("IVF day 3 transfer adds 263 days", ivfDay3.calculatedEdd?.slice(0, 10) === "2026-09-21");

  const ivfDay5 = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "IVF",
    embryoTransferDate: "2026-01-01",
    embryoAgeDays: 5
  }, doctor.session);
  assert("IVF day 5 transfer adds 261 days", ivfDay5.calculatedEdd?.slice(0, 10) === "2026-09-19");

  const ivfDay6 = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "IVF",
    embryoTransferDate: "2026-01-01",
    embryoAgeDays: 6
  }, doctor.session);
  assert("IVF day 6 transfer adds 260 days", ivfDay6.calculatedEdd?.slice(0, 10) === "2026-09-18");

  const raw = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "ULTRASOUND_BIOMETRY",
    measurements: { crlMm: 55 }
  }, doctor.session);
  assert("raw biometry unverified does not calculate", raw.clinicalResultGenerated !== true && raw.message);

  const best = await api("POST", `/calculators/ob/dating/${lmp.id}/set-best`, { reason: "Fake test review." }, doctor.session);
  assert("doctor can set best EDD", best.isBestObstetricEstimate === true);

  const locked = await api("POST", `/calculators/ob/dating/${lmp.id}/lock`, { reason: "Fake test lock." }, doctor.session);
  assert("doctor can lock EDD", locked.isLocked === true);

  const missingReason = await api("POST", `/calculators/ob/dating/${lmp.id}/change-locked`, {}, doctor.session, [400]);
  assert("locked EDD change requires reason", missingReason.status === 400);

  const changed = await api("POST", `/calculators/ob/dating/${lmp.id}/change-locked`, { reason: "Fake test locked EDD change." }, doctor.session);
  assert("locked EDD change audited workflow creates replacement", changed.isBestObstetricEstimate === true && changed.isLocked === true);

  const denied = await api("POST", `/calculators/ob/dating/${known.id}/set-best`, { reason: "No clinical role." }, undefined, [401, 403]);
  assert("unauthenticated user cannot modify OB dating", [401, 403].includes(denied.status));

  const current = await api("GET", `/calculators/ob/patient/${obPatient.id}/current`, null, doctor.session);
  assert("OB patient current dating returns card data", Boolean(current.dating?.calculatedEdd));

  const gynPatient = await api("POST", "/patients", fakePatient("GYN", "GYN"), owner.session);
  const gynCurrent = await api("GET", `/calculators/ob/patient/${gynPatient.id}/current`, null, doctor.session);
  assert("GYN patient without pregnancy has no live OB dating", gynCurrent.dating === null);

  summary();
}

async function login(identifier, passwordValue) {
  const candidates = identifier === "eyad"
    ? [
        [identifier, passwordValue],
        ["eyad", "eyad"],
        ["eyad.admin@prij.local", "eyad"]
      ]
    : [[identifier, passwordValue]];
  let lastError;
  for (const [candidateIdentifier, candidatePassword] of candidates) {
    try {
      return await api("POST", "/auth/login", { identifier: candidateIdentifier, password: candidatePassword });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function fakePatient(prefix, patientType) {
  const stamp = `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
  return {
    medicalRecordNumber: `DEMO-${prefix}-${stamp}`,
    firstName: "Demo",
    lastName: `${prefix} Patient`,
    patientType,
    notes: "Fake OB dating test patient only."
  };
}

async function api(method, path, body, session, expected = [200, 201]) {
  const csrf = /(?:^|;\s*)csrf-token=([^;]+)/.exec(session ?? "")?.[1];
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(session ? { cookie: session } : {}),
      ...(csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path} expected ${expected.join("/")} got ${response.status}: ${JSON.stringify(data)}`);
  }
  const responseSession = (response.headers.getSetCookie?.() ?? [])
    .map((value) => value.split(";", 1)[0])
    .join("; ");
  return { status: response.status, ...data, ...(responseSession ? { session: responseSession } : {}) };
}

function assert(name, condition) {
  results.push({ name, ok: Boolean(condition) });
  console.log(`OB-DATING ${condition ? "PASS" : "FAIL"} ${name}`);
}

function summary() {
  const failed = results.filter((item) => !item.ok);
  console.log(`OB-DATING SUMMARY PASS ${results.length - failed.length} FAIL ${failed.length}`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(`OB-DATING FAIL ${error.message}`);
  process.exit(1);
});
