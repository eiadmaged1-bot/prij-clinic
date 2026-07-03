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

function assertThrowsMessage(fn, messagePart) {
  assert.throws(fn, (error) => error?.message?.includes(messagePart));
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development" },
    { hostname: "localhost", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "http://localhost:3001", "localhost browser falls back to local API");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development", NEXT_PUBLIC_LAN_API_ORIGIN: "http://192.168.1.50:3001" },
    { hostname: "192.168.1.20", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "http://192.168.1.50:3001", "explicit LAN API origin wins");
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
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development", NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK: "true" },
    { hostname: "192.168.1.50", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "http://192.168.1.50:3001", "private IPv4 fallback is accepted in dev");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development", NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK: "true" },
    { hostname: "8.8.8.8", protocol: "http:" }
  );
  assertThrowsMessage(getApiBaseUrl, "LAN API fallback is disabled");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "production", NEXT_PUBLIC_APP_ENV: "staging", NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK: "true" },
    { hostname: "192.168.1.50", protocol: "https:" }
  );
  assertThrowsMessage(getApiBaseUrl, "LAN API fallback is disabled");
}

{
  const { isSafeDevApiOrigin, resolveConfiguredLanApiOrigin } = loadApiBaseUrl({
    NODE_ENV: "development",
    NEXT_PUBLIC_LAN_API_ORIGIN: "http://*.example.test:3001"
  });
  assert.equal(isSafeDevApiOrigin("http://*.example.test:3001"), false, "wildcard origin is rejected");
  assert.equal(isSafeDevApiOrigin("not a url"), false, "malformed origin is rejected");
  assert.equal(resolveConfiguredLanApiOrigin(), undefined, "malformed configured LAN origin is ignored");
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development", NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK: "false" },
    { hostname: "192.168.1.50", protocol: "http:" }
  );
  assertThrowsMessage(getApiBaseUrl, "LAN API fallback is disabled");
}

console.log("PASS api-base-url LAN resolution hardening tests");
