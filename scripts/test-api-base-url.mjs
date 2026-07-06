import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";
import ts from "typescript";

const source = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function loadApiBaseUrl(env = {}, location) {
  const module = { exports: {} };
  const context = createContext({
    module,
    exports: module.exports,
    process: { env: { ...env } },
    URL,
    Number,
    console,
    window: location ? { location } : undefined
  });
  new Script(compiled).runInContext(context);
  return module.exports;
}

{
  const { getApiBaseUrl, sameOriginApiProxyPath } = loadApiBaseUrl(
    { NODE_ENV: "development" },
    { hostname: "localhost", protocol: "http:" }
  );
  assert.equal(sameOriginApiProxyPath, "/api/backend", "same-origin proxy path is exported");
  assert.equal(getApiBaseUrl(), "/api/backend", "localhost browser defaults to same-origin proxy");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development" },
    { hostname: "192.168.1.50", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "/api/backend", "private LAN browser defaults to same-origin proxy");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development" },
    { hostname: "100.127.4.46", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "/api/backend", "Tailscale browser defaults to same-origin proxy");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "production", NEXT_PUBLIC_APP_ENV: "production" },
    { hostname: "clinic-public.ngrok-free.app", protocol: "https:" }
  );
  assert.equal(getApiBaseUrl(), "/api/backend", "public/tunnel browser defaults to same-origin proxy");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development", NEXT_PUBLIC_LAN_API_ORIGIN: "http://192.168.1.50:3001" },
    { hostname: "192.168.1.20", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "http://192.168.1.50:3001", "explicit LAN API origin still wins");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development", NEXT_PUBLIC_LAN_API_ORIGIN: "http://100.127.4.46:3001" },
    { hostname: "100.127.4.46", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "http://100.127.4.46:3001", "explicit Tailscale API origin still wins");
}

{
  const { getApiBaseUrl, resolveConfiguredLanApiOrigin, isTailscaleOrCgnatIpv4 } = loadApiBaseUrl({
    NODE_ENV: "development",
    APP_ENV: "local",
    NEXT_PUBLIC_LAN_DEV_HOST: "100.127.4.46",
    NEXT_PUBLIC_LAN_DEV_API_PORT: "3001"
  });
  assert.equal(isTailscaleOrCgnatIpv4("100.127.4.46"), true, "Tailscale/CGNAT host is recognized");
  assert.equal(resolveConfiguredLanApiOrigin(), "http://100.127.4.46:3001", "configured Tailscale host resolves");
  assert.equal(getApiBaseUrl(), "http://100.127.4.46:3001", "configured Tailscale host is still an explicit override");
}

{
  const { resolveConfiguredLanApiOrigin, isSafeDevApiOrigin } = loadApiBaseUrl({
    NODE_ENV: "development",
    NEXT_PUBLIC_LAN_API_ORIGIN: "http://prij-clinic.local:3001"
  });
  assert.equal(resolveConfiguredLanApiOrigin(), "http://prij-clinic.local:3001", ".local explicit origin is accepted");
  assert.equal(isSafeDevApiOrigin("http://prij-clinic.local:3001"), true, ".local is a safe dev API origin");
}

{
  const { getApiBaseUrl, resolveConfiguredLanApiOrigin } = loadApiBaseUrl(
    {
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_ENV: "production",
      NEXT_PUBLIC_LAN_API_ORIGIN: "http://100.127.4.46:3001",
      NEXT_PUBLIC_LAN_DEV_HOST: "100.127.4.46"
    },
    { hostname: "100.127.4.46", protocol: "https:" }
  );
  assert.equal(resolveConfiguredLanApiOrigin(), undefined, "production ignores explicit HTTP LAN API origin");
  assert.equal(getApiBaseUrl(), "/api/backend", "production falls back to same-origin proxy instead of throwing");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "production", NEXT_PUBLIC_APP_ENV: "production", NEXT_PUBLIC_API_URL: "https://api.clinic.example" },
    { hostname: "clinic.example", protocol: "https:" }
  );
  assert.equal(getApiBaseUrl(), "https://api.clinic.example", "production exact HTTPS API origin is accepted");
}

{
  const { isSafeDevApiOrigin, resolveConfiguredLanApiOrigin } = loadApiBaseUrl({
    NODE_ENV: "development",
    NEXT_PUBLIC_LAN_API_ORIGIN: "http://*.example.test:3001"
  });
  assert.equal(isSafeDevApiOrigin("http://*.example.test:3001"), false, "wildcard origin is rejected");
  assert.equal(isSafeDevApiOrigin("not a url"), false, "malformed origin is rejected");
  assert.equal(isSafeDevApiOrigin("http://100.64.0.0/10"), false, "CIDR-like origin is rejected");
  assert.equal(resolveConfiguredLanApiOrigin(), undefined, "malformed configured LAN origin is ignored");
}

assert(!source.includes("LAN API fallback is disabled"), "normal API base resolver must not throw LAN fallback errors");
assert(!source.includes("Cannot reach Prij API from this device"), "normal UI connection copy must not be technical");

console.log("PASS api-base-url same-origin proxy tests");
