import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";
import ts from "typescript";

const source = readFileSync("apps/api/src/config/cors-origins.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function loadCors(env = {}) {
  const module = { exports: {} };
  const context = createContext({
    module,
    exports: module.exports,
    process: { env: { ...env } },
    URL,
    Number,
    Set,
    console: { log() {}, warn() {} }
  });
  new Script(compiled).runInContext(context);
  return module.exports;
}

function withConfig(env) {
  const cors = loadCors(env);
  return { cors, config: cors.createCorsOriginConfig() };
}

function assertConfigThrows(env, messagePart) {
  const { createCorsOriginConfig } = loadCors(env);
  assert.throws(
    () => createCorsOriginConfig(),
    (error) => error?.message?.includes(messagePart)
  );
}

{
  const { cors, config } = withConfig({ APP_ENV: "local", CORS_ORIGINS: "http://localhost:3000" });
  assert.equal(cors.isCorsOriginAllowed("http://localhost:3000", config), true, "exact localhost allowed");
}

{
  const { cors, config } = withConfig({ APP_ENV: "local", CORS_ORIGINS: "http://192.168.1.50:3000" });
  assert.equal(cors.isCorsOriginAllowed("http://192.168.1.50:3000", config), true, "exact private LAN origin allowed");
}

{
  const { cors, config } = withConfig({ APP_ENV: "local", CORS_ORIGINS: "http://prij-clinic.local:3000" });
  assert.equal(cors.isCorsOriginAllowed("http://prij-clinic.local:3000", config), true, ".local exact origin allowed");
}

for (const cidr of ["192.168.1.0/24", "10.0.0.0/8", "172.16.0.0/12"]) {
  const { cors, config } = withConfig({
    APP_ENV: "local",
    CORS_PRIVATE_CIDRS: cidr,
    CORS_PRIVATE_PORTS: "3000"
  });
  const origin = cidr.startsWith("10.")
    ? "http://10.22.33.44:3000"
    : cidr.startsWith("172.")
      ? "http://172.16.5.10:3000"
      : "http://192.168.1.55:3000";
  assert.equal(cors.isCorsOriginAllowed(origin, config), true, `${cidr} allowed in local`);
}

for (const cidr of ["8.8.8.0/24", "1.1.1.0/24", "0.0.0.0/0"]) {
  assertConfigThrows({ APP_ENV: "local", CORS_PRIVATE_CIDRS: cidr }, "CORS private CIDR");
}

assertConfigThrows({ APP_ENV: "local", CORS_ORIGINS: "*" }, "Invalid CORS origin");
assertConfigThrows({ APP_ENV: "production", CORS_PRIVATE_CIDRS: "192.168.1.0/24" }, "forbidden");
assertConfigThrows({ APP_ENV: "staging", CORS_PRIVATE_CIDRS: "10.0.0.0/8" }, "forbidden");

{
  const { cors, config } = withConfig({ APP_ENV: "production", CORS_ORIGINS: "https://clinic.example.test" });
  assert.equal(cors.isCorsOriginAllowed("https://clinic.example.test", config), true, "production exact origin allowed");
  assert.equal(cors.isCorsOriginAllowed("https://evil.example.test", config), false, "unexpected public origin denied");
  assert.equal(cors.isCorsOriginAllowed("http://192.168.1.55:3000", config), false, "production dynamic LAN denied");
}

{
  const { cors, config } = withConfig({ APP_ENV: "local", CORS_ORIGINS: "http://localhost:3000" });
  assert.equal(cors.isCorsOriginAllowed(undefined, config), true, "omitted Origin handled safely");
}

console.log("PASS backend CORS origin hardening tests");
