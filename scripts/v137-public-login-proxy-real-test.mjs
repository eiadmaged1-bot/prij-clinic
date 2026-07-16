import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const webOrigin = (process.env.PRJ_WEB_ORIGIN || process.env.PRIJ_WEB_ORIGIN || "http://localhost:3000").replace(/\/+$/, "");
const ownerIdentifier = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_OWNER_LOGIN || "eyad";
const ownerPassword = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_OWNER_PASSWORD || "eyad";

async function request(path, init = {}) {
  const response = await fetch(`${webOrigin}${path}`, {
    redirect: "manual",
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers
    }
  });
  const text = await response.text();
  let body = null;
  if (text) {
    body = JSON.parse(text);
  }
  return { response, body, text };
}

async function main() {
  const health = await request("/api/backend/health");
  assert.equal(health.response.status, 200, "web proxy health must return 200");
  assert(["ok", "up"].includes(health.body?.status), "web proxy health body must report healthy");

  const me = await request("/api/backend/auth/me");
  assert.equal(me.response.status, 401, "unauthenticated auth/me through web proxy must stay 401");

  const login = await request("/api/backend/auth/login", {
    method: "POST",
    headers: { origin: "https://regretful-unwomanly-silliness.ngrok-free.dev" },
    body: JSON.stringify({ identifier: ownerIdentifier, password: ownerPassword })
  });
  assert.equal(login.response.status, 201, "valid seeded owner login through web proxy must succeed");
  assert(login.body?.csrfToken && login.body?.user?.loginId === "eyad", "valid proxy login must return the cookie-session payload");
  assert.match(login.response.headers.get("set-cookie") ?? "", /HttpOnly/i, "valid proxy login must set an HttpOnly session cookie");

  const invalid = await request("/api/backend/auth/login", {
    method: "POST",
    headers: { origin: "https://regretful-unwomanly-silliness.ngrok-free.dev" },
    body: JSON.stringify({ identifier: ownerIdentifier, password: "wrong-v137-public-login" })
  });
  assert.equal(invalid.response.status, 401, "invalid login through web proxy must stay 401, not 500");

  const session = readFileSync("apps/web/app/session.tsx", "utf8");
  assert(session.includes('const authLoginPath = `${sameOriginApiProxyPath}/auth/login`'), "browser login must use same-origin proxy path");
  assert(!/localhost:3001\/auth\/(login|me|logout)/.test(session), "browser auth must not require direct API port 3001");

  console.log("V137 public login proxy real PASS");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
