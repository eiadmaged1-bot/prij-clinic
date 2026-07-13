import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("apps/web/app/api/backend/[...path]/route.ts", "utf8");
const session = readFileSync("apps/web/app/session.tsx", "utf8");
const apiBase = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const nextConfig = readFileSync("apps/web/next.config.ts", "utf8");

assert(route.includes('process.env.PRIJ_API_INTERNAL_ORIGIN || "http://localhost:3001"'), "proxy must default server-side internal API origin to localhost:3001");
assert(route.includes("readBodyWithLimit(request, limit)"), "proxy must forward request bodies within route budgets");
assert(route.includes("forwardedRequestHeaders(request, requestId)"), "proxy must forward request headers with a generated request ID");
assert(route.includes("forwardedResponseHeaders(upstream)"), "proxy must forward response headers");
assert(route.includes("export const POST = proxy"), "proxy must forward POST login");
assert(route.includes("export const GET = proxy"), "proxy must forward GET session/health");
assert(route.includes("export const OPTIONS = proxy"), "proxy must support OPTIONS");
assert(!route.includes("target=") && !route.includes("searchParams.get(\"target\")"), "proxy must not accept a browser-supplied target");

for (const authPath of ["/auth/login", "/auth/me", "/auth/logout"]) {
  assert(session.includes(`\`${"${sameOriginApiProxyPath}"}${authPath}\``), `session ${authPath} must use same-origin proxy`);
}

assert(!/getApiBaseUrl\(\)\/auth\/(login|me|logout)/.test(session), "login/session browser calls must not use configurable API origins");
assert(!/localhost:3001\/auth\/(login|me|logout)/.test(session), "login/session browser calls must not target localhost:3001");
assert(!/:3001\/auth\/(login|me|logout)/.test(session), "login/session browser calls must not target host:3001");
assert(apiBase.includes('sameOriginApiProxyPath = "/api/backend"'), "same-origin proxy path constant must remain available");
assert(!nextConfig.includes('source: "/api/backend/:path*"'), "Next rewrite must not bypass route-handler auth proxy");
assert(route.includes('normalized !== "origin"'), "route-handler proxy must strip public browser Origin before internal API auth");

console.log("V135 public login proxy PASS");
