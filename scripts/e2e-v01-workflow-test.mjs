import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("E2E-V01");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  record.pass("login demo owner");

  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `DEMO-E2E-${runId}`,
    firstName: "Demo",
    lastName: "Workflow",
    notes: "Local V0.1 end-to-end demo record only."
  });
  record.pass("create demo patient");

  const consent = await apiJson("POST", "/consents", owner, {
    patientId: patient.id,
    consentType: "treatment",
    status: "granted",
    notes: "Demo consent foundation only. Not production legal text."
  });
  await apiJson("GET", `/consents?patientId=${patient.id}`, owner);
  record.pass("create and read demo consent foundation record");

  const appointment = await apiJson("POST", "/appointments", owner, {
    patientId: patient.id,
    startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    appointmentType: "Demo V0.1 workflow",
    notes: "Local demo appointment only."
  });
  record.pass("create appointment");

  const ticket = await apiJson("POST", "/queue/check-in", owner, {
    patientId: patient.id,
    appointmentId: appointment.id,
    priority: "routine"
  });
  record.pass("check in queue ticket");

  await apiJson("PATCH", `/queue/${ticket.id}/call`, owner);
  await apiJson("PATCH", `/queue/${ticket.id}/complete`, owner);
  record.pass("call and complete queue ticket");

  const encounter = await apiJson("POST", "/encounters", owner, {
    patientId: patient.id,
    appointmentId: appointment.id,
    chiefComplaint: "Demo visit reason only.",
    historyText: "Demo history placeholder only.",
    examText: "Demo exam placeholder only.",
    planText: "Demo plan placeholder only. Doctor review required."
  });
  record.pass("create encounter");

  const prescription = await apiJson("POST", "/prescriptions", owner, {
    patientId: patient.id,
    encounterId: encounter.id,
    notes: "Demo prescription placeholder only.",
    items: [{ medicationName: "Demo medication placeholder", dose: "Demo dose", instructions: "Demo instructions only." }]
  });
  if (!prescription.id) throw new Error("Prescription did not return an id.");
  record.pass("create prescription");

  const investigation = await apiJson("POST", "/investigations/orders", owner, {
    patientId: patient.id,
    encounterId: encounter.id,
    priority: "routine",
    notes: "Demo investigation order only.",
    items: [{ category: "laboratory", testName: "Demo lab test placeholder" }]
  });
  record.pass("create investigation order");

  const pregnancy = await apiJson("POST", "/pregnancies", owner, {
    patientId: patient.id,
    status: "active",
    gravida: 1,
    para: 0,
    riskLevel: "routine",
    notes: "Local demo pregnancy record only."
  });
  record.pass("create pregnancy record");

  const ultrasound = await apiJson("POST", "/ob-ultrasounds", owner, {
    patientId: patient.id,
    pregnancyId: pregnancy.id,
    encounterId: encounter.id,
    gestationalAgeWeeks: 12,
    gestationalAgeDays: 2,
    fetalHeartRateBpm: 150,
    impressionText: "Demo OB ultrasound note only. No diagnostic automation."
  });
  if (/fgr|fetal growth restriction|diagnosis/i.test(JSON.stringify(ultrasound))) {
    throw new Error("OB ultrasound output appears to include diagnostic automation.");
  }
  record.pass("create OB ultrasound record without diagnostic automation");

  const report = await apiJson("POST", "/reports", owner, {
    patientId: patient.id,
    encounterId: encounter.id,
    investigationOrderId: investigation.id,
    category: "laboratory",
    title: "Demo report metadata placeholder",
    source: "local_demo",
    resultSummary: "Demo report metadata only. Doctor review required."
  });
  await apiJson("PATCH", `/reports/${report.id}/review`, owner);
  record.pass("create and review report metadata");

  const invoice = await apiJson("POST", "/billing/invoices", owner, {
    patientId: patient.id,
    invoiceNumber: `DEMO-E2E-INV-${runId}`,
    notes: "Demo invoice only. No payment gateway.",
    items: [{ description: "Demo consultation service", quantity: 1, unitAmount: 120 }]
  });
  await apiJson("POST", `/billing/invoices/${invoice.id}/issue`, owner);
  record.pass("create and issue invoice");

  const payment = await apiJson("POST", "/billing/payments", owner, {
    invoiceId: invoice.id,
    method: "cash",
    amount: 20,
    referenceNote: "Demo cash payment only. No card data."
  });
  if (!payment.id) throw new Error("Payment did not return an id.");
  record.pass("record demo payment");

  const draft = await apiJson("POST", "/ai-drafts", owner, {
    draftType: "encounter_summary",
    patientId: patient.id,
    encounterId: encounter.id,
    inputSourceSummary: "Local V0.1 demo AI draft only. No external AI request."
  });
  if (draft.modelProvider !== "disabled_mock" || draft.modelName !== "no_external_ai") {
    throw new Error("AI draft was not disabled/mock-only.");
  }
  assertStatus(await apiStatus("POST", `/ai-drafts/${draft.id}/insert-approved`, owner), 404, "AI insert route");
  await apiJson("PATCH", `/ai-drafts/${draft.id}/review`, owner, {
    status: "rejected",
    reviewNote: "Demo V0.1 workflow rejection."
  });
  record.pass("create and review disabled/mock AI draft");

  await apiJson("GET", "/dashboard/summary", owner);
  record.pass("dashboard summary responds");

  const audit = (await apiJson("GET", "/audit?limit=200", owner)).auditLogs ?? [];
  const requiredAudit = [
    ["patient.created", patient.id],
    ["consent.created", consent.id],
    ["appointment.created", appointment.id],
    ["queue.checked_in", ticket.id],
    ["encounter.created", encounter.id],
    ["prescription.created", prescription.id],
    ["investigation_order.created", investigation.id],
    ["pregnancy.created", pregnancy.id],
    ["ob_ultrasound.created", ultrasound.id],
    ["report.created", report.id],
    ["invoice.created", invoice.id],
    ["payment.recorded", payment.id],
    ["ai_draft.rejected", draft.id]
  ];

  for (const [action, resourceId] of requiredAudit) {
    if (!audit.some((entry) => entry.action === action && entry.resourceId === resourceId)) {
      throw new Error(`Missing audit event ${action}.`);
    }
  }
  record.pass("representative audit metadata exists");

  record.warn("V0.1 happy path uses demo placeholders and does not prove production clinical, consent, payment, or file-storage readiness.");
}

await main().catch((error) => record.fail("V0.1 workflow", error));
record.summary();
