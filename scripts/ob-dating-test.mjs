const API_URL = process.env.API_URL || "http://localhost:3001";
const password = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
const results = [];

async function main() {
  const owner = await login("eyad", process.env.DEMO_ADMIN_PASSWORD || "eyad");
  const doctor = await login("demo.doctor@prij.local", password);
  const receptionist = await login("demo.reception@prij.local", password);

  const obPatient = await api("POST", "/patients", fakePatient("OB", "OB"), owner.token);
  const pregnancy = await api("POST", "/pregnancies", { patientId: obPatient.id, status: "active", gravida: 1, para: 0, notes: "Fake OB dating test pregnancy." }, doctor.token);

  const lmp = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "LMP",
    lmpDate: "2026-01-01"
  }, doctor.token);
  assert("OB LMP calculates EDD", lmp.calculatedEdd?.slice(0, 10) === "2026-10-08");

  const cycle = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "LMP_CYCLE_ADJUSTED",
    lmpDate: "2026-01-01",
    cycleLengthDays: 35
  }, doctor.token);
  assert("LMP cycle length adjusts EDD", cycle.calculatedEdd?.slice(0, 10) === "2026-10-15");

  const known = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "KNOWN_EDD",
    knownEdd: "2026-10-08"
  }, doctor.token);
  assert("known EDD saves dating candidate", known.confidenceStatus === "confirmed");

  const ga = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "GA_ON_DATE",
    assessmentDate: "2026-06-01",
    gaWeeks: 10,
    gaDays: 0
  }, doctor.token);
  assert("GA on date calculates EDD", Boolean(ga.calculatedEdd));

  const us = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "ULTRASOUND_GA",
    scanDate: "2026-06-01",
    gaWeeks: 10,
    gaDays: 0
  }, doctor.token);
  assert("ultrasound GA on date calculates EDD", Boolean(us.calculatedEdd));

  const raw = await api("POST", "/calculators/ob/dating/calculate", {
    patientId: obPatient.id,
    pregnancyEpisodeId: pregnancy.id,
    datingSource: "ULTRASOUND_BIOMETRY",
    measurements: { crlMm: 55 }
  }, doctor.token);
  assert("raw biometry unverified does not calculate", raw.clinicalResultGenerated !== true && raw.message);

  const best = await api("POST", `/calculators/ob/dating/${lmp.id}/set-best`, { reason: "Fake test review." }, doctor.token);
  assert("doctor can set best EDD", best.isBestObstetricEstimate === true);

  const locked = await api("POST", `/calculators/ob/dating/${lmp.id}/lock`, { reason: "Fake test lock." }, doctor.token);
  assert("doctor can lock EDD", locked.isLocked === true);

  const missingReason = await api("POST", `/calculators/ob/dating/${lmp.id}/change-locked`, {}, doctor.token, [400]);
  assert("locked EDD change requires reason", missingReason.status === 400);

  const changed = await api("POST", `/calculators/ob/dating/${lmp.id}/change-locked`, { reason: "Fake test locked EDD change." }, doctor.token);
  assert("locked EDD change audited workflow creates replacement", changed.isBestObstetricEstimate === true && changed.isLocked === true);

  const denied = await api("POST", `/calculators/ob/dating/${known.id}/set-best`, { reason: "No clinical role." }, receptionist.token, [403]);
  assert("receptionist cannot modify OB dating", denied.status === 403);

  const current = await api("GET", `/calculators/ob/patient/${obPatient.id}/current`, null, doctor.token);
  assert("OB patient current dating returns card data", Boolean(current.dating?.calculatedEdd));

  const gynPatient = await api("POST", "/patients", fakePatient("GYN", "GYN"), owner.token);
  const gynCurrent = await api("GET", `/calculators/ob/patient/${gynPatient.id}/current`, null, doctor.token);
  assert("GYN patient without pregnancy has no live OB dating", gynCurrent.dating === null);

  summary();
}

async function login(identifier, passwordValue) {
  return api("POST", "/auth/login", { identifier, password: passwordValue });
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

async function api(method, path, body, token, expected = [200, 201]) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path} expected ${expected.join("/")} got ${response.status}: ${JSON.stringify(data)}`);
  }
  return { status: response.status, ...data };
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
