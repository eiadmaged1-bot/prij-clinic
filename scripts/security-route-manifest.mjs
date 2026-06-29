export const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
export const DEMO_PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";

export const demoUsers = {
  owner: "demo.owner@prij.local",
  doctor: "demo.doctor@prij.local",
  reception: "demo.reception@prij.local",
  accountant: "demo.accountant@prij.local",
  nurse: "demo.nurse@prij.local"
};

const routeDefinitions = [
  { method: "GET", path: "/auth/me", category: "auth", requiredPermission: "authenticated", allowedAs: "owner", denyAs: null, notes: "Broad authenticated route." },
  { method: "POST", path: "/auth/logout", category: "auth", requiredPermission: "authenticated", allowedAs: "owner", denyAs: null, notes: "Broad authenticated route; logout is audited." },
  { method: "GET", path: "/admin/users", category: "admin", requiredPermission: "user.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "GET", path: "/admin/accounts", category: "admin", requiredPermission: "user.read", allowedAs: "owner", denyAs: "reception" },
  { method: "GET", path: "/admin/roles", category: "admin", requiredPermission: "role.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "GET", path: "/admin/permissions", category: "admin", requiredPermission: "permission.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "GET", path: "/admin/control-center", category: "admin", requiredPermission: "clinic_settings.manage", allowedAs: "owner", denyAs: "reception" },
  { method: "GET", path: "/admin/settings/appearance", category: "admin", requiredPermission: "clinic_settings.manage", allowedAs: "owner", denyAs: "reception" },
  { method: "PATCH", path: "/admin/settings/appearance", category: "admin", requiredPermission: "clinic_settings.manage", allowedAs: "owner", denyAs: "reception", fixtureBody: "appearance" },
  { method: "GET", path: "/audit", category: "audit", requiredPermission: "audit.read", allowedAs: "owner", denyAs: "reception" },
  { method: "POST", path: "/patients", category: "patients", requiredPermission: "patient.create", allowedAs: "owner", denyAs: "nurse", fixtureBody: "patient" },
  { method: "GET", path: "/patients", category: "patients", requiredPermission: "patient.read", allowedAs: "owner", denyAs: null, notes: "Many staff roles can read scoped patient lists." },
  { method: "GET", path: "/patients/:patientId", category: "patients", requiredPermission: "patient.read", allowedAs: "owner", denyAs: null, notes: "Many staff roles can read scoped patient detail." },
  { method: "PATCH", path: "/patients/:patientId", category: "patients", requiredPermission: "patient.update", allowedAs: "owner", denyAs: "nurse", fixtureBody: "patientPatch" },
  { method: "POST", path: "/consents", category: "consents", requiredPermission: "patient.consent_manage", allowedAs: "owner", denyAs: "nurse", fixtureBody: "consent", notes: "V0.1 consent foundation only; no production legal text or signatures." },
  { method: "GET", path: "/consents?patientId=:patientId", category: "consents", requiredPermission: "patient.consent_read", allowedAs: "owner", denyAs: "accountant", notes: "Consent enforcement remains partial in V0.1." },
  { method: "POST", path: "/appointments", category: "appointments", requiredPermission: "appointment.manage", allowedAs: "owner", denyAs: "nurse", fixtureBody: "appointment", notes: "Referenced-record create scope remains a known limitation." },
  { method: "GET", path: "/appointments", category: "appointments", requiredPermission: "appointment.read", allowedAs: "owner", denyAs: null, notes: "Many staff roles can read scoped appointment lists." },
  { method: "GET", path: "/appointments/calendar?date=:today", category: "appointments", requiredPermission: "appointment.read", allowedAs: "owner", denyAs: null, notes: "Many staff roles can read scoped calendar data." },
  { method: "GET", path: "/appointments/:appointmentId", category: "appointments", requiredPermission: "appointment.read", allowedAs: "owner", denyAs: null, notes: "Many staff roles can read scoped appointment detail." },
  { method: "PATCH", path: "/appointments/:appointmentId/status", category: "appointments", requiredPermission: "appointment.manage", allowedAs: "owner", denyAs: "nurse", fixtureBody: "appointmentStatus" },
  { method: "POST", path: "/queue/check-in", category: "queue", requiredPermission: "queue.manage", allowedAs: "owner", denyAs: "doctor", fixtureBody: "queue", notes: "Referenced-record create scope remains a known limitation." },
  { method: "GET", path: "/queue/today", category: "queue", requiredPermission: "queue.read", allowedAs: "owner", denyAs: null, notes: "Many staff roles can read scoped queue data." },
  { method: "PATCH", path: "/queue/:queueTicketId/call", category: "queue", requiredPermission: "queue.status_update", allowedAs: "owner", denyAs: "doctor" },
  { method: "PATCH", path: "/queue/:queueTicketId/complete", category: "queue", requiredPermission: "queue.status_update", allowedAs: "owner", denyAs: "doctor" },
  { method: "PATCH", path: "/queue/:queueTicketId/cancel", category: "queue", requiredPermission: "queue.status_update", allowedAs: "owner", denyAs: "doctor" },
  { method: "POST", path: "/encounters", category: "encounters", requiredPermission: "encounter.create", allowedAs: "owner", denyAs: "reception", fixtureBody: "encounter", notes: "Referenced-record create scope remains a known limitation." },
  { method: "GET", path: "/encounters", category: "encounters", requiredPermission: "encounter.read", allowedAs: "owner", denyAs: "reception" },
  { method: "GET", path: "/encounters/:encounterId", category: "encounters", requiredPermission: "encounter.read", allowedAs: "owner", denyAs: "reception" },
  { method: "PATCH", path: "/encounters/:encounterId", category: "encounters", requiredPermission: "encounter.update_own", allowedAs: "owner", denyAs: "reception", fixtureBody: "encounterPatch" },
  { method: "PATCH", path: "/encounters/:encounterId/sign", category: "encounters", requiredPermission: "encounter.sign", allowedAs: "owner", denyAs: "reception", notes: "Uses safe demo encounter only." },
  { method: "POST", path: "/prescriptions", category: "prescriptions", requiredPermission: "prescription.create", allowedAs: "owner", denyAs: "reception", fixtureBody: "prescription", notes: "Uses demo medication placeholder only." },
  { method: "GET", path: "/prescriptions", category: "prescriptions", requiredPermission: "prescription.read", allowedAs: "owner", denyAs: "reception" },
  { method: "GET", path: "/prescriptions/:prescriptionId", category: "prescriptions", requiredPermission: "prescription.read", allowedAs: "owner", denyAs: "reception" },
  { method: "PATCH", path: "/prescriptions/:prescriptionId", category: "prescriptions", requiredPermission: "prescription.update", allowedAs: "owner", denyAs: "reception", fixtureBody: "prescriptionPatch" },
  { method: "PATCH", path: "/prescriptions/:prescriptionId/sign", category: "prescriptions", requiredPermission: "prescription.approve", allowedAs: "owner", denyAs: "reception", notes: "Uses safe demo prescription only; no autonomous prescribing." },
  { method: "POST", path: "/investigations/orders", category: "investigations", requiredPermission: "investigation.create", allowedAs: "owner", denyAs: "accountant", fixtureBody: "investigation" },
  { method: "GET", path: "/investigations/orders", category: "investigations", requiredPermission: "investigation.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "GET", path: "/investigations/orders/:investigationOrderId", category: "investigations", requiredPermission: "investigation.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "PATCH", path: "/investigations/orders/:investigationOrderId/status", category: "investigations", requiredPermission: "investigation.update", allowedAs: "owner", denyAs: "accountant", fixtureBody: "investigationStatus" },
  { method: "POST", path: "/reports", category: "reports", requiredPermission: "report.upload", allowedAs: "owner", denyAs: "accountant", fixtureBody: "report", notes: "Metadata only; no file upload." },
  { method: "GET", path: "/reports", category: "reports", requiredPermission: "report.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "GET", path: "/reports/:reportId", category: "reports", requiredPermission: "report.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "PATCH", path: "/reports/:reportId", category: "reports", requiredPermission: "report.update", allowedAs: "owner", denyAs: "accountant", fixtureBody: "reportPatch" },
  { method: "PATCH", path: "/reports/:reportId/review", category: "reports", requiredPermission: "report.review", allowedAs: "owner", denyAs: "accountant" },
  { method: "POST", path: "/pregnancies", category: "pregnancies", requiredPermission: "pregnancy.manage", allowedAs: "owner", denyAs: "accountant", fixtureBody: "pregnancy" },
  { method: "GET", path: "/pregnancies", category: "pregnancies", requiredPermission: "pregnancy.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "GET", path: "/pregnancies/:pregnancyId", category: "pregnancies", requiredPermission: "pregnancy.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "PATCH", path: "/pregnancies/:pregnancyId", category: "pregnancies", requiredPermission: "pregnancy.manage", allowedAs: "owner", denyAs: "accountant", fixtureBody: "pregnancyPatch" },
  { method: "POST", path: "/ob-ultrasounds", category: "ob-ultrasound", requiredPermission: "ob_ultrasound.manage", allowedAs: "owner", denyAs: "accountant", fixtureBody: "obUltrasound", notes: "No diagnostic automation." },
  { method: "GET", path: "/ob-ultrasounds", category: "ob-ultrasound", requiredPermission: "ob_ultrasound.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "GET", path: "/ob-ultrasounds/:obUltrasoundId", category: "ob-ultrasound", requiredPermission: "ob_ultrasound.read", allowedAs: "owner", denyAs: "accountant" },
  { method: "PATCH", path: "/ob-ultrasounds/:obUltrasoundId", category: "ob-ultrasound", requiredPermission: "ob_ultrasound.manage", allowedAs: "owner", denyAs: "accountant", fixtureBody: "obUltrasoundPatch" },
  { method: "PATCH", path: "/ob-ultrasounds/:obUltrasoundId/review", category: "ob-ultrasound", requiredPermission: "ob_ultrasound.manage", allowedAs: "owner", denyAs: "accountant", notes: "No FGR or other automatic diagnosis." },
  { method: "POST", path: "/billing/invoices", category: "billing", requiredPermission: "billing.manage", allowedAs: "owner", denyAs: "doctor", fixtureBody: "invoice", notes: "No payment gateway." },
  { method: "GET", path: "/billing/invoices", category: "billing", requiredPermission: "billing.read", allowedAs: "owner", denyAs: "doctor" },
  { method: "GET", path: "/billing/invoices/:invoiceId", category: "billing", requiredPermission: "billing.read", allowedAs: "owner", denyAs: "doctor" },
  { method: "PATCH", path: "/billing/invoices/:invoiceId", category: "billing", requiredPermission: "billing.manage", allowedAs: "owner", denyAs: "doctor", fixtureBody: "invoicePatch" },
  { method: "POST", path: "/billing/invoices/:draftInvoiceId/issue", category: "billing", requiredPermission: "billing.manage", allowedAs: "owner", denyAs: "doctor" },
  { method: "POST", path: "/billing/payments", category: "billing", requiredPermission: "payment.manage", allowedAs: "owner", denyAs: "doctor", fixtureBody: "payment", notes: "Cash demo payment only; no card data." },
  { method: "GET", path: "/billing/payments", category: "billing", requiredPermission: "billing.read", allowedAs: "owner", denyAs: "doctor" },
  { method: "POST", path: "/billing/payments/:paymentId/reverse", category: "billing", requiredPermission: "billing.void", allowedAs: "owner", denyAs: "doctor", fixtureBody: "reversePayment" },
  { method: "GET", path: "/dashboard/summary", category: "dashboard", requiredPermission: "dashboard.read", allowedAs: "owner", denyAs: "doctor" },
  { method: "POST", path: "/ai-drafts", category: "ai-drafts", requiredPermission: "ai_draft.request", allowedAs: "owner", denyAs: "nurse", fixtureBody: "aiDraft", notes: "Disabled/mock-only placeholder." },
  { method: "GET", path: "/ai-drafts", category: "ai-drafts", requiredPermission: "ai_draft.read", allowedAs: "owner", denyAs: "nurse" },
  { method: "GET", path: "/ai-drafts/:aiDraftId", category: "ai-drafts", requiredPermission: "ai_draft.read", allowedAs: "owner", denyAs: "nurse" },
  { method: "PATCH", path: "/ai-drafts/:aiDraftId/review", category: "ai-drafts", requiredPermission: "ai_draft.review", allowedAs: "owner", denyAs: "nurse", fixtureBody: "aiReview", notes: "Review updates only AI draft artifact." }
];

export const routeManifest = routeDefinitions.map((route) => ({
  name: `${route.method} ${route.path}`,
  requiresAuth: true,
  allowedLoginRole: route.allowedAs,
  allowedDemoUser: demoUsers[route.allowedAs],
  deniedLoginRole: route.denyAs,
  deniedDemoUser: route.denyAs ? demoUsers[route.denyAs] : null,
  expectedStatusWithOwner: [200, 201],
  expectedStatusWithoutToken: [401],
  expectedStatusWithDeniedUser: route.denyAs ? [403, 404] : null,
  scopeExpectation: scopeExpectationFor(route.category),
  auditExpectation: auditExpectationFor(route),
  currentLimitation: route.notes?.includes("known limitation") || route.notes?.includes("Broad") ? route.notes : null,
  notes: route.notes ?? "",
  ...route
}));

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
    consent: {
      patientId: ids.patientId,
      consentType: "treatment",
      status: "granted",
      notes: "Demo consent foundation test only. Not production legal text."
    },
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
    appearance: { defaultTheme: "clinic-premium", allowUserThemeOverride: true },
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

function scopeExpectationFor(category) {
  if (["admin", "audit", "auth"].includes(category)) return "Authenticated/permission-scoped route; no patient branch scope.";
  if (["appointments", "encounters", "prescriptions", "investigations"].includes(category)) {
    return "Branch-scoped where modeled; doctor-owned reads are doctor-scoped where doctorId exists.";
  }
  if (["patients", "consents", "queue", "reports", "pregnancies", "ob-ultrasound", "billing", "ai-drafts", "dashboard"].includes(category)) {
    return "Branch-scoped for non-owner/non-admin users where branchId or patient branch is available.";
  }
  return "Scope expectation documented in controller/service tests.";
}

function auditExpectationFor(route) {
  if (route.method === "GET" && ["auth", "appointments", "queue"].includes(route.category)) {
    return "Read audit is not expected for this broad operational read in V0.1.";
  }
  if (route.method === "GET") return "Sensitive/admin read audit expected where implemented.";
  return "Mutation/status/review action audit expected where implemented.";
}

function formatBody(body) {
  if (body === null || body === undefined) return "<empty>";
  if (typeof body === "string") return body.slice(0, 240);
  return JSON.stringify(body).slice(0, 240);
}
