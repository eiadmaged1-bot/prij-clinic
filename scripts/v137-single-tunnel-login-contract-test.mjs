import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("apps/web/app/api/backend/[...path]/route.ts", "utf8");
const session = readFileSync("apps/web/app/session.tsx", "utf8");
const apiBase = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const nextConfig = readFileSync("apps/web/next.config.ts", "utf8");

for (const authPath of ["/auth/login", "/auth/me", "/auth/logout"]) {
  assert(session.includes(`\`${"${sameOriginApiProxyPath}"}${authPath}\``), `browser auth call must use /api/backend${authPath}`);
}

assert(!/localhost:3001\/auth\/(login|me|logout)/.test(session), "browser auth calls must not use localhost:3001");
assert(!/:3001\/auth\/(login|me|logout)/.test(session), "browser auth calls must not use host:3001");
assert(!/getApiBaseUrl\(\)\/auth\/(login|me|logout)/.test(session), "browser auth calls must not use configurable direct API origin");

assert(apiBase.includes('sameOriginApiProxyPath = "/api/backend"'), "browser API base must expose same-origin proxy");
assert(apiBase.includes("return sameOriginApiProxyPath"), "normal browser API base must default to one-tunnel same-origin path");
assert(apiBase.includes("isPrivateIpv4") && apiBase.includes("isTailscaleOrCgnatIpv4") && apiBase.includes("isTailscaleMagicDnsHost"), "LAN and Tailscale host helpers must remain covered");

assert(route.includes('process.env.PRIJ_API_INTERNAL_ORIGIN || "http://localhost:3001"'), "proxy target must be fixed to internal API origin");
assert(route.includes('normalized !== "origin"'), "proxy must not forward public browser Origin to internal API");
assert(
  route.includes("readBodyWithLimit(request, limit)") && route.includes("init.body = Buffer.from(bodyBuffer)"),
  "proxy must forward the bounded request body"
);
assert(route.includes("url.search = request.nextUrl.search"), "proxy must forward query string");
assert(route.includes("appendSetCookieHeaders(upstream, responseHeaders)"), "proxy must preserve API set-cookie responses");
assert(!route.includes("searchParams.get(\"target\")") && !route.includes("target="), "proxy must not accept arbitrary upstream targets");

assert(!nextConfig.includes('source: "/api/backend/:path*"'), "Next rewrite must not bypass the route-handler proxy");
assert(!nextConfig.includes("destination:"), "Next config must not expose a rewrite to direct API origin");

console.log("V137 single tunnel login contract PASS");
