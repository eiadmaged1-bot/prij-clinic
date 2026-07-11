import * as http from "http";
import * as assert from "assert";

console.log("Running production-launch-session-revocation-test.mjs...");

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

async function testSessionRevocation() {
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

  assert.equal(loginRes.res.statusCode, 201, "Login should succeed");
  const sessionCookie = loginRes.res.headers["set-cookie"].find(c => c.startsWith("prij_clinic_session="));
  const cookieVal = sessionCookie.split(";")[0].split("=")[1];

  console.log("2. Use the session cookie to verify it works");
  const meRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/auth/me",
    method: "GET",
    headers: {
      "Cookie": `prij_clinic_session=${cookieVal}`
    }
  });
  assert.equal(meRes.res.statusCode, 200, "Session should be valid initially");

  console.log("3. Logout to revoke the session");
  const logoutRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/auth/logout",
    method: "POST",
    headers: {
      "Cookie": `prij_clinic_session=${cookieVal}`
    }
  });
  assert.equal(logoutRes.res.statusCode, 201, "Logout should succeed");

  console.log("4. Verify the session is revoked from the server side (not just deleted cookie)");
  const revokedMeRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/auth/me",
    method: "GET",
    headers: {
      // Intentionally using the original cookie value (simulating a captured cookie)
      "Cookie": `prij_clinic_session=${cookieVal}`
    }
  });

  assert.equal(revokedMeRes.res.statusCode, 401, "The revoked session must be rejected by the server");

  console.log("Session revocation is fully functional!");
}

testSessionRevocation().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
