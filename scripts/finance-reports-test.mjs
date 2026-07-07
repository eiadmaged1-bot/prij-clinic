import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("FINANCE-REPORTS");
const runId = Date.now();

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const doctor = await login(demoUsers.doctor);
  const accountant = await login(demoUsers.accountant);

  const service = await apiJson("POST", "/admin/services", owner, {
    code: `FIN-${runId}`,
    name: "QA finance consultation",
    category: "Consultation",
    price: 150,
    currency: "EGP",
    costAmount: 30,
    doctorShareAmount: 50
  });
  if (!service.id || String(service.costAmount) !== "30" || String(service.doctorShareAmount) !== "50") {
    throw new Error("service catalog placeholders did not persist.");
  }
  record.pass("service catalog create supports finance placeholders");

  const editedService = await apiJson("PATCH", `/admin/services/${service.id}`, owner, { price: 175, active: false });
  if (String(editedService.price) !== "175" || editedService.active !== false) throw new Error("service edit/deactivate failed.");
  assertStatus(await apiStatus("PATCH", `/admin/services/${service.id}`, accountant, { price: 200 }), 403, "non-admin service price edit");
  record.pass("service catalog edit deactivate and non-admin price denial");

  const activeService = await apiJson("POST", "/admin/services", owner, {
    code: `FIN-QA-ACT-${runId}`,
    name: "QA active finance service",
    category: "Consultation",
    price: 200,
    currency: "EGP",
    doctorShareAmount: 60
  });
  const activeServices = (await apiJson("GET", "/billing/services", owner)).services ?? [];
  if (!activeServices.some((item) => item.id === activeService.id)) throw new Error("active service was not visible to finance users.");
  if (activeServices.some((item) => item.id === service.id)) throw new Error("inactive service was visible in finance picker.");
  record.pass("normal finance view lists active services only");

  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `FIN-${runId}`,
    firstName: "QA",
    lastName: "Finance",
    notes: "Local finance regression patient only."
  });

  const invoice = await apiJson("POST", "/billing/invoices", owner, {
    patientId: patient.id,
    invoiceNumber: `FIN-INV-${runId}`,
    discountAmount: 20,
    discountReason: "Local QA courtesy discount.",
    items: [{ serviceItemId: activeService.id, quantity: 1 }]
  });
  if (String(invoice.subtotalAmount) !== "200" || String(invoice.discountAmount) !== "20" || String(invoice.totalAmount) !== "180") {
    throw new Error("invoice totals from service catalog were incorrect.");
  }
  record.pass("invoice creation uses service catalog and audited discount");

  assertStatus(await apiStatus("POST", "/billing/invoices", doctor, {
    patientId: patient.id,
    items: [{ serviceItemId: activeService.id, quantity: 1 }],
    discountAmount: 5,
    discountReason: "Unauthorized discount attempt."
  }), 403, "doctor discount invoice denial");
  record.pass("discount and invoice creation remain permission controlled");

  const payment = await apiJson("POST", "/billing/payments", owner, {
    invoiceId: invoice.id,
    method: "cash",
    amount: 50,
    referenceNote: "QA partial cash payment only."
  });
  const partialInvoice = await apiJson("GET", `/billing/invoices/${invoice.id}`, owner);
  if (partialInvoice.status !== "partially_paid" || String(partialInvoice.balanceAmount) !== "130") {
    throw new Error("partial payment status or balance was incorrect.");
  }
  record.pass("payment recording creates partial payment status");

  assertStatus(await apiStatus("POST", `/billing/payments/${payment.id}/refund`, owner, {}), 400, "refund missing reason");
  const refunded = await apiJson("POST", `/billing/payments/${payment.id}/refund`, owner, { reason: "Local QA refund correction." });
  if (refunded.status !== "reversed") throw new Error("refund did not mark payment as non-active.");
  record.pass("refund requires reason and updates payment");

  assertStatus(await apiStatus("POST", `/billing/invoices/${invoice.id}/void`, owner, {}), 400, "void missing reason");
  const voided = await apiJson("POST", `/billing/invoices/${invoice.id}/void`, owner, { reason: "Local QA invoice void correction." });
  if (voided.status !== "voided") throw new Error("invoice void did not persist.");
  record.pass("invoice void requires reason");

  const closing = await apiJson("GET", "/billing/daily-closing", owner);
  if (!closing.summary || closing.summary.refunds === undefined || closing.summary.voids === undefined) {
    throw new Error("daily closing summary did not include refunds and voids.");
  }
  record.pass("daily closing totals render through API");

  const statement = await apiJson("GET", `/billing/patients/${patient.id}/statement`, owner);
  if (!statement.totals || !Array.isArray(statement.invoices) || !Array.isArray(statement.payments)) {
    throw new Error("patient statement did not return invoices payments and totals.");
  }
  record.pass("patient financial statement renders through API");

  const reports = await apiJson("GET", "/billing/reports/finance", owner);
  if (!reports.revenueSummary || !reports.paymentsByMethod || !reports.refundsAndVoids || !reports.serviceRevenue) {
    throw new Error("finance reports did not return expected sections.");
  }
  record.pass("owner finance reports render through API");

  const audit = (await apiJson("GET", "/audit?limit=200", owner)).auditLogs ?? [];
  for (const [action, resourceId] of [
    ["service_item.updated", service.id],
    ["invoice.discount_applied", invoice.id],
    ["payment.refunded", payment.id],
    ["invoice.voided", invoice.id]
  ]) {
    if (!audit.some((entry) => entry.action === action && entry.resourceId === resourceId)) {
      throw new Error(`audit entry ${action} was not found.`);
    }
  }
  record.pass("financial actions are audited");
}

await main().catch((error) => record.fail("finance reports setup", error));
record.summary();
