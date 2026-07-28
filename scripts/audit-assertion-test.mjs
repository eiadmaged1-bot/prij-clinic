import { apiJson, bodyFor, createRouteFixtures, demoUsers, findTestAuditLogs, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("AUDIT-ASSERT");

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const ids = await createRouteFixtures(owner);

  await apiJson("PATCH", `/patients/${ids.patientId}`, owner, { notes: "Demo audit assertion update only." });
  await apiJson("PATCH", `/appointments/${ids.appointmentId}/status`, owner, { status: "booked" });
  await apiJson("PATCH", `/queue/${ids.queueTicketId}/call`, owner);
  const encounterForSign = await apiJson("PATCH", `/encounters/${ids.encounterId}`, owner, {
    planText: "Demo audit assertion plan only.",
    examinationJson: { reproductiveSnapshot: { context: "general", changeStatus: "no_change" } }
  });
  await apiJson("PATCH", `/encounters/${ids.encounterId}/sign`, owner, { expectedRevision: encounterForSign.updatedAt });
  await apiJson("PATCH", `/prescriptions/${ids.prescriptionId}`, owner, {
    notes: "Demo audit assertion prescription update only.",
    items: [{ medicationName: "Demo medication placeholder" }]
  });
  await apiJson("PATCH", `/prescriptions/${ids.prescriptionId}/sign`, owner);
  await apiJson("PATCH", `/investigations/orders/${ids.investigationOrderId}/status`, owner, { status: "scheduled" });
  await apiJson("PATCH", `/reports/${ids.reportId}`, owner, { title: "Demo audit assertion report metadata" });
  await apiJson("PATCH", `/reports/${ids.reportId}/review`, owner);
  await apiJson("PATCH", `/pregnancies/${ids.pregnancyId}`, owner, { notes: "Demo audit assertion pregnancy update only." });
  await apiJson("PATCH", `/ob-ultrasounds/${ids.obUltrasoundId}`, owner, {
    scanType: "Demo audit scan",
    impressionText: "Demo audit assertion ultrasound note only. No diagnosis."
  });
  // This audit suite has no secured image upload fixture. Exercise the valid
  // complete-for-review transition; final clinical review remains protected by
  // the separate required-image gate.
  await apiJson("PATCH", `/ob-ultrasounds/${ids.obUltrasoundId}/complete-for-review`, owner);
  await apiJson("PATCH", `/billing/invoices/${ids.invoiceId}`, owner, { notes: "Demo audit assertion invoice update only." });
  await apiJson("POST", `/billing/invoices/${ids.draftInvoiceId}/issue`, owner);
  await apiJson("POST", `/billing/payments/${ids.paymentId}/reverse`, owner, {
    reason: "Demo audit assertion reversal only."
  });
  const consent = await apiJson("POST", "/consents", owner, bodyFor("consent", ids));
  await apiJson("GET", `/consents?patientId=${ids.patientId}`, owner);
  await apiJson("PATCH", `/ai-drafts/${ids.aiDraftId}/review`, owner, {
    status: "rejected",
    reviewNote: "Demo audit assertion AI rejection only."
  });

  const audit = await findTestAuditLogs({});
  const expected = [
    ["patient.created", ids.patientId],
    ["patient.updated", ids.patientId],
    ["appointment.created", ids.appointmentId],
    ["appointment.status_updated", ids.appointmentId],
    ["queue.checked_in", ids.queueTicketId],
    ["queue.called", ids.queueTicketId],
    ["encounter.created", ids.encounterId],
    ["encounter.updated", ids.encounterId],
    ["encounter.signed", ids.encounterId],
    ["prescription.created", ids.prescriptionId],
    ["prescription.updated", ids.prescriptionId],
    ["prescription.signed", ids.prescriptionId],
    ["investigation_order.created", ids.investigationOrderId],
    ["investigation_order.status_updated", ids.investigationOrderId],
    ["report.created", ids.reportId],
    ["report.updated", ids.reportId],
    ["report.reviewed", ids.reportId],
    ["pregnancy.created", ids.pregnancyId],
    ["pregnancy.updated", ids.pregnancyId],
    ["ob_ultrasound.created", ids.obUltrasoundId],
    ["ob_ultrasound.updated", ids.obUltrasoundId],
    ["ob_ultrasound.completed_for_review", ids.obUltrasoundId],
    ["invoice.created", ids.invoiceId],
    ["invoice.updated", ids.invoiceId],
    ["invoice.issued", ids.draftInvoiceId],
    ["payment.recorded", ids.paymentId],
    ["payment.reversed", ids.paymentId],
    ["consent.created", consent.id],
    ["consent.list_read", { metadataPatientId: ids.patientId }],
    ["ai_draft.placeholder_created", ids.aiDraftId],
    ["ai_draft.rejected", ids.aiDraftId]
  ];

  for (const [action, expectation] of expected) {
    const found = audit.some((entry) => matchesAuditExpectation(entry, action, expectation));
    if (!found) throw new Error(`Missing audit event ${action} for ${formatExpectation(expectation)}`);
    record.pass(`audit event ${action}`);
  }

  const serialized = JSON.stringify(audit);
  if (/Bearer\s+[A-Za-z0-9._-]+/.test(serialized)) throw new Error("Audit output appears to contain a bearer token.");
  record.pass("audit output does not expose bearer tokens");
  if (/LocalDev123!|scrypt:|password|token/i.test(serialized)) throw new Error("Audit output appears to contain credential material.");
  record.pass("audit output does not expose credential material");
}

function matchesAuditExpectation(entry, action, expectation) {
  if (entry.action !== action) return false;
  if (typeof expectation === "string") return entry.resourceId === expectation;
  if (expectation?.metadataPatientId) return entry.metadataJson?.patientId === expectation.metadataPatientId;
  return false;
}

function formatExpectation(expectation) {
  if (typeof expectation === "string") return expectation;
  return JSON.stringify(expectation);
}

await main().catch((error) => record.fail("audit assertion setup", error));
record.summary();
