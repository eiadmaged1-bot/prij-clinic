const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";

let ownerToken = "";
let doctorToken = "";
let receptionToken = "";
let accountantToken = "";
const results = [];

const pass = (label) => { results.push(["PASS", label]); console.log(`PROTOCOL-ATLAS PASS ${label}`); };
const fail = (label, error) => { results.push(["FAIL", label]); console.error(`PROTOCOL-ATLAS FAIL ${label}: ${error?.message || error}`); };

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
  pass("owner login works");

  const groups = await request("/protocol-atlas/groups");
  if (!groups.response.ok || groups.body.groups.length < 20) throw new Error("expected major protocol groups");
  pass("all major groups appear");

  const endo = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ query: "endometriosis" }) });
  if (!endo.body.protocols.some((p) => p.code === "ENDOMETRIOSIS_MANAGEMENT_V1")) throw new Error("endometriosis verified protocol missing");
  pass("verified protocol search works");

  const pcos = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ query: "letrozole pcos" }) });
  if (!pcos.body.protocols.some((p) => p.code === "PCOS_OVULATION_INDUCTION_V1")) throw new Error("PCOS alias search missing");
  pass("aliases match common terms");

  const fibroid = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ query: "fibroid" }) });
  if (!fibroid.body.protocols.some((p) => p.implementationStatus === "catalog_only")) throw new Error("catalog-only fibroid entry missing");
  pass("catalog-only protocols are searchable");

  const denied = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ query: "pcos" }) }, receptionToken);
  if (denied.response.status !== 403) throw new Error(`receptionist got ${denied.response.status}`);
  pass("receptionist cannot access clinical protocol content");

  const doctorRead = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ query: "endometriosis", verifiedOnly: true }) }, doctorToken);
  if (!doctorRead.response.ok || !doctorRead.body.protocols.some((p) => p.code === "ENDOMETRIOSIS_MANAGEMENT_V1")) throw new Error("doctor could not read/search verified protocol");
  pass("doctor can read/search protocol atlas");

  const accountantDenied = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ query: "pcos" }) }, accountantToken);
  if (accountantDenied.response.status !== 403) throw new Error(`accountant got ${accountantDenied.response.status}`);
  pass("accountant cannot access clinical protocol content");

  const catalogList = await request("/protocol-atlas/search", { method: "POST", body: JSON.stringify({ status: "catalog_only" }) });
  const [editorProtocol, invalidVerifyProtocol] = catalogList.body.protocols;
  if (!editorProtocol || !invalidVerifyProtocol) throw new Error("catalog protocols unavailable for editor tests");

  const editor = await request(`/protocol-atlas/${editorProtocol.id}/editor`);
  if (!editor.response.ok || !editor.body.structuredContent || JSON.stringify(editor.body).includes("contentJson editor")) throw new Error("structured editor did not load safely");
  pass("owner can open structured editor without raw editor surface");

  const doctorEditor = await request(`/protocol-atlas/${editorProtocol.id}/editor`, {}, doctorToken);
  if (doctorEditor.response.status !== 403) throw new Error(`doctor editor access got ${doctorEditor.response.status}`);
  pass("doctor cannot access protocol editor");

  const sourceNoReason = await request(`/protocol-atlas/${editorProtocol.id}/source`, { method: "PATCH", body: JSON.stringify({ sourceName: "Demo source without reason" }) });
  if (sourceNoReason.response.status !== 400) throw new Error("source update without reason should fail");
  pass("source update requires reason");

  const source = await request(`/protocol-atlas/${editorProtocol.id}/source`, {
    method: "PATCH",
    body: JSON.stringify({ sourceName: "Demo route-safe guideline source", sourceYear: 2026, sourceVersion: "demo-editor-v1", reason: "Demo source verification test only." })
  });
  if (!source.response.ok) throw new Error("source update failed");
  pass("source update audited endpoint works");

  const aliases = await request(`/protocol-atlas/${editorProtocol.id}/aliases`, {
    method: "PATCH",
    body: JSON.stringify({ aliases: ["Demo protocol atlas test", "demo protocol alias"], reason: "Demo alias verification test only." })
  });
  if (!aliases.response.ok) throw new Error("alias update failed");
  pass("alias update audited endpoint works");

  const catalogOptionsBlocked = await request(`/protocol-atlas/${editorProtocol.id}/structured-content`, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Demo blocked content test only.", content: structuredContent(true) })
  });
  if (catalogOptionsBlocked.response.status !== 400) throw new Error("catalog-only options should be blocked");
  pass("catalog-only content cannot store management options");

  const draft = await request(`/protocol-atlas/${editorProtocol.id}/request-verification`, { method: "POST", body: JSON.stringify({ reason: "Demo request verification test only." }) });
  if (!draft.response.ok || draft.body.implementationStatus !== "draft") throw new Error("request verification did not move to draft");
  pass("catalog-only can move to draft with reason");

  const contentNoReason = await request(`/protocol-atlas/${editorProtocol.id}/structured-content`, { method: "PATCH", body: JSON.stringify({ content: structuredContent(true) }) });
  if (contentNoReason.response.status !== 400) throw new Error("structured content without reason should fail");
  pass("structured content update requires reason");

  const unsafeContent = await request(`/protocol-atlas/${editorProtocol.id}/structured-content`, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Demo unsafe content test only.", content: { ...structuredContent(true), options: ["must prescribe demo medication 10 mg"] } })
  });
  if (unsafeContent.response.status !== 400) throw new Error("unsafe clinical phrase should be blocked");
  pass("unsafe clinical wording and dose patterns are blocked");

  const content = await request(`/protocol-atlas/${editorProtocol.id}/structured-content`, {
    method: "PATCH",
    body: JSON.stringify({ reason: "Demo structured content test only.", content: structuredContent(true) })
  });
  if (!content.response.ok) throw new Error("structured content update failed");
  pass("draft structured content can store proposed options");

  const verifyNoReason = await request(`/protocol-atlas/${editorProtocol.id}/verify`, { method: "POST", body: JSON.stringify({}) });
  if (verifyNoReason.response.status !== 400) throw new Error("verify without reason should fail");
  pass("verify requires reason");

  const verified = await request(`/protocol-atlas/${editorProtocol.id}/verify`, { method: "POST", body: JSON.stringify({ reason: "Demo verify test only." }) });
  if (!verified.response.ok || verified.body.implementationStatus !== "verified") throw new Error("verify with source/content/reason failed");
  pass("verify requires valid source content and reason");

  const invalidDraft = await request(`/protocol-atlas/${invalidVerifyProtocol.id}/request-verification`, { method: "POST", body: JSON.stringify({ reason: "Demo invalid verify setup only." }) });
  if (!invalidDraft.response.ok) throw new Error("invalid verify setup failed");
  const invalidVerify = await request(`/protocol-atlas/${invalidVerifyProtocol.id}/verify`, { method: "POST", body: JSON.stringify({ reason: "Demo invalid verify test only." }) });
  if (invalidVerify.response.status !== 400) throw new Error("verify without valid content should fail");
  pass("verify blocks missing structured management content");

  const audit = await request("/audit?limit=100");
  for (const action of ["protocol_source_updated", "protocol_aliases_updated", "protocol_structured_content_updated", "protocol_verification_requested", "protocol_verified"]) {
    const entry = audit.body.auditLogs.find((log) => log.action === action && log.metadataJson?.protocolId);
    if (!entry || entry.resourceId !== null) throw new Error(`audit missing CUID metadata for ${action}`);
  }
  pass("protocol editor changes are audited with CUID metadata");
}

function structuredContent(withOptions) {
  return {
    summary: "Demo structured protocol summary for local test verification only.",
    verifiedManagementAvailable: false,
    goals: ["Demo doctor-reviewed goal"],
    options: withOptions ? ["Demo management option for doctor review only"] : [],
    safetyChecks: ["Doctor review required"],
    contraindicationChecks: ["Demo contraindication check"],
    redFlags: ["Demo red flag check"],
    followUpConsiderations: ["Demo follow-up consideration"],
    referralConsiderations: ["Demo referral consideration"],
    limitations: ["No automatic diagnosis.", "No automatic prescribing."]
  };
}

main().catch((error) => fail("protocol atlas suite", error)).finally(() => {
  const failed = results.filter(([status]) => status === "FAIL").length;
  console.log(`PROTOCOL-ATLAS SUMMARY PASS ${results.length - failed} FAIL ${failed}`);
  process.exit(failed ? 1 : 0);
});
