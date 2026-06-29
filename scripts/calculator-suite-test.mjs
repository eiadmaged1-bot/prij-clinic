const API_URL = process.env.API_URL || "http://localhost:3001";
const password = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";

const results = [];

async function main() {
  const owner = await login("eyad", process.env.DEMO_ADMIN_PASSWORD || "eyad");
  const doctor = await login("demo.doctor@prij.local", password);
  const accountant = await login("demo.accountant@prij.local", password);

  const formulas = await api("GET", "/calculators/formulas", null, doctor.token);
  assert("calculator formulas list", Array.isArray(formulas.formulas) && formulas.formulas.length >= 25);
  assert("verified BMI seeded", formulas.formulas.some((item) => item.code === "BMI" && item.implementationStatus === "verified"));
  assert("draft ultrasound formula seeded", formulas.formulas.some((item) => item.code === "CRL_TO_GA" && item.implementationStatus === "draft"));

  const bmi = await api("POST", "/calculators/calculate", { formulaCode: "BMI", input: { weightKg: 70, heightCm: 170 } }, doctor.token);
  assert("verified BMI calculates", bmi.output?.bmi > 24 && bmi.formula?.sourceName);
  assert("calculator result includes limitations", Array.isArray(bmi.limitations) && bmi.limitations.length > 0);

  const draft = await api("POST", "/calculators/calculate", { formulaCode: "CRL_TO_GA", input: { crlMm: 55 } }, doctor.token);
  assert("draft formula does not calculate clinical output", draft.output?.clinicalResultGenerated === false);

  const patient = await api("POST", "/patients", fakePatient("CALC"), owner.token);
  const saved = await api("POST", "/calculators/calculate", {
    formulaCode: "BSA_MOSTELLER",
    patientId: patient.id,
    input: { weightKg: 70, heightCm: 170 },
    sourceContext: "calculator_hub"
  }, doctor.token);
  assert("patient calculation saves history", Boolean(saved.history?.id));

  const history = await api("GET", `/calculators/history/patient/${patient.id}`, null, doctor.token);
  assert("history includes formula source/version", history.calculations.some((item) => item.formula?.sourceVersion));

  const denied = await api("POST", "/calculators/calculate", { formulaCode: "BMI", input: { weightKg: 70, heightCm: 170 } }, accountant.token, [403]);
  assert("accountant cannot calculate clinical calculator", denied.status === 403);

  const admin = await api("GET", "/admin/calculators", null, owner.token);
  assert("owner can access formula registry", Array.isArray(admin.formulas));
  const adminDenied = await api("GET", "/admin/calculators", null, accountant.token, [403]);
  assert("non-admin cannot access formula registry", adminDenied.status === 403);

  summary();
}

async function login(identifier, passwordValue) {
  return api("POST", "/auth/login", { identifier, password: passwordValue });
}

function fakePatient(prefix) {
  const stamp = Date.now().toString().slice(-8);
  return {
    medicalRecordNumber: `DEMO-${prefix}-${stamp}`,
    firstName: "Demo",
    lastName: `${prefix} Patient`,
    patientType: "GENERAL",
    notes: "Fake calculator test patient only."
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
  return expected.length === 1 && expected[0] !== response.status ? { status: response.status, data } : { status: response.status, ...data };
}

function assert(name, condition) {
  results.push({ name, ok: Boolean(condition) });
  console.log(`CALCULATORS ${condition ? "PASS" : "FAIL"} ${name}`);
}

function summary() {
  const failed = results.filter((item) => !item.ok);
  console.log(`CALCULATORS SUMMARY PASS ${results.length - failed.length} FAIL ${failed.length}`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(`CALCULATORS FAIL ${error.message}`);
  process.exit(1);
});
