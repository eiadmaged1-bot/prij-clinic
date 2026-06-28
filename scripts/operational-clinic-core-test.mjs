import { apiJson, apiRequest, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("OPERATIONAL-MVP");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

async function main() {
  await waitForApi();
  const owner = await apiJson("POST", "/auth/login", null, { identifier: "eyad", password: "eyad" });
  const ownerToken = owner.token;
  if (!ownerToken || !owner.user?.roles?.includes("Owner")) throw new Error("eyad local owner login failed.");
  record.pass("owner login works");

  const receptionToken = await login(demoUsers.reception);
  assertStatus(await apiStatus("GET", "/admin/settings/appearance", receptionToken), 403, "reception admin appearance denial");
  record.pass("receptionist cannot access admin appearance");

  const patient = await apiJson("POST", "/patients", ownerToken, {
    medicalRecordNumber: `DEMO-OPS-${runId}`,
    firstName: "Demo",
    lastName: "Operations",
    notes: "Operational MVP demo patient only."
  });
  await apiJson("GET", `/patients/${patient.id}`, ownerToken);
  record.pass("patient creation and file open work");

  const appointment = await apiJson("POST", "/appointments", ownerToken, {
    patientId: patient.id,
    startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    appointmentType: "Operational MVP demo",
    notes: "Patient-context appointment."
  });
  record.pass("appointment from patient context works");

  const ticket = await apiJson("POST", "/queue/check-in", ownerToken, {
    patientId: patient.id,
    appointmentId: appointment.id,
    priority: "routine"
  });
  record.pass("queue check-in from patient context works");

  const encounter = await apiJson("POST", "/encounters", ownerToken, {
    patientId: patient.id,
    appointmentId: appointment.id,
    chiefComplaint: "Demo visit reason only.",
    historyText: "Demo history placeholder only.",
    examText: "Demo examination placeholder only.",
    assessmentText: "Clinician-written assessment placeholder. No automatic diagnosis.",
    planText: "Demo plan placeholder only."
  });
  record.pass("doctor visit note from patient context works");

  const prescription = await apiJson("POST", "/prescriptions", ownerToken, {
    patientId: patient.id,
    encounterId: encounter.id,
    notes: "Manual demo prescription only.",
    items: [{ medicationName: "Demo medication placeholder", dose: "Demo dose", instructions: "Demo instructions only." }]
  });
  if (!prescription.id) throw new Error("Prescription missing id.");
  record.pass("prescription from patient context works");

  const investigation = await apiJson("POST", "/investigations/orders", ownerToken, {
    patientId: patient.id,
    encounterId: encounter.id,
    priority: "routine",
    notes: "Demo investigation order only.",
    items: [{ category: "laboratory", testName: "Demo lab test placeholder" }]
  });
  record.pass("investigation order from patient context works");

  const report = await apiJson("POST", "/reports", ownerToken, {
    patientId: patient.id,
    encounterId: encounter.id,
    investigationOrderId: investigation.id,
    category: "laboratory",
    title: "Demo operational report metadata",
    source: "local_demo",
    resultSummary: "Report metadata placeholder only."
  });
  record.pass("report metadata from patient context works");

  await apiJson("PATCH", `/encounters/${encounter.id}/sign`, ownerToken);
  record.pass("doctor can sign the demo visit note explicitly");

  const pregnancy = await apiJson("POST", "/pregnancies", ownerToken, {
    patientId: patient.id,
    status: "active",
    gravida: 1,
    para: 0,
    riskLevel: "routine",
    notes: "Recording only. Clinician interpretation required."
  });
  const ultrasound = await apiJson("POST", "/ob-ultrasounds", ownerToken, {
    patientId: patient.id,
    pregnancyId: pregnancy.id,
    encounterId: encounter.id,
    gestationalAgeWeeks: 12,
    gestationalAgeDays: 0,
    fetalHeartRateBpm: 150,
    impressionText: "Recording only. Physician interpretation required. No diagnostic automation."
  });
  if (/\bfgr\b|fetal growth restriction/i.test(JSON.stringify(ultrasound))) {
    throw new Error("Ultrasound response appears diagnostic.");
  }
  await apiJson("PATCH", `/pregnancies/${pregnancy.id}`, ownerToken, {
    notes: "Antenatal visit recording only. BP, weight, symptoms, fetal heart placeholder, plan, and next follow-up were recorded as demo text."
  });
  record.pass("OB/GYN pregnancy and ultrasound recording work without diagnostic automation");

  const invoice = await apiJson("POST", "/billing/invoices", ownerToken, {
    patientId: patient.id,
    invoiceNumber: `DEMO-OPS-INV-${runId}`,
    notes: "Demo invoice only. No payment gateway.",
    items: [{ description: "Demo consultation service", quantity: 1, unitAmount: 120 }]
  });
  const payment = await apiJson("POST", "/billing/payments", ownerToken, {
    invoiceId: invoice.id,
    method: "cash",
    amount: 20,
    referenceNote: "Demo cash payment only. No card data."
  });
  if (!payment.id) throw new Error("Payment missing id.");
  record.pass("invoice and payment from patient context work");

  const consent = await apiJson("POST", "/consents", ownerToken, {
    patientId: patient.id,
    consentType: "treatment",
    status: "granted",
    notes: "Demo consent foundation only."
  });
  record.pass("consent from patient context works");

  const aiDraft = await apiJson("POST", "/ai-drafts", ownerToken, {
    draftType: "encounter_summary",
    patientId: patient.id,
    encounterId: encounter.id,
    inputSourceSummary: "Local demo AI draft placeholder only. No external AI request."
  });
  if (aiDraft.modelProvider !== "disabled_mock") throw new Error("AI draft is not disabled/mock-only.");
  record.pass("AI placeholder remains disabled/mock-only");

  assertStatus(await apiStatus("POST", `/ai-drafts/${aiDraft.id}/insert-approved`, ownerToken), 404, "AI final insert route");
  record.pass("AI cannot insert final clinical records");

  const audit = (await apiJson("GET", "/audit?limit=200", ownerToken)).auditLogs ?? [];
  for (const [action, id] of [
    ["patient.created", patient.id],
    ["appointment.created", appointment.id],
    ["queue.checked_in", ticket.id],
    ["encounter.created", encounter.id],
    ["encounter.signed", encounter.id],
    ["prescription.created", prescription.id],
    ["investigation_order.created", investigation.id],
    ["report.created", report.id],
    ["pregnancy.created", pregnancy.id],
    ["ob_ultrasound.created", ultrasound.id],
    ["invoice.created", invoice.id],
    ["payment.recorded", payment.id],
    ["consent.created", consent.id],
    ["ai_draft.placeholder_created", aiDraft.id]
  ]) {
    if (!audit.some((entry) => entry.action === action && entry.resourceId === id)) {
      throw new Error(`Missing timeline/audit event ${action}.`);
    }
  }
  record.pass("patient journey records have audit metadata");

  const service = await apiJson("POST", "/admin/services", ownerToken, {
    code: `OPS-${runId}`,
    name: "Demo operational service",
    category: "consultation",
    price: 120,
    currency: "EGP"
  });
  const deniedService = await apiRequest("PATCH", `/admin/services/${service.id}`, receptionToken, { price: 150 });
  assertStatus(deniedService.status, 403, "reception service price edit denial");
  record.pass("service price edit remains admin-only");

  assertStatus(await apiStatus("POST", `/admin/overrides/invoices/${invoice.id}/void`, ownerToken, {}), 400, "override without reason");
  record.pass("safe override requires reason");
}

await main().catch((error) => record.fail("operational workflow", error));
record.summary();
