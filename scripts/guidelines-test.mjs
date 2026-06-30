const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
const results = [];

let ownerToken = "";
let doctorToken = "";
let receptionToken = "";
let accountantToken = "";

const pass = (label) => { results.push(["PASS", label]); console.log(`GUIDELINES PASS ${label}`); };
const fail = (label, error) => { results.push(["FAIL", label]); console.error(`GUIDELINES FAIL ${label}: ${error?.message || error}`); };

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
  accountantToken = await login("demo.accountant@prij.local");
  pass("demo users login");

  const sources = await request("/guidelines/sources");
  const sourceList = sources.body.sources ?? sources.body;
  for (const sourceName of ["WHO Guideline Registry", "NICE Guidance", "RCOG Guidance", "ACOG Clinical Guidance", "ESHRE Guidelines", "ASRM Practice Guidance", "SMFM Publications and Guidelines"]) {
    if (!sources.response.ok || !sourceList.some((source) => source.name === sourceName)) throw new Error(`source registry missing ${sourceName}`);
  }
  pass("owner can read seeded source registry");

  const governanceSourceName = `Demo Governance Source ${Date.now()}`;
  const manage = await request("/guidelines/sources", { method: "POST", body: JSON.stringify({ name: governanceSourceName, organization: governanceSourceName, sourceType: "OPEN_PUBLIC", notes: "Demo metadata only." }) });
  if (!manage.response.ok || manage.body.name !== governanceSourceName) throw new Error("owner source manage failed");
  pass("owner can manage sources");

  const doctorSources = await request("/guidelines/sources", {}, doctorToken);
  if (!doctorSources.response.ok) throw new Error("doctor could not read sources");
  pass("doctor can read guideline center");

  const documents = await request("/guidelines/documents", {}, doctorToken);
  const documentList = documents.body.documents ?? documents.body;
  for (const title of ["Demo Antenatal Care Reference", "Demo PCOS Guideline Index", "Demo Endometriosis Guideline Index"]) {
    if (!documents.response.ok || !documentList.some((document) => document.title === title)) throw new Error(`seeded guideline document missing ${title}`);
  }
  pass("seeded demo guideline documents are visible");

  for (const [role, token] of [["receptionist", receptionToken], ["accountant", accountantToken]]) {
    const denied = await request("/guidelines/search?q=doctor", {}, token);
    if (denied.response.status !== 403) throw new Error(`${role} guideline search status ${denied.response.status}`);
  }
  pass("receptionist and accountant denied");

  const search = await request(`/guidelines/search?q=${encodeURIComponent("doctor review")}`, {}, doctorToken);
  if (!search.response.ok || !search.body.results.length || !search.body.results[0].citationLabel) throw new Error("search did not return citations");
  pass("search returns citations");

  for (const term of ["antenatal", "PCOS", "endometriosis"]) {
    const result = await request(`/guidelines/search?q=${encodeURIComponent(term)}`, {}, doctorToken);
    if (!result.response.ok || !result.body.results.length) throw new Error(`guideline search did not return seeded demo result for ${term}`);
  }
  pass("guideline search returns seeded antenatal PCOS and endometriosis chunks");

  const ask = await request("/guidelines/ask", { method: "POST", body: JSON.stringify({ question: "What does the PCOS demo index contain?" }) }, doctorToken);
  if (!ask.response.ok || ask.body.externalAiAccess !== false || !ask.body.doctorReviewRequired || !ask.body.citations.length) throw new Error("ask did not return safe cited answer");
  pass("ask returns local cited answer with no external AI");

  const noSource = await request("/guidelines/ask", { method: "POST", body: JSON.stringify({ question: "zzzxxy unavailable phrase" }) }, doctorToken);
  if (!noSource.response.ok || !noSource.body.answer.includes("No source found") || noSource.body.citations.length !== 0) throw new Error("no-source state failed");
  pass("ask returns no-source state");

  const unsafeText = JSON.stringify([search.body, ask.body]).toLowerCase();
  for (const unsafe of ["must prescribe", "diagnosis is", "final treatment plan", "external ai access true"]) {
    if (unsafeText.includes(unsafe)) throw new Error(`unsafe text found: ${unsafe}`);
  }
  pass("guideline output avoids diagnosis and prescribing wording");

  const logs = await request("/guidelines/query-logs");
  const queryLogs = logs.body.queryLogs ?? logs.body;
  if (!logs.response.ok || !Array.isArray(queryLogs) || queryLogs.length < 2) throw new Error("query logs unavailable");
  pass("query logs recorded");

  const audit = await request("/audit?limit=100");
  if (!audit.body.auditLogs.some((log) => String(log.action).startsWith("guideline."))) throw new Error("guideline audit events missing");
  pass("guideline actions are audited");
}

main().catch((error) => fail("guideline center suite", error)).finally(() => {
  const failed = results.filter(([status]) => status === "FAIL").length;
  console.log(`GUIDELINES SUMMARY PASS ${results.length - failed} FAIL ${failed}`);
  process.exit(failed ? 1 : 0);
});
