import { readFile } from "node:fs/promises";

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const WEB_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const runId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const checks = [];

await main().catch((error) => {
  console.error(`GUIDELINES FAIL ${error.message}`);
  process.exit(1);
});

async function main() {
  await waitForApi();
  const owner = await login("eyad", "eyad");
  const doctor = await login("demo.doctor@prij.local", process.env.DEMO_TEST_PASSWORD || "LocalDev123!");
  const reception = await login("demo.reception@prij.local", process.env.DEMO_TEST_PASSWORD || "LocalDev123!");
  const accountant = await login("demo.accountant@prij.local", process.env.DEMO_TEST_PASSWORD || "LocalDev123!");
  checks.push("demo users login");

  const sources = await apiJson("GET", "/guidelines/sources", owner);
  assert(sources.sources.length >= 12, "source registry was not seeded");
  checks.push("source registry seeded");

  const deniedSearch = await apiRequest("GET", "/guidelines/search?q=antenatal", reception);
  assert(deniedSearch.status === 403, "receptionist guideline search must be denied");
  const deniedAsk = await apiRequest("POST", "/guidelines/ask", reception, { question: "antenatal" });
  assert(deniedAsk.status === 403, "receptionist guideline ask must be denied");
  checks.push("receptionist blocked from guideline content");

  const uploadDenied = await apiRequest("POST", "/guidelines/sources", doctor, {
    name: `Doctor Blocked Source ${runId}`,
    organization: `Blocked ${runId}`,
    sourceType: "OPEN_PUBLIC"
  });
  assert(uploadDenied.status === 403, "doctor must not manage guideline sources by default");
  checks.push("source management requires owner permission");

  const loginRequiredSource = await apiJson("POST", "/guidelines/sources", owner, {
    name: `Login Required Demo ${runId}`,
    organization: `LOGIN-${runId}`,
    sourceType: "LOGIN_REQUIRED",
    websiteUrl: "https://example.invalid/login",
    specialties: ["obstetrics"],
    defaultAccessLevel: "OWNER_DOCTOR"
  });
  const refusedImport = await apiRequest("POST", "/guidelines/import-url", owner, {
    sourceId: loginRequiredSource.id,
    url: "https://example.invalid/login/guideline.pdf",
    title: "Should Not Import",
    specialty: "obstetrics",
    topic: "safety"
  });
  assert([400, 403].includes(refusedImport.status), "login-required source import must be refused");
  checks.push("login-required import refused");

  const upload = await uploadDemoGuideline(owner);
  assert(upload.document?.id, "demo guideline upload did not return a document");
  assert(upload.document.accessLevel === "OWNER_DOCTOR", "private upload did not default to owner-doctor access");
  assert(upload.document._count?.chunks > 0, "upload did not create indexed chunks");
  assert(!JSON.stringify(upload.document).includes("localFilePath"), "upload response exposed local file path");
  assert(!JSON.stringify(upload.document).includes("storage"), "upload response exposed storage path");
  checks.push("private demo text upload indexed");

  const review = await apiJson("POST", `/guidelines/documents/${upload.document.id}/review`, owner, {
    decision: "APPROVED",
    reason: "Demo guideline test approval."
  });
  assert(review.guidelineStatus === "ACTIVE", "review did not approve document");
  checks.push("guideline review approval");

  const archiveNoReason = await apiRequest("POST", `/guidelines/documents/${upload.document.id}/archive`, owner, {
    decision: "ARCHIVED"
  });
  assert(archiveNoReason.status === 400, "archive without reason must be rejected");
  checks.push("archive requires reason");

  const doctorSearch = await apiJson("GET", "/guidelines/search?q=demo%20antenatal%20follow%20up", doctor);
  assert(doctorSearch.results?.length > 0, "doctor search returned no chunks");
  assert(doctorSearch.results[0].citationLabel, "search result missing citation label");
  checks.push("doctor search returns citations");

  const ask = await apiJson("POST", "/guidelines/ask", doctor, {
    question: "What does the demo antenatal source say about follow up?"
  });
  assert(ask.answer.includes("Evidence summary from local library only"), "ask response missing local-library label");
  assert(ask.citations?.length > 0, "ask response missing citations");
  assert(!/diagnosis|prescription|final treatment/i.test(ask.answer), "ask response used prohibited final clinical wording");
  checks.push("mock RAG answer cites local chunks only");

  const noSource = await apiJson("POST", "/guidelines/ask", doctor, {
    question: `zzzznosource${runId.replace(/\D/g, "")}`
  });
  assert(noSource.answer === "No source found in your local library.", "no-source answer is incorrect");
  checks.push("mock RAG no-source answer");

  const privateDenied = await apiRequest("GET", `/guidelines/documents/${upload.document.id}`, reception);
  assert(privateDenied.status === 403, "receptionist direct private document access must be denied");
  checks.push("private document direct access blocked");

  const listedDocuments = await apiJson("GET", "/guidelines/documents", owner);
  assert(!JSON.stringify(listedDocuments).includes("localFilePath"), "document list exposed local file path");
  assert(!JSON.stringify(listedDocuments).includes("storage"), "document list exposed storage path");
  checks.push("local storage paths are not exposed");

  const ownerView = await apiRequest("GET", `/guidelines/documents/${upload.document.id}/view`, owner);
  assert(ownerView.status === 200 && String(ownerView.body).includes("Demo guideline sample"), "owner could not view private document");
  const doctorView = await apiRequest("GET", `/guidelines/documents/${upload.document.id}/view`, doctor);
  assert(doctorView.status === 200 && String(doctorView.body).includes("Demo guideline sample"), "doctor could not view owner-doctor document");
  checks.push("owner and doctor can view authorized private document");

  const receptionistViewDenied = await apiRequest("GET", `/guidelines/documents/${upload.document.id}/view`, reception);
  assert(receptionistViewDenied.status === 403, "receptionist private file view must be denied");
  const accountantViewDenied = await apiRequest("GET", `/guidelines/documents/${upload.document.id}/view`, accountant);
  assert(accountantViewDenied.status === 403, "accountant private file view must be denied");
  checks.push("receptionist and accountant blocked from guideline files");

  const disabledDownload = await apiRequest("GET", `/guidelines/documents/${upload.document.id}/download`, owner);
  assert(disabledDownload.status === 403, "download must be blocked when disabled");
  const doctorSettingsDenied = await apiRequest("PATCH", `/guidelines/documents/${upload.document.id}/file-access-settings`, doctor, {
    downloadsAllowed: true
  });
  assert(doctorSettingsDenied.status === 403, "doctor must not change private download settings");
  const enabledDownloadSettings = await apiJson("PATCH", `/guidelines/documents/${upload.document.id}/file-access-settings`, owner, {
    downloadsAllowed: true
  });
  assert(enabledDownloadSettings.downloadsAllowed === true, "owner could not enable downloads");
  const enabledDownload = await apiRequest("GET", `/guidelines/documents/${upload.document.id}/download`, doctor);
  assert(enabledDownload.status === 200 && String(enabledDownload.body).includes("Demo guideline sample"), "authorized download did not work after owner enabled it");
  checks.push("download control enforced by owner setting");

  const ownerOnlyUpload = await uploadDemoGuideline(owner, { accessLevel: "OWNER_ONLY", titleSuffix: "owner only" });
  const ownerOnlyDoctorView = await apiRequest("GET", `/guidelines/documents/${ownerOnlyUpload.document.id}/view`, doctor);
  assert(ownerOnlyDoctorView.status === 403, "doctor must not view owner-only private document");
  checks.push("owner-only guideline file blocks doctor");

  const archiveUpload = await uploadDemoGuideline(owner, { titleSuffix: "archive access" });
  await apiJson("POST", `/guidelines/documents/${archiveUpload.document.id}/archive`, owner, {
    decision: "ARCHIVED",
    reason: "Demo archive access rule test."
  });
  const archivedDoctorView = await apiRequest("GET", `/guidelines/documents/${archiveUpload.document.id}/view`, doctor);
  assert(archivedDoctorView.status === 403, "doctor must not view archived private document");
  const archivedOwnerView = await apiRequest("GET", `/guidelines/documents/${archiveUpload.document.id}/view`, owner);
  assert(archivedOwnerView.status === 200, "owner should retain audited archived-document access");
  checks.push("archived guideline file access follows owner-only rule");

  await expectReachable(`${WEB_URL}/guidelines`, "guideline center page");
  await expectReachable(`${WEB_URL}/guidelines/search`, "guideline search page");
  await expectReachable(`${WEB_URL}/guidelines/ask`, "guideline ask page");
  await expectReachable(`${WEB_URL}/guidelines/upload`, "guideline upload page");
  checks.push("guideline frontend pages render");

  const source = await readFile("apps/web/app/guidelines/GuidelineCenter.tsx", "utf8");
  assert(!source.includes("<pre"), "guideline UI should not render raw JSON blocks");
  assert(source.includes("Evidence summary from local library only"), "guideline UI missing safety label");
  checks.push("guideline UI avoids raw JSON and includes safety label");

  const serviceSource = await readFile("apps/api/src/guidelines/guidelines.service.ts", "utf8");
  assert(!/openai|langchain|anthropic/i.test(serviceSource), "guideline service must not call external AI libraries");
  checks.push("no external AI dependency in guideline service");

  const audit = await apiJson("GET", "/audit?limit=300", owner);
  for (const action of [
    "guideline.uploaded",
    "guideline.reviewed",
    "guideline.search",
    "guideline.ask",
    "guideline.import_refused",
    "guideline.file_view_allowed",
    "guideline.file_view_denied",
    "guideline.file_download_allowed",
    "guideline.file_download_denied",
    "guideline.file_access_settings_updated"
  ]) {
    assert(audit.auditLogs?.some((entry) => entry.action === action), `missing audit action ${action}`);
  }
  checks.push("guideline actions audited");

  for (const check of checks) console.log(`GUIDELINES PASS ${check}`);
  console.log(`GUIDELINES SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

async function uploadDemoGuideline(token, options = {}) {
  const form = new FormData();
  const uploadId = `${runId}-${options.titleSuffix || "default"}-${Math.floor(Math.random() * 100000)}`;
  const text = [
    "Demo guideline sample - not clinical use.",
    `Demo run identifier ${uploadId}.`,
    "This local evidence library test text discusses demo antenatal follow up and documentation review.",
    "Doctor review is required before using any evidence summary."
  ].join(" ");
  form.append("file", new Blob([text], { type: "text/plain" }), `demo-guideline-${uploadId}.txt`);
  form.append("title", `Demo guideline sample ${options.titleSuffix || runId}`);
  form.append("sourceOrganization", "Private Demo Source");
  form.append("specialty", "obstetrics");
  form.append("topic", "antenatal follow up");
  if (options.accessLevel) form.append("accessLevel", options.accessLevel);
  const response = await fetch(`${API_URL}/guidelines/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: form
  });
  const body = await parseBody(response);
  if (!response.ok) throw new Error(`upload failed ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function waitForApi() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("API was not reachable for guideline tests");
}

async function expectReachable(url, label) {
  const response = await fetch(url, { headers: { accept: "text/html" } });
  assert(response.ok, `${label} returned ${response.status}`);
}

async function login(identifier, password) {
  const body = await apiJson("POST", "/auth/login", null, { identifier, password });
  return body.token;
}

async function apiJson(method, path, token, body) {
  const response = await apiRequest(method, path, token, body);
  if (!response.ok) throw new Error(`${method} ${path} returned ${response.status}: ${JSON.stringify(response.body)}`);
  return response.body;
}

async function apiRequest(method, path, token, body) {
  const headers = { accept: "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers["content-type"] = "application/json";
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return { ok: response.ok, status: response.status, body: await parseBody(response) };
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
