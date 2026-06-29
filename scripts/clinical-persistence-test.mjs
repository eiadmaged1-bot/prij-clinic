import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("CLINICAL-PERSISTENCE");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const reception = await login(demoUsers.reception);
  record.pass("demo users login");

  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `DEMO-CLINICAL-${runId}`,
    firstName: "Demo",
    lastName: "Clinical",
    notes: "Local demo clinical persistence test only."
  });
  record.pass("patient created");

  const startAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const appointment = await apiJson("POST", `/patients/${patient.id}/appointments`, owner, {
    startAt: startAt.toISOString(),
    endAt: new Date(startAt.getTime() + 30 * 60 * 1000).toISOString(),
    appointmentType: "Demo clinical workflow",
    notes: "Patient-context appointment."
  });
  record.pass("patient-context appointment created");

  const ticket = await apiJson("POST", `/patients/${patient.id}/queue-check-in`, owner, { appointmentId: appointment.id });
  if (!ticket.id) throw new Error("Queue check-in did not return id.");
  record.pass("patient-context queue check-in created");

  const encounter = await apiJson("POST", `/patients/${patient.id}/encounters`, owner, {
    appointmentId: appointment.id,
    chiefComplaint: "Demo complaint only.",
    historyText: "Demo history only.",
    examText: "Demo examination only.",
    assessmentText: "Doctor-authored demo impression only.",
    planText: "Demo plan only."
  });
  record.pass("guided visit encounter draft created");

  const updatedEncounter = await apiJson("PATCH", `/encounters/${encounter.id}`, owner, {
    historyText: "Updated demo history from guided visit.",
    planText: "Updated demo follow-up plan."
  });
  if (updatedEncounter.historyText !== "Updated demo history from guided visit.") {
    throw new Error("Guided visit update did not persist.");
  }
  record.pass("guided visit steps persisted");

  await apiJson("PATCH", `/encounters/${encounter.id}/sign`, owner);
  assertStatus(
    await apiStatus("PATCH", `/encounters/${encounter.id}`, owner, { planText: "Unsafe silent edit attempt." }),
    [400, 403],
    "signed encounter edit"
  );
  record.pass("signed encounter rejects silent edit");

  assertStatus(
    await apiStatus("POST", `/patients/${patient.id}/encounters`, reception, { chiefComplaint: "Unauthorized clinical action." }),
    [403],
    "receptionist encounter create"
  );
  record.pass("unauthorized clinical role denied");

  const prescription = await apiJson("POST", `/patients/${patient.id}/prescriptions`, owner, {
    encounterId: encounter.id,
    notes: "Manual demo prescription only.",
    items: [{ medicationName: "Demo medication placeholder", dose: "Demo dose", frequency: "Demo frequency" }]
  });
  record.pass("patient-context prescription created");

  const investigation = await apiJson("POST", `/patients/${patient.id}/investigations`, owner, {
    encounterId: encounter.id,
    priority: "routine",
    notes: "Demo clinical reason only.",
    items: [{ category: "laboratory", testName: "Demo lab order", instructions: "Demo order note." }]
  });
  record.pass("patient-context investigation order created");

  const report = await apiJson("POST", `/patients/${patient.id}/reports`, owner, {
    encounterId: encounter.id,
    investigationOrderId: investigation.id,
    category: "laboratory",
    title: "Demo report placeholder",
    resultSummary: "Demo report metadata only. No PHI file upload."
  });
  record.pass("patient-context report created");

  const pregnancy = await apiJson("POST", "/pregnancies", owner, {
    patientId: patient.id,
    status: "active",
    gravida: 1,
    para: 0,
    living: 0,
    abortions: 0,
    lmpDate: "2026-01-01",
    estimatedDueDate: "2026-10-08",
    datingMethod: "Demo LMP",
    notes: "Recording-only demo pregnancy episode."
  });
  const fetus = await apiJson("POST", `/pregnancies/${pregnancy.id}/fetuses`, owner, {
    label: "Singleton",
    status: "active",
    notes: "Demo fetus record only."
  });
  const antenatal = await apiJson("POST", `/pregnancies/${pregnancy.id}/antenatal-visits`, owner, {
    visitDate: "2026-06-01",
    gestationalAgeDisplay: "Demo GA",
    bloodPressure: "Demo BP",
    weightKg: 70,
    symptomsText: "Demo symptoms only.",
    fetalHeartText: "Demo fetal heart placeholder.",
    planText: "Clinician interpretation required.",
    nextFollowUpDate: "2026-06-15"
  });
  if (!fetus.id || !antenatal.id) throw new Error("OB/GYN child records were not created.");
  record.pass("OB/GYN pregnancy fetus and antenatal visit created");

  const ultrasound = await apiJson("POST", `/patients/${patient.id}/ultrasounds`, owner, {
    pregnancyId: pregnancy.id,
    encounterId: encounter.id,
    gestationalAgeWeeks: 12,
    gestationalAgeDays: 4,
    impressionText: "Doctor-authored demo ultrasound note. Recording only."
  });
  if (/fgr|fetal growth restriction|diagnosis/i.test(JSON.stringify(ultrasound))) {
    throw new Error("Ultrasound output appears to include diagnostic automation.");
  }
  record.pass("patient-context ultrasound draft is recording-only");

  const invoice = await apiJson("POST", `/patients/${patient.id}/invoices`, owner, {
    notes: "Demo invoice only. No payment gateway.",
    items: [{ description: "Demo consultation service", quantity: 1, unitAmount: 100 }]
  });
  const payment = await apiJson("POST", `/patients/${patient.id}/payments`, owner, {
    invoiceId: invoice.id,
    method: "cash",
    amount: 25,
    referenceNote: "Demo cash payment only."
  });
  if (!payment.id) throw new Error("Patient-context payment did not return id.");
  record.pass("patient-context invoice and payment created");

  const consent = await apiJson("POST", `/patients/${patient.id}/consents`, owner, {
    consentType: "treatment",
    status: "granted",
    notes: "Demo consent placeholder only. Not legal text."
  });
  record.pass("patient-context consent created");

  const timeline = await apiJson("GET", `/patients/${patient.id}/timeline`, owner);
  const timelineText = JSON.stringify(timeline.items ?? []);
  for (const expected of ["Appointment booked", "Checked in to queue", "Visit note signed", "Prescription created", "Investigation ordered", "Report created", "Pregnancy episode recorded", "Antenatal visit recorded", "Ultrasound draft recorded", "Invoice created", "Payment recorded", "Consent recorded"]) {
    if (!timelineText.includes(expected)) throw new Error(`Timeline missing ${expected}.`);
  }
  record.pass("patient timeline aggregates workflow records");

  const audit = (await apiJson("GET", "/audit?limit=300", owner)).auditLogs ?? [];
  for (const [action, resourceId] of [
    ["appointment.created", appointment.id],
    ["queue.checked_in", ticket.id],
    ["encounter.created", encounter.id],
    ["prescription.created", prescription.id],
    ["investigation_order.created", investigation.id],
    ["report.created", report.id],
    ["pregnancy.created", pregnancy.id],
    ["pregnancy_fetus.created", fetus.id],
    ["antenatal_visit.created", antenatal.id],
    ["ob_ultrasound.created", ultrasound.id],
    ["invoice.created", invoice.id],
    ["payment.recorded", payment.id],
    ["consent.created", consent.id]
  ]) {
    if (!audit.some((entry) => entry.action === action && entry.resourceId === resourceId)) {
      throw new Error(`Missing audit event ${action}.`);
    }
  }
  record.pass("clinical persistence actions are audited");
}

await main().catch((error) => record.fail("clinical persistence workflow", error));
record.summary();
