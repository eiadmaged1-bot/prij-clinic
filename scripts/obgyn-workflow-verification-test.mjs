import { readFile } from "node:fs/promises";
import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("OBGYN-WORKFLOW");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

async function main() {
  await waitForApi();

  const owner = await login(demoUsers.owner);
  const reception = await login(demoUsers.reception);

  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `DEMO-OBFLOW-${runId}`,
    firstName: "Demo",
    lastName: "Workflow",
    notes: "Fake OB/GYN workflow verification patient only."
  });

  const pregnancy = await apiJson("POST", "/pregnancies", owner, {
    patientId: patient.id,
    status: "active",
    gravida: 2,
    para: 1,
    living: 1,
    abortions: 0,
    lmpDate: "2026-01-05",
    estimatedDueDate: "2026-10-12",
    datingMethod: "Doctor-recorded demo LMP",
    notes: "Workflow verification pregnancy only."
  });

  const previous = await apiJson("POST", "/previous-pregnancies", owner, {
    patientId: patient.id,
    pregnancyEpisodeId: pregnancy.id,
    year: 2023,
    outcome: "Demo previous pregnancy outcome",
    gestationalAgeAtOutcome: "Demo term note",
    modeOfDelivery: "Demo mode",
    complications: "Recording-only history."
  });

  const fetus = await apiJson("POST", `/pregnancies/${pregnancy.id}/fetuses`, owner, {
    label: "A",
    chorionicity: "Demo chorionicity",
    amnionicity: "Demo amnionicity",
    status: "active",
    notes: "Fetus record only."
  });

  const visit = await apiJson("POST", `/pregnancies/${pregnancy.id}/antenatal-visits`, owner, {
    visitDate: "2026-06-08",
    gestationalAgeDisplay: "Doctor-recorded demo GA",
    bloodPressure: "Demo BP",
    weightKg: 70.2,
    symptomsText: "Demo symptom note.",
    examinationText: "Demo examination note.",
    fetalHeartText: "Demo fetal heart note.",
    fundalHeightText: "Demo fundal height.",
    planText: "Doctor-authored demo plan.",
    investigationsNote: "Demo investigation plan.",
    nextFollowUpDate: "2026-06-22"
  });

  const ultrasound = await apiJson("POST", "/ob-ultrasounds", owner, {
    patientId: patient.id,
    pregnancyId: pregnancy.id,
    fetusId: fetus.id,
    performedAt: "2026-06-08T09:00:00.000Z",
    scanType: "Demo workflow scan",
    indication: "Demo indication only.",
    gestationalAgeDisplay: "Doctor-recorded demo GA",
    fetalHeartText: "Demo fetal heart.",
    presentation: "Demo presentation",
    placenta: "Demo placenta.",
    amnioticFluid: "Demo amniotic fluid.",
    bpdMm: 25.1,
    hcMm: 92.2,
    acMm: 80.3,
    flMm: 14.4,
    efwGrams: 180,
    dopplerNote: "Doppler note placeholder only.",
    impressionText: "Doctor-written impression only."
  });

  for (const created of [pregnancy, previous, fetus, visit, ultrasound]) {
    if (!created.id) throw new Error("OB/GYN workflow record did not return an id.");
  }
  record.pass("doctor workflow creates pregnancy, history, fetus, antenatal visit, and ultrasound records");

  const pregnancyFile = await apiJson("GET", `/pregnancies/${pregnancy.id}`, owner);
  const ultrasoundList = await apiJson("GET", "/ob-ultrasounds", owner);
  const workflowText = JSON.stringify({ pregnancyFile, ultrasoundList });
  for (const expected of ["Demo workflow scan", "Doctor-authored demo plan", "Demo previous pregnancy outcome", "A"]) {
    if (!workflowText.includes(expected)) throw new Error(`OB/GYN workflow response missing ${expected}.`);
  }
  record.pass("OB/GYN workspace data endpoints return workflow records");

  const timeline = await apiJson("GET", `/patients/${patient.id}/timeline`, owner);
  const timelineText = JSON.stringify(timeline.items ?? []);
  for (const expected of ["Pregnancy episode recorded", "Previous pregnancy history recorded", "Fetus record created", "Antenatal visit recorded", "Ultrasound draft recorded"]) {
    if (!timelineText.includes(expected)) throw new Error(`Timeline missing ${expected}.`);
  }
  record.pass("timeline shows OB/GYN workflow events");

  const forbiddenText = JSON.stringify({ pregnancyFile, ultrasoundList, timeline, ultrasound }).toLowerCase();
  for (const forbidden of ["fetal growth restriction", "percentile engine", "automatic diagnosis"]) {
    if (forbiddenText.includes(forbidden)) throw new Error(`Workflow response includes forbidden safety text: ${forbidden}.`);
  }
  record.pass("workflow responses remain recording-only without automated interpretation");

  assertStatus(await apiStatus("GET", "/admin/accounts", reception), 403, "non-admin accounts direct access");
  record.pass("non-admin accounts access remains denied");

  const patientSource = await readFile("apps/web/app/patients/[id]/page.tsx", "utf8");
  for (const label of [
    "Pregnancy Overview",
    "Obstetric History",
    "Fetus Records",
    "Antenatal Visits",
    "OB ultrasound report builder",
    "Timeline integration",
    "Print ultrasound report",
    "Measurements are recorded for clinician review. Interpretation must be completed by the doctor.",
    "No automated growth interpretation",
    "Save Visit",
    "Return to patient file"
  ]) {
    if (!patientSource.includes(label)) throw new Error(`Patient OB/GYN workspace source missing ${label}.`);
  }

  const shellSource = await readFile("apps/web/app/mvp-page.tsx", "utf8");
  for (const label of ["Current user", "Logout", "Accounts", "displayName", "loginId"]) {
    if (!shellSource.includes(label)) throw new Error(`Session shell source missing ${label}.`);
  }

  const loginSource = await readFile("apps/web/app/login/page.tsx", "utf8");
  if (!loginSource.includes("Already logged in as")) throw new Error("Login page missing already-logged-in state.");
  record.pass("workspace source keeps print, safety, session, and login cues");
}

await main().catch((error) => record.fail("OB/GYN workflow verification", error));
record.summary();
