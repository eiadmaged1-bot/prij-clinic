export const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
export const DEMO_PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";

export const demoUsers = {
  owner: "demo.owner@prij.local",
  doctor: "demo.doctor@prij.local",
  reception: "demo.reception@prij.local",
  accountant: "demo.accountant@prij.local",
  nurse: "demo.nurse@prij.local"
};

export const routeManifest = [
  { method: "GET", path: "/auth/me", category: "auth", denyAs: null },
  { method: "POST", path: "/auth/logout", category: "auth", denyAs: null },
  { method: "GET", path: "/admin/users", category: "admin", denyAs: "accountant" },
  { method: "GET", path: "/admin/roles", category: "admin", denyAs: "accountant" },
  { method: "GET", path: "/admin/permissions", category: "admin", denyAs: "accountant" },
  { method: "GET", path: "/audit", category: "audit", denyAs: "reception" },
  { method: "POST", path: "/patients", category: "patients", fixtureBody: "patient", denyAs: "nurse" },
  { method: "GET", path: "/patients", category: "patients", denyAs: null },
  { method: "GET", path: "/patients/:patientId", category: "patients", denyAs: null },
  { method: "PATCH", path: "/patients/:patientId", category: "patients", fixtureBody: "patientPatch", denyAs: "nurse" },
  { method: "POST", path: "/appointments", category: "appointments", fixtureBody: "appointment", denyAs: "nurse" },
  { method: "GET", path: "/appointments", category: "appointments", denyAs: null },
  { method: "GET", path: "/appointments/calendar?date=:today", category: "appointments", denyAs: null },
  { method: "GET", path: "/appointments/:appointmentId", category: "appointments", denyAs: null },
  { method: "PATCH", path: "/appointments/:appointmentId/status", category: "appointments", fixtureBody: "appointmentStatus", denyAs: "nurse" },
  { method: "POST", path: "/queue/check-in", category: "queue", fixtureBody: "queue", denyAs: "doctor" },
  { method: "GET", path: "/queue/today", category: "queue", denyAs: null },
  { method: "PATCH", path: "/queue/:queueTicketId/call", category: "queue", denyAs: "doctor" },
  { method: "PATCH", path: "/queue/:queueTicketId/complete", category: "queue", denyAs: "doctor" },
  { method: "PATCH", path: "/queue/:queueTicketId/cancel", category: "queue", denyAs: "doctor" },
  { method: "POST", path: "/encounters", category: "encounters", fixtureBody: "encounter", denyAs: "reception" },
  { method: "GET", path: "/encounters", category: "encounters", denyAs: "reception" },
  { method: "GET", path: "/encounters/:encounterId", category: "encounters", denyAs: "reception" },
  { method: "PATCH", path: "/encounters/:encounterId", category: "encounters", fixtureBody: "encounterPatch", denyAs: "reception" },
  { method: "PATCH", path: "/encounters/:encounterId/sign", category: "encounters", denyAs: "reception" },
  { method: "POST", path: "/prescriptions", category: "prescriptions", fixtureBody: "prescription", denyAs: "reception" },
  { method: "GET", path: "/prescriptions", category: "prescriptions", denyAs: "reception" },
  { method: "GET", path: "/prescriptions/:prescriptionId", category: "prescriptions", denyAs: "reception" },
  { method: "PATCH", path: "/prescriptions/:prescriptionId", category: "prescriptions", fixtureBody: "prescriptionPatch", denyAs: "reception" },
  { method: "PATCH", path: "/prescriptions/:prescriptionId/sign", category: "prescriptions", denyAs: "reception" },
  { method: "POST", path: "/investigations/orders", category: "investigations", fixtureBody: "investigation", denyAs: "accountant" },
  { method: "GET", path: "/investigations/orders", category: "investigations", denyAs: "accountant" },
  { method: "GET", path: "/investigations/orders/:investigationOrderId", category: "investigations", denyAs: "accountant" },
  { method: "PATCH", path: "/investigations/orders/:investigationOrderId/status", category: "investigations", fixtureBody: "investigationStatus", denyAs: "accountant" },
  { method: "POST", path: "/reports", category: "reports", fixtureBody: "report", denyAs: "accountant" },
  { method: "GET", path: "/reports", category: "reports", denyAs: "accountant" },
  { method: "GET", path: "/reports/:reportId", category: "reports", denyAs: "accountant" },
  { method: "PATCH", path: "/reports/:reportId", category: "reports", fixtureBody: "reportPatch", denyAs: "accountant" },
  { method: "PATCH", path: "/reports/:reportId/review", category: "reports", denyAs: "accountant" },
  { method: "POST", path: "/pregnancies", category: "pregnancies", fixtureBody: "pregnancy", denyAs: "accountant" },
  { method: "GET", path: "/pregnancies", category: "pregnancies", denyAs: "accountant" },
  { method: "GET", path: "/pregnancies/:pregnancyId", category: "pregnancies", denyAs: "accountant" },
  { method: "PATCH", path: "/pregnancies/:pregnancyId", category: "pregnancies", fixtureBody: "pregnancyPatch", denyAs: "accountant" },
  { method: "POST", path: "/ob-ultrasounds", category: "ob-ultrasound", fixtureBody: "obUltrasound", denyAs: "accountant" },
  { method: "GET", path: "/ob-ultrasounds", category: "ob-ultrasound", denyAs: "accountant" },
  { method: "GET", path: "/ob-ultrasounds/:obUltrasoundId", category: "ob-ultrasound", denyAs: "accountant" },
  { method: "PATCH", path: "/ob-ultrasounds/:obUltrasoundId", category: "ob-ultrasound", fixtureBody: "obUltrasoundPatch", denyAs: "accountant" },
  { method: "PATCH", path: "/ob-ultrasounds/:obUltrasoundId/review", category: "ob-ultrasound", denyAs: "accountant" },
  { method: "POST", path: "/billing/invoices", category: "billing", fixtureBody: "invoice", denyAs: "doctor" },
  { method: "GET", path: "/billing/invoices", category: "billing", denyAs: "doctor" },
  { method: "GET", path: "/billing/invoices/:invoiceId", category: "billing", denyAs: "doctor" },
  { method: "PATCH", path: "/billing/invoices/:invoiceId", category: "billing", fixtureBody: "invoicePatch", denyAs: "doctor" },
  { method: "POST", path: "/billing/invoices/:draftInvoiceId/issue", category: "billing", denyAs: "doctor" },
  { method: "POST", path: "/billing/payments", category: "billing", fixtureBody: "payment", denyAs: "doctor" },
  { method: "GET", path: "/billing/payments", category: "billing", denyAs: "doctor" },
  { method: "POST", path: "/billing/payments/:paymentId/reverse", category: "billing", fixtureBody: "reversePayment", denyAs: "doctor" },
  { method: "GET", path: "/dashboard/summary", category: "dashboard", denyAs: "doctor" },
  { method: "POST", path: "/ai-drafts", category: "ai-drafts", fixtureBody: "aiDraft", denyAs: "nurse" },
  { method: "GET", path: "/ai-drafts", category: "ai-drafts", denyAs: "nurse" },
  { method: "GET", path: "/ai-drafts/:aiDraftId", category: "ai-drafts", denyAs: "nurse" },
  { method: "PATCH", path: "/ai-drafts/:aiDraftId/review", category: "ai-drafts", fixtureBody: "aiReview", denyAs: "nurse" }
];

