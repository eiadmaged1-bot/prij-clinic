import { apiRequest, makeRecorder, waitForApi } from "./security-route-manifest.mjs";

const record = makeRecorder("ERROR-SAFETY");

async function main() {
  await waitForApi();

  const notFound = await apiRequest("GET", "/__demo_missing_route__");
  if (notFound.status !== 404) throw new Error(`Expected 404 for missing route, got ${notFound.status}`);
  assertSafeErrorBody("missing route", notFound.body);
  record.pass("404 error response does not expose stack or secrets");

  const badLogin = await apiRequest("POST", "/auth/login", null, {
    email: "not-an-email",
    password: "demo-password-that-must-not-echo"
  });
  if (![400, 401].includes(badLogin.status)) throw new Error(`Expected 400/401 for bad login, got ${badLogin.status}`);
  assertSafeErrorBody("bad login", badLogin.body);
  const serialized = JSON.stringify(badLogin.body);
  if (/demo-password-that-must-not-echo/.test(serialized)) throw new Error("Error response echoed password-like input.");
  record.pass("auth/validation error response does not echo password input");
}

function assertSafeErrorBody(label, body) {
  const serialized = JSON.stringify(body);
  if (/stack|trace|DATABASE_URL|JWT_SECRET|postgresql:\/\/|Bearer\s+[A-Za-z0-9._-]+|scrypt:/i.test(serialized)) {
    throw new Error(`${label} error response exposed stack, connection, token, or secret-like content.`);
  }
}

await main().catch((error) => record.fail("error safety setup", error));
record.summary();
