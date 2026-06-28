import { apiJson, apiStatus, assertStatus, demoUsers, login, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("AI-REGRESSION");

async function main() {
  await waitForApi();
  if (process.env.AI_FEATURES_ENABLED === "true") throw new Error("AI_FEATURES_ENABLED must not be true.");
  if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "disabled") throw new Error("AI_PROVIDER must be disabled or unset.");
  record.pass("AI environment remains disabled/mock-only");

  const owner = await login(demoUsers.owner);
  const nurse = await login(demoUsers.nurse);
  const summary = await apiJson("GET", "/dashboard/summary", owner);
  if (summary.safety?.aiEnabled !== false) throw new Error("Dashboard did not report AI disabled.");
  if (summary.safety?.clinicalDraftsRequireDoctorReview !== true) throw new Error("Dashboard did not require doctor review.");
  record.pass("dashboard safety flags remain disabled and doctor-review-only");

  const patient = ((await apiJson("GET", "/patients", owner)).patients ?? []).find((item) => item.medicalRecordNumber === "DEMO-MRN-001");
  if (!patient) throw new Error("Demo patient unavailable for AI regression.");

  const draft = await apiJson("POST", "/ai-drafts", owner, {
    draftType: "encounter_summary",
    patientId: patient.id,
    inputSourceSummary: "Demo AI regression test only. No external AI request."
  });
  if (draft.modelProvider !== "disabled_mock" || draft.modelName !== "no_external_ai") {
    throw new Error("AI draft was not marked disabled/mock-only.");
  }
  if (!/External AI access is disabled/.test(draft.generatedText ?? "")) {
    throw new Error("AI draft text did not state external AI is disabled.");
  }
  record.pass("created AI draft is disabled/mock-only");

  assertStatus(await apiStatus("PATCH", `/ai-drafts/${draft.id}/review`, nurse, { status: "approved" }), 403, "nurse AI review");
  record.pass("lower-role AI review is denied");

  assertStatus(await apiStatus("POST", `/ai-drafts/${draft.id}/sign`, owner), 404, "AI sign route");
  assertStatus(await apiStatus("POST", `/ai-drafts/${draft.id}/insert-approved`, owner), 404, "AI insert route");
  assertStatus(await apiStatus("POST", `/ai-drafts/${draft.id}/diagnose`, owner), 404, "AI diagnose route");
  assertStatus(await apiStatus("POST", `/ai-drafts/${draft.id}/prescribe`, owner), 404, "AI prescribe route");
  record.pass("AI cannot sign, insert, diagnose, or prescribe through API routes");

  const reviewed = await apiJson("PATCH", `/ai-drafts/${draft.id}/review`, owner, {
    status: "rejected",
    reviewNote: "Demo regression safety rejection."
  });
  if (reviewed.status !== "rejected") throw new Error("AI review did not update only the draft artifact.");
  const audit = (await apiJson("GET", "/audit?limit=100", owner)).auditLogs ?? [];
  const reviewAudit = audit.find((entry) => entry.resourceId === draft.id && entry.action === "ai_draft.rejected");
  if (!reviewAudit || reviewAudit.metadataJson?.insertedIntoClinicalRecord !== false) {
    throw new Error("AI review audit did not prove no clinical insertion.");
  }
  record.pass("AI review audit confirms no clinical insertion");
}

await main().catch((error) => record.fail("AI safety regression setup", error));
record.summary();
