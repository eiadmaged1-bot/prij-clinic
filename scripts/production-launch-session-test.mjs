import { execSync } from "child_process";
import * as http from "http";
import * as assert from "assert";

console.log("Running production-launch-session-test.mjs...");

// Helper for making requests
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

async function testSessions() {
  console.log("1. Check Session Cookie is Set on Login");
  const loginBody = JSON.stringify({ identifier: "eyad", password: "password" });
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
  const setCookieHeader = loginRes.res.headers["set-cookie"];
  assert.ok(setCookieHeader, "set-cookie header should be present");
  const sessionCookie = setCookieHeader.find(c => c.startsWith("prij_clinic_session="));
  assert.ok(sessionCookie, "prij_clinic_session cookie should be set");
  assert.ok(sessionCookie.includes("HttpOnly"), "Cookie should be HttpOnly");

  const loginData = JSON.parse(loginRes.data);
  assert.ok(loginData.user, "Should return user");
  assert.equal(loginData.token, undefined, "Raw token should NOT be returned in JSON payload");
  
  // Extract token value
  const cookieVal = sessionCookie.split(";")[0].split("=")[1];

  console.log("2. Use Session Cookie for Auth (Me)");
  const meRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/auth/me",
    method: "GET",
    headers: {
      "Cookie": `prij_clinic_session=${cookieVal}`
    }
  });

  assert.equal(meRes.res.statusCode, 200, "/me should succeed with session cookie");
  const meData = JSON.parse(meRes.data);
  assert.ok(meData.user, "User should be returned");

  console.log("3. Test Logout clears Cookie");
  const logoutRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/auth/logout",
    method: "POST",
    headers: {
      "Cookie": `prij_clinic_session=${cookieVal}`
    }
  });

  assert.equal(logoutRes.res.statusCode, 201, "/logout should succeed");
  const clearCookieHeader = logoutRes.res.headers["set-cookie"];
  assert.ok(clearCookieHeader, "set-cookie header should be present on logout");
  const clearSessionCookie = clearCookieHeader.find(c => c.startsWith("prij_clinic_session="));
  assert.ok(clearSessionCookie, "prij_clinic_session cookie should be modified");
  assert.ok(clearSessionCookie.includes("Max-Age=0") || clearSessionCookie.includes("Expires="), "Cookie should be expired");

  console.log("4. Attempt to Use Revoked Session Cookie");
  const meRevokedRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/backend/auth/me",
    method: "GET",
    headers: {
      "Cookie": `prij_clinic_session=${cookieVal}`
    }
  });

  assert.equal(meRevokedRes.res.statusCode, 401, "Revoked session should return 401");

  console.log("Production Session flow is functional!");
}

testSessions().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
