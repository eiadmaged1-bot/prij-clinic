import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("SCOPE-RECORDS");

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const nurse = await login(demoUsers.nurse);
  const doctor = await login(demoUsers.doctor);

  const ownerPatients = (await apiJson("GET", "/patients", owner)).patients ?? [];
  const nursePatients = (await apiJson("GET", "/patients", nurse)).patients ?? [];
  const patientA = ownerPatients.find((patient) => patient.medicalRecordNumber === "DEMO-MRN-001");
  const patientB = ownerPatients.find((patient) => patient.medicalRecordNumber === "DEMO-MRN-002");
  if (!patientA || !patientB) throw new Error("Seeded scope patients are missing.");

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

  record.warn("Create/update referenced-record branch validation is still a documented V0.1 limitation.");
  record.warn("Patient-to-doctor assignment is not modeled; doctor patient reads are branch-scoped rather than assigned-doctor scoped.");
}

await main().catch((error) => record.fail("referenced scope setup", error));
record.summary();