export async function waitForApi(timeoutMs = Number(process.env.API_WAIT_TIMEOUT_MS || 90_000)) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const body = await apiJson("GET", "/health");
      if (body.status === "ok") return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw lastError || new Error("API did not become ready.");
}

export async function login(email, password = DEMO_PASSWORD) {
  const body = await apiJson("POST", "/auth/login", null, { email, password });
  if (!body.token) throw new Error(`Login did not return token for ${email}`);
  return body.token;
}

export async function apiJson(method, path, token, body) {
  const response = await apiRequest(method, path, token, body);
  if (!response.ok) {
    throw new Error(`${method} ${path} returned ${response.status}: ${formatBody(response.body)}`);
  }
  return response.body;
}

export async function apiStatus(method, path, token, body) {
  const response = await apiRequest(method, path, token, body);
  return response.status;
}

export async function apiRequest(method, path, token, body) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return { ok: response.ok, status: response.status, body: parsed };
}

export function assertStatus(actual, expected, label) {
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (!expectedList.includes(actual)) {
    throw new Error(`${label} expected ${expectedList.join("/")} but received ${actual}`);
  }
}

export function substitutePath(path, ids) {
  const today = new Date().toISOString().slice(0, 10);
  return path
    .replace(":today", today)
    .replace(":patientId", ids.patientId)
    .replace(":appointmentId", ids.appointmentId)
    .replace(":queueTicketId", ids.queueTicketId)
    .replace(":encounterId", ids.encounterId)
    .replace(":prescriptionId", ids.prescriptionId)
    .replace(":investigationOrderId", ids.investigationOrderId)
    .replace(":reportId", ids.reportId)
    .replace(":pregnancyId", ids.pregnancyId)
    .replace(":obUltrasoundId", ids.obUltrasoundId)
    .replace(":draftInvoiceId", ids.draftInvoiceId)
    .replace(":invoiceId", ids.invoiceId)
    .replace(":paymentId", ids.paymentId)
    .replace(":aiDraftId", ids.aiDraftId);
}

