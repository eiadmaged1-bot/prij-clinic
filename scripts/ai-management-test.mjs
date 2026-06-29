const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
let ownerToken = "";
let doctorToken = "";
let receptionToken = "";
const results = [];

const pass = (label) => { results.push(["PASS", label]); console.log(`AI-MANAGEMENT PASS ${label}`); };
const fail = (label, error) => { results.push(["FAIL", label]); console.error(`AI-MANAGEMENT FAIL ${label}: ${error?.message || error}`); };

async function request(path, options = {}, token = ownerToken) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

async function login(identifier) {
  const { response, body } = await request("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password: identifier === "eyad" ? "eyad" : PASSWORD }) }, "");
  if (!response.ok) throw new Error(`login failed for ${identifier}`);
  return body.token;
}

async function main() {
  ownerToken = await login("eyad");
  doctorToken = await login("demo.doctor@prij.local");
  receptionToken = await login("demo.reception@prij.local");
  pass("demo users login");

  const patient = await request("/patients", { method: "POST", body: JSON.stringify({ medicalRecordNumber: `DEMO-AIMS-${Date.now()}`, firstName: "Demo", lastName: "Snapshot", notes: "Fake local test patient only." }) });
  if (!patient.response.ok) throw new Error("patient create failed");
  pass("fake patient created");

  const verified = await request("/ai-management/snapshots", { method: "POST", body: JSON.stringify({ patientId: patient.body.id, diagnosisText: "endometriosis", clinicalGoal: "pain control", protocolCode: "ENDOMETRIOSIS_MANAGEMENT_V1" }) });
  if (!verified.response.ok || verified.body.outputJson.guidelineBasedOptions.length === 0) throw new Error("verified snapshot did not return options");
  pass("verified protocol returns management options");

  const catalog = await request("/ai-management/snapshots", { method: "POST", body: JSON.stringify({ patientId: patient.body.id, diagnosisText: "fibroid", protocolCode: "UTERINE_FIBROIDS_CATALOG_V1" }) });
  if (!catalog.response.ok || catalog.body.outputJson.guidelineBasedOptions.length !== 0 || !catalog.body.outputJson.limitations.join(" ").includes("cannot provide management options")) throw new Error("catalog-only returned management options");
  pass("catalog-only protocol returns no management options");

  const unknown = await request("/ai-management/snapshots", { method: "POST", body: JSON.stringify({ patientId: patient.body.id, diagnosisText: "not a protocol xyz" }) });
  if (!unknown.response.ok || unknown.body.outputJson.guidelineBasedOptions.length !== 0) throw new Error("unknown diagnosis returned advice");
  pass("unknown diagnosis returns no hallucinated advice");

  const catalogList = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ status: "catalog_only" }) });
  const [draftProtocol, retiredProtocol] = catalogList.body.protocols;
  if (!draftProtocol || !retiredProtocol) throw new Error("catalog protocols unavailable for draft/retired snapshot tests");
  await request(`/protocol-atlas/${draftProtocol.id}/request-verification`, { method: "POST", body: JSON.stringify({ reason: "Demo AI draft guard test only." }) });
  const draftSnapshot = await request("/ai-management/snapshots", { method: "POST", body: JSON.stringify({ patientId: patient.body.id, diagnosisText: draftProtocol.title, protocolCode: draftProtocol.code }) });
  if (!draftSnapshot.response.ok || draftSnapshot.body.outputJson.guidelineBasedOptions.length !== 0) throw new Error("draft protocol returned management options");
  pass("draft protocol returns no management options");

  await request(`/protocol-atlas/${retiredProtocol.id}/retire`, { method: "POST", body: JSON.stringify({ reason: "Demo AI retired guard test only." }) });
  const retiredSnapshot = await request("/ai-management/snapshots", { method: "POST", body: JSON.stringify({ patientId: patient.body.id, diagnosisText: retiredProtocol.title, protocolCode: retiredProtocol.code }) });
  if (!retiredSnapshot.response.ok || retiredSnapshot.body.outputJson.guidelineBasedOptions.length !== 0) throw new Error("retired protocol returned management options");
  pass("retired protocol returns no management options");

  const outputText = JSON.stringify(verified.body.outputJson).toLowerCase();
  for (const unsafe of [" mg", "must prescribe", "definitive diagnosis", "guaranteed"]) {
    if (outputText.includes(unsafe)) throw new Error(`verified output included unsafe phrase ${unsafe}`);
  }
  if (!verified.body.outputJson.doctorDecisionRequired) throw new Error("doctor approval flag missing");
  pass("verified output remains dose-free and doctor-review-only");

  const denied = await request("/ai-management/snapshots", { method: "POST", body: JSON.stringify({ patientId: patient.body.id, diagnosisText: "endometriosis" }) }, receptionToken);
  if (denied.response.status !== 403) throw new Error(`receptionist got ${denied.response.status}`);
  pass("receptionist cannot create snapshot");

  const rejectedNoReason = await request(`/ai-management/snapshots/${verified.body.id}/review`, { method: "POST", body: JSON.stringify({ decision: "rejected" }) }, doctorToken);
  if (rejectedNoReason.response.status !== 400) throw new Error("reject without reason should fail");
  pass("reject requires reason");

  const approved = await request(`/ai-management/snapshots/${verified.body.id}/review`, { method: "POST", body: JSON.stringify({ decision: "approved" }) }, doctorToken);
  if (!approved.response.ok) throw new Error("doctor approval failed");
  pass("doctor can approve snapshot");

  const memory = await request(`/ai-management/snapshots/${verified.body.id}/save-memory`, { method: "POST", body: JSON.stringify({ memoryType: "protocol_used", title: "Endometriosis protocol", valueJson: { protocolCode: "ENDOMETRIOSIS_MANAGEMENT_V1" } }) }, doctorToken);
  if (!memory.response.ok) throw new Error("memory save failed");
  pass("save memory only after approval works");

  const audit = await request("/audit?limit=100");
  for (const action of ["ai_management_snapshot_created", "ai_management_snapshot_reviewed", "ai_management_snapshot_memory_saved"]) {
    const entry = audit.body.auditLogs.find((log) => log.action === action && log.metadataJson?.snapshotId);
    if (!entry || entry.resourceId !== null) throw new Error(`audit missing CUID metadata for ${action}`);
  }
  pass("AI management actions are audited with CUID metadata");
}

main().catch((error) => fail("ai management suite", error)).finally(() => {
  const failed = results.filter(([status]) => status === "FAIL").length;
  console.log(`AI-MANAGEMENT SUMMARY PASS ${results.length - failed} FAIL ${failed}`);
  process.exit(failed ? 1 : 0);
});
