const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const PASSWORD = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";

let ownerToken = "";
let receptionToken = "";
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
  receptionToken = await login("demo.reception@prij.local");
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
}

main().catch((error) => fail("protocol atlas suite", error)).finally(() => {
  const failed = results.filter(([status]) => status === "FAIL").length;
  console.log(`PROTOCOL-ATLAS SUMMARY PASS ${results.length - failed} FAIL ${failed}`);
  process.exit(failed ? 1 : 0);
});