export function bodyFor(kind, ids) {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const bodies = {
    patient: {
      medicalRecordNumber: `DEMO-ROUTE-${runId}`,
      firstName: "Demo",
      lastName: "Route",
      notes: "Demo route authorization test only."
    },
    patientPatch: { notes: "Demo route authorization patch only." },
    appointment: {
      patientId: ids.patientId,
      startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      appointmentType: "Demo route check",
      notes: "Demo appointment authorization test only."
    },
    appointmentStatus: { status: "booked" },
    queue: { patientId: ids.patientId, appointmentId: ids.appointmentId, priority: "routine" },
    encounter: {
      patientId: ids.patientId,
      appointmentId: ids.appointmentId,
      chiefComplaint: "Demo workflow note only."
    },
    encounterPatch: { planText: "Demo plan text only. Doctor review required." },
    prescription: {
      patientId: ids.patientId,
      encounterId: ids.encounterId,
      notes: "Demo prescription record only.",
      items: [{ medicationName: "Demo medication placeholder", dose: "Demo dose" }]
    },
    prescriptionPatch: { notes: "Demo prescription update only.", items: [{ medicationName: "Demo medication placeholder" }] },
    investigation: {
      patientId: ids.patientId,
      encounterId: ids.encounterId,
      priority: "routine",
      notes: "Demo investigation order only.",
      items: [{ category: "laboratory", testName: "Demo test placeholder" }]
    },
    investigationStatus: { status: "scheduled" },
    report: {
      patientId: ids.patientId,
      encounterId: ids.encounterId,
      investigationOrderId: ids.investigationOrderId,
      category: "laboratory",
      title: "Demo report metadata placeholder",
      source: "local_demo",
      resultSummary: "Demo report summary only. Doctor review required."
    },
    reportPatch: { title: "Demo report metadata placeholder updated" },
    pregnancy: { patientId: ids.patientId, status: "active", gravida: 1, para: 0, notes: "Demo pregnancy record only." },
    pregnancyPatch: { notes: "Demo pregnancy update only." },
    obUltrasound: {
      patientId: ids.patientId,
      pregnancyId: ids.pregnancyId,
      encounterId: ids.encounterId,
      gestationalAgeWeeks: 12,
      gestationalAgeDays: 2,
      fetalHeartRateBpm: 150,
      impressionText: "Demo OB ultrasound note only. No diagnostic automation."
    },
    obUltrasoundPatch: { impressionText: "Demo OB ultrasound update only. No diagnosis generated." },
    invoice: {
      patientId: ids.patientId,
      invoiceNumber: `DEMO-ROUTE-INV-${runId}`,
      notes: "Demo invoice only. No payment gateway.",
      items: [{ description: "Demo consultation service", quantity: 1, unitAmount: 100 }]
    },
    invoicePatch: { notes: "Demo invoice update only." },
    payment: { invoiceId: ids.invoiceId, method: "cash", amount: 10, referenceNote: "Demo cash payment only." },
    reversePayment: { reason: "Demo reversal authorization check only." },
    aiDraft: {
      draftType: "encounter_summary",
      patientId: ids.patientId,
      encounterId: ids.encounterId,
      inputSourceSummary: "Demo AI route test only. No external AI request."
    },
    aiReview: { status: "rejected", reviewNote: "Demo AI review rejection only." }
  };
  return bodies[kind];
}

