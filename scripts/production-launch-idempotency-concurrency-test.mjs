import * as http from "http";
import * as assert from "assert";

console.log("Running production-launch-idempotency-concurrency-test.mjs...");

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ res, data }));
    });
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function testConcurrency() {
  console.log("1. Login to get a session cookie");
  const loginBody = JSON.stringify({ identifier: "eyad", password: "eyad" });
  const loginRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginBody)
    }
  }, loginBody);

  assert.strictEqual(loginRes.res.statusCode, 201, "Login failed: " + loginRes.data);
  const setCookie = loginRes.res.headers["set-cookie"];
  const cookie = setCookie ? setCookie.map(c => c.split(";")[0]).join("; ") : "";
  assert.ok(cookie.includes("prij_clinic_session"), "Missing session cookie");

  console.log("2. Fire two identical requests concurrently with the same idempotency key");
  const idempotencyKey = "concurrent-key-" + Date.now() + "-" + generateRandomString(6);
  const patientBody = JSON.stringify({
    medicalRecordNumber: "CONC-" + generateRandomString(6),
    firstName: "IdemTestConc",
    lastName: "PatientConc",
    phone: "010" + generateRandomString(8)
  });

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/patients",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(patientBody),
      "Cookie": cookie,
      "Idempotency-Key": idempotencyKey
    }
  };

  const req1 = request(options, patientBody);
  const req2 = request(options, patientBody);

  const [res1, res2] = await Promise.all([req1, req2]);

  const status1 = res1.res.statusCode;
  const status2 = res2.res.statusCode;

  console.log(`-> Received status codes: ${status1} and ${status2}`);

  // One request must succeed (201). The other might be 409 (in progress) or 201 (successful replay if serialized)
  const hasSuccess = status1 === 201 || status2 === 201;
  const secondStatus = status1 === 201 ? status2 : status1;
  const isConcurrencyPrevented = secondStatus === 409 || secondStatus === 201;

  assert.ok(hasSuccess, "At least one request should have succeeded with 201 Created");
  assert.ok(isConcurrencyPrevented, "The concurrent request should have been rejected with 409 or replayed with 201");

  const successRes = status1 === 201 ? res1 : res2;
  const successData = JSON.parse(successRes.data);
  assert.ok(successData.id, "Missing patient ID in success response");

  if (secondStatus === 409) {
    const conflictRes = status1 === 409 ? res1 : res2;
    const conflictData = JSON.parse(conflictRes.data);
    assert.strictEqual(conflictData.error.code, "IDEMPOTENCY_REQUEST_IN_PROGRESS", "Conflict error code mismatch");
  } else {
    const replayRes = status1 === 201 && status2 === 201 ? res2 : res1;
    const replayData = JSON.parse(replayRes.data);
    assert.strictEqual(replayData.id, successData.id, "Replay did not return the identical patient ID");
  }

  console.log("-> Concurrency correctly prevented duplicate processing!");
  console.log("Idempotency concurrency test passed!");
}

testConcurrency().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
