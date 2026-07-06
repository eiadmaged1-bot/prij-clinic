import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfig = readFileSync("apps/web/next.config.ts", "utf8");
const apiBase = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const session = readFileSync("apps/web/app/session.tsx", "utf8");

assert(nextConfig.includes('source: "/api/backend/:path*"'), "Next rewrite must expose fixed same-origin proxy prefix");
assert(nextConfig.includes("PRIJ_API_INTERNAL_ORIGIN") && nextConfig.includes("http://localhost:3001"), "proxy must default to internal local API origin and allow server-side override");
assert(nextConfig.includes("destination: `${normalizeInternalApiOrigin()}/:path*`"), "proxy must forward only to configured internal API origin");
assert(!nextConfig.includes("request.nextUrl.searchParams") && !nextConfig.includes("target="), "proxy must not accept a browser-supplied target");
assert(nextConfig.includes("url.username") && nextConfig.includes("url.password"), "proxy origin validation must reject embedded credentials");
assert(nextConfig.includes("url.pathname !== \"/\"") && nextConfig.includes("url.search") && nextConfig.includes("url.hash"), "proxy origin validation must reject non-origin URLs");

assert(apiBase.includes('sameOriginApiProxyPath = "/api/backend"'), "browser API base must know same-origin proxy path");
assert(apiBase.includes("return sameOriginApiProxyPath"), "browser API base must default to the same-origin proxy path");
assert(!apiBase.includes("LAN API fallback is disabled"), "normal API base resolver must not throw LAN fallback errors");
assert(!apiBase.includes("return `http://${hostname}:${defaultLanApiPort}`"), "normal browser path must not derive direct port 3001 URLs");
assert(session.includes("getApiBaseUrl()}/auth/login"), "session login must continue using centralized API base");

console.log("V134 single-origin API proxy PASS");
