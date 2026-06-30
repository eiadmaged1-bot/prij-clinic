const API_URL = process.env.API_URL || "http://localhost:3001";
const password = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";

let pass = 0;
let fail = 0;

function ok(condition, message) {
  if (condition) {
    pass += 1;
    console.log(`WORKFLOW-SPINE PASS ${message}`);
  } else {
    fail += 1;
    console.error(`WORKFLOW-SPINE FAIL ${message}`);
  }
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function login(email) {
  const { response, body } = await request("/auth/login", null, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) throw new Error(`Login failed for ${email}`);
  return body.token;
}

async function main() {
  await waitForHealth();
  const owner = await login("demo.owner@prij.local");
  const doctor = await login("demo.doctor@prij.local");
  const reception = await login("demo.reception@prij.local");
  const accountant = await login("demo.accountant@prij.local");

  const patientPayload = {
    medicalRecordNumber: `WF-${Date.now()}`,
    firstName: "Workflow",
    lastName: "Demo",
    patientType: "GYN",
    notes: "Fake demo patient for workflow spine regression."
  };
  const patientCreate = await request("/patients", owner, { method: "POST", body: JSON.stringify(patientPayload) });
  ok(patientCreate.response.status === 201, "owner can create fake workflow patient");
  const patientId = patientCreate.body.id;

  const resultCreate = await request("/investigation-results", owner, {
    method: "POST",
    body: JSON.stringify({
      patientId,
      category: "laboratory",
      title: "Demo critical result metadata",
      summaryText: "Demo metadata only. No automatic interpretation.",
      abnormalFlag: true,
      criticalFlag: true,
      structuredValuesJson: { demo: true }
    })
  });
  ok(resultCreate.response.status === 201, "owner can create result metadata");
  const resultId = resultCreate.body.id;

  const accountantResult = await request(`/investigation-results/${resultId}`, accountant);
  ok(accountantResult.response.status === 403, "accountant cannot access clinical result");

  const receptionReview = await request(`/investigation-results/${resultId}/review`, reception, { method: "POST", body: JSON.stringify({ acknowledgeCritical: true }) });
  ok(receptionReview.response.status === 403, "receptionist cannot review clinical result");

  const missingAck = await request(`/investigation-results/${resultId}/review`, doctor, { method: "POST", body: JSON.stringify({ doctorComment: "Reviewed demo result." }) });
  ok(missingAck.response.status === 400, "critical result requires acknowledgement");

  const reviewed = await request(`/investigation-results/${resultId}/review`, doctor, { method: "POST", body: JSON.stringify({ acknowledgeCritical: true, doctorComment: "Reviewed demo result.", followUpNeeded: true }) });
  ok(reviewed.response.status === 201 && reviewed.body.reviewStatus === "needs_follow_up", "doctor can review result with critical acknowledgement");

  const documentCreate = await request(`/patients/${patientId}/documents`, owner, {
    method: "POST",
    body: JSON.stringify({ title: "Demo document metadata", documentType: "lab_result", category: "Laboratory", summaryText: "Metadata-only demo item." })
  });
  ok(documentCreate.response.status === 201 && documentCreate.body.storageMode === "metadata_only", "document metadata can be created");
  const documentId = documentCreate.body.id;

  const archiveMissingReason = await request(`/patients/${patientId}/documents/${documentId}/archive`, owner, { method: "POST", body: JSON.stringify({}) });
  ok(archiveMissingReason.response.status === 400, "document archive requires reason");

  const archived = await request(`/patients/${patientId}/documents/${documentId}/archive`, owner, { method: "POST", body: JSON.stringify({ reason: "Demo archive reason" }) });
  ok(archived.response.status === 201 && archived.body.status === "archived", "archived document is not hard-deleted");

  const templates = await request("/consent-templates", owner);
  ok(templates.response.status === 200 && Array.isArray(templates.body.consentTemplates), "consent templates list");

  const consent = await request("/consents", owner, { method: "POST", body: JSON.stringify({ patientId, consentType: "treatment", status: "granted", notes: "Demo consent only." }) });
  ok(consent.response.status === 201, "doctor workflow can create patient consent record foundation");

  const signed = await request(`/consents/${consent.body.id}/sign-demo`, owner, { method: "POST", body: JSON.stringify({ signedByName: "Demo Signer" }) });
  ok(signed.response.status === 201 && signed.body.signatureStatus === "captured_demo", "demo signature status works");

  const referral = await request("/referrals", doctor, { method: "POST", body: JSON.stringify({ patientId, referralType: "specialist", reason: "Demo referral reason", clinicalSummary: "Doctor-authored demo summary." }) });
  ok(referral.response.status === 201, "referral create works");
  const closeMissing = await request(`/referrals/${referral.body.id}/close`, doctor, { method: "POST", body: JSON.stringify({}) });
  ok(closeMissing.response.status === 400, "referral close requires note");
  const closed = await request(`/referrals/${referral.body.id}/close`, doctor, { method: "POST", body: JSON.stringify({ closureNote: "Demo close note" }) });
  ok(closed.response.status === 201 && closed.body.status === "closed", "referral close works");

  const task = await request("/patient-tasks", owner, { method: "POST", body: JSON.stringify({ patientId, taskType: "review_result", title: "Review demo result", priority: "high" }) });
  ok(task.response.status === 201, "patient task create works");
  const completed = await request(`/patient-tasks/${task.body.id}/complete`, owner, { method: "POST", body: JSON.stringify({}) });
  ok(completed.response.status === 201 && completed.body.status === "done", "patient task complete works");

  const note = await request(`/patients/${patientId}/internal-notes`, doctor, { method: "POST", body: JSON.stringify({ noteType: "clinical_note", visibility: "clinical_only", title: "Clinical internal note", bodyText: "Internal demo note." }) });
  ok(note.response.status === 201, "clinical internal note create works");
  const receptionNotes = await request(`/patients/${patientId}/internal-notes`, reception);
  ok(receptionNotes.response.status === 200 && receptionNotes.body.patientInternalNotes.length === 0, "clinical-only note hidden from receptionist");

  const timeline = await request(`/patients/${patientId}/timeline`, owner);
  const timelineTypes = (timeline.body.items || []).map((item) => item.type);
  ok(["investigation_result", "patient_document", "referral", "patient_task", "internal_note"].every((type) => timelineTypes.includes(type)), "patient timeline includes workflow spine events");

  ok(!JSON.stringify(reviewed.body).toLowerCase().includes("diagnosis generated"), "no automatic diagnosis text in result workflow");

  console.log(`WORKFLOW-SPINE SUMMARY PASS ${pass} FAIL ${fail}`);
  if (fail > 0) process.exit(1);
}

async function waitForHealth() {
  for (let i = 0; i < 20; i += 1) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("API did not become healthy.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
