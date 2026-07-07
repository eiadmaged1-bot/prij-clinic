import { readFile } from "node:fs/promises";
import {
  apiJson,
  apiStatus,
  assertStatus,
  demoUsers,
  login,
  makeRecorder,
  waitForApi
} from "./security-route-manifest.mjs";

const scenario = process.argv[2] ?? "demo";
const record = makeRecorder(`PILOT-${scenario.toUpperCase()}`);
const webUrl = (process.env.WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const pageText = {
  owner: ["/dashboard", "/admin", "/admin/protocol-atlas", "/guidelines"],
  doctor: ["/doctor", "/doctor/visit", "/protocol-atlas", "/guidelines"],
  receptionist: ["/dashboard", "/patients", "/appointments", "/queue"],
  accountant: ["/dashboard", "/billing"],
  clinical: ["/patients", "/patients/new", "/doctor", "/protocol-atlas"],
  finance: ["/billing"],
  ai: ["/protocol-atlas"],
  guidelines: ["/guidelines", "/guidelines/search", "/guidelines/ask", "/guidelines/sources"],
  denials: ["/protocol-atlas", "/guidelines"],
  demo: ["/dashboard", "/doctor", "/patients", "/billing", "/protocol-atlas", "/guidelines"]
};

async function fetchPage(path) {
  const response = await fetch(`${webUrl}${path}`);
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`);
  const html = await response.text();
  if (/stack trace|unhandled runtime error|PrismaClientKnownRequestError/i.test(html)) {
    throw new Error(`${path} rendered a technical error`);
  }
  return html;
}

function textOnly(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

async function assertPages(paths) {
  for (const path of paths) {
    const html = await fetchPage(path);
    const text = textOnly(html);
    if (!/Dr Maged Attia Clinics|Dashboard|Doctor Mode|Patient files|Billing|Protocol Atlas|Guideline Center/.test(text)) {
      throw new Error(`${path} did not render a recognizable pilot page`);
    }
  }
  record.pass(`${scenario} browser pages render`);
}

async function createPilotFixture(owner) {
  const patient = await apiJson("POST", "/patients", owner, {
    medicalRecordNumber: `DEMO-PILOT-${scenario.toUpperCase()}-${runId}`,
    firstName: "Demo",
    lastName: `Pilot${scenario}`,
    notes: "Fake local pilot walkthrough patient only."
  });
  const appointment = await apiJson("POST", "/appointments", owner, {
    patientId: patient.id,
    startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    appointmentType: "Pilot walkthrough",
    notes: "Fake local pilot walkthrough appointment only."
  });
  return { patient, appointment };
}

async function ownerWalkthrough(tokens) {
  await apiJson("GET", "/dashboard/summary", tokens.owner);
  await apiJson("GET", "/admin/control-center", tokens.owner);
  await apiJson("GET", "/audit?limit=20", tokens.owner);
  await assertPages(pageText.owner);
  record.pass("owner can open control, audit, protocol, and guideline surfaces");
}

async function doctorWalkthrough(tokens, fixture) {
  await apiJson("GET", `/patients/${fixture.patient.id}`, tokens.doctor);
  await apiJson("POST", "/protocol-atlas/search", tokens.doctor, { query: "antenatal", status: "verified" });
  const snapshot = await apiJson("POST", "/ai-management/snapshots", tokens.doctor, {
    patientId: fixture.patient.id,
    diagnosisText: "antenatal care routine",
    clinicalGoal: "doctor review",
    protocolCode: "ANTENATAL_CARE_ROUTINE"
  });
  if (!snapshot.outputJson?.doctorDecisionRequired || snapshot.outputJson?.snapshotHeading !== "Antenatal care snapshot") {
    throw new Error("doctor AI management walkthrough did not return the antenatal draft snapshot");
  }
  await assertPages(pageText.doctor);
  record.pass("doctor can use clinical, protocol, AI snapshot, and guideline surfaces");
}

async function receptionistWalkthrough(tokens, fixture) {
  await apiJson("GET", "/appointments", tokens.receptionist);
  await apiJson("GET", "/queue/today", tokens.receptionist);
  await apiJson("GET", `/patients/${fixture.patient.id}`, tokens.receptionist);
  assertStatus(await apiStatus("POST", "/ai-management/snapshots", tokens.receptionist, {
    patientId: fixture.patient.id,
    diagnosisText: "contraception",
    protocolCode: "CONTRACEPTION_COUNSELING"
  }), 403, "receptionist AI management denial");
  assertStatus(await apiStatus("GET", "/guidelines/search?q=doctor%20review", tokens.receptionist), 403, "receptionist guideline denial");
  await assertPages(pageText.receptionist);
  record.pass("receptionist operations work and clinical AI/guidelines are denied");
}

async function accountantWalkthrough(tokens) {
  await apiJson("GET", "/billing/invoices", tokens.accountant);
  await apiJson("GET", "/billing/payments", tokens.accountant);
  await apiJson("GET", "/billing/daily-closing", tokens.accountant);
  assertStatus(await apiStatus("POST", "/protocol-atlas/search", tokens.accountant, { query: "aub" }), 403, "accountant protocol denial");
  assertStatus(await apiStatus("GET", "/guidelines/search?q=doctor%20review", tokens.accountant), 403, "accountant guideline denial");
  assertStatus(await apiStatus("POST", "/ai-management/snapshots", tokens.accountant, { diagnosisText: "aub" }), 403, "accountant AI management denial");
  await assertPages(pageText.accountant);
  record.pass("accountant finance routes work and clinical AI/guidelines are denied");
}

async function clinicalWalkthrough(tokens, fixture) {
  const pregnancy = await apiJson("POST", "/pregnancies", tokens.owner, {
    patientId: fixture.patient.id,
    status: "active",
    gravida: 1,
    para: 0,
    riskLevel: "routine",
    notes: "Fake pilot pregnancy record only."
  });
  await apiJson("POST", `/pregnancies/${pregnancy.id}/antenatal-visits`, tokens.owner, {
    visitDate: new Date().toISOString().slice(0, 10),
    gestationalAgeDisplay: "Demo gestational age",
    planText: "Demo follow-up plan only. Doctor review required."
  });
  await apiJson("GET", `/patients/${fixture.patient.id}`, tokens.doctor);
  await assertPages(pageText.clinical);
  record.pass("clinical walkthrough covers patient, pregnancy, and antenatal surfaces");
}

async function financeWalkthrough(tokens, fixture) {
  const invoice = await apiJson("POST", "/billing/invoices", tokens.owner, {
    patientId: fixture.patient.id,
    invoiceNumber: `DEMO-PILOT-INV-${runId}`,
    notes: "Fake pilot invoice only. No payment gateway.",
    items: [{ description: "Demo pilot consultation", quantity: 1, unitAmount: 100 }]
  });
  await apiJson("POST", `/billing/invoices/${invoice.id}/issue`, tokens.owner);
  await apiJson("POST", "/billing/payments", tokens.owner, {
    invoiceId: invoice.id,
    method: "cash",
    amount: 10,
    referenceNote: "Fake pilot cash payment only."
  });
  await apiJson("GET", "/billing/reports/finance", tokens.accountant);
  await assertPages(pageText.finance);
  record.pass("finance walkthrough covers invoice, payment, and reports");
}

async function aiWalkthrough(tokens, fixture) {
  const examples = [
    ["ECTOPIC_RED_FLAGS", "Urgent safety snapshot"],
    ["ABNORMAL_UTERINE_BLEEDING", "Gynecology management snapshot"],
    ["CONTRACEPTION_COUNSELING", "Eligibility and counseling snapshot"],
    ["ANTENATAL_CARE_ROUTINE", "Antenatal care snapshot"]
  ];
  for (const [protocolCode, heading] of examples) {
    const snapshot = await apiJson("POST", "/ai-management/snapshots", tokens.doctor, {
      patientId: fixture.patient.id,
      diagnosisText: protocolCode,
      clinicalGoal: "doctor review",
      protocolCode
    });
    if (snapshot.outputJson?.snapshotHeading !== heading) throw new Error(`${protocolCode} heading mismatch`);
    const text = JSON.stringify(snapshot.outputJson).toLowerCase();
    for (const unsafe of ["must prescribe", "definitive diagnosis", "final treatment plan:", "external ai access true"]) {
      if (text.includes(unsafe)) throw new Error(`${protocolCode} contains unsafe wording: ${unsafe}`);
    }
  }
  await assertPages(pageText.ai);
  record.pass("AI management walkthrough covers all verified pack headings safely");
}

async function guidelinesWalkthrough(tokens) {
  const sourcesResponse = await apiJson("GET", "/guidelines/sources", tokens.doctor);
  const sources = sourcesResponse.sources ?? sourcesResponse;
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("guideline source registry is empty");
  const search = await apiJson("GET", "/guidelines/search?q=doctor%20review", tokens.doctor);
  if (!search.results?.length) throw new Error("guideline search returned no cited chunks");
  const ask = await apiJson("POST", "/guidelines/ask", tokens.doctor, { question: "What does the local demo text say about doctor review?" });
  if (ask.externalAiAccess !== false || ask.doctorReviewRequired !== true || !ask.citations?.length) {
    throw new Error("guideline ask response was not local, cited, and doctor-review gated");
  }
  await assertPages(pageText.guidelines);
  record.pass("guideline walkthrough covers source registry, search, ask, and pages");
}

async function denialsWalkthrough(tokens, fixture) {
  for (const [role, token] of [["receptionist", tokens.receptionist], ["accountant", tokens.accountant]]) {
    assertStatus(await apiStatus("GET", "/guidelines/sources", token), 403, `${role} guideline source denial`);
    assertStatus(await apiStatus("POST", "/protocol-atlas/search", token, { query: "contraception" }), 403, `${role} protocol denial`);
    assertStatus(await apiStatus("POST", "/ai-management/snapshots", token, {
      patientId: fixture.patient.id,
      diagnosisText: "contraception",
      protocolCode: "CONTRACEPTION_COUNSELING"
    }), 403, `${role} AI management denial`);
  }
  await assertPages(pageText.denials);
  record.pass("role-denial walkthrough confirms receptionist and accountant restrictions");
}

async function main() {
  await waitForApi();
  const tokens = {
    owner: await login(demoUsers.owner),
    doctor: await login(demoUsers.doctor),
    receptionist: await login(demoUsers.reception),
    accountant: await login(demoUsers.accountant)
  };
  const fixture = await createPilotFixture(tokens.owner);
  record.pass("fake pilot fixture created");

  const sourceChecks = [
    ["apps/web/components/ai-management/ManagementSnapshotPanel.tsx", "Draft support only"],
    ["apps/web/components/guidelines/GuidelineCenterClient.tsx", "Guideline Center"],
    ["apps/web/app/patients/[id]/page.tsx", "Antenatal Visits"]
  ];
  for (const [file, required] of sourceChecks) {
    const source = await readFile(file, "utf8");
    if (!source.includes(required)) throw new Error(`${file} missing ${required}`);
  }
  record.pass("pilot UI source checkpoints exist");

  const runners = {
    owner: () => ownerWalkthrough(tokens, fixture),
    doctor: () => doctorWalkthrough(tokens, fixture),
    receptionist: () => receptionistWalkthrough(tokens, fixture),
    accountant: () => accountantWalkthrough(tokens, fixture),
    clinical: () => clinicalWalkthrough(tokens, fixture),
    finance: () => financeWalkthrough(tokens, fixture),
    ai: () => aiWalkthrough(tokens, fixture),
    guidelines: () => guidelinesWalkthrough(tokens, fixture),
    denials: () => denialsWalkthrough(tokens, fixture),
    demo: async () => {
      await ownerWalkthrough(tokens, fixture);
      await doctorWalkthrough(tokens, fixture);
      await receptionistWalkthrough(tokens, fixture);
      await accountantWalkthrough(tokens, fixture);
      await clinicalWalkthrough(tokens, fixture);
      await financeWalkthrough(tokens, fixture);
      await aiWalkthrough(tokens, fixture);
      await guidelinesWalkthrough(tokens, fixture);
      await denialsWalkthrough(tokens, fixture);
      await assertPages(pageText.demo);
      record.pass("full pilot demo walkthrough complete");
    }
  };

  if (!runners[scenario]) throw new Error(`Unknown pilot walkthrough scenario: ${scenario}`);
  await runners[scenario]();
}

await main().catch((error) => record.fail(`${scenario} pilot walkthrough`, error));
record.summary();
