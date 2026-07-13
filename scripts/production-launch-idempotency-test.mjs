import * as http from "http";
import * as assert from "assert";

console.log("Running production-launch-idempotency-test.mjs...");

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

async function testIdempotency() {
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

  assert.strictEqual(loginRes.res.statusCode, 201, "Login failed");
  const setCookie = loginRes.res.headers["set-cookie"];
  const cookie = setCookie ? setCookie.map(c => c.split(";")[0]).join("; ") : "";
  assert.ok(cookie.includes("prij_clinic_session"), "Missing session cookie");

  console.log("2. Create a patient with an idempotency key");
  const idempotencyKey = "test-key-" + Date.now() + "-" + generateRandomString(6);
  const patientBody = JSON.stringify({
    medicalRecordNumber: "IDEM-" + generateRandomString(6),
    firstName: "IdemTest",
    lastName: "Patient",
    phone: "010" + generateRandomString(8)
  });

  const createRes1 = await request({
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
  }, patientBody);

  assert.strictEqual(createRes1.res.statusCode, 201, "Patient creation failed: " + createRes1.data);
  const patientData1 = JSON.parse(createRes1.data);
  const patientId1 = patientData1.id;
  assert.ok(patientId1, "Missing patient ID in first response");
  console.log("-> First request succeeded with Patient ID:", patientId1);

  console.log("3. Replay the exact same request with the exact same idempotency key");
  const createRes2 = await request({
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
  }, patientBody);

  assert.strictEqual(createRes2.res.statusCode, 201, "Patient replay failed: " + createRes2.data);
  const patientData2 = JSON.parse(createRes2.data);
  const patientId2 = patientData2.id;
  assert.strictEqual(patientId2, patientId1, "Replayed request returned a different patient ID");
  console.log("-> Replay request succeeded and returned the exact same Patient ID:", patientId2);

  console.log("4. Attempt the same request with a different payload but the SAME idempotency key");
  const differentBody = JSON.stringify({
    medicalRecordNumber: "IDEM-" + generateRandomString(6),
    firstName: "IdemTestDiff",
    lastName: "PatientDiff",
    phone: "010" + generateRandomString(8)
  });

  const createRes3 = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/patients",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(differentBody),
      "Cookie": cookie,
      "Idempotency-Key": idempotencyKey
    }
  }, differentBody);

  assert.strictEqual(createRes3.res.statusCode, 409, "Mismatched payload should return 409 Conflict: " + createRes3.res.statusCode + " " + createRes3.data);
  console.log("-> Mismatched payload correctly rejected with 409 Conflict.");

  console.log("Idempotency replay test passed!");
}

testIdempotency().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
