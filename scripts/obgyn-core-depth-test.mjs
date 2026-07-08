import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("OBGYN-CORE");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const reception = await login(demoUsers.reception);

  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `DEMO-OBGYN-${runId}`,
    firstName: "Demo",
    lastName: "Obgyn",
    notes: "Fake OB/GYN core depth test patient only."
  });
  record.pass("fake patient created");

  const pregnancy = await apiJson("POST", "/pregnancies", owner, {
    patientId: patient.id,
    status: "active",
    gravida: 3,
    para: 1,
    living: 1,
    abortions: 1,
    lmpDate: "2026-01-01",
    estimatedDueDate: "2026-10-08",
    datingMethod: "Doctor-recorded demo LMP",
    riskFlags: "Doctor-recorded demo flag only; no scoring engine.",
    notes: "Recording-only pregnancy episode."
  });
  if (pregnancy.riskFlags?.toLowerCase().includes("score:")) {
    throw new Error("Pregnancy risk flags should be recorded text, not automatic interpretation.");
  }
  record.pass("pregnancy episode create supports depth fields");

  const updatedPregnancy = await apiJson("PATCH", `/pregnancies/${pregnancy.id}`, owner, {
    status: "inactive",
    notes: "Recording-only status update."
  });
  if (updatedPregnancy.status !== "inactive") throw new Error("Pregnancy status update did not persist.");
  record.pass("pregnancy episode update supports inactive status");

  const previous = await apiJson("POST", "/previous-pregnancies", owner, {
    patientId: patient.id,
    pregnancyEpisodeId: pregnancy.id,
    year: 2024,
    outcome: "Demo prior delivery",
    gestationalAgeAtOutcome: "Demo term",
    modeOfDelivery: "Demo vaginal delivery",
    birthWeightGrams: 3100,
    sex: "Demo recorded sex",
    complications: "Demo complication note only.",
    notes: "Obstetric history only; no inferred risk."
  });
  const previousList = await apiJson("GET", "/previous-pregnancies", owner);
  if (!previousList.previousPregnancies?.some((item) => item.id === previous.id)) {
    throw new Error("Previous pregnancy history was not returned by list endpoint.");
  }
  record.pass("previous pregnancy history create/list");

  const fetusA = await apiJson("POST", `/pregnancies/${pregnancy.id}/fetuses`, owner, {
    label: "A",
    chorionicity: "Demo dichorionic",
    amnionicity: "Demo diamniotic",
    status: "active",
    notes: "Multiple pregnancy recording only."
  });
  const fetusB = await apiJson("POST", `/pregnancies/${pregnancy.id}/fetuses`, owner, {
    label: "B",
    status: "active",
    notes: "Second fetus recording only."
  });
  const fetusList = await apiJson("GET", `/pregnancies/${pregnancy.id}/fetuses`, owner);
  if (fetusList.fetuses?.length < 2) throw new Error("Fetus list did not include multiple pregnancy records.");
  await apiJson("PATCH", `/pregnancies/${pregnancy.id}/fetuses/${fetusB.id}`, owner, {
    label: "B",
    status: "active",
    notes: "Updated fetus note only."
  });
  record.pass("fetus multiple pregnancy create/list/update");

  const visit = await apiJson("POST", `/pregnancies/${pregnancy.id}/antenatal-visits`, owner, {
    visitDate: "2026-06-01",
    gestationalAgeDisplay: "Doctor-recorded demo GA",
    bloodPressure: "Demo BP",
    weightKg: 72.5,
    pulseBpm: 82,
    edema: "Demo edema note",
    urineProtein: "Demo urine protein note",
    symptomsText: "Demo symptoms.",
    examinationText: "Demo examination.",
    fetalHeartText: "Demo fetal heart note.",
    fundalHeightText: "Demo fundal height.",
    planText: "Clinician plan text only.",
    medicationsNote: "Demo medication note.",
    investigationsNote: "Demo investigation note.",
    nextFollowUpDate: "2026-06-15"
  });
  const visits = await apiJson("GET", `/pregnancies/${pregnancy.id}/antenatal-visits`, owner);
  if (!visits.antenatalVisits?.some((item) => item.id === visit.id)) {
    throw new Error("Antenatal visit was not returned by list endpoint.");
  }
  record.pass("antenatal visit create/list depth fields");

  const doctorVisit = await apiJson("POST", `/patients/${patient.id}/doctor-visit/start`, owner, {});
  const encounterId = doctorVisit.encounter?.id;
  if (!encounterId) throw new Error("Doctor visit did not return encounterId for locked ultrasound context.");
  record.pass("doctor visit context created for ultrasound");

  const ultrasound = await apiJson("POST", "/ob-ultrasounds", owner, {
    patientId: patient.id,
    pregnancyId: pregnancy.id,
    fetusId: fetusA.id,
    encounterId,
    performedAt: "2026-06-01T09:30:00.000Z",
    scanType: "Demo growth scan",
    indication: "Demo indication only.",
    gestationalAgeDisplay: "Doctor-recorded demo GA",
    fetalHeartText: "Demo fetal heart note.",
    presentation: "Demo presentation",
    placenta: "Demo placenta note",
    amnioticFluid: "Demo amniotic fluid note",
    bpdMm: 22.1,
    hcMm: 85.2,
    acMm: 70.3,
    flMm: 10.4,
    efwGrams: 120,
    dopplerNote: "Placeholder Doppler note; clinician interpretation required.",
    impressionText: "Doctor-authored impression only."
  });
  const ultrasoundText = JSON.stringify(ultrasound).toLowerCase();
  for (const forbidden of ["percentile", "fetal growth restriction", "diagnosis", "diagnosed"]) {
    if (ultrasoundText.includes(forbidden)) {
      throw new Error(`Ultrasound response included forbidden interpretation text: ${forbidden}`);
    }
  }
  record.pass("OB ultrasound recording create/list without diagnosis behavior");

  assertStatus(
    await apiStatus("POST", "/previous-pregnancies", reception, {
      patientId: patient.id,
      outcome: "Unauthorized demo history attempt."
    }),
    [403],
    "reception previous pregnancy create"
  );
  record.pass("unauthorized OB/GYN write role denied");

  const timeline = await apiJson("GET", `/patients/${patient.id}/timeline`, owner);
  const timelineText = JSON.stringify(timeline.items ?? []);
  for (const expected of [
    "Pregnancy episode recorded",
    "Previous pregnancy history recorded",
    "Fetus record created",
    "Fetus record updated",
    "Antenatal visit recorded",
    "Ultrasound draft recorded"
  ]) {
    if (!timelineText.includes(expected)) throw new Error(`Timeline missing ${expected}.`);
  }
  record.pass("patient timeline includes OB/GYN depth events");

  const audit = (await apiJson("GET", "/audit?limit=300", owner)).auditLogs ?? [];
  for (const [action, resourceId] of [
    ["pregnancy.created", pregnancy.id],
    ["pregnancy.updated", pregnancy.id],
    ["previous_pregnancy.created", previous.id],
    ["pregnancy_fetus.created", fetusA.id],
    ["pregnancy_fetus.updated", fetusB.id],
    ["antenatal_visit.created", visit.id],
    ["ob_ultrasound.created", ultrasound.id]
  ]) {
    if (!audit.some((entry) => entry.action === action && entry.resourceId === resourceId)) {
      throw new Error(`Missing audit event ${action}.`);
    }
  }
  record.pass("OB/GYN depth actions are audited");
}

await main().catch((error) => record.fail("OB/GYN core depth workflow", error));
record.summary();