export async function createRouteFixtures(ownerToken) {
  const ids = {};
  const patient = await apiJson("POST", "/patients", ownerToken, bodyFor("patient", ids));
  ids.patientId = patient.id;
  const appointment = await apiJson("POST", "/appointments", ownerToken, bodyFor("appointment", ids));
  ids.appointmentId = appointment.id;
  const queueTicket = await apiJson("POST", "/queue/check-in", ownerToken, bodyFor("queue", ids));
  ids.queueTicketId = queueTicket.id;
  const encounter = await apiJson("POST", "/encounters", ownerToken, bodyFor("encounter", ids));
  ids.encounterId = encounter.id;
  const prescription = await apiJson("POST", "/prescriptions", ownerToken, bodyFor("prescription", ids));
  ids.prescriptionId = prescription.id;
  const investigation = await apiJson("POST", "/investigations/orders", ownerToken, bodyFor("investigation", ids));
  ids.investigationOrderId = investigation.id;
  const report = await apiJson("POST", "/reports", ownerToken, bodyFor("report", ids));
  ids.reportId = report.id;
  const pregnancy = await apiJson("POST", "/pregnancies", ownerToken, bodyFor("pregnancy", ids));
  ids.pregnancyId = pregnancy.id;
  const ultrasound = await apiJson("POST", "/ob-ultrasounds", ownerToken, bodyFor("obUltrasound", ids));
  ids.obUltrasoundId = ultrasound.id;
  const invoice = await apiJson("POST", "/billing/invoices", ownerToken, bodyFor("invoice", ids));
  ids.invoiceId = invoice.id;
  const draftInvoice = await apiJson("POST", "/billing/invoices", ownerToken, bodyFor("invoice", ids));
  ids.draftInvoiceId = draftInvoice.id;
  const payment = await apiJson("POST", "/billing/payments", ownerToken, bodyFor("payment", ids));
  ids.paymentId = payment.id;
  const aiDraft = await apiJson("POST", "/ai-drafts", ownerToken, bodyFor("aiDraft", ids));
  ids.aiDraftId = aiDraft.id;
  return ids;
}

export function makeRecorder(prefix) {
  const results = [];
  return {
    pass(label) {
      results.push({ status: "PASS", label });
      console.log(`${prefix} PASS ${label}`);
    },
    warn(label) {
      results.push({ status: "WARN", label });
      console.warn(`${prefix} WARN ${label}`);
    },
    fail(label, error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ status: "FAIL", label, message });
      console.error(`${prefix} FAIL ${label}: ${message}`);
    },
    summary() {
      const pass = results.filter((item) => item.status === "PASS").length;
      const warn = results.filter((item) => item.status === "WARN").length;
      const fail = results.filter((item) => item.status === "FAIL").length;
      console.log(`${prefix} SUMMARY PASS ${pass} WARN ${warn} FAIL ${fail}`);
      if (fail > 0) process.exitCode = 1;
      return { pass, warn, fail };
    }
  };
}

function formatBody(body) {
  if (body === null || body === undefined) return "<empty>";
  if (typeof body === "string") return body.slice(0, 240);
  return JSON.stringify(body).slice(0, 240);
}
