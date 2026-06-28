import { apiJson, createRouteFixtures, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("AUDIT-ASSERT");

async function main() {
  await waitForApi();
  const owner = await login(demoUsers.owner);
  const ids = await createRouteFixtures(owner);

  await apiJson("PATCH", `/patients/${ids.patientId}`, owner, { notes: "Demo audit assertion update only." });
  await apiJson("PATCH", `/appointments/${ids.appointmentId}/status`, owner, { status: "booked" });
  await apiJson("PATCH", `/queue/${ids.queueTicketId}/call`, owner);
  await apiJson("PATCH", `/reports/${ids.reportId}/review`, owner);
  await apiJson("PATCH", `/ai-drafts/${ids.aiDraftId}/review`, owner, {
    status: "rejected",
    reviewNote: "Demo audit assertion AI rejection only."
  });

  const audit = (await apiJson("GET", "/audit?limit=200", owner)).auditLogs ?? [];
  const expected = [
    ["patient.created", ids.patientId],
    ["patient.updated", ids.patientId],
    ["appointment.created", ids.appointmentId],
    ["appointment.status_updated", ids.appointmentId],
    ["queue.checked_in", ids.queueTicketId],
    ["queue.called", ids.queueTicketId],
    ["report.created", ids.reportId],
    ["report.reviewed", ids.reportId],
    ["ai_draft.placeholder_created", ids.aiDraftId],
    ["ai_draft.rejected", ids.aiDraftId]
  ];

  for (const [action, resourceId] of expected) {
    const found = audit.some((entry) => entry.action === action && entry.resourceId === resourceId);
    if (!found) throw new Error(`Missing audit event ${action} for ${resourceId}`);
    record.pass(`audit event ${action}`);
  }

  const serialized = JSON.stringify(audit);
  if (/Bearer\s+[A-Za-z0-9._-]+/.test(serialized)) throw new Error("Audit output appears to contain a bearer token.");
  record.pass("audit output does not expose bearer tokens");
}

await main().catch((error) => record.fail("audit assertion setup", error));
record.summary();
