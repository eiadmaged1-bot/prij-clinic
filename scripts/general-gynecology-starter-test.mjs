import { readFileSync } from "node:fs";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const WEB_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const checks = [];

const templates = [
  "general",
  "abnormal_uterine_bleeding",
  "pelvic_pain",
  "pcos",
  "fibroid_ovarian_cyst",
  "contraception"
];

const requiredUiText = [
  "General Gynecology",
  "Start Gynecology Visit",
  "Abnormal bleeding",
  "Pelvic pain",
  "PCOS",
  "Fibroid or ovarian cyst",
  "Contraception counseling",
  "Print gynecology summary",
  "These templates record clinician-entered information only"
];

function pass(label) {
  checks.push(label);
  console.log(`GYN-STARTER PASS ${label}`);
}

async function main() {
  const source = readFileSync("apps/web/app/patients/[id]/page.tsx", "utf8");
  for (const text of requiredUiText) {
    if (!source.includes(text)) throw new Error(`Patient gynecology workspace missing text: ${text}`);
  }
  pass("gynecology workspace, template labels, and print summary UI are implemented");

  for (const forbidden of [
    "automatic treatment",
    "recommended treatment",
    "recommended method",
    "eligibility diagnosis",
    "automatic prescribing",
    "diagnostic recommendation"
  ]) {
    if (source.toLowerCase().includes(forbidden)) {
      throw new Error(`Forbidden gynecology wording found: ${forbidden}`);
    }
  }
  pass("gynecology UI avoids treatment recommendation and prescribing wording");

  const ownerToken = await login("owner@prij.local", "LocalDev123!");
  const accountantToken = await login("demo.accountant@prij.local", "LocalDev123!");

  const patient = await apiJson("POST", "/patients", ownerToken, {
    medicalRecordNumber: `GYN-DEMO-${runId}`,
    firstName: "Demo",
    lastName: "Gynecology",
    notes: "General gynecology starter test fake record only."
  });
  if (!patient.id) throw new Error("Fake gynecology test patient was not created.");
  pass("fake demo patient created");

  for (const templateType of templates) {
    const visit = await apiJson("POST", `/patients/${patient.id}/gynecology-visits`, ownerToken, payloadFor(templateType));
    if (visit.templateType !== templateType) throw new Error(`Template ${templateType} was not persisted.`);
  }
  pass("gynecology visit and starter templates persist");

  const list = await apiJson("GET", `/patients/${patient.id}/gynecology-visits`, ownerToken);
  const visitTypes = new Set((list.gynecologyVisits || []).map((visit) => visit.templateType));
  for (const templateType of templates) {
    if (!visitTypes.has(templateType)) throw new Error(`Template ${templateType} missing from visit list.`);
  }
  pass("gynecology visit template list renders from API");

  const timeline = await apiJson("GET", `/patients/${patient.id}/timeline`, ownerToken);
  const timelineText = JSON.stringify(timeline);
  for (const expected of [
    "Gynecology visit recorded",
    "AUB template recorded",
    "Pelvic pain template recorded",
    "PCOS template recorded",
    "Fibroid or ovarian cyst template recorded",
    "Contraception counseling template recorded"
  ]) {
    if (!timelineText.includes(expected)) throw new Error(`Timeline missing ${expected}.`);
  }
  pass("timeline shows gynecology events");

  const deniedList = await apiRequest("GET", `/patients/${patient.id}/gynecology-visits`, accountantToken);
  if (deniedList.status !== 403) {
    throw new Error(`Accountant gynecology read should be denied with 403, received ${deniedList.status}.`);
  }
  const deniedCreate = await apiRequest("POST", `/patients/${patient.id}/gynecology-visits`, accountantToken, payloadFor("general"));
  if (deniedCreate.status !== 403) {
    throw new Error(`Accountant gynecology write should be denied with 403, received ${deniedCreate.status}.`);
  }
  pass("non-clinical gynecology access denied");

  await expectReachable(`${WEB_URL}/patients/${patient.id}`, "patient file page");
  pass("gynecology patient workspace route renders");

  const audit = await apiJson("GET", "/audit", ownerToken);
  const auditText = JSON.stringify(audit);
  if (!auditText.includes("gynecology_visit.created")) throw new Error("Gynecology create audit event missing.");
  if (!auditText.includes("recording_only_clinician_interpretation_required")) {
    throw new Error("Gynecology audit safety marker missing.");
  }
  pass("gynecology actions are audited");

  const ultrasounds = await apiJson("GET", "/ob-ultrasounds", ownerToken);
  const ultrasoundText = JSON.stringify(ultrasounds).toLowerCase();
  for (const forbidden of ["fgr diagnosis", "growth restriction diagnosis", "automatic fetal risk"]) {
    if (ultrasoundText.includes(forbidden)) throw new Error(`OB regression wording found: ${forbidden}`);
  }
  pass("OB ultrasound automatic diagnosis regression absent");

  console.log(`GYN-STARTER SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

function payloadFor(templateType) {
  const base = {
    templateType,
    reasonForVisit: `Demo ${templateType} recording aid only.`,
    menstrualHistory: "Demo menstrual history note.",
    examinationNotes: "Demo examination note.",
    doctorImpression: "Doctor-authored demo impression.",
    doctorPlan: "Doctor-authored demo plan.",
    followUpDate: "2026-07-15"
  };

  if (templateType === "abnormal_uterine_bleeding") {
    return { ...base, cycleRegularity: "Demo regularity note", bleedingDuration: "Demo duration", bleedingAmount: "Demo amount", clots: "Demo clots note", intermenstrualBleeding: "Demo intermenstrual note", postcoitalBleeding: "Demo postcoital note", associatedSymptoms: "Demo associated symptoms", pregnancyTestNote: "Demo pregnancy test note" };
  }
  if (templateType === "pelvic_pain") {
    return { ...base, painOnset: "Demo onset", painDuration: "Demo duration", painSite: "Demo site", relationToCycle: "Demo relation", painSeverity: "Demo severity", urinaryBowelSymptoms: "Demo urinary bowel symptoms", associatedSymptoms: "Demo associated symptoms" };
  }
  if (templateType === "pcos") {
    return { ...base, cyclePattern: "Demo cycle pattern", acneHirsutismNote: "Demo acne hirsutism note", weightMetabolicRiskNote: "Demo metabolic note", ultrasoundNote: "Demo ultrasound note", labsNote: "Demo labs note" };
  }
  if (templateType === "fibroid_ovarian_cyst") {
    return { ...base, findingSource: "Demo finding source", sizeLocationNote: "Demo size location note", symptoms: "Demo symptoms", followUpPlan: "Demo follow-up plan" };
  }
  if (templateType === "contraception") {
    return { ...base, currentMethod: "Demo current method", previousMethods: "Demo previous methods", contraindicationChecklist: "Demo checklist placeholder", counselingNotes: "Demo counseling notes", chosenMethod: "Demo chosen method", followUpPlan: "Demo follow-up plan" };
  }
  return base;
}

async function login(email, password) {
  const body = await apiJson("POST", "/auth/login", null, { email, password });
  if (!body.token) throw new Error(`Login failed for ${email}.`);
  return body.token;
}

async function expectReachable(url, label) {
  const response = await fetch(url, { headers: { Accept: "text/html" } });
  if (!response.ok) throw new Error(`${label} returned ${response.status}.`);
}

async function apiJson(method, path, token, body) {
  const response = await apiRequest(method, path, token, body);
  if (!response.ok) {
    throw new Error(`${method} ${path} returned ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

async function apiRequest(method, path, token, body) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await parseBody(response)
  };
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

await main().catch((error) => {
  console.error(`GYN-STARTER FAIL ${error.message}`);
  process.exit(1);
});
