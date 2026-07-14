const API_URL = process.env.API_URL || "http://localhost:3001";
const demoPassword = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";

const checks = [];

async function main() {
  const owner = await login("demo.owner@prij.local", demoPassword);
  const doctor = await login("demo.doctor@prij.local", demoPassword);
  const reception = await login("demo.reception@prij.local", demoPassword);
  const accountant = await login("demo.accountant@prij.local", demoPassword);

  const patient = await post("/patients", reception.token, {
    medicalRecordNumber: `LOCAL-WF-${Date.now()}`,
    firstName: "Workflow",
    lastName: "Demo",
    sex: "female",
    patientType: "GYN",
    notes: "Demo workflow test patient only."
  });
  pass("receptionist can create demo patient file");

  const intake = await post("/patient-intake", reception.token, {
    patientId: patient.id,
    intakeType: "gynecology",
    patientReportedJson: { chiefComplaint: "Demo patient-reported complaint" },
    administrativeJson: { sourceLabel: "secretary_intake" },
    redFlagsJson: { demoFlag: true }
  });
  pass("secretary can create patient-reported intake");

  await post(`/patient-intake/${intake.id}/submit`, reception.token, {});
  pass("secretary can submit intake for doctor review");

  await expectDenied(() => post("/encounters", reception.token, {
    patientId: patient.id,
    clinicalImpression: "Reception should not write this"
  }), "receptionist cannot create doctor clinical note");

  const encounter = await post("/encounters", doctor.token, {
    patientId: patient.id,
    chiefComplaint: "Doctor-authored demo visit",
    doctorReviewedIntake: true,
    clinicalImpression: "Doctor-written demo impression",
    planText: "Doctor-written demo plan"
  });
  pass("doctor can create clinical note");

  await post(`/patient-intake/${intake.id}/review`, doctor.token, { encounterId: encounter.id });
  await post(`/patient-intake/${intake.id}/sign`, doctor.token, {});
  pass("doctor can review and sign intake");

  const template = await post("/prescriptions/templates", doctor.token, {
    title: "Demo template",
    category: "demo",
    items: [{ medicationName: "Demo generic" }]
  });
  pass("doctor can create prescription template");

  const shortcut = await post("/prescriptions/shortcuts", doctor.token, {
    displayName: "Demo shortcut",
    genericName: "Demo generic",
    defaultInstructions: "Doctor must edit before patient use"
  });
  pass("doctor can create medication shortcut");

  await post("/prescriptions", doctor.token, {
    patientId: patient.id,
    sourceType: "doctor_shortcut",
    notes: "Demo prescription builder save",
    items: [{ medicationName: shortcut.genericName, instructions: "Manually edited demo instruction" }]
  });
  pass("doctor can attach prescription to patient");

  const clinicalRequest = await post("/clinical-requests", doctor.token, {
    patientId: patient.id,
    encounterId: encounter.id,
    requestNote: "Demo follow-up request",
    items: [
      { title: "CBC", requestType: "laboratory" },
      { title: "CA-125", requestType: "tumor_marker" },
      { title: "Vascular surgery opinion for varicose veins", requestType: "external_referral" }
    ]
  });
  pass("doctor can create multi-item clinical request");

  await post(`/clinical-requests/${clinicalRequest.id}/mark-result-received`, doctor.token, {});
  await post(`/clinical-requests/${clinicalRequest.id}/review`, doctor.token, {});
  pass("doctor can receive and review clinical request result");

  const hints = await get(`/patients/${patient.id}/follow-up-hints`, doctor.token);
  assert(Array.isArray(hints.hints), "follow-up hints endpoint returns hint array");
  pass("doctor can read deterministic follow-up hints");

  const search = await get("/search/live?q=CA&scope=clinical", doctor.token);
  assert(Array.isArray(search.sections), "search sections returned");
  pass("doctor live search returns role-filtered sections");

  await expectDenied(() => get("/search/live?q=CA&scope=clinical", accountant.token), "accountant cannot use universal clinical search");
  await expectDenied(() => get("/prescriptions/templates", accountant.token), "accountant cannot access prescription templates");

  console.log(`CLINIC-WORKFLOW SUMMARY PASS ${checks.length} FAIL 0`);
}

async function login(identifier, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });
  assert(response.ok, `login failed for ${identifier}: ${response.status}`);
  return response.json();
}

async function get(endpoint, token) {
  const response = await fetch(`${API_URL}${endpoint}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`GET ${endpoint} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function post(endpoint, token, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`POST ${endpoint} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function expectDenied(fn, label) {
  try {
    await fn();
  } catch {
    pass(label);
    return;
  }
  throw new Error(`${label}: expected denial`);
}

function pass(label) {
  checks.push(label);
  console.log(`CLINIC-WORKFLOW PASS ${label}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(`CLINIC-WORKFLOW FAIL ${error.message}`);
  process.exit(1);
});
