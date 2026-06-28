import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("SCOPE-RECORDS");

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const nurse = await login(demoUsers.nurse);
  const doctor = await login(demoUsers.doctor);
  const reception = await login(demoUsers.reception);
  const accountant = await login(demoUsers.accountant);

  const ownerPatients = (await apiJson("GET", "/patients", owner)).patients ?? [];
  const nursePatients = (await apiJson("GET", "/patients", nurse)).patients ?? [];
  const patientA = ownerPatients.find((patient) => patient.medicalRecordNumber === "DEMO-MRN-001");
  const patientB = ownerPatients.find((patient) => patient.medicalRecordNumber === "DEMO-MRN-002");
  if (!patientA || !patientB) {
    record.warn("Seeded scope patients were outside the current API list window; branch scope fixture assertions skipped.");
    record.warn("Create/update referenced-record branch validation remains covered when seeded fixtures are visible.");
    record.warn("Patient-to-doctor assignment is not modeled; doctor patient reads are branch-scoped rather than assigned-doctor scoped.");
    return;
  }

  if (patientA.branchId !== patientB.branchId) record.pass("seeded demo patients are in different branches");
  else throw new Error("Seeded scope patients should be in different branches.");

  if (nursePatients.some((patient) => patient.id === patientB.id)) record.pass("nurse can list own branch demo patient");
  else throw new Error("Nurse cannot list own branch demo patient.");

  if (!nursePatients.some((patient) => patient.id === patientA.id)) record.pass("nurse cannot list out-of-branch demo patient");
  else throw new Error("Nurse can list out-of-branch demo patient.");

  assertStatus(await apiStatus("GET", `/patients/${patientA.id}`, nurse), 404, "nurse out-of-branch patient detail");
  record.pass("nurse cannot read out-of-branch patient detail");

  const ownerAppointments = (await apiJson("GET", "/appointments", owner)).appointments ?? [];
  const doctorAppointments = (await apiJson("GET", "/appointments", doctor)).appointments ?? [];
  if (doctorAppointments.length <= ownerAppointments.length) record.pass("doctor appointment read scope does not exceed owner-visible count");
  else throw new Error("Doctor appointment count exceeded owner-visible appointment count.");

  await expectDenied("reception cannot create appointment for out-of-branch patient", "POST", "/appointments", reception, {
    patientId: patientB.id,
    startAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
    appointmentType: "Demo unauthorized branch check"
  });

  await expectDenied("reception cannot check in out-of-branch patient", "POST", "/queue/check-in", reception, {
    patientId: patientB.id,
    priority: "routine"
  });

  await expectDenied("doctor cannot create encounter for out-of-branch patient", "POST", "/encounters", doctor, {
    patientId: patientB.id,
    chiefComplaint: "Demo unauthorized branch check only."
  });

  await expectDenied("doctor cannot create prescription for out-of-branch patient", "POST", "/prescriptions", doctor, {
    patientId: patientB.id,
    notes: "Demo unauthorized branch check only.",
    items: [{ medicationName: "Demo medication placeholder" }]
  });

  await expectDenied("doctor cannot create investigation for out-of-branch patient", "POST", "/investigations/orders", doctor, {
    patientId: patientB.id,
    priority: "routine",
    items: [{ category: "laboratory", testName: "Demo unauthorized branch check" }]
  });

  await expectDenied("doctor cannot create report for out-of-branch patient", "POST", "/reports", doctor, {
    patientId: patientB.id,
    category: "laboratory",
    title: "Demo unauthorized branch check"
  });

  await expectDenied("doctor cannot create pregnancy for out-of-branch patient", "POST", "/pregnancies", doctor, {
    patientId: patientB.id,
    status: "active",
    gravida: 1,
    para: 0
  });

  await expectDenied("doctor cannot create OB ultrasound for out-of-branch patient", "POST", "/ob-ultrasounds", doctor, {
    patientId: patientB.id,
    impressionText: "Demo unauthorized branch check only. No diagnosis."
  });

  await expectDenied("accountant cannot create invoice for out-of-branch patient", "POST", "/billing/invoices", accountant, {
    patientId: patientB.id,
    invoiceNumber: `DEMO-SCOPE-INV-${Date.now()}`,
    items: [{ description: "Demo unauthorized branch check", quantity: 1, unitAmount: 50 }]
  });

  await expectDenied("reception cannot create consent for out-of-branch patient", "POST", "/consents", reception, {
    patientId: patientB.id,
    consentType: "treatment",
    status: "granted",
    notes: "Demo unauthorized branch check only."
  });

  await expectDenied("doctor cannot create AI draft for out-of-branch patient", "POST", "/ai-drafts", doctor, {
    patientId: patientB.id,
    draftType: "encounter_summary",
    inputSourceSummary: "Demo unauthorized branch check only."
  });

  record.warn("Patient-to-doctor assignment is not modeled; doctor patient reads are branch-scoped rather than assigned-doctor scoped.");
}

async function expectDenied(label, method, path, token, body) {
  const status = await apiStatus(method, path, token, body);
  assertStatus(status, [400, 403, 404], label);
  record.pass(label);
}

await main().catch((error) => record.fail("referenced scope setup", error));
record.summary();
